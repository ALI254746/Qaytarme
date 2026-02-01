import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
class Image {
  @Prop()
  url: string;

  @Prop()
  publicId: string;
}

const ImageSchema = SchemaFactory.createForClass(Image);

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
    trim: true
  })
  category: string;


  @Prop()
  date: string;

  @Prop()
  status: string; // lost or found

  @Prop({ default: 'pending' })
  moderationStatus: string; // pending, approved, rejected, returned

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

  @Prop({ default: 0 })
  likeCount: number;

  @Prop({ default: false })
  isLikedByCurrentUser: boolean;
}

export const ArizaSchema = SchemaFactory.createForClass(Ariza);
