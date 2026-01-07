"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/context/LanguageContext";
import { useSnackbar } from "notistack"; // Assuming you have this or use simple alert
import { getApiUrl } from "@/lib/api-config";

export default function MobileContactPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { data: session } = useSession();
  const { enqueueSnackbar } = useSnackbar();

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(getApiUrl("admin/contact"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.user?.accessToken}`
        },
        body: JSON.stringify({ message })
      });

      if (res.ok) {
        enqueueSnackbar(t('message_sent_success') || "Xabaringiz yuborildi!", { variant: 'success' });
        setMessage("");
        setTimeout(() => router.back(), 1500); 
      } else {
        enqueueSnackbar("Xatolik yuz berdi", { variant: 'error' });
      }
    } catch (e) {
      console.error(e);
      enqueueSnackbar("Tarmoq xatoligi", { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black pb-safe">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-900 px-4 pt-4 pb-4 border-b border-neutral-100 dark:border-white/5 sticky top-0 z-10 flex items-center gap-3 shadow-sm">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-white active:scale-90 transition-transform"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-lg font-bold text-neutral-900 dark:text-white">{t('contact_admin') || "Admin bilan bog'lanish"}</h1>
      </div>

      <div className="p-4 space-y-6">
         {/* Info Card */}
         <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl shadow-sm border border-neutral-100 dark:border-white/5 text-center">
            <div className="w-16 h-16 bg-mint/10 rounded-full flex items-center justify-center mx-auto mb-4 text-mint text-3xl">
               🎧
            </div>
            <h2 className="font-bold text-neutral-900 dark:text-white mb-2">{t('contact_help_title') || "Qanday yordam bera olamiz?"}</h2>
            <p className="text-sm text-neutral-500 leading-relaxed">
               {t('contact_help_desc') || "Texnik muammolar, takliflar yoki shikoyatlar bo'lsa yozib qoldiring. Bizning operatorlarimiz tez orada aloqaga chiqishadi."}
            </p>
         </div>

         {/* Form */}
         <div className="space-y-4">
            <div>
               <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 ml-1">{t('message') || "Xabar matni"}</label>
               <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t('message_placeholder') || "Xabaringizni batafsil yozing..."}
                  className="w-full h-48 p-5 bg-white dark:bg-neutral-900 rounded-3xl text-base font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none border border-transparent focus:border-mint focus:ring-4 focus:ring-mint/10 transition-all resize-none shadow-sm"
               />
            </div>

            <button
               onClick={handleSubmit}
               disabled={loading || !message.trim()}
               className="w-full py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-neutral-900/20 dark:shadow-white/10 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all flex items-center justify-center gap-2"
            >
               {loading ? (
                  <span>{t('sending') || "Yuborilmoqda..."}</span>
               ) : (
                  <>
                     <span>{t('send') || "Yuborish"}</span>
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </>
               )}
            </button>
         </div>

         {/* Quick Contacts */}
         <div className="pt-4">
            <div className="text-center text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">{t('other_contacts') || "Boshqa aloqa usullari"}</div>
            <div className="grid grid-cols-2 gap-3">
               <a href="https://t.me/qaytarme_support" target="_blank" className="flex items-center justify-center gap-2 p-4 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-100 dark:border-white/5 active:bg-neutral-50 dark:active:bg-neutral-800 transition-colors">
                  <svg className="w-6 h-6 text-[#229ED9]" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                  <span className="font-bold text-neutral-700 dark:text-neutral-300 text-sm">Telegram</span>
               </a>
               <a href="tel:+998901234567" className="flex items-center justify-center gap-2 p-4 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-100 dark:border-white/5 active:bg-neutral-50 dark:active:bg-neutral-800 transition-colors">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">📞</div>
                  <span className="font-bold text-neutral-700 dark:text-neutral-300 text-sm">Call Center</span>
               </a>
            </div>
         </div>
      </div>
    </div>
  );
}
