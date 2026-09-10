import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  SetMetadata,
  applyDecorators,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export type RateLimitOptions = {
  /** Allowed requests inside the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
};

export const RATE_LIMIT_KEY = 'qaytarme:rate-limit';

export const DEFAULT_RATE_LIMIT: RateLimitOptions = {
  limit: 60,
  windowMs: 60_000,
};

/** Declares the rate limit of a route or controller. */
export function RateLimit(options: RateLimitOptions) {
  return applyDecorators(SetMetadata(RATE_LIMIT_KEY, options));
}

type Bucket = {
  hits: number[];
};

/**
 * Sliding window rate limiter.
 *
 * Counters live in the process memory, which is enough for a single backend
 * instance and keeps the deployment dependency free. When the backend is
 * scaled horizontally this should move to Redis.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, Bucket>();
  private lastSweep = Date.now();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options =
      this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? DEFAULT_RATE_LIMIT;

    const request = context.switchToHttp().getRequest();
    if (!request) return true;

    const now = Date.now();
    this.sweep(now, options.windowMs);

    const key = this.buildKey(context, request);
    const bucket = this.buckets.get(key) ?? { hits: [] };
    bucket.hits = bucket.hits.filter((hit) => now - hit < options.windowMs);

    if (bucket.hits.length >= options.limit) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((options.windowMs - (now - bucket.hits[0])) / 1000),
      );
      this.buckets.set(key, bucket);

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'So\u2018rovlar soni chegaradan oshdi. Birozdan keyin qayta urinib ko\u2018ring.',
          retryAfter: retryAfterSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    bucket.hits.push(now);
    this.buckets.set(key, bucket);
    return true;
  }

  private buildKey(context: ExecutionContext, request: any): string {
    const route = `${context.getClass().name}.${context.getHandler().name}`;
    const userId = request.user?.id ?? request.user?.userId;
    const identity = userId ? `user:${userId}` : `ip:${this.resolveIp(request)}`;
    return `${route}|${identity}`;
  }

  private resolveIp(request: any): string {
    const forwarded = request.headers?.['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0].trim();
    }
    return request.ip ?? request.socket?.remoteAddress ?? 'unknown';
  }

  /** Drops idle buckets so the map cannot grow without bound. */
  private sweep(now: number, windowMs: number): void {
    if (now - this.lastSweep < windowMs) return;
    this.lastSweep = now;

    for (const [key, bucket] of this.buckets) {
      const active = bucket.hits.filter((hit) => now - hit < windowMs);
      if (active.length === 0) {
        this.buckets.delete(key);
      } else {
        bucket.hits = active;
      }
    }
  }
}
