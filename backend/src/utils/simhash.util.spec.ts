import {
  buildShingles,
  extractTokens,
  fingerprintSimilarity,
  hammingDistance,
  jaccardSimilarity,
  simhash,
} from './simhash.util';

describe('simhash fingerprinting', () => {
  const original =
    'Chilonzor 9-mavzeda qora rangli Samsung telefon topildi, egasi murojaat qilsin';

  it('produces a stable 16 character hex fingerprint', () => {
    const fingerprint = simhash(original);
    expect(fingerprint).toMatch(/^[0-9a-f]{16}$/);
    expect(simhash(original)).toBe(fingerprint);
  });

  it('keeps the fingerprint close for a lightly edited repost', () => {
    const repost =
      'Chilonzor 9 mavzeda qora rangli Samsung telefon topildi. Egasi murojaat qilsin! Tel: 998901234567';

    const distance = hammingDistance(simhash(original), simhash(repost));
    expect(distance).not.toBeNull();
    expect(distance as number).toBeLessThanOrEqual(12);
  });

  it('treats a cyrillic repost of the same post as near duplicate', () => {
    const cyrillic =
      'Чилонзор 9-мавзеда қора рангли Samsung телефон топилди, эгаси мурожаат қилсин';

    const distance = hammingDistance(simhash(original), simhash(cyrillic));
    expect(distance as number).toBeLessThanOrEqual(6);
  });

  it('separates a genuinely different announcement', () => {
    const other =
      'Yunusobodda qizil rangda ayollar sumkasi yoqoldi, ichida pasport bor edi';

    const distance = hammingDistance(simhash(original), simhash(other));
    expect(distance as number).toBeGreaterThan(12);
  });

  it('returns null instead of a false match when a fingerprint is missing', () => {
    expect(hammingDistance(simhash(original), '')).toBeNull();
    expect(hammingDistance(undefined, undefined)).toBeNull();
    expect(hammingDistance('zzzz', simhash(original))).toBeNull();
    expect(fingerprintSimilarity(null, null)).toBeNull();
  });

  it('returns an empty fingerprint for text without signal', () => {
    expect(simhash('')).toBe('');
    expect(simhash('iltimos aloqa tel')).toBe('');
  });

  it('drops stop words and short tokens', () => {
    const tokens = extractTokens('Iltimos telefon topildi qora Samsung');
    expect(tokens).toContain('qora');
    expect(tokens).toContain('samsung');
    expect(tokens).not.toContain('iltimos');
    expect(tokens).not.toContain('topildi');
  });

  it('builds word shingles and keeps short texts usable', () => {
    expect(buildShingles(['qora', 'samsung', 'telefon', 'chilonzor'])).toEqual([
      'qora samsung telefon',
      'samsung telefon chilonzor',
    ]);
    expect(buildShingles(['qora', 'sumka'])).toEqual(['qora sumka']);
    expect(buildShingles([])).toEqual([]);
  });

  it('scores token overlap with jaccard similarity', () => {
    expect(jaccardSimilarity(original, original)).toBe(1);
    expect(
      jaccardSimilarity(original, 'Yunusobodda mushuk yoqoldi'),
    ).toBeLessThan(0.2);
    expect(jaccardSimilarity('', original)).toBe(0);
  });
});
