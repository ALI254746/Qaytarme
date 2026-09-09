import { mapTelegramAnnouncement } from '../modules/telegram/telegram-ingestion.mapper';
import { buildTelegramProvenance } from './telegram-provenance.util';

describe('buildTelegramProvenance', () => {
  it('builds auditable evidence for a Telegram batch', () => {
    const collectedAt = new Date('2026-09-10T03:00:00+05:00');
    const provenance = buildTelegramProvenance(
      [
        { id: 124, date: 1788980100 },
        { id: 125, date: 1788980160 },
        { id: 124, date: 1788980100 },
      ],
      {
        chatTitle: 'Topilmalar Toshkent',
        chatUsername: '@Topilmalar_UZ',
        originalText: 'Qora Samsung S23 topildi',
        collectedAt,
      },
    );

    expect(provenance.sourceType).toBe('telegram');
    expect(provenance.channelUsername).toBe('topilmalar_uz');
    expect(provenance.sourceUrl).toBe('https://t.me/topilmalar_uz/124');
    expect(provenance.messageIds).toEqual(['124', '125']);
    expect(provenance.publishedAt).toBeInstanceOf(Date);
    expect(provenance.collectedAt).toEqual(collectedAt);
    expect(provenance.originalText).toBe('Qora Samsung S23 topildi');
    expect(provenance.parserVersion).toBe('telegram-parser-v1');
    expect(provenance.contentHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('works safely when a channel has no public username', () => {
    const provenance = buildTelegramProvenance(
      [{ id: 42, date: new Date('2026-09-09T18:00:00Z') }],
      { chatTitle: 'Private source', originalText: 'Kalit topildi' },
    );

    expect(provenance.sourceUrl).toBeUndefined();
    expect(provenance.messageIds).toEqual(['42']);
    expect(provenance.sourceName).toBe('Private source');
  });

  it('maps parsed announcement fields with Telegram evidence', () => {
    const result = mapTelegramAnnouncement(
      {
        title: 'Samsung S23', itemType: 'Telefon', description: 'Telefon topildi',
        itemDescription: 'Telefon topildi', status: 'found', category: 'tech',
        region: 'Toshkent', district: 'Chilonzor', location: 'Chilonzor metro',
        date: '2026-09-10', phone: '', telegram: '@contact', image: null,
        coordinates: { lat: 41.28, lng: 69.2 },
      },
      {
        messages: [{ id: 991, date: 1788980100 }],
        chatTitle: 'Topilmalar', chatUsername: '@topilmalar_uz',
        originalText: 'Telefon topildi',
      },
    );

    expect(result.title).toBe('Samsung S23');
    expect(result.provenance.sourceType).toBe('telegram');
    expect(result.provenance.sourceUrl).toBe('https://t.me/topilmalar_uz/991');
    expect(result.provenance.contentHash).toMatch(/^[a-f0-9]{64}$/);
  });
});
