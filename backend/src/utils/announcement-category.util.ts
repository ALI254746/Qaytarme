import {
  Category,
  CategoryResolution,
  DEFAULT_CATEGORY,
  inferCategoryFromText,
  resolveCategory,
} from './category.util';

export type AnnouncementCategoryResult = CategoryResolution & {
  /** Category originally suggested by the AI or the client, when usable. */
  suggestedCategory?: string;
  /** True when announcement text overruled the suggested category. */
  corrected: boolean;
};

export function buildAnnouncementText(item: {
  itemType?: string | null;
  itemName?: string | null;
  itemDescription?: string | null;
  description?: string | null;
  title?: string | null;
}): string {
  return [item.title, item.itemType, item.itemName, item.itemDescription, item.description]
    .filter((value): value is string => Boolean(value && value.trim()))
    .join(' ');
}

/**
 * Resolves the category of an announcement.
 *
 * The AI vision step frequently answers with the fallback value "tech" for
 * images it cannot classify. Because "tech" is also the historical default,
 * that answer is treated as low confidence and the announcement text is
 * allowed to correct it.
 */
export function resolveAnnouncementCategory(
  suggestedCategory: string | undefined | null,
  text?: string | null,
): AnnouncementCategoryResult {
  const resolution = resolveCategory(suggestedCategory, text);
  const inferred = inferCategoryFromText(text);

  const suggestionIsLowTrust =
    resolution.source === 'provided' && resolution.category === DEFAULT_CATEGORY;

  if (suggestionIsLowTrust && inferred && inferred !== DEFAULT_CATEGORY) {
    return {
      category: inferred,
      source: 'inferred',
      confident: true,
      suggestedCategory: suggestedCategory ?? undefined,
      corrected: true,
    };
  }

  return {
    ...resolution,
    suggestedCategory: suggestedCategory ?? undefined,
    corrected: false,
  };
}

export type { Category };
