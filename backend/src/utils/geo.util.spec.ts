import {
  distanceKm,
  fromGeoPoint,
  isInUzbekistan,
  parseOccurredAt,
  toGeoPoint,
} from './geo.util';

describe('Geospatial normalisation', () => {
  it('converts lat/lng into GeoJSON longitude-first order', () => {
    expect(toGeoPoint({ lat: 41.3111, lng: 69.2797 })).toEqual({
      type: 'Point',
      coordinates: [69.2797, 41.3111],
    });
  });

  it('accepts numeric strings coming from multipart form data', () => {
    expect(toGeoPoint({ lat: '41.3111', lng: '69.2797' })?.coordinates).toEqual([
      69.2797, 41.3111,
    ]);
  });

  it('rejects missing, invalid, null-island and out of range coordinates', () => {
    expect(toGeoPoint(null)).toBeNull();
    expect(toGeoPoint({ lat: 41.3 })).toBeNull();
    expect(toGeoPoint({ lat: 'salom', lng: '69' })).toBeNull();
    expect(toGeoPoint({ lat: 0, lng: 0 })).toBeNull();
    expect(toGeoPoint({ lat: 120, lng: 69 })).toBeNull();
  });

  it('round-trips back to the API shape', () => {
    const point = toGeoPoint({ lat: 41.3111, lng: 69.2797 });

    expect(fromGeoPoint(point)).toEqual({ lat: 41.3111, lng: 69.2797 });
  });

  it('knows which coordinates are inside Uzbekistan', () => {
    expect(isInUzbekistan(41.3111, 69.2797)).toBe(true);
    expect(isInUzbekistan(48.85, 2.35)).toBe(false);
  });

  it('measures distance between two Tashkent points', () => {
    const distance = distanceKm(
      { lat: 41.3111, lng: 69.2797 },
      { lat: 41.3255, lng: 69.2286 },
    );

    expect(distance).toBeGreaterThan(4);
    expect(distance).toBeLessThan(6);
  });
});

describe('Temporal normalisation', () => {
  it('parses ISO dates', () => {
    expect(parseOccurredAt('2026-09-10')?.toISOString()).toBe(
      '2026-09-10T00:00:00.000Z',
    );
  });

  it('parses the day-first format used in Telegram posts', () => {
    expect(parseOccurredAt('10.09.2026')?.toISOString()).toBe(
      '2026-09-10T00:00:00.000Z',
    );
    expect(parseOccurredAt('10/09/2026')?.toISOString()).toBe(
      '2026-09-10T00:00:00.000Z',
    );
  });

  it('returns null instead of inventing a date', () => {
    expect(parseOccurredAt('kecha')).toBeNull();
    expect(parseOccurredAt('')).toBeNull();
    expect(parseOccurredAt('2026-13-45')).toBeNull();
    expect(parseOccurredAt('32.09.2026')).toBeNull();
    expect(parseOccurredAt(undefined)).toBeNull();
  });

  it('keeps a valid Date instance as is', () => {
    const date = new Date('2026-09-10T08:30:00.000Z');

    expect(parseOccurredAt(date)).toBe(date);
    expect(parseOccurredAt(new Date('invalid'))).toBeNull();
  });
});
