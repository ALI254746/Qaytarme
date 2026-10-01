"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { buildArizaListUrl } from "@/lib/ariza-api";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

const PAGE_SIZE = 6;

const CATEGORIES = [
  { id: "all", labelId: "all", icon: "⌕" },
  { id: "docs", labelId: "documents", icon: "▤" },
  { id: "tech", labelId: "electronics", icon: "▣" },
  { id: "keys", labelId: "keys", icon: "⚿" },
  { id: "wallet", labelId: "bags", icon: "▱" },
  { id: "clothing", labelId: "clothing", icon: "⌑" },
  { id: "jewelry", labelId: "accessories", icon: "◷" },
  { id: "vehicle", labelId: "automotive", icon: "⌑" },
  { id: "toys", labelId: "kids", icon: "♧" },
  { id: "sports", labelId: "sports", icon: "◉" },
  { id: "books", labelId: "books", icon: "▤" },
  { id: "pets", labelId: "pets", icon: "♧" },
  { id: "home", labelId: "home", icon: "⌂" },
  { id: "tools", labelId: "tools", icon: "⚒" },
  { id: "food", labelId: "food", icon: "•••" },
];

function SearchIcon({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="2" />
      <path d="m16 16 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function getOptimizedImageUrl(imageUrl) {
  if (!imageUrl) return null;
  if (!imageUrl.includes("res.cloudinary.com/") || !imageUrl.includes("/image/upload/")) {
    return imageUrl;
  }

  return imageUrl.replace("/image/upload/", "/image/upload/f_auto,q_auto,w_900,c_limit/");
}

function formatDisplayDate(dateValue) {
  const parts = new Intl.DateTimeFormat("uz-UZ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(dateValue));
  const dateParts = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${dateParts.day}.${dateParts.month}.${dateParts.year}`;
}

function ItemCard({ item, t }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = typeof item.image === "string" ? item.image : item.image?.url;
  const optimizedImageUrl = getOptimizedImageUrl(imageUrl);
  const location = item.location || [item.region, item.district].filter(Boolean).join(", ");
  const categoryOption = CATEGORIES.find((option) => option.id === item.category);
  const category = t(`cat_${categoryOption?.labelId || "food"}`);
  const createdAt = item.createdAt ? formatDisplayDate(item.createdAt) : "";

  return (
    <article className="group overflow-hidden rounded-xl border border-[#dedede] bg-white transition hover:border-[#bcbcbc] hover:shadow-md">
      <Link href={`/desktop/item/${item._id}?returnTo=${encodeURIComponent("/desktop")}`} className="block">
        <div className="relative aspect-[3/1] overflow-hidden bg-[#e7e7e7]">
          {optimizedImageUrl && !imageFailed ? (
            <img
              src={optimizedImageUrl.startsWith("http:") ? optimizedImageUrl.replace("http:", "https:") : optimizedImageUrl}
              alt={item.itemType || ""}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
              loading="lazy"
              decoding="async"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="grid h-full place-items-center bg-gradient-to-br from-[#e4e4e4] to-[#f1f1f1] text-4xl text-[#888]">
              {item.category === "tech" ? "▣" : item.category === "keys" ? "⚿" : item.category === "docs" ? "▤" : "□"}
            </div>
          )}
          <span
            className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold text-white ${
              item.status === "lost" ? "bg-[#686868]" : "bg-[#aaa]"
            }`}
          >
            {item.status === "lost" ? t("filter_lost") : t("filter_found")}
          </span>
          <span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-md border border-[#dedede] bg-white/95 text-[#555]" aria-hidden="true">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
              <path d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-3.7L6 21V4.8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
        <div className="flex min-h-[66px] items-center justify-between gap-2 px-3 py-1 [@media(max-height:680px)]:min-h-[60px] [@media(max-height:680px)]:py-0.5">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold leading-4 text-[#202020]">{item.itemType || t("cat_food")}</h3>
            <div className="mt-1 flex items-center gap-1.5 text-[10px] leading-3 text-[#777]">
              <span aria-hidden="true">▧</span>
              <span className="truncate">{category}</span>
            </div>
            {location && (
              <div className="mt-0.5 flex items-center gap-1.5 text-[10px] leading-3 text-[#777]">
                <span aria-hidden="true">⌖</span>
                <span className="truncate">{location}</span>
              </div>
            )}
            {createdAt && (
              <div className="mt-0.5 flex items-center gap-1.5 text-[10px] leading-3 text-[#777]">
                <span aria-hidden="true">▦</span>
                <span>{createdAt}</span>
              </div>
            )}
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#dedede] px-2.5 py-2 text-[10px] font-semibold text-[#333] transition group-hover:border-[#999]">
            Batafsil <span aria-hidden="true">→</span>
          </span>
        </div>
      </Link>
    </article>
  );
}

function SelectIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m7 10 5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q") || "";
  const { t, lang } = useLanguage();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [filter, setFilter] = useState("all");
  const [category, setCategory] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  useEffect(() => {
    const controller = new AbortController();
    const fetchItems = async () => {
      setLoading(true);
      setError("");
      try {
        const url = buildArizaListUrl({
          page,
          limit: PAGE_SIZE,
          search: searchQuery,
          status: filter,
          category,
          lang,
        });
        const response = await fetch(url, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "E'lonlarni yuklashda xatolik yuz berdi.");
        }
        setItems(data.arizalar || []);
        setTotal(Number(data.total) || 0);
        setHasMore(Boolean(data.hasMore));
      } catch (fetchError) {
        if (fetchError.name !== "AbortError") {
          console.error("Error fetching items:", fetchError);
          setItems([]);
          setError(fetchError.message || "E'lonlarni yuklashda xatolik yuz berdi.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchItems();
    return () => controller.abort();
  }, [page, searchQuery, filter, category, lang]);

  const sortedItems = [...items].sort((first, second) => {
    const firstDate = new Date(first.createdAt || 0).getTime();
    const secondDate = new Date(second.createdAt || 0).getTime();
    return sortOrder === "oldest" ? firstDate - secondDate : secondDate - firstDate;
  });
  const pageCount = total > 0 ? Math.ceil(total / PAGE_SIZE) : hasMore ? page + 1 : page;
  const visiblePageCount = Math.min(pageCount, 5);
  const firstVisiblePage = Math.min(
    Math.max(page - 2, 1),
    Math.max(pageCount - visiblePageCount + 1, 1),
  );
  const pageNumbers = Array.from(
    { length: visiblePageCount },
    (_, index) => firstVisiblePage + index,
  );
  const userName = session?.user?.name || t("default_user_name");

  const resetFilters = () => {
    setFilter("all");
    setCategory("all");
    setSortOrder("newest");
    setPage(1);
  };

  return (
    <div className="bg-[#f7f7f7] pb-2 text-[#1c1c1c]">
      <section className="mb-1 flex flex-col justify-between gap-2 rounded-xl border border-[#e2e2e2] bg-[#f0f0f0] px-4 py-3 sm:flex-row sm:items-center sm:px-5 [@media(max-height:680px)]:py-2">
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Xush kelibsiz, {userName}</h1>
          <p className="mt-1 text-xs text-[#727272] sm:text-sm">
            Yo&apos;qolgan buyumingizni qidiring yoki topilgan buyum haqida e&apos;lon bering.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href="/desktop/add"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#555] bg-white px-3 text-xs font-semibold transition hover:bg-[#e9e9e9]"
          >
            <span aria-hidden="true">⌕</span> Buyum yo&apos;qoldi
          </Link>
          <Link
            href="/desktop/add"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#222] px-3 text-xs font-semibold text-white transition hover:bg-[#444]"
          >
            <span aria-hidden="true">＋</span> Buyum topildi
          </Link>
        </div>
      </section>

      <section className="mb-2 rounded-xl border border-[#e2e2e2] bg-white px-3 py-2 [@media(max-height:680px)]:py-1">
        <div className="flex flex-wrap items-center gap-2.5 border-b border-[#ededed] pb-2 [@media(max-height:680px)]:gap-2 [@media(max-height:680px)]:pb-1">
          <div className="flex rounded-lg bg-[#f0f0f0] p-1">
            {[
              { id: "all", label: t("filter_all") || "Barchasi" },
              { id: "lost", label: t("filter_lost") || "Yo'qolgan" },
              { id: "found", label: t("filter_found") || "Topilgan" },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setFilter(option.id);
                  setPage(1);
                }}
                className={`rounded-md px-3 py-1.5 text-[11px] font-semibold transition [@media(max-height:680px)]:py-1 ${
                  filter === option.id ? "bg-[#666] text-white shadow-sm" : "text-[#555] hover:bg-white"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <label className="relative flex h-9 min-w-[140px] items-center justify-between gap-5 rounded-lg border border-[#e0e0e0] px-3 text-[11px] font-medium text-[#444]">
            <span>{category === "all" ? "Kategoriya" : t(`cat_${CATEGORIES.find((option) => option.id === category)?.labelId}`)}</span>
            <select
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setPage(1);
              }}
              aria-label="Kategoriya bo'yicha filtrlash"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            >
              {CATEGORIES.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.id === "all" ? t("filter_all") : t(`cat_${option.labelId}`)}
                </option>
              ))}
            </select>
            <span className="pointer-events-none"><SelectIcon /></span>
          </label>
          <label className="flex h-9 min-w-[130px] items-center justify-between gap-5 rounded-lg border border-[#e0e0e0] px-3 text-[11px] font-medium text-[#444]">
            <span>Sana</span>
            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              aria-label="Sana bo'yicha tartiblash"
              className="h-full min-w-0 flex-1 bg-transparent text-right outline-none"
            >
              <option value="newest">Eng yangi</option>
              <option value="oldest">Eng eski</option>
            </select>
          </label>
          <button
            type="button"
            onClick={resetFilters}
            className="ml-auto inline-flex h-9 items-center gap-2 px-2 text-[11px] font-medium text-[#666] hover:text-black"
          >
            <span aria-hidden="true">⌁</span> Filtrni tozalash
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [@media(max-height:680px)]:pt-1">
          {CATEGORIES.slice(1).map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                setCategory(category === option.id ? "all" : option.id);
                setPage(1);
              }}
              className={`inline-flex h-8 shrink-0 items-center gap-2 rounded-lg px-3 text-[10px] font-medium transition [@media(max-height:680px)]:h-7 ${
                category === option.id ? "bg-[#d9d9d9] text-[#222]" : "bg-[#f0f0f0] text-[#555] hover:bg-[#e6e6e6]"
              }`}
            >
              <span aria-hidden="true" className="text-sm">{option.icon}</span>
              {t(`cat_${option.labelId}`)}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <h2 className="text-lg font-extrabold tracking-tight">So&apos;nggi e&apos;lonlar</h2>
            <span className="text-[11px] text-[#777]">{total || items.length} ta e&apos;lon</span>
          </div>
          <label className="sr-only" htmlFor="item-sort">E&apos;lonlarni tartiblash</label>
          <div className="flex h-8 items-center gap-2 rounded-lg border border-[#e2e2e2] bg-white px-2.5 text-[10px] text-[#444]">
            <span aria-hidden="true">↕</span>
            <select
              id="item-sort"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              className="bg-transparent font-medium outline-none"
            >
              <option value="newest">Eng yangi</option>
              <option value="oldest">Eng eski</option>
            </select>
          </div>
        </div>

        {error ? (
          <div role="alert" className="rounded-xl border border-[#dedede] bg-white p-8 text-center text-sm text-[#555]">
            {error}
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
            {Array.from({ length: PAGE_SIZE }, (_, index) => (
              <div key={index} className="h-[230px] animate-pulse overflow-hidden rounded-xl border border-[#e5e5e5] bg-white">
                <div className="h-[130px] bg-[#e9e9e9]" />
                <div className="space-y-2 p-3">
                  <div className="h-3 w-2/3 rounded bg-[#e9e9e9]" />
                  <div className="h-2 w-1/2 rounded bg-[#eee]" />
                </div>
              </div>
            ))}
          </div>
        ) : sortedItems.length ? (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 [@media(max-height:680px)]:gap-2">
            {sortedItems.map((item) => (
              <motion.div key={item._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <ItemCard item={item} t={t} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#d9d9d9] bg-white px-6 py-14 text-center">
            <div className="text-4xl text-[#888]" aria-hidden="true">□</div>
            <h3 className="mt-3 text-base font-bold">{t("empty_title")}</h3>
            <p className="mt-1 text-sm text-[#777]">{t("empty_desc")}</p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 rounded-lg bg-[#252525] px-4 py-2 text-xs font-semibold text-white hover:bg-[#444]"
            >
              {t("empty_action")}
            </button>
          </div>
        )}

        {sortedItems.length > 0 && (
          <nav aria-label="Sahifalash" className="mt-3 flex items-center justify-center gap-1.5 [@media(max-height:680px)]:mt-2">
            <button
              type="button"
              disabled={page === 1 || loading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              aria-label="Oldingi sahifa"
              className="grid h-8 w-8 place-items-center rounded-lg border border-[#e0e0e0] bg-white text-sm disabled:opacity-40 [@media(max-height:680px)]:h-7 [@media(max-height:680px)]:w-7"
            >
              ‹
            </button>
            {pageNumbers.map((number) => (
              <button
                key={number}
                type="button"
                onClick={() => setPage(number)}
                aria-current={page === number ? "page" : undefined}
                className={`grid h-8 w-8 place-items-center rounded-lg border text-xs [@media(max-height:680px)]:h-7 [@media(max-height:680px)]:w-7 ${
                  page === number ? "border-[#333] bg-[#333] font-bold text-white" : "border-[#e0e0e0] bg-white text-[#444] hover:bg-[#eee]"
                }`}
              >
                {number}
              </button>
            ))}
            <button
              type="button"
              disabled={!hasMore || loading}
              onClick={() => setPage((current) => current + 1)}
              aria-label="Keyingi sahifa"
              className="grid h-8 w-8 place-items-center rounded-lg border border-[#e0e0e0] bg-white text-sm disabled:opacity-40 [@media(max-height:680px)]:h-7 [@media(max-height:680px)]:w-7"
            >
              ›
            </button>
          </nav>
        )}
      </section>
    </div>
  );
}
