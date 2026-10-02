import { OAuth2Client } from 'google-auth-library';
import { randomBytes } from 'crypto';

import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, name } = registerDto;

    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      if (!existingUser.isVerified) {
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);
        const hashedPassword = await bcrypt.hash(password, 10);

        await this.usersService.update(existingUser._id.toString(), {
          verificationCode,
          verificationCodeExpiry,
          password: hashedPassword,
        });

        const emailResult = await this.mailService.sendVerificationEmail(email, verificationCode);
        if (!emailResult.success) {
           // Should we revert? For now just throw
           throw new BadRequestException('Email yuborishda xatolik: ' + emailResult.error);
        }
        return { message: 'Tasdiqlash kodi qayta yuborildi', unverified: true };
      }
      throw new ConflictException('Bunday foydalanuvchi allaqachon mavjud');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const newUser = await this.usersService.create({
      name,
      email,
      password: hashedPassword,
      isVerified: false,
      verificationCode,
      verificationCodeExpiry,
    });

    const emailResult = await this.mailService.sendVerificationEmail(email, verificationCode);
    
    if (!emailResult.success) {
      throw new BadRequestException('Email yuborishda xatolik: ' + emailResult.error);
    }
    return { message: 'Tasdiqlash kodi yuborildi', email: newUser.email };
  }

  async resendVerification(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new BadRequestException('Foydalanuvchi topilmadi');
    }

    if (user.isVerified) {
      throw new BadRequestException('Email allaqachon tasdiqlangan');
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await this.usersService.update(user._id.toString(), {
      verificationCode,
      verificationCodeExpiry,
    });

    const emailResult = await this.mailService.sendVerificationEmail(email, verificationCode);
    if (!emailResult.success) {
      throw new BadRequestException('Email yuborishda xatolik: ' + emailResult.error);
    }

    return { message: 'Tasdiqlash kodi qayta yuborildi' };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Foydalanuvchi topilmadi');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Parol noto\'g\'ri');
    }

    if (!user.isVerified) {
      throw new BadRequestException('Email tasdiqlanmagan');
    }

    const payload = { email: user.email, sub: user._id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    };
  }

  async verifyEmail(email: string, code: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new BadRequestException('Foydalanuvchi topilmadi');

    if (user.verificationCode !== code) {
      throw new BadRequestException('Noto\'g\'ri kod');
    }

    if (new Date() > user.verificationCodeExpiry) {
      throw new BadRequestException('Kod muddati o\'tgan');
    }

    await this.usersService.update(user._id.toString(), {
      isVerified: true,
      verificationCode: null,
      verificationCodeExpiry: null,
    });

    return { message: 'Email tasdiqlandi' };
  }

  async googleLogin(idToken: string) {
    if (typeof idToken !== 'string' || !idToken || idToken.length > 10000 || !process.env.GOOGLE_CLIENT_ID) {
      throw new UnauthorizedException('Google tasdig‘i talab qilinadi');
    }
    let profile;
    try {
      const ticket = await new OAuth2Client().verifyIdToken({idToken, audience: process.env.GOOGLE_CLIENT_ID});
      profile = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Google tasdig‘i yaroqsiz');
    }
    if (!profile?.sub || !profile.email || profile.email_verified !== true) {
      throw new UnauthorizedException('Google email tasdiqlanmagan');
    }
    return this.socialLogin({email:profile.email,name:profile.name || profile.email.split('@')[0],avatar:profile.picture});
  }

  private async socialLogin(data: { email: string; name: string; avatar?: string }) {
    try {
      this.logger.debug(`Social login: Finding user by email: ${data.email}`);
      let user = await this.usersService.findByEmail(data.email);

      if (!user) {
        this.logger.log(`Social login: User not found, creating new user: ${data.email}`);
        user = await this.usersService.create({
          email: data.email,
          name: data.name,
          avatar: data.avatar,
          isVerified: true,
          password: await bcrypt.hash(randomBytes(32).toString('hex'), 10),
        });
        this.logger.log(`Social login: User created successfully: ${user._id}`);
      } else if (!user.isVerified) {
        this.logger.log(`Social login: User exists but not verified, updating: ${user._id}`);
        user = await this.usersService.update(user._id.toString(), { isVerified: true });
      }

      if (!user) {
        this.logger.error(`Social login: Failed to create/update user for email: ${data.email}`);
        throw new BadRequestException('Foydalanuvchi yaratishda xatolik');
      }

      this.logger.debug(`Social login: Generating JWT token for user: ${user._id}`);
      const payload = { email: user.email, sub: user._id, role: user.role };
      const access_token = this.jwtService.sign(payload);
      
      this.logger.log(`Social login: Successfully authenticated user: ${data.email}`);
      return {
        access_token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
      };
    } catch (error) {
      this.logger.error(`Social login error for email: ${data.email}`, error.stack || error.message);
      throw error;
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new BadRequestException('Bunday email bilan foydalanuvchi topilmadi');
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await this.usersService.update(user._id.toString(), {
      verificationCode,
      verificationCodeExpiry,
    });

    const emailResult = await this.mailService.sendPasswordResetEmail(email, verificationCode);
    if (!emailResult.success) {
       // DEBUG FIX: Return code in error so we can test
       console.warn(`Forgot Password Code for ${email}: ${verificationCode}`);
       return { message: `Email error (TEST MODE): Code is ${verificationCode}` };
       // throw new BadRequestException('Email yuborishda xatolik: ' + emailResult.error);
    }

    return { message: 'Tasdiqlash kodi yuborildi' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { email, code, newPassword } = resetPasswordDto;
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new BadRequestException('Foydalanuvchi topilmadi');
    }

    if (user.verificationCode !== code) {
      throw new BadRequestException('Noto\'g\'ri kod');
    }

    if (new Date() > user.verificationCodeExpiry) {
      throw new BadRequestException('Kod muddati o\'tgan');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.usersService.update(user._id.toString(), {
      password: hashedPassword,
      verificationCode: null,
      verificationCodeExpiry: null,
    });

    return { message: 'Parol muvaffaqiyatli yangilandi' };
  }
}
