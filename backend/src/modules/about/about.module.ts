
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AboutController } from './about.controller';
import { AboutService } from './about.service';
import { About, AboutSchema } from '../../schemas/about.schema';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: About.name, schema: AboutSchema }]),
    CloudinaryModule,
  ],
  controllers: [AboutController],
  providers: [AboutService],
})
export class AboutModule {}
