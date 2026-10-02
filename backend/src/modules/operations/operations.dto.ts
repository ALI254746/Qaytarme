import {IsBoolean,IsIn,IsMongoId,IsOptional,IsString,MaxLength,Matches} from 'class-validator';
export class DecisionDto {
 @IsIn(['approved','rejected','pending']) status:string;
 @IsString() @MaxLength(1000) note:string;
 @IsOptional() @IsBoolean() hideImages?:boolean;
}
export class ReportDto {
 @IsMongoId() itemId:string;
 @IsIn(['privacy','fraud','wrong_category','duplicate','other']) reason:string;
 @IsOptional() @IsString() @MaxLength(2000) description?:string;
}
export class ResolveReportDto {
 @IsIn(['resolved','dismissed']) status:string;
 @IsString() @MaxLength(1000) note:string;
 @IsOptional() @IsBoolean() hideItem?:boolean;
}
export class SettingsDto {
 @IsBoolean() moderateWeb:boolean;
 @IsBoolean() moderateTelegram:boolean;
 @IsOptional() @IsIn(['sensitive','blurred','normal']) imageDisplayMode?:'sensitive'|'blurred'|'normal';
}
export class ChannelDto {
 @IsString() @Matches(/^@?[a-zA-Z][a-zA-Z0-9_]{4,31}$/) username:string;
 @IsOptional() @IsString() @MaxLength(300) description?:string;
 @IsOptional() @IsString() @MaxLength(80) region?:string;
}
export class ChannelStateDto { @IsBoolean() isActive:boolean; }
export class ChannelSettingsDto {
 @IsOptional() @IsString() @MaxLength(300) description?:string;
 @IsOptional() @IsString() @MaxLength(80) region?:string;
}
