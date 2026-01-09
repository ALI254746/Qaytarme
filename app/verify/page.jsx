// app/verify/page.jsx
"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getApiUrl } from "@/lib/api-config";
import { useLanguage } from "@/context/LanguageContext";

function VerifyContent() {
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
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      const emailParam = email ? `?email=${encodeURIComponent(email)}` : "";
      router.replace(`/mobile/verify${emailParam}`);
      return;
    }

    if (!email) {
      router.push("/register");
    }
  }, [email, router]);

  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    const newCode = [...code];
    newCode[index] = value.substring(value.length - 1);
    setCode(newCode);

    // Focus next input
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
        router.push("/login?verified=true");
      } else {
        throw new Error(data.message || data.error || t('verify_error'));
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
      // Use auth/resend-verification which is safe
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

  // Auto submit when all digits are entered
  useEffect(() => {
    if (code.every(digit => digit !== "")) {
      handleSubmit();
    }
  }, [code]);

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[440px] bg-white rounded-[2.5rem] p-10 lg:p-12 shadow-2xl shadow-neutral-200/50 border border-neutral-100 text-center"
      >
        {/* Icon */}
        <div className="w-20 h-20 bg-mint/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
           <svg className="w-10 h-10 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
           </svg>
        </div>

        {/* Header */}
        <h2 className="text-2xl font-black text-neutral-900 mb-2">{t('verify_title')}</h2>
        <p className="text-sm text-neutral-500 font-medium mb-10 leading-relaxed px-4">
          <span className="font-bold text-neutral-700">{email}</span> {t('verify_desc_part1')}
        </p>

        {/* Error/Success Messages */}
        <AnimatePresence>
          {error && (
            <motion.div 
               initial={{ opacity: 0, y: -10 }}
               animate={{ opacity: 1, y: 0 }}
               className="mb-6 p-3 bg-red-50 text-red-500 text-xs font-bold rounded-xl border border-red-100"
            >
              {error}
            </motion.div>
          )}
          {resendSuccess && (
            <motion.div 
               initial={{ opacity: 0, y: -10 }}
               animate={{ opacity: 1, y: 0 }}
               className="mb-6 p-3 bg-mint/10 text-mint text-sm font-bold rounded-xl border border-mint/20"
            >
              {t('verify_resend_success')}
            </motion.div>
          )}
        </AnimatePresence>

        {/* OTP Inputs */}
        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="flex justify-between gap-2 sm:gap-4" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-black bg-neutral-50 border-2 border-neutral-100 rounded-xl focus:border-mint focus:bg-white outline-none transition-all"
              />
            ))}
          </div>

          <div className="space-y-6">
            <motion.button
              type="submit"
              disabled={loading || code.some(d => !d)}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-mint text-neutral-800 font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-mint/20 hover:brightness-95 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
              ) : (
                t('verify_btn')
              )}
            </motion.button>

            <div className="flex flex-col items-center gap-2">
              <p className="text-xs text-neutral-400 font-medium">{t('verify_resend_q')}</p>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-sm font-black text-neutral-900 hover:text-mint transition-colors underline underline-offset-4 decoration-mint"
              >
                {resending ? t('verify_resending') : t('verify_resend_btn')}
              </button>
            </div>
          </div>
        </form>

        <div className="mt-12 pt-8 border-t border-neutral-50">
           <Link href="/register" className="text-xs font-bold text-neutral-400 hover:text-neutral-900 transition-colors uppercase tracking-widest">
             ← {t('verify_change_email')}
           </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ivory flex items-center justify-center">Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
