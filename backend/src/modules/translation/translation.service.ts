
import { Injectable, Logger } from '@nestjs/common';
import { v2 } from '@google-cloud/translate';

@Injectable()
export class TranslationService {
  private translateClient: any;
  private readonly logger = new Logger(TranslationService.name);

  constructor() {
    if (process.env.GOOGLE_TRANSLATE_API_KEY) {
      this.translateClient = new v2.Translate({
        key: process.env.GOOGLE_TRANSLATE_API_KEY,
      });
    } else {
      this.logger.warn('GOOGLE_TRANSLATE_API_KEY is not set. Translation will be disabled.');
    }
  }

  /**
   * Translates text to the target language.
   * @param text The text to translate.
   * @param targetLang The target language code (e.g., 'uz', 'ru', 'en').
   * @returns The translated text.
   */
  async translate(text: string, targetLang: string): Promise<string> {
    if (!this.translateClient) {
        return text; // Return original if service is not configured
    }
    if (!text) return '';

    try {
      const [translation] = await this.translateClient.translate(text, targetLang);
      return translation;
    } catch (error) {
      this.logger.error(`Translation failed: ${error.message}`);
      return text; // Fallback to original text on error
    }
  }

  /**
   * Auto-detects language of the text.
   */
  async detectLanguage(text: string): Promise<string | null> {
      if (!this.translateClient || !text) return null;
      try {
          const [detections] = await this.translateClient.detect(text);
          const detection = Array.isArray(detections) ? detections[0] : detections;
          return detection?.language || null;
      } catch (error) {
          this.logger.error(`Detection failed: ${error.message}`);
          return null;
      }
  }
}
