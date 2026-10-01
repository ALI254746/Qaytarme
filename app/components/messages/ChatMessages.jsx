"use client";

import { Check, CheckCheck } from "lucide-react";
import { useEffect, useRef } from "react";

function getTime(value) {
  return new Intl.DateTimeFormat("uz-UZ", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function ChatMessages({ messages, currentUserId, otherUserId, typing, loading }) {
  const endRef = useRef(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages.length, typing]);

  if (loading) {
    return <div className="flex flex-1 items-center justify-center text-sm text-slate-500 dark:text-slate-400">Xabarlar yuklanmoqda...</div>;
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-[#f6f8f7] px-4 py-5 dark:bg-slate-900 sm:px-8">
      <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-end gap-3">
        {messages.length === 0 && (
          <p className="mx-auto mb-5 rounded-full bg-white px-4 py-2 text-xs text-slate-500 shadow-sm dark:bg-slate-800 dark:text-slate-300">
            Suhbat boshlandi. Birinchi xabarni yozing.
          </p>
        )}
        {messages.map((message) => {
          const mine = message.senderId === currentUserId;
          const read = mine && message.readBy?.some((entry) => entry.userId === otherUserId);
          return (
            <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <article className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm sm:max-w-[72%] ${
                mine
                  ? "rounded-br-md bg-emerald-600 text-white"
                  : "rounded-bl-md border border-slate-100 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              }`}>
                <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.body}</p>
                <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${mine ? "text-emerald-100" : "text-slate-400 dark:text-slate-400"}`}>
                  <time dateTime={message.createdAt}>{getTime(message.createdAt)}</time>
                  {mine && (read
                    ? <CheckCheck className="h-3.5 w-3.5" aria-label="O‘qildi" />
                    : <Check className="h-3.5 w-3.5" aria-label="Yuborildi" />)}
                </div>
              </article>
            </div>
          );
        })}
        {typing && <p className="text-xs text-slate-500 dark:text-slate-400">{otherUserId ? "Suhbatdoshingiz yozmoqda..." : "Yozmoqda..."}</p>}
        <div ref={endRef} />
      </div>
    </div>
  );
}
