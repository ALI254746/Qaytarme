import {
  MIN_SAMPLE_SIZE,
  reliabilityWeight,
  scoreSource,
  wilsonLowerBound,
} from './source-reliability.util';
import type { SourceStats } from './source-reliability.util';

function stats(overrides: Partial<SourceStats> = {}): SourceStats {
  return {
    sourceKey: 'toshkent_yoqolgan',
    total: 100,
    duplicates: 10,
    rejected: 3,
    returned: 12,
    matched: 30,
    withImage: 85,
    withLocation: 80,
    withDate: 70,
    withContact: 90,
    lastSeenAt: new Date(),
    ...overrides,
  };
}

describe('wilson lower bound', () => {
  it('refuses to call a tiny sample perfect', () => {
    expect(wilsonLowerBound(3, 3)).toBeLessThan(0.5);
  });

  it('grows with evidence', () => {
    expect(wilsonLowerBound(300, 300)).toBeGreaterThan(wilsonLowerBound(3, 3));
  });

  it('returns zero without data', () => {
    expect(wilsonLowerBound(0, 0)).toBe(0);
  });
});

describe('source scoring', () => {
  it('does not rank a source with too few announcements', () => {
    const result = scoreSource(stats({ total: MIN_SAMPLE_SIZE - 1 }));

    expect(result.tier).toBe('insufficient_data');
    expect(result.score).toBe(0);
    expect(result.warnings.join(' ')).toContain("kam ma'lumot");
  });

  it('rates a complete, original and productive channel highly', () => {
    const result = scoreSource(stats());

    expect(result.score).toBeGreaterThanOrEqual(65);
    expect(['trusted', 'reliable']).toContain(result.tier);
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it('punishes a channel that mostly reposts other channels', () => {
    const original = scoreSource(stats());
    const reposter = scoreSource(stats({ duplicates: 80 }));

    expect(reposter.score).toBeLessThan(original.score);
    expect(reposter.warnings.join(' ')).toContain("ko'chirilgan");
  });

  it('punishes a spammy channel', () => {
    const clean = scoreSource(stats());
    const spammy = scoreSource(stats({ rejected: 40 }));

    expect(spammy.score).toBeLessThan(clean.score);
  });

  it('punishes announcements without photo or location', () => {
    const rich = scoreSource(stats());
    const bare = scoreSource(
      stats({ withImage: 5, withLocation: 8, withDate: 10 }),
    );

    expect(bare.score).toBeLessThan(rich.score);
    expect(bare.warnings.join(' ')).toContain('rasm');
  });

  it('lets an accurate but abandoned channel decay', () => {
    const active = scoreSource(stats());
    const idle = scoreSource(
      stats({ lastSeenAt: new Date(Date.now() - 120 * 86_400_000) }),
    );

    expect(idle.score).toBeLessThan(active.score);
    expect(idle.warnings.join(' ')).toContain('jim');
  });

  it('explains every factor', () => {
    const result = scoreSource(stats());
    const names = result.factors.map((factor) => factor.name);

    expect(names).toEqual(
      expect.arrayContaining([
        'completeness',
        'originality',
        'outcome',
        'signal_quality',
      ]),
    );
    expect(result.factors.every((factor) => factor.detail.length > 0)).toBe(true);
  });
});

describe('matching weight', () => {
  it('never silences a source completely', () => {
    const weak = reliabilityWeight(scoreSource(stats({ rejected: 90, duplicates: 90, withImage: 0, withLocation: 0, withDate: 0, withContact: 0, returned: 0, matched: 0 })));

    expect(weak).toBeGreaterThanOrEqual(0.6);
  });

  it('gives a trusted source more influence than a weak one', () => {
    const strong = reliabilityWeight(scoreSource(stats()));
    const weak = reliabilityWeight(scoreSource(stats({ rejected: 60, duplicates: 70 })));

    expect(strong).toBeGreaterThan(weak);
    expect(strong).toBeLessThanOrEqual(1.2);
  });

  it('treats an unrated source as neutral', () => {
    const unknown = reliabilityWeight(scoreSource(stats({ total: 2 })));

    expect(unknown).toBe(0.8);
  });
});
