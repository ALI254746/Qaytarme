const CYRILLIC_TO_LATIN: Readonly<Record<string, string>> = {
  А: 'A', а: 'a', Б: 'B', б: 'b', В: 'V', в: 'v', Г: 'G', г: 'g',
  Д: 'D', д: 'd', Е: 'E', е: 'e', Ё: 'Yo', ё: 'yo', Ж: 'J', ж: 'j',
  З: 'Z', з: 'z', И: 'I', и: 'i', Й: 'Y', й: 'y', К: 'K', к: 'k',
  Л: 'L', л: 'l', М: 'M', м: 'm', Н: 'N', н: 'n', О: 'O', о: 'o',
  П: 'P', п: 'p', Р: 'R', р: 'r', С: 'S', с: 's', Т: 'T', т: 't',
  У: 'U', у: 'u', Ф: 'F', ф: 'f', Х: 'X', х: 'x', Ц: 'Ts', ц: 'ts',
  Ч: 'Ch', ч: 'ch', Ш: 'Sh', ш: 'sh', Щ: 'Sh', щ: 'sh', Ъ: '', ъ: '',
  Ы: 'I', ы: 'i', Ь: '', ь: '', Э: 'E', э: 'e', Ю: 'Yu', ю: 'yu',
  Я: 'Ya', я: 'ya', Ў: "O'", ў: "o'", Қ: 'Q', қ: 'q', Ғ: "G'", ғ: "g'",
  Ҳ: 'H', ҳ: 'h',
};

const TYPOGRAPHIC_APOSTROPHES = /[ʻʼ‘’`´]/g;

const COMMON_VARIANTS: Readonly<Record<string, string>> = {
  tashkent: 'toshkent',
  chilanzar: 'chilonzor',
  yunusabad: 'yunusobod',
  khojiakbar: 'hojiakbar',
  xojiakbar: 'hojiakbar',
};

/**
 * Converts Uzbek/Russian Cyrillic characters used in local announcements to
 * a consistent Latin representation. The function is deterministic and does
 * not call an external AI service, so it is safe to use in matching hot paths.
 */
export function transliterateCyrillicToLatin(value: string): string {
  if (!value) return '';

  return Array.from(value)
    .map((character) => CYRILLIC_TO_LATIN[character] ?? character)
    .join('');
}

/**
 * Produces a comparison-friendly representation of an announcement field.
 * It preserves digits and Uzbek apostrophes while removing formatting noise.
 */
export function normalizeUzbekText(value: string): string {
  if (!value) return '';

  const normalized = transliterateCyrillicToLatin(value.normalize('NFKC'))
    .replace(TYPOGRAPHIC_APOSTROPHES, "'")
    .toLocaleLowerCase('uz-UZ')
    .replace(/[^a-z0-9'\s-]/g, ' ')
    .replace(/\s*'\s*/g, "'")
    .replace(/-+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return normalized
    .split(' ')
    .map((token) => COMMON_VARIANTS[token] ?? token)
    .join(' ');
}

/** Returns unique normalized tokens for Jaccard or weighted matching. */
export function tokenizeUzbekText(value: string): string[] {
  return Array.from(
    new Set(
      normalizeUzbekText(value)
        .split(' ')
        .filter((token) => token.length > 1),
    ),
  );
}
