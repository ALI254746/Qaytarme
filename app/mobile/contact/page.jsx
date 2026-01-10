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
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-black pb-safe text-[15px]">
      {/* Header (Native App Style) */}
      <div className="bg-white dark:bg-[#1c1c1d] h-[56px] border-b border-neutral-200/50 dark:border-white/5 sticky top-0 z-10 flex items-center justify-between px-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center -ml-2 text-blue-500 active:opacity-60 transition-opacity"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
        
        <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-semibold text-[17px] text-neutral-900 dark:text-white">
          {t('contact_admin') || "Admin bilan bog'lanish"}
        </h1>

        <div className="w-8"></div> {/* Spacer for balance */}
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
         {/* Info Text */}
         <p className="text-[13px] text-neutral-500 text-center px-4 leading-normal">
             {t('contact_help_desc') || "Savol yoki takliflaringiz bo'lsa, quyidagi forma orqali yuboring yoki to'g'ridan-to'g'ri bog'laning."}
         </p>

         {/* Form Group */}
         <div className="bg-white dark:bg-[#1c1c1d] rounded-xl overflow-hidden shadow-sm border border-neutral-200/50 dark:border-white/5">
            <textarea
               value={message}
               onChange={(e) => setMessage(e.target.value)}
               placeholder={t('message_placeholder') || "Xabaringizni yozing..."}
               className="w-full h-32 p-4 bg-transparent text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none resize-none text-[15px]"
            />
            <div className="px-3 pb-3">
                 <button
                    onClick={handleSubmit}
                    disabled={loading || !message.trim()}
                    className="w-full h-10 bg-blue-500 text-white rounded-lg font-semibold text-[15px] active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 transition-all flex items-center justify-center gap-2"
                 >
                    {loading ? (
                       <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : (
                       t('send') || "Yuborish"
                    )}
                 </button>
            </div>
         </div>

         {/* Quick Contacts List */}
         <div className="space-y-2">
             <div className="text-[13px] text-neutral-400 uppercase font-medium ml-4">{t('other_contacts') || "Boshqa aloqa turlari"}</div>
             <div className="bg-white dark:bg-[#1c1c1d] rounded-xl overflow-hidden shadow-sm border border-neutral-200/50 dark:border-white/5 divide-y divide-neutral-100 dark:divide-white/5">
                
                {/* Telegram */}
                <a href="https://t.me/qaytarme_support" target="_blank" className="flex items-center gap-4 px-4 py-3 active:bg-neutral-50 dark:active:bg-white/5 transition-colors">
                   <div className="w-7 h-7 bg-[#229ED9] rounded-full flex items-center justify-center text-white shrink-0">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                   </div>
                   <span className="flex-1 font-medium text-neutral-900 dark:text-white">Telegram Support</span>
                   <svg className="w-5 h-5 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </a>

                {/* Call Method */}
                <a href="tel:+998901234567" className="flex items-center gap-4 px-4 py-3 active:bg-neutral-50 dark:active:bg-white/5 transition-colors">
                   <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center text-white shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                   </div>
                   <span className="flex-1 font-medium text-neutral-900 dark:text-white">Call Center</span>
                   <svg className="w-5 h-5 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </a>

             </div>
         </div>
      </div>
    </div>
  );
}
