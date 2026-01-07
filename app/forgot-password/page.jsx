// app/forgot-password/page.jsx
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { getApiUrl } from "@/lib/api-config";

// SVG Icons
const Icons = {
  refresh: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  mail: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  arrowLeft: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  check: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  shield: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  lock: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  checkCircle: <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
};

// Steps data
const steps = [
  { step: 1, title: "Email kiriting", desc: "Ro'yxatdan o'tgan email manzilingizni kiriting" },
  { step: 2, title: "Kodni oling", desc: "Emailingizga kelgan tasdiqlash kodini kiriting" },
  { step: 3, title: "Yangi parol", desc: "Yangi xavfsiz parol o'rnating" },
];

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailValid, setEmailValid] = useState(null);
  const [focusedField, setFocusedField] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Email validation
  useEffect(() => {
    if (email.length === 0) setEmailValid(null);
    else setEmailValid(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  }, [email]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Handle code input
  const handleCodeChange = (index, value) => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    
    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`code-${index + 1}`)?.focus();
    }
  };

  const handleCodeKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      document.getElementById(`code-${index - 1}`)?.focus();
    }
  };

  // Step 1: Send reset email
  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailValid) {
      setError("To'g'ri email kiriting");
      return;
    }
    
    try {
      const res = await fetch(getApiUrl("auth/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Xatolik yuz berdi");
      }

      setStep(2);
      setCountdown(60);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify code
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    const fullCode = code.join("");
    
    if (fullCode.length !== 6) {
      setError("6 xonali kodni to'liq kiriting");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    // In our new backend flow, we don't have a separate verify-code endpoint 
    // that just checks the code without resetting.
    // However, we can either skip this step or add a verify endpoint. 
    // For now, let's just assume local validation satisfies this step 
    // and let the final step do the actual verification+reset.
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setLoading(false);
    setStep(3);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      setError("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError("Parollar mos kelmayapti");
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(getApiUrl("auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code: code.join(""),
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Xatolik yuz berdi");
      }

      setStep(4); // Success state
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Resend code
  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    setLoading(true);
    try {
      const res = await fetch(getApiUrl("auth/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Xatolik yuz berdi");
      }
      setCountdown(60);
      setCode(["", "", "", "", "", ""]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Dark Hero */}
      <div className="hidden lg:flex flex-1 flex-col relative overflow-hidden bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
        {/* Subtle gradient orbs */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-mint/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-mint/5 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-10">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-11 h-11 bg-mint rounded-xl flex items-center justify-center text-neutral-800 shadow-lg shadow-mint/20">
              {Icons.refresh}
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">QaytarMe</span>
          </motion.div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="w-20 h-20 bg-mint/10 rounded-3xl flex items-center justify-center mb-8 border border-mint/30">
                <div className="text-mint">
                  {Icons.lock}
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
              </div>

              <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
                Parolni
                <br />
                <span className="text-mint">
                  tiklash
                </span>
              </h1>
              <p className="text-lg text-neutral-400 max-w-md leading-relaxed mb-10">
                Xavotir olmang! Parolingizni osongina tiklab olishingiz mumkin. 
                Emailingizga tasdiqlash kodi yuboramiz.
              </p>

              {/* Steps */}
              <div className="space-y-4">
                {steps.map((s, i) => (
                  <motion.div
                    key={s.step}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className={`flex items-center gap-4 ${step > s.step ? "opacity-50" : ""}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all ${
                      step === s.step 
                        ? "bg-mint text-neutral-800 shadow-lg shadow-mint/20" 
                        : step > s.step 
                          ? "bg-mint/10 text-mint border border-mint/30"
                          : "bg-neutral-800 text-neutral-400 border border-neutral-700"
                    }`}>
                      {step > s.step ? Icons.check : s.step}
                    </div>
                    <div>
                      <h4 className="text-white font-medium text-sm">{s.title}</h4>
                      <p className="text-neutral-500 text-xs">{s.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Back to login */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Link 
              href="/login"
              className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
            >
              {Icons.arrowLeft}
              <span>Kirish sahifasiga qaytish</span>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-[480px] xl:w-[520px] flex flex-col justify-center px-6 sm:px-10 lg:px-12 py-8 bg-white">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[380px] mx-auto"
        >
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-mint rounded-xl flex items-center justify-center text-neutral-800 shadow-md">
              {Icons.refresh}
            </div>
            <span className="text-xl font-bold text-neutral-900">QaytarMe</span>
          </div>

          {/* Mobile Back Link */}
          <Link 
            href="/login"
            className="inline-flex lg:hidden items-center gap-1.5 text-neutral-500 hover:text-neutral-700 transition-colors mb-6 text-sm"
          >
            {Icons.arrowLeft}
            <span>Orqaga</span>
          </Link>

          <AnimatePresence mode="wait">
            {/* Step 1: Email */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-neutral-900 mb-1">Parolni tiklash 🔐</h2>
                  <p className="text-neutral-500 text-sm">
                    Emailingizni kiriting, biz sizga tasdiqlash kodi yuboramiz
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-neutral-100 border border-neutral-200 rounded-xl text-neutral-800 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSendEmail} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-neutral-700">Email</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocusedField("email")}
                        onBlur={() => setFocusedField(null)}
                        placeholder="sizning@email.uz"
                        className={`w-full py-3 px-4 bg-neutral-50 border-2 rounded-xl text-neutral-900 placeholder:text-neutral-400 outline-none transition-all duration-200 ${
                          focusedField === "email" ? "border-mint bg-white shadow-sm shadow-mint/10" : "border-neutral-200"
                        }`}
                      />
                      {emailValid !== null && (
                        <div className={`absolute right-3 top-1/2 -translate-y-1/2 ${emailValid ? "text-mint" : "text-neutral-400"}`}>
                          {emailValid ? Icons.check : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading || !emailValid}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 bg-mint text-neutral-800 font-black uppercase tracking-widest rounded-xl shadow-lg shadow-mint/25 hover:brightness-95 disabled:opacity-70 transition-all duration-300"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                    ) : (
                      "Kod yuborish"
                    )}
                  </motion.button>
                </form>
              </motion.div>
            )}

            {/* Step 2: Verify Code */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="mb-6">
                  <div className="w-14 h-14 bg-mint/10 rounded-2xl flex items-center justify-center mb-4 text-mint">
                    {Icons.mail}
                  </div>
                  <h2 className="text-2xl font-bold text-neutral-900 mb-1">Kodni kiriting ✉️</h2>
                  <p className="text-neutral-500 text-sm">
                    <span className="font-medium text-neutral-700">{email}</span> manziliga 6 xonali kod yuborildi
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-neutral-100 border border-neutral-200 rounded-xl text-neutral-800 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleVerifyCode} className="space-y-6">
                  {/* Code Inputs */}
                  <div className="flex gap-2 justify-center">
                    {code.map((digit, i) => (
                      <input
                        key={i}
                        id={`code-${i}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(i, e.target.value.replace(/\D/g, ""))}
                        onKeyDown={(e) => handleCodeKeyDown(i, e)}
                        className="w-12 h-14 text-center text-xl font-bold bg-neutral-50 border-2 border-neutral-200 rounded-xl text-neutral-900 outline-none focus:border-mint focus:bg-white transition-all"
                      />
                    ))}
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading || code.join("").length !== 6}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 bg-mint text-neutral-800 font-black uppercase tracking-widest rounded-xl shadow-lg shadow-mint/25 hover:brightness-95 disabled:opacity-70 transition-all duration-300"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                    ) : (
                      "Tasdiqlash"
                    )}
                  </motion.button>

                  {/* Resend */}
                  <div className="text-center">
                    <p className="text-neutral-500 text-sm mb-2">Kod kelmadimi?</p>
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={countdown > 0 || loading}
                      className={`font-medium text-sm ${countdown > 0 ? "text-neutral-400" : "text-mint hover:underline"}`}
                    >
                      {countdown > 0 ? `Qayta yuborish (${countdown}s)` : "Qayta yuborish"}
                    </button>
                  </div>
                </form>

                <button
                  onClick={() => setStep(1)}
                  className="mt-6 text-neutral-500 text-sm hover:text-neutral-700"
                >
                  ← Emailni o'zgartirish
                </button>
              </motion.div>
            )}

            {/* Step 3: New Password */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-neutral-900 mb-1">Yangi parol 🔒</h2>
                  <p className="text-neutral-500 text-sm">
                    Xavfsiz va eslab qoladigan parol o'rnating
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-neutral-100 border border-neutral-200 rounded-xl text-neutral-800 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-neutral-700">Yangi parol</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Kamida 6 ta belgi"
                        className="w-full py-3 px-4 pr-12 bg-neutral-50 border-2 border-neutral-200 rounded-xl text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-mint focus:bg-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {showPassword ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          ) : (
                            <>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </>
                          )}
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-neutral-700">Parolni tasdiqlang</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Parolni qayta kiriting"
                      className="w-full py-3 px-4 bg-neutral-50 border-2 border-neutral-200 rounded-xl text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-mint focus:bg-white transition-all"
                    />
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading || newPassword.length < 6}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 bg-mint text-neutral-800 font-black uppercase tracking-widest rounded-xl shadow-lg shadow-mint/25 hover:brightness-95 disabled:opacity-70 transition-all duration-300"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                    ) : (
                      "Parolni yangilash"
                    )}
                  </motion.button>
                </form>
              </motion.div>
            )}

            {/* Step 4: Success */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-20 h-20 bg-mint/10 rounded-full flex items-center justify-center mx-auto mb-6 text-mint">
                  {Icons.checkCircle}
                </div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">Muvaffaqiyatli! 🎉</h2>
                <p className="text-neutral-500 text-sm mb-8">
                  Parolingiz muvaffaqiyatli yangilandi. Endi yangi parolingiz bilan kirishingiz mumkin.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 w-full py-3 bg-mint text-neutral-800 font-bold rounded-xl shadow-lg shadow-mint/25 hover:brightness-95 transition-all duration-300"
                >
                  Kirish sahifasiga o'tish
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Trust badges */}
          {step < 4 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <div className="flex items-center gap-1 text-neutral-400 text-xs">
                {Icons.lock}
                <span>256-bit SSL</span>
              </div>
              <div className="flex items-center gap-1 text-neutral-400 text-xs">
                {Icons.shield}
                <span>Xavfsiz</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
