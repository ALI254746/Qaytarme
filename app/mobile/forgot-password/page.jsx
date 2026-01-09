"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getApiUrl } from "@/lib/api-config";

export default function MobileForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleCodeChange = (index, value) => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) document.getElementById(`code-${index + 1}`)?.focus();
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(getApiUrl("auth/forgot-password"), {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Xatolik yuz berdi");
      setStep(2);
      setCountdown(60);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError("Parollar mos kelmayapti"); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(getApiUrl("auth/reset-password"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: code.join(""), newPassword }),
      });
      if (!res.ok) throw new Error("Xatolik");
      setStep(4);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    setLoading(true);
    try {
      await fetch(getApiUrl("auth/forgot-password"), {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }),
      });
      setCountdown(60);
      setCode(["", "", "", "", "", ""]);
    } catch (err) {} finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col p-6 overflow-hidden relative">
      <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[#0A0A0A]" />
          <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-white/5 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
         {/* Navbarish */}
         <div className="flex items-center gap-4 mt-4 mb-8">
            <button onClick={() => {
                if (step > 1 && step < 4) setStep(step - 1);
                else router.back();
            }} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white active:bg-white/10">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">Parolni tiklash</span>
         </div>

         <AnimatePresence mode="wait">
            {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col">
                    <h1 className="text-4xl font-black mb-2">Email Kiriting</h1>
                    <p className="text-neutral-400 font-medium text-sm mb-8">Tasdiqlash kodi yuborish uchun emailingizni kiriting.</p>
                    
                    {error && <div className="mb-4 p-3 bg-red-900/10 text-red-500 text-xs font-bold rounded-xl border border-red-900/30">{error}</div>}

                    <form onSubmit={handleSendEmail} className="space-y-6">
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl px-5 py-4 text-sm font-bold text-white placeholder:text-neutral-700 outline-none focus:border-mint transition-all" />
                        <button type="submit" disabled={loading} className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-2xl shadow-lg hover:bg-mint transition-all disabled:opacity-50">
                            {loading ? "..." : "Kod Yuborish"}
                        </button>
                    </form>
                </motion.div>
            )}

            {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col">
                    <h1 className="text-4xl font-black mb-2">Kodni Kiriting</h1>
                    <p className="text-neutral-400 font-medium text-sm mb-8"><span className="text-white">{email}</span> ga yuborilgan kodni kiriting.</p>

                    {error && <div className="mb-4 p-3 bg-red-900/10 text-red-500 text-xs font-bold rounded-xl border border-red-900/30">{error}</div>}

                    <div className="flex gap-2 justify-center mb-6">
                        {code.map((digit, i) => (
                          <input key={i} id={`code-${i}`} type="text" inputMode="numeric" maxLength={1} value={digit} onChange={(e) => handleCodeChange(i, e.target.value.replace(/\D/g, ""))} className="w-12 h-14 bg-neutral-900 border border-neutral-800 rounded-xl text-center text-xl font-bold text-white outline-none focus:border-mint transition-all" />
                        ))}
                    </div>

                    <button onClick={() => setStep(3)} disabled={code.join("").length !== 6} className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-2xl shadow-lg hover:bg-mint transition-all disabled:opacity-50 mb-4">
                        Davom etish
                    </button>
                    <button onClick={handleResendCode} disabled={countdown > 0} className="w-full text-xs font-bold text-neutral-500 uppercase tracking-widest">
                        {countdown > 0 ? `Qayta yuborish (${countdown}s)` : "Kodni qayta yuborish"}
                    </button>
                </motion.div>
            )}

            {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col">
                    <h1 className="text-4xl font-black mb-2">Yangi Parol</h1>
                    <p className="text-neutral-400 font-medium text-sm mb-8">Yangi va xavfsiz parol o'rnating.</p>

                    {error && <div className="mb-4 p-3 bg-red-900/10 text-red-500 text-xs font-bold rounded-xl border border-red-900/30">{error}</div>}

                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Yangi parol" className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl px-5 py-4 text-sm font-bold text-white placeholder:text-neutral-700 outline-none focus:border-mint transition-all" />
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Parolni tasdiqlang" className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl px-5 py-4 text-sm font-bold text-white placeholder:text-neutral-700 outline-none focus:border-mint transition-all" />
                        <button type="submit" disabled={loading} className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-2xl shadow-lg hover:bg-mint transition-all disabled:opacity-50 mt-4">
                            {loading ? "..." : "Saqlash"}
                        </button>
                    </form>
                </motion.div>
            )}

            {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col justify-center items-center text-center">
                    <div className="w-20 h-20 bg-mint rounded-full flex items-center justify-center mb-6 shadow-lg shadow-mint/20">
                        <svg className="w-10 h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h2 className="text-3xl font-black mb-2">Muvaffaqiyatli!</h2>
                    <p className="text-neutral-400 mb-8">Parolingiz yangilandi.</p>
                    <Link href="/mobile/login" className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-2xl shadow-lg">
                        Kirish
                    </Link>
                </motion.div>
            )}
         </AnimatePresence>
      </div>
    </div>
  );
}
