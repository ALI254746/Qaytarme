import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ariza } from '../../schemas/ariza.schema';
import { SourceReliability } from '../../schemas/source-reliability.schema';
import {
  describeTier,
  reliabilityWeight,
  scoreSource,
} from '../../utils/source-reliability.util';
import type {
  ReliabilityResult,
  SourceStats,
} from '../../utils/source-reliability.util';

/** Ratings older than this are recomputed on demand. */
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

@Injectable()
export class SourceReliabilityService {
  private readonly logger = new Logger(SourceReliabilityService.name);

  constructor(
    @InjectModel('Ariza') private readonly arizaModel: Model<Ariza>,
    @InjectModel('SourceReliability')
    private readonly reliabilityModel: Model<SourceReliability>,
  ) {}

  /**
   * Aggregates the raw counters per source.
   * Everything is derived from the announcements, so the rating is always
   * reproducible and an aggregation bug can be fixed by rerunning it.
   */
  private async collectStats(): Promise<
    Array<SourceStats & { sourceType: string }>
  > {
    const rows = await this.arizaModel.aggregate([
      {
        $group: {
          _id: {
            $ifNull: [
              '$provenance.channelUsername',
              { $ifNull: ['$provenance.sourceType', 'unknown'] },
            ],
          },
          sourceType: { $first: { $ifNull: ['$provenance.sourceType', 'unknown'] } },
          total: { $sum: 1 },
          duplicates: {
            $sum: { $cond: [{ $eq: ['$cluster.isPrimary', false] }, 1, 0] },
          },
          rejected: {
            $sum: { $cond: [{ $eq: ['$moderationStatus', 'rejected'] }, 1, 0] },
          },
          returned: {
            $sum: { $cond: [{ $eq: ['$moderationStatus', 'returned'] }, 1, 0] },
          },
          matched: {
            $sum: { $cond: [{ $ifNull: ['$matchedUser', false] }, 1, 0] },
          },
          withImage: {
            $sum: { $cond: [{ $ifNull: ['$image.url', false] }, 1, 0] },
          },
          withLocation: {
            $sum: { $cond: [{ $ifNull: ['$geo', false] }, 1, 0] },
          },
          withDate: {
            $sum: { $cond: [{ $ifNull: ['$occurredAt', false] }, 1, 0] },
          },
          withContact: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $ifNull: ['$phone', false] },
                    { $ifNull: ['$telegram', false] },
                    { $ifNull: ['$email', false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          lastSeenAt: {
            $max: { $ifNull: ['$provenance.collectedAt', '$createdAt'] },
          },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 500 },
    ]);

    return rows.map((row: any) => ({
      sourceKey: String(row._id ?? 'unknown'),
      sourceType: row.sourceType ?? 'unknown',
      total: row.total ?? 0,
      duplicates: row.duplicates ?? 0,
      rejected: row.rejected ?? 0,
      returned: row.returned ?? 0,
      matched: row.matched ?? 0,
      withImage: row.withImage ?? 0,
      withLocation: row.withLocation ?? 0,
      withDate: row.withDate ?? 0,
      withContact: row.withContact ?? 0,
      lastSeenAt: row.lastSeenAt ?? null,
    }));
  }

  /** Recomputes and stores the rating of every known source. */
  async recomputeAll(): Promise<ReliabilityResult[]> {
    const stats = await this.collectStats();
    const results: ReliabilityResult[] = [];

    for (const entry of stats) {
      const result = scoreSource(entry);
      results.push(result);

      await this.reliabilityModel.updateOne(
        { sourceKey: entry.sourceKey },
        {
          $set: {
            sourceType: entry.sourceType,
            score: result.score,
            tier: result.tier,
            sampleSize: result.sampleSize,
            stats: {
              total: entry.total,
              duplicates: entry.duplicates,
              rejected: entry.rejected,
              returned: entry.returned,
              matched: entry.matched,
              withImage: entry.withImage,
              withLocation: entry.withLocation,
              withDate: entry.withDate,
              withContact: entry.withContact,
            },
            factors: result.factors,
            strengths: result.strengths,
            warnings: result.warnings,
            lastSeenAt: entry.lastSeenAt ?? null,
            computedAt: new Date(),
          },
        },
        { upsert: true },
      );
    }

    this.logger.log(`Recomputed reliability for ${results.length} sources`);
    return results.sort((left, right) => right.score - left.score);
  }

  /** Ranked list for the admin panel, recomputed when the cache is stale. */
  async list() {
    const newest = await this.reliabilityModel
      .findOne()
      .sort({ computedAt: -1 })
      .lean()
      .exec();

    const isStale =
      !newest?.computedAt ||
      Date.now() - new Date(newest.computedAt).getTime() > CACHE_TTL_MS;

    if (isStale) await this.recomputeAll();

    const sources = await this.reliabilityModel
      .find()
      .sort({ score: -1, sampleSize: -1 })
      .lean()
      .exec();

    return sources.map((source: any) => ({
      sourceKey: source.sourceKey,
      sourceType: source.sourceType,
      score: source.manualScore ?? source.score,
      manualScore: source.manualScore ?? null,
      tier: source.tier,
      tierLabel: describeTier(source.tier),
      sampleSize: source.sampleSize,
      stats: source.stats,
      factors: source.factors,
      strengths: source.strengths,
      warnings: source.warnings,
      blocked: source.blocked,
      lastSeenAt: source.lastSeenAt,
      computedAt: source.computedAt,
    }));
  }

  /**
   * Multiplier used by matching and by the confidence shown in the UI.
   * An unknown source is neutral, never zero: a new channel must be able to
   * prove itself.
   */
  async weightFor(sourceKey?: string | null): Promise<number> {
    if (!sourceKey) return 0.8;

    const source: any = await this.reliabilityModel
      .findOne({ sourceKey })
      .lean()
      .exec();

    if (!source) return 0.8;
    if (source.blocked) return 0.6;

    return reliabilityWeight({
      sourceKey,
      score: source.manualScore ?? source.score ?? 0,
      tier: source.tier,
      sampleSize: source.sampleSize ?? 0,
      factors: [],
      strengths: [],
      warnings: [],
    });
  }

  /** Sources an editor has switched off; ingestion must skip them. */
  async blockedSourceKeys(): Promise<string[]> {
    const blocked = await this.reliabilityModel
      .find({ blocked: true })
      .select('sourceKey')
      .lean()
      .exec();

    return blocked.map((source: any) => source.sourceKey);
  }

  /** Editorial override, kept separate from the computed score. */
  async setManualRating(
    sourceKey: string,
    update: { manualScore?: number | null; blocked?: boolean; note?: string },
  ) {
    return this.reliabilityModel
      .findOneAndUpdate(
        { sourceKey },
        {
          $set: {
            ...(update.manualScore !== undefined
              ? { manualScore: update.manualScore }
              : {}),
            ...(update.blocked !== undefined ? { blocked: update.blocked } : {}),
            ...(update.note !== undefined ? { manualNote: update.note } : {}),
          },
        },
        { new: true, upsert: true },
      )
      .lean()
      .exec();
  }
}
