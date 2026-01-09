"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

// ... (existing imports and constants) ...

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [email, setEmail] = useState("");
  const [focusedField, setFocusedField] = useState(null);

  useEffect(() => {
    const verified = searchParams.get("verified");
    const emailParam = searchParams.get("email");
    if (verified === "true") {
      setSuccess("Email muvaffaqiyatli tasdiqlandi. Dasturga kirishingiz mumkin!");
    }
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    const formData = new FormData(e.currentTarget);
    const emailValue = formData.get("email");
    const password = formData.get("password");

    if (!emailValue || !password) {
      setError("Barcha maydonlarni to'ldiring");
      setLoading(false);
      return;
    }

    try {
      const result = await signIn("credentials", { redirect: false, email: emailValue, password });
      if (result.error) {
        if (result.error.includes("Email tasdiqlanmagan")) {
          router.push(`/verify?email=${encodeURIComponent(emailValue)}`);
          return;
        }
        throw new Error(result.error);
      }
      
      // Responsive Redirect
      if (window.innerWidth < 768) {
        router.push("/mobile");
      } else {
        router.push("/desktop");
      }
    } catch (err) {
      setError(err.message === "CredentialsSignin" ? "Login yoki parol noto'g'ri" : err.message);
      setLoading(false);
    }
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
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <span className="text-3xl font-black tracking-tighter text-[#2E2D2B]">QaytarMe</span>
         </motion.div>

         {/* Center Content */}
         <div className="relative z-10 space-y-10 my-auto">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <h1 className="text-7xl font-black leading-[1.05] tracking-tighter mb-6 text-[#2E2D2B]">
                Yo'qotilgan <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#81B9AC] to-[#A9D3C9.3]">buyumlar,</span> <br/>
                qaytarilgan quvonch.
              </h1>
              <p className="text-xl text-[#2E2D2B]/60 max-w-lg leading-relaxed font-medium">
                Zamonaviy qidiruv tizimi yordamida hayotingizni  osonlashtiring. Tez, qulay va xavfsiz.
              </p>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
               <InfiniteScroll items={foundItems} speed={40} />
            </motion.div>
         </div>

         {/* Footer Stats */}
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="relative z-10 grid grid-cols-2 gap-12 border-t border-[#2E2D2B]/10 pt-8 max-w-md">
            <div>
               <h3 className="text-3xl font-black text-[#2E2D2B]">24k+</h3>
               <p className="text-[#81B9AC] text-xs font-bold uppercase tracking-widest mt-1">Foydalanuvchilar</p>
            </div>
            <div>
               <h3 className="text-3xl font-black text-[#2E2D2B]">100%</h3>
               <p className="text-[#81B9AC] text-xs font-bold uppercase tracking-widest mt-1">Samaradorlik</p>
            </div>
         </motion.div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-[600px] bg-white/50 backdrop-blur-xl border-l border-[#A9D3C9]/20 flex flex-col justify-center px-6 py-8 sm:p-16 relative overflow-y-auto no-scrollbar shadow-[-20px_0_40px_rgb(0,0,0,0.02)]">
         <div className="max-w-[420px] mx-auto w-full">
            
            {/* Mobile Logo */}
            <div className="lg:hidden mb-10 flex flex-col items-center">
               <div className="w-16 h-16 bg-[#2E2D2B] rounded-2xl flex items-center justify-center text-[#F7F6E2] shadow-xl shadow-[#2E2D2B]/10 mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
               </div>
               <h2 className="text-2xl font-black text-[#2E2D2B]">QaytarMe</h2>
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
               <h2 className="text-lg font-bold text-[#A9D3C9] uppercase tracking-widest mb-2">Xush Kelibsiz</h2>
               <h1 className="text-4xl font-black text-[#2E2D2B] mb-2 tracking-tight">Tizimga Kiring</h1>
               <p className="text-[#2E2D2B]/50 font-medium mb-10">Davom etish uchun ma'lumotlaringizni kiriting.</p>
            </motion.div>

            <button 
               onClick={() => signIn("google", { callbackUrl: "/" })}
               className="w-full h-14 bg-white border border-[#2E2D2B]/5 rounded-xl flex items-center justify-center gap-3 text-[#2E2D2B] font-bold hover:bg-[#F7F6E2] hover:border-[#A9D3C9] transition-all active:scale-[0.98] mb-8 group shadow-sm hover:shadow-md"
            >
               <div className="group-hover:scale-110 transition-transform">{Icons.google}</div>
               <span>Google orqali kirish</span>
            </button>

            <div className="flex items-center gap-4 mb-8">
               <div className="h-px bg-[#2E2D2B]/10 flex-1" />
               <span className="text-[11px] font-bold text-[#2E2D2B]/40 uppercase tracking-widest">Yoki email orqali</span>
               <div className="h-px bg-[#2E2D2B]/10 flex-1" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
               <AnimatePresence>
                  {error && (
                     <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-red-50 text-red-500 text-xs font-bold px-4 py-3 rounded-xl border border-red-100 flex items-center gap-2 mb-4">
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {error}
                     </motion.div>
                  )}
                  {success && (
                     <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-green-50 text-green-600 text-xs font-bold px-4 py-3 rounded-xl border border-green-100 flex items-center gap-2 mb-4">
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {success}
                     </motion.div>
                  )}
               </AnimatePresence>

               <div className="space-y-2">
                  <label className="text-xs font-bold text-[#2E2D2B]/60 ml-1 uppercase tracking-wide">Email</label>
                  <div className={`h-14 bg-white border rounded-xl flex items-center px-4 transition-all duration-300 ${focusedField === 'email' ? 'border-[#A9D3C9] ring-4 ring-[#A9D3C9]/10' : 'border-[#2E2D2B]/10 hover:border-[#2E2D2B]/30'}`}>
                     <svg className={`w-5 h-5 mr-3 transition-colors ${focusedField === 'email' ? 'text-[#81B9AC]' : 'text-[#2E2D2B]/30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                     <input 
                        name="email" 
                        type="email" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="example@gmail.com"
                        className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-[#2E2D2B] placeholder:text-[#2E2D2B]/20 h-full"
                     />
                  </div>
               </div>

               <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                     <label className="text-xs font-bold text-[#2E2D2B]/60 uppercase tracking-wide">Parol</label>
                     <Link href="/forgot-password" className="text-xs font-bold text-[#81B9AC] hover:text-[#2E2D2B] transition-colors">Unutdingizmi?</Link>
                  </div>
                  <div className={`h-14 bg-white border rounded-xl flex items-center px-4 transition-all duration-300 ${focusedField === 'password' ? 'border-[#A9D3C9] ring-4 ring-[#A9D3C9]/10' : 'border-[#2E2D2B]/10 hover:border-[#2E2D2B]/30'}`}>
                     <svg className={`w-5 h-5 mr-3 transition-colors ${focusedField === 'password' ? 'text-[#81B9AC]' : 'text-[#2E2D2B]/30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                     <input 
                        name="password" 
                        type={showPassword ? "text" : "password"} 
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="••••••••"
                        className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-[#2E2D2B] placeholder:text-[#2E2D2B]/20 h-full"
                     />
                     <button type="button" onClick={() => setShowPassword(!showPassword)} className="p-2 text-[#2E2D2B]/30 hover:text-[#2E2D2B] transition-colors">
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
                  {loading ? "Kirilmoqda..." : "Kirish"}
               </button>
            </form>

            <p className="mt-10 text-center text-sm font-bold text-[#2E2D2B]/40">
               Hisobingiz yo'qmi? <Link href="/register" className="text-[#2E2D2B] hover:text-[#81B9AC] underline decoration-[#81B9AC] decoration-2 underline-offset-4 transition-colors">Ro'yxatdan o'ting</Link>
            </p>
         </div>
         
         <div className="absolute bottom-8 left-0 w-full text-center">
             <p className="text-[10px] text-[#2E2D2B]/30 font-mono">© 2024 QaytarMe Inc.</p>
         </div>
      </div>
    </div>
  );
}
