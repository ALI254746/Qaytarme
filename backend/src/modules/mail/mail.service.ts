
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend: Resend;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.logger.warn('RESEND_API_KEY topilmadi. Email yuborilmadi.');
    }
  }

  async sendVerificationEmail(to: string, code: string) {
    if (!this.resend) {
      this.logger.log(`TASDIQLASH KODI (TEST): ${code}`);
      return { success: false, error: 'API key missing' };
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: 'QaytarMe <noreply@qaytarme.uz>',
        to: [to],
        subject: 'Emailingizni tasdiqlang - QaytarMe',
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 40px; background-color: #F7F6E2; border-radius: 24px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="display: inline-block; width: 60px; height: 60px; background-color: #A9D3C9; border-radius: 16px; line-height: 60px; font-size: 30px;">🎁</div>
            </div>
            <h2 style="color: #1a1a1a; text-align: center; font-size: 24px; font-weight: 900; margin-bottom: 10px;">Emailingizni tasdiqlang</h2>
            <p style="color: #666; text-align: center; margin-bottom: 30px;">QaytarMe platformasiga xush kelibsiz! Ro'yxatdan o'tishni yakunlash uchun quyidagi koddan foydalanang:</p>
            <div style="background: white; padding: 30px; text-align: center; border-radius: 20px; border: 2px solid #A9D3C9; margin: 20px 0;">
              <h1 style="letter-spacing: 10px; color: #1a1a1a; margin: 0; font-size: 40px; font-weight: 900;">${code}</h1>
            </div>
            <p style="color: #999; font-size: 13px; text-align: center; margin-top: 30px;">Ushbu kod 10 daqiqa davomida amal qiladi.</p>
            <hr style="border: none; border-top: 1px solid #A9D3C940; margin: 30px 0;" />
            <p style="font-size: 11px; color: #aaa; text-align: center; text-transform: uppercase; letter-spacing: 1px;">&copy; 2024 QaytarMe Jamoasi</p>
          </div>
        `,
      });

      if (error) {
        this.logger.error('Resend error:', error);
        let errorMessage = error.message || 'Email service error';
        if (errorMessage.includes('verified')) {
          errorMessage += ' (Resend Test Mode: faqat o\'z emailingizga yubora olasiz)';
        }
        return { success: false, error: errorMessage };
      }

      return { success: true, data };
    } catch (error) {
      this.logger.error('Email yuborishda kutilmagan xatolik:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  async sendPasswordResetEmail(to: string, code: string) {
    if (!this.resend) {
      this.logger.log(`PAROLNI TIKLASH KODI (TEST): ${code}`);
      return { success: false, error: 'API key missing' };
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: 'QaytarMe <noreply@qaytarme.uz>',
        to: [to],
        subject: 'Parolni tiklash - QaytarMe',
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 40px; background-color: #F7F6E2; border-radius: 24px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="display: inline-block; width: 60px; height: 60px; background-color: #A9D3C9; border-radius: 16px; line-height: 60px; font-size: 30px;">🛡️</div>
            </div>
            <h2 style="color: #1a1a1a; text-align: center; font-size: 24px; font-weight: 900; margin-bottom: 10px;">Parolni tiklash</h2>
            <p style="color: #666; text-align: center; margin-bottom: 30px;">Siz parolingizni tiklashni so'radingiz. Davom etish uchun quyidagi kodni kiriting:</p>
            <div style="background: white; padding: 30px; text-align: center; border-radius: 20px; border: 2px solid #A9D3C9; margin: 20px 0;">
              <h1 style="letter-spacing: 10px; color: #1a1a1a; margin: 0; font-size: 40px; font-weight: 900;">${code}</h1>
            </div>
            <p style="color: #999; font-size: 13px; text-align: center; margin-top: 30px;">Ushbu kod 10 daqiqa davomida amal qiladi.</p>
            <hr style="border: none; border-top: 1px solid #A9D3C940; margin: 30px 0;" />
            <p style="font-size: 11px; color: #aaa; text-align: center; text-transform: uppercase; letter-spacing: 1px;">&copy; 2024 QaytarMe Jamoasi</p>
          </div>
        `,
      });

      if (error) {
        this.logger.error('Resend error:', error);
        let errorMessage = error.message || 'Email service error';
        if (errorMessage.includes('verified')) {
          errorMessage += ' (Resend Test Mode: faqat o\'z emailingizga yubora olasiz)';
        }
        return { success: false, error: errorMessage };
      }

      return { success: true, data };
    } catch (error) {
      this.logger.error('Email yuborishda kutilmagan xatolik:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }
}
