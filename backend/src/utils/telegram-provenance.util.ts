import { buildProvenance, SourceProvenance } from './provenance.util';

export type TelegramMessageEvidence = {
  id?: string | number;
  date?: Date | string | number;
};

function parseTelegramDate(value?: Date | string | number): Date | undefined {
  if (value === undefined || value === null) return undefined;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : value;
  if (typeof value === 'number') {
    const milliseconds = value < 1_000_000_000_000 ? value * 1000 : value;
    const parsed = new Date(milliseconds);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function buildTelegramProvenance(
  messages: TelegramMessageEvidence[],
  input: {
    chatTitle?: string;
    chatUsername?: string;
    originalText: string;
    collectedAt?: Date;
    parserVersion?: string;
  },
): SourceProvenance {
  const channelUsername = input.chatUsername?.replace(/^@/, '').trim().toLowerCase();
  const messageIds = messages
    .map((message) => message.id)
    .filter((id): id is string | number => id !== undefined && id !== null);
  const publishedDates = messages
    .map((message) => parseTelegramDate(message.date))
    .filter((date): date is Date => Boolean(date))
    .sort((left, right) => left.getTime() - right.getTime());
  const firstMessageId = messageIds[0];
  const sourceUrl = channelUsername && firstMessageId !== undefined
    ? 'https:' + String.fromCharCode(47, 47) + 't.me/' + channelUsername + '/' + firstMessageId
    : undefined;

  return buildProvenance({
    sourceType: 'telegram',
    sourceUrl,
    sourceName: input.chatTitle,
    channelUsername,
    messageIds,
    publishedAt: publishedDates[0],
    collectedAt: input.collectedAt,
    originalText: input.originalText,
    parserVersion: input.parserVersion ?? 'telegram-parser-v1',
  });
}
