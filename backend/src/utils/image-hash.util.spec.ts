import {
  compareImages,
  extractCloudinaryPhash,
  imageHashDistance,
  isValidImageHash,
  normalizeImageHash,
} from './image-hash.util';

describe('perceptual image hash', () => {
  const hash = 'a1b2c3d4e5f60789';

  it('reports zero distance for the same hash', () => {
    expect(imageHashDistance(hash, hash)).toBe(0);
    expect(compareImages(hash, hash).verdict).toBe('identical');
  });

  it('counts differing bits', () => {
    // 0x...0789 vs 0x...0788 differs in a single bit.
    expect(imageHashDistance('a1b2c3d4e5f60789', 'a1b2c3d4e5f60788')).toBe(1);
    // 0x0 vs 0xf differs in four bits.
    expect(imageHashDistance('0000000000000000', '000000000000000f')).toBe(4);
  });

  it('classifies a recompressed photo as identical and a different photo as different', () => {
    const recompressed = 'a1b2c3d4e5f6078d'; // few bits away
    expect(compareImages(hash, recompressed).verdict).toBe('identical');

    const unrelated = '5e4d3c2b1a09f876';
    expect(compareImages(hash, unrelated).verdict).toBe('different');
  });

  it('returns unknown instead of a match when a hash is missing', () => {
    expect(imageHashDistance(hash, undefined)).toBeNull();
    expect(imageHashDistance(null, null)).toBeNull();
    expect(compareImages(hash, '')).toEqual({ verdict: 'unknown', distance: null });
  });

  it('rejects malformed hashes', () => {
    expect(isValidImageHash('zzzz')).toBe(false);
    expect(isValidImageHash('a1b2c3d4e5f607890')).toBe(false); // too long
    expect(isValidImageHash(undefined)).toBe(false);
    expect(imageHashDistance('not-a-hash', hash)).toBeNull();
  });

  it('normalizes case and short hashes', () => {
    expect(normalizeImageHash('A1B2')).toBe('000000000000a1b2');
    expect(normalizeImageHash(' a1b2c3d4e5f60789 ')).toBe(hash);
  });

  it('extracts the cloudinary phash defensively', () => {
    expect(extractCloudinaryPhash({ phash: hash })).toBe(hash);
    expect(extractCloudinaryPhash({})).toBeUndefined();
    expect(extractCloudinaryPhash(null)).toBeUndefined();
    expect(extractCloudinaryPhash({ phash: 42 })).toBeUndefined();
  });
});
