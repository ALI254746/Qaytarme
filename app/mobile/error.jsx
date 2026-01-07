"use client";

import { useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function MobileError({ error, reset }) {
  const { t } = useLanguage();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center space-y-6">
       <div className="w-24 h-24 bg-red-50 dark:bg-red-900/10 rounded-full flex items-center justify-center mb-2 animate-bounce">
          <span className="text-4xl">⚠️</span>
       </div>
       
       <div className="space-y-2">
          <h2 className="text-2xl font-black text-neutral-900 dark:text-white">
             {t("error_title") || "Xatolik yuz berdi!"}
          </h2>
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto leading-relaxed">
             {error?.message || t("error_desc") || "Kechirasiz, tizimda kutilmagan xatolik yuz berdi. Iltimos qayta urinib ko'ring."}
          </p>
       </div>

       <button
        onClick={() => reset()}
        className="px-8 py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold rounded-2xl shadow-xl shadow-neutral-900/10 active:scale-95 transition-all"
       >
        {t("try_again") || "Qayta urinish"}
       </button>
    </div>
  );
}
