"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { getApiUrl } from "@/lib/api-config";

const confidenceMeta = (score = 0) => {
  if (score >= 85) return { label: "Juda yuqori", tone: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" };
  if (score >= 70) return { label: "Yuqori", tone: "bg-mint", text: "text-emerald-600 dark:text-mint" };
  if (score >= 50) return { label: "O‘rta", tone: "bg-amber-400", text: "text-amber-600 dark:text-amber-400" };
  return { label: "Past", tone: "bg-neutral-400", text: "text-neutral-500" };
};

const sourceLabel = (item) => {
  const source = item?.provenance;
  if (!source) return "Foydalanuvchi e‘loni";
  if (source.sourceType === "telegram") return source.channelUsername ? `@${source.channelUsername}` : source.sourceName || "Telegram";
  if (source.sourceType === "web") return source.sourceName || "Web manba";
  if (source.sourceType === "mobile_app") return "Mobil ilova";
  if (source.sourceType === "telegram_bot") return "Telegram bot";
  return source.sourceName || "QaytarMe";
};

const EvidenceChips = ({ reason }) => {
  const chips = String(reason || "")
    .split(/[;|•]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 5);

  if (!chips.length) return <span className="text-xs text-neutral-400">Tahlil sababi mavjud emas</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip, index) => (
        <span key={`${chip}-${index}`} className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
          ✓ {chip}
        </span>
      ))}
    </div>
  );
};

const ItemSide = ({ item, type }) => (
  <div className="flex min-w-0 flex-1 items-center gap-4">
    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-800 md:h-24 md:w-24">
      {item?.image?.url ? <img src={item.image.url} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-3xl">📦</div>}
      <span className={`absolute left-2 top-2 rounded-md px-2 py-1 text-[8px] font-black uppercase tracking-wider text-white ${type === "lost" ? "bg-rose-500" : "bg-emerald-500"}`}>
        {type === "lost" ? "Yo‘qolgan" : "Topilgan"}
      </span>
    </div>
    <div className="min-w-0">
      <h3 className="truncate text-base font-black text-neutral-950 dark:text-white md:text-lg">{item?.itemName || item?.itemType || "Noma’lum buyum"}</h3>
      <p className="mt-1 truncate text-xs font-medium text-neutral-500">{item?.location || [item?.region, item?.district].filter(Boolean).join(", ") || "Joy noma’lum"}</p>
      <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-neutral-100 px-2 py-1 text-[9px] font-bold text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
        <span className="h-1.5 w-1.5 rounded-full bg-sky-500" /> {sourceLabel(item)}
      </div>
    </div>
  </div>
);

export default function MatchesIntelligencePage({ mobile = false }) {
  const { data: session } = useSession();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.accessToken) return;
    let active = true;
    fetch(getApiUrl("matches"), { headers: { Authorization: `Bearer ${session.user.accessToken}` } })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Mosliklarni yuklab bo‘lmadi")))
      .then((data) => {
        if (!active) return;
        setMatches(data.filter((match) => match.lostItem && match.foundItem && match.lostItem.moderationStatus !== "returned" && match.foundItem.moderationStatus !== "returned"));
      })
      .catch((error) => console.error("Matches fetch error:", error))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [session]);

  const stats = useMemo(() => {
    const best = matches.length ? Math.max(...matches.map((match) => Number(match.similarity) || 0)) : 0;
    return { best, high: matches.filter((match) => Number(match.similarity) >= 70).length };
  }, [matches]);

  return (
    <main className={`${mobile ? "min-h-screen px-4 pb-28 pt-5" : "space-y-8 pb-12"} bg-neutral-50 dark:bg-black`}>
      <section className="relative overflow-hidden rounded-[2rem] bg-neutral-950 px-6 py-7 text-white md:rounded-[2.5rem] md:px-10 md:py-10">
        <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full bg-mint/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-mint">
              <span className="h-2 w-2 animate-pulse rounded-full bg-mint" /> OSINT tahlil faol
            </div>
            <h1 className="max-w-2xl text-3xl font-black tracking-tight md:text-5xl">Mosliklar intelligence markazi</h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-neutral-400">Kategoriya signallari, vaqt, joylashuv va manba dalillari asosida tushuntiriladigan natijalar.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            {[['Moslik', matches.length], ['Yuqori', stats.high], ['Eng yaxshi', `${stats.best}%`]].map(([label, value]) => (
              <div key={label} className="min-w-20 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-center backdrop-blur md:min-w-28">
                <div className="text-xl font-black md:text-2xl">{value}</div><div className="mt-1 text-[8px] font-bold uppercase tracking-widest text-neutral-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-black uppercase tracking-[0.18em] text-neutral-500">Tavsiya etilgan mosliklar</h2>
          <span className="text-xs font-bold text-neutral-400">{matches.length} ta natija</span>
        </div>

        {loading ? (
          <div className="grid gap-4">{[1,2].map((value) => <div key={value} className="h-64 animate-pulse rounded-[2rem] bg-white dark:bg-neutral-900" />)}</div>
        ) : matches.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-neutral-200 bg-white px-6 py-16 text-center dark:border-neutral-800 dark:bg-neutral-900">
            <div className="text-4xl">🔎</div><h3 className="mt-4 font-black dark:text-white">Hozircha moslik yo‘q</h3><p className="mt-2 text-sm text-neutral-500">Tizim yangi e’lonlarni doimiy tahlil qilmoqda.</p>
          </div>
        ) : (
          <AnimatePresence>
            {matches.map((match, index) => {
              const confidence = confidenceMeta(match.similarity);
              const targetId = (session?.user?.id === match.lostItem?.user || session?.user?.id === match.lostItem?.user?._id) ? match.foundItem?._id : match.lostItem?._id;
              return (
                <motion.article key={match._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.06, 0.3) }} className="overflow-hidden rounded-[2rem] border border-neutral-200/70 bg-white shadow-[0_20px_60px_-35px_rgba(0,0,0,0.35)] dark:border-neutral-800 dark:bg-neutral-900">
                  <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
                    <div><span className={`text-xs font-black ${confidence.text}`}>{confidence.label} ishonch</span><p className="mt-0.5 text-[10px] font-medium text-neutral-400">Explainable match • #{String(match._id).slice(-6)}</p></div>
                    <div className="flex items-center gap-3"><div className="hidden h-2 w-28 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800 sm:block"><div className={`h-full rounded-full ${confidence.tone}`} style={{ width: `${Math.min(100, Math.max(0, match.similarity || 0))}%` }} /></div><div className="text-2xl font-black text-neutral-950 dark:text-white">{match.similarity}%</div></div>
                  </div>
                  <div className={`grid items-center gap-4 p-5 ${mobile ? "grid-cols-1" : "md:grid-cols-[1fr_auto_1fr] md:gap-7 md:p-7"}`}>
                    <ItemSide item={match.lostItem} type="lost" />
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-neutral-950 text-mint shadow-lg dark:border-neutral-900">↔</div>
                    <ItemSide item={match.foundItem} type="found" />
                  </div>
                  <div className="border-t border-neutral-100 bg-neutral-50/80 px-5 py-4 dark:border-neutral-800 dark:bg-black/20">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <EvidenceChips reason={match.reason} />
                      <Link href={`/${mobile ? "mobile" : "desktop"}/item/${targetId}`} className="shrink-0 rounded-xl bg-neutral-950 px-5 py-3 text-center text-xs font-black uppercase tracking-wider text-white transition hover:-translate-y-0.5 hover:bg-neutral-800 dark:bg-white dark:text-black">Dalillarni ko‘rish →</Link>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        )}
      </section>
    </main>
  );
}
