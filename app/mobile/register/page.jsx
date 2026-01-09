"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getApiUrl } from "@/lib/api-config";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function MobileRegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type"); 

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const translateError = (msg) => {
    if (!msg) return "Xatolik yuz berdi";
    if (msg.includes("Bad Request")) return "Ma'lumotlar noto'g'ri kiritildi";
    if (msg.includes("email must be")) return "Email noto'g'ri formatda";
    if (msg.includes("User already exists")) return "Bu email allaqachon ro'yxatdan o'tgan";
    if (msg.includes("Email yuborishda")) return "Emailga kod yuborishda xatolik (Tizimda nosozlik)";
    return msg;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!name || !email || !password) {
      setError("Iltimos, barcha maydonlarni to'ldiring");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(getApiUrl("auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/mobile/verify?email=${encodeURIComponent(email)}`);
      } else {
        if (data.unverified) {
            router.push(`/mobile/verify?email=${encodeURIComponent(email)}`);
            return;
        }
        const backendMsg = data.message || data.error || "Xatolik";
        throw new Error(translateError(backendMsg));
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (type === 'lost') return "Qidiruvni Boshlash";
    if (type === 'found') return "Qahramon Bo'lish";
    return "Yangi Hisob";
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
      
      <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[#0A0A0A]" /> {/* Deep dark background */}
          <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-mint/10 rounded-full blur-[100px] animate-pulse duration-[5000ms]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px]" />
          <div className="absolute inset-0 opacity-[0.2]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #262626 10px, #262626 11px)' }} />
      </div>

      <div className="relative z-10 flex-1 flex flex-col p-6">
         
         <div className="flex items-center justify-between mt-4 mb-8">
            <div className="flex items-center gap-4">
                <button onClick={() => router.back()} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white active:bg-white/10">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
            </div>
            
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-mint rounded-md flex items-center justify-center text-neutral-900 shadow-md">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <span className="font-black text-lg tracking-tighter text-white">QaytarMe</span>
            </div>
         </div>

         <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8"
         >
            <h1 className="text-5xl font-black mb-2 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-400">
               {getTitle()}
            </h1>
            <p className="text-neutral-400 font-medium max-w-[280px]">
               Atigi 30 soniyada ro'yxatdan o'ting va qidiruvni professional darajada boshlang.
            </p>
         </motion.div>

         <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex-1 flex flex-col"
         >
             <form onSubmit={handleSubmit} className="space-y-5">
                <AnimatePresence>
                   {error && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-red-500 text-xs font-bold border border-red-900/50 bg-red-900/10 p-4 rounded-xl">
                         {error}
                      </motion.div>
                   )}
                </AnimatePresence>

                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase tracking-widest text-mint ml-2">Ismingiz</label>
                   <input 
                      type="text" 
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="F.I.SH."
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl px-5 py-4 text-sm font-bold text-white placeholder:text-neutral-700 outline-none focus:border-mint focus:ring-1 focus:ring-mint transition-all"
                   />
                </div>

                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase tracking-widest text-mint ml-2">Email</label>
                   <input 
                      type="email" 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl px-5 py-4 text-sm font-bold text-white placeholder:text-neutral-700 outline-none focus:border-mint focus:ring-1 focus:ring-mint transition-all"
                   />
                </div>

                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase tracking-widest text-mint ml-2">Parol yaratish</label>
                   <div className="relative">
                       <input 
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl px-5 py-4 text-sm font-bold text-white placeholder:text-neutral-700 outline-none focus:border-mint focus:ring-1 focus:ring-mint transition-all"
                       />
                       <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-neutral-600">
                           {showPassword ? (
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                           ) : (
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                           )}
                       </button>
                   </div>
                </div>

                <div className="pt-4">
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-sm shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-mint/50 hover:bg-mint hover:scale-[1.02] transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        {loading ? "Hisob yaratilmoqda..." : "Tasdiqlash va Kirish"}
                    </button>
                </div>
             </form>

             <div className="mt-auto pt-8 text-center">
                 <p className="text-neutral-500 text-sm font-medium">
                    Hisobingiz bormi? <Link href="/mobile/login" className="text-white border-b border-mint pb-0.5 ml-1">Kiring</Link>
                 </p>
             </div>
         </motion.div>
      </div>
    </div>
  );
}
