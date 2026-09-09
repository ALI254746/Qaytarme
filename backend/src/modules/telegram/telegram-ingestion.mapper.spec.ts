import { mapTelegramAnnouncement } from './telegram-ingestion.mapper';

describe('mapTelegramAnnouncement', () => {
  it('keeps parsed fields and attaches verifiable Telegram evidence', () => {
    const result = mapTelegramAnnouncement(
      {
        title: 'Samsung S23', itemType: 'Telefon', description: 'Telefon topildi',
        itemDescription: 'Telefon topildi', status: 'found', category: 'tech',
        region: 'Toshkent', district: 'Chilonzor', location: 'Chilonzor metro',
        date: '2026-09-10', phone: '', telegram: '@contact', image: null,
        coordinates: { lat: 41.28, lng: 69.2 },
      },
      {
        messages: [{ id: 991, date: 1788980100 }, { id: 992, date: 1788980160 }],
        chatTitle: 'Topilmalar', chatUsername: '@topilmalar_uz',
        originalText: 'Telefon topildi',
        collectedAt: new Date('2026-09-09T22:20:00Z'),
      },
    );

    expect(result.title).toBe('Samsung S23');
    expect(result.provenance.sourceType).toBe('telegram');
    expect(result.provenance.messageIds).toEqual(['991', '992']);
    expect(result.provenance.sourceUrl).toBe('https://t.me/topilmalar_uz/991');
    expect(result.provenance.contentHash).toMatch(/^[a-f0-9]{64}$/);
  });
});
