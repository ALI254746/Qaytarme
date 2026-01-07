// app/register/page.jsx
"use client";

import React, { useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { getApiUrl } from "@/lib/api-config";

// --- BRAND COLORS (LIGHT & FRESH) ---
// Mint:      #A9D3C9 (Primary Accent)
// Ivory:     #F7F6E2 (Background)
// Obsidian:  #2E2D2B (Text/Dark Accents)

const FoundItemCard = ({ item }) => (
  <div className="flex-shrink-0 w-72 h-44 rounded-2xl overflow-hidden relative group cursor-pointer shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white border border-[#A9D3C9]/20">
    <div 
      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
      style={{ backgroundImage: `url(${item.image})` }}
    />
    <div className="absolute inset-0 bg-gradient-to-t from-[#2E2D2B]/80 via-transparent to-transparent" />
    <div className="absolute inset-0 p-5 flex flex-col justify-end">
      <div className="flex items-center gap-2 mb-2">
        <span className="px-2.5 py-1 rounded-md bg-[#A9D3C9] text-[10px] font-bold text-[#2E2D2B] uppercase tracking-wider backdrop-blur-md bg-opacity-90">
           Topildi
        </span>
        <span className="text-[#F7F6E2] text-[11px] font-bold tracking-wide shadow-black drop-shadow-sm">{item.time}</span>
      </div>
      <h4 className="text-white font-bold text-xl leading-tight truncate mb-0.5 drop-shadow-md">{item.name}</h4>
      <p className="text-[#F7F6E2]/80 text-xs font-medium truncate flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        {item.location}
      </p>
    </div>
  </div>
);

// Infinite Scroll Component
const InfiniteScroll = ({ items, direction = "left", speed = 50 }) => {
  const duplicatedItems = [...items, ...items];
  return (
    <div className="overflow-hidden py-6 masked-fade-sides">
      <motion.div
        className="flex gap-6"
        animate={{
          x: direction === "left" ? [0, -312 * items.length] : [-312 * items.length, 0],
        }}
        transition={{
          x: { duration: speed, repeat: Infinity, ease: "linear" },
        }}
        style={{ width: `${312 * duplicatedItems.length}px` }}
      >
        {duplicatedItems.map((item, i) => (
          <FoundItemCard key={i} item={item} />
        ))}
      </motion.div>
      <style jsx>{`
        .masked-fade-sides {
          mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
        }
      `}</style>
    </div>
  );
};

// SVG Icons
const Icons = {
  eye: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  eyeOff: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>,
  google: (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
};

const foundItems = [
  { name: "MacBook Pro", location: "Farg'ona", time: "5 kun", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop" },
  { name: "Canon Kamera", location: "Namangan", time: "1 hafta", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop" },
  { name: "Apple Watch", location: "Andijon", time: "4 kun", image: "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400&h=300&fit=crop" },
  { name: "iPhone 14 Pro", location: "Toshkent", time: "2 kun", image: "https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=400&h=300&fit=crop" },
  { name: "Gucci Sumka", location: "Samarqand", time: "1 kun", image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=300&fit=crop" },
];

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type"); // lost | found

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [focusedField, setFocusedField] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!name || !email || !password) {
      setError("Barcha maydonlarni to'ldiring");
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
        router.push(`/verify?email=${encodeURIComponent(email)}`);
      } else {
        if (data.unverified) {
          router.push(`/verify?email=${encodeURIComponent(email)}`);
          return;
        }
        throw new Error(data.error || "Ro'yxatdan o'tishda xatolik yuz berdi");
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (type === 'lost') return "Yo'qolgan buyumni topamiz!";
    if (type === 'found') return "Qahramon bo'lishga tayyormisiz?";
    return "Ro'yxatdan O'tish";
  };

  const getSubtitle = () => {
    if (type === 'lost') return "Qidiruvni boshlash uchun hisob oching.";
    if (type === 'found') return "Buyumni egasiga qaytarish uchun kiring.";
    return "Boshlash uchun ma'lumotlaringizni kiriting.";
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-[#F7F6E2] flex overflow-hidden font-sans selection:bg-[#A9D3C9] selection:text-[#2E2D2B]">
      
      {/* Left Side - Visual Showcase */}
      <div className="hidden lg:flex flex-1 relative bg-[#F7F6E2] overflow-hidden flex-col justify-between p-12 xl:p-20">
         {/* Premium Soft Background Blobs */}
         <div className="absolute top-[-20%] right-[-10%] w-[900px] h-[900px] bg-[#A9D3C9]/40 rounded-full blur-[140px] animate-pulse duration-[8000ms]" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[700px] h-[700px] bg-white/60 rounded-full blur-[120px]" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 mix-blend-soft-light"></div>

         {/* Header */}
         <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 flex items-center gap-3">
            <div className="w-12 h-12 bg-[#2E2D2B] rounded-2xl flex items-center justify-center text-[#F7F6E2] shadow-xl shadow-[#2E2D2B]/10">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </div>
            <span className="text-3xl font-black tracking-tighter text-[#2E2D2B]">QaytarMe</span>
         </motion.div>

         {/* Center Content */}
         <div className="relative z-10 space-y-10 my-auto">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <h1 className="text-7xl font-black leading-[1.05] tracking-tighter mb-6 text-[#2E2D2B]">
                Qo'shiling <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#81B9AC] to-[#A9D3C9.3]">bugunoq,</span> <br/>
                toping ertaga.
              </h1>
              <p className="text-xl text-[#2E2D2B]/60 max-w-lg leading-relaxed font-medium">
                Minglab insonlar bir-birlariga yordam bermoqda. Siz ham safimizga qo'shiling!
              </p>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
               <InfiniteScroll items={foundItems} direction="right" speed={40} />
            </motion.div>
         </div>

         {/* Footer Stats */}
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="relative z-10 grid grid-cols-2 gap-12 border-t border-[#2E2D2B]/10 pt-8 max-w-md">
            <div>
               <h3 className="text-3xl font-black text-[#2E2D2B]">50k+</h3>
               <p className="text-[#81B9AC] text-xs font-bold uppercase tracking-widest mt-1">Foydalanuvchilar</p>
            </div>
            <div>
               <h3 className="text-3xl font-black text-[#2E2D2B]">24/7</h3>
               <p className="text-[#81B9AC] text-xs font-bold uppercase tracking-widest mt-1">Qo'llab-quvvatlash</p>
            </div>
         </motion.div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-full lg:w-[600px] bg-white/50 backdrop-blur-xl border-l border-[#A9D3C9]/20 flex flex-col justify-center px-6 py-8 sm:p-16 relative overflow-y-auto no-scrollbar shadow-[-20px_0_40px_rgb(0,0,0,0.02)]">
         <div className="max-w-[420px] mx-auto w-full">
            
            {/* Mobile Logo */}
            <div className="lg:hidden mb-10 flex flex-col items-center">
               <div className="w-16 h-16 bg-[#2E2D2B] rounded-2xl flex items-center justify-center text-[#F7F6E2] shadow-xl shadow-[#2E2D2B]/10 mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
               </div>
               <h2 className="text-2xl font-black text-[#2E2D2B]">QaytarMe</h2>
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
               <h2 className="text-lg font-bold text-[#A9D3C9] uppercase tracking-widest mb-2">Yangi Profil</h2>
               <h1 className="text-4xl font-black text-[#2E2D2B] mb-2 tracking-tight">{getTitle()}</h1>
               <p className="text-[#2E2D2B]/50 font-medium mb-10">{getSubtitle()}</p>
            </motion.div>

            <button 
              onClick={() => signIn("google", { callbackUrl: "/" })}
               className="w-full h-14 bg-white border border-[#2E2D2B]/5 rounded-xl flex items-center justify-center gap-3 text-[#2E2D2B] font-bold hover:bg-[#F7F6E2] hover:border-[#A9D3C9] transition-all active:scale-[0.98] mb-8 group shadow-sm hover:shadow-md"
            >
               <div className="group-hover:scale-110 transition-transform">{Icons.google}</div>
               <span>Google orqali ro'yxatdan o'tish</span>
            </button>

            <div className="flex items-center gap-4 mb-8">
               <div className="h-px bg-[#2E2D2B]/10 flex-1" />
               <span className="text-[11px] font-bold text-[#2E2D2B]/40 uppercase tracking-widest">Yoki email orqali</span>
               <div className="h-px bg-[#2E2D2B]/10 flex-1" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
               <AnimatePresence>
                  {error && (
                     <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-red-50 text-red-500 text-xs font-bold px-4 py-3 rounded-xl border border-red-100 flex items-center gap-2">
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {error}
                     </motion.div>
                  )}
               </AnimatePresence>

               {/* Name Field */}
               <div className="space-y-2">
                  <label className="text-xs font-bold text-[#2E2D2B]/60 ml-1 uppercase tracking-wide">Ism</label>
                  <div className={`h-14 bg-white border rounded-xl flex items-center px-4 transition-all duration-300 ${focusedField === 'name' ? 'border-[#A9D3C9] ring-4 ring-[#A9D3C9]/10' : 'border-[#2E2D2B]/10 hover:border-[#2E2D2B]/30'}`}>
                     <svg className={`w-5 h-5 mr-3 transition-colors ${focusedField === 'name' ? 'text-[#81B9AC]' : 'text-[#2E2D2B]/30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                     <input 
                        type="text" 
                        value={name}
                        onChange={e => setName(e.target.value)}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Aziz Rahimov"
                        className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-[#2E2D2B] placeholder:text-[#2E2D2B]/20 h-full"
                     />
                  </div>
               </div>

               {/* Email Field */}
               <div className="space-y-2">
                  <label className="text-xs font-bold text-[#2E2D2B]/60 ml-1 uppercase tracking-wide">Email</label>
                  <div className={`h-14 bg-white border rounded-xl flex items-center px-4 transition-all duration-300 ${focusedField === 'email' ? 'border-[#A9D3C9] ring-4 ring-[#A9D3C9]/10' : 'border-[#2E2D2B]/10 hover:border-[#2E2D2B]/30'}`}>
                     <svg className={`w-5 h-5 mr-3 transition-colors ${focusedField === 'email' ? 'text-[#81B9AC]' : 'text-[#2E2D2B]/30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                     <input 
                        type="email" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="example@mail.com"
                        className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-[#2E2D2B] placeholder:text-[#2E2D2B]/20 h-full"
                     />
                  </div>
               </div>

               {/* Password Field */}
               <div className="space-y-2">
                  <label className="text-xs font-bold text-[#2E2D2B]/60 uppercase tracking-wide">Parol</label>
                  <div className={`h-14 bg-white border rounded-xl flex items-center px-4 transition-all duration-300 ${focusedField === 'password' ? 'border-[#A9D3C9] ring-4 ring-[#A9D3C9]/10' : 'border-[#2E2D2B]/10 hover:border-[#2E2D2B]/30'}`}>
                     <svg className={`w-5 h-5 mr-3 transition-colors ${focusedField === 'password' ? 'text-[#81B9AC]' : 'text-[#2E2D2B]/30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                     <input 
                        type={showPassword ? "text" : "password"} 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="••••••••"
                        className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-[#2E2D2B] placeholder:text-[#2E2D2B]/20 h-full"
                     />
                     <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[#2E2D2B]/30 hover:text-[#2E2D2B] transition-colors">
                        {showPassword ? Icons.eyeOff : Icons.eye}
                     </button>
                  </div>
               </div>

               <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-14 bg-[#2E2D2B] text-[#F7F6E2] font-black uppercase tracking-widest rounded-xl hover:bg-[#81B9AC] hover:text-white hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:scale-100 flex items-center justify-center gap-2 mt-4 shadow-xl shadow-[#2E2D2B]/10 hover:shadow-2xl hover:shadow-[#81B9AC]/30"
               >
                  {loading && <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                  {loading ? "Hisob yaratilmoqda..." : "Yaratish"}
               </button>
            </form>

            <p className="mt-10 text-center text-sm font-bold text-[#2E2D2B]/40">
               Hisobingiz bormi? <Link href="/login" className="text-[#2E2D2B] hover:text-[#81B9AC] underline decoration-[#81B9AC] decoration-2 underline-offset-4 transition-colors">Kirish</Link>
            </p>
         </div>
         
         <div className="absolute bottom-8 left-0 w-full text-center">
             <p className="text-[10px] text-[#2E2D2B]/30 font-mono">© 2024 QaytarMe Inc.</p>
         </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F7F6E2] flex items-center justify-center">Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
