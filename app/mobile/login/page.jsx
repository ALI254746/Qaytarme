"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function MobileLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState("");
  const [focusedField, setFocusedField] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const emailValue = formData.get("email");
    const password = formData.get("password");

    if (!emailValue || !password) {
      setError("Iltimos, email va parolni kiriting");
      setLoading(false);
      return;
    }

    try {
      const result = await signIn("credentials", { redirect: false, email: emailValue, password });
      
      if (result?.error) {
        if (result.error.includes("Email tasdiqlanmagan") || result.error.includes("unverified")) {
          setError("Email tasdiqlanmagan. Iltimos, kodingizni tekshiring.");
          // Optionally redirect after a delay
          setTimeout(() => {
              router.push(`/mobile/verify?email=${encodeURIComponent(emailValue)}`);
          }, 2000);
          return;
        }
        throw new Error(result.error);
      }

      router.push("/mobile");
    } catch (err) {
      // Use more descriptive error messages for the user
      if (err.message === "CredentialsSignin") {
        setError("Noto'g'ri parol yoki email. Avval ro'yxatdan o'tganmisiz?");
      } else {
        setError(err.message || "Tizimga kirishda xatolik yuz berdi");
      }
      setLoading(false);
    }
  };

  const Icons = {
    eye: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
    eyeOff: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>,
    google: (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#000" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#000" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#000" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#000" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      )
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col relative overflow-hidden">
      
      {/* --- Dynamic Background --- */}
      <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 opacity-[0.05]" 
               style={{ 
                   backgroundImage: `linear-gradient(#A9D3C9 1px, transparent 1px), linear-gradient(90deg, #A9D3C9 1px, transparent 1px)`, 
                   backgroundSize: '40px 40px' 
               }} 
          />
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-mint/10 to-transparent animate-spin-slow rounded-full opacity-30 blur-3xl" />
              <div className="absolute inset-0 border border-mint/20 rounded-full animate-ping opacity-20 duration-[3000ms]" />
              <div className="absolute inset-[200px] border border-mint/10 rounded-full animate-ping opacity-10 duration-[4000ms] delay-700" />
          </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-end p-6 pb-10">
         
         <div className="absolute top-8 left-6 flex items-center gap-2">
            <div className="w-8 h-8 bg-mint rounded-lg flex items-center justify-center text-neutral-900 shadow-lg shadow-mint/20">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <span className="font-black text-xl tracking-tighter text-white">QaytarMe</span>
         </div>
         
         <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
         >
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-neutral-900 shadow-2xl shadow-mint/20 mb-6 relative overflow-hidden">
               <div className="absolute inset-0 bg-mint/20 animate-pulse" />
               <svg className="w-7 h-7 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            
            <h1 className="text-5xl font-black mb-3 tracking-tighter leading-[0.9]">
               Topish — <br/> 
               <span className="text-mint">san'at darajasida.</span>
            </h1>
            <p className="text-gray-400 max-w-[250px] font-medium text-sm leading-relaxed">
               Eng kuchli AI qidiruv tizimi yordamida yo'qolgan narsalaringizni professional tarzda qaytaring.
            </p>
         </motion.div>

         <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="space-y-4 backdrop-blur-md bg-white/5 border border-white/10 p-1 rounded-3xl"
         >
             <div className="bg-neutral-900/80 rounded-[1.2rem] p-5 border border-white/5 space-y-4">
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <AnimatePresence>
                        {error && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-red-400 text-xs font-bold bg-red-900/20 p-3 rounded-lg flex items-center gap-2">
                                <span>⚠️</span> {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="space-y-4">
                        <div className="group relative">
                            <input 
                                type="email" 
                                name="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField(null)}
                                placeholder="Email manzil"
                                className="w-full bg-neutral-800/50 border border-neutral-700 rounded-xl px-4 py-3.5 text-sm font-bold text-white placeholder:text-neutral-600 outline-none focus:border-mint focus:bg-neutral-800 transition-all"
                            />
                        </div>
                        <div className="group relative">
                            <input 
                                name="password"
                                type={showPassword ? "text" : "password"}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                                placeholder="Parol"
                                className="w-full bg-neutral-800/50 border border-neutral-700 rounded-xl px-4 py-3.5 text-sm font-bold text-white placeholder:text-neutral-600 outline-none focus:border-mint focus:bg-neutral-800 transition-all"
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white">
                                {showPassword ? Icons.eyeOff : Icons.eye}
                            </button>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-4 bg-white text-black font-black uppercase tracking-widest text-xs rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:bg-mint hover:shadow-mint/30 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        {loading ? "Tizimga ulanilmoqda..." : "Tizimga kirish"}
                    </button>
                </form>

                <div className="flex items-center gap-3 my-2">
                    <div className="h-px bg-neutral-800 flex-1" />
                    <span className="text-[10px] font-bold text-neutral-600 uppercase">Yoki</span>
                    <div className="h-px bg-neutral-800 flex-1" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => signIn("google", { callbackUrl: "/mobile" })} className="flex items-center justify-center gap-2 py-3 bg-white text-black rounded-xl text-xs font-bold hover:bg-neutral-200 transition-colors">
                        {Icons.google} Google
                    </button>
                    <Link href="/mobile/register" className="flex items-center justify-center gap-2 py-3 bg-neutral-800 text-white border border-neutral-700 rounded-xl text-xs font-bold hover:bg-neutral-700 transition-colors">
                        Ro'yxatdan o'tish
                    </Link>
                </div>
                
             </div>
         </motion.div>

         <div className="flex justify-between items-center px-4 mt-6 text-[10px] font-bold text-neutral-600 uppercase tracking-wider">
            <Link href="/mobile/forgot-password">Parolni unutdingizmi?</Link>
            <span>v1.5 Premium</span>
         </div>
      </div>
    </div>
  );
}
