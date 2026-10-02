"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Download,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Badge, Empty, Heading, Panel, dateOf } from "../../components/qaytarme/ui";
import { useAdminData, downloadJson } from "../../components/qaytarme/admin-api";
import { State } from "../../components/qaytarme/AdminShared";

const PAGE_SIZE = 8;
const tabs = [
  ["all", "Barchasi"],
  ["verified", "Tasdiqlangan"],
  ["unverified", "Tasdiqlanmagan"],
  ["admins", "Administratorlar"],
];

function initials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase("uz-UZ") || "F";
}

function timeOf(value) {
  if (!value || Number.isNaN(new Date(value).getTime())) return "—";
  return new Date(value).toLocaleString("uz-UZ", {
    timeZone: "Asia/Tashkent",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Avatar({ user, large = false }) {
  return user.avatar ? (
    <img className={`qm-users-avatar${large ? " large" : ""}`} src={user.avatar} alt="" />
  ) : (
    <span className={`qm-users-avatar qm-users-avatar-fallback${large ? " large" : ""}`} aria-hidden="true">
      {initials(user.name)}
    </span>
  );
}

export default function Users() {
  const { data, loading, error, refresh } = useAdminData("users");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [role, setRole] = useState("all");
  const [verification, setVerification] = useState("all");
  const [joinedWithin, setJoinedWithin] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    setQuery(new URLSearchParams(window.location.search).get("q") || "");
  }, []);

  const allUsers = data || [];
  const counts = useMemo(() => ({
    all: allUsers.length,
    verified: allUsers.filter((user) => user.isVerified).length,
    unverified: allUsers.filter((user) => !user.isVerified).length,
    admins: allUsers.filter((user) => user.role === "admin").length,
  }), [allUsers]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("uz-UZ");
    const cutoff = joinedWithin === "7d" ? Date.now() - 7 * 86400000
      : joinedWithin === "30d" ? Date.now() - 30 * 86400000 : null;
    return allUsers.filter((user) => {
      if (tab === "verified" && !user.isVerified) return false;
      if (tab === "unverified" && user.isVerified) return false;
      if (tab === "admins" && user.role !== "admin") return false;
      if (role !== "all" && user.role !== role) return false;
      if (verification === "verified" && !user.isVerified) return false;
      if (verification === "unverified" && user.isVerified) return false;
      if (cutoff && new Date(user.createdAt).getTime() < cutoff) return false;
      if (!normalizedQuery) return true;
      return [user.name, user.email, user.phone, user._id].join(" ").toLocaleLowerCase("uz-UZ").includes(normalizedQuery);
    });
  }, [allUsers, query, tab, role, verification, joinedWithin]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selected = filtered.find((user) => user._id === selectedId) || visible[0] || filtered[0] || null;

  useEffect(() => {
    setPage(1);
  }, [query, tab, role, verification, joinedWithin]);

  const clearFilters = () => {
    setQuery("");
    setTab("all");
    setRole("all");
    setVerification("all");
    setJoinedWithin("all");
    setSelectedId("");
  };

  return (
    <div className="qm-users-page">
      <Heading title="Foydalanuvchilar" text="Hisoblar, e’lonlar va tasdiqlash holatini boshqaring.">
        <button className="qm-btn" onClick={() => downloadJson(filtered.map(({ email, phone, bio, ...user }) => user), "buyum-qidiruv-foydalanuvchilar")} disabled={!filtered.length}>
          <Download size={14} /> Eksport
        </button>
      </Heading>

      <State {...{ loading, error, refresh }} />

      {!loading && !error && <>
        <div className="qm-users-tabs" role="tablist" aria-label="Foydalanuvchi holati">
          {tabs.map(([key, label]) => (
            <button key={key} role="tab" aria-selected={tab === key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>
              {label}<span>{counts[key]}</span>
            </button>
          ))}
        </div>

        <div className="qm-users-filters">
          <label className="qm-users-search"><Search size={15} /><input aria-label="Foydalanuvchini qidirish" placeholder="Ism, email, telefon yoki ID" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <select aria-label="Hisob turi" value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="all">Barcha hisoblar</option><option value="user">Foydalanuvchi</option><option value="admin">Administrator</option>
          </select>
          <select aria-label="Email tasdiqlash holati" value={verification} onChange={(event) => setVerification(event.target.value)}>
            <option value="all">Tasdiqlash: barchasi</option><option value="verified">Tasdiqlangan</option><option value="unverified">Tasdiqlanmagan</option>
          </select>
          <select aria-label="Ro‘yxatdan o‘tgan vaqt" value={joinedWithin} onChange={(event) => setJoinedWithin(event.target.value)}>
            <option value="all">Ro‘yxatdan o‘tgan sana</option><option value="7d">Oxirgi 7 kun</option><option value="30d">Oxirgi 30 kun</option>
          </select>
          <button className="qm-users-reset" onClick={clearFilters}>Filtrlarni tozalash</button>
        </div>

        <div className="qm-users-workspace">
          <Panel className="qm-users-list-panel">
            <div className="qm-users-list-heading"><strong>{filtered.length.toLocaleString("uz-UZ")} ta foydalanuvchi</strong><span>{filtered.length ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} ko‘rsatilmoqda` : "Natija yo‘q"}</span></div>
            {filtered.length ? <>
              <div className="qm-users-table-wrap">
                <table className="qm-users-table">
                  <thead><tr><th>Foydalanuvchi</th><th>Tasdiqlash</th><th>E’lonlar</th><th>Qaytarilgan</th><th>Hisob turi</th><th>Ro‘yxatdan o‘tgan</th></tr></thead>
                  <tbody>{visible.map((user) => <tr key={user._id} tabIndex={0} className={selected?._id === user._id ? "selected" : ""} onClick={() => setSelectedId(user._id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedId(user._id); } }}>
                    <td><div className="qm-users-person"><Avatar user={user} /><span><strong>{user.name || "Ism kiritilmagan"}</strong><small>{user.email}</small></span></div></td>
                    <td><span className={`qm-users-status ${user.isVerified ? "verified" : "pending"}`}>{user.isVerified ? <><Check size={12} /> Tasdiqlangan</> : "Kutilmoqda"}</span></td>
                    <td>{user.items || 0}</td>
                    <td>{user.returnedItems || 0}</td>
                    <td>{user.role === "admin" ? <span className="qm-users-role admin"><ShieldCheck size={12} /> Admin</span> : <span className="qm-users-role">Foydalanuvchi</span>}</td>
                    <td>{dateOf(user.createdAt)}</td>
                  </tr>)}</tbody>
                </table>
              </div>
              <div className="qm-users-pagination"><span>Sahifada <select aria-label="Sahifadagi foydalanuvchilar soni" value={PAGE_SIZE} disabled><option>{PAGE_SIZE}</option></select> ta</span><span>{page} / {pageCount}</span><div><button aria-label="Oldingi sahifa" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}><ChevronLeft size={15} /></button><button aria-label="Keyingi sahifa" disabled={page >= pageCount} onClick={() => setPage((current) => current + 1)}><ChevronRight size={15} /></button></div></div>
            </> : <Empty title="Foydalanuvchi topilmadi" text="Qidiruv yoki filtrlarga mos hisob yo‘q." />}
          </Panel>

          <Panel className="qm-users-profile-panel" title="Foydalanuvchi profili" actions={selected && <span className="qm-users-id">#{selected._id.slice(-6).toUpperCase()}</span>}>
            {selected ? <div className="qm-users-profile">
              <div className="qm-users-profile-head"><Avatar user={selected} large /><div><strong>{selected.name || "Ism kiritilmagan"}</strong><span>{selected.email}</span>{selected.role === "admin" && <Badge>Administrator</Badge>}</div></div>
              <div className="qm-users-contact">
                <span><Mail size={14} />{selected.email}</span>
                {selected.phone && <span><Phone size={14} />{selected.phone}</span>}
                <span className={selected.isVerified ? "is-verified" : ""}><ShieldCheck size={14} />{selected.isVerified ? "Email tasdiqlangan" : "Email tasdiqlanmagan"}</span>
              </div>
              <div className="qm-users-metrics">
                <div><span>Faollik</span><strong>{selected.items || 0}</strong><small>E’lon</small></div>
                <div><span>Ishonchlilik</span><strong>{selected.points || 0}</strong><small>Ball</small></div>
                <div><span>Qaytarilgan</span><strong>{selected.returnedItems || 0}</strong><small>Buyum</small></div>
              </div>
              <section className="qm-users-history"><h3><CalendarDays size={14} /> Hisob tarixi</h3><div><i /><span><strong>Ro‘yxatdan o‘tgan</strong><small>{timeOf(selected.createdAt)}</small></span></div><div><i /><span><strong>Profil yangilangan</strong><small>{timeOf(selected.updatedAt)}</small></span></div>{selected.latestItemAt && <div><i /><span><strong>Oxirgi e’lon</strong><small>{timeOf(selected.latestItemAt)}</small></span></div>}</section>
              {selected.bio && <section className="qm-users-bio"><h3><UserRound size={14} /> O‘zi haqida</h3><p>{selected.bio}</p></section>}
              <div className="qm-users-profile-foot"><CircleUserRound size={14} /> Hisob ma’lumotlari faqat administratorlarga ko‘rinadi.</div>
            </div> : <Empty title="Foydalanuvchini tanlang" text="Profil tafsilotlarini ko‘rish uchun jadvaldan hisob tanlang." />}
          </Panel>
        </div>
      </>}
    </div>
  );
}
