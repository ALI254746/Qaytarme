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

    const checkScreenAndRedirect = () => {
      const isMobile = window.innerWidth < 768;
      
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
    
    checkScreenAndRedirect();
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
