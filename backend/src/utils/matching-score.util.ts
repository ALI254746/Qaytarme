import {
  normalizeUzbekText,
  tokenizeUzbekText,
} from './text-normalization.util';

export type MatchCoordinates = {
  lat: number;
  lng: number;
};

export type MatchableItem = {
  category?: string;
  itemType?: string;
  itemName?: string;
  itemDescription?: string;
  location?: string;
  region?: string;
  district?: string;
  date?: string | Date;
  createdAt?: string | Date;
  coordinates?: MatchCoordinates;
};

export type ScoreComponent = {
  key: 'category' | 'itemType' | 'description' | 'location' | 'distance' | 'time';
  label: string;
  score: number;
  maxScore: number;
  evidence?: string;
};

export type ExplainableMatchScore = {
  score: number;
  eligible: boolean;
  confidence: 'low' | 'medium' | 'high' | 'very_high';
  components: ScoreComponent[];
};

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

export function calculateTokenSimilarity(left?: string, right?: string): number {
  const leftTokens = tokenizeUzbekText(left ?? '');
  const rightTokens = tokenizeUzbekText(right ?? '');

  if (leftTokens.length === 0 || rightTokens.length === 0) return 0;

  const leftSet = new Set(leftTokens);
  const rightSet = new Set(rightTokens);
  let intersection = 0;

  for (const token of leftSet) {
    if (rightSet.has(token)) {
      intersection += 1;
      continue;
    }

    // Conservative partial credit for common Uzbek suffix variations.
    if (
      Array.from(rightSet).some(
        (candidate) =>
          Math.min(token.length, candidate.length) >= 5 &&
          (token.startsWith(candidate) || candidate.startsWith(token)),
      )
    ) {
      intersection += 0.5;
    }
  }

  const union = new Set([...leftSet, ...rightSet]).size;
  return clamp(intersection / union);
}

export function haversineDistanceKm(
  first?: MatchCoordinates,
  second?: MatchCoordinates,
): number | null {
  if (!first || !second) return null;
  if (
    !Number.isFinite(first.lat) ||
    !Number.isFinite(first.lng) ||
    !Number.isFinite(second.lat) ||
    !Number.isFinite(second.lng) ||
    (first.lat === 0 && first.lng === 0) ||
    (second.lat === 0 && second.lng === 0)
  ) {
    return null;
  }

  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(second.lat - first.lat);
  const longitudeDelta = toRadians(second.lng - first.lng);
  const firstLatitude = toRadians(first.lat);
  const secondLatitude = toRadians(second.lat);

  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function resolveDate(item: MatchableItem): Date | null {
  const rawDate = item.date ?? item.createdAt;
  if (!rawDate) return null;

  const parsed = rawDate instanceof Date ? rawDate : new Date(rawDate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function confidenceFor(score: number): ExplainableMatchScore['confidence'] {
  if (score >= 85) return 'very_high';
  if (score >= 70) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

export function calculateExplainableMatchScore(
  lostItem: MatchableItem,
  foundItem: MatchableItem,
): ExplainableMatchScore {
  const components: ScoreComponent[] = [];

  const categoryMatches =
    Boolean(lostItem.category && foundItem.category) &&
    normalizeUzbekText(lostItem.category!) === normalizeUzbekText(foundItem.category!);
  components.push({
    key: 'category',
    label: 'Kategoriya',
    score: categoryMatches ? 20 : 0,
    maxScore: 20,
    evidence: categoryMatches ? lostItem.category : undefined,
  });

  const itemTypeSimilarity = calculateTokenSimilarity(
    lostItem.itemType,
    foundItem.itemType,
  );
  components.push({
    key: 'itemType',
    label: 'Buyum turi',
    score: Math.round(itemTypeSimilarity * 25),
    maxScore: 25,
  });

  const descriptionSimilarity = Math.max(
    calculateTokenSimilarity(lostItem.itemName, foundItem.itemName),
    calculateTokenSimilarity(
      lostItem.itemDescription,
      foundItem.itemDescription,
    ),
  );
  components.push({
    key: 'description',
    label: 'Nomi va tavsifi',
    score: Math.round(descriptionSimilarity * 15),
    maxScore: 15,
  });

  const exactRegion =
    Boolean(lostItem.region && foundItem.region) &&
    normalizeUzbekText(lostItem.region!) === normalizeUzbekText(foundItem.region!);
  const exactDistrict =
    Boolean(lostItem.district && foundItem.district) &&
    normalizeUzbekText(lostItem.district!) === normalizeUzbekText(foundItem.district!);
  const locationSimilarity = calculateTokenSimilarity(
    lostItem.location,
    foundItem.location,
  );
  const locationScore = Math.min(
    15,
    (exactRegion ? 5 : 0) +
      (exactDistrict ? 5 : 0) +
      Math.round(locationSimilarity * 5),
  );
  components.push({
    key: 'location',
    label: 'Hudud va joy',
    score: locationScore,
    maxScore: 15,
  });

  const distanceKm = haversineDistanceKm(
    lostItem.coordinates,
    foundItem.coordinates,
  );
  let distanceScore = 0;
  if (distanceKm !== null) {
    if (distanceKm <= 1) distanceScore = 10;
    else if (distanceKm <= 3) distanceScore = 8;
    else if (distanceKm <= 10) distanceScore = 5;
    else if (distanceKm <= 30) distanceScore = 2;
  }
  components.push({
    key: 'distance',
    label: 'Xaritadagi masofa',
    score: distanceScore,
    maxScore: 10,
    evidence:
      distanceKm === null ? undefined : `${distanceKm.toFixed(1)} km`,
  });

  const lostDate = resolveDate(lostItem);
  const foundDate = resolveDate(foundItem);
  let timeScore = 0;
  let timeEvidence: string | undefined;
  if (lostDate && foundDate) {
    const differenceDays = Math.abs(
      foundDate.getTime() - lostDate.getTime(),
    ) / 86_400_000;
    timeEvidence = `${differenceDays.toFixed(1)} kun`;
    if (differenceDays <= 1) timeScore = 15;
    else if (differenceDays <= 3) timeScore = 12;
    else if (differenceDays <= 7) timeScore = 8;
    else if (differenceDays <= 30) timeScore = 3;
  }
  components.push({
    key: 'time',
    label: 'Vaqt yaqinligi',
    score: timeScore,
    maxScore: 15,
    evidence: timeEvidence,
  });

  const score = components.reduce((total, component) => total + component.score, 0);
  const eligible = categoryMatches || itemTypeSimilarity >= 0.5;

  return {
    score: eligible ? score : Math.min(score, 39),
    eligible,
    confidence: confidenceFor(eligible ? score : Math.min(score, 39)),
    components,
  };
}
