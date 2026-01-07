import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Match extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Ariza', required: true })
  lostItem: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Ariza', required: true })
  foundItem: Types.ObjectId;

  @Prop({ default: 0 })
  similarity: number;

  @Prop()
  reason: string;

  @Prop({
    enum: ['new', 'viewed', 'contacted', 'confirmed', 'rejected'],
    default: 'new',
  })
  status: string;

  @Prop({ default: false })
  isRead1: boolean;

  @Prop({ default: false })
  isRead2: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user1: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user2: Types.ObjectId;
}

export const MatchSchema = SchemaFactory.createForClass(Match);
MatchSchema.index({ lostItem: 1, foundItem: 1 }, { unique: true });
