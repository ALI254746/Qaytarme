import {Global,Module,Injectable} from '@nestjs/common';
import {MongooseModule,InjectModel} from '@nestjs/mongoose';
import {Model} from 'mongoose';
import {PlatformSettings,PlatformSettingsSchema} from './operations.schemas';
@Injectable()
export class SettingsService {
 constructor(@InjectModel(PlatformSettings.name) private settings:Model<PlatformSettings>){}
 async get(){return await this.settings.findOne({key:'main'}).lean() || {moderateWeb:false,moderateTelegram:true,imageDisplayMode:'sensitive'};}
 async update(values:{moderateWeb:boolean;moderateTelegram:boolean;imageDisplayMode?:'sensitive'|'blurred'|'normal'}){return this.settings.findOneAndUpdate({key:'main'},{$set:values},{upsert:true,new:true,runValidators:true}).lean();}
}
@Global()
@Module({imports:[MongooseModule.forFeature([{name:PlatformSettings.name,schema:PlatformSettingsSchema}])],providers:[SettingsService],exports:[SettingsService]})
export class SettingsModule {}

