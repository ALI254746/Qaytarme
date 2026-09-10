import { normalizeUzbekText } from './text-normalization.util';

/**
 * Category Utility Functions
 *
 * Valid categories (14 total):
 * tech, pets, keys, wallet, docs, clothing, jewelry, vehicle, home, sports, toys, books, tools, food
 */

export const VALID_CATEGORIES = [
  'tech', 'pets', 'keys', 'wallet', 'docs', 'clothing',
  'jewelry', 'vehicle', 'home', 'sports', 'toys', 'books', 'tools', 'food',
] as const;

export type Category = typeof VALID_CATEGORIES[number];

export const DEFAULT_CATEGORY: Category = 'tech';

/** Maps common English/Uzbek category labels to a standard category. */
const CATEGORY_MAP: Record<string, Category> = {
  // Tech
  phone: 'tech', smartphone: 'tech', laptop: 'tech', computer: 'tech',
  tablet: 'tech', electronics: 'tech', electronic: 'tech',
  telefon: 'tech', noutbuk: 'tech', kompyuter: 'tech', planshet: 'tech',
  texnika: 'tech', elektronika: 'tech',

  // Pets
  dog: 'pets', cat: 'pets', pet: 'pets', animal: 'pets', animals: 'pets',
  hayvon: 'pets', hayvonlar: 'pets', mushuk: 'pets', kuchuk: 'pets',

  // Keys
  key: 'keys', keychain: 'keys', kalit: 'keys', kalitlar: 'keys',

  // Wallet
  purse: 'wallet', bag: 'wallet', backpack: 'wallet', handbag: 'wallet',
  hamyon: 'wallet', sumka: 'wallet', portfel: 'wallet', pul: 'wallet',

  // Documents
  document: 'docs', documents: 'docs', passport: 'docs', 'id card': 'docs',
  idcard: 'docs', certificate: 'docs', hujjat: 'docs', hujjatlar: 'docs',
  pasport: 'docs', guvohnoma: 'docs', prava: 'docs', metrika: 'docs',
  diplom: 'docs', sertifikat: 'docs',

  // Clothing
  shirt: 'clothing', shoes: 'clothing', shoe: 'clothing', glasses: 'clothing',
  sunglasses: 'clothing', kiyim: 'clothing', 'kiyim kechak': 'clothing',

  // Jewelry
  ring: 'jewelry', watch: 'jewelry', necklace: 'jewelry', earring: 'jewelry',
  earrings: 'jewelry', accessories: 'jewelry', accessory: 'jewelry',
  zargarlik: 'jewelry', uzuk: 'jewelry', zirak: 'jewelry', soat: 'jewelry',

  // Vehicle
  bicycle: 'vehicle', bike: 'vehicle', scooter: 'vehicle',
  motorcycle: 'vehicle', automotive: 'vehicle', 'car parts': 'vehicle',
  carparts: 'vehicle', transport: 'vehicle', velosiped: 'vehicle',

  // Home
  furniture: 'home', chair: 'home', table: 'home', appliance: 'home',
  appliances: 'home', mebel: 'home', 'uy jihozlari': 'home',

  // Sports
  sport: 'sports', ball: 'sports', racket: 'sports', equipment: 'sports',

  // Toys
  toy: 'toys', doll: 'toys', game: 'toys',

  // Books
  book: 'books', notebook: 'books', journal: 'books', magazine: 'books',
  kitob: 'books', daftar: 'books',

  // Tools
  tool: 'tools', hammer: 'tools', saw: 'tools', asbob: 'tools',

  // Food
  drink: 'food', beverage: 'food', product: 'food', products: 'food',
  ovqat: 'food', ichimlik: 'food',
};

/**
 * Keyword rules used when the AI category is missing or unusable.
 * Order matters: documents, keys and wallets are checked before tech so a
 * "pasport" or "kalit" announcement is never stored as electronics.
 */
const CATEGORY_KEYWORDS: ReadonlyArray<readonly [Category, RegExp]> = [
  ['docs', /\b(pasport|passport|texpasport|bts|hujjat|hujjatlar|guvohnoma|guvohnomasi|prava|metrika|diplom|diplomi|attestat|sertifikat|stir|inn|polis|harbiy bilet|talabalik|zachyotka|id karta)\b/],
  ['keys', /\b(kalit|kaliti|kalitlar|kalitlari|brelok|brelogi|pult|pulti|signalizatsiya)\b/],
  ['wallet', /\b(hamyon|hamyoni|sumka|sumkasi|portfel|ryukzak|plastik karta|bank kartasi|uzcard|humo|visa|mastercard|pul)\b/],
  ['pets', /\b(mushuk|kuchuk|kuchukcha|it|itim|qush|tuti|popugay|hayvon|hayvonim)\b/],
  ['tech', /\b(telefon|telefoni|smartfon|iphone|samsung|xiaomi|redmi|noutbuk|kompyuter|planshet|naushnik|quloqchin|airpods|zaryadchi|powerbank|fleshka)\b/],
  ['jewelry', /\b(uzuk|zirak|marjon|bilaguzuk|tilla|oltin|kumush|soat|soati|zanjir)\b/],
  ['clothing', /\b(ko'ylak|shim|kurtka|palto|shapka|sharf|krossovka|tufli|oyoq kiyim|ko'zoynak|kiyim)\b/],
  ['vehicle', /\b(velosiped|skuter|samokat|mototsikl|moped|avtomobil g'ildiragi|nomer belgisi)\b/],
  ['books', /\b(kitob|kitobi|daftar|daftarcha|jurnal|qo'llanma)\b/],
  ['sports', /\b(to'p|koptok|raketka|gantel|sport anjomi|velotrenajyor)\b/],
  ['toys', /\b(o'yinchoq|qo'g'irchoq|konstruktor|robot o'yinchoq)\b/],
  ['tools', /\b(bolg'a|otvertka|qaychi|ombur|drel|asbob)\b/],
  ['home', /\b(mebel|stul|stol|gilam|idish tovoq|choynak|uy jihozi)\b/],
  ['food', /\b(ovqat|ichimlik|non|shirinlik|mahsulot)\b/],
];

export type CategoryResolution = {
  category: Category;
  /** How the category was decided, useful for logging and OSINT auditing. */
  source: 'provided' | 'mapped' | 'inferred' | 'default';
  confident: boolean;
};

/** Detects a category from free announcement text using local keywords. */
export function inferCategoryFromText(text: string | undefined | null): Category | undefined {
  if (!text) return undefined;
  const normalized = normalizeUzbekText(text);
  if (!normalized) return undefined;

  return CATEGORY_KEYWORDS.find(([, pattern]) => pattern.test(normalized))?.[0];
}

/**
 * Resolves the final category for an announcement.
 * The announcement text is used as a fallback so an unrecognised AI answer
 * no longer silently becomes "tech".
 */
export function resolveCategory(
  category: string | undefined | null,
  text?: string | null,
): CategoryResolution {
  const normalized = (category ?? '').toLowerCase().trim();

  if (VALID_CATEGORIES.includes(normalized as Category)) {
    return { category: normalized as Category, source: 'provided', confident: true };
  }

  if (CATEGORY_MAP[normalized]) {
    return { category: CATEGORY_MAP[normalized], source: 'mapped', confident: true };
  }

  const inferredFromLabel = inferCategoryFromText(normalized);
  if (inferredFromLabel) {
    return { category: inferredFromLabel, source: 'inferred', confident: true };
  }

  const inferredFromText = inferCategoryFromText(text);
  if (inferredFromText) {
    return { category: inferredFromText, source: 'inferred', confident: true };
  }

  return { category: DEFAULT_CATEGORY, source: 'default', confident: false };
}

/**
 * Normalize category to match the 14 valid categories.
 *
 * @param category - The category string to normalize
 * @param text - Optional announcement text used to infer a better category
 */
export function normalizeCategory(
  category: string | undefined | null,
  text?: string | null,
): Category {
  const resolution = resolveCategory(category, text);

  if (!resolution.confident) {
    console.warn(
      `Unknown category "${category ?? ''}" and no category keywords in text, defaulting to "${DEFAULT_CATEGORY}"`,
    );
  }

  return resolution.category;
}

/** Validate if a category is one of the 14 supported values. */
export function isValidCategory(category: string | undefined | null): boolean {
  if (!category) return false;
  return VALID_CATEGORIES.includes(category.toLowerCase().trim() as Category);
}
