"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

export default function AdminSettingsPage() {
  const [siteStatus, setSiteStatus] = useState(true);
  const [newRegistrations, setNewRegistrations] = useState(true);

  return (
    <div className="w-full h-full p-4 lg:p-8 overflow-y-auto no-scrollbar">
      <div className="mb-12">
        <h2 className="text-4xl font-black text-neutral-900 dark:text-white mb-2 tracking-tighter">Tizim sozlamalari</h2>
        <p className="text-lg text-neutral-500 font-medium">Platformaning global parametrlarini boshqaring</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 max-w-[1600px]">
        {/* General Settings */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-10 border border-neutral-100 dark:border-neutral-800 shadow-xl"
        >
          <div className="flex items-center gap-4 mb-8">
             <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-2xl text-blue-600 dark:text-blue-400">
                ⚙️
             </div>
             <h3 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">Umumiy sozlamalar</h3>
          </div>
          
          <div className="space-y-6">
             <div className="flex items-center justify-between p-6 bg-neutral-50 dark:bg-black/20 rounded-3xl border border-neutral-100 dark:border-white/5 transition-colors group hover:border-blue-200 dark:hover:border-blue-900/50">
                <div>
                   <h4 className="text-lg font-black text-neutral-900 dark:text-white mb-1">Platforma holati</h4>
                   <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Saytni vaqtinchalik yopish (Texnik ishlar)</p>
                </div>
                <button 
                  onClick={() => setSiteStatus(!siteStatus)}
                  className={`w-16 h-9 rounded-full transition-all relative ${siteStatus ? 'bg-mint' : 'bg-neutral-300 dark:bg-neutral-700'}`}
                >
                   <motion.div 
                     layout
                     animate={{ x: siteStatus ? 30 : 4 }}
                     className="absolute top-1.5 w-6 h-6 bg-white rounded-full shadow-md"
                   />
                </button>
             </div>

             <div className="flex items-center justify-between p-6 bg-neutral-50 dark:bg-black/20 rounded-3xl border border-neutral-100 dark:border-white/5 transition-colors group hover:border-blue-200 dark:hover:border-blue-900/50">
                <div>
                   <h4 className="text-lg font-black text-neutral-900 dark:text-white mb-1">Yangi ro'yxatdan o'tish</h4>
                   <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Yangi foydalanuvchilar qo'shilishini to'xtatish</p>
                </div>
                <button 
                  onClick={() => setNewRegistrations(!newRegistrations)}
                  className={`w-16 h-9 rounded-full transition-all relative ${newRegistrations ? 'bg-mint' : 'bg-neutral-300 dark:bg-neutral-700'}`}
                >
                   <motion.div 
                     layout
                     animate={{ x: newRegistrations ? 30 : 4 }}
                     className="absolute top-1.5 w-6 h-6 bg-white rounded-full shadow-md"
                   />
                </button>
             </div>
          </div>
        </motion.div>

        {/* Branding Settings */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-10 border border-neutral-100 dark:border-neutral-800 shadow-xl"
        >
          <div className="flex items-center gap-4 mb-8">
             <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-2xl text-purple-600 dark:text-purple-400">
                🎨
             </div>
             <h3 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">Brending va Tizim</h3>
          </div>

          <div className="grid grid-cols-1 gap-8">
             <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 ml-1">Platforma nomi</label>
                <div className="relative group">
                   <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-neutral-400">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                   </div>
                   <input type="text" defaultValue="QaytarMe" className="w-full h-16 pl-14 pr-6 bg-neutral-50 dark:bg-black/20 border border-neutral-100 dark:border-white/5 rounded-2xl text-lg font-bold text-neutral-900 dark:text-white focus:ring-4 focus:ring-mint/10 focus:border-mint outline-none transition-all" />
                </div>
             </div>
             <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 ml-1">Admin Email</label>
                <div className="relative group">
                   <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-neutral-400">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                   </div>
                   <input type="email" defaultValue="admin@qaytarme.uz" className="w-full h-16 pl-14 pr-6 bg-neutral-50 dark:bg-black/20 border border-neutral-100 dark:border-white/5 rounded-2xl text-lg font-bold text-neutral-900 dark:text-white focus:ring-4 focus:ring-mint/10 focus:border-mint outline-none transition-all" />
                </div>
             </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-neutral-100 dark:border-white/5 flex justify-end">
             <button className="px-8 py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-black uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-neutral-900/20 flex items-center gap-3">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
               O'zgarishlarni saqlash
             </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
