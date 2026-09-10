import {
  clusterConfidence,
  DUPLICATE_THRESHOLD,
  evaluateDuplicate,
} from './dedupe.util';
import type { DedupeCandidate } from './dedupe.util';
import { simhash } from './simhash.util';

const ORIGINAL_TEXT =
  'Chilonzor 9-mavzeda qora rangli Samsung telefon topildi, egasi murojaat qilsin';
const REPOST_TEXT =
  'Chilonzor 9 mavzeda qora rangli Samsung telefon topildi. Egasi murojaat qilsin! Tel: 998901234567';
const OTHER_TEXT =
  'Yunusobodda qizil ayollar sumkasi yoqoldi, ichida pasport va bank kartasi bor edi';

function candidate(overrides: Partial<DedupeCandidate> = {}): DedupeCandidate {
  return {
    status: 'found',
    category: 'tech',
    text: ORIGINAL_TEXT,
    simhash: simhash(ORIGINAL_TEXT),
    imagePhash: 'a1b2c3d4e5f60789',
    coordinates: { lat: 41.2756, lng: 69.2035 },
    occurredAt: '2026-09-08T10:00:00.000Z',
    ...overrides,
  };
}

describe('duplicate evaluation', () => {
  it('treats an identical content hash as a conclusive duplicate', () => {
    const result = evaluateDuplicate(
      candidate({ contentHash: 'a'.repeat(64) }),
      candidate({ contentHash: 'a'.repeat(64), text: OTHER_TEXT }),
    );

    expect(result.verdict).toBe('duplicate');
    expect(result.score).toBe(100);
    expect(result.reasons).toContain('Bir xil kontent hash');
  });

  it('treats the same channel message as a duplicate', () => {
    const result = evaluateDuplicate(
      candidate({ channelUsername: 'toshkent_yoqolgan', messageIds: ['1201'] }),
      candidate({
        channelUsername: 'toshkent_yoqolgan',
        messageIds: ['1201', '1202'],
        text: REPOST_TEXT,
      }),
    );

    expect(result.verdict).toBe('duplicate');
    expect(result.reasons).toContain('Bir kanalning ayni xabari');
  });

  it('clusters a rewritten repost that reuses the same photo', () => {
    const result = evaluateDuplicate(
      candidate(),
      candidate({
        text: REPOST_TEXT,
        simhash: simhash(REPOST_TEXT),
        imagePhash: 'a1b2c3d4e5f6078d',
        occurredAt: '2026-09-08T18:00:00.000Z',
      }),
    );

    expect(result.verdict).toBe('duplicate');
    expect(result.score).toBeGreaterThanOrEqual(DUPLICATE_THRESHOLD);
    expect(result.reasons).toContain('Ayni rasm ishlatilgan');
    expect(result.blockers).toHaveLength(0);
  });

  it('never merges a lost post with a found post', () => {
    const result = evaluateDuplicate(
      candidate({ status: 'found' }),
      candidate({ status: 'lost' }),
    );

    expect(result.verdict).not.toBe('duplicate');
    expect(result.blockers).toContain(
      'Yoqolgan va topilgan elonlar takror deb belgilanmaydi',
    );
  });

  it('does not merge different categories', () => {
    const result = evaluateDuplicate(
      candidate({ category: 'tech' }),
      candidate({ category: 'docs' }),
    );

    expect(result.verdict).not.toBe('duplicate');
    expect(result.blockers).toContain('Kategoriya mos emas');
  });

  it('blocks a merge when the photos are clearly different', () => {
    const result = evaluateDuplicate(
      candidate(),
      candidate({
        text: REPOST_TEXT,
        simhash: simhash(REPOST_TEXT),
        imagePhash: '5e4d3c2b1a09f876',
      }),
    );

    expect(result.verdict).not.toBe('duplicate');
    expect(result.blockers).toContain('Rasmlar butunlay boshqa');
  });

  it('keeps a genuinely different announcement unique', () => {
    const result = evaluateDuplicate(
      candidate(),
      candidate({
        text: OTHER_TEXT,
        simhash: simhash(OTHER_TEXT),
        imagePhash: '5e4d3c2b1a09f876',
        category: 'tech',
      }),
    );

    expect(result.verdict).toBe('unique');
  });

  it('refuses to cluster on time and place alone', () => {
    const result = evaluateDuplicate(
      {
        status: 'found',
        category: 'tech',
        coordinates: { lat: 41.2756, lng: 69.2035 },
        occurredAt: '2026-09-08T10:00:00.000Z',
      },
      {
        status: 'found',
        category: 'tech',
        coordinates: { lat: 41.2758, lng: 69.2039 },
        occurredAt: '2026-09-08T12:00:00.000Z',
      },
    );

    expect(result.verdict).toBe('unique');
    expect(
      result.signals.some((signal) => signal.name === 'textFingerprint'),
    ).toBe(false);
  });

  it('explains every decision with signals', () => {
    const result = evaluateDuplicate(
      candidate(),
      candidate({ text: REPOST_TEXT, simhash: simhash(REPOST_TEXT) }),
    );

    const names = result.signals.map((signal) => signal.name);
    expect(names).toContain('textFingerprint');
    expect(names).toContain('imageHash');
    expect(result.signals.every((signal) => signal.detail.length > 0)).toBe(true);
  });
});

describe('cluster confidence', () => {
  it('rewards independent sources', () => {
    const single = clusterConfidence({ pairScores: [80], distinctSources: 1 });
    const multiple = clusterConfidence({ pairScores: [80], distinctSources: 3 });

    expect(multiple).toBeGreaterThan(single);
    expect(multiple).toBeLessThanOrEqual(100);
  });

  it('returns zero for an empty cluster', () => {
    expect(clusterConfidence({ pairScores: [], distinctSources: 5 })).toBe(0);
  });
});
