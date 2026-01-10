"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { getApiUrl } from "@/lib/api-config";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

// --- BRAND COLORS (PREMIUM LIGHT) ---
// Mint:      #A9D3C9
// Ivory:     #F7F6E2
// Obsidian:  #2E2D2B

const CATEGORIES = [
  { id: "all", icon: "🔍" },
  { id: "electronics", icon: "💻" },
  { id: "documents", icon: "📄" },
  { id: "personal", icon: "💼" },
  { id: "clothing", icon: "👕" },
  { id: "accessories", icon: "⌚" },
  { id: "keys", icon: "🔑" },
  { id: "bags", icon: "🎒" },
  { id: "automotive", icon: "🚗" },
  { id: "kids", icon: "🧸" },
  { id: "sports", icon: "⚽" },
  { id: "books", icon: "📚" },
  { id: "pets", icon: "🐾" },
  { id: "other", icon: "📦" }
];

const ItemSkeleton = () => (
  <div className="bg-white dark:bg-neutral-900 rounded-[2rem] border border-[#2E2D2B]/5 dark:border-white/5 shadow-sm overflow-hidden animate-pulse h-[350px]">
    <div className="h-48 bg-[#2E2D2B]/5 dark:bg-white/5" />
    <div className="p-5 space-y-3">
      <div className="flex justify-between">
        <div className="h-4 w-24 bg-[#2E2D2B]/5 dark:bg-white/5 rounded-full" />
        <div className="h-4 w-16 bg-[#2E2D2B]/5 dark:bg-white/5 rounded-full" />
      </div>
      <div className="h-6 w-3/4 bg-[#2E2D2B]/5 dark:bg-white/5 rounded-xl" />
      <div className="h-4 w-full bg-[#2E2D2B]/5 dark:bg-white/5 rounded-xl" />
    </div>
  </div>
);

const FilterButton = ({ label, icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 whitespace-nowrap flex-shrink-0 snap-center border flex items-center gap-2 ${
      active
        ? "bg-[#A9D3C9] text-[#2E2D2B] border-[#A9D3C9] shadow-lg shadow-[#A9D3C9]/20 scale-105"
        : "bg-white dark:bg-neutral-800 text-[#2E2D2B]/60 dark:text-white/60 hover:bg-[#A9D3C9] hover:text-[#2E2D2B] border-[#2E2D2B]/5 dark:border-[#A9D3C9]/50 dark:shadow-[0_0_15px_-5px_rgba(169,211,201,0.3)]"
    }`}
  >
    <span className="text-base">{icon}</span>
    {label}
  </button>
);

const ItemCard = ({ item }) => {
  const { t } = useLanguage();
  const displayLocation = item.location || `${item.region || ""}${item.district ? `, ${item.district}` : ""}`;

  // Time Ago Helper
  const timeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = (now - date) / 1000; // seconds
    
    if (diff < 60) return t("time_just_now");
    if (diff < 3600) return `${Math.floor(diff / 60)} ${t("time_min_ago")}`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ${t("time_hour_ago")}`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} ${t("time_day_ago")}`;
    return date.toLocaleDateString();
  };

  return (
    <Link href={`/desktop/item/${item._id}`}>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -8, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="bg-white dark:bg-neutral-900 rounded-[2rem] border border-[#2E2D2B]/5 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] overflow-hidden group cursor-pointer transition-all duration-500 h-full flex flex-col relative"
      >
        {/* Image Section */}
        <div className="relative h-64 overflow-hidden">
          {(() => {
            let imageUrl = item.image?.url || (typeof item.image === 'string' ? item.image : null);
            
            // Force HTTPS if it's a Cloudinary URL
            if (imageUrl && imageUrl.startsWith('http:')) {
                imageUrl = imageUrl.replace('http:', 'https:');
            }
            
            // Debug log (remove later)
            console.log('Rendering Image:', { id: item._id, raw: item.image, final: imageUrl });

            const categoryIcons = {
              electronics: "💻",
              documents: "📄",
              personal: "💼",
              clothing: "👕",
              accessories: "⌚",
              keys: "🔑", 
              bags: "🎒",
              automotive: "🚗",
              kids: "🧸",
              sports: "⚽",
              books: "📚",
              pets: "🐾",
              other: "📦",
              all: "🔍"
            };

            // Smart Text Analysis
            const getSmartIcon = () => {
               const text = (item.itemType + " " + (item.itemName || "")).toLowerCase();
               
               if (text.match(/iphone|samsung|redmi|xiaomi|telefon|tel/)) return "📱";
               if (text.match(/macbook|laptop|noutbuk|kompyuter/)) return "💻";
               if (text.match(/airpods|naushnik|quloqchin|buds/)) return "🎧";
               if (text.match(/pasport|passport/)) return "🛂";
               if (text.match(/prava|guvohnoma|id karta|card|karta/)) return "🪪";
               if (text.match(/sumka|bag|ryukzak/)) return "🎒";
               if (text.match(/hamyon|kashalok|wallet/)) return "👛";
               if (text.match(/soat|watch/)) return "⌚";
               if (text.match(/mashina|avto|spark|gentra|cobalt|malibu/)) return "🚗";
               if (text.match(/kalit|key/)) return "🔑";
               if (text.match(/kuchuk|it|dog/)) return "🐕";
               if (text.match(/mushuk|cat/)) return "🐈";
               if (text.match(/velosiped|velik/)) return "🚲";
               
               return categoryIcons[item.category] || "📦";
            };

            const fallbackIcon = getSmartIcon();

            return imageUrl ? (
              <img
                src={imageUrl}
                alt={item.itemType}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                onError={(e) => { 
                    console.error('Image Load Error:', imageUrl);
                    e.currentTarget.style.display = 'none'; 
                    e.currentTarget.nextSibling.style.display = 'flex'; 
                }}
              />
            ) : (
                <div className={`w-full h-full flex flex-col items-center justify-center text-6xl relative overflow-hidden ${
                   item.status === 'lost' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-[#A9D3C9]/20 dark:bg-[#A9D3C9]/10'
                }`}>
                   <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                   <motion.div 
                     initial={{ scale: 0.5, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                     transition={{ type: "spring", stiffness: 200 }}
                     className="z-10 drop-shadow-2xl grayscale-[0.2] group-hover:scale-110 transition-transform duration-500"
                   >
                      {fallbackIcon}
                   </motion.div>
                </div>
            );
          })()}
          
          {/* Fallback container */}
          <div className="hidden absolute inset-0 w-full h-full bg-[#F7F6E2] dark:bg-neutral-800 items-center justify-center text-5xl opacity-50">
             📦
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />

          {/* Status Badge */}
          <div className="absolute top-4 left-4">
            <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg backdrop-blur-md border border-white/20 ${
              item.status === 'lost' 
                ? 'bg-red-500 text-white' 
                : 'bg-mint text-[#2E2D2B]'
            }`}>
              {item.status === 'lost' ? t("filter_lost") : t("filter_found")}
            </div>
          </div>

          {/* Category Badge */}
           <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
             <span className="text-[10px] font-bold text-white uppercase tracking-wider">{item.itemType}</span>
           </div>
           
           {/* Date & Location Overlay */}
           <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-white/90">
                  <svg className="w-4 h-4 shrink-0 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="text-xs font-bold">{timeAgo(item.createdAt)}</span>
              </div>
              {displayLocation && (
                <div className="flex items-center gap-2 text-white">
                    <svg className="w-4 h-4 shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span className="text-sm font-black truncate">{displayLocation}</span>
                </div>
              )}
           </div>
        </div>

        {/* Content Section */}
        <div className="p-6 flex-1 flex flex-col relative z-10">
          <h3 className="text-xl font-black text-[#2E2D2B] dark:text-white mb-2 line-clamp-1 group-hover:text-mint transition-colors">
             {item.itemType}
          </h3>
          <p className="text-sm text-[#2E2D2B]/60 dark:text-white/60 line-clamp-2 mb-6 font-medium leading-relaxed">
            {item.itemDescription || t("no_description")}
          </p>
          
          <div className="mt-auto pt-4 border-t border-[#2E2D2B]/5 dark:border-white/5 flex items-center justify-between gap-3">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F7F6E2] dark:bg-neutral-800 p-0.5 shadow-sm">
                   <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-mint text-xs font-black text-[#2E2D2B]">
                      {item.user?.avatar ? <img src={item.user.avatar} alt="" className="w-full h-full object-cover" /> : (item.user?.name?.charAt(0) || "U")}
                   </div>
                </div>
                <div className="flex flex-col">
                   <span className="text-xs font-black text-[#2E2D2B] dark:text-white uppercase tracking-wider line-clamp-1">{item.user?.name || t("default_user_name")}</span>
                   <span className="text-[10px] text-[#2E2D2B]/40 dark:text-white/40 font-bold">{t("author")}</span>
                </div>
             </div>
             
             <button className="w-10 h-10 rounded-full bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:bg-mint hover:text-neutral-900 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
             </button>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q") || "";
  const { t, lang } = useLanguage();
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState("all");
  const [category, setCategory] = useState("all"); 
  
  const scrollRef = useRef(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const scrollProgress = useMotionValue(0);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationFrameId;
    
    const scroll = () => {
      if (scrollContainer) {
        if (isAutoScrolling) {
           scrollContainer.scrollLeft += 0.5; // Slow speed
        }
        
        // Reset if scrolled past one-third 
        const singleSetWidth = scrollContainer.scrollWidth / 3;
        if (scrollContainer.scrollLeft >= singleSetWidth * 2) {
           scrollContainer.scrollLeft = singleSetWidth;
        } else if (scrollContainer.scrollLeft <= 0) {
            scrollContainer.scrollLeft = singleSetWidth;
        }

        const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
        if (maxScroll > 0) {
           scrollProgress.set(scrollContainer.scrollLeft / maxScroll);
        }
      }
      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isAutoScrolling, scrollProgress]);

  // Intersection Observer 
  const observer = useRef();
  const lastItemRef = useCallback(node => {
     if (loading || loadingMore) return;
     if (observer.current) observer.current.disconnect();
     observer.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasMore) {
           setPage(prev => prev + 1);
        }
     });
     if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  // Reset and fetch when query/filter changes
  useEffect(() => {
     setItems([]);
     setPage(1);
     setHasMore(true);
     fetchItems(1, true);
  }, [searchQuery, filter, category, lang]);

  // Fetch more 
  useEffect(() => {
     if (page > 1) fetchItems(page, false);
  }, [page]);

  const fetchItems = async (pageNum, isNew) => {
     try {
        if (isNew) setLoading(true);
        else setLoadingMore(true);

        const queryParams = new URLSearchParams({
           page: pageNum,
           limit: 12,
           search: searchQuery,
           status: filter !== 'all' ? filter : '',
           category: category !== 'all' ? category : '',
           lang: lang 
        });

        const url = getApiUrl(`ariza?${queryParams}`);
        console.log('Frontend Fetching Items URL:', url);
        console.log('Frontend Selected Category:', category);

        const res = await fetch(url);
        const data = await res.json();

        if (res.ok) {
           const newItems = data.arizalar || [];
           setItems(prev => isNew ? newItems : [...prev, ...newItems]);
           setHasMore(data.currentPage < data.totalPages);
        }
     } catch (err) {
        console.error("Error fetching items:", err);
     } finally {
        setLoading(false);
        setLoadingMore(false);
     }
  };


  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 bg-[#F7F6E2] dark:bg-black min-h-screen">
      {/* Welcome Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative p-8 lg:p-12 rounded-[2.5rem] bg-white dark:bg-neutral-900 overflow-hidden shadow-2xl shadow-[#2E2D2B]/5 dark:shadow-white/5 min-h-[300px] flex items-center group border border-[#2E2D2B]/5 dark:border-white/5"
      >
        {/* Animated Background */}
        <div className="absolute inset-0">
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#A9D3C9]/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-1000" />
           <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#2E2D2B]/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 group-hover:scale-125 transition-transform duration-1000" />
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20  mix-blend-soft-light"></div>
        </div>
        
        <div className="relative z-10 w-full flex flex-col lg:flex-row justify-between items-center gap-10">
          <div className="text-center lg:text-left">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-[#2E2D2B] dark:text-white mb-6 leading-tight tracking-tight">
                {t("hero_title_1")} <span className="text-[#A9D3C9]">{t("hero_title_2")}</span>
              </h1>
              <p className="text-[#2E2D2B]/60 dark:text-white/60 max-w-lg text-sm md:text-lg font-medium leading-relaxed">
                {t("hero_desc")}
              </p>
            </motion.div>
          </div>

          <div className="hidden md:grid grid-cols-2 gap-3 lg:gap-4 shrink-0">
             {[
               { val: "2.4k+", lab: t("stat_found"), bg: "bg-white/60 dark:bg-neutral-900/60" },
               { val: "850+", lab: t("stat_returned"), bg: "bg-[#A9D3C9]/30 dark:bg-[#A9D3C9]/10" },
               { val: "10k+", lab: t("stat_users"), bg: "bg-white/60 dark:bg-neutral-900/60 col-span-2" }
             ].map((s, i) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + (i * 0.1) }}
                  key={i} 
                  className={`${s.bg} backdrop-blur-md border border-[#2E2D2B]/5 dark:border-[#A9D3C9]/50 p-3 lg:p-6 rounded-3xl lg:rounded-[2rem] text-center shadow-xl shadow-[#2E2D2B]/5 dark:shadow-[#A9D3C9]/20 hover:scale-105 transition-transform cursor-default flex flex-col justify-center items-center`}
                >
                   <div className="text-xl lg:text-3xl font-black text-[#2E2D2B] dark:text-white mb-0.5 lg:mb-1 drop-shadow-sm">{s.val}</div>
                   <div className="text-[8px] lg:text-[10px] uppercase font-bold text-[#2E2D2B]/50 dark:text-[#A9D3C9] tracking-widest">{s.lab}</div>
                </motion.div>
             ))}
          </div>
        </div>
      </motion.div>

      {/* Filters HUD */}
      <div className="flex flex-col gap-4 bg-[#F7F6E2]/80 dark:bg-black/80 backdrop-blur-xl p-4 -mx-4 lg:-mx-0 lg:rounded-[2rem] border-y lg:border border-[#2E2D2B]/5 dark:border-[#A9D3C9]/50 shadow-xl shadow-[#2E2D2B]/5 dark:shadow-[0_0_20px_-5px_rgba(169,211,201,0.2)] transition-all w-full mb-8">
        {/* Status Tabs */}
        <div className="flex p-1.5 bg-white dark:bg-neutral-900 rounded-2xl w-full border border-[#2E2D2B]/5 dark:border-[#A9D3C9]/20 shadow-sm">
          {[
            { id: "all", label: t("filter_all") },
            { id: "lost", label: t("filter_lost") },
            { id: "found", label: t("filter_found") },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                filter === f.id
                  ? "bg-[#A9D3C9] text-[#2E2D2B] font-black shadow-lg shadow-[#A9D3C9]/20 scale-[1.02]"
                  : "text-[#2E2D2B]/40 dark:text-white/40 hover:bg-[#A9D3C9]/10 hover:text-[#2E2D2B] dark:hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Categories Scrollable (Auto + Manual) */}
        <div 
           className="relative overflow-visible -mx-4 w-[calc(100%+32px)]"
           onMouseEnter={() => setIsAutoScrolling(false)}
           onMouseLeave={() => setIsAutoScrolling(true)}
           onTouchStart={() => setIsAutoScrolling(false)}
           onTouchEnd={() => setTimeout(() => setIsAutoScrolling(true), 1000)}
        >
           {/* Hide Native Scrollbar Styles */}
           <style>{`
             .scrollbar-none::-webkit-scrollbar { display: none; }
             .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
           `}</style>

           {/* Fade masks */}
           <div className="absolute left-0 top-0 bottom-4 w-12 bg-gradient-to-r from-[#F7F6E2]/90 dark:from-black/90 to-transparent z-10 pointer-events-none" />
           <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-[#F7F6E2]/90 dark:from-black/90 to-transparent z-10 pointer-events-none" />

           <div 
             ref={scrollRef}
             className="flex gap-3 w-full overflow-x-auto scrollbar-none px-4 py-2"
           >
            {/* Show items tripled for infinite scroll effect */}
            {[...CATEGORIES, ...CATEGORIES, ...CATEGORIES].map((cat, index) => (
              <FilterButton
                key={`${cat.id}-${index}`}
                label={t("cat_" + cat.id)}
                icon={cat.icon}
                active={category === cat.id}
                onClick={() => setCategory(cat.id)}
              />
            ))}
           </div>

           {/* Custom Animated Scrollbar */}
           <div className="mx-8 h-1 bg-[#2E2D2B]/5 dark:bg-white/5 rounded-full mt-2 overflow-hidden relative">
              <motion.div 
                className="absolute top-0 bottom-0 bg-gradient-to-r from-[#A9D3C9] via-white to-[#A9D3C9] dark:from-[#A9D3C9]/50 dark:via-[#A9D3C9] dark:to-[#A9D3C9]/50 shadow-[0_0_10px_rgba(169,211,201,0.5)] rounded-full"
                style={{ 
                    width: "20%", 
                    left: useTransform(scrollProgress, [0, 1], ["0%", "80%"]) 
                }} 
              />
           </div>
        </div>
      </div>

      {/* Grid */}
      {loading && page === 1 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <ItemSkeleton key={i} />)}
        </div>
      ) : (
        <div className="min-h-[50vh]">
          {items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              <AnimatePresence mode="popLayout">
                {items.map((item, index) => {
                  const isLast = items.length === index + 1;
                  return (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      key={item._id} 
                      ref={isLast ? lastItemRef : null}
                    >
                      <ItemCard item={item} />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-20 text-center flex flex-col items-center justify-center bg-white rounded-[3rem] border border-dashed border-[#2E2D2B]/10"
            >
              <div className="w-32 h-32 bg-[#F7F6E2] rounded-full flex items-center justify-center text-6xl mb-6 grayscale opacity-80 shadow-inner">
                📦
              </div>
              <h3 className="text-2xl font-black text-[#2E2D2B] mb-2 uppercase tracking-tight">{t("empty_title")}</h3>
              <p className="text-[#2E2D2B]/50 font-medium max-w-sm mx-auto px-4 leading-relaxed">
                {t("empty_desc")}
              </p>
              <button 
                 onClick={() => {setFilter('all'); setCategory('all');}}
                 className="mt-8 px-8 py-3 bg-[#2E2D2B] text-[#F7F6E2] rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#A9D3C9] hover:text-[#2E2D2B] transition-colors"
              >
                {t("empty_action")}
              </button>
            </motion.div>
          )}

          {loadingMore && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8 mt-8">
               {[1, 2, 3, 4].map(i => <ItemSkeleton key={i} />)}
            </div>
          )}

          {!hasMore && items.length > 0 && (
            <div className="py-16 text-center">
               <div className="inline-flex items-center gap-4 px-6 py-3 rounded-full bg-white border border-[#2E2D2B]/5">
                  <div className="w-2 h-2 bg-[#A9D3C9] rounded-full animate-pulse" />
                  <p className="text-xs font-black text-[#2E2D2B]/40 uppercase tracking-widest">{t("all_loaded")}</p>
                  <div className="w-2 h-2 bg-[#A9D3C9] rounded-full animate-pulse" />
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
