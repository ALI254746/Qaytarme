import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ unique: true, sparse: true })
  telegramId: number;

  @Prop({ default: 0 })
  points: number;

  @Prop({ enum: ['user', 'admin'], default: 'user' })
  role: string;

  @Prop({ default: '' })
  avatar: string;

  @Prop({ default: '' })
  phone: string;

  @Prop({ default: '' })
  bio: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
  friends: Types.ObjectId[];

  @Prop({
    type: [
      {
        from: { type: Types.ObjectId, ref: 'User' },
        date: { type: Date, default: Date.now },
      },
    ],
  })
  friendRequests: any[];

  @Prop({
    type: [
      {
        type: {
          type: String,
          enum: ['friend_request', 'like', 'comment', 'new-ariza', 'system', 'admin_message'],
          required: true,
        },
        message: { type: String, required: true },
        from: { type: Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
        read: { type: Boolean, default: false },
        relatedMessageId: { type: Types.ObjectId, ref: 'Message', required: false },
      },
    ],
  })
  notifications: any[];

  @Prop({ default: null })
  resetCode: string;

  @Prop({ default: null })
  resetCodeExpiry: Date;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ default: null })
  verificationCode: string;

  @Prop({ default: null })
  verificationCodeExpiry: Date;

  @Prop({ type: Object, default: null })
  pushSubscription: any;

  @Prop({ type: [String], default: [] })
  badges: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);
