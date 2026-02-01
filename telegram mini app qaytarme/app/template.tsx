"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { usePathname } from "next/navigation";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    // Initial state: slightly lower and transparent
    gsap.set(containerRef.current, {
      y: 20,
      opacity: 0,
      scale: 0.98,
      filter: "blur(10px)",
    });

    // Animate in: "Liquid" smooth feeling using custom easing
    gsap.to(containerRef.current, {
      y: 0,
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      duration: 0.8,
      ease: "power4.out", // Very smooth deceleration
      delay: 0.1, // Small delay to allow potential exit animations or heavy loading
    });

    // Optional: Add a "wipe" overlay if we wanted a separate layer, 
    // but for now, manipulating the content directly feels more native app-like.

  }, [pathname]);

  return (
    <div ref={containerRef} className="min-h-screen">
      {children}
    </div>
  );
}
