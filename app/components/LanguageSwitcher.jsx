"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";

const flags = {
  uz: "🇺🇿",
  ru: "🇷🇺",
  en: "🇬🇧",
  kk: "🇰🇿",
  ky: "🇰🇬",
  kaa: "🏴",
};

const labels = {
  uz: "O'zbek",
  ru: "Русский",
  en: "English",
  kk: "Qazaqsha",
  ky: "Кыргызча",
  kaa: "Qaraqalpaq",
};

export default function LanguageSwitcher() {
  const { lang, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative z-50" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50 dark:bg-neutral-800/50 hover:bg-white dark:hover:bg-neutral-900 backdrop-blur-md border border-neutral-200 dark:border-neutral-700 transition-all active:scale-95"
      >
        <span className="text-xl">{flags[lang]}</span>
        <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300 hidden md:block uppercase tracking-wider">{lang}</span>
        <svg className={`w-4 h-4 text-neutral-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden"
          >
            <div className="p-1">
              {Object.keys(flags).map((code) => (
                <button
                  key={code}
                  onClick={() => {
                    changeLanguage(code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                    lang === code
                      ? "bg-mint/20 text-neutral-900 dark:text-white"
                      : "hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                  }`}
                >
                  <span className="text-xl">{flags[code]}</span>
                  <span className={`text-sm font-bold ${lang === code ? "font-black" : ""}`}>{labels[code]}</span>
                  {lang === code && <span className="ml-auto text-mint">✓</span>}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
