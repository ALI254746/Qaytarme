// app/admin/items/page.jsx
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { getApiUrl } from "@/lib/api-config";

export default function AdminItemsPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetchItems = async () => {
    if (!session?.user?.accessToken) return;
    setLoading(true);
    try {
      const res = await fetch(getApiUrl("admin/items"), {
        headers: { "Authorization": `Bearer ${session.user.accessToken}` }
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
    fetchItems();
  }, [session]);

  const handleModeration = async (id, status) => {
    if (!session?.user?.accessToken) return;
    try {
      const res = await fetch(getApiUrl("admin/items/moderation"), {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.user.accessToken}`
        },
        body: JSON.stringify({ id, moderationStatus: status }),
      });
      if (res.ok) {
        setItems(prev => prev.map(item => item._id === id ? { ...item, moderationStatus: status } : item));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Haqiqatan ham bu e'lonni o'chirmoqchimisiz?")) return;
    try {
      const res = await fetch(getApiUrl(`admin/items/${id}`), {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${session.user.accessToken}` }
      });
      if (res.ok) {
        setItems(prev => prev.filter(item => item._id !== id));
      } else {
        alert("O'chirishda xatolik yuz berdi");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesFilter = filter === "all" || item.moderationStatus === filter;
    const matchesSearch = item.itemType?.toLowerCase().includes(search.toLowerCase()) || 
                          item.user?.name?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8 transition-colors duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-xl font-black text-neutral-900 dark:text-white mb-4 transition-colors uppercase tracking-tight">E'lonlar boshqaruvi</h2>
          <div className="flex gap-2 bg-white dark:bg-neutral-900 p-1.5 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm">
            {[
              { id: 'all', label: 'Barchasi' },
              { id: 'pending', label: 'Kutilmoqda' },
              { id: 'approved', label: 'Tasdiqlangan' },
              { id: 'rejected', label: 'Rad etilgan' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  filter === f.id 
                    ? "bg-mint text-neutral-800 shadow-md" 
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="relative w-full md:w-64">
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buyum qidirish..." 
            className="w-full h-12 pl-12 pr-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl text-sm text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-mint/20 shadow-sm"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 text-xl">🔍</span>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-50 dark:border-neutral-800">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Buyum va Kategoriya</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Muallif</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Sana va Tur</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Moderatsiya</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800">
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-8 py-6"><div className="h-8 bg-neutral-100 dark:bg-neutral-800 rounded-xl w-full" /></td>
                  </tr>
                ))
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredItems.map((item) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={item._id} 
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 overflow-hidden shrink-0 border border-neutral-200 dark:border-neutral-700">
                              {item.image?.url ? (
                                 <img src={item.image.url} alt="item" className="w-full h-full object-cover" />
                              ) : (
                                 <div className="w-full h-full flex items-center justify-center text-xl text-neutral-300">
                                    {item.itemType === 'elektronika' ? '📱' : '📦'}
                                 </div>
                              )}
                           </div>
                           <div>
                             <p className="font-black text-neutral-900 dark:text-white text-sm mb-1">{item.itemType}</p>
                             <p className="text-[10px] font-bold text-mint uppercase tracking-widest">{item.region}</p>
                           </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-[10px] font-bold uppercase">{item.user?.name?.charAt(0)}</div>
                           <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">{item.user?.name || "Noma'lum"}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div>
                          <p className="text-[10px] font-bold text-neutral-500 mb-1">{new Date(item.createdAt).toLocaleDateString()}</p>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${item.status === 'lost' ? 'bg-red-50/50 text-red-500' : 'bg-mint/10 text-mint'}`}>
                            {item.status === 'lost' ? "Yo'qolgan" : "Topilgan"}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            item.moderationStatus === 'approved' ? 'bg-mint' : 
                            item.moderationStatus === 'pending' ? 'bg-amber-400' : 'bg-red-400'
                          }`} />
                          <span className="text-[10px] font-black uppercase tracking-tight text-neutral-600 dark:text-neutral-400">
                            {item.moderationStatus === 'approved' ? 'Tasdiqlangan' : 
                             item.moderationStatus === 'pending' ? 'Kutilmoqda' : 'Rad etilgan'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.moderationStatus !== 'approved' && (
                            <button 
                              onClick={() => handleModeration(item._id, 'approved')}
                              className="w-9 h-9 bg-mint/10 dark:bg-mint/20 text-neutral-800 dark:text-mint rounded-xl flex items-center justify-center hover:bg-mint hover:text-neutral-900 transition-all" 
                              title="Tasdiqlash"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </button>
                          )}
                          {item.moderationStatus !== 'rejected' && (
                            <button 
                              onClick={() => handleModeration(item._id, 'rejected')}
                              className="w-9 h-9 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all" 
                              title="Rad etish"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          )}
                          <button 
                            onClick={() => handleDelete(item._id)}
                            className="w-9 h-9 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all ml-2" 
                            title="Butunlay o'chirish"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
        
        {!loading && filteredItems.length === 0 && (
          <div className="py-20 text-center">
             <div className="w-20 h-20 bg-neutral-50 dark:bg-neutral-800/50 rounded-full flex items-center justify-center mx-auto mb-4 grayscale opacity-30">
               <span className="text-4xl">📦</span>
             </div>
             <p className="text-neutral-500 font-black uppercase tracking-widest text-[10px]">E'lonlar topilmadi</p>
          </div>
        )}
      </div>
    </div>
  );
}
