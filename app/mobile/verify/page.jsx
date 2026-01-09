"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getApiUrl } from "@/lib/api-config";
import { useLanguage } from "@/context/LanguageContext";

function MobileVerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const { t } = useLanguage();
  
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      router.push("/mobile/register");
    }
  }, [email, router]);

  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    const newCode = [...code];
    newCode[index] = value.substring(value.length - 1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    const data = e.clipboardData.getData("text").trim();
    if (data.length === 6 && !isNaN(data)) {
      setCode(data.split(""));
      inputRefs.current[5].focus();
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const verificationCode = code.join("");
    if (verificationCode.length !== 6) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(getApiUrl("auth/verify-email"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: verificationCode }),
      });

      const data = await res.json();

      if (res.ok) {
        setResendSuccess(false);
        router.push("/mobile/login?verified=true");
      } else {
        throw new Error(data.error || t('verify_error'));
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    setResendSuccess(false);

    try {
      const res = await fetch(getApiUrl("auth/resend-verification"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setResendSuccess(true);
      } else {
        const data = await res.json();
        throw new Error(data.error || t('verify_resend_error'));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    if (code.every(digit => digit !== "")) {
      handleSubmit();
    }
  }, [code]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden p-6">
       
       {/* --- Dynamic Background --- */}
       <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[#0A0A0A]" />
          <div className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] bg-mint/5 rounded-full blur-[80px]" />
          <div className="absolute inset-0 opacity-[0.1]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #262626 10px, #262626 11px)' }} />
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        <div className="mt-8 mb-8">
            <div className="w-16 h-16 bg-neutral-900 rounded-2xl flex items-center justify-center border border-neutral-800 shadow-lg mb-6">
                <svg className="w-8 h-8 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            </div>
            <h1 className="text-4xl font-black mb-2 tracking-tight">Tasdiqlash</h1>
            <p className="text-neutral-400 font-medium text-sm">
                <span className="text-white font-bold">{email}</span> manziliga yuborilgan 6 xonali kodni kiriting.
            </p>
        </div>

        <AnimatePresence>
            {error && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 p-4 bg-red-900/10 text-red-400 text-xs font-bold rounded-xl border border-red-900/30">
                {error}
            </motion.div>
            )}
            {resendSuccess && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 p-4 bg-mint/10 text-mint text-xs font-bold rounded-xl border border-mint/20">
                {t('verify_resend_success')}
            </motion.div>
            )}
        </AnimatePresence>

        <div className="flex justify-between gap-2 mb-8" onPaste={handlePaste}>
            {code.map((digit, index) => (
                <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-full h-14 bg-neutral-900 border border-neutral-800 rounded-xl text-center text-xl font-bold text-white outline-none focus:border-mint focus:bg-neutral-800 transition-all focus:ring-1 focus:ring-mint"
                />
            ))}
        </div>

        <button
            onClick={handleSubmit}
            disabled={loading || code.some(d => !d)}
            className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:bg-mint hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all mb-6"
        >
            {loading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto" />
            ) : "Tasdiqlash"}
        </button>

        <div className="text-center space-y-4">
            <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-xs font-bold text-neutral-500 hover:text-white transition-colors uppercase tracking-widest"
            >
                {resending ? t('verify_resending') : t('verify_resend_btn')}
            </button>
            
            <div className="pt-8">
                 <Link href="/mobile/register" className="text-xs font-bold text-neutral-600 hover:text-neutral-400 transition-colors">
                    ← Emailni o'zgartirish
                 </Link>
            </div>
        </div>
      </div>
    </div>
  );
}

export default function MobileVerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>}>
      <MobileVerifyContent />
    </Suspense>
  );
}
