
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

/** Exact hosts allowed to call the API with credentials. */
function buildAllowedOrigins(): Set<string> {
  const origins = [
    'http://localhost:3000',
    'https://qaytarme.uz',
    'https://www.qaytarme.uz',
    'https://qaytarme.vercel.app',
  ];

  const configured = process.env.CLIENT_URL?.trim();
  if (configured) origins.push(configured.replace(/\/$/, ''));

  const extra = process.env.EXTRA_ALLOWED_ORIGINS?.split(',') ?? [];
  for (const origin of extra) {
    const trimmed = origin.trim().replace(/\/$/, '');
    if (trimmed) origins.push(trimmed);
  }

  return new Set(origins);
}

/**
 * Preview deployments have dynamic hostnames, so they can only be enabled
 * explicitly. Enabling them in production would allow any Vercel or Railway
 * project to send credentialed requests.
 */
function isAllowedPreviewOrigin(origin: string): boolean {
  if (process.env.ALLOW_PREVIEW_ORIGINS !== 'true') return false;

  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== 'https:') return false;
    return (
      hostname.endsWith('.vercel.app') ||
      hostname.endsWith('.railway.app') ||
      hostname.endsWith('.up.railway.app')
    );
  } catch {
    return false;
  }
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Minimal security headers, kept dependency free.
  app.use((_request: any, response: any, next: () => void) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('X-DNS-Prefetch-Control', 'off');
    response.setHeader('Cross-Origin-Resource-Policy', 'same-site');
    response.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains',
    );
    response.removeHeader?.('X-Powered-By');
    next();
  });

  // Announcement payloads are small; a large limit only helps abuse.
  app.useBodyParser('json', { limit: '512kb' });
  app.useBodyParser('urlencoded', { limit: '512kb', extended: true });

  // Serve static files from the root public directory
  app.useStaticAssets(join(process.cwd(), '..', 'public'));

  app.setGlobalPrefix('api');

  const allowedOrigins = buildAllowedOrigins();

  app.enableCors({
    origin: (origin, callback) => {
      // Server-to-server calls and same-origin requests have no Origin header.
      if (!origin) return callback(null, true);

      const normalized = origin.replace(/\/$/, '');
      if (allowedOrigins.has(normalized) || isAllowedPreviewOrigin(normalized)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86_400,
  });

  await app.listen(process.env.PORT || 4000);
}
bootstrap();
