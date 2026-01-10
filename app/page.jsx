"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Outfit } from "next/font/google";

const outfit = Outfit({ subsets: ["latin"] });

export default function Page() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (status === "loading") return;

    const checkScreenAndRedirect = async () => {
      if (typeof window === 'undefined') return;

      // 1. Telegram WebApp Check & Auto-Login
      if (window.Telegram?.WebApp) {
          const tg = window.Telegram.WebApp;
          tg.ready();
          tg.expand();
          
          console.log("Telegram Environment Detected");

          // Force Mobile UI for ANY Telegram instance (Desktop or Mobile)
          const targetUrl = "/mobile";

          if (session) {
             // Already logged in
             console.log("Telegram: Session exists, redirecting to", targetUrl);
             router.push(targetUrl);
             return;
          } else if (tg.initDataUnsafe?.user) {
             // Try Auto-Login
             console.log("Telegram: Attempting Auto-Login...");
             try {
                // Import signIn dynamically if possible or assume it's available from top-level import (need to add it)
                const { signIn } = await import("next-auth/react");
                
                const result = await signIn("credentials", {
                    telegramData: JSON.stringify(tg.initDataUnsafe),
                    redirect: false
                });

                if (result?.ok) {
                    console.log("Telegram Login Success");
                    router.push(targetUrl);
                    return;
                } else {
                    console.error("Telegram Login Failed", result);
                    // Fallback to login page if auth fails (or stay on loading/show error)
                    router.push("/login");
                    return;
                }
             } catch (e) {
                 console.error("Telegram Login Error:", e);
                 router.push("/login");
                 return;
             }
          }
           // No session and no Telegram user data? Redirect to login
           // (Should usually have initData inside Telegram)
           console.log("Telegram: No user data, redirecting to login");
           router.push("/login");
           return;
      }

      // 2. Standard Web Browser Logic
      const width = window.innerWidth;
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(userAgent);
      const isMobile = width < 768 || isMobileDevice; 

      console.log('--- REDIRECT DEBUG ---');
      console.log('Device:', isMobile ? 'Mobile' : 'Desktop');
      
      if (session) {
        if (isMobile) {
          router.push("/mobile");
        } else {
          router.push("/desktop");
        }
      } else {
        router.push("/login");
      }
    };
    
    // Use a small timeout to allow hydration/Telegram script injection to settle
    const timeout = setTimeout(() => {
        checkScreenAndRedirect();
    }, 100);

    return () => clearTimeout(timeout);
  }, [router, session, status]);

  // Loading state while redirecting
  return (
    <div className={`relative min-h-screen flex items-center justify-center bg-[#F7F6E2] ${outfit.className}`}>
      <div className="flex flex-col items-center gap-4 opacity-50">
         <div className="w-12 h-12 border-4 border-[#2E2D2B] border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
}
