
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TelegramChannelDocument = TelegramChannel & Document;

@Schema({ timestamps: true })
export class TelegramChannel {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop()
  description: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  addedBy: string; // Admin ID
}

export const TelegramChannelSchema = SchemaFactory.createForClass(TelegramChannel);
