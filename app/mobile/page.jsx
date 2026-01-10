"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { getApiUrl } from "@/lib/api-config";

import { useSession, signIn } from "next-auth/react";
import { useTelegram } from "@/app/hooks/useTelegram";
import { motion, AnimatePresence } from "framer-motion";

export default function MobileHomePage() {
  const { t } = useLanguage();
  const { data: session } = useSession();
  const { user: tgUser, tg } = useTelegram();
  const [isTelegramAuthenticating, setIsTelegramAuthenticating] = useState(false);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // all, lost, found
  const [activeCategory, setActiveCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pull to Refresh State
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullStartPoint, setPullStartPoint] = useState(0);
  const [pullChange, setPullChange] = useState(0);
  const refreshThreshold = 80;




  const CATEGORIES = [
    { id: "electronics", icon: "📱" },
    { id: "documents", icon: "📄" },
    { id: "personal", icon: "👜" },
    { id: "clothing", icon: "👕" },
    { id: "accessories", icon: "⌚" },
    { id: "keys", icon: "🔑" },
    { id: "bags", icon: "🎒" },
    { id: "automotive", icon: "🚗" },
    { id: "kids", icon: "🧸" },
    { id: "sports", icon: "⚽" },
    { id: "books", icon: "📚" },
    { id: "pets", icon: "🐶" },
    { id: "other", icon: "📦" }
  ];

  useEffect(() => {
    fetchItems();
  }, [activeFilter, activeCategory]);

  const fetchItems = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      // Build query string
      let query = "ariza?";
      const params = new URLSearchParams();
      
      if (activeFilter !== 'all') {
         params.append('status', activeFilter);
      }
      
      if (activeCategory !== 'all') {
         params.append('category', activeCategory);
      }

      const res = await fetch(getApiUrl(`ariza?${params.toString()}`));
      
      if (res.ok) {
        const data = await res.json();
        
        let validItems = [];
        if (Array.isArray(data)) {
            validItems = data;
        } else if (data.arizalar && Array.isArray(data.arizalar)) {
            validItems = data.arizalar;
        } else if (data.items && Array.isArray(data.items)) {
            validItems = data.items;
        } else if (data.data && Array.isArray(data.data)) {
            validItems = data.data;
        }
        
        setItems(validItems);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setLoading(false);
      if (isRefresh) setIsRefreshing(false);
    }
  };

  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      setPullStartPoint(e.targetTouches[0].clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (pullStartPoint > 0) {
      const pull = e.targetTouches[0].clientY - pullStartPoint;
      if (pull > 0) {
        setPullChange(pull < 150 ? pull : 150); // Max pull distance
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullChange > refreshThreshold) {
      setIsRefreshing(true);
      setPullChange(0); // Reset pull visual immediately or keep it? Let's reset and show spinner
      setPullStartPoint(0);
      await fetchItems(true);
    } else {
      setPullChange(0);
      setPullStartPoint(0);
    }
  };

  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} ${t('time_seconds_ago')}`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} ${t('time_minutes_ago')}`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} ${t('time_hours_ago')}`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} ${t('time_days_ago')}`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks} ${t('time_weeks_ago')}`;
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths} ${t('time_months_ago')}`;
    return `${Math.floor(diffInDays / 365)} ${t('time_years_ago')}`;
  };

  const filters = [
      { id: 'all', label: t('mobile_all') },
      { id: 'lost', label: t('mobile_lost') },
      { id: 'found', label: t('mobile_found') },
  ];

  return (
    <div 
      className="pb-24 space-y-2 relative min-h-screen"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
       {/* Refresh Indicator */}
       {(pullChange > 0 || isRefreshing) && (
          <div 
             className="flex items-center justify-center overflow-hidden transition-all duration-300"
             style={{ height: isRefreshing ? 60 : pullChange }}
          >
             <div className={`w-8 h-8 rounded-full bg-white dark:bg-neutral-800 shadow-md flex items-center justify-center text-mint border border-neutral-100 dark:border-white/10 ${isRefreshing ? 'animate-spin' : ''}`}
                  style={{ transform: `rotate(${pullChange * 2}deg)` }}
             >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
             </div>
          </div>
       )}

       {/* --- Clean Content Header --- */}
       <div className="pt-4 px-4 flex items-center justify-between mb-4">
           <h1 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
               {activeFilter === 'all' && activeCategory === 'all' ? (t('mobile_feed_title') !== 'mobile_feed_title' ? t('mobile_feed_title') : "So'nggi e'lonlar") : "Qidiruv natijalari"}
           </h1>
           
           <button 
               onClick={() => setShowFilters(true)}
               className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                   activeFilter !== 'all' || activeCategory !== 'all'
                   ? 'bg-neutral-900 dark:bg-white text-white dark:text-black shadow-lg shadow-neutral-900/20'
                   : 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-100 dark:border-white/10'
               }`}
           >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
               {(activeFilter !== 'all' || activeCategory !== 'all') && (
                   <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-black"/>
               )}
           </button>
       </div>

       {/* --- Filter Modal (Bottom Sheet Style) --- */}
       <AnimatePresence>
           {showFilters && (
               <>
                   <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setShowFilters(false)} />
                   <motion.div 
                       initial={{ y: "100%" }}
                       animate={{ y: 0 }}
                       exit={{ y: "100%" }}
                       transition={{ type: "spring", damping: 25, stiffness: 300 }}
                       className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-neutral-900 rounded-t-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
                   >
                       <div className="w-12 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full mx-auto mb-6" />
                       
                       <div className="flex items-center justify-between mb-6">
                           <h2 className="text-xl font-black text-neutral-900 dark:text-white">{t('mobile_filters') || "Filtrlash"}</h2>
                           {(activeFilter !== 'all' || activeCategory !== 'all') && (
                               <button 
                                   onClick={() => { setActiveFilter('all'); setActiveCategory('all'); setShowFilters(false); }}
                                   className="text-xs font-bold text-red-500 hover:text-red-600"
                               >
                                   Tozalash
                               </button>
                           )}
                       </div>

                       <div className="space-y-8">
                           {/* Status */}
                           <div className="space-y-3">
                               <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Holati</label>
                               <div className="flex p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                                   {filters.map(f => (
                                       <button
                                           key={f.id}
                                           onClick={() => setActiveFilter(f.id)}
                                           className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${
                                               activeFilter === f.id
                                               ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                                               : 'text-neutral-500'
                                           }`}
                                       >
                                           {f.label}
                                       </button>
                                   ))}
                               </div>
                           </div>

                           {/* Categories */}
                           <div className="space-y-3">
                               <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Kategoriya</label>
                               <div className="grid grid-cols-4 gap-3">
                                   {CATEGORIES.map(cat => (
                                       <button
                                           key={cat.id}
                                           onClick={() => setActiveCategory(activeCategory === cat.id ? 'all' : cat.id)}
                                           className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
                                               activeCategory === cat.id
                                               ? 'bg-neutral-900 dark:bg-white text-white dark:text-black border-transparent shadow-lg scale-105'
                                               : 'bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 text-neutral-500'
                                           }`}
                                       >
                                           <span className="text-2xl">{cat.icon}</span>
                                           <span className="text-[9px] font-bold uppercase truncate w-full text-center">{t(`cat_${cat.id}`)}</span>
                                       </button>
                                   ))}
                               </div>
                           </div>

                           <button 
                               onClick={() => setShowFilters(false)}
                               className="w-full py-4 bg-mint text-neutral-900 font-black rounded-xl text-sm shadow-lg shadow-mint/20 active:scale-95 transition-transform"
                           >
                               Natijalarni ko'rish
                           </button>
                       </div>
                   </motion.div>
               </>
           )}
       </AnimatePresence>

       {/* --- Grid Feed (Pinterest Style - Clean) --- */}
       {loading && !isRefreshing ? (
           <div className="grid grid-cols-2 gap-4 px-4 pb-24">
               {[1,2,3,4,5,6].map(n => (
                   <div key={n} className="space-y-3">
                       <div className="w-full aspect-[4/5] bg-neutral-100 dark:bg-neutral-800 rounded-2xl animate-pulse"/>
                       <div className="h-4 w-3/4 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse"/>
                       <div className="h-3 w-1/2 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse"/>
                   </div>
               ))}
           </div>
       ) : items.length > 0 ? (
           <div className="grid grid-cols-2 gap-4 px-4 pb-24">
               {items.map((item) => (
                   <Link href={`/mobile/item/${item._id}`} key={item._id} className="group block space-y-2 active:scale-95 transition-transform duration-200">
                       
                       {/* Image Card */}
                       <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 shadow-sm">
                           {item.image ? (
                               <img 
                                 src={typeof item.image === 'string' ? item.image : item.image.url} 
                                 alt={item.title}
                                 className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                               />
                           ) : (
                               <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">📦</div>
                           )}
                           
                           {/* Minimal Status Indicator */}
                           <div className={`absolute top-3 left-3 w-2 h-2 rounded-full ${
                               item.status === 'lost' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-mint shadow-[0_0_10px_rgba(50,255,150,0.5)]'
                           }`} />

                           {/* Gradient Overlay for Text Visibility */}
                           <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                       </div>

                       {/* Content */}
                       <div className="px-1">
                           <h3 className="font-bold text-sm text-neutral-900 dark:text-white leading-tight mb-1 line-clamp-2">
                               {item.itemType}
                           </h3>
                           <p className="text-xs text-neutral-400 font-medium line-clamp-1 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                              {item.location}
                           </p>
                       </div>
                   </Link>
               ))}
           </div>
       ) : (
           <div className="flex flex-col items-center justify-center py-32 text-center px-6">
               <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center text-4xl mb-4 grayscale opacity-50">
                   🍃
               </div>
               <h3 className="font-bold text-lg text-neutral-900 dark:text-white mb-2">{t('mobile_empty_title')}</h3>
               <p className="text-sm text-neutral-500 max-w-[200px] mx-auto mb-6">Hech narsa topilmadi. Filterlarni tekshiring.</p>
               <button 
                  onClick={() => { setActiveFilter('all'); setActiveCategory('all'); }} 
                  className="px-6 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-xl text-sm font-bold active:scale-95 transition-transform"
               >
                   Tozalash
               </button>
           </div>
       )}
    </div>
  );
}
