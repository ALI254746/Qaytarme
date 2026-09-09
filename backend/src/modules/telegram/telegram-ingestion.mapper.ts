import { buildTelegramProvenance, TelegramMessageEvidence } from '../../utils/telegram-provenance.util';

export type TelegramAnnouncementFields = {
  title: string;
  itemType: string;
  description: string;
  itemDescription: string;
  status: string;
  category: string;
  region: string;
  district: string;
  location: string;
  date: string;
  phone: string;
  telegram: string;
  image: unknown;
  coordinates: { lat: number; lng: number };
};

export function mapTelegramAnnouncement(
  fields: TelegramAnnouncementFields,
  evidence: {
    messages: TelegramMessageEvidence[];
    chatTitle?: string;
    chatUsername?: string;
    originalText: string;
    collectedAt?: Date;
  },
) {
  return {
    ...fields,
    provenance: buildTelegramProvenance(evidence.messages, {
      chatTitle: evidence.chatTitle,
      chatUsername: evidence.chatUsername,
      originalText: evidence.originalText,
      collectedAt: evidence.collectedAt,
      parserVersion: 'telegram-parser-v1',
    }),
  };
}
