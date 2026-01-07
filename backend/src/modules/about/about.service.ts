
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { About, AboutDocument } from '../../schemas/about.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class AboutService {
  constructor(
    @InjectModel(About.name) private aboutModel: Model<AboutDocument>,
    private cloudinaryService: CloudinaryService,
  ) {}

  async getAbout() {
    let about = await this.aboutModel.findOne();
    if (!about) {
      // Create default if not exists
      about = await this.aboutModel.create({
        founder: {
          name: "Ismingiz Familiyangiz",
          role: "Role",
          bio: "Bio",
          image: "",
          projects: []
        },
        videoData: {
          title: "Video Title",
          desc: "Description",
          thumbnail: "",
          videoUrl: ""
        }
      });
    }
    return about;
  }

  async updateAbout(data: any, files: { founderImage?: Express.Multer.File[], videoThumbnail?: Express.Multer.File[] }) {
    let about = await this.aboutModel.findOne();
    if (!about) {
      about = new this.aboutModel();
    }

    // Parse data if it comes as stringified JSON (common with FormData)
    // However, if we use a proper key-value structure in FormData, we might receive objects.
    // NestJS FileInterceptor with body usually gives parsed object if content-type is multipart/form-data
    // BUT nested objects might be flattened or need manual parsing.
    // For simplicity, I'll assume 'data' contains the fields. 
    // If complex nested objects are sent via FormData, typically they are sent as JSON string in a field like 'data'.
    
    let parsedData = data;
    if (data.data) {
        try {
            parsedData = JSON.parse(data.data);
        } catch (e) {
            console.error("Failed to parse data field", e);
        }
    }

    if (files.founderImage && files.founderImage[0]) {
      const result = await this.cloudinaryService.uploadFile(files.founderImage[0]);
      // @ts-ignore
      if (parsedData.founder) parsedData.founder.image = result.secure_url;
      // If we are strictly updating partials, we need to be careful. 
      // But typically we send the whole object state or merge it.
      // If we only send 'founder' object, and 'projects' is inside 'founder', we are good.
    }

    if (files.videoThumbnail && files.videoThumbnail[0]) {
      const result = await this.cloudinaryService.uploadFile(files.videoThumbnail[0]);
      // @ts-ignore
      if (parsedData.videoData) parsedData.videoData.thumbnail = result.secure_url;
    }

    // Update fields
    if (parsedData.founder) {
        about.founder = { ...about.founder, ...parsedData.founder };
    }
    if (parsedData.videoData) {
        about.videoData = { ...about.videoData, ...parsedData.videoData };
    }

    return about.save();
  }
}
