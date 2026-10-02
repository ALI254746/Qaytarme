import {Injectable,BadRequestException,NotFoundException,ConflictException} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {Model,Types} from 'mongoose';
import {Ariza} from '../../schemas/ariza.schema';
import {User} from '../../schemas/user.schema';
import {TelegramChannel} from '../../schemas/telegram-channel.schema';
import {SourceReliability} from '../../schemas/source-reliability.schema';
import {AuditEntry,Report} from './operations.schemas';
import {SettingsService} from './settings.module';
import {TelegramService} from '../telegram/telegram.service';
import {MatchesService} from '../matches/matches.service';
import {DecisionDto,ReportDto,ResolveReportDto,ChannelDto,ChannelSettingsDto} from './operations.dto';
import {VALID_CATEGORIES} from '../../utils/category.util';
@Injectable()
export class OperationsService {
 constructor(@InjectModel(Ariza.name) private items:Model<Ariza>,
 @InjectModel(User.name) private users:Model<User>,
 @InjectModel(TelegramChannel.name) private channels:Model<TelegramChannel>,
 @InjectModel(SourceReliability.name) private sourceReliability:Model<SourceReliability>,
 @InjectModel(AuditEntry.name) private audit:Model<AuditEntry>,
 @InjectModel(Report.name) private reports:Model<Report>,
 private settings:SettingsService,private telegram:TelegramService,private matches:MatchesService){}
 private validId(id:string){if(!Types.ObjectId.isValid(id))throw new BadRequestException('Noto‘g‘ri identifikator');}
 async log(actor:string,action:string,entity:string,details:Record<string,unknown>={}){return this.audit.create({actor,action,entity,details});}
 async overview(){
  const [total,pending,returned,telegramItems,duplicateItems,openReports,channels,activity]=await Promise.all([
   this.items.countDocuments(),this.items.countDocuments({moderationStatus:'pending'}),this.items.countDocuments({moderationStatus:'returned'}),
   this.items.countDocuments({'provenance.sourceType':'telegram'}),this.items.countDocuments({'cluster.isPrimary':false}),
   this.reports.countDocuments({status:'open'}),this.channels.find().lean(),this.audit.find().sort({createdAt:-1}).limit(8).lean()]);
  return {total,pending,returned,telegramItems,duplicateItems,openReports,channels:channels.length,activeChannels:channels.filter(c=>c.isActive).length,collector:this.telegram.getStatus(),activity};
 }
 async listItems(){return this.items.find().select('-phone -email -telegram -fullName +provenance.originalText +provenance.normalizedText').populate('user','name').sort({createdAt:-1}).limit(500).lean();}
 async decision(id:string,dto:DecisionDto,actor:string){
  this.validId(id);if(!dto.note.trim())throw new BadRequestException('Qaror izohini kiriting');
  const before=await this.items.findById(id);if(!before)throw new NotFoundException('E’lon topilmadi');
  if(before.moderationStatus==='returned')throw new ConflictException('Qaytarilgan buyum holatini o‘zgartirib bo‘lmaydi');
  await this.log(actor,'moderation',id,{before:before.moderationStatus,after:dto.status,note:dto.note});
  const updated=await this.items.findByIdAndUpdate(id,{$set:{moderationStatus:dto.status,...(dto.hideImages!==undefined?{imageVisibility:dto.hideImages?'hidden':'public'}:{})}},{new:true});
  if(updated && dto.status==='approved') await this.matches.findAndCreateMatches(updated);
  return updated ? {id:updated._id,moderationStatus:updated.moderationStatus} : null;
 }
 async listReports(){return this.reports.find().sort({createdAt:-1}).limit(500).lean();}
 async report(dto:ReportDto,reporter:string){
  if(!await this.items.exists({_id:dto.itemId}))throw new NotFoundException('E’lon topilmadi');
  const existing=await this.reports.findOne({itemId:dto.itemId,reporter,status:'open'});
  if(existing)throw new ConflictException('Bu e’lon bo‘yicha ochiq shikoyatingiz mavjud');
  const result=await this.reports.create({...dto,reporter});
  await this.log(reporter,'report',String(result._id),{itemId:dto.itemId,reason:dto.reason});return result;
 }
 async resolveReport(id:string,dto:ResolveReportDto,actor:string){
  this.validId(id);if(!dto.note.trim())throw new BadRequestException('Qaror izohini kiriting');
  const report=await this.reports.findById(id);if(!report)throw new NotFoundException('Shikoyat topilmadi');
  await this.log(actor,'report-resolution',id,{status:dto.status,note:dto.note,hideItem:!!dto.hideItem});
  if(dto.hideItem)await this.items.updateOne({_id:report.itemId,moderationStatus:{$ne:'returned'}},{$set:{moderationStatus:'pending'}});
  return this.reports.findByIdAndUpdate(id,{$set:{status:dto.status,resolution:dto.note,resolvedBy:actor}},{new:true}).lean();
 }
 async listUsers(){const rows=await this.users.find().select('name email role isVerified createdAt avatar').sort({createdAt:-1}).limit(500).lean();
 const counts=await this.items.aggregate([{$group:{_id:'$user',count:{$sum:1}}}]);const map=new Map(counts.map(c=>[String(c._id),c.count]));
 return rows.map(u=>({...u,items:map.get(String(u._id))||0}));}
 async categories(){const rows=await this.items.aggregate([{$group:{_id:'$category',count:{$sum:1}}}]);return VALID_CATEGORIES.map(key=>({key,count:rows.find(r=>r._id===key)?.count||0}));}
 async auditList(){return this.audit.find().sort({createdAt:-1}).limit(500).lean();}
 async getSettings(){return {...await this.settings.get(),integrations:{telegram:this.telegram.getStatus().connected,mongo:true,ai:!!process.env.GEMINI_API_KEY,images:!!process.env.CLOUDINARY_API_KEY,email:!!process.env.RESEND_API_KEY}};}
 async saveSettings(dto:any,actor:string){const current=await this.settings.get();const values={...dto,imageDisplayMode:dto.imageDisplayMode??current.imageDisplayMode??'sensitive'};await this.log(actor,'settings','platform',{moderateWeb:values.moderateWeb,moderateTelegram:values.moderateTelegram,imageDisplayMode:values.imageDisplayMode});return this.settings.update(values);}
 async listChannels(){const rows=await this.channels.find().sort({createdAt:-1}).lean();const counts=await this.items.aggregate([{$match:{'provenance.sourceType':'telegram'}},{$group:{_id:'$provenance.channelUsername',count:{$sum:1}}}]);return rows.map(c=>({...c,imported:counts.find(r=>String(r._id).replace(/^@/,'').toLowerCase()===c.username.toLowerCase())?.count||0}));}
 async channelDetails(id:string){
  this.validId(id);
  const channel=await this.channels.findById(id).lean();
  if(!channel)throw new NotFoundException('Telegram manbasi topilmadi');
  const username=String(channel.username).replace(/^@/,'').toLowerCase();
  const sourceMatch={'provenance.sourceType':'telegram','provenance.channelUsername':{$regex:`^@?${username}$`,$options:'i'}};
  const [statsRows,posts,timeline,reliability,owner,settings]=await Promise.all([
   this.items.aggregate([{$match:sourceMatch},{$group:{_id:null,total:{$sum:1},last24Hours:{$sum:{$cond:[{$gte:['$createdAt',new Date(Date.now()-86400000)]},1,0]}},duplicates:{$sum:{$cond:[{$eq:['$cluster.isPrimary',false]},1,0]}},pending:{$sum:{$cond:[{$eq:['$moderationStatus','pending']},1,0]}},approved:{$sum:{$cond:[{$eq:['$moderationStatus','approved']},1,0]}},rejected:{$sum:{$cond:[{$eq:['$moderationStatus','rejected']},1,0]}}}}]),
   this.items.find(sourceMatch).select('itemType itemName itemDescription status moderationStatus region district location date createdAt image imageVisibility provenance.channelUsername provenance.sourceUrl cluster').sort({createdAt:-1}).limit(30).lean(),
   this.audit.find({entity:id}).sort({createdAt:-1}).limit(12).lean(),
   this.sourceReliability.findOne({sourceKey:{$regex:`^@?${username}$`,$options:'i'}}).lean(),
   Types.ObjectId.isValid(channel.addedBy)?this.users.findById(channel.addedBy).select('name email').lean():null,
   this.settings.get(),
  ]);
  const coverage=await this.items.aggregate([{$match:sourceMatch},{$group:{_id:{region:{$ifNull:['$region','Hudud noma’lum']},district:{$ifNull:['$district','']}},count:{$sum:1}}},{$sort:{count:-1}},{$limit:8}]);
  const stats=statsRows[0]||{total:0,last24Hours:0,duplicates:0,pending:0,approved:0,rejected:0};
  return {channel,stats,posts,timeline,coverage:coverage.map(row=>({region:row._id.region,district:row._id.district,count:row.count})),reliability:reliability?{score:reliability.manualScore??reliability.score,tier:reliability.tier,sampleSize:reliability.sampleSize,stats:reliability.stats,warnings:reliability.warnings,blocked:reliability.blocked,computedAt:reliability.computedAt}:null,owner,settings,collector:this.telegram.getStatus()};
 }
 async addChannel(dto:ChannelDto,actor:string){const username=dto.username.replace(/^@/,'').toLowerCase();if(await this.channels.exists({username}))throw new ConflictException('Kanal allaqachon ulangan');
 const channel=await this.channels.create({...dto,username,addedBy:actor,isActive:true});await this.log(actor,'channel-add',String(channel._id),{username});await this.telegram.refreshChannels();return channel;}
 async toggleChannel(id:string,active:boolean,actor:string){this.validId(id);const c=await this.channels.findByIdAndUpdate(id,{$set:{isActive:active}},{new:true});if(!c)throw new NotFoundException('Kanal topilmadi');await this.log(actor,'channel-state',id,{isActive:active});if(active)await this.telegram.refreshChannels();return c;}
 async updateChannelSettings(id:string,dto:ChannelSettingsDto,actor:string){this.validId(id);const channel=await this.channels.findByIdAndUpdate(id,{$set:dto},{new:true,runValidators:true});if(!channel)throw new NotFoundException('Telegram manbasi topilmadi');await this.log(actor,'channel-settings',id,{...dto});return channel;}
 async importChannel(id:string,actor:string){this.validId(id);const c=await this.channels.findById(id);if(!c)throw new NotFoundException('Kanal topilmadi');const result=await this.telegram.importRecent(c.username);await this.log(actor,'telegram-import',id,result);return result;}
}
