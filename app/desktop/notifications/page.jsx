"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowLeft } from "lucide-react";
import NotificationCenter from "@/app/components/NotificationCenter";

export default function NotificationsPage() {
  const { data: session, status } = useSession();

  return (
    <div className="min-h-[calc(100vh-3.25rem)] bg-[#f7f7f7] dark:bg-slate-950">
      <div className="mx-auto max-w-5xl px-4 pt-5 sm:px-6">
        <Link
          href="/desktop"
          className="inline-flex min-h-9 items-center gap-2 rounded-lg px-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-600 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Bosh sahifaga
        </Link>
      </div>
      {status === "loading" ? (
        <div className="mx-auto mt-5 max-w-3xl animate-pulse px-4 sm:px-6">
          <div className="h-16 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="mt-4 h-64 rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
      ) : session?.user ? (
        <NotificationCenter fullPage />
      ) : (
        <main className="mx-auto max-w-xl px-4 py-20 text-center">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Bildirishnomalarni ko‘rish uchun kiring</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Hisobingizga kirgach, yangi xabarlar va e’lon holatlarini shu yerda ko‘rasiz.</p>
          <Link href="/login" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-neutral-700 px-5 text-sm font-semibold text-white hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-700">Kirish</Link>
        </main>
      )}
    </div>
  );
}
