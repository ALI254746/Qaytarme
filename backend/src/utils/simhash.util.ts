import { createHash } from 'crypto';
import { normalizeUzbekText } from './text-normalization.util';

const HASH_BITS = 64n;
const BIT_COUNT = 64;
const MASK_64 = (1n << HASH_BITS) - 1n;

/** Shingle size in words. Three words survives reordering of one token. */
const SHINGLE_SIZE = 3;

/**
 * Words carrying no distinguishing information in lost/found announcements.
 * They appear in almost every post, so they only add noise to the fingerprint.
 */
const STOP_WORDS = new Set([
  'yoqoldi',
  "yo'qoldi",
  'topildi',
  'topib',
  'oldim',
  'iltimos',
  'aloqa',
  'tel',
  'telefon',
  'raqam',
  'murojaat',
  'qiling',
  'uchun',
  'bilan',
  'kerak',
  'ariza',
  'elon',
  "e'lon",
  'kanal',
  'admin',
  'rahmat',
  'mukofot',
  'suyunchi',
]);

/** 64-bit fingerprint of a token, derived from a stable cryptographic hash. */
function tokenHash(token: string): bigint {
  const digest = createHash('sha1').update(token, 'utf8').digest();
  let value = 0n;
  for (let index = 0; index < 8; index += 1) {
    value = (value << 8n) | BigInt(digest[index]);
  }
  return value & MASK_64;
}

/** Normalized, de-noised tokens used for fingerprinting. */
export function extractTokens(text: string): string[] {
  return normalizeUzbekText(text ?? '')
    .split(' ')
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

/**
 * Word shingles. Using shingles instead of single words makes the fingerprint
 * sensitive to word order, which separates "qora sumka topildi" from
 * "sumkada qora telefon".
 */
export function buildShingles(tokens: string[], size = SHINGLE_SIZE): string[] {
  if (tokens.length === 0) return [];
  if (tokens.length < size) return [tokens.join(' ')];

  const shingles: string[] = [];
  for (let index = 0; index + size <= tokens.length; index += 1) {
    shingles.push(tokens.slice(index, index + size).join(' '));
  }
  return shingles;
}

/**
 * Charikar simhash over weighted shingles.
 * Returns a 16 character hex string, or an empty string when the text carries
 * no usable signal. An empty fingerprint must never be treated as a match.
 */
export function simhash(text: string): string {
  const tokens = extractTokens(text);
  const shingles = buildShingles(tokens);
  if (shingles.length === 0) return '';

  // Repeated shingles get a higher weight, which is what we want: a phrase
  // used twice in the post is more characteristic of it.
  const weights = new Map<string, number>();
  for (const shingle of shingles) {
    weights.set(shingle, (weights.get(shingle) ?? 0) + 1);
  }

  const vector = new Array<number>(BIT_COUNT).fill(0);
  for (const [shingle, weight] of weights) {
    const hash = tokenHash(shingle);
    for (let bit = 0; bit < BIT_COUNT; bit += 1) {
      const isSet = (hash >> BigInt(bit)) & 1n;
      vector[bit] += isSet === 1n ? weight : -weight;
    }
  }

  let fingerprint = 0n;
  for (let bit = 0; bit < BIT_COUNT; bit += 1) {
    if (vector[bit] > 0) fingerprint |= 1n << BigInt(bit);
  }

  return fingerprint.toString(16).padStart(16, '0');
}

function parseFingerprint(value?: string | null): bigint | null {
  if (!value || !/^[0-9a-f]{1,16}$/i.test(value)) return null;
  return BigInt(`0x${value}`) & MASK_64;
}

/**
 * Hamming distance between two simhash fingerprints.
 * Returns null when either fingerprint is missing or malformed, so callers
 * cannot accidentally read "unknown" as "identical".
 */
export function hammingDistance(
  left?: string | null,
  right?: string | null,
): number | null {
  const a = parseFingerprint(left);
  const b = parseFingerprint(right);
  if (a === null || b === null) return null;

  let xor = a ^ b;
  let distance = 0;
  while (xor > 0n) {
    xor &= xor - 1n;
    distance += 1;
  }
  return distance;
}

/** 1 means identical fingerprints, 0 means fully different. */
export function fingerprintSimilarity(
  left?: string | null,
  right?: string | null,
): number | null {
  const distance = hammingDistance(left, right);
  if (distance === null) return null;
  return 1 - distance / BIT_COUNT;
}

/** Exact token overlap, used as a second opinion next to the fingerprint. */
export function jaccardSimilarity(left: string, right: string): number {
  const a = new Set(extractTokens(left));
  const b = new Set(extractTokens(right));
  if (a.size === 0 || b.size === 0) return 0;

  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }

  return intersection / (a.size + b.size - intersection);
}

export const SIMHASH_VERSION = 'simhash-v1';
export const SIMHASH_BITS = BIT_COUNT;
