"use client";

import { Check, ShieldCheck, UserRound, Info, LoaderCircle } from "lucide-react";
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
    <section className="qm-handover-card" aria-label="Buyumni topshirish tasdig‘i">
      <div className="qm-handover-heading"><span className="qm-handover-shield"><ShieldCheck size={29}/></span><div><h3>Buyumni topshirishni tasdiqlash</h3><p>Buyum egasiga berilgach, har ikki tomon tasdiqlashi kerak.</p></div></div>
      <div className="qm-handover-roles">{["finder","loser"].map(role=>{
        const confirmed=role==="finder"?item.confirmedByFinder:item.confirmedByLoser;
        const mine=role===myRole;
        return <div key={role}><strong><UserRound size={20}/>{role==="finder"?"Topgan tomon":"Buyum egasi"}</strong><button type="button" onClick={mine?confirm:undefined} disabled={!mine||busy||confirmed||completed||(role==="loser"&&!item.confirmedByFinder)}>{busy&&mine?<LoaderCircle size={14} className="animate-spin"/>:null}{confirmed?"Tasdiqlandi":role==="finder"?"Topshirdim":"Qabul qildim"}</button><small>{confirmed?"Tasdiqlangan":role==="loser"&&!item.confirmedByFinder?"Topshirilgandan keyin faollashadi":mine?"Hali tasdiqlanmagan":"Ikkinchi tomon tasdig‘i kutilmoqda"}</small></div>;
      })}</div>
      <p className="qm-handover-note"><Info size={14}/>{completed?"Buyum qaytarilgani tasdiqlandi.":"Ikkala tasdiqdan so‘ng e’lon qaytarilgan deb belgilanadi."}</p>
      {!completed&&(myConfirmed||otherConfirmed)&&<button className="qm-inline-link" type="button" onClick={cancelDeal} disabled={busy}>Tasdiqni bekor qilish</button>}
      {error && <p role="alert" className="mt-2 text-xs text-red-700 dark:text-red-300">{error}</p>}
    </section>
  );
}
