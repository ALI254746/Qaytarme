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
          // Filter valid matches
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
    <div className="min-h-screen bg-neutral-100 dark:bg-black pb-24">
      
       {/* Header */}
       <div className="sticky top-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-neutral-100 dark:border-white/5 px-4 h-14 flex items-center justify-between">
            <h1 className="font-bold text-lg text-neutral-900 dark:text-white">{t('matches_page_title') || "Mos kelganlar"}</h1>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-mint/10 rounded-full">
                <div className="w-1.5 h-1.5 bg-mint rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-mint uppercase tracking-wider">{t('ai_search_active') || "AI ACTIVE"}</span>
            </div>
       </div>

       {/* Stats Grid */}
       <div className="p-4 grid grid-cols-2 gap-4">
             <div className="bg-neutral-900 dark:bg-neutral-900 rounded-2xl p-4 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-mint/10 blur-xl" />
                <h3 className="text-2xl font-black mb-0.5">{matches.length}</h3>
                <p className="text-neutral-400 text-[9px] font-bold uppercase tracking-wider">{t('stat_new_matches') || "Yangi"}</p>
             </div>
             <div className="bg-white dark:bg-neutral-800 rounded-2xl p-4 shadow-sm border border-neutral-100 dark:border-white/5">
                <h3 className="text-2xl font-black text-neutral-900 dark:text-white mb-0.5">
                   {matches.length > 0 ? Math.max(...matches.map(m => m.similarity)) : 0}%
                </h3>
                <p className="text-neutral-500 text-[9px] font-bold uppercase tracking-wider">{t('stat_highest_accuracy') || "Aniqlik"}</p>
             </div>
       </div>

       {/* Matches List */}
       <div className="px-4 space-y-4">
          <h2 className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider ml-1">{t('matches_found_title') || "Topilganlar"}</h2>
          
          {loading ? (
               <div className="space-y-4">
                   {[1,2].map(n => (
                       <div key={n} className="bg-white dark:bg-neutral-900 h-48 rounded-3xl animate-pulse" />
                   ))}
               </div>
          ) : matches.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-10 text-neutral-400">
                    <div className="text-4xl mb-2">🤷‍♂️</div>
                    <p className="text-sm font-medium">{t('no_matches_found') || "Mosliklar topilmadi"}</p>
               </div>
          ) : (
            <AnimatePresence>
               {matches.map((match, index) => (
                  <motion.div
                    key={match._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white dark:bg-neutral-900 rounded-[2rem] p-4 shadow-sm border border-neutral-100 dark:border-white/5"
                  >
                      {/* Top Comparison */}
                      <div className="flex items-center justify-between mb-4">
                          {/* Left Item (Lost) */}
                          <div className="w-[42%]">
                                <div className="aspect-square rounded-2xl bg-neutral-100 dark:bg-neutral-800 mb-2 overflow-hidden relative">
                                    <span className="absolute top-1 left-1 bg-red-500 text-white text-[9px] font-bold px-1.5 rounded-md">{t('match_card_lost')}</span>
                                    {match.lostItem?.image?.url && <img src={match.lostItem.image.url} className="w-full h-full object-cover" />}
                                </div>
                                <h4 className="font-bold text-xs truncate dark:text-white">{match.lostItem?.title || match.lostItem?.itemType}</h4>
                          </div>

                          {/* Center Score */}
                          <div className="flex flex-col items-center gap-1 z-10">
                              <div className="w-12 h-12 rounded-full bg-mint shadow-lg shadow-mint/20 flex items-center justify-center font-black text-xs text-neutral-900">
                                  {match.similarity}%
                              </div>
                              <span className="text-[9px] font-bold text-neutral-400">{t('match_card_score')}</span>
                          </div>

                          {/* Right Item (Found) */}
                          <div className="w-[42%] text-right">
                                <div className="aspect-square rounded-2xl bg-neutral-100 dark:bg-neutral-800 mb-2 overflow-hidden relative">
                                    <span className="absolute top-1 right-1 bg-mint text-neutral-900 text-[9px] font-bold px-1.5 rounded-md">{t('match_card_found')}</span>
                                    {match.foundItem?.image?.url && <img src={match.foundItem.image.url} className="w-full h-full object-cover" />}
                                </div>
                                <h4 className="font-bold text-xs truncate dark:text-white">{match.foundItem?.title || match.foundItem?.itemType}</h4>
                          </div>
                      </div>

                      {/* Reason */}
                      <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-3 mb-4 flex gap-2">
                           <span className="text-mint">💡</span>
                           <p className="text-[10px] sm:text-xs font-medium text-neutral-500 dark:text-neutral-400 leading-tight">
                               {match.reason}
                           </p>
                      </div>

                     {/* Action */}
                      <Link 
                         href={`/mobile/item/${(session?.user?.id === match.lostItem?.user || session?.user?.id === match.lostItem?.user?._id) ? match.foundItem?._id : match.lostItem?._id}`}
                         className="flex items-center justify-center w-full py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-bold text-xs"
                      >
                         {t('btn_view_match') || "Ko'rish"}
                      </Link>
                  </motion.div>
               ))}
            </AnimatePresence>
          )}
       </div>
    </div>
  );
}
