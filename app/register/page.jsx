"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthShell from "@/app/components/AuthShell";
import { getApiUrl } from "@/lib/api-config";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const type = searchParams.get("type");
  const title =
    type === "lost"
      ? "Yo'qolgan buyumni topamiz!"
      : type === "found"
        ? "Qahramon bo'lishga tayyormisiz?"
        : "Hisob yarating";
  const description =
    type === "lost"
      ? "Qidiruvni boshlash uchun hisob oching."
      : type === "found"
        ? "Buyumni egasiga qaytarish uchun ro'yxatdan o'ting."
        : "Bir daqiqada ro‘yxatdan o‘ting va Buyum Qidiruv hamjamiyatiga qo‘shiling.";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    if (!name || !email || !password) {
      setError("Barcha maydonlarni to'ldiring");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(getApiUrl("auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();

      if (response.ok || data.unverified || data.requiresVerification) {
        router.push(`/verify?email=${encodeURIComponent(email)}`);
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Ro'yxatdan o'tishda xatolik yuz berdi");
      }
    } catch (submitError) {
      setError(submitError.message);
      setLoading(false);
    }
  };

  return (
    <AuthShell
      mode="register"
      eyebrow={type === "lost" ? "Yo'qolgan buyum" : type === "found" ? "Topilgan buyum" : "Yangi hisob"}
      title={title}
      description={description}
    >
      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/" })}
        className="flex h-14 w-full items-center justify-center gap-3 rounded-xl border border-[#d6d6d6] bg-white text-sm font-bold transition hover:border-[#999] hover:bg-[#f3f3f3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#777] focus-visible:ring-offset-2 [@media(max-height:850px)]:h-12"
      >
        <span aria-hidden="true" className="text-xl font-black">G</span>
        <span>Google orqali ro&apos;yxatdan o&apos;tish</span>
      </button>

      <div className="my-7 flex items-center gap-4 [@media(max-height:850px)]:my-4">
        <span className="h-px flex-1 bg-[#dedede]" />
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#898989]">Yoki email orqali</span>
        <span className="h-px flex-1 bg-[#dedede]" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 [@media(max-height:850px)]:space-y-2">
        {error && (
          <p role="alert" className="rounded-lg border border-[#d3d3d3] bg-[#ededed] px-4 py-3 text-sm font-medium text-[#383838]">
            {error}
          </p>
        )}

        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.08em] text-[#747474]">Ism</span>
          <input
            name="name"
            type="text"
            autoComplete="name"
            required
            placeholder="Ismingiz"
            className="h-[56px] w-full rounded-xl border border-[#d5d5d5] bg-white px-4 text-sm font-medium text-[#222] outline-none transition placeholder:text-[#999] focus:border-[#777] focus:ring-2 focus:ring-[#777]/10 [@media(max-height:850px)]:h-12"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.08em] text-[#747474]">Email</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="email@example.com"
            className="h-[56px] w-full rounded-xl border border-[#d5d5d5] bg-white px-4 text-sm font-medium text-[#222] outline-none transition placeholder:text-[#999] focus:border-[#777] focus:ring-2 focus:ring-[#777]/10 [@media(max-height:850px)]:h-12"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.08em] text-[#747474]">Parol</span>
          <span className="flex h-[56px] items-center rounded-xl border border-[#d5d5d5] bg-white transition focus-within:border-[#777] focus-within:ring-2 focus-within:ring-[#777]/10 [@media(max-height:850px)]:h-12">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={6}
              placeholder="Kamida 6 ta belgi"
              className="h-full min-w-0 flex-1 rounded-xl bg-transparent px-4 text-sm font-medium text-[#222] outline-none placeholder:text-[#999]"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
              className="mr-3 rounded-md px-2 py-1 text-xs font-bold text-[#777] hover:text-[#222] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#777]"
            >
              {showPassword ? "YASHIRISH" : "KO'RISH"}
            </button>
          </span>
          <span className="mt-2 block text-[11px] text-[#888] [@media(max-height:850px)]:mt-1">Kamida 6 ta belgi ishlating.</span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex h-[60px] w-full items-center justify-center gap-2 rounded-xl bg-[#252525] text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#555] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70 [@media(max-height:850px)]:mt-1 [@media(max-height:850px)]:h-12"
        >
          {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
          {loading ? "Yaratilmoqda..." : "Hisob yaratish"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#777] [@media(max-height:850px)]:mt-4">
        Hisobingiz bormi?{" "}
        <Link href="/login" className="font-bold text-[#222] underline underline-offset-4 hover:text-[#666]">
          Tizimga kiring
        </Link>
      </p>
      <p className="mt-4 text-center text-[11px] leading-5 text-[#888] [@media(max-height:850px)]:mt-2">
        Davom etish orqali{" "}
        <Link href="/terms" className="underline underline-offset-2 hover:text-[#222]">foydalanish shartlari</Link>
        {" "}va{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-[#222]">maxfiylik siyosati</Link>
        {" "}ga rozilik bildirasiz.
      </p>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f5f5f5]" aria-label="Yuklanmoqda" />}>
      <RegisterContent />
    </Suspense>
  );
}
