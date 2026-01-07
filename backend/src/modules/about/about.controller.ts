
import { 
  Controller, 
  Get, 
  Put, 
  Body, 
  UseGuards, 
  UseInterceptors, 
  UploadedFiles,
  Req,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AboutService } from './about.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('about')
export class AboutController {
  constructor(private readonly aboutService: AboutService) {}

  @Get()
  async getAbout() {
    return this.aboutService.getAbout();
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'founderImage', maxCount: 1 },
    { name: 'videoThumbnail', maxCount: 1 },
  ]))
  async updateAbout(
    @Req() req,
    @Body() body: any,
    @UploadedFiles() files: { founderImage?: Express.Multer.File[], videoThumbnail?: Express.Multer.File[] },
  ) {
    if (req.user.role !== 'admin') {
        throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
    return this.aboutService.updateAbout(body, files || {});
  }
}
