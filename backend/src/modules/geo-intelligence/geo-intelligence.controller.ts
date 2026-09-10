import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RateLimit, RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { GeoIntelligenceService } from './geo-intelligence.service';

/**
 * Aggregated geographic and temporal views over the announcement stream.
 * Results are grid-aggregated, never per person, so nothing here exposes an
 * individual's address or contact details.
 */
@Controller('intelligence')
@UseGuards(RateLimitGuard, JwtAuthGuard)
export class GeoIntelligenceController {
  constructor(private readonly geoIntelligence: GeoIntelligenceService) {}

  private parseDays(value?: string): number | undefined {
    if (!value) return undefined;
    const days = Number(value);
    return Number.isFinite(days) && days > 0 ? days : undefined;
  }

  /** Where items disappear most often. */
  @Get('hotspots')
  @RateLimit({ limit: 30, windowMs: 60_000 })
  async hotspots(
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('region') region?: string,
    @Query('days') days?: string,
  ) {
    return this.geoIntelligence.hotspots({
      category,
      status,
      region,
      days: this.parseDays(days),
    });
  }

  /** When items disappear: hour of day and weekday profile. */
  @Get('temporal')
  @RateLimit({ limit: 30, windowMs: 60_000 })
  async temporal(
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('region') region?: string,
    @Query('days') days?: string,
  ) {
    return this.geoIntelligence.temporal({
      category,
      status,
      region,
      days: this.parseDays(days),
    });
  }

  /** What is growing or shrinking compared with the previous window. */
  @Get('trends')
  @RateLimit({ limit: 30, windowMs: 60_000 })
  async trends(
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('region') region?: string,
    @Query('days') days?: string,
  ) {
    return this.geoIntelligence.trends({
      category,
      status,
      region,
      days: this.parseDays(days),
    });
  }
}
