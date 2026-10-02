import {Prop,Schema,SchemaFactory} from '@nestjs/mongoose';
import {Document,Schema as MongoSchema} from 'mongoose';
@Schema({timestamps:true})
export class AuditEntry extends Document {
 @Prop({required:true}) actor:string;
 @Prop({required:true}) action:string;
 @Prop({required:true}) entity:string;
 @Prop({type:MongoSchema.Types.Mixed,default:{}}) details:Record<string,unknown>;
}
export const AuditEntrySchema=SchemaFactory.createForClass(AuditEntry);
@Schema({timestamps:true})
export class Report extends Document {
 @Prop({required:true,index:true}) itemId:string;
 @Prop({required:true}) reporter:string;
 @Prop({required:true}) reason:string;
 @Prop({default:''}) description:string;
 @Prop({enum:['open','resolved','dismissed'],default:'open'}) status:string;
 @Prop({default:''}) resolution:string;
 @Prop({default:''}) resolvedBy:string;
}
export const ReportSchema=SchemaFactory.createForClass(Report);
@Schema({timestamps:true})
export class PlatformSettings extends Document {
 @Prop({default:'main',unique:true}) key:string;
 @Prop({default:false}) moderateWeb:boolean;
 @Prop({default:true}) moderateTelegram:boolean;
 @Prop({type:String,enum:['sensitive','blurred','normal'],default:'sensitive'}) imageDisplayMode:'sensitive'|'blurred'|'normal';
}
export const PlatformSettingsSchema=SchemaFactory.createForClass(PlatformSettings);

