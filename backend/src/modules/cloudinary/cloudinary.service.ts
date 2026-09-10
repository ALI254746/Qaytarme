import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';
const streamifier = require('streamifier');

/**
 * `phash: true` makes Cloudinary return a perceptual hash of the image.
 * It is what allows recognising the same photo after recompression,
 * resizing or a light crop, which is how reposts usually appear.
 */
const UPLOAD_OPTIONS = { phash: true } as const;

@Injectable()
export class CloudinaryService {
  uploadFile(
    file: Express.Multer.File,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return this.upload(file.buffer);
  }

  uploadBuffer(buffer: Buffer): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return this.upload(buffer);
  }

  private upload(
    buffer: Buffer,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        UPLOAD_OPTIONS,
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('Cloudinary upload failed: No result'));
          resolve(result);
        },
      );

      streamifier.createReadStream(buffer).pipe(upload);
    });
  }

  async deleteFile(publicId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });
  }
}
