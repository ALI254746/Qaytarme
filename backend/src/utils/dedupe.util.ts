import { distanceKm, fromGeoPoint, toGeoPoint } from './geo.util';
import type { GeoPoint, LatLng } from './geo.util';
import { compareImages } from './image-hash.util';
import { fingerprintSimilarity, hammingDistance, jaccardSimilarity } from './simhash.util';

/** Bit distance under which two fingerprints describe the same text. */
export const SIMHASH_DUPLICATE_DISTANCE = 8;
/** Bit distance that still suggests a rewritten repost. */
export const SIMHASH_NEAR_DISTANCE = 14;
/** Reposts of the same incident normally appear within this window. */
export const REPOST_WINDOW_HOURS = 72;
/** Two posts about the same incident are rarely further apart than this. */
export const REPOST_RADIUS_KM = 5;
/** Score at which items are clustered automatically. */
export const DUPLICATE_THRESHOLD = 70;
/** Score at which a human should look at the pair. */
export const REVIEW_THRESHOLD = 45;

export type DedupeCandidate = {
  id?: string;
  status?: string;
  category?: string;
  text?: string;
  contentHash?: string | null;
  simhash?: string | null;
  imagePhash?: string | null;
  channelUsername?: string | null;
  sourceUrl?: string | null;
  messageIds?: string[];
  coordinates?: LatLng;
  geo?: GeoPoint | null;
  occurredAt?: Date | string | null;
  publishedAt?: Date | string | null;
  createdAt?: Date | string | null;
};

export type DedupeSignal = {
  name: string;
  weight: number;
  score: number;
  detail: string;
};

export type DedupeVerdict = 'duplicate' | 'review' | 'unique';

export type DedupeResult = {
  verdict: DedupeVerdict;
  score: number;
  signals: DedupeSignal[];
  reasons: string[];
  blockers: string[];
};

function toDate(value?: Date | string | null): Date | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function bestTimestamp(candidate: DedupeCandidate): Date | null {
  return (
    toDate(candidate.occurredAt) ??
    toDate(candidate.publishedAt) ??
    toDate(candidate.createdAt)
  );
}

/**
 * Coordinates can arrive as `{ lat, lng }` (possibly as strings) or as a
 * stored GeoJSON point. Both are normalised through the geo helpers, which
 * also drop (0,0) and out of range values.
 */
function coordinatesOf(
  candidate: DedupeCandidate,
): { lat: number; lng: number } | null {
  const point = toGeoPoint(candidate.coordinates) ?? candidate.geo ?? null;
  const plain = fromGeoPoint(point);
  if (!plain || !Number.isFinite(plain.lat) || !Number.isFinite(plain.lng)) {
    return null;
  }
  return plain;
}

function sameChannelMessage(left: DedupeCandidate, right: DedupeCandidate): boolean {
  if (!left.channelUsername || !right.channelUsername) return false;
  if (left.channelUsername !== right.channelUsername) return false;

  const leftIds = new Set(left.messageIds ?? []);
  return (right.messageIds ?? []).some((id) => leftIds.has(id));
}

/**
 * Weighted, explainable duplicate decision.
 *
 * Signals with no evidence (missing hash, missing coordinates) are excluded
 * from the denominator instead of scoring zero. Otherwise a text-only post
 * could never reach the threshold simply because it has no photo.
 */
export function evaluateDuplicate(
  left: DedupeCandidate,
  right: DedupeCandidate,
): DedupeResult {
  const signals: DedupeSignal[] = [];
  const reasons: string[] = [];
  const blockers: string[] = [];

  // A lost post and a found post describe two sides of one case, never a
  // repost of each other. That is the matching pipeline's job, not dedupe.
  if (left.status && right.status && left.status !== right.status) {
    blockers.push('Yoqolgan va topilgan elonlar takror deb belgilanmaydi');
  }

  if (left.category && right.category && left.category !== right.category) {
    blockers.push('Kategoriya mos emas');
  }

  // Exact identity shortcuts, both are conclusive on their own.
  if (left.contentHash && right.contentHash && left.contentHash === right.contentHash) {
    reasons.push('Bir xil kontent hash');
    return {
      verdict: blockers.length > 0 ? 'review' : 'duplicate',
      score: 100,
      signals: [
        { name: 'contentHash', weight: 1, score: 1, detail: 'Bir xil kontent hash' },
      ],
      reasons,
      blockers,
    };
  }

  if (sameChannelMessage(left, right)) {
    reasons.push('Bir kanalning ayni xabari');
    return {
      verdict: blockers.length > 0 ? 'review' : 'duplicate',
      score: 100,
      signals: [
        { name: 'messageId', weight: 1, score: 1, detail: 'Bir kanalning ayni xabari' },
      ],
      reasons,
      blockers,
    };
  }

  // Text fingerprint.
  const textDistance = hammingDistance(left.simhash, right.simhash);
  if (textDistance !== null) {
    const similarity = fingerprintSimilarity(left.simhash, right.simhash) ?? 0;
    let score = 0;
    if (textDistance <= SIMHASH_DUPLICATE_DISTANCE) {
      score = 1;
      reasons.push(`Matn izi juda yaqin (${textDistance} bit)`);
    } else if (textDistance <= SIMHASH_NEAR_DISTANCE) {
      score = 0.6;
      reasons.push(`Matn izi yaqin (${textDistance} bit)`);
    } else {
      score = Math.max(0, similarity - 0.5) * 2 * 0.3;
    }

    signals.push({
      name: 'textFingerprint',
      weight: 0.4,
      score,
      detail: `Simhash masofasi ${textDistance} bit`,
    });
  }

  // Token overlap, an independent opinion on the text.
  if (left.text && right.text) {
    const jaccard = jaccardSimilarity(left.text, right.text);
    if (jaccard >= 0.7) {
      reasons.push(`Sozlar ustma-ust tushdi (${Math.round(jaccard * 100)}%)`);
    }
    signals.push({
      name: 'tokenOverlap',
      weight: 0.2,
      score: Math.min(1, jaccard / 0.8),
      detail: `Jaccard ${jaccard.toFixed(2)}`,
    });
  }

  // Perceptual image hash.
  const image = compareImages(left.imagePhash, right.imagePhash);
  if (image.verdict !== 'unknown') {
    const score =
      image.verdict === 'identical' ? 1 : image.verdict === 'similar' ? 0.6 : 0;
    if (image.verdict === 'identical') reasons.push('Ayni rasm ishlatilgan');
    if (image.verdict === 'similar') reasons.push('Rasmlar juda oxshash');
    if (image.verdict === 'different') blockers.push('Rasmlar butunlay boshqa');

    signals.push({
      name: 'imageHash',
      weight: 0.3,
      score,
      detail: `pHash masofasi ${image.distance}`,
    });
  }

  // Time proximity.
  const leftTime = bestTimestamp(left);
  const rightTime = bestTimestamp(right);
  if (leftTime && rightTime) {
    const hours = Math.abs(leftTime.getTime() - rightTime.getTime()) / 3_600_000;
    const score =
      hours <= REPOST_WINDOW_HOURS ? 1 - hours / (REPOST_WINDOW_HOURS * 2) : 0;
    if (hours <= 24) reasons.push(`Bir kun ichida joylangan (${Math.round(hours)} soat)`);
    signals.push({
      name: 'time',
      weight: 0.1,
      score: Math.max(0, score),
      detail: `${Math.round(hours)} soat farq`,
    });
  }

  // Geographic proximity.
  const leftPoint = coordinatesOf(left);
  const rightPoint = coordinatesOf(right);
  if (leftPoint && rightPoint) {
    const km = distanceKm(leftPoint, rightPoint);
    const score = km <= REPOST_RADIUS_KM ? 1 - km / (REPOST_RADIUS_KM * 2) : 0;
    if (km <= 1) reasons.push('Bir joydan berilgan');
    signals.push({
      name: 'geo',
      weight: 0.1,
      score: Math.max(0, score),
      detail: `${km.toFixed(1)} km masofa`,
    });
  }

  const totalWeight = signals.reduce((sum, signal) => sum + signal.weight, 0);
  const score =
    totalWeight === 0
      ? 0
      : Math.round(
          (signals.reduce((sum, signal) => sum + signal.weight * signal.score, 0) /
            totalWeight) *
            100,
        );

  // A fingerprint or image match is mandatory evidence: geo and time alone
  // describe half the announcements in Tashkent on any given day.
  const hasStrongEvidence = signals.some(
    (signal) =>
      (signal.name === 'textFingerprint' || signal.name === 'imageHash') &&
      signal.score >= 0.6,
  );

  let verdict: DedupeVerdict = 'unique';
  if (blockers.length === 0 && hasStrongEvidence && score >= DUPLICATE_THRESHOLD) {
    verdict = 'duplicate';
  } else if (hasStrongEvidence && score >= REVIEW_THRESHOLD) {
    verdict = 'review';
  }

  return { verdict, score, signals, reasons, blockers };
}

/**
 * Cluster confidence shown in the UI next to "N manbada topildi".
 * Independent sources reporting the same item is stronger evidence than the
 * same channel reposting it, so distinct sources add a bonus.
 */
export function clusterConfidence(members: {
  pairScores: number[];
  distinctSources: number;
}): number {
  const { pairScores, distinctSources } = members;
  if (pairScores.length === 0) return 0;

  const average =
    pairScores.reduce((sum, value) => sum + value, 0) / pairScores.length;
  const sourceBonus = Math.min(20, Math.max(0, distinctSources - 1) * 10);
  return Math.min(100, Math.round(average * 0.8 + sourceBonus));
}

export const DEDUPE_VERSION = 'dedupe-v1';
