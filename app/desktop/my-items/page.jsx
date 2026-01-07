"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { getApiUrl } from "@/lib/api-config";

import { useSnackbar } from "notistack";
import { useLanguage } from "@/context/LanguageContext";

const StatCard = ({ label, value, icon, color }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-neutral-900 p-6 rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800 shadow-xl shadow-neutral-100/30 dark:shadow-none flex items-center gap-4 flex-1 group hover:scale-[1.02] transition-transform"
  >
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${color} shadow-lg shadow-current/20`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black uppercase text-neutral-400 dark:text-neutral-500 tracking-widest mb-1">{label}</p>
      <h3 className="text-3xl font-black text-neutral-900 dark:text-white leading-none">{value}</h3>
    </div>
  </motion.div>
);

export default function MyItemsPage() {
  const { data: session } = useSession();

  const { enqueueSnackbar } = useSnackbar();
  const { t, language } = useLanguage();
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

      enqueueSnackbar(t('fetch_error'), { variant: "error" });
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
    e.stopPropagation();
    e.preventDefault();
    if (!session) return;
    
    // Instant delete, no confirmation
    // if (!window.confirm(t('confirm_delete'))) return;
    
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
        enqueueSnackbar(t('delete_success'), { variant: "success" });
      } else {
        enqueueSnackbar(t('delete_error'), { variant: "error" });
      }
    } catch (error) {
      console.error('Delete fetch error:', error);
      enqueueSnackbar(t('system_error'), { variant: "error" });
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

  const userId = session?.user?.id || session?.user?._id;
  const stats = {
     found: items.filter(i => (i.user === userId || i.user?._id === userId) && i.status === 'found').length,
     lost: items.filter(i => (i.user === userId || i.user?._id === userId) && i.status === 'lost').length,
     returnedToMe: items.filter(i => {
       const isOwner = i.user === userId || i.user?._id === userId;
       const isMatched = i.matchedUser === userId || i.matchedUser?._id === userId;
       return ((isOwner && i.status === 'lost') || (isMatched && i.status === 'found')) && i.moderationStatus === 'returned';
     }).length,
     returnedByMe: items.filter(i => {
       const isOwner = i.user === userId || i.user?._id === userId;
       const isMatched = i.matchedUser === userId || i.matchedUser?._id === userId;
       return ((isOwner && i.status === 'found') || (isMatched && i.status === 'lost')) && i.moderationStatus === 'returned';
     }).length,
     inProcess: items.filter(i => i.matchedUser && i.moderationStatus !== 'returned').length
  };

  if (loading) {
     return (
        <div className="space-y-8 p-4">
           {/* Skeleton Header */}
           <div className="flex flex-col sm:flex-row justify-between items-end gap-6 animate-pulse">
              <div className="space-y-3 w-full sm:w-1/2">
                 <div className="h-10 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
                 <div className="h-4 w-1/2 bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
              </div>
              <div className="h-12 w-40 bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
           </div>
           
           {/* Skeleton Stats */}
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[1,2,3].map(i => <div key={i} className="h-32 bg-neutral-100 dark:bg-neutral-800 rounded-[2.5rem] animate-pulse" />)}
           </div>

           {/* Skeleton List */}
           <div className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-40 bg-neutral-100 dark:bg-neutral-800 rounded-[2.5rem] animate-pulse" />)}
           </div>
        </div>
     );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header with Stats */}
      <div className="space-y-6">
         {/* Title Section */}
         <div className="relative bg-neutral-900 dark:bg-white rounded-[3rem] p-8 lg:p-12 overflow-hidden shadow-2xl shadow-neutral-900/20 dark:shadow-none min-h-[200px] flex flex-col md:flex-row items-start md:items-end justify-between gap-8 group">
             {/* Animated Background */}
         <div className="absolute inset-0 overflow-hidden">
             {/* Blob 1 - Top Right - Mint - Large Spread */}
             <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-[#A9D3C9] to-[#8BC1B5] rounded-full blur-[120px] -translate-y-1/3 translate-x-1/4 animate-pulse duration-3000" />
             
             {/* Blob 2 - Bottom Left - Mint - Large Spread */}
             <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-gradient-to-tr from-[#A9D3C9] to-[#8BC1B5] rounded-full blur-[120px] translate-y-1/3 -translate-x-1/4 animate-pulse duration-5000" />
             
             {/* Subtle Texture Overlay */}
             <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
         </div>

             <div className="relative z-10 w-full md:w-auto">
               <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                 <h1 className="text-3xl lg:text-5xl font-black text-white dark:text-neutral-900 mb-3 uppercase tracking-tighter">{t('my_items_title')}</h1>
                 <p className="text-neutral-400 dark:text-neutral-500 font-medium max-w-md leading-relaxed text-sm lg:text-base">
                   {t('my_items_desc')}
                 </p>
               </motion.div>
             </div>

             <div className="relative z-10 w-full md:w-auto flex gap-3">
               <Link 
                 href="/desktop/add"
                 className="px-8 py-4 bg-mint text-neutral-900 font-black text-xs uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-mint/20 flex items-center justify-center gap-2 group/btn"
               >
                 <svg className="w-5 h-5 transition-transform group-hover/btn:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                 {t('new_item_btn')}
               </Link>
             </div>
         </div>

         {/* 5-Column Stats Grid */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {[
                { label: t('stats_found_mine'), val: stats.found, icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12v10H4V12"/><path d="M2 7h20v5H2z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>, color: "bg-mint/10 text-mint", style: "border-mint/30 shadow-[0_0_15px_-3px_rgba(169,211,201,0.3)] dark:shadow-[0_0_20px_-5px_rgba(169,211,201,0.4)]" },
                { label: t('stats_lost_mine'), val: stats.lost, icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>, color: "bg-red-500/10 text-red-500", style: "border-red-500/30 shadow-[0_0_15px_-3px_rgba(239,68,68,0.3)] dark:shadow-[0_0_20px_-5px_rgba(239,68,68,0.4)]" },
                { label: t('stats_returned_to_me'), val: stats.returnedToMe, icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>, color: "bg-blue-500/10 text-blue-500", style: "border-blue-500/30 shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)] dark:shadow-[0_0_20px_-5px_rgba(59,130,246,0.4)]" },
                { label: t('stats_returned_by_me'), val: stats.returnedByMe, icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>, color: "bg-amber-500/10 text-amber-500", style: "border-amber-500/30 shadow-[0_0_15px_-3px_rgba(245,158,11,0.3)] dark:shadow-[0_0_20px_-5px_rgba(245,158,11,0.4)]" },
                { label: t('stats_in_process'), val: stats.inProcess, icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, color: "bg-purple-500/10 text-purple-500", style: "border-purple-500/30 shadow-[0_0_15px_-3px_rgba(168,85,247,0.3)] dark:shadow-[0_0_20px_-5px_rgba(168,85,247,0.4)]" },
              ].map((s, i) => (
                <div key={i} className={`bg-white dark:bg-neutral-900 p-6 rounded-[2.5rem] border ${s.style} flex items-center gap-4 group hover:scale-[1.02] transition-transform`}>
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${s.color} shadow-lg shadow-current/20`}>
                      {s.icon}
                   </div>
                   <div>
                      <p className="text-[9px] font-black uppercase text-neutral-400 dark:text-neutral-500 tracking-widest mb-1">{s.label}</p>
                      <h3 className="text-3xl font-black text-neutral-900 dark:text-white leading-none">{s.val}</h3>
                   </div>
                </div>
             ))}
         </div>
      </div>

      {/* Filter Tabs - Sticky & Glassmorphism */}
      <div className="sticky top-20 lg:top-24 z-30 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl p-2 rounded-[2rem] border border-neutral-100 dark:border-neutral-800 shadow-xl shadow-neutral-200/20 dark:shadow-none flex overflow-x-auto no-scrollbar gap-2 transition-all">
        {[
          { id: 'all', lab: t('filter_all'), icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> },
          { id: 'found', lab: t('filter_found'), icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12v10H4V12"/><path d="M2 7h20v5H2z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg> },
          { id: 'lost', lab: t('filter_lost'), icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> },
          { id: 'returned', lab: t('filter_completed'), icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
              filter === t.id 
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-lg scale-105' 
              : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400'
            }`}
          >
            <span className="text-lg">{t.icon}</span>
            {t.lab}
          </button>
        ))}
      </div>

      {/* Items List */}
      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item, index) => (
            <motion.div
              layout
              key={item._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              className="group bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800 shadow-xl shadow-neutral-100/30 dark:shadow-none overflow-hidden flex flex-col lg:flex-row gap-0 lg:gap-8 transition-all hover:border-mint/30"
            >
              {/* Image Section */}
              <div className="w-full lg:w-72 h-48 lg:h-auto min-h-[14rem] relative overflow-hidden bg-neutral-900">
                {item.image?.url ? (
                  <img src={item.image.url} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl bg-neutral-100 dark:bg-neutral-800">📦</div>
                )}
                
                {/* Status Badges Overlay */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 items-start">
                   <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-lg ${item.status === 'lost' ? 'bg-red-500/90 text-white' : 'bg-mint/90 text-neutral-900'}`}>
                     {item.status === 'lost' ? t('filter_lost') : t('filter_found')}
                   </span>
                </div>
                
                {/* Type Overlay */}
                 <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight line-clamp-1 drop-shadow-md">{item.itemType}</h3>
                 </div>
              </div>

              {/* Content Section */}
              <div className="flex-1 p-6 lg:py-8 lg:pl-0 flex flex-col">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                   <span className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 border ${
                      item.moderationStatus === 'approved' 
                      ? 'bg-mint/10 border-mint/20 text-mint' 
                      : item.moderationStatus === 'pending' 
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' 
                      : 'bg-red-500/10 border-red-500/20 text-red-500'
                   }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        item.moderationStatus === 'approved' ? 'bg-mint' : item.moderationStatus === 'pending' ? 'bg-amber-500' : 'bg-red-500'
                      }`} />
                      {item.moderationStatus === 'approved' ? t('status_approved') : item.moderationStatus === 'pending' ? t('status_pending') : t('status_rejected')}
                   </span>
                   <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800" />
                   <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1">
                      🗓 {new Date(item.createdAt).toLocaleDateString()}
                   </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                   <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
                      <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-1">{t('label_location')}</p>
                      <p className="text-xs font-bold text-neutral-900 dark:text-white line-clamp-1">{item.location || `${item.region}, ${item.district}`}</p>
                   </div>
                   <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
                      <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-1">{t('label_description')}</p>
                      <p className="text-xs font-medium text-neutral-600 dark:text-neutral-300 line-clamp-1">{item.itemDescription || t('no_description_text')}</p>
                   </div>
                </div>

                <div className="mt-auto flex items-center justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  {item.moderationStatus !== 'returned' && (
                    <button 
                      onClick={(e) => handleDelete(e, item._id)}
                      disabled={deletingId === item._id}
                      className="p-4 rounded-2xl transition-all shadow-sm border border-transparent bg-red-50 dark:bg-red-900/10 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500/20 disabled:opacity-50"
                      title={t('btn_delete')}
                    >
                      {deletingId === item._id ? (
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      )}
                    </button>
                  )}
                  <Link
                    href={`/desktop/matches`}
                    className="p-4 bg-blue-50 dark:bg-blue-900/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-2xl transition-all shadow-sm border border-transparent hover:border-blue-500/20"
                    title={t('btn_matches')}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </Link>
                  <Link 
                    href={`/desktop/item/${item._id}`}
                    className="px-8 py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-black text-xs uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-neutral-900/20 dark:shadow-white/10"
                  >
                    {t('btn_view')}
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredItems.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-24 text-center bg-white dark:bg-neutral-900 rounded-[3rem] border border-dashed border-neutral-200 dark:border-neutral-800"
          >
             <div className="w-24 h-24 bg-neutral-50 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl grayscale opacity-30 shadow-inner">📂</div>
             <h3 className="text-xl font-black text-neutral-900 dark:text-white uppercase tracking-tight mb-2">{t('empty_my_items_title')}</h3>
             <p className="text-neutral-500 dark:text-neutral-500 font-medium max-w-xs mx-auto text-sm">
               {filter === 'all' ? t('empty_my_items_desc_all') : t('empty_my_items_desc_filter')}
             </p>
             {filter === 'all' && (
                <Link href="/desktop/add" className="mt-6 inline-block px-8 py-3 bg-mint text-neutral-900 font-black text-xs uppercase tracking-widest rounded-xl hover:scale-105 transition-transform">
                  {t('btn_add_first_item')}
                </Link>
             )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
