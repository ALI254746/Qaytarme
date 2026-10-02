"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { getApiUrl } from "@/lib/api-config";
import { useLanguage } from "@/context/LanguageContext";
import { useSnackbar } from "notistack";

const filters = ["all", "lost", "found", "pending"];

export default function MyItemsTab() {
  const { data: session } = useSession();
  const { t } = useLanguage();
  const { enqueueSnackbar } = useSnackbar();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [menuId, setMenuId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!session?.user?.accessToken) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const loadItems = async () => {
      try {
        const response = await fetch(getApiUrl("ariza/my"), {
          headers: { Authorization: `Bearer ${session.user.accessToken}` },
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(t("fetch_error") || "E’lonlarni yuklab bo‘lmadi.");
        const result = await response.json();
        setItems(Array.isArray(result) ? result : []);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("My announcements fetch error:", error);
          enqueueSnackbar(error.message || t("fetch_error"), { variant: "error" });
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadItems();
    return () => controller.abort();
  }, [session?.user?.accessToken, enqueueSnackbar, t]);

  const visibleItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return items
      .filter((item) => {
        if (filter === "lost" && item.status !== "lost") return false;
        if (filter === "found" && item.status !== "found") return false;
        if (filter === "pending" && item.moderationStatus !== "pending") return false;
        return !query || `${item.itemType || item.title || ""} ${item.location || ""} ${item.itemDescription || ""}`.toLocaleLowerCase().includes(query);
      })
      .sort((a, b) => {
        const first = new Date(a.createdAt || 0).getTime();
        const second = new Date(b.createdAt || 0).getTime();
        return sort === "oldest" ? first - second : second - first;
      });
  }, [filter, items, search, sort]);
  const pageSize = 6;
  const pageCount = Math.max(1, Math.ceil(visibleItems.length / pageSize));
  const pageItems = visibleItems.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [filter, search, sort]);

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount));
  }, [pageCount]);

  const deleteItem = async (id) => {
    setDeletingId(id);
    setMenuId(null);
    try {
      const response = await fetch(getApiUrl(`ariza/${id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.user.accessToken}` },
      });
      if (!response.ok) throw new Error(t("delete_error") || "E’lonni o‘chirib bo‘lmadi.");
      setItems((current) => current.filter((item) => item._id !== id));
      enqueueSnackbar(t("delete_success"), { variant: "success" });
    } catch (error) {
      console.error("My announcement delete error:", error);
      enqueueSnackbar(error.message || t("system_error"), { variant: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  const countFor = (key) => {
    if (key === "all") return items.length;
    if (key === "pending") return items.filter((item) => item.moderationStatus === "pending").length;
    return items.filter((item) => item.status === key).length;
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white">{t("my_items_title")}</h2>
          <p className="mt-1 text-xs text-neutral-500">{items.length} ta e’lon</p>
        </div>
        <label className="flex h-9 min-w-56 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900">
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" strokeWidth="1.8" /><path d="m16 16 5 5" strokeWidth="1.8" strokeLinecap="round" /></svg>
          <input value={search} onChange={(event) => setSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-neutral-400" placeholder="E’lonlarim ichidan qidirish" aria-label="E’lonlarim ichidan qidirish" />
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="E’lonlarni filtrlash">
          {filters.map((key) => {
            const label = key === "all" ? t("filter_all") : key === "lost" ? t("filter_lost") : key === "found" ? t("filter_found") : t("status_pending");
            return (
              <button key={key} type="button" role="tab" aria-selected={filter === key} onClick={() => setFilter(key)} className={`rounded-lg px-3 py-2 text-[11px] font-semibold transition ${filter === key ? "bg-neutral-800 text-white dark:bg-white dark:text-neutral-900" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"}`}>
                {label} <span className="ml-1 opacity-70">{countFor(key)}</span>
              </button>
            );
          })}
        </div>
        <label className="flex h-9 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 text-xs text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200">
          <span aria-hidden="true">↕</span>
          <select value={sort} onChange={(event) => setSort(event.target.value)} className="bg-transparent outline-none">
            <option value="newest">Eng yangi</option>
            <option value="oldest">Eng eski</option>
          </select>
        </label>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((key) => <div key={key} className="h-56 animate-pulse rounded-xl border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900" />)}
        </div>
      ) : visibleItems.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {pageItems.map((item) => {
            const title = item.itemType || item.title || t("default_item_title") || "Buyum";
            const image = item.image?.url || item.image;
            const status = item.status === "lost" ? t("filter_lost") : t("filter_found");
            const moderation = item.moderationStatus === "approved" ? t("status_approved") : item.moderationStatus === "pending" ? t("status_pending") : t("status_rejected");
            const createdAt = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "";
            return (
              <article key={item._id} className="group relative overflow-visible rounded-xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
                <Link href={`/desktop/item/${item._id}?returnTo=${encodeURIComponent("/desktop/profile")}`} className="block overflow-hidden rounded-t-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-500">
                  <div className="relative h-[132px] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                    {image ? <img src={image} alt={title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" /> : <div className="grid h-full place-items-center text-4xl text-neutral-400">📦</div>}
                    <span className="absolute left-2 top-2 rounded-full bg-neutral-900/75 px-2.5 py-1 text-[10px] font-semibold text-white">{status}</span>
                    <span className="absolute left-[76px] top-2 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-neutral-800 dark:bg-neutral-900/90 dark:text-white">{moderation}</span>
                  </div>
                  <div className="px-3 pb-2 pt-2">
                    <h3 className="truncate text-xs font-bold text-neutral-900 dark:text-white">{title}</h3>
                    <p className="mt-1 truncate text-[10px] text-neutral-500">{item.location || item.region || "Joylashuv ko‘rsatilmagan"}</p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-neutral-500">
                      <span>{createdAt}</span>
                      <span className="flex items-center gap-1"><span aria-hidden="true">◉</span> {item.views || 0}</span>
                    </div>
                  </div>
                </Link>
                <div className="absolute bottom-2 right-2">
                  <button type="button" aria-label={`${title}: amallar`} aria-expanded={menuId === item._id} onClick={() => setMenuId((current) => current === item._id ? null : item._id)} className="grid h-7 w-7 place-items-center rounded-md border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800">•••</button>
                  {menuId === item._id && (
                    <div className="absolute bottom-8 right-0 z-10 w-40 rounded-lg border border-neutral-200 bg-white p-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
                      <Link href={`/desktop/item/${item._id}?returnTo=${encodeURIComponent("/desktop/profile")}`} className="block rounded-md px-3 py-2 text-left text-[11px] text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800">Batafsil ko‘rish</Link>
                      <button type="button" disabled={deletingId === item._id} onClick={() => deleteItem(item._id)} className="w-full rounded-md px-3 py-2 text-left text-[11px] text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950/30">{deletingId === item._id ? "O‘chirilmoqda…" : t("btn_delete")}</button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white py-12 text-center dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-3xl">📂</p>
          <h3 className="mt-3 text-sm font-bold text-neutral-800 dark:text-white">{t("empty_my_items_title")}</h3>
          <p className="mt-1 text-xs text-neutral-500">{search ? "Qidiruv bo‘yicha e’lon topilmadi." : t("empty_my_items_desc_all")}</p>
          {!search && <Link href="/desktop/add" className="mt-4 inline-flex rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white dark:bg-white dark:text-neutral-900">{t("btn_add_first_item")}</Link>}
        </div>
      )}
      {!loading && visibleItems.length > pageSize && (
        <nav className="flex items-center justify-center gap-1.5 pt-1" aria-label="E’lonlar sahifalari">
          <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} aria-label="Oldingi sahifa" className="grid h-8 w-8 place-items-center rounded-md border border-neutral-200 bg-white text-neutral-700 disabled:opacity-40 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">‹</button>
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
            <button key={pageNumber} type="button" onClick={() => setPage(pageNumber)} aria-current={page === pageNumber ? "page" : undefined} className={`grid h-8 w-8 place-items-center rounded-md border text-[11px] ${page === pageNumber ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900" : "border-neutral-200 bg-white text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"}`}>{pageNumber}</button>
          ))}
          <button type="button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount} aria-label="Keyingi sahifa" className="grid h-8 w-8 place-items-center rounded-md border border-neutral-200 bg-white text-neutral-700 disabled:opacity-40 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">›</button>
        </nav>
      )}
    </section>
  );
}
