/**
 * Source reliability scoring.
 *
 * In OSINT the answer to "is this true?" usually starts with "who said it,
 * and how often were they right before?". This module turns the raw counters
 * we collect per channel into an explainable 0-100 score.
 *
 * Two rules shape the whole design:
 *  - Small samples must not produce confident scores. A channel with 3 posts
 *    and 3 successes is not a 100% source, so every rate goes through a
 *    Wilson lower bound.
 *  - Volume is not quality. A channel posting 500 reposts a week is worse
 *    than one posting 20 original, complete announcements.
 */

export type SourceStats = {
  /** Channel username, web, bot, ... */
  sourceKey: string;
  /** Announcements collected from this source. */
  total: number;
  /** Announcements that were reposts of something we already had. */
  duplicates: number;
  /** Announcements rejected by moderation (spam, ads, unrelated). */
  rejected: number;
  /** Announcements that ended with a confirmed handover. */
  returned: number;
  /** Announcements that produced at least one accepted match. */
  matched: number;
  /** Announcements containing a photo. */
  withImage: number;
  /** Announcements containing a usable location. */
  withLocation: number;
  /** Announcements containing a parseable date. */
  withDate: number;
  /** Announcements containing any contact detail. */
  withContact: number;
  /** Median minutes between the incident and the post, when known. */
  medianDelayMinutes?: number | null;
  /** Last time anything was collected from this source. */
  lastSeenAt?: Date | string | null;
};

export type ReliabilityTier =
  | 'trusted'
  | 'reliable'
  | 'mixed'
  | 'low'
  | 'insufficient_data';

export type ReliabilityFactor = {
  name: string;
  weight: number;
  /** 0..1 */
  score: number;
  detail: string;
};

export type ReliabilityResult = {
  sourceKey: string;
  score: number;
  tier: ReliabilityTier;
  sampleSize: number;
  factors: ReliabilityFactor[];
  strengths: string[];
  warnings: string[];
};

/** Below this many announcements we refuse to rank a source. */
export const MIN_SAMPLE_SIZE = 10;
export const TRUSTED_SCORE = 80;
export const RELIABLE_SCORE = 65;
export const MIXED_SCORE = 45;
/** A source idle for longer than this is treated as stale. */
export const STALE_AFTER_DAYS = 30;

export const RELIABILITY_VERSION = 'reliability-v1';

/**
 * Wilson score lower bound (95%).
 * Turns "3 out of 3" into a modest estimate instead of a perfect one, which
 * is exactly what protects a new channel from being over-trusted.
 */
export function wilsonLowerBound(successes: number, total: number): number {
  if (total <= 0) return 0;

  const z = 1.96;
  const phat = Math.min(1, Math.max(0, successes / total));
  const denominator = 1 + (z * z) / total;
  const centre = phat + (z * z) / (2 * total);
  const margin =
    z * Math.sqrt((phat * (1 - phat) + (z * z) / (4 * total)) / total);

  return Math.max(0, (centre - margin) / denominator);
}

function ratio(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(1, Math.max(0, part / total));
}

function daysSince(value?: Date | string | null): number | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return (Date.now() - date.getTime()) / 86_400_000;
}

/**
 * Combines the counters into an explainable score.
 * Every factor keeps its own detail string, so the admin panel can show why
 * a channel is rated the way it is instead of an unexplained number.
 */
export function scoreSource(stats: SourceStats): ReliabilityResult {
  const total = Math.max(0, stats.total);
  const factors: ReliabilityFactor[] = [];
  const strengths: string[] = [];
  const warnings: string[] = [];

  if (total < MIN_SAMPLE_SIZE) {
    return {
      sourceKey: stats.sourceKey,
      score: 0,
      tier: 'insufficient_data',
      sampleSize: total,
      factors: [],
      strengths: [],
      warnings: [
        `Baholash uchun kam ma'lumot (${total} ta e'lon, kamida ${MIN_SAMPLE_SIZE} kerak)`,
      ],
    };
  }

  // 1. Completeness: an announcement without a photo, place or date is hard
  // to match, no matter how quickly it arrives.
  const completeness =
    (ratio(stats.withImage, total) * 0.35 +
      ratio(stats.withLocation, total) * 0.3 +
      ratio(stats.withDate, total) * 0.2 +
      ratio(stats.withContact, total) * 0.15);

  factors.push({
    name: 'completeness',
    weight: 0.3,
    score: completeness,
    detail: `Rasm ${Math.round(ratio(stats.withImage, total) * 100)}%, joy ${Math.round(
      ratio(stats.withLocation, total) * 100,
    )}%, sana ${Math.round(ratio(stats.withDate, total) * 100)}%`,
  });

  if (completeness >= 0.75) strengths.push("E'lonlar to'liq ma'lumot bilan keladi");
  if (completeness < 0.4) warnings.push("E'lonlarda rasm yoki joy ko'pincha yo'q");

  // 2. Originality: reposting other channels adds noise, not information.
  const duplicateRate = ratio(stats.duplicates, total);
  factors.push({
    name: 'originality',
    weight: 0.2,
    score: 1 - duplicateRate,
    detail: `Takror e'lonlar ${Math.round(duplicateRate * 100)}%`,
  });

  if (duplicateRate >= 0.5) {
    warnings.push(
      `E'lonlarning ${Math.round(duplicateRate * 100)}% qismi boshqa manbadan ko'chirilgan`,
    );
  } else if (duplicateRate <= 0.15) {
    strengths.push("Asosan o'ziga xos e'lonlar");
  }

  // 3. Outcome: the strongest evidence that a source is real is that its
  // announcements actually lead to returned items.
  const outcomeRate = wilsonLowerBound(stats.returned, total);
  const matchRate = wilsonLowerBound(stats.matched, total);
  const outcome = Math.min(1, outcomeRate * 3 + matchRate);

  factors.push({
    name: 'outcome',
    weight: 0.3,
    score: outcome,
    detail: `${stats.returned} ta qaytarilgan, ${stats.matched} ta moslik (${total} ta e'londan)`,
  });

  if (stats.returned > 0) {
    strengths.push(`${stats.returned} ta buyum shu manba orqali egasiga qaytdi`);
  }

  // 4. Noise: rejected by moderation means ads, scams or unrelated posts.
  const rejectRate = ratio(stats.rejected, total);
  factors.push({
    name: 'signal_quality',
    weight: 0.2,
    score: 1 - Math.min(1, rejectRate * 2),
    detail: `Rad etilgan ${Math.round(rejectRate * 100)}%`,
  });

  if (rejectRate >= 0.25) {
    warnings.push(`Har 4 ta e'londan bittasi rad etilgan (spam ehtimoli)`);
  }

  const weighted = factors.reduce(
    (sum, factor) => sum + factor.weight * factor.score,
    0,
  );
  const totalWeight = factors.reduce((sum, factor) => sum + factor.weight, 0);
  let score = Math.round((weighted / totalWeight) * 100);

  // Staleness is a penalty, not a factor: an accurate but dead channel should
  // not keep its high rating forever.
  const idleDays = daysSince(stats.lastSeenAt);
  if (idleDays !== null && idleDays > STALE_AFTER_DAYS) {
    const penalty = Math.min(25, Math.round((idleDays - STALE_AFTER_DAYS) / 3));
    score = Math.max(0, score - penalty);
    warnings.push(`Manba ${Math.round(idleDays)} kundan beri jim`);
  }

  const tier: ReliabilityTier =
    score >= TRUSTED_SCORE
      ? 'trusted'
      : score >= RELIABLE_SCORE
        ? 'reliable'
        : score >= MIXED_SCORE
          ? 'mixed'
          : 'low';

  return {
    sourceKey: stats.sourceKey,
    score,
    tier,
    sampleSize: total,
    factors,
    strengths,
    warnings,
  };
}

/**
 * Weight used by the matching pipeline: a claim from a trusted channel is
 * worth more than the same claim from a noisy one, but no source is ever
 * silenced completely.
 */
export function reliabilityWeight(result: ReliabilityResult): number {
  if (result.tier === 'insufficient_data') return 0.8;
  return Math.min(1.2, Math.max(0.6, 0.6 + (result.score / 100) * 0.6));
}

/** Uzbek label for the admin panel and the item detail page. */
export function describeTier(tier: ReliabilityTier): string {
  switch (tier) {
    case 'trusted':
      return 'Ishonchli manba';
    case 'reliable':
      return 'Yaxshi manba';
    case 'mixed':
      return "O'rtacha manba";
    case 'low':
      return 'Past sifatli manba';
    default:
      return "Ma'lumot yetarli emas";
  }
}
