"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { getApiUrl } from "@/lib/api-config";

const PAGE_SIZE = 4;
const CATEGORY_LABELS = {
  docs: "Hujjatlar",
  tech: "Elektronika",
  keys: "Kalitlar",
  wallet: "Sumka, ryukzaklar",
  clothing: "Kiyimlar",
  jewelry: "Aksessuarlar",
  vehicle: "Transport",
  toys: "Bolalar buyumlari",
  sports: "Sport buyumlari",
  books: "Kitoblar",
  pets: "Uy hayvonlari",
  home: "Uy-ro‘zg‘or",
  tools: "Asboblar",
};

function idOf(value) {
  if (!value) return "";
  return String(typeof value === "object" ? value._id || value.id || "" : value);
}

function getImage(item) {
  if (typeof item?.image === "string") return item.image;
  return item?.image?.url || item?.imageUrl || "";
}

function getItemDate(item) {
  const date = new Date(item?.createdAt || item?.date || "");
  if (Number.isNaN(date.getTime())) return "Sana ko‘rsatilmagan";
  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getLocation(item) {
  return item?.location || [item?.region, item?.district].filter(Boolean).join(", ") || "Joylashuv ko‘rsatilmagan";
}

function getItemTitle(item) {
  return item?.itemName || item?.itemType || "Noma’lum buyum";
}

function getUnread(match, userId) {
  if (userId && idOf(match.user1) === userId) return !match.isRead1;
  if (userId && idOf(match.user2) === userId) return !match.isRead2;
  return !match.isRead1 && !match.isRead2;
}

function getPartnerUserId(item) {
  return idOf(item?.user);
}

function MatchImage({ item, className = "" }) {
  const image = getImage(item);
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-lg bg-[#ededed] ${className}`}>
      {image ? (
        <img src={image} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full w-full place-items-center text-2xl text-[#777]" aria-hidden="true">▧</div>
      )}
    </div>
  );
}

function MatchCard({ match, ownItem, otherItem, unread, mobile }) {
  const score = Math.min(100, Math.max(0, Number(match.similarity) || 0));
  const itemType = otherItem.status === "lost" ? "Yo‘qolgan" : "Topilgan";
  const targetId = idOf(otherItem);
  const partnerUserId = getPartnerUserId(otherItem);
  const chips = String(match.reason || "")
    .split(/[;,|•]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 3);
  const detailHref = `/${mobile ? "mobile" : "desktop"}/item/${targetId}`;
  const messageHref = `/${mobile ? "mobile" : "desktop"}/messages?userId=${encodeURIComponent(partnerUserId)}&itemId=${encodeURIComponent(targetId)}`;

  return (
    <article className={`relative grid items-center gap-2 rounded-lg border border-[#e3e3e3] bg-white px-2.5 py-2.5 ${unread ? "before:absolute before:left-2 before:top-3 before:h-2 before:w-2 before:rounded-full before:bg-[#454545]" : ""} ${mobile ? "grid-cols-1" : "md:grid-cols-[minmax(0,1.55fr)_minmax(150px,0.82fr)_68px_98px]"} `}>
      <div className="flex min-w-0 items-center gap-2.5 pl-1">
        <MatchImage item={otherItem} className="h-[66px] w-[66px] sm:h-[72px] sm:w-[72px]" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-md bg-[#e9e9e9] px-1.5 py-0.5 text-[8px] font-semibold text-[#454545]">{itemType}</span>
            <h3 className="truncate text-[11px] font-bold text-[#222]">{getItemTitle(otherItem)}</h3>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[8px] text-[#666]">
            <span className="inline-flex items-center gap-1">▱ {CATEGORY_LABELS[otherItem.category] || otherItem.category || "Buyum"}</span>
            <span className="inline-flex items-center gap-1">⌖ {getLocation(otherItem)}</span>
            <span className="inline-flex items-center gap-1">▦ {getItemDate(otherItem)}</span>
          </div>
          <p className="mt-1 line-clamp-2 text-[9px] leading-4 text-[#555]">{otherItem.itemDescription || otherItem.description || "Tavsif berilmagan."}</p>
        </div>
      </div>

      <div className="min-w-0 border-t border-[#eeeeee] pt-2 md:border-l md:border-t-0 md:pl-2 md:pt-0">
        <p className="text-[8px] font-medium text-[#777]">Mos kelgan belgilar</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {(chips.length ? chips : [CATEGORY_LABELS[ownItem.category] || ownItem.category || "Kategoriya"]).map((chip, index) => (
            <span key={`${chip}-${index}`} className="max-w-full truncate rounded-full bg-[#eeeeee] px-2 py-1 text-[8px] text-[#4e4e4e]">
              {chip}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 border-t border-[#eeeeee] pt-2 md:border-0 md:pt-0">
        <div
          className="grid h-[56px] w-[56px] shrink-0 place-items-center rounded-full"
          style={{ background: `conic-gradient(#454545 ${score}%, #dedede ${score}% 100%)` }}
          aria-label={`${score}% moslik`}
        >
          <div className="grid h-[46px] w-[46px] place-content-center rounded-full bg-white text-center">
            <strong className="text-[13px] leading-4 text-[#222]">{score}%</strong>
            <span className="text-[7px] text-[#777]">mos</span>
          </div>
        </div>
      </div>

      <div className="flex gap-1.5 border-t border-[#eeeeee] pt-2 md:flex-col md:border-0 md:pt-0">
        <Link href={detailHref} className="flex h-8 flex-1 items-center justify-center rounded-md border border-[#dedede] bg-white px-2 text-[9px] font-semibold text-[#333] transition hover:bg-[#f5f5f5]">
          Batafsil
        </Link>
        {partnerUserId ? (
          <Link href={messageHref} className="flex h-8 flex-1 items-center justify-center rounded-md bg-[#3c3c3c] px-2 text-[9px] font-semibold text-white transition hover:bg-[#222]">
            Xabar yozish
          </Link>
        ) : (
          <span className="flex h-8 flex-1 items-center justify-center rounded-md bg-[#ededed] px-2 text-[9px] text-[#777]">
            Xabar mavjud emas
          </span>
        )}
      </div>
    </article>
  );
}

export default function MatchesIntelligencePage({ mobile = false }) {
  const { data: session, status: sessionStatus } = useSession();
  const [matches, setMatches] = useState([]);
  const [ownItems, setOwnItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("best");
  const [page, setPage] = useState(1);
  const [markingRead, setMarkingRead] = useState(false);

  const accessToken = session?.user?.accessToken;
  const userId = idOf(session?.user?.id || session?.user?._id);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!accessToken) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError("");
    Promise.all([
      fetch(getApiUrl("matches"), { headers: { Authorization: `Bearer ${accessToken}` } }),
      fetch(getApiUrl("ariza/my"), { headers: { Authorization: `Bearer ${accessToken}` } }),
    ])
      .then(async ([matchesResponse, itemsResponse]) => {
        if (!matchesResponse.ok || !itemsResponse.ok) {
          throw new Error("Mosliklar yoki e’lonlaringizni yuklab bo‘lmadi.");
        }
        const [matchData, itemData] = await Promise.all([matchesResponse.json(), itemsResponse.json()]);
        if (!active) return;
        setMatches(matchData.filter((match) =>
          match.lostItem
          && match.foundItem
          && match.lostItem.moderationStatus !== "returned"
          && match.foundItem.moderationStatus !== "returned",
        ));
        setOwnItems(itemData.filter((item) => item.moderationStatus !== "returned"));
      })
      .catch((fetchError) => {
        if (active) {
          console.error("Matches fetch error:", fetchError);
          setError(fetchError.message || "Mosliklarni yuklashda xatolik yuz berdi.");
        }
      })
      .finally(() => active && setLoading(false));

    return () => { active = false; };
  }, [accessToken, sessionStatus]);

  const sortedOwnItems = useMemo(
    () => [...ownItems].sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0)),
    [ownItems],
  );
  const selectedItem = sortedOwnItems.find((item) => idOf(item) === selectedItemId) || sortedOwnItems[0] || null;

  useEffect(() => {
    if (!selectedItem || selectedItemId === idOf(selectedItem)) return;
    setSelectedItemId(idOf(selectedItem));
  }, [selectedItem, selectedItemId]);

  const itemMatches = useMemo(() => {
    if (!selectedItem) return [];
    const selectedId = idOf(selectedItem);
    return matches.filter((match) =>
      idOf(match.lostItem) === selectedId || idOf(match.foundItem) === selectedId,
    );
  }, [matches, selectedItem]);

  const unreadCount = itemMatches.filter((match) => getUnread(match, userId)).length;
  const highCount = itemMatches.filter((match) => Number(match.similarity) >= 70).length;
  const filteredMatches = useMemo(() => {
    const result = itemMatches.filter((match) => {
      if (filter === "high") return Number(match.similarity) >= 70;
      if (filter === "unread") return getUnread(match, userId);
      return true;
    });
    return result.sort((a, b) => sort === "newest"
      ? new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      : (Number(b.similarity) || 0) - (Number(a.similarity) || 0));
  }, [filter, itemMatches, sort, userId]);

  useEffect(() => setPage(1), [filter, selectedItemId, sort]);

  const pageCount = Math.max(1, Math.ceil(filteredMatches.length / PAGE_SIZE));
  const pageMatches = filteredMatches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageNumbers = Array.from({ length: Math.min(pageCount, 5) }, (_, index) => {
    const first = Math.min(Math.max(page - 2, 1), Math.max(pageCount - 4, 1));
    return first + index;
  });

  const handleMarkAllRead = async () => {
    if (!accessToken || unreadCount === 0 || markingRead) return;
    setMarkingRead(true);
    setError("");
    try {
      const response = await fetch(getApiUrl("matches/read-all"), {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) throw new Error("Mosliklarni o‘qilgan deb belgilab bo‘lmadi.");
      setMatches((current) => current.map((match) => (
        idOf(match.user1) === userId
          ? { ...match, isRead1: true }
          : idOf(match.user2) === userId
            ? { ...match, isRead2: true }
            : match
      )));
    } catch (markError) {
      console.error("Mark matches read error:", markError);
      setError(markError.message || "Mosliklarni o‘qilgan deb belgilashda xatolik yuz berdi.");
    } finally {
      setMarkingRead(false);
    }
  };

  const mainClass = mobile
    ? "min-h-screen space-y-2.5 px-3 pb-28 pt-4"
    : "space-y-2.5 pb-3";

  return (
    <div className={mainClass}>
      <header className="flex flex-wrap items-center justify-between gap-2 px-0.5">
        <div>
          <h1 className="text-[21px] font-extrabold leading-7 tracking-tight text-[#202020]">Mos kelganlar</h1>
          <p className="text-[10px] text-[#777]">Sizning e’lonlaringizga o‘xshash topilgan va yo‘qolgan buyumlar.</p>
        </div>
        <div className="inline-flex h-7 items-center gap-1.5 rounded-md border border-[#e2e2e2] bg-white px-2 text-[9px] font-medium text-[#555]">
          <span aria-hidden="true">ⓘ</span> Mosliklar avtomatik yangilanadi
        </div>
      </header>

      <section className="rounded-lg border border-[#e3e3e3] bg-white p-2.5">
        <label htmlFor="match-item" className="mb-1.5 block text-[11px] font-bold text-[#252525]">Qaysi e’lon uchun?</label>
        <div className="flex min-w-0 items-center gap-2 rounded-md border border-[#e5e5e5] bg-[#fcfcfc] p-1.5">
          {selectedItem ? (
            <>
              <MatchImage item={selectedItem} className="h-10 w-10" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-md px-1.5 py-0.5 text-[8px] font-semibold ${selectedItem.status === "lost" ? "bg-[#e9e9e9] text-[#454545]" : "bg-[#e9f0ed] text-[#44645b]"}`}>
                    {selectedItem.status === "lost" ? "Yo‘qolgan" : "Topilgan"}
                  </span>
                  <strong className="truncate text-[10px] text-[#222]">{getItemTitle(selectedItem)}</strong>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[8px] text-[#777]">
                  <span>⌖ {getLocation(selectedItem)}</span><span>▦ {getItemDate(selectedItem)}</span>
                </div>
              </div>
              <label className="sr-only" htmlFor="match-item">E’lonni tanlang</label>
              <select
                id="match-item"
                aria-label="Mosliklarni ko‘rish uchun e’lonni tanlang"
                value={idOf(selectedItem)}
                onChange={(event) => setSelectedItemId(event.target.value)}
                className="max-w-[150px] rounded-md border border-[#e4e4e4] bg-white px-2 py-1.5 text-[9px] text-[#555] outline-none"
              >
                {sortedOwnItems.map((item) => <option key={idOf(item)} value={idOf(item)}>{getItemTitle(item)}</option>)}
              </select>
            </>
          ) : (
            <p className="px-2 py-2 text-[10px] text-[#777]">
              {accessToken ? "Mosliklarni ko‘rish uchun avval e’lon joylang." : "Mosliklarni ko‘rish uchun tizimga kiring."}
            </p>
          )}
        </div>
      </section>

      <section aria-label="Mosliklarni filtrlash" className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1 rounded-md border border-[#e2e2e2] bg-white p-0.5">
          {[
            ["all", "Barchasi", itemMatches.length],
            ["high", "Yuqori moslik", highCount],
            ["unread", "Ko‘rib chiqilmagan", unreadCount],
          ].map(([value, label, count]) => (
            <button
              type="button"
              key={value}
              onClick={() => setFilter(value)}
              aria-pressed={filter === value}
              className={`flex h-6 items-center gap-1.5 rounded px-2 text-[9px] transition ${filter === value ? "bg-[#e8e8e8] font-semibold text-[#222]" : "text-[#555] hover:bg-[#f5f5f5]"}`}
            >
              {label}<span className="rounded bg-white/70 px-1 text-[8px]">{count}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="match-sort">Saralash</label>
          <select
            id="match-sort"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="h-7 rounded-md border border-[#dedede] bg-white px-2 text-[9px] text-[#333] outline-none"
          >
            <option value="best">Eng moslari</option>
            <option value="newest">Eng yangilari</option>
          </select>
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0 || markingRead}
            className="inline-flex h-7 items-center gap-1 rounded-md px-1.5 text-[9px] font-semibold text-[#444] hover:bg-white disabled:cursor-default disabled:text-[#999]"
          >
            <span aria-hidden="true">✓</span> {markingRead ? "Belgilanmoqda..." : "Barchasini o‘qilgan qilish"}
          </button>
        </div>
      </section>

      <div role="note" className="flex min-h-7 items-center gap-2 rounded-md border border-[#e3e3e3] bg-white px-2.5 py-1.5 text-[9px] text-[#5d5d5d]">
        <span aria-hidden="true" className="text-sm">⛨</span>
        Shaxsiy ma’lumotlarni suhbatda tekshiring. Telefon raqamingizni oshkor qilmang.
      </div>

      {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[10px] text-red-700">{error}</div>}
      {loading || sessionStatus === "loading" ? (
        <div className="space-y-2" aria-label="Mosliklar yuklanmoqda">
          {[0, 1, 2].map((index) => <div key={index} className="h-[86px] animate-pulse rounded-lg border border-[#e7e7e7] bg-white" />)}
        </div>
      ) : !accessToken ? (
        <div className="rounded-lg border border-[#e3e3e3] bg-white px-4 py-10 text-center">
          <h2 className="text-sm font-bold text-[#292929]">Mosliklaringizni ko‘rish uchun tizimga kiring</h2>
          <Link href={mobile ? "/login?callbackUrl=%2Fmobile%2Fmatches" : "/login?callbackUrl=%2Fdesktop%2Fmatches"} className="mt-3 inline-flex rounded-md bg-[#3c3c3c] px-4 py-2 text-[10px] font-semibold text-white">Tizimga kirish</Link>
        </div>
      ) : !selectedItem ? (
        <div className="rounded-lg border border-[#e3e3e3] bg-white px-4 py-10 text-center text-[10px] text-[#777]">
          E’lonlaringiz topilmadi. <Link href={`/${mobile ? "mobile" : "desktop"}/add`} className="font-semibold text-[#333] underline">E’lon joylash</Link>
        </div>
      ) : pageMatches.length ? (
        <>
          <section className="space-y-2" aria-label="Mos kelgan e’lonlar">
            {pageMatches.map((match) => {
              const selectedId = idOf(selectedItem);
              const ownItem = idOf(match.lostItem) === selectedId ? match.lostItem : match.foundItem;
              const otherItem = idOf(match.lostItem) === selectedId ? match.foundItem : match.lostItem;
              return (
                <MatchCard
                  key={match._id}
                  match={match}
                  ownItem={ownItem}
                  otherItem={otherItem}
                  unread={getUnread(match, userId)}
                  mobile={mobile}
                />
              );
            })}
          </section>
          {pageCount > 1 && (
            <nav aria-label="Mosliklar sahifalari" className="flex items-center justify-center gap-1">
              <button type="button" aria-label="Oldingi sahifa" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="grid h-7 w-7 place-items-center rounded-md border border-[#e0e0e0] bg-white text-xs disabled:opacity-40">‹</button>
              {pageNumbers.map((number) => (
                <button type="button" key={number} aria-current={page === number ? "page" : undefined} onClick={() => setPage(number)} className={`h-7 min-w-7 rounded-md border px-2 text-[9px] ${page === number ? "border-[#3d3d3d] bg-[#3d3d3d] font-semibold text-white" : "border-[#e0e0e0] bg-white text-[#444]"}`}>{number}</button>
              ))}
              <button type="button" aria-label="Keyingi sahifa" disabled={page >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} className="grid h-7 w-7 place-items-center rounded-md border border-[#e0e0e0] bg-white text-xs disabled:opacity-40">›</button>
              <span className="ml-3 text-[8px] text-[#777]">{itemMatches.length} ta natijadan {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredMatches.length)} ko‘rsatilmoqda</span>
            </nav>
          )}
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-[#d8d8d8] bg-white px-4 py-12 text-center">
          <div className="text-2xl text-[#777]" aria-hidden="true">⌕</div>
          <h2 className="mt-2 text-[12px] font-bold text-[#333]">{filter === "all" ? "Hozircha moslik topilmadi" : "Bu filtr bo‘yicha moslik yo‘q"}</h2>
          <p className="mt-1 text-[9px] text-[#777]">Yangi moslik aniqlansa, bu yerda ko‘rsatiladi.</p>
        </div>
      )}
    </div>
  );
}
