"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { getApiUrl } from "@/lib/api-config";

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchUsers = async () => {
    if (!session?.user?.accessToken) return;
    setLoading(true);
    try {
      const res = await fetch(getApiUrl("admin/users"), {
        headers: { "Authorization": `Bearer ${session.user.accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Fetch users error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [session]);

  const handleDeleteUser = async (id) => {
    if (!confirm("Haqiqatan ham ushbu foydalanuvchini o'chirmoqchimisiz? Barcha uning e'lonlari ham o'chiriladi.")) return;
    
    try {
      const res = await fetch(getApiUrl(`admin/users/${id}`), {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${session.user.accessToken}` }
      });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u._id !== id));
      }
    } catch (error) {
      console.error("Delete user error:", error);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(search.toLowerCase()) || 
    user.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading && users.length === 0) {
    return <div className="p-20 text-center animate-pulse text-neutral-400">Foydalanuvchilar yuklanmoqda...</div>;
  }

  return (
    <div className="space-y-8 transition-colors duration-300">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-xl font-black text-neutral-900 dark:text-white mb-2 transition-colors">Foydalanuvchilar boshqaruvi</h2>
          <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Jami: {users.length} ta foydalanuvchi</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ism yoki email orqali qidirish..." 
            className="w-full h-12 pl-12 pr-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-[1.2rem] text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-mint/20 outline-none shadow-sm transition-colors"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 text-xl">🔍</span>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredUsers.map((user, index) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
              key={user._id}
              className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-8 border border-neutral-100 dark:border-neutral-800 shadow-xl shadow-neutral-100/50 dark:shadow-none relative overflow-hidden group transition-colors duration-300"
            >
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-16 h-16 bg-mint/10 dark:bg-mint/20 rounded-2xl flex items-center justify-center text-2xl font-black text-neutral-800 dark:text-mint transition-colors overflow-hidden">
                   {user.avatar ? (
                     <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                   ) : user.name?.charAt(0)}
                 </div>
                 <div>
                    <h4 className="font-black text-neutral-900 dark:text-white tracking-tight transition-colors">{user.name}</h4>
                    <p className="text-xs font-bold text-neutral-400 dark:text-neutral-500">{user.email}</p>
                 </div>
                 {user.role === 'admin' && (
                   <div className="absolute top-8 right-8 px-2 py-1 bg-neutral-900 dark:bg-mint text-white dark:text-neutral-900 text-[8px] font-black uppercase tracking-widest rounded transition-colors">
                     Admin
                   </div>
                 )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                 <div className="bg-neutral-50 dark:bg-black/20 p-4 rounded-2xl border border-neutral-100 dark:border-white/5 transition-colors">
                    <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1">E'lonlar</p>
                    <p className="text-xl font-black text-neutral-900 dark:text-white">{user.items}</p>
                 </div>
                 <div className="bg-neutral-50 dark:bg-black/20 p-4 rounded-2xl border border-neutral-100 dark:border-white/5 transition-colors">
                    <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1">Ballar</p>
                    <p className="text-xl font-black text-mint">{user.points || 0}</p>
                 </div>
              </div>

              <div className="flex items-center justify-between">
                 <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest transition-colors">Qo'shildi: {user.joined}</p>
                 <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleDeleteUser(user._id)}
                      className="w-10 h-10 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-900 dark:hover:bg-white hover:text-white dark:hover:text-black rounded-xl flex items-center justify-center transition-all border border-neutral-100 dark:border-neutral-700 shadow-sm"
                    >
                       🗑️
                    </button>
                    <button className="w-10 h-10 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-900 dark:hover:bg-white hover:text-white dark:hover:text-black rounded-xl flex items-center justify-center transition-all border border-neutral-100 dark:border-neutral-700 shadow-sm">
                       🛡️
                    </button>
                 </div>
              </div>
              
              {/* Decorative side bar */}
              <div className="absolute top-0 left-0 w-1.5 h-full bg-mint opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredUsers.length === 0 && !loading && (
        <div className="py-20 text-center bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800 transition-colors duration-300">
           <div className="w-20 h-20 bg-neutral-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
             <span className="text-4xl opacity-20">👥</span>
           </div>
           <p className="text-neutral-500 dark:text-neutral-500 font-bold uppercase tracking-widest text-xs">Foydalanuvchilar topilmadi</p>
        </div>
      )}
    </div>
  );
}
