"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { fetchAllArizalar } from "@/lib/ariza-api";

const MapInner = dynamic(() => import("./MapInner"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center bg-[#ededed] text-sm text-[#777]">
      Xarita yuklanmoqda...
    </div>
  ),
});

const PAGE_SIZE = 4;
const PERIOD_DAYS = {
  "7": 7,
  "30": 30,
  "90": 90,
  all: null,
};
const UNKNOWN_AREA_KEY = "__unknown_area__";
const DEMO_CHANNELS = [
  "yoqolgan_osint",
  "toshkent_topilmalar",
  "topildi_uz",
  "qaytarme_demo",
];
const DEMO_DISTRICTS = [
  { name: "Yunusobod tumani", region: "Toshkent shahri", total: 128, lost: 74, found: 54, sources: DEMO_CHANNELS, categories: [["docs", 42], ["tech", 31], ["keys", 18], ["wallet", 14], ["clothing", 10]], weekly: 35 },
  { name: "Chilonzor tumani", region: "Toshkent shahri", total: 104, lost: 61, found: 43, sources: DEMO_CHANNELS.slice(0, 3), categories: [["tech", 38], ["docs", 28], ["wallet", 16], ["keys", 12], ["clothing", 10]], weekly: 29 },
  { name: "Mirzo Ulug‘bek tumani", region: "Toshkent shahri", total: 87, lost: 49, found: 38, sources: DEMO_CHANNELS.slice(0, 3), categories: [["keys", 29], ["docs", 24], ["tech", 18], ["wallet", 9], ["clothing", 7]], weekly: 23 },
  { name: "Olmazor tumani", region: "Toshkent shahri", total: 73, lost: 41, found: 32, sources: DEMO_CHANNELS.slice(0, 2), categories: [["wallet", 24], ["docs", 19], ["tech", 14], ["keys", 9], ["clothing", 7]], weekly: 18 },
  { name: "Bektemir tumani", region: "Toshkent shahri", total: 18, lost: 10, found: 8, sources: DEMO_CHANNELS.slice(0, 1), categories: [["wallet", 6], ["keys", 5], ["docs", 4], ["tech", 2], ["clothing", 1]], weekly: 4 },
  { name: "Shayxontohur tumani", region: "Toshkent shahri", total: 69, lost: 37, found: 32, sources: DEMO_CHANNELS.slice(0, 3), categories: [["docs", 24], ["tech", 18], ["wallet", 12], ["keys", 9], ["clothing", 6]], weekly: 20 },
  { name: "Yashnobod tumani", region: "Toshkent shahri", total: 64, lost: 36, found: 28, sources: DEMO_CHANNELS.slice(0, 2), categories: [["tech", 22], ["keys", 15], ["docs", 13], ["wallet", 8], ["clothing", 6]], weekly: 17 },
  { name: "Uchtepa tumani", region: "Toshkent shahri", total: 57, lost: 31, found: 26, sources: DEMO_CHANNELS.slice(0, 2), categories: [["wallet", 19], ["docs", 14], ["tech", 11], ["keys", 8], ["clothing", 5]], weekly: 15 },
  { name: "Yakkasaroy tumani", region: "Toshkent shahri", total: 46, lost: 25, found: 21, sources: DEMO_CHANNELS.slice(0, 3), categories: [["docs", 16], ["tech", 12], ["keys", 8], ["wallet", 6], ["clothing", 4]], weekly: 12 },
  { name: "Mirobod tumani", region: "Toshkent shahri", total: 41, lost: 23, found: 18, sources: DEMO_CHANNELS.slice(0, 2), categories: [["tech", 15], ["docs", 11], ["wallet", 7], ["keys", 5], ["clothing", 3]], weekly: 11 },
  { name: "Sergeli tumani", region: "Toshkent shahri", total: 52, lost: 28, found: 24, sources: DEMO_CHANNELS.slice(0, 2), categories: [["keys", 17], ["wallet", 13], ["docs", 11], ["tech", 7], ["clothing", 4]], weekly: 14 },
  { name: "Yangi Hayot tumani", region: "Toshkent shahri", total: 34, lost: 19, found: 15, sources: DEMO_CHANNELS.slice(0, 1), categories: [["wallet", 11], ["docs", 9], ["keys", 6], ["tech", 5], ["clothing", 3]], weekly: 9 },
];
const CATEGORIES = [
  ["docs", "Hujjatlar"],
  ["tech", "Elektronika"],
  ["keys", "Kalitlar"],
  ["wallet", "Hamyon va sumkalar"],
  ["clothing", "Kiyimlar"],
  ["jewelry", "Aksessuarlar"],
  ["vehicle", "Transport"],
  ["toys", "Bolalar buyumlari"],
  ["sports", "Sport"],
  ["books", "Kitoblar"],
  ["pets", "Uy hayvonlari"],
  ["home", "Uy-ro‘zg‘or"],
  ["tools", "Asboblar"],
  ["food", "Boshqa"],
];

function imageUrlFor(item) {
  const image = item.image;
  return typeof image === "string" ? image : image?.url || "";
}

function getCoordinates(item) {
  const rawLat = item.coordinates?.lat;
  const rawLng = item.coordinates?.lng;
  if (rawLat === undefined || rawLat === null || rawLng === undefined || rawLng === null) return null;
  const lat = Number(rawLat);
  const lng = Number(rawLng);
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
    ? { lat, lng }
    : null;
}

function formatAnnouncementDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const time = new Intl.DateTimeFormat("uz-UZ", { hour: "2-digit", minute: "2-digit" }).format(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return `Bugun, ${time}`;
  if (date.toDateString() === yesterday.toDateString()) return `Kecha, ${time}`;
  return `${new Intl.DateTimeFormat("uz-UZ", { day: "numeric", month: "short" }).format(date)}, ${time}`;
}

function getArea(item) {
  const district = item.district && item.district !== "Unknown" ? item.district : "";
  const region = item.region && item.region !== "Unknown" ? item.region : "";
  const name = district || region || "Hudud aniqlanmagan";
  return {
    key: district ? `${region}|${district}` : region || UNKNOWN_AREA_KEY,
    name,
    region,
    district,
  };
}

function getSource(item) {
  return item.provenance?.channelUsername
    || item.provenance?.sourceName
    || (item.provenance?.sourceType && item.provenance.sourceType !== "unknown"
      ? item.provenance.sourceType
      : "");
}

function formatCount(value) {
  return new Intl.NumberFormat("uz-UZ").format(value);
}

function buildDemoAreaStats({ category, region, search, source, status, period }) {
  const days = PERIOD_DAYS[period];
  const query = search.trim().toLocaleLowerCase("uz");

  return DEMO_DISTRICTS.flatMap((district) => {
    const regionMatches = region === "all"
      || region === "Toshkent"
      || region === "Toshkent shahri"
      || region === district.region;
    if (!regionMatches || (source !== "all" && !district.sources.includes(source))) return [];

    const matchingCategory = category === "all"
      ? null
      : district.categories.find(([value]) => value === category);
    if (category !== "all" && !matchingCategory) return [];

    const matchingCategoryLabel = matchingCategory
      ? CATEGORIES.find(([value]) => value === matchingCategory[0])?.[1] || ""
      : "";
    const categoryLabels = district.categories
      .map(([value]) => CATEGORIES.find(([categoryId]) => categoryId === value)?.[1] || "")
      .join(" ");
    const searchableText = `${district.name} ${district.region} ${categoryLabels} ${district.sources.join(" ")}`
      .toLocaleLowerCase("uz");
    if (query && !searchableText.includes(query)) return [];

    const periodTotal = !days || days >= 90
      ? district.total
      : days >= 30
        ? district.total
        : days >= 7
          ? district.weekly
          : Math.max(1, Math.round(district.weekly * days / 7));
    const rawTotal = matchingCategory ? matchingCategory[1] : periodTotal;
    const periodRatio = periodTotal / district.total;
    const lostRatio = district.total ? district.lost / district.total : 0;
    let total = status === "lost"
      ? Math.round(rawTotal * lostRatio)
      : status === "found"
        ? Math.round(rawTotal * (1 - lostRatio))
        : rawTotal;
    if (matchingCategory && !days) total = matchingCategory[1];
    if (matchingCategory && days && days < 30) total = Math.max(1, Math.round(total * periodRatio));
    if (status !== "all" && matchingCategory && days >= 30) {
      total = Math.round(matchingCategory[1] * (status === "lost" ? lostRatio : 1 - lostRatio));
    }
    if (!total) return [];

    const lost = status === "found"
      ? 0
      : status === "lost"
        ? total
        : Math.round(total * lostRatio);
    const found = status === "lost"
      ? 0
      : status === "found"
        ? total
        : total - lost;
    const topCategory = matchingCategory
      ? [matchingCategoryLabel, matchingCategory[1]]
      : [...district.categories]
        .sort((a, b) => b[1] - a[1])
        .map(([value, count]) => [
          CATEGORIES.find(([categoryId]) => categoryId === value)?.[1] || "Boshqa",
          count,
        ])[0];
    const areaKey = `${district.region}|${district.name.replace(/ tumani$/, "")}`;

    return [{
      key: areaKey,
      name: district.name,
      region: district.region,
      district: district.name,
      total,
      lost,
      found,
      sourcedCount: Math.round(total * 0.92),
      sources: source === "all" ? district.sources : [source],
      channels: source === "all" ? district.sources : [source],
      topCategory,
      isDemo: true,
    }];
  }).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, "uz"));
}

function SearchIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="2" />
      <path d="m16 16 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function FilterSelect({ label, value, onChange, options, className = "" }) {
  return (
    <label className={`relative flex h-10 min-w-0 items-center rounded-lg border border-[#dedede] bg-white px-3 ${className}`}>
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-full min-w-0 flex-1 appearance-none bg-transparent pr-5 text-[11px] font-medium text-[#333] outline-none"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>{optionLabel}</option>
        ))}
      </select>
      <svg className="pointer-events-none absolute right-3 h-3.5 w-3.5 text-[#666]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="m7 10 5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </label>
  );
}

function AnnouncementCard({ item, selected, onClick }) {
  const image = imageUrlFor(item);
  const title = item.itemType || item.itemName || "Buyum";
  const place = item.location || [item.region, item.district].filter(Boolean).join(", ") || "Joy ko‘rsatilmagan";
  const isLost = item.status === "lost";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`group flex w-full items-center gap-2.5 rounded-lg border p-2 text-left transition ${
        selected
          ? "border-[#9b9b9b] bg-[#f3f3f3]"
          : "border-[#e5e5e5] bg-white hover:border-[#bcbcbc]"
      }`}
    >
      <span className="h-[78px] w-[68px] shrink-0 overflow-hidden rounded-md bg-[#e9e9e9]">
        {image ? (
          <img src={image} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full place-items-center text-2xl text-[#888]">□</span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-semibold ${
          isLost ? "border-[#d5d5d5] bg-[#f1f1f1] text-[#555]" : "border-[#555] bg-[#555] text-white"
        }`}>
          {isLost ? "Yo‘qolgan" : "Topilgan"}
        </span>
        <span className="mt-1 block truncate text-[11px] font-bold leading-4 text-[#222]">{title}</span>
        <span className="mt-1 flex min-w-0 items-center gap-1 text-[9px] leading-3 text-[#686868]">
          <span aria-hidden="true">⌖</span><span className="truncate">{place}</span>
        </span>
        <span className="mt-1 block truncate text-[9px] leading-3 text-[#686868]">
          ▦&nbsp; {formatAnnouncementDate(item.createdAt) || "Sana ko‘rsatilmagan"}
        </span>
      </span>
      <span className="shrink-0 text-lg leading-none text-[#555]" aria-hidden="true">›</span>
    </button>
  );
}

export default function MapPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("all");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [period, setPeriod] = useState("30");
  const [source, setSource] = useState("all");
  const [mapView, setMapView] = useState("analysis");
  const [mapLayer, setMapLayer] = useState("density");
  const [useDemoMetadata, setUseDemoMetadata] = useState(true);
  const [selectedAreaKey, setSelectedAreaKey] = useState(null);
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [listVisible, setListVisible] = useState(true);

  useEffect(() => {
    let active = true;
    fetchAllArizalar()
      .then((announcements) => {
        if (active) setItems(announcements.filter((item) => getCoordinates(item)));
      })
      .catch((error) => {
        if (active) {
          console.error("Map announcements fetch error:", error);
          setLoadError(error.message || "E’lonlarni yuklashda xatolik yuz berdi.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const regions = useMemo(
    () => [...new Set([...items.map((item) => item.region), "Toshkent shahri"].filter(Boolean))].sort((a, b) => a.localeCompare(b, "uz")),
    [items],
  );

  const sources = useMemo(
    () => [...new Set([...items.map(getSource), ...DEMO_CHANNELS].filter(Boolean))].sort((a, b) => a.localeCompare(b, "uz")),
    [items],
  );

  const periodItems = useMemo(() => {
    const days = PERIOD_DAYS[period];
    if (!days) return items;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return items.filter((item) => {
      const createdAt = new Date(item.createdAt || "").getTime();
      return Number.isFinite(createdAt) && createdAt >= cutoff;
    });
  }, [items, period]);

  const matchingItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("uz");
    return periodItems.filter((item) => {
      const matchesStatus = status === "all" || item.status === status;
      const matchesRegion = region === "all" || item.region === region;
      const matchesCategory = category === "all" || item.category === category;
      const matchesSource = source === "all" || getSource(item) === source;
      const searchableText = [
        item.itemType, item.itemName, item.itemDescription, item.location,
        item.region, item.district, item.provenance?.sourceName, item.provenance?.channelUsername,
      ].filter(Boolean).join(" ").toLocaleLowerCase("uz");
      return matchesStatus && matchesRegion && matchesCategory && matchesSource && (!query || searchableText.includes(query));
    });
  }, [periodItems, search, region, category, status, source]);

  const filteredItems = useMemo(() => {
    return matchingItems
      .filter((item) => !selectedAreaKey || getArea(item).key === selectedAreaKey)
      .sort((a, b) => {
        const first = new Date(a.createdAt || 0).getTime();
        const second = new Date(b.createdAt || 0).getTime();
        return sort === "oldest" ? first - second : second - first;
      });
  }, [matchingItems, selectedAreaKey, sort]);

  const areaStats = useMemo(() => {
    const grouped = new Map();
    for (const item of matchingItems) {
      const area = getArea(item);
      const stats = grouped.get(area.key) || {
        ...area,
        total: 0,
        lost: 0,
        found: 0,
        sourcedCount: 0,
        categories: new Map(),
        sources: new Set(),
        channels: new Set(),
      };
      stats.total += 1;
      if (item.status === "lost") stats.lost += 1;
      if (item.status === "found") stats.found += 1;
      const categoryName = CATEGORIES.find(([value]) => value === item.category)?.[1] || "Boshqa";
      stats.categories.set(categoryName, (stats.categories.get(categoryName) || 0) + 1);
      const itemSource = getSource(item);
      if (itemSource) {
        stats.sourcedCount += 1;
        stats.sources.add(itemSource);
      }
      if (item.provenance?.channelUsername) stats.channels.add(item.provenance.channelUsername);
      grouped.set(area.key, stats);
    }

    return [...grouped.values()]
      .map((stats) => ({
        ...stats,
        sources: [...stats.sources],
        channels: [...stats.channels],
        topCategory: [...stats.categories.entries()].sort((a, b) => b[1] - a[1])[0],
      }))
      .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, "uz"));
  }, [matchingItems]);

  const demoAreaStats = useMemo(
    () => buildDemoAreaStats({ category, region, search, source, status, period }),
    [category, period, region, search, source, status],
  );
  const usingDemoMetadata = mapView === "analysis" && useDemoMetadata;
  const displayAreaStats = usingDemoMetadata ? demoAreaStats : areaStats;
  const metadataItemCount = usingDemoMetadata
    ? demoAreaStats.reduce((total, area) => total + area.total, 0)
    : matchingItems.length;
  const knownSourceCount = usingDemoMetadata
    ? demoAreaStats.reduce((total, area) => total + area.sourcedCount, 0)
    : matchingItems.filter((item) => getSource(item)).length;
  const sourceCoverage = metadataItemCount
    ? Math.round((knownSourceCount / metadataItemCount) * 100)
    : 0;
  const activeChannelCount = usingDemoMetadata
    ? new Set(demoAreaStats.flatMap((area) => area.channels)).size
    : new Set(matchingItems.map((item) => item.provenance?.channelUsername).filter(Boolean)).size;
  const demoLostCount = demoAreaStats.reduce((total, area) => total + area.lost, 0);
  const demoFoundCount = demoAreaStats.reduce((total, area) => total + area.found, 0);
  const overallTopCategory = matchingItems.reduce((counts, item) => {
    const categoryName = CATEGORIES.find(([value]) => value === item.category)?.[1] || "Boshqa";
    counts.set(categoryName, (counts.get(categoryName) || 0) + 1);
    return counts;
  }, new Map());
  const demoTopCategory = DEMO_DISTRICTS.flatMap((district) => district.categories)
    .reduce((counts, [categoryId, count]) => {
      const categoryName = CATEGORIES.find(([value]) => value === categoryId)?.[1] || "Boshqa";
      counts.set(categoryName, (counts.get(categoryName) || 0) + count);
      return counts;
    }, new Map());
  const overallTopCategoryName = (usingDemoMetadata ? [...demoTopCategory.entries()] : [...overallTopCategory.entries()])
    .sort((a, b) => b[1] - a[1])[0]?.[0];
  const unlocatedAreaCount = matchingItems.filter((item) => getArea(item).key === UNKNOWN_AREA_KEY).length;
  const selectedArea = displayAreaStats.find((area) => area.key === selectedAreaKey) || null;
  const orderedAreas = sort === "oldest" ? [...displayAreaStats].reverse() : displayAreaStats;

  useEffect(() => {
    setPage(1);
  }, [search, region, category, status, sort, period, source, selectedAreaKey]);

  useEffect(() => {
    if (selectedItem && !matchingItems.some((item) => item._id === selectedItem._id)) {
      setSelectedItem(null);
    }
  }, [matchingItems, selectedItem]);

  useEffect(() => {
    if (selectedAreaKey && !displayAreaStats.some((area) => area.key === selectedAreaKey)) {
      setSelectedAreaKey(null);
    }
  }, [displayAreaStats, selectedAreaKey]);

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const visibleItems = filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const handleMapReady = useCallback((map) => setMapInstance(map), []);

  const pageNumbers = Array.from({ length: Math.min(pageCount, 5) }, (_, index) => {
    const first = Math.min(Math.max(page - 2, 1), Math.max(pageCount - 4, 1));
    return first + index;
  });

  return (
    <div className="flex min-h-[620px] flex-col gap-2.5 pb-2 pt-3 text-[#202020] lg:h-[calc(100dvh-8px)] lg:min-h-[640px]">
      <div className="flex shrink-0 flex-wrap items-end justify-between gap-2">
        <div>
          <div className="mb-1 flex items-center gap-2 text-[10px] text-[#777]">
            <Link href="/desktop" className="hover:text-[#222]">Bosh sahifa</Link>
            <span aria-hidden="true">/</span><span>Xarita</span>
          </div>
          <h1 className="text-[22px] font-extrabold leading-7 tracking-tight sm:text-2xl">Hududiy OSINT xaritasi</h1>
          <p className="mt-0.5 text-[10px] text-[#777]">Ochiq manbalardagi e’lonlar asosida hududlar kesimida tahlil</p>
        </div>
        <div className="flex h-8 items-center rounded-md border border-[#dedede] bg-white p-0.5">
          {[
            ["items", "E’lonlar xaritasi"],
            ["analysis", "Hududiy tahlil"],
          ].map(([value, label]) => (
            <button
              type="button"
              key={value}
              onClick={() => setMapView(value)}
              aria-pressed={mapView === value}
              className={`h-full rounded px-3 text-[10px] font-semibold transition ${
                mapView === value ? "bg-[#333] text-white" : "text-[#555] hover:bg-[#f2f2f2]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {mapView === "analysis" && (
          <div className="flex h-8 items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-2">
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-amber-800">
              {useDemoMetadata ? "Demo ma’lumotlari" : "Haqiqiy API"}
            </span>
            <button
              type="button"
              onClick={() => {
                setUseDemoMetadata((enabled) => !enabled);
                setSelectedAreaKey(null);
              }}
              className="text-[9px] font-semibold text-amber-900 underline underline-offset-2"
            >
              {useDemoMetadata ? "API ma’lumotini ko‘rish" : "Demo ma’lumotini ko‘rish"}
            </button>
          </div>
        )}
      </div>

      <section aria-label="E’lonlarni filtrlash" className="flex shrink-0 flex-wrap items-center gap-1.5 rounded-lg border border-[#e3e3e3] bg-white p-1.5">
        <label className="flex h-9 min-w-[180px] flex-[1_1_230px] items-center gap-2 rounded-md border border-[#e5e5e5] px-2.5 text-[#666]">
          <SearchIcon />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Hudud yoki kategoriya bo‘yicha qidiring"
            aria-label="Hudud yoki kategoriya bo‘yicha qidiring"
            className="min-w-0 flex-1 bg-transparent text-[11px] text-[#222] outline-none placeholder:text-[#888]"
          />
        </label>
        <FilterSelect
          label="Tahlil davri"
          value={period}
          onChange={setPeriod}
          className="w-[104px] flex-1 sm:flex-none"
          options={[["7", "Davr: 7 kun"], ["30", "Davr: 30 kun"], ["90", "Davr: 90 kun"], ["all", "Barcha vaqt"]]}
        />
        <FilterSelect
          label="Hodisa turi"
          value={status}
          onChange={setStatus}
          className="w-[120px] flex-1 sm:flex-none"
          options={[["all", "Hodisa turi: Barchasi"], ["lost", "Yo‘qolgan"], ["found", "Topilgan"]]}
        />
        <FilterSelect
          label="Kategoriya"
          value={category}
          onChange={setCategory}
          className="w-[116px] flex-1 sm:flex-none"
          options={[["all", "Kategoriya"], ...CATEGORIES]}
        />
        <FilterSelect
          label="Manba"
          value={source}
          onChange={setSource}
          className="w-[105px] flex-1 sm:flex-none"
          options={[["all", "Manba: barchasi"], ...sources.map((value) => [value, value])]}
        />
        <FilterSelect
          label="Viloyat"
          value={region}
          onChange={(value) => { setRegion(value); setSelectedAreaKey(null); }}
          className="w-[108px] flex-1 sm:flex-none"
          options={[["all", "Viloyat"], ...regions.map((value) => [value, value])]}
        />
        <button
          type="button"
          onClick={() => {
            setRegion("all");
            setCategory("all");
            setStatus("all");
            setSort("newest");
            setSearch("");
            setPeriod("30");
            setSource("all");
            setSelectedAreaKey(null);
          }}
          aria-label="Filtrlarni tozalash"
          title="Filtrlarni tozalash"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-[#e5e5e5] bg-white px-2.5 text-[10px] font-semibold text-[#444] hover:bg-[#f1f1f1]"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 5h16l-6.2 7.1V19l-3.6-1.8v-5.1L4 5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          </svg>
          Filtrlash
        </button>
      </section>

      <section className={`grid min-h-0 flex-1 gap-2 ${listVisible ? "lg:grid-cols-[minmax(250px,0.38fr)_minmax(0,1fr)]" : "grid-cols-1"}`}>
        {listVisible && (
          <aside className="flex h-[270px] min-h-0 flex-col overflow-hidden rounded-lg border border-[#e2e2e2] bg-white lg:h-auto">
            <div className="flex shrink-0 items-center justify-between border-b border-[#ededed] px-2.5 py-2">
              <div>
                <h2 className="flex items-center gap-1.5 text-[11px] font-bold">
                  <span aria-hidden="true" className="text-sm text-[#666]">◈</span>
                  {mapView === "analysis" ? "Hududlar" : "E’lonlar xaritasi"}
                </h2>
                <p className="mt-0.5 text-[9px] text-[#777]">
                  {mapView === "analysis"
                    ? `${formatCount(displayAreaStats.length)} ta hudud · ${formatCount(metadataItemCount)} ta e’lon${useDemoMetadata ? " · demo" : ""}`
                    : `${formatCount(filteredItems.length)} ta e’lon`}
                </p>
              </div>
              <FilterSelect
                label={mapView === "analysis" ? "Hududlarni saralash" : "E’lonlarni saralash"}
                value={sort}
                onChange={setSort}
                className="h-8 w-[98px] rounded-md px-2"
                options={mapView === "analysis"
                  ? [["newest", "Ko‘p e’lon"], ["oldest", "Kam e’lon"]]
                  : [["newest", "Eng yangi"], ["oldest", "Eng eski"]]}
              />
            </div>

            <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2">
              {loading ? (
                <div className="py-8 text-center text-xs text-[#777]">E’lonlar yuklanmoqda...</div>
              ) : loadError ? (
                <div role="alert" className="px-2 py-8 text-center text-xs text-[#8b3030]">{loadError}</div>
              ) : mapView === "analysis" ? (
                displayAreaStats.length ? (
                  orderedAreas.map((area, index) => {
                    const sourceRatio = area.total ? area.sourcedCount / area.total : 0;
                    const areaItems = matchingItems.filter((item) => getArea(item).key === area.key);
                    return (
                      <button
                        key={area.key}
                        type="button"
                        aria-pressed={selectedAreaKey === area.key}
                        onClick={() => {
                          setSelectedAreaKey((current) => current === area.key ? null : area.key);
                          const coordinates = areaItems.map(getCoordinates).find(Boolean);
                          if (coordinates) mapInstance?.flyTo([coordinates.lat, coordinates.lng], 12, { duration: 0.7 });
                        }}
                        className={`w-full rounded-md border px-2 py-2 text-left transition ${
                          selectedAreaKey === area.key
                            ? "border-[#bcbcbc] bg-[#f3f3f3]"
                            : "border-transparent hover:border-[#e8e8e8] hover:bg-[#fafafa]"
                        }`}
                      >
                        <span className="flex items-start justify-between gap-2">
                          <span className="flex min-w-0 items-start gap-2">
                            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#ededed] text-[9px] font-bold text-[#444]">{index + 1}</span>
                            <span className="min-w-0">
                              <span className="block truncate text-[10px] font-bold">{area.name}</span>
                              <span className="mt-0.5 flex items-center gap-1 text-[8px] text-[#777]">
                                <span className={`h-1.5 w-1.5 rounded-full ${sourceRatio >= 0.75 ? "bg-[#555]" : sourceRatio > 0 ? "bg-[#a3a3a3]" : "bg-[#d0d0d0]"}`} />
                                {area.region || "Hudud metama’lumoti yo‘q"}
                              </span>
                            </span>
                          </span>
                          <span className="shrink-0 text-right">
                            <span className="block text-[12px] font-extrabold leading-4">{formatCount(area.total)} ta</span>
                            <span className="text-[8px] text-[#777]">e’lon</span>
                          </span>
                        </span>
                        <span className="mt-1.5 flex items-center justify-between gap-2 pl-7 text-[8px] leading-3 text-[#666]">
                          <span className="truncate">{area.topCategory ? `Asosiy kategoriya: ${area.topCategory[0]}` : "Kategoriya ko‘rsatilmagan"}</span>
                          <span className="shrink-0">{area.channels.length} ta kanal</span>
                        </span>
                        <span className="mt-1.5 flex h-1 overflow-hidden rounded-full bg-[#ececec]">
                          <span className="bg-[#777]" style={{ width: `${sourceRatio * 100}%` }} />
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div className="px-3 py-8 text-center text-[10px] leading-5 text-[#777]">
                    Tanlangan davr va filtrlarda hududiy ma’lumot topilmadi.
                    <button type="button" onClick={() => setPeriod("all")} className="ml-1 font-semibold underline underline-offset-2">Barcha vaqtni ko‘rish</button>
                  </div>
                )
              ) : visibleItems.length ? (
                visibleItems.map((item) => (
                  <AnnouncementCard
                    key={item._id}
                    item={item}
                    selected={selectedItem?._id === item._id}
                    onClick={() => {
                      setSelectedItem(item);
                      const coordinates = getCoordinates(item);
                      if (coordinates && mapInstance) mapInstance.flyTo([coordinates.lat, coordinates.lng], 15, { duration: 0.7 });
                    }}
                  />
                ))
              ) : (
                <div className="py-8 text-center text-xs text-[#777]">Mos e’lon topilmadi</div>
              )}
            </div>

            {mapView === "analysis" ? (
              <div className="flex shrink-0 items-center justify-between border-t border-[#ededed] px-2.5 py-2 text-[8px] text-[#777]">
                <span>
                  {useDemoMetadata ? "Namuna metama’lumotlari · " : ""}
                  {formatCount(knownSourceCount)} ta e’londa manba ko‘rsatilgan
                </span>
                <button type="button" onClick={() => setMapView("items")} className="font-semibold text-[#333] hover:underline">E’lonlarni ko‘rish →</button>
              </div>
            ) : (
              <div className="flex shrink-0 items-center justify-center gap-1 border-t border-[#ededed] px-2 py-1.5">
                <button
                  type="button"
                  aria-label="Oldingi sahifa"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="grid h-7 w-7 place-items-center rounded border border-[#e3e3e3] text-sm disabled:opacity-40"
                >‹</button>
                {pageNumbers.map((pageNumber) => (
                  <button
                    type="button"
                    key={pageNumber}
                    aria-current={page === pageNumber ? "page" : undefined}
                    onClick={() => setPage(pageNumber)}
                    className={`h-7 min-w-7 rounded border px-1 text-[10px] ${
                      page === pageNumber ? "border-[#c7c7c7] bg-[#dedede] font-bold" : "border-transparent hover:bg-[#f0f0f0]"
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button
                  type="button"
                  aria-label="Keyingi sahifa"
                  disabled={page >= pageCount}
                  onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                  className="grid h-7 w-7 place-items-center rounded border border-[#e3e3e3] text-sm disabled:opacity-40"
                >›</button>
              </div>
            )}
          </aside>
        )}

        <div className="relative min-h-[260px] overflow-hidden rounded-lg border border-[#dedede] bg-[#e9e9e9]">
          {!loading && !loadError && (
            <MapInner
              items={filteredItems}
              selectedItem={selectedItem}
              onSelect={setSelectedItem}
              onMapReady={handleMapReady}
              layoutKey={listVisible}
              layerMode={mapLayer}
            />
          )}

          <div className="absolute right-2 top-2 z-[500] w-[min(220px,calc(100%-16px))] overflow-hidden rounded-lg border border-[#dedede] bg-white/95 p-2.5 shadow-sm backdrop-blur-sm">
            <h2 className="mb-2 text-[9px] font-bold">Xarita qatlamlari</h2>
            {[
              ["density", "E’lonlar zichligi"],
              ["source", "Manba qamrovi"],
              ["missing", "Manba yetishmaydiganlar"],
            ].map(([value, label]) => (
              <label key={value} className="flex cursor-pointer items-center gap-1.5 py-1 text-[8px] text-[#444]">
                <input
                  type="radio"
                  name="map-layer"
                  value={value}
                  checked={mapLayer === value}
                  onChange={() => setMapLayer(value)}
                  className="h-3 w-3 accent-[#444]"
                />
                {label}
              </label>
            ))}
          </div>

          <aside className="absolute right-2 top-[132px] z-[500] w-[min(220px,calc(100%-16px))] rounded-lg border border-[#dedede] bg-white/95 p-2.5 shadow-sm backdrop-blur-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="truncate text-[10px] font-bold">{selectedArea?.name || "Umumiy ko‘rsatkichlar"}</h2>
                <p className="mt-0.5 truncate text-[8px] text-[#777]">{selectedArea?.region || "Tanlangan davr bo‘yicha"}</p>
              </div>
              {selectedAreaKey && (
                <button type="button" onClick={() => setSelectedAreaKey(null)} aria-label="Hudud tanlovini tozalash" className="text-sm leading-4 text-[#888] hover:text-[#222]">×</button>
              )}
            </div>
            <div className="mt-2 grid grid-cols-3 divide-x divide-[#e8e8e8] border-y border-[#ededed] py-1.5">
              <div className="pr-1"><span className="block text-[7px] text-[#777]">Jami e’lon</span><strong className="text-[11px]">{formatCount(selectedArea?.total ?? metadataItemCount)}</strong></div>
              <div className="px-1"><span className="block text-[7px] text-[#777]">Yo‘qolgan</span><strong className="text-[11px]">{formatCount(selectedArea?.lost ?? (usingDemoMetadata ? demoLostCount : matchingItems.filter((item) => item.status === "lost").length))}</strong></div>
              <div className="pl-1"><span className="block text-[7px] text-[#777]">Topilgan</span><strong className="text-[11px]">{formatCount(selectedArea?.found ?? (usingDemoMetadata ? demoFoundCount : matchingItems.filter((item) => item.status === "found").length))}</strong></div>
            </div>
            <div className="mt-2 flex items-center justify-between text-[8px]">
              <span className="text-[#666]">Manba qamrovi</span>
              <strong>{selectedArea
                ? `${selectedArea.total ? Math.round(selectedArea.sourcedCount / selectedArea.total * 100) : 0}%`
                : `${sourceCoverage}%`}</strong>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#e9e9e9]">
              <span
                className="block h-full rounded-full bg-[#555]"
                style={{ width: `${selectedArea
                  ? (selectedArea.total ? Math.round(selectedArea.sourcedCount / selectedArea.total * 100) : 0)
                  : sourceCoverage}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 text-[7px] text-[#666]">
              <span className="truncate">Asosiy kategoriya</span>
              <strong className="truncate text-right">{selectedArea?.topCategory?.[0] || overallTopCategoryName || "Ma’lumot yo‘q"}</strong>
            </div>
            <div className="mt-1 flex items-center justify-between text-[7px] text-[#666]">
              <span>Manba kanallari</span>
              <strong>{formatCount(selectedArea?.channels.length ?? activeChannelCount)}</strong>
            </div>
            <button
              type="button"
              onClick={() => setMapView("items")}
              className="mt-2 flex h-7 w-full items-center justify-center gap-1 rounded bg-[#333] text-[8px] font-semibold text-white transition hover:bg-[#555]"
            >
              Hudud e’lonlarini ko‘rish <span aria-hidden="true">→</span>
            </button>
          </aside>

          <div className="absolute bottom-2 left-2 z-[500] flex items-center gap-2 rounded-md border border-[#e0e0e0] bg-white/95 px-2 py-1.5 text-[8px] text-[#444] shadow-sm">
            <span className="inline-flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${mapLayer === "source" ? "bg-[#50776d]" : mapLayer === "missing" ? "bg-[#777]" : "bg-[#c5c5c5]"}`} />
              {mapLayer === "density" ? "1–2 ta e’lon" : "Manba bor"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${mapLayer === "source" ? "bg-[#c6c6c6]" : mapLayer === "missing" ? "bg-[#c07849]" : "bg-[#444]"}`} />
              {mapLayer === "density" ? "3+ ta e’lon" : "Manba yo‘q"}
            </span>
          </div>

          <div className="absolute right-2 top-14 z-[500] flex flex-col overflow-hidden rounded-md border border-[#d5d5d5] bg-white shadow-sm">
            <button type="button" aria-label="Kattalashtirish" onClick={() => mapInstance?.zoomIn()} className="grid h-8 w-8 place-items-center border-b border-[#e5e5e5] text-lg hover:bg-[#f3f3f3]">+</button>
            <button type="button" aria-label="Kichraytirish" onClick={() => mapInstance?.zoomOut()} className="grid h-8 w-8 place-items-center text-lg hover:bg-[#f3f3f3]">−</button>
          </div>

          <div className="absolute bottom-2 right-2 z-[500]">
            <button
              type="button"
              onClick={() => setListVisible((visible) => !visible)}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#ccc] bg-white/95 px-2.5 text-[10px] font-semibold text-[#333] shadow-sm hover:bg-white"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 5h16v14H4zM9 5v14" stroke="currentColor" strokeWidth="1.7" />
              </svg>
              {listVisible ? "Ro‘yxatni yashirish" : "Ro‘yxatni ko‘rsatish"}
            </button>
          </div>

          {loadError && (
            <div role="alert" className="absolute inset-0 z-[450] grid place-items-center bg-white/90 p-5 text-center text-sm text-[#8b3030]">
              {loadError}
            </div>
          )}
          {loading && (
            <div className="absolute inset-0 z-[450] grid place-items-center bg-[#ededed] text-sm text-[#777]">
              E’lonlar yuklanmoqda...
            </div>
          )}
        </div>
      </section>
      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-lg border border-[#e3e3e3] bg-white px-3 py-2 text-[8px] text-[#666]">
        <div className="flex min-w-[180px] flex-1 items-center gap-2">
          <span aria-hidden="true" className="text-sm text-[#555]">⌘</span>
          <span className="shrink-0 font-semibold text-[#333]">{useDemoMetadata && mapView === "analysis" ? "Demo manba qamrovi:" : "Manba qamrovi:"}</span>
          <span className="shrink-0">{knownSourceCount}/{metadataItemCount} e’lon</span>
          <span className="h-1.5 min-w-8 flex-1 overflow-hidden rounded-full bg-[#e8e8e8]">
            <span className="block h-full rounded-full bg-[#555]" style={{ width: `${sourceCoverage}%` }} />
          </span>
          <span className="shrink-0 font-bold">{sourceCoverage}%</span>
        </div>
        <span className="flex items-center gap-1.5 border-l border-[#e3e3e3] pl-2">
          <span aria-hidden="true">ⓘ</span>
          {useDemoMetadata && mapView === "analysis"
            ? "Ko‘rsatkichlar vaqtinchalik namuna ma’lumotlari; haqiqiy e’lon nuqtalari API’dan"
            : "Tuman chegaralari va ayrim manba metama’lumotlari hozircha mavjud emas"}
          {unlocatedAreaCount > 0 && <strong className="shrink-0">· {unlocatedAreaCount} ta hudud noma’lum</strong>}
        </span>
        <span className="shrink-0 font-semibold text-[#333]">{formatCount(activeChannelCount)} ta Telegram kanal</span>
      </footer>
    </div>
  );
}
