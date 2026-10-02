import {Module} from '@nestjs/common';
import {MongooseModule} from '@nestjs/mongoose';
import {Ariza,ArizaSchema} from '../../schemas/ariza.schema';
import {User,UserSchema} from '../../schemas/user.schema';
import {TelegramChannel,TelegramChannelSchema} from '../../schemas/telegram-channel.schema';
import {SourceReliability,SourceReliabilitySchema} from '../../schemas/source-reliability.schema';
import {AuditEntry,AuditEntrySchema,Report,ReportSchema} from './operations.schemas';
import {OperationsController} from './operations.controller';
import {OperationsService} from './operations.service';
import {SettingsModule} from './settings.module';
import {TelegramModule} from '../telegram/telegram.module';
import {MatchesModule} from '../matches/matches.module';
@Module({imports:[SettingsModule,TelegramModule,MatchesModule,MongooseModule.forFeature([
 {name:Ariza.name,schema:ArizaSchema},{name:User.name,schema:UserSchema},{name:TelegramChannel.name,schema:TelegramChannelSchema},
 {name:AuditEntry.name,schema:AuditEntrySchema},{name:Report.name,schema:ReportSchema},{name:SourceReliability.name,schema:SourceReliabilitySchema}
])],controllers:[OperationsController],providers:[OperationsService]})
export class OperationsModule {}
