
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AboutDocument = About & Document;

@Schema()
class Project {
  @Prop()
  id: number;

  @Prop()
  name: string;

  @Prop()
  desc: string;

  @Prop()
  icon: string;

  @Prop()
  color: string;

  @Prop()
  link: string;
}

@Schema()
class Founder {
  @Prop()
  name: string;

  @Prop()
  role: string;

  @Prop()
  bio: string;

  @Prop()
  image: string;

  @Prop([Project])
  projects: Project[];
}

@Schema()
class VideoData {
  @Prop()
  title: string;

  @Prop()
  desc: string;

  @Prop()
  thumbnail: string;

  @Prop()
  videoUrl: string;
}

@Schema({ timestamps: true })
export class About {
  @Prop({ type: Founder })
  founder: Founder;

  @Prop({ type: VideoData })
  videoData: VideoData;
}

export const AboutSchema = SchemaFactory.createForClass(About);
