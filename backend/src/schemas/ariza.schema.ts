import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { buildProvenance } from '../utils/provenance.util';
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

  @Prop()
  originalText: string;

  @Prop()
  normalizedText: string;

  @Prop({ index: true })
  contentHash: string;

  @Prop({ default: 'provenance-v1' })
  parserVersion: string;
}

const SourceProvenanceSchema = SchemaFactory.createForClass(SourceProvenance);

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

  @Prop()
  date: string;

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

  @Prop()
  region: string;

  @Prop()
  district: string;

  @Prop({ type: ImageSchema })
  image: Image;

  @Prop({ type: SourceProvenanceSchema })
  provenance: SourceProvenanceValue;

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
});

ArizaSchema.index({
  'provenance.sourceType': 1,
  'provenance.channelUsername': 1,
  'provenance.messageIds': 1,
});
ArizaSchema.index({ 'provenance.contentHash': 1, createdAt: -1 });
