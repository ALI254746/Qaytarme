import { inferCategoryFromText, normalizeCategory, resolveCategory } from './category.util';
import { resolveAnnouncementCategory } from './announcement-category.util';

describe('Category resolution', () => {
  it('keeps a valid category as provided', () => {
    expect(resolveCategory('docs')).toEqual({
      category: 'docs',
      source: 'provided',
      confident: true,
    });
  });

  it('maps local wording to a standard category', () => {
    expect(resolveCategory('pasport').category).toBe('docs');
    expect(resolveCategory('hamyon').category).toBe('wallet');
    expect(resolveCategory('kalit').category).toBe('keys');
  });

  it('infers the category from Uzbek announcement text', () => {
    expect(inferCategoryFromText('Chilonzorda pasport topib olindi')).toBe('docs');
    expect(inferCategoryFromText("Mashina kaliti va brelogi yo'qoldi")).toBe('keys');
    expect(inferCategoryFromText('Qora hamyon topildi')).toBe('wallet');
    expect(inferCategoryFromText('Оқ мушук йўқолди')).toBe('pets');
  });

  it('does not silently fall back to tech when the text describes a document', () => {
    expect(normalizeCategory('unknown-category', 'Texnik pasport (BTS) topildi')).toBe('docs');
  });

  it('still falls back to tech when nothing can be inferred', () => {
    const resolution = resolveCategory('something-else', 'aniqlanmagan buyum');
    expect(resolution.category).toBe('tech');
    expect(resolution.confident).toBe(false);
  });

  it('corrects a low confidence tech answer using the announcement text', () => {
    const result = resolveAnnouncementCategory('tech', "Pasport yo'qoldi, AA 1234567");

    expect(result.category).toBe('docs');
    expect(result.corrected).toBe(true);
    expect(result.suggestedCategory).toBe('tech');
  });

  it('keeps tech when the text really is about electronics', () => {
    const result = resolveAnnouncementCategory('tech', 'Qora Samsung telefon topildi');

    expect(result.category).toBe('tech');
    expect(result.corrected).toBe(false);
  });
});
