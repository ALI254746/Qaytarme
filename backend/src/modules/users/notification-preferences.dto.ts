import {IsBoolean} from 'class-validator';
export class NotificationPreferencesDto {
 @IsBoolean() matches:boolean;
 @IsBoolean() messages:boolean;
 @IsBoolean() handover:boolean;
 @IsBoolean() system:boolean;
}

