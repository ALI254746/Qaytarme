import { createHash } from 'crypto';
import { normalizeUzbekText } from './text-normalization.util';

export type SourceType =
  | 'telegram'
  | 'web'
  | 'telegram_bot'
  | 'mobile_app'
  | 'admin'
  | 'unknown';

export type ProvenanceInput = {
  sourceType?: SourceType;
  sourceUrl?: string;
  sourceName?: string;
  channelUsername?: string;
  messageIds?: Array<string | number>;
  publishedAt?: string | Date;
  collectedAt?: string | Date;
  originalText?: string;
  parserVersion?: string;
};

export type SourceProvenance = {
  sourceType: SourceType;
  sourceUrl?: string;
  sourceName?: string;
  channelUsername?: string;
  messageIds: string[];
  publishedAt?: Date;
  collectedAt: Date;
  originalText: string;
  normalizedText: string;
  contentHash: string;
  parserVersion: string;
};

function safeDate(value?: string | Date): Date | undefined {
  if (!value) return undefined;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function safeSourceUrl(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function cleanText(value?: string): string {
  return (value ?? '').replace(/\u0000/g, '').trim().slice(0, 20_000);
}

export function createContentHash(parts: {
  sourceType: SourceType;
  sourceUrl?: string;
  channelUsername?: string;
  messageIds?: string[];
  normalizedText: string;
}): string {
  const canonical = JSON.stringify({
    sourceType: parts.sourceType,
    sourceUrl: parts.sourceUrl ?? '',
    channelUsername: parts.channelUsername ?? '',
    messageIds: [...(parts.messageIds ?? [])].sort(),
    normalizedText: parts.normalizedText,
  });

  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}

export function buildProvenance(
  input: ProvenanceInput = {},
  fallbackText = '',
  now = new Date(),
): SourceProvenance {
  const sourceType = input.sourceType ?? 'unknown';
  const sourceUrl = safeSourceUrl(input.sourceUrl);
  const sourceName = cleanText(input.sourceName).slice(0, 200) || undefined;
  const channelUsername =
    cleanText(input.channelUsername).replace(/^@/, '').toLowerCase().slice(0, 100) ||
    undefined;
  const messageIds = Array.from(
    new Set(
      (input.messageIds ?? [])
        .map((id) => String(id).trim())
        .filter(Boolean),
    ),
  ).slice(0, 50);
  const originalText = cleanText(input.originalText || fallbackText);
  const normalizedText = normalizeUzbekText(originalText);
  const collectedAt = safeDate(input.collectedAt) ?? now;
  const publishedAt = safeDate(input.publishedAt);

  return {
    sourceType,
    sourceUrl,
    sourceName,
    channelUsername,
    messageIds,
    publishedAt,
    collectedAt,
    originalText,
    normalizedText,
    contentHash: createContentHash({
      sourceType,
      sourceUrl,
      channelUsername,
      messageIds,
      normalizedText,
    }),
    parserVersion: cleanText(input.parserVersion).slice(0, 100) || 'provenance-v1',
  };
}
