"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SplashScreen({ onComplete }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Show splash screen for 2.5 seconds minimum
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500); // Wait for exit animation
    }, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] bg-[#2E2D2B] flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
             <motion.div 
               animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
               transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
               className="absolute -top-32 -right-32 w-96 h-96 bg-[#A9D3C9]/10 rounded-full blur-3xl"
             />
             <motion.div 
               animate={{ scale: [1, 1.5, 1], rotate: [0, -45, 0] }}
               transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
               className="absolute -bottom-32 -left-32 w-80 h-80 bg-[#F7F6E2]/5 rounded-full blur-3xl"
             />
          </div>

          <div className="relative z-10 flex flex-col items-center">
            {/* Logo Animation */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
              className="w-24 h-24 bg-[#A9D3C9] rounded-3xl flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(169,211,201,0.3)] relative"
            >
               <motion.svg 
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
                  className="w-12 h-12 text-[#2E2D2B]" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
               >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
               </motion.svg>
               {/* Pulsing Ring */}
               <motion.div 
                  className="absolute inset-0 rounded-3xl border-2 border-[#A9D3C9]"
                  initial={{ scale: 1, opacity: 1 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity }}
               />
            </motion.div>

            {/* Text Animation */}
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-4xl font-black text-[#F7F6E2] tracking-tighter mb-2"
            >
              QaytarMe
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-[#A9D3C9] text-xs font-bold uppercase tracking-[0.2em]"
            >
              Yo'qotmang, Toping
            </motion.p>
          </div>

          {/* Bottom Loading Bar */}
          <motion.div 
            className="absolute bottom-12 w-64 h-1 bg-[#F7F6E2]/10 rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
             <motion.div 
               className="h-full bg-[#A9D3C9]"
               initial={{ x: "-100%" }}
               animate={{ x: "0%" }}
               transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
             />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
