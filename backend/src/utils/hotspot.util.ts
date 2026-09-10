/**
 * Geographic and temporal intelligence.
 *
 * The goal is to answer questions like "where do phones disappear in
 * Tashkent, and when?". The hard part is not the counting, it is refusing to
 * report noise: with a few hundred announcements a month, three extra posts
 * in one district look like a 300% spike but mean nothing.
 *
 * Every function here is pure, so the rules can be tested without a
 * database.
 */

export type IncidentPoint = {
  id?: string;
  lat: number;
  lng: number;
  category?: string;
  status?: string;
  region?: string;
  district?: string;
  occurredAt?: Date | string | null;
};

export type HotspotCell = {
  cellKey: string;
  centerLat: number;
  centerLng: number;
  count: number;
  /** Share of all incidents that fall into this cell (0..1). */
  share: number;
  /** How many times denser than the average populated cell. */
  intensity: number;
  topCategory: string | null;
  categories: Record<string, number>;
  districts: string[];
  significant: boolean;
};

export type TemporalProfile = {
  /** Counts per hour of day, index 0..23. */
  byHour: number[];
  /** Counts per weekday, index 0 = Sunday. */
  byWeekday: number[];
  peakHour: number | null;
  peakWeekday: number | null;
  /** Incidents without a trustworthy timestamp. */
  unknownTime: number;
};

export type TrendDirection = 'rising' | 'falling' | 'stable' | 'insufficient_data';

export type TrendResult = {
  key: string;
  current: number;
  previous: number;
  changePercent: number | null;
  direction: TrendDirection;
  significant: boolean;
  note: string;
};

/**
 * Grid size in degrees. 0.01 degrees is roughly 1.1 km north-south and about
 * 0.83 km east-west at Tashkent's latitude: small enough to point at a
 * neighbourhood, large enough not to expose an individual address.
 */
export const DEFAULT_CELL_SIZE = 0.01;
/** A cell below this count is a coincidence, not a hotspot. */
export const MIN_HOTSPOT_COUNT = 5;
/** A trend needs this many incidents in the current window to be reported. */
export const MIN_TREND_COUNT = 8;
/** Relative change below this is treated as normal fluctuation. */
export const TREND_NOISE_BAND = 0.2;

export const HOTSPOT_VERSION = 'hotspot-v1';

function toDate(value?: Date | string | null): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function snap(value: number, cellSize: number): number {
  return Math.floor(value / cellSize) * cellSize;
}

export function cellKeyFor(
  lat: number,
  lng: number,
  cellSize = DEFAULT_CELL_SIZE,
): string {
  const snappedLat = snap(lat, cellSize);
  const snappedLng = snap(lng, cellSize);
  return `${snappedLat.toFixed(4)}:${snappedLng.toFixed(4)}`;
}

/**
 * Groups incidents into grid cells and marks the ones dense enough to be
 * called a hotspot. Cells below MIN_HOTSPOT_COUNT are still returned (the
 * heatmap needs them) but never marked significant.
 */
export function buildHotspots(
  incidents: IncidentPoint[],
  options: { cellSize?: number; minCount?: number } = {},
): HotspotCell[] {
  const cellSize = options.cellSize ?? DEFAULT_CELL_SIZE;
  const minCount = options.minCount ?? MIN_HOTSPOT_COUNT;

  const buckets = new Map<
    string,
    {
      count: number;
      latSum: number;
      lngSum: number;
      categories: Record<string, number>;
      districts: Set<string>;
    }
  >();

  for (const incident of incidents) {
    if (!Number.isFinite(incident.lat) || !Number.isFinite(incident.lng)) continue;

    const key = cellKeyFor(incident.lat, incident.lng, cellSize);
    const bucket =
      buckets.get(key) ??
      {
        count: 0,
        latSum: 0,
        lngSum: 0,
        categories: {} as Record<string, number>,
        districts: new Set<string>(),
      };

    bucket.count += 1;
    bucket.latSum += incident.lat;
    bucket.lngSum += incident.lng;

    const category = incident.category ?? 'unknown';
    bucket.categories[category] = (bucket.categories[category] ?? 0) + 1;
    if (incident.district) bucket.districts.add(incident.district);

    buckets.set(key, bucket);
  }

  const total = Array.from(buckets.values()).reduce(
    (sum, bucket) => sum + bucket.count,
    0,
  );
  const average = buckets.size === 0 ? 0 : total / buckets.size;

  const cells: HotspotCell[] = Array.from(buckets.entries()).map(
    ([cellKey, bucket]) => {
      const topCategory =
        Object.entries(bucket.categories).sort((a, b) => b[1] - a[1])[0]?.[0] ??
        null;

      return {
        cellKey,
        // Average of the real points, not the grid corner, so the marker sits
        // where the incidents actually are.
        centerLat: bucket.latSum / bucket.count,
        centerLng: bucket.lngSum / bucket.count,
        count: bucket.count,
        share: total === 0 ? 0 : bucket.count / total,
        intensity: average === 0 ? 0 : bucket.count / average,
        topCategory,
        categories: bucket.categories,
        districts: Array.from(bucket.districts),
        significant: bucket.count >= minCount && bucket.count > average,
      };
    },
  );

  return cells.sort((left, right) => right.count - left.count);
}

/**
 * Hour of day and weekday profile.
 * Incidents without a trustworthy `occurredAt` are counted separately
 * instead of being placed at midnight, which would invent a fake peak.
 */
export function buildTemporalProfile(
  incidents: IncidentPoint[],
  timeZoneOffsetHours = 5,
): TemporalProfile {
  const byHour = new Array(24).fill(0);
  const byWeekday = new Array(7).fill(0);
  let unknownTime = 0;

  for (const incident of incidents) {
    const date = toDate(incident.occurredAt);
    if (!date) {
      unknownTime += 1;
      continue;
    }

    // Stored timestamps are UTC; people think in local time.
    const local = new Date(date.getTime() + timeZoneOffsetHours * 3_600_000);
    byHour[local.getUTCHours()] += 1;
    byWeekday[local.getUTCDay()] += 1;
  }

  const hourTotal = byHour.reduce((sum, value) => sum + value, 0);
  const peakHour =
    hourTotal === 0 ? null : byHour.indexOf(Math.max(...byHour));
  const peakWeekday =
    hourTotal === 0 ? null : byWeekday.indexOf(Math.max(...byWeekday));

  return { byHour, byWeekday, peakHour, peakWeekday, unknownTime };
}

/**
 * Compares a window against the previous one.
 *
 * Two guards keep this honest:
 *  - a minimum volume, so 1 -> 3 is never reported as +200%;
 *  - a noise band, so small fluctuations stay "stable".
 */
export function compareWindows(
  key: string,
  current: number,
  previous: number,
  options: { minCount?: number; noiseBand?: number } = {},
): TrendResult {
  const minCount = options.minCount ?? MIN_TREND_COUNT;
  const noiseBand = options.noiseBand ?? TREND_NOISE_BAND;

  if (current + previous < minCount) {
    return {
      key,
      current,
      previous,
      changePercent: null,
      direction: 'insufficient_data',
      significant: false,
      note: "Xulosa chiqarish uchun ma'lumot kam",
    };
  }

  if (previous === 0) {
    return {
      key,
      current,
      previous,
      changePercent: null,
      direction: current >= minCount ? 'rising' : 'insufficient_data',
      significant: current >= minCount,
      note: 'Oldingi davrda umuman qayd etilmagan',
    };
  }

  const change = (current - previous) / previous;
  const direction: TrendDirection =
    Math.abs(change) < noiseBand ? 'stable' : change > 0 ? 'rising' : 'falling';

  // A rough Poisson check: a difference smaller than the natural spread of
  // counts is not evidence of anything.
  const spread = Math.sqrt(previous);
  const significant =
    direction !== 'stable' && Math.abs(current - previous) > 2 * spread;

  return {
    key,
    current,
    previous,
    changePercent: Math.round(change * 100),
    direction,
    significant,
    note: significant
      ? "O'zgarish tasodifiy tebranishdan katta"
      : "O'zgarish odatdagi tebranish doirasida",
  };
}

/** Convenience wrapper: trend per key (category, district, ...). */
export function compareGroups(
  current: Record<string, number>,
  previous: Record<string, number>,
  options: { minCount?: number; noiseBand?: number } = {},
): TrendResult[] {
  const keys = new Set([...Object.keys(current), ...Object.keys(previous)]);

  return Array.from(keys)
    .map((key) =>
      compareWindows(key, current[key] ?? 0, previous[key] ?? 0, options),
    )
    .sort((left, right) => {
      if (left.significant !== right.significant) return left.significant ? -1 : 1;
      return Math.abs(right.changePercent ?? 0) - Math.abs(left.changePercent ?? 0);
    });
}

/** Uzbek weekday names, index 0 = Sunday, matching getUTCDay(). */
export const WEEKDAY_NAMES = [
  'Yakshanba',
  'Dushanba',
  'Seshanba',
  'Chorshanba',
  'Payshanba',
  'Juma',
  'Shanba',
];
