"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { getApiUrl } from "@/lib/api-config";
import { buildArizaListUrl } from "@/lib/ariza-api";
import ItemDetailsLoading from "./loading";

const DetailLocationMap = dynamic(() => import("./DetailLocationMap"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center bg-[#ececec] text-xs text-[#777]">Xarita yuklanmoqda...</div>,
});

function statusLabel(status) {
  if (status === "lost") return "Yo‘qolgan";
  if (status === "found") return "Topilgan";
  return status || "Holat noma’lum";
}

function formatDate(value) {
  if (!value) return "Sana ko‘rsatilmagan";
  let date = new Date(value);
  if (Number.isNaN(date.getTime()) && typeof value === "string") {
    const legacyDate = value.match(/^M(0?[1-9]|1[0-2])\s+(\d{1,2}),?\s+(\d{4})$/);
    if (legacyDate) {
      date = new Date(Date.UTC(Number(legacyDate[3]), Number(legacyDate[1]) - 1, Number(legacyDate[2])));
    }
  }
  if (Number.isNaN(date.getTime())) return "Sana ko‘rsatilmagan";
  const months = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
  const month = months[date.getMonth()];
  return `${date.getDate()}-${month} ${date.getFullYear()}`;
}

function readSavedItemIds() {
  try {
    const storedIds = JSON.parse(localStorage.getItem("qaytarme:saved-items") || "[]");
    return Array.isArray(storedIds) ? storedIds.filter((id) => typeof id === "string") : [];
  } catch (error) {
    console.error("Could not read saved announcements:", error);
    return [];
  }
}

function DetailRow({ icon, label, children }) {
  return (
    <div className="grid grid-cols-[minmax(78px,.42fr)_1fr] items-center gap-3 border-b border-[#e8e8e8] py-1.5 text-[10px] last:border-0">
      <span className="flex items-center gap-2 text-[#777]">
        <span aria-hidden="true">{icon}</span>{label}
      </span>
      <span className="min-w-0 truncate font-medium text-[#333]">{children}</span>
    </div>
  );
}

export default function ItemDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sourceTimeline, setSourceTimeline] = useState(null);
  const [relatedItems, setRelatedItems] = useState([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setItem(null);
    setLoading(true);
    setError("");
    const fetchItem = async () => {
      try {
        const response = await fetch(getApiUrl(`ariza/${params.id}`), { signal: controller.signal });
        if (!response.ok) throw new Error("E’lon topilmadi");
        setItem(await response.json());
      } catch (fetchError) {
        if (fetchError.name !== "AbortError") setError(fetchError.message || "E’lonni yuklab bo‘lmadi.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetchItem();
    return () => controller.abort();
  }, [params.id]);

  useEffect(() => {
    setSourceTimeline(null);
    setSaved(readSavedItemIds().includes(params.id));
    const controller = new AbortController();
    fetch(getApiUrl(`ariza/${params.id}/sources`), { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Manba ma’lumotini olishda xatolik (${response.status})`);
        return response.json();
      })
      .then(setSourceTimeline)
      .catch((fetchError) => {
        if (fetchError.name !== "AbortError") console.error("Announcement source timeline fetch error:", fetchError);
      });
    return () => controller.abort();
  }, [params.id]);

  useEffect(() => {
    setRelatedItems([]);
    if (!item?._id || !item.category) return;
    const controller = new AbortController();
    fetch(buildArizaListUrl({ page: 1, limit: 8, category: item.category }), { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`O‘xshash e’lonlarni olishda xatolik (${response.status})`);
        return response.json();
      })
      .then((data) => {
        const announcements = Array.isArray(data) ? data : data.arizalar || data.items || data.data || [];
        setRelatedItems(announcements.filter((announcement) => announcement._id !== item._id).slice(0, 4));
      })
      .catch((fetchError) => {
        if (fetchError.name !== "AbortError") console.error("Related announcements fetch error:", fetchError);
      });
    return () => controller.abort();
  }, [item?._id, item?.category]);

  if (loading) return <ItemDetailsLoading />;

  if (error || !item) {
    return (
      <div className="grid min-h-[60vh] place-items-center px-5 text-center">
        <div>
          <div className="mb-3 text-4xl text-[#777]" aria-hidden="true">□</div>
          <h2 className="text-lg font-bold">E’lon topilmadi</h2>
          <p className="mt-1 text-sm text-[#777]">{error || "Ma’lumot mavjud emas."}</p>
          <button onClick={() => router.back()} className="mt-4 rounded-md bg-[#333] px-4 py-2 text-xs font-semibold text-white">
            Orqaga qaytish
          </button>
        </div>
      </div>
    );
  }

  const itemId = String(item._id);
  const itemImage = item.image?.url || (typeof item.image === "string" ? item.image : "");
  const ownerName = item.user?.name || item.fullName || "Foydalanuvchi";
  const location = [item.location, item.region, item.district].filter(Boolean).join(", ") || "Hudud ko‘rsatilmagan";
  const mapLat = Number(item.coordinates?.lat);
  const mapLng = Number(item.coordinates?.lng);
  const coordinatesValid = Number.isFinite(mapLat) && Number.isFinite(mapLng) &&
    mapLat >= 37 && mapLat <= 46 && mapLng >= 55.9 && mapLng <= 73.2 &&
    (mapLat !== 0 || mapLng !== 0);
  const mapCenter = {
    lat: coordinatesValid ? mapLat : 41,
    lng: coordinatesValid ? mapLng : 64.5,
  };
  const sourceEntry = sourceTimeline?.timeline?.[0];
  const sourceLabel = item.provenance?.sourceName ||
    (item.provenance?.channelUsername ? `@${item.provenance.channelUsername}` : null) ||
    sourceEntry?.sourceName ||
    (sourceEntry?.channelUsername ? `@${sourceEntry.channelUsername}` : null);
  const sourceUrl = item.provenance?.sourceUrl || sourceEntry?.sourceUrl;
  const sourceDate = item.provenance?.publishedAt || item.provenance?.collectedAt ||
    sourceEntry?.publishedAt || sourceEntry?.collectedAt;
  const milestones = [
    {
      label: "Moslik topildi",
      done: Boolean(item.matchedUser || item.confirmedByFinder || item.confirmedByLoser || item.moderationStatus === "returned"),
    },
    { label: "Topgan tomon tasdiqladi", done: Boolean(item.confirmedByFinder || item.moderationStatus === "returned") },
    { label: "Buyum egasi tasdiqladi", done: Boolean(item.confirmedByLoser || item.moderationStatus === "returned") },
  ];

  const toggleSaved = () => {
    const ids = readSavedItemIds();
    const nextIds = saved ? ids.filter((id) => id !== itemId) : [...new Set([...ids, itemId])];
    try {
      localStorage.setItem("qaytarme:saved-items", JSON.stringify(nextIds));
      setSaved(!saved);
    } catch (storageError) {
      console.error("Could not save announcement:", storageError);
    }
  };

  const openMessages = () => {
    router.push(`/desktop/messages?userId=${item.user?._id || ""}&itemId=${itemId}`);
  };
  const returnToAnnouncements = () => {
    const requestedPath = new URLSearchParams(window.location.search).get("returnTo");
    const isSafePath = requestedPath === "/desktop" ||
      requestedPath === "/desktop/map" ||
      requestedPath === "/desktop/my-items" ||
      /^\/desktop\/item\/[a-f\d]{24}$/i.test(requestedPath || "");
    router.push(isSafePath ? requestedPath : "/desktop");
  };
  const phoneDigits = typeof item.phone === "string" ? item.phone.replace(/[^\d+]/g, "") : "";

  return (
    <div className="mx-auto max-w-[1280px] space-y-2 pb-5 text-[#202020]">
      <div className="flex min-h-7 items-center justify-between gap-3 text-[10px]">
        <button type="button" onClick={returnToAnnouncements} className="inline-flex items-center gap-1.5 text-[#555] hover:text-black">
          <span aria-hidden="true">←</span> E’lonlarga qaytish
        </button>
        <div className="hidden items-center gap-2 text-[#777] sm:flex">
          <span>Bosh sahifa</span><span>/</span><span>E’lonlar</span><span>/</span>
          <span className="max-w-[140px] truncate text-[#444]">{item.itemType || item.itemName || "E’lon"}</span>
        </div>
      </div>

      <section className="grid overflow-hidden rounded-lg border border-[#e2e2e2] bg-white md:grid-cols-[minmax(0,1.08fr)_minmax(0,1.22fr)]">
        <div className="flex flex-col border-b border-[#e8e8e8] p-1.5 md:border-b-0 md:border-r">
          <div className="relative aspect-[1.8/1] w-full overflow-hidden rounded-md bg-[#ededed]">
            {itemImage ? (
              <img src={itemImage} alt={item.itemType || "E’lon rasmi"} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-5xl text-[#888]">□</div>
            )}
          </div>
          {itemImage && (
            <div className="mt-1 flex h-9 items-center gap-1.5">
              <div className="h-9 w-10 overflow-hidden rounded border border-[#777] bg-[#eee]">
                <img src={itemImage} alt="" className="h-full w-full object-cover" />
              </div>
              <span className="text-[9px] text-[#777]">E’lon egasi yuborgan rasm</span>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between p-3 sm:p-4">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className={`inline-flex rounded-md px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide ${
                  item.status === "lost" ? "bg-[#e6e6e6] text-[#444]" : "bg-[#333] text-white"
                }`}>{statusLabel(item.status)}</span>
                <h1 className="mt-1.5 text-xl font-extrabold leading-6 sm:text-[22px]">
                  {item.itemType || item.itemName || "Nomsiz buyum"}
                </h1>
                <p className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-[#555]">
                  <span aria-hidden="true">▣</span>{item.category || "Kategoriya ko‘rsatilmagan"}
                </p>
              </div>
              <button
                type="button"
                onClick={toggleSaved}
                aria-pressed={saved}
                className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-[10px] font-semibold ${
                  saved ? "border-[#777] bg-[#eee]" : "border-[#dedede] bg-white hover:bg-[#f5f5f5]"
                }`}
              >
                <span aria-hidden="true">{saved ? "★" : "☆"}</span>{saved ? "Saqlandi" : "Saqlash"}
              </button>
            </div>

            <div className="mt-2 border-y border-[#e8e8e8]">
              <DetailRow icon="▦" label="Sana">{formatDate(item.date || item.createdAt)}</DetailRow>
              <DetailRow icon="⌖" label="Hudud">{location}</DetailRow>
              <DetailRow icon="ⓘ" label="E’lon holati">{item.moderationStatus === "returned" ? "Qaytarildi" : "Faol"}</DetailRow>
            </div>
          </div>

          <div className="mt-2">
            {phoneDigits && (
              <a
                href={`tel:${phoneDigits}`}
                className="mb-1.5 flex h-8 items-center justify-center gap-1.5 rounded-md border border-[#d4d4d4] bg-[#f8f8f8] text-[10px] font-semibold text-[#333] hover:bg-[#eee]"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M7 3h3l2 5-2 1.5a14 14 0 0 0 4.5 4.5L16 12l5 2v3c0 1.1-.9 2-2 2C10.7 19 5 13.3 5 6c0-1.7.7-3 2-3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                </svg>
                Telefon: {item.phone}
              </a>
            )}
            <div className="grid grid-cols-2 gap-1.5">
              <button type="button" onClick={openMessages} className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-[#333] px-2 text-[10px] font-semibold text-white hover:bg-[#555]">
                <span aria-hidden="true">▢</span>Xabar yozish
              </button>
              <button
                type="button"
                onClick={() => router.push(`/desktop/item/${itemId}/matches`)}
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-[#d4d4d4] px-2 text-[10px] font-semibold hover:bg-[#f5f5f5]"
              >
                <span aria-hidden="true">♧</span>Mosliklarni ko‘rish
              </button>
            </div>
            <p className="mt-1.5 flex items-center gap-1.5 text-[8px] text-[#888]">
              <span aria-hidden="true">♙</span>Aloqa platforma ichida amalga oshiriladi.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-2 md:grid-cols-[minmax(0,1.7fr)_minmax(230px,1fr)]">
        <div className="space-y-2">
          <section className="rounded-lg border border-[#e3e3e3] bg-white px-3 py-2">
            <h2 className="text-[11px] font-bold">Buyum haqida</h2>
            <p className="mt-1 whitespace-pre-line text-[10px] leading-4 text-[#555]">
              {item.itemDescription || "Bu e’lon uchun qo‘shimcha tavsif berilmagan."}
            </p>
          </section>

          <section className="overflow-hidden rounded-lg border border-[#e3e3e3] bg-white">
            <h2 className="px-3 pt-2 text-[11px] font-bold">Joylashuv</h2>
            <div className="group relative m-2 mt-1 h-[118px] overflow-hidden rounded-md bg-[#ededed]">
              <DetailLocationMap coordinates={item.coordinates} />
              <div className="pointer-events-none absolute right-2 top-2 z-[500] max-w-[125px] rounded bg-white/90 px-2 py-1.5 text-[8px] leading-3 text-[#777] shadow-sm">
                <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-[#aaa] align-middle" />
                {coordinatesValid ? "Taxminiy hudud" : "Aniq koordinata mavjud emas"}<br />
                {coordinatesValid ? "Aniq manzil xavfsizlik sababli ko‘rsatilmaydi." : location}
              </div>
              {coordinatesValid && (
                <a
                  href={`https://www.openstreetmap.org/?mlat=${mapCenter.lat}&mlon=${mapCenter.lng}#map=15/${mapCenter.lat}/${mapCenter.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute inset-0 z-[450] opacity-0"
                  aria-label="Joylashuvni xaritada ochish"
                />
              )}
            </div>
          </section>
        </div>

        <div className="space-y-2">
          <section className="flex items-center gap-2.5 rounded-lg border border-[#e3e3e3] bg-white p-2.5">
            <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-[#e8e8e8] text-lg text-[#777]">
              {item.user?.avatar ? <img src={item.user.avatar} alt="" className="h-full w-full object-cover" /> : ownerName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-[11px] font-bold">E’lon egasi</h2>
              <p className="truncate text-[10px] font-semibold">{ownerName}</p>
              <p className="text-[8px] text-[#777]">{item.user?.isVerified ? "✓ Tasdiqlangan foydalanuvchi" : "E’lon muallifi"}</p>
            </div>
            <button type="button" onClick={openMessages} className="h-7 shrink-0 rounded bg-[#333] px-2 text-[9px] font-semibold text-white hover:bg-[#555]">
              Xabar yozish
            </button>
          </section>

          <section className="rounded-lg border border-[#e3e3e3] bg-white p-2.5">
            <h2 className="text-[11px] font-bold">Qaytarish holati</h2>
            <div className="relative mt-2 grid grid-cols-3 gap-1">
              {milestones.map((milestone, index) => (
                <div key={milestone.label} className="relative flex flex-col items-center text-center">
                  {index > 0 && (
                    <span className={`absolute left-[-50%] top-2 h-px w-full ${milestones[index - 1].done ? "bg-[#777]" : "bg-[#ddd]"}`} />
                  )}
                  <span className={`relative z-10 grid h-4 w-4 place-items-center rounded-full text-[8px] font-bold ${
                    milestone.done ? "bg-[#333] text-white" : "bg-[#dedede] text-[#555]"
                  }`}>{index + 1}</span>
                  <span className="mt-1 max-w-[78px] text-[8px] leading-3 text-[#555]">{milestone.label}</span>
                </div>
              ))}
            </div>
            <p className="mt-1.5 text-[8px] leading-3 text-[#777]">
              {item.moderationStatus === "returned"
                ? "Buyum egasiga qaytarilgani tasdiqlangan."
                : item.matchedUser
                  ? "Moslik topilgan. Tomonlar tasdig‘i kutilmoqda."
                  : "E’lon mos keluvchi buyumlar bilan tekshirilmoqda."}
            </p>
          </section>

          {sourceLabel && (
            <section className="flex items-center gap-2 rounded-lg border border-[#e3e3e3] bg-white p-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#555] text-sm text-white" aria-hidden="true">➤</span>
              <div className="min-w-0 flex-1">
                <h2 className="text-[11px] font-bold">Manba</h2>
                <p className="truncate text-[9px] font-medium">{sourceLabel}</p>
                <p className="text-[8px] text-[#777]">{sourceDate ? formatDate(sourceDate) : "Manba sanasi noma’lum"}</p>
              </div>
              {sourceUrl && (
                <a href={sourceUrl} target="_blank" rel="noreferrer" className="shrink-0 text-[8px] font-semibold underline">
                  Asl e’lon <span aria-hidden="true">›</span>
                </a>
              )}
            </section>
          )}
        </div>
      </div>

      {relatedItems.length > 0 && (
        <section>
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-[12px] font-bold">O‘xshash e’lonlar</h2>
            <button type="button" onClick={() => router.push("/desktop")} className="text-[9px] text-[#666] hover:underline">
              Barchasini ko‘rish <span aria-hidden="true">→</span>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {relatedItems.map((related) => {
              const relatedImage = related.image?.url || (typeof related.image === "string" ? related.image : "");
              return (
                <button
                  type="button"
                  key={related._id}
                  onClick={() => router.push(`/desktop/item/${related._id}?returnTo=${encodeURIComponent(`/desktop/item/${itemId}`)}`)}
                  className="flex min-w-0 items-center gap-2 rounded-md border border-[#e3e3e3] bg-white p-1.5 text-left hover:border-[#aaa]"
                >
                  <span className="h-10 w-10 shrink-0 overflow-hidden rounded bg-[#e8e8e8]">
                    {relatedImage && <img src={relatedImage} alt="" loading="lazy" className="h-full w-full object-cover" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[9px] font-semibold">{related.itemType || related.itemName || "Buyum"}</span>
                    <span className="block truncate text-[8px] text-[#777]">{related.location || related.region || "Joy ko‘rsatilmagan"}</span>
                    <span className="block text-[8px] text-[#777]">{statusLabel(related.status)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
