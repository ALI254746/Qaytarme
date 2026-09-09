import {
  calculateExplainableMatchScore,
  calculateTokenSimilarity,
  haversineDistanceKm,
} from './matching-score.util';

describe('Explainable matching score', () => {
  it('matches Cyrillic and Latin Uzbek item descriptions', () => {
    expect(calculateTokenSimilarity('Қора сумка', 'qora sumka')).toBe(1);
  });

  it('calculates map distance with the Haversine formula', () => {
    const distance = haversineDistanceKm(
      { lat: 41.2995, lng: 69.2401 },
      { lat: 41.305, lng: 69.248 },
    );

    expect(distance).not.toBeNull();
    expect(distance!).toBeGreaterThan(0);
    expect(distance!).toBeLessThan(3);
  });

  it('returns null for missing or placeholder coordinates', () => {
    expect(haversineDistanceKm(undefined, undefined)).toBeNull();
    expect(
      haversineDistanceKm(
        { lat: 0, lng: 0 },
        { lat: 41.2995, lng: 69.2401 },
      ),
    ).toBeNull();
  });

  it('produces a high, explainable score for a plausible pair', () => {
    const result = calculateExplainableMatchScore(
      {
        category: 'wallet',
        itemType: 'Қора сумка',
        itemName: 'Hujjatli qora sumka',
        itemDescription: 'Chilonzor metro yonida yoqolgan',
        region: 'Tashkent',
        district: 'Chilanzar',
        location: 'Chilonzor metro',
        coordinates: { lat: 41.275, lng: 69.203 },
        date: '2026-09-09T18:00:00Z',
      },
      {
        category: 'wallet',
        itemType: 'qora sumka',
        itemName: 'Qora sumka va hujjatlar',
        itemDescription: 'Chilonzor metrosi oldida topildi',
        region: 'Toshkent',
        district: 'Chilonzor',
        location: 'Chilonzor metro oldi',
        coordinates: { lat: 41.277, lng: 69.205 },
        date: '2026-09-10T08:00:00Z',
      },
    );

    expect(result.eligible).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.confidence).toMatch(/high/);
    expect(result.components).toHaveLength(6);
    expect(result.components.find((part) => part.key === 'distance')?.evidence).toMatch(/km/);
  });

  it('blocks unrelated categories and item types from becoming matches', () => {
    const result = calculateExplainableMatchScore(
      { category: 'pets', itemType: 'mushuk', location: 'Toshkent' },
      { category: 'tech', itemType: 'telefon', location: 'Toshkent' },
    );

    expect(result.eligible).toBe(false);
    expect(result.score).toBeLessThan(40);
    expect(result.confidence).toBe('low');
  });
});
