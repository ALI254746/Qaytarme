
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Query, 
  Param,
  UseInterceptors, 
  UploadedFile, 
  UseGuards, 
  Req,
  Delete 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ArizaService } from './ariza.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('ariza')
export class ArizaController {
  constructor(private readonly arizaService: ArizaService) {}

  @Get()
  async findAll(@Query() query: any) {
    return this.arizaService.findAll(query);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async findMy(@Req() req: any) {
    return this.arizaService.findByUser(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.arizaService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Req() req: any,
    @Body() data: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.arizaService.create(req.user.id, data, file);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Req() req: any, @Param('id') id: string) {
    return this.arizaService.remove(id, req.user.id);
  }

  @Post(':id/confirm-handover')
  @UseGuards(JwtAuthGuard)
  async confirmHandover(@Req() req: any, @Param('id') id: string, @Body() body: { otherUserId: string }) {
    return this.arizaService.confirmHandover(id, req.user.id, body.otherUserId);
  }

  @Post(':id/confirm-receipt')
  @UseGuards(JwtAuthGuard)
  async confirmReceipt(@Req() req: any, @Param('id') id: string, @Body() body: { otherUserId: string }) {
    return this.arizaService.confirmReceipt(id, req.user.id, body.otherUserId);
  }

  @Post(':id/cancel-deal')
  @UseGuards(JwtAuthGuard)
  async cancelDeal(@Req() req: any, @Param('id') id: string) {
    return this.arizaService.cancelDeal(id, req.user.id);
  }
}
