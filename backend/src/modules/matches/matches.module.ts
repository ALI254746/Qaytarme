
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { Match, MatchSchema } from '../../schemas/match.schema';
import { Ariza, ArizaSchema } from '../../schemas/ariza.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import { SettingsModule } from '../operations/settings.module';

@Module({
  imports: [
    SettingsModule,
    MongooseModule.forFeature([
      { name: Match.name, schema: MatchSchema },
      { name: Ariza.name, schema: ArizaSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [MatchesService],
  controllers: [MatchesController],
  exports: [MatchesService],
})
export class MatchesModule {}
