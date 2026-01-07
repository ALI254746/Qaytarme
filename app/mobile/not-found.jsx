"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function MobileNotFound() {
  const { t } = useLanguage();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center space-y-8">
       <div className="relative">
          <div className="w-32 h-32 bg-mint/10 rounded-full flex items-center justify-center animate-pulse">
              <span className="text-6xl">🔍</span>
          </div>
          <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white dark:bg-neutral-800 rounded-2xl shadow-lg flex items-center justify-center text-2xl border border-neutral-100 dark:border-white/10">
              ?
          </div>
       </div>
       
       <div className="space-y-3">
          <h2 className="text-3xl font-black text-neutral-900 dark:text-white">
             {t("not_found_title") || "Sahifa topilmadi"}
          </h2>
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto leading-relaxed">
             {t("not_found_desc") || "Siz qidirayotgan sahifa yoki e'lon mavjud emas yoki o'chirilgan bo'lishi mumkin."}
          </p>
       </div>

       <Link
        href="/mobile"
        className="px-8 py-4 bg-mint text-neutral-900 font-bold rounded-2xl shadow-lg shadow-mint/20 active:scale-95 transition-all flex items-center gap-2"
       >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
        {t("go_home") || "Bosh sahifaga qaytish"}
       </Link>
    </div>
  );
}
