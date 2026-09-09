import { matchByCategory } from './category-matcher.util';

describe('Category-specific matchers', () => {
  it('matches documents by type while redacting identifier evidence', () => {
    const result = matchByCategory(
      { category: 'docs', itemDescription: 'AA 1234567 pasport yo‘qolgan' },
      { category: 'docs', itemDescription: 'Pasport AA-1234567 topildi' },
    );

    expect(result.matcher).toBe('docs');
    expect(result.eligible).toBe(true);
    expect(result.signals.find((signal) => signal.key === 'lastFour')?.evidence).toBe('•••• 4567');
    expect(JSON.stringify(result)).not.toContain('1234567');
  });

  it('detects conflicting document types', () => {
    const result = matchByCategory(
      { category: 'docs', itemType: 'pasport' },
      { category: 'docs', itemType: 'haydovchilik guvohnomasi' },
    );

    expect(result.eligible).toBe(false);
    expect(result.conflicts).toContain('Hujjat turi mos emas');
  });

  it('matches technology by brand, model, color and storage', () => {
    const result = matchByCategory(
      { category: 'tech', itemDescription: 'Qora Samsung Galaxy S23 256 GB' },
      { category: 'tech', itemDescription: 'samsung s23 qora rang 256gb topildi' },
    );

    expect(result.matcher).toBe('tech');
    expect(result.eligible).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(80);
  });

  it('matches bank cards without exposing the full number', () => {
    const result = matchByCategory(
      { category: 'wallet', itemDescription: 'Humo 9860 1234 5678 4321 karta' },
      { category: 'wallet', itemDescription: 'HUMO karta, oxiri 4321' },
    );

    expect(result.matcher).toBe('wallet');
    expect(result.eligible).toBe(true);
    expect(result.signals.find((signal) => signal.key === 'lastFour')?.evidence).toBe('•••• 4321');
    expect(JSON.stringify(result)).not.toContain('9860123456784321');
  });

  it('matches keys by count, vehicle and key fob', () => {
    const result = matchByCategory(
      { category: 'keys', itemDescription: '2 ta Cobalt kaliti va qora brelok' },
      { category: 'keys', itemDescription: 'Cobalt uchun 2 dona kalit, pulti bor' },
    );

    expect(result.matcher).toBe('keys');
    expect(result.eligible).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(70);
  });

  it('rejects different categories before category-specific scoring', () => {
    const result = matchByCategory(
      { category: 'pets', itemType: 'mushuk' },
      { category: 'tech', itemType: 'telefon' },
    );

    expect(result.eligible).toBe(false);
    expect(result.score).toBe(0);
    expect(result.conflicts).toContain('Kategoriya mos emas');
  });

  it('uses a generic fallback for future categories', () => {
    const result = matchByCategory(
      { category: 'pets', itemType: 'oq mushuk', itemDescription: 'oq mushuk' },
      { category: 'pets', itemType: 'оқ мушук', itemDescription: 'oq mushuk' },
    );

    expect(result.matcher).toBe('generic');
    expect(result.eligible).toBe(true);
  });
});
