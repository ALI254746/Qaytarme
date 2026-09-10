import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Ariza } from '../../schemas/ariza.schema';
import {
  clusterConfidence,
  DEDUPE_VERSION,
  evaluateDuplicate,
} from '../../utils/dedupe.util';
import type { DedupeCandidate, DedupeResult } from '../../utils/dedupe.util';

/** How far back we look for a repost. Older posts are a different incident. */
const LOOKBACK_HOURS = 24 * 14;
/** Hard cap on candidates, so ingestion cannot degrade into a full scan. */
const CANDIDATE_LIMIT = 60;

export type ClusterMember = {
  id: string;
  sourceType: string;
  sourceName?: string;
  sourceUrl?: string;
  channelUsername?: string;
  publishedAt?: Date | null;
  collectedAt?: Date | null;
  score: number;
  reasons: string[];
};

export type ClusterSummary = {
  clusterId: string | null;
  memberCount: number;
  sourceCount: number;
  confidence: number;
  firstSeenAt: Date | null;
  lastSeenAt: Date | null;
  timeline: ClusterMember[];
};

@Injectable()
export class DedupeService {
  private readonly logger = new Logger(DedupeService.name);

  constructor(@InjectModel('Ariza') private readonly arizaModel: Model<Ariza>) {}

  private toCandidate(document: any): DedupeCandidate {
    return {
      id: document._id?.toString(),
      status: document.status,
      category: document.category,
      text: [
        document.itemType,
        document.itemName,
        document.itemDescription,
        document.location,
      ]
        .filter(Boolean)
        .join(' '),
      contentHash: document.provenance?.contentHash ?? null,
      simhash: document.provenance?.simhash ?? null,
      imagePhash: document.image?.phash ?? null,
      channelUsername: document.provenance?.channelUsername ?? null,
      sourceUrl: document.provenance?.sourceUrl ?? null,
      messageIds: document.provenance?.messageIds ?? [],
      coordinates: document.coordinates ?? null,
      geo: document.geo ?? null,
      occurredAt: document.occurredAt ?? null,
      publishedAt: document.provenance?.publishedAt ?? null,
      createdAt: document.createdAt ?? null,
    };
  }

  /**
   * Narrow the search before scoring: same status and category, recent, and
   * matching at least one cheap indexed signal (exact hash, fingerprint,
   * photo hash or channel). Scoring every historical row would not scale.
   */
  private async findCandidates(document: any) {
    const since = new Date(Date.now() - LOOKBACK_HOURS * 3_600_000);
    const signalFilters: Record<string, unknown>[] = [];

    const contentHash = document.provenance?.contentHash;
    const fingerprint = document.provenance?.simhash;
    const phash = document.image?.phash;
    const channel = document.provenance?.channelUsername;

    if (contentHash) signalFilters.push({ 'provenance.contentHash': contentHash });
    if (fingerprint) signalFilters.push({ 'provenance.simhash': { $exists: true, $ne: null } });
    if (phash) signalFilters.push({ 'image.phash': { $exists: true, $ne: null } });
    if (channel) signalFilters.push({ 'provenance.channelUsername': channel });

    if (signalFilters.length === 0) return [];

    return this.arizaModel
      .find({
        _id: { $ne: document._id },
        status: document.status,
        category: document.category,
        createdAt: { $gte: since },
        $or: signalFilters,
      })
      .select(
        'status category itemType itemName itemDescription location coordinates geo occurredAt createdAt image.phash provenance cluster',
      )
      .sort({ createdAt: -1 })
      .limit(CANDIDATE_LIMIT)
      .lean()
      .exec();
  }

  /**
   * Assigns the new announcement to a cluster when a convincing repost is
   * found. Never deletes anything: the repost stays in the database as
   * evidence and is only hidden from listings.
   */
  async clusterAnnouncement(document: any): Promise<ClusterSummary | null> {
    try {
      const candidates = await this.findCandidates(document);
      if (candidates.length === 0) return null;

      const self = this.toCandidate(document);
      const duplicates: Array<{ candidate: any; result: DedupeResult }> = [];

      for (const candidate of candidates) {
        const result = evaluateDuplicate(self, this.toCandidate(candidate));
        if (result.verdict === 'duplicate') {
          duplicates.push({ candidate, result });
        }
      }

      if (duplicates.length === 0) return null;

      duplicates.sort((a, b) => b.result.score - a.result.score);

      // Reuse an existing clusterId when one of the duplicates already has
      // one, so three reposts end up in one cluster instead of three pairs.
      const existingClusterId = duplicates
        .map(({ candidate }) => candidate.cluster?.clusterId)
        .find((value) => Boolean(value));

      const clusterId: Types.ObjectId = existingClusterId
        ? new Types.ObjectId(String(existingClusterId))
        : (duplicates[0].candidate._id as Types.ObjectId);

      const primaryId = existingClusterId
        ? clusterId
        : (duplicates[0].candidate._id as Types.ObjectId);

      // The oldest announcement stays the representative one; a repost is
      // marked as a duplicate and hidden from listings.
      await this.arizaModel.updateOne(
        { _id: document._id },
        {
          $set: {
            'cluster.clusterId': clusterId,
            'cluster.isPrimary': false,
            'cluster.duplicateOf': primaryId,
            'cluster.dedupeVersion': DEDUPE_VERSION,
          },
        },
      );

      await this.arizaModel.updateMany(
        {
          _id: {
            $in: duplicates.map(({ candidate }) => candidate._id),
          },
        },
        { $set: { 'cluster.clusterId': clusterId } },
      );

      const summary = await this.refreshCluster(clusterId);

      this.logger.log(
        `Clustered ${document._id} into ${clusterId} (${summary?.memberCount ?? 0} members, ${
          summary?.sourceCount ?? 0
        } sources, confidence ${summary?.confidence ?? 0})`,
      );

      return summary;
    } catch (error: any) {
      // Clustering is an enrichment step: a failure must never block the
      // announcement from being published.
      this.logger.error(`Clustering failed: ${error.message}`, error.stack);
      return null;
    }
  }

  /** Recomputes member count, distinct sources and confidence for a cluster. */
  async refreshCluster(
    clusterId: Types.ObjectId | string,
  ): Promise<ClusterSummary | null> {
    const id = new Types.ObjectId(String(clusterId));

    const members = await this.arizaModel
      .find({ 'cluster.clusterId': id })
      .select('provenance cluster createdAt')
      .sort({ createdAt: 1 })
      .lean()
      .exec();

    if (members.length === 0) return null;

    const sources = new Set(
      members.map(
        (member: any) =>
          member.provenance?.channelUsername ||
          member.provenance?.sourceName ||
          member.provenance?.sourceType ||
          'unknown',
      ),
    );

    const timestamps = members
      .map((member: any) => member.provenance?.publishedAt ?? member.createdAt)
      .filter(Boolean)
      .map((value: any) => new Date(value).getTime())
      .filter((value) => !Number.isNaN(value));

    const confidence = clusterConfidence({
      // Members are already accepted duplicates, so the pair score is the
      // clustering threshold at minimum; distinct sources drive the bonus.
      pairScores: members.map(() => 85),
      distinctSources: sources.size,
    });

    const firstSeenAt = timestamps.length ? new Date(Math.min(...timestamps)) : null;
    const lastSeenAt = timestamps.length ? new Date(Math.max(...timestamps)) : null;

    await this.arizaModel.updateMany(
      { 'cluster.clusterId': id },
      {
        $set: {
          'cluster.memberCount': members.length,
          'cluster.sourceCount': sources.size,
          'cluster.confidence': confidence,
          'cluster.firstSeenAt': firstSeenAt,
          'cluster.lastSeenAt': lastSeenAt,
        },
      },
    );

    return {
      clusterId: id.toString(),
      memberCount: members.length,
      sourceCount: sources.size,
      confidence,
      firstSeenAt,
      lastSeenAt,
      timeline: [],
    };
  }

  /**
   * Source timeline for the item detail page: which source reported the item,
   * when, and with what link. Contact details are never included here.
   */
  async getClusterTimeline(arizaId: string): Promise<ClusterSummary | null> {
    if (!Types.ObjectId.isValid(arizaId)) return null;

    const ariza: any = await this.arizaModel
      .findById(arizaId)
      .select('cluster')
      .lean()
      .exec();

    const clusterId = ariza?.cluster?.clusterId;
    if (!clusterId) return null;

    const members = await this.arizaModel
      .find({ 'cluster.clusterId': clusterId })
      .select('provenance cluster createdAt')
      .sort({ createdAt: 1 })
      .lean()
      .exec();

    const timeline: ClusterMember[] = members.map((member: any) => ({
      id: member._id.toString(),
      sourceType: member.provenance?.sourceType ?? 'unknown',
      sourceName: member.provenance?.sourceName,
      sourceUrl: member.provenance?.sourceUrl,
      channelUsername: member.provenance?.channelUsername,
      publishedAt: member.provenance?.publishedAt ?? null,
      collectedAt: member.provenance?.collectedAt ?? member.createdAt ?? null,
      score: member.cluster?.confidence ?? 0,
      reasons: [],
    }));

    const first = members[0] as any;

    return {
      clusterId: String(clusterId),
      memberCount: members.length,
      sourceCount: new Set(timeline.map((item) => item.channelUsername || item.sourceType))
        .size,
      confidence: first?.cluster?.confidence ?? 0,
      firstSeenAt: first?.cluster?.firstSeenAt ?? null,
      lastSeenAt: first?.cluster?.lastSeenAt ?? null,
      timeline,
    };
  }
}
