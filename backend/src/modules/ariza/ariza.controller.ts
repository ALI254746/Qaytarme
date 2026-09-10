
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ArizaService } from './ariza.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RateLimit, RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { CreateArizaDto } from './dto/create-ariza.dto';
import { QueryArizaDto } from './dto/query-ariza.dto';

/**
 * Unknown fields are stripped rather than rejected, so existing clients keep
 * working while server owned fields (provenance, moderationStatus, ...) can
 * no longer be injected through the request body.
 */
const STRIP_UNKNOWN = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: false,
  transform: true,
  transformOptions: { enableImplicitConversion: false },
});

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

@Controller('ariza')
@UseGuards(RateLimitGuard)
export class ArizaController {
  constructor(private readonly arizaService: ArizaService) {}

  @Get()
  @RateLimit({ limit: 60, windowMs: 60_000 })
  @UsePipes(STRIP_UNKNOWN)
  async findAll(@Query() query: QueryArizaDto, @Req() req: any) {
    return this.arizaService.findAll(query, req.user?.id ?? null);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @RateLimit({ limit: 60, windowMs: 60_000 })
  async findMy(@Req() req: any) {
    return this.arizaService.findByUser(req.user.id);
  }

  /**
   * Declared before the generic ':id' route so the more specific path wins.
   */
  @Get(':id/sources')
  @RateLimit({ limit: 120, windowMs: 60_000 })
  async findSources(@Param('id') id: string) {
    return this.arizaService.getSourceTimeline(id);
  }

  @Get(':id')
  @RateLimit({ limit: 120, windowMs: 60_000 })
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.arizaService.findById(id, req.user?.id ?? null);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @RateLimit({ limit: 10, windowMs: 60_000 })
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
      fileFilter: (_request, file, callback) => {
        const allowed = /^image\/(jpe?g|png|webp|heic|heif)$/i.test(file.mimetype);
        callback(
          allowed ? null : new Error('Faqat rasm fayllari qabul qilinadi'),
          allowed,
        );
      },
    }),
  )
  @UsePipes(STRIP_UNKNOWN)
  async create(
    @Req() req: any,
    @Body() data: CreateArizaDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.arizaService.create(req.user.id, data, file);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @RateLimit({ limit: 20, windowMs: 60_000 })
  async remove(@Req() req: any, @Param('id') id: string) {
    return this.arizaService.remove(id, req.user.id);
  }

  @Post(':id/confirm-handover')
  @UseGuards(JwtAuthGuard)
  @RateLimit({ limit: 20, windowMs: 60_000 })
  async confirmHandover(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { otherUserId?: string },
  ) {
    return this.arizaService.confirmHandover(id, req.user.id, body?.otherUserId ?? '');
  }

  @Post(':id/confirm-receipt')
  @UseGuards(JwtAuthGuard)
  @RateLimit({ limit: 20, windowMs: 60_000 })
  async confirmReceipt(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { otherUserId?: string },
  ) {
    return this.arizaService.confirmReceipt(id, req.user.id, body?.otherUserId ?? '');
  }

  @Post(':id/cancel-deal')
  @UseGuards(JwtAuthGuard)
  @RateLimit({ limit: 20, windowMs: 60_000 })
  async cancelDeal(@Req() req: any, @Param('id') id: string) {
    return this.arizaService.cancelDeal(id, req.user.id);
  }
}
