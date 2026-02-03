"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { getApiUrl } from "@/lib/api-config";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

const ItemSkeleton = () => (
  <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-white/5 shadow-sm overflow-hidden animate-pulse h-[280px]">
    <div className="h-40 bg-neutral-100 dark:bg-neutral-800" />
    <div className="p-4 space-y-2">
      <div className="h-4 w-20 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
      <div className="h-5 w-3/4 bg-neutral-200 dark:bg-neutral-700 rounded-xl" />
      <div className="h-3 w-full bg-neutral-200 dark:bg-neutral-700 rounded-xl" />
    </div>
  </div>
);

export default function MobileHomePage() {
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

  // Intersection Observer for infinite scroll
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

  // Fetch more when page changes
  useEffect(() => {
    if (page > 1) fetchItems(page, false);
  }, [page]);

  const fetchItems = async (pageNum, isNew) => {
    try {
      if (isNew) setLoading(true);
      else setLoadingMore(true);

      const queryParams = new URLSearchParams({
        page: pageNum,
        limit: 20, // 20 items per page for mobile
        search: searchQuery,
        status: filter !== 'all' ? filter : '',
        category: category !== 'all' ? category : '',
        lang: lang 
      });

      const url = getApiUrl(`ariza?${queryParams}`);
      const res = await fetch(url);
      const data = await res.json();

      if (res.ok) {
        const newItems = data.arizalar || [];
        setItems(prev => isNew ? newItems : [...prev, ...newItems]);
        // Backend returns hasMore directly - use it if available, otherwise check if we got a full page
        const hasMoreItems = data.hasMore !== undefined 
          ? data.hasMore 
          : newItems.length >= 20;
        setHasMore(hasMoreItems);
      }
    } catch (err) {
      console.error("Error fetching items:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black pb-24">
      {/* Telegram Bot Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mt-4 mb-2"
      >
        <button
          onClick={() => window.open('https://t.me/qaytarme_app_bot', '_blank')}
          className="w-full bg-gradient-to-r from-[#0088cc] to-[#0077b3] text-white rounded-2xl p-4 flex items-center justify-between shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </div>
            <div className="text-left">
              <h3 className="font-bold text-sm">Dasturimiz siz uchun qulay</h3>
              <p className="text-xs opacity-90">Telegram botimizga kirish</p>
            </div>
          </div>
          <svg className="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </motion.div>

      {/* Filter Tabs */}
      <div className="sticky top-12 z-30 bg-neutral-50 dark:bg-black pb-2">
        <div className="flex overflow-x-auto no-scrollbar gap-2 px-4 pt-4">
          {[
            { id: 'all', label: t('filter_all') || 'Barchasi', icon: '📂' },
            { id: 'found', label: t('filter_found') || 'Topilgan', icon: '🔍' },
            { id: 'lost', label: t('filter_lost') || 'Yo\'qolgan', icon: '📦' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                filter === f.id
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-lg'
                  : 'bg-white dark:bg-neutral-900 text-neutral-500 border border-neutral-100 dark:border-neutral-800'
              }`}
            >
              <span>{f.icon}</span>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Items Grid */}
      {loading && page === 1 ? (
        <div className="grid grid-cols-2 gap-3 px-4">
          {[1, 2, 3, 4, 5, 6].map(i => <ItemSkeleton key={i} />)}
        </div>
      ) : (
        <div className="min-h-[50vh]">
          {items.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 px-4">
              <AnimatePresence mode="popLayout">
                {items.map((item, index) => {
                  const isLast = items.length === index + 1;
                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3, delay: index * 0.03 }}
                      key={item._id}
                      ref={isLast ? lastItemRef : null}
                    >
                      <Link href={`/mobile/item/${item._id}`}>
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-white/5 shadow-sm overflow-hidden active:scale-95 transition-transform">
                          <div className="aspect-square bg-neutral-100 dark:bg-neutral-800 overflow-hidden relative">
                            {item.image ? (
                              <img 
                                src={item.image.url || item.image} 
                                className="w-full h-full object-cover" 
                                alt={item.itemType || item.title}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                            )}
                            <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-black uppercase text-white ${
                              item.status === 'lost' ? 'bg-red-500' : 'bg-green-500'
                            }`}>
                              {item.status === 'lost' ? (t('match_card_lost') || 'Yo\'qolgan') : (t('match_card_found') || 'Topilgan')}
                            </span>
                          </div>
                          <div className="p-3">
                            <h3 className="font-bold text-sm text-neutral-900 dark:text-white truncate mb-1">
                              {item.title || item.itemType || 'Noma\'lum'}
                            </h3>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                              {item.location || 'Joylashuv yo\'q'}
                            </p>
                            {item.date && (
                              <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">
                                {new Date(item.date).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-20 text-center flex flex-col items-center justify-center"
            >
              <div className="text-6xl mb-4 grayscale opacity-50">📦</div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
                {t("empty_title") || "E'lonlar topilmadi"}
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xs px-4">
                {t("empty_desc") || "Hozircha e'lonlar mavjud emas"}
              </p>
            </motion.div>
          )}

          {loadingMore && (
            <div className="grid grid-cols-2 gap-3 px-4 mt-4">
              {[1, 2, 3, 4].map(i => <ItemSkeleton key={i} />)}
            </div>
          )}

          {!hasMore && items.length > 0 && (
            <div className="py-8 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-white/5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                  {t("all_loaded") || "Barcha e'lonlar yuklandi"}
                </p>
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
