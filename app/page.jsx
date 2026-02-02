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

      // Standard Web Browser Logic
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
    
    // Use a small timeout to allow hydration to settle
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
