/**
 * Geospatial and temporal normalisation.
 *
 * The public API keeps the historical `{ lat, lng }` shape, while the
 * database additionally stores a GeoJSON point (`geo`) and a real timestamp
 * (`occurredAt`). Those two fields are what makes radius search, hotspot
 * detection and trend analysis possible.
 */

export type LatLng = {
  lat?: number | string | null;
  lng?: number | string | null;
} | null | undefined;

export type GeoPoint = {
  type: 'Point';
  /** GeoJSON order is [longitude, latitude], not [lat, lng]. */
  coordinates: [number, number];
};

function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** Uzbekistan bounding box, used to reject obviously broken coordinates. */
const UZ_BOUNDS = { minLat: 37, maxLat: 46, minLng: 55.9, maxLng: 73.2 };

export function isInUzbekistan(lat: number, lng: number): boolean {
  return (
    lat >= UZ_BOUNDS.minLat &&
    lat <= UZ_BOUNDS.maxLat &&
    lng >= UZ_BOUNDS.minLng &&
    lng <= UZ_BOUNDS.maxLng
  );
}

/**
 * Converts `{ lat, lng }` into a GeoJSON point.
 * Returns null for missing, non numeric, out of range or (0,0) coordinates.
 */
export function toGeoPoint(coordinates: LatLng): GeoPoint | null {
  if (!coordinates) return null;

  const lat = toNumber(coordinates.lat);
  const lng = toNumber(coordinates.lng);
  if (lat === null || lng === null) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  if (lat === 0 && lng === 0) return null;

  return { type: 'Point', coordinates: [lng, lat] };
}

export function fromGeoPoint(geo: GeoPoint | null | undefined) {
  if (!geo || !Array.isArray(geo.coordinates)) return null;
  const [lng, lat] = geo.coordinates;
  return { lat, lng };
}

/** Haversine distance in kilometres. */
export function distanceKm(
  first: { lat: number; lng: number },
  second: { lat: number; lng: number },
): number {
  const earthRadiusKm = 6371;
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const deltaLat = toRad(second.lat - first.lat);
  const deltaLng = toRad(second.lng - first.lng);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRad(first.lat)) *
      Math.cos(toRad(second.lat)) *
      Math.sin(deltaLng / 2) ** 2;

  return earthRadiusKm * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}

const DATE_PATTERNS: Array<{
  regex: RegExp;
  build: (groups: string[]) => [number, number, number];
}> = [
  {
    // 2026-09-10 or 2026/09/10
    regex: /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/,
    build: ([year, month, day]) => [Number(year), Number(month), Number(day)],
  },
  {
    // 10.09.2026, 10/09/2026 or 10-09-2026
    regex: /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/,
    build: ([day, month, year]) => [Number(year), Number(month), Number(day)],
  },
];

/**
 * Parses the free-form `date` field written by users, bots and channels.
 * Returns null when the value cannot be trusted, so callers can fall back to
 * the collection timestamp instead of storing an invented date.
 */
export function parseOccurredAt(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  for (const { regex, build } of DATE_PATTERNS) {
    const match = trimmed.match(regex);
    if (!match) continue;

    const [year, month, day] = build(match.slice(1));
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;

    const parsed = new Date(Date.UTC(year, month - 1, day));
    if (
      parsed.getUTCFullYear() !== year ||
      parsed.getUTCMonth() !== month - 1 ||
      parsed.getUTCDate() !== day
    ) {
      return null;
    }
    return parsed;
  }

  const isoLike = new Date(trimmed);
  if (!Number.isNaN(isoLike.getTime()) && /^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
    return isoLike;
  }

  return null;
}
