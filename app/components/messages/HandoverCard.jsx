"use client";

import { Check, Handshake, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { getApiUrl } from "@/lib/api-config";

export function HandoverCard({ item, currentUserId, otherUserId, accessToken, onUpdated }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!item?.id || !["lost", "found"].includes(item.status)) return null;

  const isOwner = item.userId === currentUserId;
  const myRole = item.status === "lost"
    ? (isOwner ? "loser" : "finder")
    : (isOwner ? "finder" : "loser");
  const myConfirmed = myRole === "finder" ? item.confirmedByFinder : item.confirmedByLoser;
  const otherConfirmed = myRole === "finder" ? item.confirmedByLoser : item.confirmedByFinder;
  const completed = item.moderationStatus === "returned"
    || (item.confirmedByFinder && item.confirmedByLoser);

  async function confirm() {
    setBusy(true);
    setError("");
    const action = myRole === "finder" ? "confirm-handover" : "confirm-receipt";
    try {
      const response = await fetch(getApiUrl(`ariza/${item.id}/${action}`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ otherUserId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Tasdiqlash amalga oshmadi");
      onUpdated({
        ...item,
        confirmedByFinder: Boolean(data.confirmedByFinder ?? (item.confirmedByFinder || myRole === "finder")),
        confirmedByLoser: Boolean(data.confirmedByLoser ?? (item.confirmedByLoser || myRole === "loser")),
        moderationStatus: data.moderationStatus ?? item.moderationStatus,
      });
    } catch (cause) {
      setError(cause.message || "Tasdiqlash amalga oshmadi");
    } finally {
      setBusy(false);
    }
  }

  async function cancelDeal() {
    if (!window.confirm("Topshirish jarayonini bekor qilmoqchimisiz?")) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(getApiUrl(`ariza/${item.id}/cancel-deal`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Jarayonni bekor qilib bo‘lmadi");
      onUpdated({
        ...item,
        confirmedByFinder: Boolean(data.confirmedByFinder),
        confirmedByLoser: Boolean(data.confirmedByLoser),
        moderationStatus: data.moderationStatus ?? item.moderationStatus,
      });
    } catch (cause) {
      setError(cause.message || "Jarayonni bekor qilib bo‘lmadi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-4 mt-3 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:mx-6" aria-label="Buyumni topshirish tasdig‘i">
      <div className="flex items-center gap-3">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" className="h-11 w-11 rounded-xl object-cover" />
        ) : (
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <Handshake className="h-5 w-5" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{item.itemName || item.itemType || "Topilgan buyum"}</h3>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {completed
              ? "Buyum qaytarilgani tasdiqlandi"
              : otherConfirmed
                ? "Ikkinchi tomon tasdig‘i kutilmoqda"
                : "Buyum topshirilgach, tasdiqlang"}
          </p>
        </div>
        {completed && <Check className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-label="Yakunlandi" />}
      </div>
      {!completed && (
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={confirm}
            disabled={busy || myConfirmed}
            className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-100 disabled:text-emerald-900 dark:disabled:bg-emerald-950 dark:disabled:text-emerald-200"
          >
            {busy && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {myConfirmed
              ? "Tasdiqlandi"
              : myRole === "finder"
                ? "Topshirildi"
                : "Qabul qilindi"}
          </button>
          <button
            type="button"
            onClick={cancelDeal}
            disabled={busy}
            className="min-h-10 rounded-xl border border-red-100 px-3 text-xs font-semibold text-red-700 transition hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
          >
            {myConfirmed ? "Bekor qilish" : "Rad etish"}
          </button>
          {(myConfirmed || otherConfirmed) && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {myConfirmed ? "Siz tasdiqladingiz" : "Sizning tasdig‘ingiz kutilmoqda"}
            </span>
          )}
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-xs text-red-700 dark:text-red-300">{error}</p>}
    </section>
  );
}
