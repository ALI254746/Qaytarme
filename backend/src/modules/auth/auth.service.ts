
import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
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

    return { message: 'User created. Verification code sent.', email: newUser.email };
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

  async socialLogin(data: { email: string; name: string; avatar?: string }) {
    let user = await this.usersService.findByEmail(data.email);

    if (!user) {
      user = await this.usersService.create({
        email: data.email,
        name: data.name,
        avatar: data.avatar,
        isVerified: true,
        password: await bcrypt.hash(Math.random().toString(36).slice(-10), 10),
      });
    } else if (!user.isVerified) {
      user = await this.usersService.update(user._id.toString(), { isVerified: true });
    }

    if (!user) {
      throw new BadRequestException('Foydalanuvchi yaratishda xatolik');
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
       throw new BadRequestException('Email yuborishda xatolik: ' + emailResult.error);
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
