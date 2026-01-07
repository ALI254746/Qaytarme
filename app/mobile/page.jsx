"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { getApiUrl } from "@/lib/api-config";

export default function MobileHomePage() {
  const { t } = useLanguage();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // all, lost, found
  const [activeCategory, setActiveCategory] = useState('all');
  
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

       {/* --- Combined Filters & Categories (Sticky) --- */}
       <div className="sticky top-16 z-30 bg-neutral-50/95 dark:bg-black/95 backdrop-blur-sm py-3 -mx-4 px-4 border-b border-neutral-200/50 dark:border-white/5 no-scrollbar overflow-x-auto flex items-center gap-3">
          
          {/* Status Filters */}
          <div className="flex bg-white dark:bg-neutral-900 rounded-xl p-1 border border-neutral-200 dark:border-neutral-800 shrink-0">
             {filters.map(f => (
                <button
                   key={f.id}
                   onClick={() => setActiveFilter(f.id)}
                   className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                       activeFilter === f.id 
                       ? 'bg-neutral-900 text-white dark:bg-white dark:text-black shadow-sm' 
                       : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                   }`}
                >
                    {f.label}
                </button>
             ))}
          </div>

          <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-800 shrink-0" />

          {/* Categories */}
          {CATEGORIES.map(cat => (
             <button
                key={cat.id}
                onClick={() => setActiveCategory(activeCategory === cat.id ? 'all' : cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all shrink-0 ${
                    activeCategory === cat.id
                    ? 'bg-mint text-neutral-900 border-mint shadow-sm'
                    : 'bg-white dark:bg-neutral-900 text-neutral-500 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                 }`}
             >
                 <span className="text-base">{cat.icon}</span>
                 <span className="text-[10px] font-bold uppercase tracking-wide">
                    {t(`cat_${cat.id}`)}
                 </span>
             </button>
          ))}
       </div>

       {/* --- Grid Feed --- */}
       {loading && !isRefreshing ? (
           <div className="grid grid-cols-2 gap-3 min-h-[50vh]">
               {[1,2,3,4,5,6].map(n => (
                   <div key={n} className="bg-white dark:bg-neutral-900 rounded-2xl p-2 h-48 animate-pulse">
                       <div className="w-full h-28 bg-neutral-200 dark:bg-neutral-800 rounded-xl mb-2"/>
                       <div className="h-3 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded mb-1"/>
                       <div className="h-2 w-1/2 bg-neutral-200 dark:bg-neutral-800 rounded"/>
                   </div>
               ))}
           </div>
       ) : items.length > 0 ? (
           <div className="grid grid-cols-2 gap-3 pb-20">
               {items.map((item) => (
                   <Link href={`/mobile/item/${item._id}`} key={item._id} className="group bg-white dark:bg-neutral-900 rounded-2xl p-2 border border-neutral-100 dark:border-white/5 shadow-sm active:scale-95 transition-transform duration-200">
                       
                       {/* Image Area */}
                       <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 mb-2">
                           {item.image ? (
                               <img 
                                 src={typeof item.image === 'string' ? item.image : item.image.url} 
                                 alt={item.title}
                                 className="w-full h-full object-cover"
                               />
                           ) : (
                               <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                           )}
                           
                           {/* Status Badge */}
                           <div className={`absolute top-2 left-2 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-sm ${
                               item.status === 'lost' 
                               ? 'bg-red-500 text-white' 
                               : 'bg-mint text-neutral-900'
                           }`}>
                               {item.status === 'lost' ? t('mobile_status_lost') : t('mobile_status_found')}
                           </div>
                       </div>

                       {/* Content Area */}
                       <div className="px-1">
                           <h3 className="font-bold text-xs text-neutral-900 dark:text-white line-clamp-1 mb-1">{item.itemType}</h3>
                           
                           <div className="flex items-center gap-1 text-[10px] text-neutral-400 mb-1.5">
                               <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                               <span className="truncate">{item.location}</span>
                           </div>

                           <div className="flex items-center justify-between mt-auto pt-2 border-t border-neutral-50 dark:border-white/5">
                               <span className="text-[9px] font-bold text-neutral-300">
                                   {getRelativeTime(item.createdAt || item.date)}
                                </span>
                           </div>
                       </div>
                   </Link>
               ))}
           </div>
       ) : (
           <div className="flex flex-col items-center justify-center py-20 text-neutral-400 min-h-[50vh]">
               <div className="text-4xl mb-2">🍃</div>
               <p className="text-sm font-medium">{t('mobile_empty_title')}</p>
               {activeCategory !== 'all' && <button onClick={() => setActiveCategory('all')} className="mt-4 text-mint text-xs font-bold">{t('mobile_empty_reset')}</button>}
           </div>
       )}
    </div>
  );
}
