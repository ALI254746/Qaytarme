import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ariza } from '../../schemas/ariza.schema';
import {
  buildHotspots,
  buildTemporalProfile,
  compareGroups,
  HOTSPOT_VERSION,
  HotspotCell,
  IncidentPoint,
  TemporalProfile,
  TrendResult,
  WEEKDAY_NAMES,
} from '../../utils/hotspot.util';

export type IntelligenceFilters = {
  category?: string;
  status?: string;
  region?: string;
  days?: number;
};

export type HotspotReport = {
  version: string;
  windowDays: number;
  totalIncidents: number;
  mappedIncidents: number;
  /** Announcements with no usable coordinates: honest coverage number. */
  unmappedIncidents: number;
  cells: HotspotCell[];
  significantCells: number;
  note: string;
};

export type TrendReport = {
  version: string;
  windowDays: number;
  currentTotal: number;
  previousTotal: number;
  overall: TrendResult;
  byCategory: TrendResult[];
  byDistrict: TrendResult[];
};

export type TemporalReport = TemporalProfile & {
  version: string;
  windowDays: number;
  peakHourLabel: string | null;
  peakWeekdayLabel: string | null;
  coverage: number;
};

@Injectable()
export class GeoIntelligenceService {
  private readonly logger = new Logger(GeoIntelligenceService.name);

  /** Analysis is capped so one request cannot scan the whole collection. */
  private readonly MAX_DOCUMENTS = 5000;
  private readonly DEFAULT_WINDOW_DAYS = 30;
  private readonly MAX_WINDOW_DAYS = 365;

  constructor(
    @InjectModel(Ariza.name) private readonly arizaModel: Model<Ariza>,
  ) {}

  private windowDays(days?: number): number {
    if (!days || !Number.isFinite(days) || days <= 0) {
      return this.DEFAULT_WINDOW_DAYS;
    }
    return Math.min(Math.floor(days), this.MAX_WINDOW_DAYS);
  }

  private baseQuery(filters: IntelligenceFilters): Record<string, unknown> {
    const query: Record<string, unknown> = {
      // A repost cluster is one real incident. Counting every copy would
      // turn an active channel into a fake hotspot.
      'cluster.isPrimary': { $ne: false },
      moderationStatus: { $ne: 'rejected' },
    };

    if (filters.category) query.category = filters.category;
    if (filters.status) query.status = filters.status;
    if (filters.region) query.region = filters.region;

    return query;
  }

  private async load(
    filters: IntelligenceFilters,
    from: Date,
    to: Date,
  ): Promise<IncidentPoint[]> {
    const rows = await this.arizaModel
      .find({
        ...this.baseQuery(filters),
        // occurredAt is often unknown, so the window is anchored on the
        // record date and occurredAt is used only for the time-of-day view.
        createdAt: { $gte: from, $lt: to },
      })
      .select('category status region district geo coordinates occurredAt')
      .limit(this.MAX_DOCUMENTS)
      .lean()
      .exec();

    return rows.map((row: Record<string, any>) => {
      const geoCoordinates = row.geo?.coordinates;
      const lat = Array.isArray(geoCoordinates)
        ? geoCoordinates[1]
        : row.coordinates?.lat;
      const lng = Array.isArray(geoCoordinates)
        ? geoCoordinates[0]
        : row.coordinates?.lng;

      return {
        id: String(row._id),
        lat: Number(lat),
        lng: Number(lng),
        category: row.category,
        status: row.status,
        region: row.region,
        district: row.district,
        occurredAt: row.occurredAt ?? null,
      };
    });
  }

  async hotspots(filters: IntelligenceFilters = {}): Promise<HotspotReport> {
    const windowDays = this.windowDays(filters.days);
    const to = new Date();
    const from = new Date(to.getTime() - windowDays * 86_400_000);

    const incidents = await this.load(filters, from, to);
    const mapped = incidents.filter(
      (incident) =>
        Number.isFinite(incident.lat) && Number.isFinite(incident.lng),
    );

    const cells = buildHotspots(mapped);
    const significantCells = cells.filter((cell) => cell.significant).length;

    return {
      version: HOTSPOT_VERSION,
      windowDays,
      totalIncidents: incidents.length,
      mappedIncidents: mapped.length,
      unmappedIncidents: incidents.length - mapped.length,
      cells: cells.slice(0, 100),
      significantCells,
      note:
        significantCells === 0
          ? "Bu davrda ishonchli issiq nuqta topilmadi"
          : `${significantCells} ta hudud o'rtachadan sezilarli zich`,
    };
  }

  async temporal(filters: IntelligenceFilters = {}): Promise<TemporalReport> {
    const windowDays = this.windowDays(filters.days);
    const to = new Date();
    const from = new Date(to.getTime() - windowDays * 86_400_000);

    const incidents = await this.load(filters, from, to);
    const profile = buildTemporalProfile(incidents);
    const known = incidents.length - profile.unknownTime;

    return {
      ...profile,
      version: HOTSPOT_VERSION,
      windowDays,
      peakHourLabel:
        profile.peakHour === null ? null : `${profile.peakHour}:00`,
      peakWeekdayLabel:
        profile.peakWeekday === null
          ? null
          : WEEKDAY_NAMES[profile.peakWeekday],
      // Without this the reader cannot tell a real pattern from a pattern
      // built on 12% of the data.
      coverage:
        incidents.length === 0
          ? 0
          : Math.round((known / incidents.length) * 100),
    };
  }

  async trends(filters: IntelligenceFilters = {}): Promise<TrendReport> {
    const windowDays = this.windowDays(filters.days);
    const now = new Date();
    const currentFrom = new Date(now.getTime() - windowDays * 86_400_000);
    const previousFrom = new Date(
      now.getTime() - 2 * windowDays * 86_400_000,
    );

    const [current, previous] = await Promise.all([
      this.load(filters, currentFrom, now),
      this.load(filters, previousFrom, currentFrom),
    ]);

    const countBy = (
      incidents: IncidentPoint[],
      key: 'category' | 'district',
    ): Record<string, number> =>
      incidents.reduce<Record<string, number>>((accumulator, incident) => {
        const value = incident[key];
        if (!value) return accumulator;
        accumulator[value] = (accumulator[value] ?? 0) + 1;
        return accumulator;
      }, {});

    const [overall] = compareGroups(
      { jami: current.length },
      { jami: previous.length },
    );

    return {
      version: HOTSPOT_VERSION,
      windowDays,
      currentTotal: current.length,
      previousTotal: previous.length,
      overall,
      byCategory: compareGroups(
        countBy(current, 'category'),
        countBy(previous, 'category'),
      ),
      byDistrict: compareGroups(
        countBy(current, 'district'),
        countBy(previous, 'district'),
      ).slice(0, 20),
    };
  }
}
