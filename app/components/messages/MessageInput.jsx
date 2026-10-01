"use client";

import { Send } from "lucide-react";

export function MessageInput({ value, onChange, onSubmit, disabled, error }) {
  return (
    <form onSubmit={onSubmit} className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950 sm:px-6">
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          rows={1}
          maxLength={3000}
          disabled={disabled}
          placeholder={disabled ? "Suhbat yopilgan" : "Xabar yozing..."}
          aria-label="Xabar matni"
          className="max-h-32 min-h-11 flex-1 resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-5 text-slate-800 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-900 dark:disabled:bg-slate-800"
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          aria-label="Xabar yuborish"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-100 disabled:text-emerald-900 dark:disabled:bg-emerald-950 dark:disabled:text-emerald-200"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      {error && <p role="alert" className="mx-auto mt-2 max-w-3xl text-xs text-red-700">{error}</p>}
      <p className="mx-auto mt-1 max-w-3xl text-right text-[10px] text-slate-400 dark:text-slate-500">Enter yuboradi · Shift+Enter yangi qator</p>
    </form>
  );
}
