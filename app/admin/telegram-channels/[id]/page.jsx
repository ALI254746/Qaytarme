"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  FileText,
  MapPin,
  Pause,
  Play,
  RefreshCw,
  Send,
  Settings,
  ShieldCheck,
  TriangleAlert,
  X,
} from "lucide-react";
import { Badge, Empty, Heading, Panel, dateOf } from "../../../components/qaytarme/ui";
import { adminRequest, useAdminData } from "../../../components/qaytarme/admin-api";
import { State } from "../../../components/qaytarme/AdminShared";

const importTabs = [["all", "So‘nggi postlar"], ["pending", "Tekshirilmoqda"], ["rejected", "Rad etilganlar"], ["duplicates", "Birlashtirilganlar"]];
const actionName = { "channel-add": "Manba tizimga qo‘shildi", "channel-state": "Yig‘ish holati o‘zgartirildi", "channel-settings": "Manba sozlamalari yangilandi", "telegram-import": "Sinov importi bajarildi" };

function timestamp(value) {
  if (!value || Number.isNaN(new Date(value).getTime())) return "—";
  return new Date(value).toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function scoreLabel(tier) {
  return ({ trusted: "Ishonchli", reliable: "Yaxshi", mixed: "Aralash", low: "Past ishonch", insufficient_data: "Ma’lumot yetarli emas" })[tier] || "Hali baholanmagan";
}

function StatTile({ icon: Icon, label, value, note }) {
  return <div className="qm-channel-stat"><span><Icon size={15} /></span><div><small>{label}</small><strong>{value}</strong><p>{note}</p></div></div>;
}

export default function TelegramChannelDetail() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { data, loading, error, refresh, token } = useAdminData(id ? `channels/${encodeURIComponent(id)}` : "channels");
  const [tab, setTab] = useState("all");
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState("");
  const [region, setRegion] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const channel = data?.channel;
  const posts = data?.posts || [];
  const stats = data?.stats || {};
  const reliability = data?.reliability;
  const filteredPosts = useMemo(() => posts.filter((post) => {
    if (tab === "pending") return post.moderationStatus === "pending";
    if (tab === "rejected") return post.moderationStatus === "rejected";
    if (tab === "duplicates") return post.cluster?.isPrimary === false;
    return true;
  }), [posts, tab]);

  function beginEdit() {
    setDescription(channel?.description || "");
    setRegion(channel?.region || "");
    setEditing(true);
  }

  async function importPosts() {
    setBusy(true);
    setNotice("So‘nggi postlar tekshirilmoqda…");
    try {
      const result = await adminRequest(`channels/${id}/import`, token, {});
      setNotice(`${result.checked ?? 0} ta post ko‘rib chiqildi, ${result.processed ?? 0} ta e’lon guruhi tahlil qilindi.`);
      await refresh();
    } catch (requestError) {
      setNotice(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleChannel() {
    setBusy(true);
    setNotice("");
    try {
      await adminRequest(`channels/${id}`, token, { isActive: !channel.isActive }, "PATCH");
      setNotice(channel.isActive ? "Manba yig‘ishdan vaqtincha to‘xtatildi." : "Manba yig‘ishga qayta ulandi.");
      await refresh();
    } catch (requestError) {
      setNotice(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveSettings(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await adminRequest(`channels/${id}/settings`, token, { description: description.trim(), region: region.trim() }, "PATCH");
      setEditing(false);
      setNotice("Manba sozlamalari saqlandi.");
      await refresh();
    } catch (requestError) {
      setNotice(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  const moderatedCount = (stats.approved || 0) + (stats.rejected || 0);
  const moderationRate = stats.total ? Math.round(moderatedCount / stats.total * 100) : null;
  const totalForBars = Math.max(1, ...(data?.coverage || []).map((entry) => entry.count));

  return <div className="qm-channel-detail">
    <Link className="qm-channel-back" href="/admin/telegram-channels"><ArrowLeft size={14} /> Telegram manbalariga qaytish</Link>
    <Heading title="Manba tafsilotlari" text="Kanal qamrovi, import holati va e’lonlar sifatini boshqaring.">
      <button className="qm-btn" disabled={busy || !channel?.isActive || !data?.collector?.connected} onClick={importPosts}><Play size={13} /> Sinov importi</button>
      <button className="qm-btn" disabled={busy || !channel} onClick={toggleChannel}>{channel?.isActive ? <><Pause size={13} /> Vaqtincha to‘xtatish</> : <><Play size={13} /> Qayta yoqish</>}</button>
      <button className="qm-btn qm-btn-dark" disabled={!channel} onClick={beginEdit}><Settings size={13} /> Sozlamalarni tahrirlash</button>
    </Heading>
    <State {...{ loading, error, refresh }} />
    {notice && <div className="qm-notice qm-channel-notice" role="status">{notice}<button aria-label="Xabarni yopish" onClick={() => setNotice("")}><X size={14} /></button></div>}

    {channel && <>
      {!data.collector?.connected && <div className="qm-notice qm-channel-collector"><TriangleAlert size={15} /> Telegram yig‘uvchi ulanmagan. Sinov importi uchun serverdagi Telegram sessiyasini tekshiring.</div>}
      <section className="qm-channel-identity">
        <span className="qm-channel-mark"><Send size={25} /></span>
        <div className="qm-channel-name"><h2>{channel.title || channel.username}</h2><p>@{channel.username}</p><span>{channel.description || "Ochiq Telegram kanali"}</span><a href={`https://t.me/${channel.username}`} target="_blank" rel="noreferrer">Kanalni ochish <ExternalLink size={11} /></a></div>
        <div className="qm-channel-meta"><span>Hudud<strong><MapPin size={12} />{channel.region || "Ko‘rsatilmagan"}</strong></span><span>Yig‘ishga qo‘shilgan<strong><CalendarDays size={12} />{dateOf(channel.createdAt)}</strong></span><span>Oxirgi import<strong><Clock3 size={12} />{timestamp(channel.lastImportedAt)}</strong></span></div>
        <Badge tone={channel.lastError ? "warning" : channel.isActive ? "success" : ""}>{channel.lastError ? "Xatolik bor" : channel.isActive ? "Faol manba" : "To‘xtatilgan"}</Badge>
      </section>

      <div className="qm-channel-stats">
        <StatTile icon={FileText} label="Jami import" value={(stats.total ?? channel.imported ?? 0).toLocaleString("uz-UZ")} note="Kanalga bog‘langan e’lonlar" />
        <StatTile icon={Send} label="So‘nggi 24 soatda" value={(stats.last24Hours ?? 0).toLocaleString("uz-UZ")} note="Yangi e’lonlar" />
        <StatTile icon={Copy} label="Takroriy postlar" value={(stats.duplicates ?? 0).toLocaleString("uz-UZ")} note={stats.total ? `${Math.round((stats.duplicates || 0) / stats.total * 100)}% jami importdan` : "Hozircha post yo‘q"} />
        <StatTile icon={CheckCircle2} label="Moderatsiyadan o‘tgan" value={moderationRate === null ? "—" : `${moderationRate}%`} note={`${stats.pending || 0} ta tekshiruvda`} />
        <StatTile icon={ShieldCheck} label="Manba ishonchliligi" value={reliability?.score == null ? "—" : `${reliability.score}%`} note={scoreLabel(reliability?.tier)} />
      </div>

      <div className="qm-channel-dashboard">
        <Panel title="Import tarixi" actions={<span className="qm-channel-caption">So‘nggi {posts.length} ta import qilingan e’lon</span>}>
          <div className="qm-channel-tabs" role="tablist" aria-label="Import tarixi filtri">{importTabs.map(([key, label]) => <button key={key} role="tab" aria-selected={tab === key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>{label}{key === "all" && <span>{posts.length}</span>}</button>)}</div>
          {filteredPosts.length ? <div className="qm-table-wrap"><table className="qm-table qm-channel-table"><thead><tr><th>Vaqt</th><th>E’lon</th><th>Holat</th><th>AI tahlili</th><th>Hudud</th><th>Amal</th></tr></thead><tbody>{filteredPosts.map((post) => <tr key={post._id}><td>{timestamp(post.createdAt)}</td><td><strong>{post.itemType || post.itemName || "Buyum"}</strong><small>{post.itemDescription || post.location || "Tavsif kiritilmagan"}</small></td><td><Badge tone={post.moderationStatus === "approved" ? "success" : post.moderationStatus === "pending" ? "warning" : ""}>{post.moderationStatus === "approved" ? "Tasdiqlangan" : post.moderationStatus === "pending" ? "Tekshirilmoqda" : post.moderationStatus === "rejected" ? "Rad etilgan" : post.moderationStatus || "Noma’lum"}</Badge></td><td>{post.cluster?.isPrimary === false ? "Takroriy" : "—"}</td><td>{[post.district, post.region].filter(Boolean).join(", ") || "Noma’lum"}</td><td><Link className="qm-btn" href={post.moderationStatus === "pending" ? `/admin/moderation?id=${post._id}` : `/desktop/item/${post._id}`}>Ko‘rish <ArrowUpRight size={12} /></Link></td></tr>)}</tbody></table></div> : <Empty title={tab === "all" ? "Import qilingan e’lon yo‘q" : "Bu filtrda e’lon yo‘q"} text={tab === "all" ? "Sinov importini ishga tushirib, oxirgi kanal postlarini tekshiring." : undefined} />}
        </Panel>

        <div className="qm-channel-side">
          <Panel title="Manba holati va ishonchlilik" actions={<span className="qm-channel-caption">Hisoblangan ko‘rsatkichlar</span>}>
            <div className="qm-channel-quality"><div><span>Telegram moderatsiyasi</span><strong>{data.settings?.moderateTelegram ? "Yoqilgan" : "O‘chirilgan"}</strong></div><div><span>Postlar sifati</span><strong>{reliability?.score == null ? "Ma’lumot yetarli emas" : `${reliability.score}%`}</strong></div><div><span>Tekshiruv namunasi</span><strong>{reliability?.sampleSize ?? stats.total ?? 0} ta post</strong></div><div><span>Dublikatlar ulushi</span><strong>{stats.total ? `${Math.round((stats.duplicates || 0) / stats.total * 100)}%` : "—"}</strong></div><div><span>Manba yig‘ilishi</span><strong>{channel.isActive ? "Faol" : "To‘xtatilgan"}</strong></div></div>
            {reliability?.warnings?.length > 0 && <div className="qm-channel-warning"><TriangleAlert size={14} /><span>{reliability.warnings.join(" · ")}</span></div>}
            {reliability?.computedAt && <small className="qm-channel-updated">Oxirgi hisob: {timestamp(reliability.computedAt)}</small>}
          </Panel>

          <Panel title="Mas’ul shaxs">
            <div className="qm-channel-owner"><span className="qm-channel-owner-avatar">{(data.owner?.name || "A").slice(0, 1).toUpperCase()}</span><div><strong>{data.owner?.name || "Administrator"}</strong><small>{data.owner?.email || "Kanalni boshqaruvchi"}</small></div><Badge tone="success">Mas’ul</Badge></div>
            <div className="qm-channel-owner-meta"><span>Kanal qo‘shilgan<strong>{timestamp(channel.createdAt)}</strong></span><span>Oxirgi tekshiruv<strong>{timestamp(channel.lastCheckedAt)}</strong></span></div>
          </Panel>

          <Panel title="Yig‘ish sozlamalari" actions={<button className="qm-channel-link" onClick={beginEdit}>Tahrirlash</button>}>
            <div className="qm-channel-settings"><span>Kuzatuv holati<strong>{channel.isActive ? "Yoqilgan" : "Pauzada"}</strong></span><span>Telegram yig‘uvchi<strong>{data.collector?.connected ? "Ulangan" : "Ulanmagan"}</strong></span><span>Telegram e’lonlari moderatsiyasi<strong>{data.settings?.moderateTelegram ? "Majburiy" : "O‘chirilgan"}</strong></span><span>Hudud<strong>{channel.region || "Belgilanmagan"}</strong></span></div>
          </Panel>

          <Panel title="Manba tarixi">
            <div className="qm-channel-timeline">{(data.timeline || []).length ? data.timeline.map((event) => <div key={event._id}><i /><span><strong>{actionName[event.action] || event.action}</strong><small>{timestamp(event.createdAt)}</small>{event.details?.checked != null && <small>{event.details.checked} ta post tekshirildi · {event.details.processed} ta e’lon guruhi</small>}</span></div>) : <p>Hozircha kanal bo‘yicha tarixiy amal qayd etilmagan.</p>}</div>
          </Panel>

          <Panel title="Hududiy qamrov" actions={<span className="qm-channel-caption">Import qilingan postlar</span>}>
            <div className="qm-channel-coverage">{(data.coverage || []).length ? data.coverage.map((entry) => <div key={`${entry.region}-${entry.district}`}><span>{entry.district ? `${entry.district}, ${entry.region}` : entry.region}</span><i><b style={{ width: `${Math.max(5, entry.count / totalForBars * 100)}%` }} /></i><strong>{entry.count}</strong></div>) : <p>Hudud ko‘rsatilgan e’lonlar hali yo‘q.</p>}</div>
          </Panel>
        </div>
      </div>
    </>}

    {editing && channel && <div className="qm-channel-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditing(false); }}><section className="qm-channel-modal" role="dialog" aria-modal="true" aria-labelledby="qm-channel-edit-title"><div><h2 id="qm-channel-edit-title">Manba sozlamalari</h2><button aria-label="Yopish" onClick={() => setEditing(false)}><X size={17} /></button></div><form onSubmit={saveSettings}><label>Kanal tavsifi<textarea maxLength={300} value={description} onChange={(event) => setDescription(event.target.value)} /></label><label>Hudud<input maxLength={80} value={region} onChange={(event) => setRegion(event.target.value)} placeholder="Masalan: Toshkent shahri" /></label><p>Kanal nomi va xavfsizlik sozlamalari bu yerdan o‘zgarmaydi.</p><footer><button type="button" className="qm-btn" onClick={() => setEditing(false)}>Bekor qilish</button><button className="qm-btn qm-btn-dark" disabled={busy}>Saqlash</button></footer></form></section></div>}
  </div>;
}
