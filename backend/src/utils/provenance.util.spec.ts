import { buildProvenance, createContentHash } from './provenance.util';

describe('OSINT source provenance', () => {
  const collectedAt = new Date('2026-09-10T00:00:00Z');

  it('creates normalized Telegram evidence metadata', () => {
    const provenance = buildProvenance(
      {
        sourceType: 'telegram',
        sourceUrl: 'https://t.me/topilmalar_uz/123',
        sourceName: 'Topilmalar UZ',
        channelUsername: '@Topilmalar_UZ',
        messageIds: [123, '124', 123],
        publishedAt: '2026-09-09T18:00:00Z',
        originalText: 'Қора сумка ТОПИЛДИ!',
        parserVersion: 'telegram-parser-v1',
      },
      '',
      collectedAt,
    );

    expect(provenance.channelUsername).toBe('topilmalar_uz');
    expect(provenance.messageIds).toEqual(['123', '124']);
    expect(provenance.normalizedText).toBe('qora sumka topildi');
    expect(provenance.contentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(provenance.collectedAt).toEqual(collectedAt);
  });

  it('generates the same hash for the same canonical evidence', () => {
    const first = buildProvenance(
      { sourceType: 'telegram', messageIds: [2, 1], originalText: 'Pasport topildi' },
      '',
      collectedAt,
    );
    const second = buildProvenance(
      { sourceType: 'telegram', messageIds: [1, 2], originalText: 'Паспорт топилди' },
      '',
      collectedAt,
    );

    expect(first.contentHash).toBe(second.contentHash);
  });

  it('changes the hash when evidence changes', () => {
    const base = createContentHash({
      sourceType: 'web',
      normalizedText: 'qora telefon',
    });
    const changed = createContentHash({
      sourceType: 'web',
      normalizedText: 'oq telefon',
    });

    expect(base).not.toBe(changed);
  });

  it('rejects unsafe source URL protocols', () => {
    const provenance = buildProvenance(
      { sourceType: 'unknown', sourceUrl: 'javascript:alert(1)' },
      'test',
      collectedAt,
    );

    expect(provenance.sourceUrl).toBeUndefined();
  });

  it('uses fallback text and safe defaults for manually created records', () => {
    const provenance = buildProvenance({}, 'Yo‘qolgan kalit', collectedAt);

    expect(provenance.sourceType).toBe('unknown');
    expect(provenance.originalText).toBe('Yo‘qolgan kalit');
    expect(provenance.normalizedText).toBe("yo'qolgan kalit");
    expect(provenance.parserVersion).toBe('provenance-v1');
  });
});
