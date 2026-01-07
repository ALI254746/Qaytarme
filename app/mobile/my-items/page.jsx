"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { getApiUrl } from "@/lib/api-config";
import { useLanguage } from "@/context/LanguageContext";

export default function MobileMyItemsPage() {
  const { t } = useLanguage();
  const { data: session } = useSession();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [deletingId, setDeletingId] = useState(null);

  const fetchMyItems = async () => {
    if (!session?.user?.accessToken) return;
    try {
      const res = await fetch(getApiUrl("ariza/my"), {
        headers: {
          "Authorization": `Bearer ${session.user.accessToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.accessToken) {
      fetchMyItems();
    }
  }, [session]);

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session || !confirm(t('confirm_delete') || "O'chirishni tasdiqlaysizmi?")) return;
    
    setDeletingId(id);
    try {
      const res = await fetch(getApiUrl(`ariza/${id}`), { 
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${session.user.accessToken}`
        }
      });
      
      if (res.ok) {
        setItems(prev => prev.filter(i => i._id !== id));
      }
    } catch (error) {
      console.error('Delete fetch error:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredItems = items.filter(item => {
    if (filter === "all") return true;
    if (filter === "found") return item.status === "found";
    if (filter === "lost") return item.status === "lost";
    if (filter === "returned") return item.moderationStatus === "returned";
    return true;
  });

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-neutral-100 dark:border-white/5 px-4 h-14 flex items-center justify-between">
          <h1 className="font-bold text-lg text-neutral-900 dark:text-white">{t('my_items') || "Mening e'lonlarim"}</h1>
          <Link href="/mobile/add" className="text-mint text-sm font-bold">
             + {t('new_item_btn') || "Yangi"}
          </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 p-4 pb-2 sticky top-14 bg-neutral-50 dark:bg-black z-30">
        {[
          { id: 'all', label: t('filter_all') || 'Barchasi', icon: '📂' },
          { id: 'found', label: t('filter_found') || 'Topilgan', icon: '🔍' },
          { id: 'lost', label: t('filter_lost') || 'Yo\'qolgan', icon: '📦' },
          { id: 'returned', label: t('filter_completed') || 'Qaytarilgan', icon: '✅' },
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

      {/* Content */}
      <div className="px-4 space-y-4">
         {loading ? (
            [1,2,3].map(n => (
               <div key={n} className="bg-white dark:bg-neutral-900 h-32 rounded-3xl animate-pulse" />
            ))
         ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-neutral-400 min-h-[50vh]">
               <div className="text-4xl mb-2 grayscale opacity-50">📭</div>
               <p className="text-sm font-medium">{t('no_items_found') || "E'lonlar topilmadi"}</p>
            </div>
         ) : (
            <AnimatePresence>
               {filteredItems.map((item, index) => (
                  <motion.div
                    key={item._id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white dark:bg-neutral-900 rounded-[2rem] p-4 shadow-sm border border-neutral-100 dark:border-white/5 relative overflow-hidden"
                  >
                     <div className="flex gap-4">
                        {/* Image */}
                        <div className="w-20 h-20 rounded-2xl bg-neutral-100 dark:bg-neutral-800 shrink-0 overflow-hidden relative">
                           {item.image?.url ? (
                              <img src={item.image.url} className="w-full h-full object-cover" />
                           ) : (
                              <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                           )}
                           <div className={`absolute top-0 left-0 px-1.5 py-0.5 rounded-br-lg text-[8px] font-black uppercase text-white ${
                              item.status === 'lost' ? 'bg-red-500' : 'bg-mint text-neutral-900'
                           }`}>
                              {item.status === 'lost' ? 'LOST' : 'FOUND'}
                           </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                           <div>
                              <div className="flex justify-between items-start">
                                 <h3 className="font-bold text-neutral-900 dark:text-white truncate pr-2">{item.itemType}</h3>
                                 <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${
                                    item.moderationStatus === 'approved' 
                                    ? 'bg-mint/10 text-mint' 
                                    : item.moderationStatus === 'pending' 
                                    ? 'bg-yellow-500/10 text-yellow-500' 
                                    : item.moderationStatus === 'returned'
                                    ? 'bg-blue-500/10 text-blue-500'
                                    : 'bg-red-500/10 text-red-500'
                                 }`}>
                                    {item.moderationStatus}
                                 </span>
                              </div>
                              <p className="text-[10px] text-neutral-400 line-clamp-2 mt-1">
                                 {item.itemDescription || t('no_description_text')}
                              </p>
                           </div>
                           
                           <div className="flex items-center gap-2 mt-2">
                              <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                                 📅 {new Date(item.createdAt).toLocaleDateString()}
                              </span>
                           </div>
                        </div>
                     </div>

                     {/* Actions */}
                     <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-white/5 flex items-center gap-2">
                        {item.moderationStatus !== 'returned' ? (
                           <button 
                              onClick={(e) => handleDelete(e, item._id)}
                              disabled={deletingId === item._id}
                              className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-500 active:scale-95 transition-all"
                           >
                              {deletingId === item._id ? (
                                 <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : (
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              )}
                           </button>
                        ) : (
                           <button disabled className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-300 dark:text-neutral-600 cursor-not-allowed">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                           </button>
                        )}
                        
                        <Link href={`/mobile/item/${item._id}`} className="flex-1 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-bold text-xs uppercase tracking-wider text-center active:scale-95 transition-all">
                           {t('btn_view') || "Ko'rish"}
                        </Link>
                     </div>
                  </motion.div>
               ))}
            </AnimatePresence>
         )}
      </div>
    </div>
  );
}
