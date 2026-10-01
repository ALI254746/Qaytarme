"use client";

import { ArrowLeft, Circle } from "lucide-react";

function getInitials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function ChatHeader({ conversation, connected, onBack }) {
  const user = conversation.user;
  return (
    <header className="flex h-[72px] shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-950 sm:px-6">
      <button
        type="button"
        onClick={onBack}
        className="grid h-9 w-9 place-items-center rounded-full text-slate-500 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden"
        aria-label="Suhbatlar ro‘yxatiga qaytish"
      >
        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
      </button>
      {user.avatar ? (
        <img src={user.avatar} alt="" className="h-10 w-10 rounded-full bg-slate-100 object-cover dark:bg-slate-800" />
      ) : (
        <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-200">
          {getInitials(user.name)}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{user.name}</h2>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Circle className={`h-2 w-2 fill-current ${connected ? "text-emerald-500" : "text-slate-300 dark:text-slate-600"}`} aria-hidden="true" />
          {connected ? "Ulangan" : "Qayta ulanmoqda"}
        </p>
      </div>
    </header>
  );
}
