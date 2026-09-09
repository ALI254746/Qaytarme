import {
  normalizeUzbekText,
  tokenizeUzbekText,
  transliterateCyrillicToLatin,
} from './text-normalization.util';

describe('Uzbek text normalization', () => {
  it('transliterates Uzbek Cyrillic characters', () => {
    expect(transliterateCyrillicToLatin('Йўқолган ҳужжат')).toBe(
      "Yo'qolgan hujjat",
    );
  });

  it('normalizes apostrophes, punctuation and whitespace', () => {
    expect(normalizeUzbekText('  YO‘QOLGAN,   OʼZBEKISTON!  ')).toBe(
      "yo'qolgan o'zbekiston",
    );
  });

  it('maps common location spelling variants', () => {
    expect(normalizeUzbekText('Tashkent, Chilanzar')).toBe(
      'toshkent chilonzor',
    );
  });

  it('maps common name spelling variants conservatively', () => {
    expect(normalizeUzbekText('Khojiakbar')).toBe('hojiakbar');
    expect(normalizeUzbekText('Xojiakbar')).toBe('hojiakbar');
  });

  it('keeps digits useful for dates, models and safe partial identifiers', () => {
    expect(normalizeUzbekText('iPhone-13, 25/09')).toBe('iphone 13 25 09');
  });

  it('returns unique normalized tokens', () => {
    expect(tokenizeUzbekText('Тошкент Toshkent telefon telefon')).toEqual([
      'toshkent',
      'telefon',
    ]);
  });

  it('handles empty input', () => {
    expect(normalizeUzbekText('')).toBe('');
    expect(tokenizeUzbekText('')).toEqual([]);
  });
});
