"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { getApiUrl } from '@/lib/api-config';
import { useSnackbar } from 'notistack';
import { useLanguage } from '@/context/LanguageContext';

export default function ContactAdminPage() {
  const { t } = useLanguage();
  const { data: session } = useSession();
  const { enqueueSnackbar } = useSnackbar();
  
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      enqueueSnackbar(t('contact_error_empty'), { variant: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(getApiUrl('admin/contact'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.user?.accessToken}`
        },
        body: JSON.stringify({ 
           subject: subject || "No Subject", // Backend might expect this or just message
           message 
        })
      });

      if (res.ok) {
        enqueueSnackbar(t('contact_success'), { variant: 'success' });
        setSubject("");
        setMessage("");
      } else {
        throw new Error('Failed to send');
      }
    } catch (error) {
      console.error(error);
      enqueueSnackbar(t('contact_error_generic'), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6E2] dark:bg-black pb-20 space-y-8">
      {/* Header */}
      <div className="relative bg-neutral-900 dark:bg-white mx-4 lg:mx-8 mt-4 lg:mt-8 rounded-[3rem] p-8 lg:p-12 overflow-hidden shadow-2xl shadow-neutral-900/20 dark:shadow-none min-h-[250px] flex flex-col justify-center gap-6 group">
          <div className="absolute inset-0 overflow-hidden">
             <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-[#A9D3C9] to-[#8BC1B5] rounded-full blur-[120px] -translate-y-1/3 translate-x-1/4 animate-pulse duration-3000" />
             <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          </div>

          <div className="relative z-10">
             <h1 className="text-4xl lg:text-6xl font-black text-white dark:text-neutral-900 mb-2 tracking-tighter">{t('contact_admin_title') || "Admin bilan bog'lanish"}</h1>
             <p className="text-neutral-400 dark:text-neutral-500 font-medium text-lg max-w-2xl">
               {t('contact_admin_subtitle') || "Savollaringiz, takliflaringiz yoki shikoyatlaringiz bo'lsa, bizga yozing. Biz har doim yordam berishga tayyormiz."}
             </p>
          </div>
      </div>

      <div className="max-w-[1920px] mx-auto px-4 lg:px-8">
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* Contact Info Sidebar */}
            <div className="lg:col-span-4 space-y-6">
               <div className="bg-white dark:bg-neutral-900 p-8 rounded-[2.5rem] border border-neutral-100 dark:border-white/5 shadow-xl shadow-neutral-100/30 dark:shadow-none">
                  <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-mint" /> {t('contact_info') || "Aloqa ma'lumotlari"}
                  </h3>
                  
                  <div className="space-y-6">
                     <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        </div>
                        <div>
                           <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Email</div>
                           <a href="mailto:support@qaytarme.uz" className="text-lg font-bold text-neutral-900 dark:text-white hover:text-mint transition-colors">support@qaytarme.uz</a>
                           <p className="text-sm text-neutral-500 mt-1">24/7 online</p>
                        </div>
                     </div>

                     <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center shrink-0">
                           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        </div>
                        <div>
                           <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Call Center</div>
                           <a href="tel:+998901234567" className="text-lg font-bold text-neutral-900 dark:text-white hover:text-mint transition-colors">+998 90 123 45 67</a>
                           <p className="text-sm text-neutral-500 mt-1">Dushanba - Shanba, 09:00 - 18:00</p>
                        </div>
                     </div>

                     <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-400/10 text-blue-400 flex items-center justify-center shrink-0">
                           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                        <div>
                           <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Telegram</div>
                           <a href="https://t.me/qaytarme_support" target="_blank" className="text-lg font-bold text-neutral-900 dark:text-white hover:text-mint transition-colors">@qaytarme_support</a>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-8">
               <div className="bg-white dark:bg-neutral-900 p-8 lg:p-12 rounded-[2.5rem] border border-neutral-100 dark:border-white/5 shadow-xl shadow-neutral-100/30 dark:shadow-none h-full">
                  <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-8">{t('send_us_message') || "Bizga xabar yuboring"}</h2>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">{t('subject') || "Mavzu"}</label>
                        <input
                           type="text"
                           value={subject}
                           onChange={(e) => setSubject(e.target.value)}
                           placeholder={t('subject_placeholder') || "Xabar mavzusi..."}
                           className="w-full h-14 px-6 bg-neutral-50 dark:bg-neutral-800 rounded-2xl font-bold text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none border border-transparent focus:border-mint focus:bg-white dark:focus:bg-neutral-800 transition-all"
                        />
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">{t('message') || "Xabar matni"}</label>
                        <textarea
                           value={message}
                           onChange={(e) => setMessage(e.target.value)}
                           placeholder={t('message_placeholder') || "Batafsil ma'lumot yozing..."}
                           className="w-full h-64 p-6 bg-neutral-50 dark:bg-neutral-800 rounded-2xl font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none border border-transparent focus:border-mint focus:bg-white dark:focus:bg-neutral-800 transition-all resize-none leading-relaxed"
                           required
                        />
                     </div>

                     <div className="pt-4 flex justify-end">
                        <button
                           type="submit"
                           disabled={loading}
                           className="px-8 py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-xl shadow-neutral-900/20 dark:shadow-white/10 flex items-center gap-3"
                        >
                           {loading ? (
                              <span>{t('sending') || "Yuborilmoqda..."}</span>
                           ) : (
                              <>
                                 <span>{t('send_message') || "Yuborish"}</span>
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                              </>
                           )}
                        </button>
                     </div>
                  </form>
               </div>
            </div>

         </div>
      </div>
    </div>
  );
}
