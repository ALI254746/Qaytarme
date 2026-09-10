import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RateLimit, RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { SourceReliabilityService } from './source-reliability.service';

/**
 * Reliability data says which channels are noisy or unreliable. That is
 * internal editorial information, so it is not public.
 */
@Controller('intelligence/sources')
@UseGuards(RateLimitGuard, JwtAuthGuard)
export class SourceReliabilityController {
  constructor(private readonly reliabilityService: SourceReliabilityService) {}

  private assertAdmin(request: any) {
    const user = request?.user;
    const isAdmin = user?.isAdmin === true || user?.role === 'admin';
    if (!isAdmin) {
      throw new ForbiddenException('Bu bo\u2018lim faqat administrator uchun');
    }
  }

  @Get()
  @RateLimit({ limit: 30, windowMs: 60_000 })
  async list(@Req() request: any) {
    this.assertAdmin(request);
    return this.reliabilityService.list();
  }

  /** Manual recomputation, useful right after a large import. */
  @Post('recompute')
  @RateLimit({ limit: 5, windowMs: 60_000 })
  async recompute(@Req() request: any) {
    this.assertAdmin(request);
    const results = await this.reliabilityService.recomputeAll();
    return { updated: results.length, sources: results };
  }

  @Patch(':sourceKey')
  @RateLimit({ limit: 20, windowMs: 60_000 })
  async override(
    @Req() request: any,
    @Param('sourceKey') sourceKey: string,
    @Body() body: { manualScore?: number | null; blocked?: boolean; note?: string },
  ) {
    this.assertAdmin(request);
    return this.reliabilityService.setManualRating(sourceKey, {
      manualScore: body?.manualScore,
      blocked: body?.blocked,
      note: body?.note,
    });
  }
}
