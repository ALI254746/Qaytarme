import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import type {
  ReliabilityFactor,
  ReliabilityTier,
} from '../utils/source-reliability.util';
import { RELIABILITY_VERSION } from '../utils/source-reliability.util';

/**
 * One document per source (Telegram channel, web form, bot, admin import).
 * The counters are a snapshot: they are recomputed from the announcements
 * themselves, never incremented blindly, so a bug cannot permanently corrupt
 * a channel's rating.
 */
@Schema({ timestamps: true, collection: 'source_reliability' })
export class SourceReliability extends Document {
  createdAt: Date;
  updatedAt: Date;

  /** Channel username when available, otherwise the source type. */
  @Prop({ required: true, unique: true, index: true })
  sourceKey: string;

  @Prop({ default: 'telegram' })
  sourceType: string;

  @Prop()
  displayName?: string;

  @Prop({ default: 0, index: true })
  score: number;

  @Prop({
    type: String,
    enum: ['trusted', 'reliable', 'mixed', 'low', 'insufficient_data'],
    default: 'insufficient_data',
    index: true,
  })
  tier: ReliabilityTier;

  @Prop({ default: 0 })
  sampleSize: number;

  @Prop({ type: Object, default: {} })
  stats: Record<string, number>;

  @Prop({ type: [Object], default: [] })
  factors: ReliabilityFactor[];

  @Prop({ type: [String], default: [] })
  strengths: string[];

  @Prop({ type: [String], default: [] })
  warnings: string[];

  /**
   * Manual override for an editor who knows a channel is trustworthy (or
   * not) regardless of the numbers. Null means "use the computed score".
   */
  @Prop({ type: Number, default: null })
  manualScore: number | null;

  @Prop()
  manualNote?: string;

  /** Blocked sources are still stored, but never ingested again. */
  @Prop({ default: false, index: true })
  blocked: boolean;

  @Prop({ type: Date, default: null })
  lastSeenAt: Date | null;

  @Prop({ type: Date, default: null })
  computedAt: Date | null;

  @Prop({ default: RELIABILITY_VERSION })
  version: string;
}

export const SourceReliabilitySchema =
  SchemaFactory.createForClass(SourceReliability);

SourceReliabilitySchema.index({ tier: 1, score: -1 });
