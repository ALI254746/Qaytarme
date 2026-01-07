"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { getApiUrl } from "@/lib/api-config";

export default function AdminStatsPage() {
  const { data: session } = useSession();
  const [categories, setCategories] = useState([]);
  const [growthData, setGrowthData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.accessToken) return;
      try {
        const res = await fetch(getApiUrl("admin/detailed-stats"), {
          headers: { "Authorization": `Bearer ${session.user.accessToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories);
          setGrowthData(data.monthlyGrowth);
        }
      } catch (error) {
        console.error("Stats fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [session]);

  if (loading) {
    return <div className="p-20 text-center animate-pulse text-neutral-400">Statistika yuklanmoqda...</div>;
  }
  return (
    <div className="space-y-10 transition-colors duration-300">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-black text-neutral-900 dark:text-white mb-2 transition-colors">Tizim statistikasi</h2>
          <p className="text-xs text-neutral-500 font-black uppercase tracking-widest italic">Oxirgi 30 kunlik ma'lumotlar</p>
        </div>
        <button className="px-6 py-3 bg-neutral-900 dark:bg-mint text-white dark:text-neutral-900 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-neutral-800 dark:hover:bg-white transition-all shadow-lg active:scale-95">Hisobotni yuklash (.PDF)</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Breakdown */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-10 border border-neutral-100 dark:border-neutral-800 shadow-xl shadow-neutral-100/50 dark:shadow-none transition-colors duration-300"
        >
          <h3 className="text-lg font-black text-neutral-900 dark:text-white mb-8 flex items-center gap-3 transition-colors">
             <span className="w-1.5 h-6 bg-mint rounded-full" />
             Kategoriyalar bo'yicha
          </h3>
          <div className="space-y-6">
            {categories.map((cat, index) => (
              <div key={cat.name} className="space-y-2">
                 <div className="flex justify-between items-end">
                    <p className="text-sm font-black text-neutral-700 dark:text-neutral-300 transition-colors">{cat.name}</p>
                    <div className="flex items-center gap-3">
                       <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500 transition-colors">{cat.count} ta</span>
                       <span className={`text-[10px] font-black ${cat.growth.startsWith('+') ? 'text-mint' : 'text-neutral-300 dark:text-neutral-600'}`}>{cat.growth}</span>
                    </div>
                 </div>
                 <div className="h-2 w-full bg-neutral-50 dark:bg-black/40 rounded-full overflow-hidden transition-colors">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(cat.count / (Math.max(...categories.map(c => c.count)) || 1)) * 100}%` }}
                      transition={{ delay: 0.5 + (index * 0.1), duration: 1 }}
                      className={`h-full ${cat.color === 'bg-mint' ? 'bg-mint' : 'bg-neutral-900 dark:bg-white'}`} 
                    />
                 </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Growth Chart Placeholder */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-neutral-900 dark:bg-black rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden transition-colors duration-300 border border-white/5"
        >
          <div className="relative z-10 flex flex-col h-full">
            <h3 className="text-lg font-black mb-2 tracking-tight">Foydalanuvchilar o'sishi</h3>
            <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest mb-10">Oylik o'sish dinamikasi</p>
            
            <div className="flex-1 flex items-end justify-between gap-4 mt-10">
               {growthData.map((d, i) => {
                 const maxCount = Math.max(...growthData.map(g => g.count)) || 1;
                 const height = (d.count / maxCount) * 100;
                 return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                     <p className="text-[10px] font-black text-mint opacity-0 group-hover:opacity-100 transition-opacity">{d.count}</p>
                     <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ delay: 0.8 + (i * 0.05), duration: 1 }}
                        className="w-full bg-mint/20 hover:bg-mint rounded-t-xl transition-all cursor-pointer"
                     />
                  </div>
                 )
               })}
            </div>
            
            <div className="flex justify-between mt-6 border-t border-white/5 pt-6">
               {growthData.map(d => (
                 <span key={d.month} className="text-[10px] font-black text-neutral-600 dark:text-neutral-700 uppercase">{d.month}</span>
               ))}
            </div>
          </div>
          
          {/* Background pattern */}
          <div className="absolute top-0 right-0 p-10 opacity-10 text-mint">
             <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 14.5s2 3 5 3 5-3 5-3V3s-2 3-5 3-5-3-5-3v11.5zm-2 0s-2 3-5 3-5-3-5-3V3s2 3 5 3 5-3 5-3v11.5z" />
             </svg>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
