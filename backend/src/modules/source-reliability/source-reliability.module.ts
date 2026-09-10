import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ArizaSchema } from '../../schemas/ariza.schema';
import { SourceReliabilitySchema } from '../../schemas/source-reliability.schema';
import { SourceReliabilityService } from './source-reliability.service';
import { SourceReliabilityController } from './source-reliability.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Ariza', schema: ArizaSchema },
      { name: 'SourceReliability', schema: SourceReliabilitySchema },
    ]),
  ],
  providers: [SourceReliabilityService],
  controllers: [SourceReliabilityController],
  exports: [SourceReliabilityService],
})
export class SourceReliabilityModule {}
