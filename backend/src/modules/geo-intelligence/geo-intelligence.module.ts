import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Ariza, ArizaSchema } from '../../schemas/ariza.schema';
import { GeoIntelligenceController } from './geo-intelligence.controller';
import { GeoIntelligenceService } from './geo-intelligence.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Ariza.name, schema: ArizaSchema }]),
  ],
  controllers: [GeoIntelligenceController],
  providers: [GeoIntelligenceService],
  exports: [GeoIntelligenceService],
})
export class GeoIntelligenceModule {}
