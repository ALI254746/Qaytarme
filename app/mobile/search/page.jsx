"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { getApiUrl } from "@/lib/api-config";
import Link from "next/link";

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const { t } = useLanguage();

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = async (searchTerm) => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(getApiUrl(`ariza/search?q=${encodeURIComponent(searchTerm)}`));
      if (res.ok) {
        const data = await res.json();
        setResults(data.items || data || []);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
        setLoading(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    router.push(`/mobile/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-neutral-100 dark:border-white/5 px-4 h-16 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-neutral-500">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          
          <form onSubmit={onSubmit} className="flex-1 relative">
             <input 
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('search_placeholder')}
                className="w-full h-10 bg-neutral-100 dark:bg-neutral-800 rounded-xl pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-mint/50 dark:text-white"
             />
             <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </form>
      </div>

      {/* Results */}
      <div className="p-4 space-y-4">
         <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">
             {loading ? t('loading') : `${results.length} ${t('results_found') || 'ta natija'}`}
         </h2>

         {loading ? (
             <div className="flex justify-center py-10">
                 <div className="animate-spin text-2xl text-mint">⏳</div>
             </div>
         ) : results.length === 0 ? (
             <div className="text-center py-20 text-neutral-400">
                 <div className="text-4xl mb-2">🔍</div>
                 <p className="text-sm font-medium">{t('search_no_results')}</p>
             </div>
         ) : (
             <div className="grid grid-cols-2 gap-3">
                 {results.map(item => (
                     <Link key={item._id} href={`/mobile/item/${item._id}`} className="bg-white dark:bg-neutral-900 rounded-2xl p-2 shadow-sm border border-neutral-100 dark:border-white/5">
                         <div className="aspect-square rounded-xl bg-neutral-100 dark:bg-neutral-800 mb-2 overflow-hidden relative">
                             {item.image ? (
                                 <img src={item.image.url || item.image} className="w-full h-full object-cover" />
                             ) : (
                                 <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                             )}
                             <span className={`absolute top-1 left-1 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase text-white ${item.status === 'lost' ? 'bg-red-500' : 'bg-mint text-neutral-900'}`}>
                                 {item.status === 'lost' ? t('match_card_lost') : t('match_card_found')}
                             </span>
                         </div>
                         <h3 className="font-bold text-xs text-neutral-900 dark:text-white truncate px-1">{item.title || item.itemType}</h3>
                         <p className="text-[10px] text-neutral-500 px-1 truncate">{item.location}</p>
                     </Link>
                 ))}
             </div>
         )}
      </div>
    </div>
  );
}

export default function MobileSearchPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white dark:bg-black"/>}>
            <SearchContent />
        </Suspense>
    );
}
