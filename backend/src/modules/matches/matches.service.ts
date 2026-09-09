import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { Match } from '../../schemas/match.schema';
import { Ariza } from '../../schemas/ariza.schema';
import { matchByCategory } from '../../utils/category-matcher.util';
import {
  calculateExplainableMatchScore,
  MatchableItem,
} from '../../utils/matching-score.util';

type CandidateEvaluation = {
  score: number;
  reasons: string[];
};

@Injectable()
export class MatchesService {
  private readonly logger = new Logger(MatchesService.name);
  private readonly imageClient: ImageAnnotatorClient | null;
  private readonly matchThreshold: number;

  constructor(
    @InjectModel(Match.name) private readonly matchModel: Model<Match>,
    @InjectModel(Ariza.name) private readonly arizaModel: Model<Ariza>,
    private readonly configService: ConfigService,
  ) {
    this.imageClient = this.createImageClient();
    const configuredThreshold = Number(
      this.configService.get<string>('MATCH_THRESHOLD') ?? 50,
    );
    this.matchThreshold = Number.isFinite(configuredThreshold)
      ? Math.min(100, Math.max(0, configuredThreshold))
      : 50;
  }

  private createImageClient(): ImageAnnotatorClient | null {
    const credentialsJson =
      this.configService.get<string>('GOOGLE_CREDENTIALS_JSON');

    if (credentialsJson) {
      try {
        return new ImageAnnotatorClient({
          credentials: JSON.parse(credentialsJson),
        });
      } catch (error: any) {
        this.logger.warn(
          `GOOGLE_CREDENTIALS_JSON parse error: ${error.message}`,
        );
      }
    }

    const apiKey = this.configService.get<string>('GOOGLE_VISION_API_KEY');
    if (apiKey) {
      return new ImageAnnotatorClient({ apiKey });
    }

    this.logger.warn(
      'Google Vision is disabled. Configure credentials through environment variables.',
    );
    return null;
  }

  private toMatchableItem(item: Partial<Ariza>): MatchableItem {
    return {
      category: item.category,
      itemType: item.itemType,
      itemName: item.itemName,
      itemDescription: item.itemDescription,
      location: item.location,
      region: item.region,
      district: item.district,
      date: item.date,
      createdAt: item.createdAt,
      coordinates: item.coordinates,
    };
  }

  private async compareImages(url1?: string, url2?: string): Promise<number> {
    if (!this.imageClient || !url1 || !url2) return 0;

    try {
      const [firstResult] = await this.imageClient.labelDetection(url1);
      const [secondResult] = await this.imageClient.labelDetection(url2);
      const toLabels = (annotations: typeof firstResult.labelAnnotations) =>
        new Set(
          (annotations ?? [])
            .map((annotation) => annotation.description?.toLowerCase())
            .filter((label): label is string => Boolean(label)),
        );

      const firstLabels = toLabels(firstResult.labelAnnotations);
      const secondLabels = toLabels(secondResult.labelAnnotations);
      if (firstLabels.size === 0 || secondLabels.size === 0) return 0;

      let intersection = 0;
      for (const label of firstLabels) {
        if (secondLabels.has(label)) intersection += 1;
      }

      const union = new Set([...firstLabels, ...secondLabels]).size;
      return Math.round((intersection / union) * 100);
    } catch (error: any) {
      this.logger.warn(`Google Vision comparison failed: ${error.message}`);
      return 0;
    }
  }

  private async evaluateCandidate(
    newItem: Ariza,
    candidate: Partial<Ariza>,
  ): Promise<CandidateEvaluation | null> {
    const lostItem = newItem.status === 'lost' ? newItem : candidate;
    const foundItem = newItem.status === 'found' ? newItem : candidate;
    const lostMatchable = this.toMatchableItem(lostItem);
    const foundMatchable = this.toMatchableItem(foundItem);

    const generalScore = calculateExplainableMatchScore(
      lostMatchable,
      foundMatchable,
    );
    const categoryScore = matchByCategory(lostMatchable, foundMatchable);

    if (!generalScore.eligible || categoryScore.conflicts.length > 0) {
      this.logger.debug(
        `Candidate rejected: ${categoryScore.conflicts.join(', ') || 'minimum identity signals missing'}`,
      );
      return null;
    }

    let score = Math.round(generalScore.score * 0.65 + categoryScore.score * 0.35);
    const reasons = [
      ...generalScore.components
        .filter((component) => component.score > 0)
        .map(
          (component) =>
            `${component.label} ${component.score}/${component.maxScore}`,
        ),
      ...categoryScore.signals
        .filter((signal) => signal.score > 0)
        .map((signal) =>
          signal.evidence
            ? `${signal.label}: ${signal.evidence}`
            : `${signal.label} ${signal.score}/${signal.maxScore}`,
        ),
    ];

    const newImageUrl = newItem.image?.url;
    const candidateImageUrl = candidate.image?.url;
    if (newImageUrl && candidateImageUrl) {
      const imageSimilarity = await this.compareImages(
        newImageUrl,
        candidateImageUrl,
      );

      if (imageSimilarity >= 70) {
        score += 10;
        reasons.push(`Rasm o‘xshashligi ${imageSimilarity}%`);
      } else if (imageSimilarity >= 50) {
        score += 5;
        reasons.push(`Rasm o‘xshashligi ${imageSimilarity}%`);
      } else if (imageSimilarity > 0 && imageSimilarity < 20) {
        score -= 5;
      }
    }

    score = Math.min(100, Math.max(0, score));
    if (score < this.matchThreshold) return null;

    return {
      score,
      reasons: Array.from(new Set(reasons)).slice(0, 10),
    };
  }

  async findAndCreateMatches(newItem: Ariza): Promise<Types.ObjectId[]> {
    try {
      const targetStatus = newItem.status === 'lost' ? 'found' : 'lost';
      const filter: Record<string, unknown> = {
        status: targetStatus,
        moderationStatus: 'approved',
        _id: { $ne: newItem._id },
      };

      // Categories are enum-backed, so filtering here reduces unnecessary scans.
      if (newItem.category) filter.category = newItem.category;

      const candidates = await this.arizaModel.find(filter).lean();
      const matches: Types.ObjectId[] = [];

      for (const candidate of candidates) {
        const evaluation = await this.evaluateCandidate(newItem, candidate);
        if (!evaluation) continue;

        const lostItem = newItem.status === 'lost' ? newItem : candidate;
        const foundItem = newItem.status === 'found' ? newItem : candidate;
        const exists = await this.matchModel.exists({
          lostItem: lostItem._id,
          foundItem: foundItem._id,
        });
        if (exists) continue;

        await this.matchModel.create({
          lostItem: lostItem._id,
          foundItem: foundItem._id,
          similarity: evaluation.score,
          reason:
            evaluation.reasons.join(', ') || 'Kategoriya va umumiy o‘xshashlik',
          user1: lostItem.user,
          user2: foundItem.user,
          isRead1: false,
          isRead2: false,
        });
        matches.push(candidate._id as Types.ObjectId);
      }

      if (matches.length > 0) {
        this.logger.log(
          `Explainable matching created ${matches.length} match(es) for ${newItem._id}`,
        );
      }
      return matches;
    } catch (error: any) {
      this.logger.error(`Matching algorithm error: ${error.message}`, error.stack);
      return [];
    }
  }

  async getUserMatches(userId: string) {
    return this.matchModel
      .find({
        $or: [
          { user1: new Types.ObjectId(userId) },
          { user2: new Types.ObjectId(userId) },
        ],
      })
      .populate('lostItem')
      .populate('foundItem')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async findRelatedItemId(
    originArizaId: string,
    matchedUserId: string,
  ): Promise<string | null> {
    try {
      const match = await this.matchModel
        .findOne({
          $or: [
            { lostItem: new Types.ObjectId(originArizaId) },
            { foundItem: new Types.ObjectId(originArizaId) },
          ],
        })
        .populate('lostItem foundItem')
        .exec();

      if (!match) return null;

      const lostItem = match.lostItem as any;
      const foundItem = match.foundItem as any;
      const lostId = lostItem?._id?.toString();
      const foundId = foundItem?._id?.toString();

      if (lostId === originArizaId && foundItem?.user?.toString() === matchedUserId) {
        return foundId ?? null;
      }
      if (foundId === originArizaId && lostItem?.user?.toString() === matchedUserId) {
        return lostId ?? null;
      }
      return null;
    } catch (error: any) {
      this.logger.error(`Related item lookup failed: ${error.message}`);
      return null;
    }
  }
}
