/**
 * Perceptual image hash helpers.
 *
 * The hash itself is produced by Cloudinary at upload time (`phash: true`),
 * so no image decoding library is needed in the backend. Cloudinary returns a
 * hex string; these helpers compare such strings safely.
 */

/** Cloudinary pHash is 64 bit, i.e. 16 hex characters. */
const EXPECTED_HEX_LENGTH = 16;
const HEX_PATTERN = /^[0-9a-f]+$/i;

/**
 * Distance thresholds for a 64 bit perceptual hash.
 * <= 6 bits: visually the same photo (recompression, resize, light crop).
 * <= 12 bits: probably the same scene, needs a supporting signal.
 */
export const IMAGE_IDENTICAL_DISTANCE = 6;
export const IMAGE_SIMILAR_DISTANCE = 12;
export const IMAGE_HASH_BITS = 64;

export function isValidImageHash(value?: string | null): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  return (
    trimmed.length > 0 &&
    trimmed.length <= EXPECTED_HEX_LENGTH &&
    HEX_PATTERN.test(trimmed)
  );
}

export function normalizeImageHash(value?: string | null): string | undefined {
  if (!isValidImageHash(value)) return undefined;
  return value!.trim().toLowerCase().padStart(EXPECTED_HEX_LENGTH, '0');
}

/**
 * Bitwise distance between two perceptual hashes.
 * Returns null when either hash is missing or malformed. Callers must treat
 * null as "no image evidence", never as a match.
 */
export function imageHashDistance(
  left?: string | null,
  right?: string | null,
): number | null {
  const a = normalizeImageHash(left);
  const b = normalizeImageHash(right);
  if (!a || !b) return null;

  let xor = BigInt(`0x${a}`) ^ BigInt(`0x${b}`);
  let distance = 0;
  while (xor > 0n) {
    xor &= xor - 1n;
    distance += 1;
  }
  return distance;
}

export type ImageVerdict = 'identical' | 'similar' | 'different' | 'unknown';

export function compareImages(
  left?: string | null,
  right?: string | null,
): { verdict: ImageVerdict; distance: number | null } {
  const distance = imageHashDistance(left, right);
  if (distance === null) return { verdict: 'unknown', distance: null };
  if (distance <= IMAGE_IDENTICAL_DISTANCE) return { verdict: 'identical', distance };
  if (distance <= IMAGE_SIMILAR_DISTANCE) return { verdict: 'similar', distance };
  return { verdict: 'different', distance };
}

/**
 * Cloudinary sends the hash as `phash` on the upload result.
 * Extracted defensively because the field is absent when the account plan or
 * the upload options do not include it.
 */
export function extractCloudinaryPhash(
  uploadResult: Record<string, unknown> | null | undefined,
): string | undefined {
  const candidate = uploadResult?.['phash'];
  return typeof candidate === 'string' ? normalizeImageHash(candidate) : undefined;
}
