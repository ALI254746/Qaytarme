import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { buildProvenance } from '../utils/provenance.util';
import { parseOccurredAt, toGeoPoint } from '../utils/geo.util';
import { simhash } from '../utils/simhash.util';
import { normalizeImageHash } from '../utils/image-hash.util';
import type { GeoPoint } from '../utils/geo.util';
import type {
  SourceProvenance as SourceProvenanceValue,
  SourceType,
} from '../utils/provenance.util';

@Schema({ _id: false })
class Image {
  @Prop()
  url: string;

  @Prop()
  publicId: string;

  /**
   * Perceptual hash returned by Cloudinary. Used to recognise the same photo
   * after recompression or resizing, which byte hashes cannot do.
   */
  @Prop({ index: true, sparse: true })
  phash?: string;
}

const ImageSchema = SchemaFactory.createForClass(Image);

@Schema({ _id: false })
export class SourceProvenance {
  @Prop({
    type: String,
    enum: ['telegram', 'web', 'telegram_bot', 'mobile_app', 'admin', 'unknown'],
    default: 'unknown',
  })
  sourceType: SourceType;

  @Prop()
  sourceUrl?: string;

  @Prop()
  sourceName?: string;

  @Prop()
  channelUsername?: string;

  @Prop({ type: [String], default: [] })
  messageIds: string[];

  @Prop()
  publishedAt?: Date;

  @Prop({ default: Date.now })
  collectedAt: Date;

  @Prop({ select: false })
  originalText: string;

  @Prop({ select: false })
  normalizedText: string;

  @Prop({ index: true })
  contentHash: string;

  /**
   * Locality sensitive fingerprint of the normalized text. Unlike
   * `contentHash` it stays close when a channel rewrites a few words, which
   * is exactly how reposts appear in practice.
   */
  @Prop({ index: true, sparse: true })
  simhash?: string;

  @Prop({ default: 'provenance-v1' })
  parserVersion: string;
}

const SourceProvenanceSchema = SchemaFactory.createForClass(SourceProvenance);

/** Repost cluster membership. */
@Schema({ _id: false })
export class ClusterInfo {
  /** Shared id of every announcement describing the same real world item. */
  @Prop({ type: Types.ObjectId, default: null, index: true, sparse: true })
  clusterId: Types.ObjectId | null;

  /** The representative announcement shown in listings. */
  @Prop({ default: true })
  isPrimary: boolean;

  /** Set on a hidden repost, pointing at the representative announcement. */
  @Prop({ type: Types.ObjectId, ref: 'Ariza', default: null })
  duplicateOf: Types.ObjectId | null;

  /** How many announcements are in the cluster, including this one. */
  @Prop({ default: 1 })
  memberCount: number;

  /** How many independent sources (channels, web, bot) reported the item. */
  @Prop({ default: 1 })
  sourceCount: number;

  /** 0-100 confidence that the cluster really is one item. */
  @Prop({ default: 0 })
  confidence: number;

  /** Earliest and latest sighting, used for the source timeline. */
  @Prop({ type: Date, default: null })
  firstSeenAt: Date | null;

  @Prop({ type: Date, default: null })
  lastSeenAt: Date | null;

  @Prop({ default: 'dedupe-v1' })
  dedupeVersion: string;
}

const ClusterInfoSchema = SchemaFactory.createForClass(ClusterInfo);

@Schema({ timestamps: true })
export class Ariza extends Document {
  createdAt: Date;
  updatedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop()
  fullName: string;

  @Prop()
  phone: string;

  @Prop()
  telegram: string;

  @Prop()
  email: string;

  @Prop()
  itemType: string;

  @Prop()
  itemName: string;

  @Prop()
  itemDescription: string;

  @Prop({
    type: String,
    enum: ['tech', 'pets', 'keys', 'wallet', 'docs', 'clothing', 'jewelry', 'vehicle', 'home', 'sports', 'toys', 'books', 'tools', 'food'],
    default: 'tech',
    lowercase: true,
    trim: true,
  })
  category: string;

  /** Free-form date as typed by the user or parsed from a channel post. */
  @Prop()
  date: string;

  /**
   * Machine readable incident timestamp derived from `date`.
   * Null when `date` could not be trusted, so temporal analysis can skip it
   * instead of using an invented value.
   */
  @Prop({ type: Date, default: null })
  occurredAt: Date | null;

  @Prop()
  status: string;

  @Prop({ default: 'pending' })
  moderationStatus: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  matchedUser: Types.ObjectId;

  @Prop({ default: false })
  confirmedByFinder: boolean;

  @Prop({ default: false })
  confirmedByLoser: boolean;

  @Prop()
  location: string;

  @Prop({
    type: {
      lat: Number,
      lng: Number,
    },
  })
  coordinates: {
    lat: number;
    lng: number;
  };

  /**
   * GeoJSON mirror of `coordinates`, kept in sync automatically.
   * Required for $near / $geoWithin queries and hotspot aggregation.
   */
  @Prop({
    type: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number] },
    },
    default: null,
  })
  geo: GeoPoint | null;

  @Prop()
  region: string;

  @Prop()
  district: string;

  @Prop({ type: ImageSchema })
  image: Image;

  @Prop({ type: SourceProvenanceSchema })
  provenance: SourceProvenanceValue;

  @Prop({ type: ClusterInfoSchema, default: () => ({}) })
  cluster: ClusterInfo;

  @Prop({ default: 0 })
  likeCount: number;

  @Prop({ default: false })
  isLikedByCurrentUser: boolean;
}

export const ArizaSchema = SchemaFactory.createForClass(Ariza);

ArizaSchema.pre('validate', function () {
  const document = this as unknown as Ariza;
  document.provenance = buildProvenance(
    document.provenance ?? {},
    document.itemDescription ?? document.itemName ?? document.itemType ?? '',
  );

  // Fingerprint the full announcement text, not only the description, so a
  // repost that moves words between fields still lands on the same value.
  const fingerprintSource = [
    document.itemType,
    document.itemName,
    document.itemDescription,
    document.location,
  ]
    .filter(Boolean)
    .join(' ');

  const fingerprint = simhash(
    document.provenance?.originalText || fingerprintSource,
  );
  if (fingerprint) {
    (document.provenance as SourceProvenanceValue & { simhash?: string }).simhash =
      fingerprint;
  }

  if (document.image?.phash) {
    document.image.phash = normalizeImageHash(document.image.phash);
  }

  // Keep the analytical fields derived from the user facing ones.
  document.geo = toGeoPoint(document.coordinates);
  document.occurredAt = parseOccurredAt(document.date);
});

ArizaSchema.index({
  'provenance.sourceType': 1,
  'provenance.channelUsername': 1,
  'provenance.messageIds': 1,
});
ArizaSchema.index({ 'provenance.contentHash': 1, createdAt: -1 });

// Candidate lookup for repost clustering.
ArizaSchema.index({ 'provenance.simhash': 1, createdAt: -1 });
ArizaSchema.index({ 'image.phash': 1, createdAt: -1 });
ArizaSchema.index({ 'cluster.clusterId': 1, createdAt: 1 });

// Main listing query: moderation + status + category, newest first.
ArizaSchema.index({
  moderationStatus: 1,
  status: 1,
  category: 1,
  createdAt: -1,
});

// Owner and deal lookups.
ArizaSchema.index({ user: 1, createdAt: -1 });
ArizaSchema.index({ matchedUser: 1, createdAt: -1 });

// Geospatial and temporal intelligence.
ArizaSchema.index({ geo: '2dsphere' });
ArizaSchema.index({ occurredAt: -1 });
ArizaSchema.index({ region: 1, district: 1, occurredAt: -1 });
