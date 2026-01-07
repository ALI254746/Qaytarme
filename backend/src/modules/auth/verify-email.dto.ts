import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyEmailDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6, { message: "Kod 6 ta raqamdan iborat bo'lishi kerak" })
  code: string;
}