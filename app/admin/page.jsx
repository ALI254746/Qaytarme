"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { getApiUrl } from "@/lib/api-config";

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [statsData, setStatsData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.accessToken) return;

      try {
        const [statsRes, activityRes] = await Promise.all([
          fetch(getApiUrl("admin/stats"), {
            headers: { "Authorization": `Bearer ${session.user.accessToken}` }
          }),
          fetch(getApiUrl("admin/recent-activity"), {
            headers: { "Authorization": `Bearer ${session.user.accessToken}` }
          })
        ]);

        if (statsRes.ok && activityRes.ok) {
          const stats = await statsRes.json();
          const activity = await activityRes.json();
          
          setStatsData([
            { name: "Jami e'lonlar", value: stats.totalAriza, icon: "📦", color: "bg-mint dark:bg-mint/90" },
            { name: "Faol foydalanuvchilar", value: stats.activeUsers, icon: "👥", color: "bg-white dark:bg-neutral-900" },
            { name: "Topilgan buyumlar", value: stats.foundItems, icon: "✅", color: "bg-mint dark:bg-mint/90" },
            { name: "Yangi xabarlar", value: stats.newMessages, icon: "💬", color: "bg-white dark:bg-neutral-900" },
          ]);
          setRecentActivity(activity);
        }
      } catch (error) {
        console.error("Admin data fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session]);

  const handleDeleteItem = async (id) => {
    if (!confirm("Haqiqatan ham bu e'lonni o'chirmoqchimisiz?")) return;
    try {
      const res = await fetch(getApiUrl(`admin/items/${id}`), {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${session.user.accessToken}` }
      });
      if (res.ok) {
        setRecentActivity(prev => prev.filter(item => item.id !== id));
      } else {
        alert("O'chirishda xatolik yuz berdi");
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  if (loading) {
    return <div className="p-20 text-center animate-pulse text-neutral-400">Admin panel yuklanmoqda...</div>;
  }

  return (
    <div className="space-y-10 transition-colors duration-300">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`${stat.color} rounded-[2.5rem] p-8 shadow-xl shadow-neutral-200/50 dark:shadow-none border border-neutral-100 dark:border-neutral-800 flex flex-col items-start transition-colors duration-300`}
          >
            <div className="w-12 h-12 rounded-2xl bg-neutral-900/5 dark:bg-white/5 flex items-center justify-center text-2xl mb-6">
              {stat.icon}
            </div>
            <h3 className="text-4xl font-black text-neutral-900 dark:text-white mb-1">{stat.value}</h3>
            <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">{stat.name}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity Table */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-[2.5rem] p-8 lg:p-10 border border-neutral-100 dark:border-neutral-800 shadow-xl shadow-neutral-100/50 dark:shadow-none transition-colors duration-300"
        >
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-xl font-black text-neutral-900 dark:text-white">Oxirgi faollik</h3>
            <button className="text-xs font-black text-mint uppercase tracking-widest hover:underline">Barchasini ko'rish</button>
          </div>
          
          {/* Scrollable Container */}
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {recentActivity.length === 0 ? (
              <p className="p-10 text-center text-neutral-400">Hozircha faollik yo'q</p>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4 p-4 hover:bg-neutral-50 dark:hover:bg-white/5 rounded-3xl transition-all group">
                  <div className="w-12 h-12 bg-mint/10 dark:bg-mint/20 rounded-2xl flex items-center justify-center font-black text-neutral-800 dark:text-mint overflow-hidden shrink-0">
                    {activity.image ? (
                        <img src={activity.image} alt="item" className="w-full h-full object-cover" />
                    ) : (
                        activity.user.charAt(0)
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-black text-neutral-900 dark:text-white text-sm">{activity.user}</span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">{activity.action}</span>
                      {activity.item && (
                        <span className="text-xs font-bold text-mint uppercase tracking-tighter">[{activity.item}]</span>
                      )}
                    </div>
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase mt-1">{activity.time}</p>
                  </div>
                  <button 
                    onClick={() => handleDeleteItem(activity.id)}
                    className="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400 hover:text-red-500 dark:hover:text-red-400"
                    title="O'chirish"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Quick Actions / System Status */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-neutral-900 dark:bg-black rounded-[2.5rem] p-8 lg:p-10 text-white shadow-2xl shadow-mint/10 border border-white/5 transition-colors duration-300"
        >
          <h3 className="text-xl font-black mb-10 tracking-tight">Tizim holati</h3>
          
          <div className="space-y-8">
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Server yuklanishi</p>
                <p className="font-black text-mint">12%</p>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-[12%] bg-mint" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Ma'lumotlar bazasi</p>
                <p className="font-black text-mint">Sog'lom</p>
              </div>
              <div className="flex gap-2">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="h-1 flex-1 bg-mint/40 rounded-full" />
                ))}
              </div>
            </div>

            <div className="pt-8 border-t border-white/10">
               <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-6">Tezkor amallar</h4>
               <div className="grid grid-cols-2 gap-4">
                  <button className="p-4 bg-white/5 hover:bg-mint hover:text-neutral-900 rounded-2xl transition-all flex flex-col items-center gap-2 border border-white/5">
                     <span className="text-xl">📧</span>
                     <span className="text-[10px] font-black uppercase tracking-widest">Xabar</span>
                  </button>
                  <button className="p-4 bg-white/5 hover:bg-mint hover:text-neutral-900 rounded-2xl transition-all flex flex-col items-center gap-2 border border-white/5">
                     <span className="text-xl">🛠️</span>
                     <span className="text-[10px] font-black uppercase tracking-widest">Sozlash</span>
                  </button>
               </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
