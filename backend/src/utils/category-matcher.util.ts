import { MatchableItem, calculateTokenSimilarity } from './matching-score.util';
import { normalizeUzbekText } from './text-normalization.util';

export type CategorySignal = {
  key: string;
  label: string;
  score: number;
  maxScore: number;
  evidence?: string;
};

export type CategoryMatchResult = {
  category: string;
  matcher: 'docs' | 'tech' | 'wallet' | 'keys' | 'generic';
  score: number;
  eligible: boolean;
  signals: CategorySignal[];
  conflicts: string[];
};

const COLORS = [
  'qora', 'oq', 'qizil', 'kok', "ko'k", 'yashil', 'sariq', 'kulrang',
  'jigarrang', 'pushti', 'binafsha', 'gold', 'silver', 'black', 'white',
];
const BANKS = [
  'uzcard', 'humo', 'visa', 'mastercard', 'kapitalbank', 'ipotekabank',
  'xalq banki', 'agrobank', 'hamkorbank', 'anorbank', 'tbc', 'octobank',
];
const TECH_BRANDS = [
  'apple', 'iphone', 'samsung', 'xiaomi', 'redmi', 'poco', 'honor', 'huawei',
  'oppo', 'vivo', 'realme', 'nokia', 'lenovo', 'asus', 'acer', 'hp', 'dell',
];
const VEHICLE_BRANDS = [
  'chevrolet', 'daewoo', 'kia', 'hyundai', 'toyota', 'byd', 'chery',
  'mercedes', 'bmw', 'audi', 'lada', 'nexia', 'cobalt', 'gentra', 'damas',
];

/**
 * Document type patterns are evaluated in order, so the most specific
 * expressions must come first. "Texnik pasport" (BTS) contains the word
 * "pasport", therefore vehicle documents are detected before the passport
 * pattern can claim the text.
 */
const DOCUMENT_TYPES: ReadonlyArray<readonly [string, string, RegExp]> = [
  ['vehicle-registration', 'Texnik pasport (BTS)',
    /\b(bts|texpasport|tex pasport|texnik pasport|texnik passport|avtotexpasport|avto texpasport|transport vositasi guvohnomasi)\b/],
  ['vehicle-plate', 'Avtomobil raqami',
    /\b(avtomobil raqami|davlat raqami|raqam belgisi|nomer belgisi)\b/],
  ['driver-license', 'Haydovchilik guvohnomasi',
    /\b(prava|haydovchilik guvohnomasi|haydovchilik guvohnoma)\b/],
  ['student-id', 'Talaba guvohnomasi',
    /\b(talaba guvohnomasi|talabalik guvohnomasi|student id|zachyotka|baholash daftarchasi)\b/],
  ['military-id', 'Harbiy bilet',
    /\b(harbiy bilet|harbiy guvohnoma|voenniy bilet)\b/],
  ['insurance', 'Sug‘urta polisi',
    /\b(polis|polisi|sugurta|sug'urta|straxovka)\b/],
  ['tax-id', 'STIR / INN',
    /\b(stir|inn|soliq guvohnomasi)\b/],
  ['work-book', 'Mehnat daftarchasi',
    /\b(mehnat daftarchasi|mehnat kitobchasi)\b/],
  ['medical', 'Tibbiy hujjat',
    /\b(tibbiy daftarcha|tibbiy karta|sanitariya daftarchasi|retsept)\b/],
  ['bank-book', 'Bank hujjati',
    /\b(plastik shartnomasi|bank shartnomasi|hisob raqami guvohnomasi)\b/],
  ['birth-certificate', 'Tug‘ilganlik guvohnomasi',
    /\b(metrika|tugilganlik guvohnomasi|tug'ilganlik guvohnomasi)\b/],
  ['diploma', 'Diplom yoki sertifikat',
    /\b(diplom|diplomi|sertifikat|attestat)\b/],
  ['id-card', 'ID karta',
    /\b(id karta|id card|identifikatsiya karta|identifikatsiya)\b/],
  ['passport', 'Pasport',
    /\b(pasport|passport|biometrik pasport|xorijga chiqish pasporti)\b/],
];

function itemText(item: MatchableItem): string {
  return normalizeUzbekText(
    [item.itemType, item.itemName, item.itemDescription]
      .filter(Boolean)
      .join(' '),
  );
}

function firstIncluded(text: string, values: string[]): string | undefined {
  return values.find((value) => text.includes(normalizeUzbekText(value)));
}

function extractLastFour(text: string): string | undefined {
  const compactNumbers = text.match(/(?:\d[\s-]?){4,16}/g) ?? [];
  const digits = compactNumbers
    .map((value) => value.replace(/\D/g, ''))
    .find((value) => value.length >= 4);
  return digits?.slice(-4);
}

export function extractDocumentType(text: string): string | undefined {
  return DOCUMENT_TYPES.find(([, , pattern]) => pattern.test(text))?.[0];
}

export function describeDocumentType(type: string | undefined): string | undefined {
  return DOCUMENT_TYPES.find(([key]) => key === type)?.[1];
}

/** Uzbek documents use a two letter series such as AA, AB or AD before the number. */
function extractDocumentSeries(text: string): string | undefined {
  return text.match(/\b([a-z]{2})\s?\d{6,9}\b/)?.[1];
}

function extractTechModel(text: string): string | undefined {
  const patterns = [
    /\biphone\s?(?:se|x|xr|xs|1[1-9])(?:\s?(?:pro|max|plus))?\b/,
    /\b(?:galaxy\s?)?[as]\d{2}(?:\s?(?:ultra|plus|fe))?\b/,
    /\b(?:redmi|note|poco)\s?[a-z0-9]+(?:\s?(?:pro|plus))?\b/,
  ];
  const model = patterns
    .map((pattern) => text.match(pattern)?.[0])
    .find(Boolean);

  return model?.replace(/^galaxy\s+/, '').replace(/\s+/g, ' ').trim();
}

function extractStorage(text: string): string | undefined {
  return text.match(/\b(32|64|128|256|512)\s?(gb|g|гб)\b/)?.[1];
}

function extractKeyCount(text: string): string | undefined {
  return text.match(/\b([1-9])\s?(?:ta|dona)?\b(?=.{0,30}\bkalit)/)?.[1];
}

function addComparison(
  signals: CategorySignal[],
  conflicts: string[],
  key: string,
  label: string,
  left: string | undefined,
  right: string | undefined,
  maxScore: number,
  options: { redact?: boolean; conflict?: boolean } = {},
): void {
  if (!left || !right) return;
  if (left === right) {
    signals.push({
      key,
      label,
      score: maxScore,
      maxScore,
      evidence: options.redact ? `•••• ${left}` : left,
    });
  } else if (options.conflict) {
    conflicts.push(`${label} mos emas`);
  }
}

function matchDocs(left: MatchableItem, right: MatchableItem): CategoryMatchResult {
  const leftText = itemText(left);
  const rightText = itemText(right);
  const signals: CategorySignal[] = [];
  const conflicts: string[] = [];

  const leftType = extractDocumentType(leftText);
  const rightType = extractDocumentType(rightText);

  if (!leftType || !rightType) {
    // Documents are sensitive: never rely on free text similarity when the
    // document type of either announcement is unknown.
    conflicts.push('Hujjat turi aniqlanmadi');
  } else if (leftType !== rightType) {
    conflicts.push('Hujjat turi mos emas');
  } else {
    signals.push({
      key: 'documentType',
      label: 'Hujjat turi',
      score: 40,
      maxScore: 40,
      evidence: describeDocumentType(leftType) ?? leftType,
    });
  }

  addComparison(signals, conflicts, 'series', 'Hujjat seriyasi',
    extractDocumentSeries(leftText), extractDocumentSeries(rightText), 0,
    { conflict: true });
  addComparison(signals, conflicts, 'lastFour', 'Raqamning oxirgi 4 xonasi',
    extractLastFour(leftText), extractLastFour(rightText), 35, { redact: true, conflict: true });

  const textScore = Math.round(calculateTokenSimilarity(leftText, rightText) * 25);
  signals.push({ key: 'description', label: 'Hujjat tavsifi', score: textScore, maxScore: 25 });
  return finalize('docs', 'docs', signals, conflicts, 40);
}

function matchTech(left: MatchableItem, right: MatchableItem): CategoryMatchResult {
  const leftText = itemText(left);
  const rightText = itemText(right);
  const signals: CategorySignal[] = [];
  const conflicts: string[] = [];

  addComparison(signals, conflicts, 'brand', 'Brend',
    firstIncluded(leftText, TECH_BRANDS), firstIncluded(rightText, TECH_BRANDS), 25);
  addComparison(signals, conflicts, 'model', 'Model',
    extractTechModel(leftText), extractTechModel(rightText), 40, { conflict: true });
  addComparison(signals, conflicts, 'color', 'Rang',
    firstIncluded(leftText, COLORS), firstIncluded(rightText, COLORS), 15);
  addComparison(signals, conflicts, 'storage', 'Xotira hajmi',
    extractStorage(leftText), extractStorage(rightText), 10);
  const textScore = Math.round(calculateTokenSimilarity(leftText, rightText) * 10);
  signals.push({ key: 'description', label: 'Qo‘shimcha tavsif', score: textScore, maxScore: 10 });
  return finalize('tech', 'tech', signals, conflicts, 35);
}

function matchWallet(left: MatchableItem, right: MatchableItem): CategoryMatchResult {
  const leftText = itemText(left);
  const rightText = itemText(right);
  const signals: CategorySignal[] = [];
  const conflicts: string[] = [];

  addComparison(signals, conflicts, 'bank', 'Bank yoki to‘lov tizimi',
    firstIncluded(leftText, BANKS), firstIncluded(rightText, BANKS), 30);
  addComparison(signals, conflicts, 'lastFour', 'Kartaning oxirgi 4 xonasi',
    extractLastFour(leftText), extractLastFour(rightText), 45, { redact: true, conflict: true });
  addComparison(signals, conflicts, 'color', 'Rang',
    firstIncluded(leftText, COLORS), firstIncluded(rightText, COLORS), 15);
  const textScore = Math.round(calculateTokenSimilarity(leftText, rightText) * 10);
  signals.push({ key: 'description', label: 'Hamyon/karta tavsifi', score: textScore, maxScore: 10 });
  return finalize('wallet', 'wallet', signals, conflicts, 40);
}

function matchKeys(left: MatchableItem, right: MatchableItem): CategoryMatchResult {
  const leftText = itemText(left);
  const rightText = itemText(right);
  const signals: CategorySignal[] = [];
  const conflicts: string[] = [];

  addComparison(signals, conflicts, 'count', 'Kalitlar soni',
    extractKeyCount(leftText), extractKeyCount(rightText), 25);
  addComparison(signals, conflicts, 'vehicle', 'Avtomobil belgisi',
    firstIncluded(leftText, VEHICLE_BRANDS), firstIncluded(rightText, VEHICLE_BRANDS), 30);
  const keyFobPattern = /\b(brelok(?:li)?|pult(?:i|li)?|signalizatsiya)\b/;
  const fobLeft = keyFobPattern.test(leftText) ? 'brelok/pult' : undefined;
  const fobRight = keyFobPattern.test(rightText) ? 'brelok/pult' : undefined;
  addComparison(signals, conflicts, 'accessory', 'Brelok yoki pult', fobLeft, fobRight, 20);
  const textScore = Math.round(calculateTokenSimilarity(leftText, rightText) * 25);
  signals.push({ key: 'description', label: 'Kalit tavsifi', score: textScore, maxScore: 25 });
  return finalize('keys', 'keys', signals, conflicts, 35);
}

function matchGeneric(category: string, left: MatchableItem, right: MatchableItem): CategoryMatchResult {
  const typeScore = Math.round(calculateTokenSimilarity(left.itemType, right.itemType) * 40);
  const descriptionScore = Math.round(calculateTokenSimilarity(itemText(left), itemText(right)) * 60);
  return finalize(category, 'generic', [
    { key: 'itemType', label: 'Buyum turi', score: typeScore, maxScore: 40 },
    { key: 'description', label: 'Kategoriya tavsifi', score: descriptionScore, maxScore: 60 },
  ], [], 40);
}

function finalize(
  category: string,
  matcher: CategoryMatchResult['matcher'],
  signals: CategorySignal[],
  conflicts: string[],
  threshold: number,
): CategoryMatchResult {
  const score = Math.min(100, signals.reduce((sum, signal) => sum + signal.score, 0));
  return { category, matcher, score, eligible: conflicts.length === 0 && score >= threshold, signals, conflicts };
}

export function matchByCategory(
  lostItem: MatchableItem,
  foundItem: MatchableItem,
): CategoryMatchResult {
  const lostCategory = normalizeUzbekText(lostItem.category ?? '');
  const foundCategory = normalizeUzbekText(foundItem.category ?? '');

  if (!lostCategory || !foundCategory || lostCategory !== foundCategory) {
    return {
      category: lostCategory || foundCategory || 'unknown',
      matcher: 'generic',
      score: 0,
      eligible: false,
      signals: [],
      conflicts: ['Kategoriya mos emas'],
    };
  }

  if (lostCategory === 'docs') return matchDocs(lostItem, foundItem);
  if (lostCategory === 'tech') return matchTech(lostItem, foundItem);
  if (lostCategory === 'wallet') return matchWallet(lostItem, foundItem);
  if (lostCategory === 'keys') return matchKeys(lostItem, foundItem);
  return matchGeneric(lostCategory, lostItem, foundItem);
}
