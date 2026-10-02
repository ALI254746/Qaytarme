import {Body,Controller,Get,Post,Patch,Param,Req,UseGuards,ForbiddenException} from '@nestjs/common';
import {JwtAuthGuard} from '../auth/jwt-auth.guard';
import {OperationsService} from './operations.service';
import {DecisionDto,ReportDto,ResolveReportDto,SettingsDto,ChannelDto,ChannelSettingsDto,ChannelStateDto} from './operations.dto';
@Controller('operations')
@UseGuards(JwtAuthGuard)
export class OperationsController {
 constructor(private service:OperationsService){}
 private admin(req:any){if(req.user.role!=='admin')throw new ForbiddenException('Administrator huquqi talab etiladi');return req.user.id;}
 @Get('overview') overview(@Req()req:any){this.admin(req);return this.service.overview();}
 @Get('items') items(@Req()req:any){this.admin(req);return this.service.listItems();}
 @Post('items/:id/decision') decision(@Param('id')id:string,@Body()dto:DecisionDto,@Req()req:any){return this.service.decision(id,dto,this.admin(req));}
 @Post('reports') report(@Body()dto:ReportDto,@Req()req:any){return this.service.report(dto,req.user.id);}
 @Get('reports') reports(@Req()req:any){this.admin(req);return this.service.listReports();}
 @Post('reports/:id/resolve') resolve(@Param('id')id:string,@Body()dto:ResolveReportDto,@Req()req:any){return this.service.resolveReport(id,dto,this.admin(req));}
 @Get('users') users(@Req()req:any){this.admin(req);return this.service.listUsers();}
 @Get('categories') categories(@Req()req:any){this.admin(req);return this.service.categories();}
 @Get('audit') audit(@Req()req:any){this.admin(req);return this.service.auditList();}
 @Get('settings') settings(@Req()req:any){this.admin(req);return this.service.getSettings();}
 @Post('settings') saveSettings(@Body()dto:SettingsDto,@Req()req:any){return this.service.saveSettings(dto,this.admin(req));}
 @Get('channels') channels(@Req()req:any){this.admin(req);return this.service.listChannels();}
 @Get('channels/:id') channelDetails(@Param('id')id:string,@Req()req:any){this.admin(req);return this.service.channelDetails(id);}
 @Post('channels') addChannel(@Body()dto:ChannelDto,@Req()req:any){return this.service.addChannel(dto,this.admin(req));}
 @Patch('channels/:id') channelState(@Param('id')id:string,@Body()dto:ChannelStateDto,@Req()req:any){return this.service.toggleChannel(id,dto.isActive,this.admin(req));}
 @Patch('channels/:id/settings') updateChannelSettings(@Param('id')id:string,@Body()dto:ChannelSettingsDto,@Req()req:any){return this.service.updateChannelSettings(id,dto,this.admin(req));}
 @Post('channels/:id/import') importChannel(@Param('id')id:string,@Req()req:any){return this.service.importChannel(id,this.admin(req));}
}

