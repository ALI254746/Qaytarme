"use client";

import { MessageCircle, Search } from "lucide-react";
import Link from "next/link";

function getInitials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function getTime(value) {
  if (!value) return "";
  const date = new Date(value);
  const sameDay = date.toDateString() === new Date().toDateString();
  return sameDay
    ? date.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit" });
}

export function ChatList({
  conversations,
  activeId,
  query,
  onQueryChange,
  onSelect,
  loading,
  error,
  loginRequired,
  onRetry,
}) {
  const filtered = conversations.filter((conversation) => {
    const haystack = `${conversation.user.name} ${conversation.lastMessage?.body ?? ""} ${conversation.item?.itemName ?? ""}`;
    return haystack.toLocaleLowerCase("uz").includes(query.toLocaleLowerCase("uz"));
  });

  return (
    <aside className="flex min-h-0 w-full shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 md:w-[330px] lg:w-[370px]">
      <div className="border-b border-slate-100 px-5 pb-4 pt-5 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">Aloqalar</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Xabarlar</h1>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>
        <label className="relative mt-4 block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Suhbatdan qidirish"
            aria-label="Suhbatdan qidirish"
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-900 dark:focus:ring-emerald-950"
          />
        </label>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {loading && <p className="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400">Suhbatlar yuklanmoqda...</p>}
        {error && loginRequired && (
          <div role="status" className="mx-2 mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-950 dark:bg-emerald-950 dark:text-emerald-100 md:hidden">
            <p>{error}</p>
            <Link href="/login" className="mt-2 inline-flex min-h-9 items-center rounded-lg bg-emerald-700 px-3 text-xs font-semibold text-white hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">
              Kirish
            </Link>
          </div>
        )}
        {error && !loginRequired && (
          <div role="alert" className="mx-2 mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
            <p>{error}</p>
            {onRetry ? (
              <button type="button" onClick={onRetry} className="mt-2 min-h-9 rounded-lg bg-red-800 px-3 text-xs font-semibold text-white hover:bg-red-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700">
                Qayta urinish
              </button>
            ) : null}
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className="px-5 py-14 text-center">
            <MessageCircle className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
              {query ? "Mos suhbat topilmadi" : "Hozircha suhbat yo‘q"}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              E’lon sahifasidan foydalanuvchiga yozganingizda suhbat shu yerda ko‘rinadi.
            </p>
          </div>
        )}
        <ul className="space-y-1">
          {filtered.map((conversation) => {
            const active = conversation.id === activeId;
            return (
              <li key={conversation.id}>
                <button
                  type="button"
                  onClick={() => onSelect(conversation)}
                  aria-current={active ? "true" : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
                    active ? "bg-emerald-50 dark:bg-emerald-950" : "hover:bg-slate-50 dark:hover:bg-slate-900"
                  }`}
                >
                  {conversation.user.avatar ? (
                    <img
                      src={conversation.user.avatar}
                      alt=""
                      className="h-11 w-11 shrink-0 rounded-full bg-slate-100 object-cover dark:bg-slate-800"
                    />
                  ) : (
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                      {getInitials(conversation.user.name)}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{conversation.user.name}</span>
                      <span className="shrink-0 text-[11px] text-slate-400 dark:text-slate-500">{getTime(conversation.lastMessage?.createdAt)}</span>
                    </span>
                    <span className="mt-1 flex items-center justify-between gap-2">
                      <span className="truncate text-xs text-slate-500">
                        {conversation.lastMessage?.body || conversation.item?.itemName || "Suhbat boshlandi"}
                      </span>
                      {conversation.unreadCount > 0 && (
                        <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
