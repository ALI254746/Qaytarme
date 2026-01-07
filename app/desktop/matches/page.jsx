"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getApiUrl } from "@/lib/api-config";
import { useLanguage } from "@/context/LanguageContext";

export default function MatchesPage() {
  const { t } = useLanguage();
  const { data: session } = useSession();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchMatches = async () => {
      if (!session?.user?.accessToken) return;
      try {
        const res = await fetch(getApiUrl("matches"), {
          headers: {
            "Authorization": `Bearer ${session.user.accessToken}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          // Filter out matches where items might have been deleted or already returned
          const validMatches = data.filter(m => 
            m.lostItem && 
            m.foundItem && 
            m.lostItem.moderationStatus !== 'returned' && 
            m.foundItem.moderationStatus !== 'returned'
          );
          setMatches(validMatches);
        }
      } catch (error) {
        console.error("Matches fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    if (session?.user?.accessToken) {
       fetchMatches();
    }
  }, [session]);

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 dark:text-white mb-2">{t('matches_page_title')}</h1>
          <p className="text-neutral-500 dark:text-neutral-400 font-medium">{t('matches_page_desc')}</p>
        </div>
        <div className="px-4 py-2 bg-mint/5 dark:bg-mint/10 rounded-xl border border-mint/20 flex items-center gap-2">
           <div className="w-2 h-2 bg-mint rounded-full animate-pulse" />
           <span className="text-xs font-bold text-mint uppercase tracking-wider">{t('ai_search_active')}</span>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
         <div className="bg-neutral-900 dark:bg-black rounded-[2rem] p-8 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-mint/10 blur-3xl group-hover:bg-mint/20 transition-colors" />
            <h3 className="text-4xl font-black mb-1">{matches.length} ta</h3>
            <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest">{t('stat_new_matches')}</p>
         </div>
         <div className="bg-white dark:bg-neutral-900 rounded-[2rem] p-8 border border-neutral-100 dark:border-neutral-800 shadow-xl shadow-neutral-100/50 dark:shadow-none">
            <h3 className="text-4xl font-black text-neutral-900 dark:text-white mb-1">
               {matches.length > 0 ? Math.max(...matches.map(m => m.similarity)) : 0}%
            </h3>
            <p className="text-neutral-500 dark:text-neutral-500 text-xs font-bold uppercase tracking-widest">{t('stat_highest_accuracy')}</p>
            <div className="mt-6 w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
               <div className="w-full h-full bg-mint" style={{ width: `${matches.length > 0 ? Math.max(...matches.map(m => m.similarity)) : 0}%` }} />
            </div>
         </div>
      </div>

      {/* Matches List */}
      <div className="space-y-6">
        <h2 className="text-xl font-black text-neutral-900 dark:text-white flex items-center gap-2">
          <svg className="w-6 h-6 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {t('matches_found_title')}
        </h2>

        {loading ? (
             <div className="text-center py-20 animate-pulse">
                <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-800 rounded-full mx-auto mb-4" />
                <div className="h-4 w-48 bg-neutral-200 dark:bg-neutral-800 rounded mx-auto" />
             </div>
        ) : (
          <AnimatePresence>
            {matches.length === 0 && (
                <div className="p-10 text-center space-y-4">
                   <p className="text-sm text-neutral-400 font-medium italic">{t('no_matches_found')}</p>
                </div>
            )}
            {matches.map((match, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                key={match._id}
                className="bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800 shadow-xl shadow-neutral-100/30 dark:shadow-none overflow-hidden"
              >
                <div className="p-6 lg:p-10 flex flex-col xl:flex-row items-center gap-8 lg:gap-12">
                  
                  {/* Lost Item */}
                  <div className="flex-1 w-full space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-800 bg-mint/10 w-fit px-3 py-1 rounded-full">
                      {t('label_lost')}
                    </div>
                    <div className="flex items-center gap-4">
                      {match.lostItem?.image?.url && (
                          <img src={match.lostItem.image.url} alt="" className="w-16 h-16 lg:w-24 lg:h-24 rounded-2xl object-cover shadow-lg" />
                      )}
                      <div>
                        <h4 className="text-lg lg:text-xl font-black text-neutral-900 dark:text-white">{match.lostItem?.itemType}</h4>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-bold">
                          {match.lostItem?.createdAt ? new Date(match.lostItem.createdAt).toLocaleDateString() : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Vertical Divider / Connection */}
                  <div className="flex flex-row xl:flex-col items-center gap-4">
                     <div className="h-px xl:h-12 w-12 xl:w-px bg-neutral-200 dark:bg-neutral-800" />
                     <div className="bg-mint text-neutral-800 w-10 h-10 lg:w-14 lg:h-14 rounded-full flex items-center justify-center font-black text-xs lg:text-lg shadow-xl shadow-mint/40">
                        {match.similarity}%
                     </div>
                     <div className="h-px xl:h-12 w-12 xl:w-px bg-neutral-200 dark:bg-neutral-800" />
                  </div>

                  {/* Found Item */}
                  <div className="flex-1 w-full space-y-4 text-left xl:text-right">
                    <div className="flex items-center xl:ml-auto gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-800 bg-mint/10 w-fit px-3 py-1 rounded-full">
                      {t('label_found')}
                    </div>
                    <div className="flex items-center xl:flex-row-reverse gap-4">
                       {match.foundItem?.image?.url && (
                          <img src={match.foundItem.image.url} alt="" className="w-16 h-16 lg:w-24 lg:h-24 rounded-2xl object-cover shadow-lg" />
                       )}
                      <div>
                        <h4 className="text-lg lg:text-xl font-black text-neutral-900 dark:text-white">{match.foundItem?.itemType}</h4>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-bold">
                          {match.foundItem?.createdAt ? new Date(match.foundItem.createdAt).toLocaleDateString() : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="w-full xl:w-48 space-y-3 pt-6 xl:pt-0 border-t xl:border-t-0 xl:border-l border-neutral-100 dark:border-neutral-800 xl:pl-8">
                      <Link 
                        href={`/desktop/item/${match.foundItem?._id}`}
                        className="w-full py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-black rounded-xl flex items-center justify-center gap-2 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all"
                      >
                        {t('btn_view_match')}
                      </Link>
                     {/* Biz faqat ikkinchi (topilgan) buyum egasi bilan bog'lanishimiz mumkin, agar biz 'lost' egasi bo'lsak. 
                         Lekin bu yerda match ikkala tomonga ko'rinadi. 
                         Soddalik uchun foundItem sahifasiga o'tamiz.
                     */}
                  </div>
                </div>

                {/* Match Reason Footer */}
                <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-800 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
                   <svg className="w-4 h-4 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                   </svg>
                   <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 italic">
                     {match.reason}
                   </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {!loading && (
          <div className="p-10 text-center space-y-4">
             <p className="text-sm text-neutral-400 font-medium italic">{t('system_check_info')}</p>
          </div>
      )}
    </div>
  );
}
