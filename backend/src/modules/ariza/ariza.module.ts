
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ArizaService } from './ariza.service';
import { DedupeService } from './dedupe.service';
import { ArizaController } from './ariza.controller';
import { Ariza, ArizaSchema } from '../../schemas/ariza.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import { MatchesModule } from '../matches/matches.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Ariza', schema: ArizaSchema },
      { name: 'User', schema: UserSchema }
    ]),
    MatchesModule,
    CloudinaryModule,
  ],
  providers: [ArizaService, DedupeService],
  controllers: [ArizaController],
  exports: [ArizaService, DedupeService],
})
export class ArizaModule {}
