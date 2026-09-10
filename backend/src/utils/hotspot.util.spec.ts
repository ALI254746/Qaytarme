import {
  buildHotspots,
  buildTemporalProfile,
  cellKeyFor,
  compareGroups,
  compareWindows,
  DEFAULT_CELL_SIZE,
  IncidentPoint,
  MIN_HOTSPOT_COUNT,
} from './hotspot.util';

function pointsAt(
  count: number,
  lat: number,
  lng: number,
  extra: Partial<IncidentPoint> = {},
): IncidentPoint[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${lat}-${lng}-${index}`,
    // Tiny jitter so the points are not literally identical but stay in cell.
    lat: lat + index * 0.0001,
    lng: lng + index * 0.0001,
    ...extra,
  }));
}

describe('cellKeyFor', () => {
  it('puts nearby points in the same cell', () => {
    expect(cellKeyFor(41.2995, 69.2401)).toBe(cellKeyFor(41.2998, 69.2409));
  });

  it('separates points more than a cell apart', () => {
    expect(cellKeyFor(41.2995, 69.2401)).not.toBe(
      cellKeyFor(41.3195, 69.2401),
    );
  });

  it('handles a custom cell size', () => {
    const coarse = cellKeyFor(41.2995, 69.2401, 0.1);
    expect(coarse).toBe(cellKeyFor(41.3495, 69.2901, 0.1));
  });
});

describe('buildHotspots', () => {
  it('marks a dense cell as significant', () => {
    const incidents = [
      ...pointsAt(MIN_HOTSPOT_COUNT + 3, 41.2995, 69.2401, { category: 'tech' }),
      ...pointsAt(1, 41.35, 69.29, { category: 'keys' }),
    ];

    const [top] = buildHotspots(incidents);

    expect(top.count).toBe(MIN_HOTSPOT_COUNT + 3);
    expect(top.significant).toBe(true);
    expect(top.topCategory).toBe('tech');
  });

  it('does not call a handful of points a hotspot', () => {
    const incidents = [
      ...pointsAt(3, 41.2995, 69.2401),
      ...pointsAt(3, 41.35, 69.29),
    ];

    for (const cell of buildHotspots(incidents)) {
      expect(cell.significant).toBe(false);
    }
  });

  it('ignores incidents without usable coordinates', () => {
    const incidents: IncidentPoint[] = [
      ...pointsAt(MIN_HOTSPOT_COUNT, 41.2995, 69.2401),
      { lat: Number.NaN, lng: 69.24 },
      { lat: 41.3, lng: Number.POSITIVE_INFINITY },
    ];

    const cells = buildHotspots(incidents);

    expect(cells).toHaveLength(1);
    expect(cells[0].count).toBe(MIN_HOTSPOT_COUNT);
  });

  it('centres the cell on the real points, not the grid corner', () => {
    const cells = buildHotspots(pointsAt(4, 41.2995, 69.2401));

    expect(cells[0].centerLat).toBeGreaterThan(41.2995);
    expect(cells[0].centerLat).toBeLessThan(41.2995 + DEFAULT_CELL_SIZE);
  });

  it('reports the share of incidents per cell', () => {
    const incidents = [
      ...pointsAt(6, 41.2995, 69.2401),
      ...pointsAt(2, 41.35, 69.29),
    ];

    const [top] = buildHotspots(incidents);

    expect(top.share).toBeCloseTo(0.75, 5);
  });

  it('returns an empty list for no incidents', () => {
    expect(buildHotspots([])).toEqual([]);
  });
});

describe('buildTemporalProfile', () => {
  it('shifts UTC timestamps into local hours', () => {
    const profile = buildTemporalProfile(
      [{ lat: 41.3, lng: 69.24, occurredAt: '2026-03-02T13:00:00Z' }],
      5,
    );

    expect(profile.peakHour).toBe(18);
  });

  it('counts missing timestamps separately instead of at midnight', () => {
    const profile = buildTemporalProfile([
      { lat: 41.3, lng: 69.24, occurredAt: null },
      { lat: 41.3, lng: 69.24, occurredAt: 'not-a-date' },
      { lat: 41.3, lng: 69.24, occurredAt: '2026-03-02T13:00:00Z' },
    ]);

    expect(profile.unknownTime).toBe(2);
    expect(profile.byHour[0]).toBe(0);
  });

  it('leaves peaks empty when nothing has a timestamp', () => {
    const profile = buildTemporalProfile([
      { lat: 41.3, lng: 69.24, occurredAt: null },
    ]);

    expect(profile.peakHour).toBeNull();
    expect(profile.peakWeekday).toBeNull();
  });
});

describe('compareWindows', () => {
  it('refuses to turn a tiny jump into a trend', () => {
    const trend = compareWindows('tech', 3, 1);

    expect(trend.direction).toBe('insufficient_data');
    expect(trend.changePercent).toBeNull();
  });

  it('calls a small fluctuation stable', () => {
    const trend = compareWindows('tech', 21, 20);

    expect(trend.direction).toBe('stable');
    expect(trend.significant).toBe(false);
  });

  it('flags a clear rise as significant', () => {
    const trend = compareWindows('tech', 60, 20);

    expect(trend.direction).toBe('rising');
    expect(trend.significant).toBe(true);
    expect(trend.changePercent).toBe(200);
  });

  it('flags a clear fall', () => {
    const trend = compareWindows('keys', 10, 40);

    expect(trend.direction).toBe('falling');
    expect(trend.significant).toBe(true);
  });

  it('does not divide by zero when the previous window is empty', () => {
    const trend = compareWindows('docs', 12, 0);

    expect(trend.direction).toBe('rising');
    expect(trend.changePercent).toBeNull();
  });
});

describe('compareGroups', () => {
  it('puts significant movements first', () => {
    const trends = compareGroups(
      { tech: 60, keys: 21, pets: 2 },
      { tech: 20, keys: 20, pets: 1 },
    );

    expect(trends[0].key).toBe('tech');
    expect(trends[0].significant).toBe(true);
    expect(trends.at(-1)?.direction).toBe('insufficient_data');
  });
});
