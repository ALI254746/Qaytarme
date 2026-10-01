"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthShell from "@/app/components/AuthShell";

function GoogleMark() {
  return <span aria-hidden="true" className="text-xl font-black">G</span>;
}

function TelegramMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path d="m6.8 11.5 9.8-3.8c.5-.2.9.1.7.8l-1.7 8c-.1.6-.5.7-.9.4l-2.6-1.9-1.3 1.3c-.2.2-.4.3-.6.3l.2-2.7 5-4.5c.2-.2 0-.3-.3-.1l-6.2 3.9-2.7-.9c-.6-.2-.6-.6.6-.8Z" fill="#f5f5f5" />
    </svg>
  );
}

function FieldIcon({ kind }) {
  if (kind === "mail") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" />
        <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      </svg>
    );
  }
  if (kind === "eye") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
        <path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    );
  }
  if (kind === "eyeOff") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
        <path d="m3 3 18 18M10.6 6.2A9.7 9.7 0 0 1 12 6c6.1 0 9.5 6 9.5 6a16.2 16.2 0 0 1-3.1 3.8M6.2 6.7C3.8 8.3 2.5 12 2.5 12s3.4 6 9.5 6c.8 0 1.6-.1 2.3-.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <rect x="4" y="10" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 10V7a4 4 0 1 1 8 0v3m-4 5v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedCallbackUrl = searchParams.get("callbackUrl");
  const callbackUrl = requestedCallbackUrl?.startsWith("/")
    && !requestedCallbackUrl.startsWith("//")
    && !requestedCallbackUrl.includes("\\")
    ? requestedCallbackUrl
    : null;
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      setSuccess("Email muvaffaqiyatli tasdiqlandi. Dasturga kirishingiz mumkin!");
    }
  }, [searchParams]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    if (!email || !password) {
      setError("Barcha maydonlarni to'ldiring");
      setLoading(false);
      return;
    }

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        if (result.error.includes("Email tasdiqlanmagan")) {
          router.push(`/verify?email=${encodeURIComponent(email)}`);
          return;
        }
        throw new Error(result.error);
      }

      router.push(callbackUrl || (window.innerWidth < 768 ? "/mobile" : "/desktop"));
    } catch (submitError) {
      setError(
        submitError.message === "CredentialsSignin"
          ? "Login yoki parol noto'g'ri"
          : submitError.message,
      );
      setLoading(false);
    }
  };

  return (
    <AuthShell
      mode="login"
      eyebrow="Xush kelibsiz"
      title="Tizimga kiring"
      description="Hisobingizga kiring va yo'qotilgan buyumlarni qidirish yoki topilgan buyumlar haqida ma'lumot olishda davom eting."
    >
      <div className="space-y-3 [@media(max-height:850px)]:space-y-2">
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: callbackUrl || "/" })}
          className="flex h-14 w-full items-center justify-center gap-3 rounded-xl border border-[#d6d6d6] bg-white text-sm font-bold transition hover:border-[#999] hover:bg-[#f3f3f3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#777] focus-visible:ring-offset-2 [@media(max-height:850px)]:h-12"
        >
          <GoogleMark />
          <span>Google orqali kirish</span>
        </button>
        <button
          type="button"
          onClick={() => window.open("https://t.me/qaytarme_app_bot", "_blank", "noopener,noreferrer")}
          className="flex h-14 w-full items-center justify-center gap-3 rounded-xl border border-[#d6d6d6] bg-[#e9e9e9] text-sm font-bold transition hover:border-[#aaa] hover:bg-[#e1e1e1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#777] focus-visible:ring-offset-2 [@media(max-height:850px)]:h-12"
        >
          <TelegramMark />
          <span>Telegram orqali kirish</span>
        </button>
      </div>

      <div className="my-7 flex items-center gap-4 [@media(max-height:850px)]:my-4">
        <span className="h-px flex-1 bg-[#dedede]" />
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#898989]">Yoki email orqali</span>
        <span className="h-px flex-1 bg-[#dedede]" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 [@media(max-height:850px)]:space-y-3">
        {error && (
          <p role="alert" className="rounded-lg border border-[#d3d3d3] bg-[#ededed] px-4 py-3 text-sm font-medium text-[#383838]">
            {error}
          </p>
        )}
        {success && (
          <p role="status" className="rounded-lg border border-[#d3d3d3] bg-[#ededed] px-4 py-3 text-sm font-medium text-[#383838]">
            {success}
          </p>
        )}

        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.08em] text-[#747474]">Email</span>
          <span className="flex h-[58px] items-center gap-3 rounded-xl border border-[#d5d5d5] bg-white px-4 text-[#777] transition focus-within:border-[#777] focus-within:ring-2 focus-within:ring-[#777]/10 [@media(max-height:850px)]:h-12">
            <FieldIcon kind="mail" />
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="email@example.com"
              className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium text-[#222] outline-none placeholder:text-[#999]"
            />
          </span>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.08em] text-[#747474]">Parol</span>
          <span className="flex h-[58px] items-center gap-3 rounded-xl border border-[#d5d5d5] bg-white px-4 text-[#777] transition focus-within:border-[#777] focus-within:ring-2 focus-within:ring-[#777]/10 [@media(max-height:850px)]:h-12">
            <FieldIcon kind="lock" />
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder="Parolingiz"
              className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium text-[#222] outline-none placeholder:text-[#999]"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
              className="rounded-md p-1 hover:text-[#222] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#777]"
            >
              <FieldIcon kind={showPassword ? "eyeOff" : "eye"} />
            </button>
          </span>
        </label>

        <div className="-mt-1 text-right">
          <Link href="/forgot-password" className="text-sm text-[#777] underline underline-offset-4 hover:text-[#111]">
            Parolni unutdingizmi?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex h-[60px] w-full items-center justify-center gap-2 rounded-xl bg-[#252525] text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#555] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70 [@media(max-height:850px)]:h-12"
        >
          {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
          {loading ? "Kirilmoqda..." : "Kirish"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#777] [@media(max-height:850px)]:mt-4">
        Hisobingiz yo&apos;qmi?{" "}
        <Link href="/register" className="font-bold text-[#222] underline underline-offset-4 hover:text-[#666]">
          Ro&apos;yxatdan o&apos;ting
        </Link>
      </p>
    </AuthShell>
  );
}

export default LoginForm;
