"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { uz } from "../frontend/locales/uz";
import { ru } from "../frontend/locales/ru";
import { en } from "../frontend/locales/en";
import { kk } from "../frontend/locales/kk";
import { ky } from "../frontend/locales/ky";
import { kaa } from "../frontend/locales/kaa";

const LanguageContext = createContext();

const languages = { uz, ru, en, kk, ky, kaa };

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState("uz"); // Default to Uzbek
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Load from localStorage on client mount
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("app_lang");
      if (savedLang && languages[savedLang]) {
        setLang(savedLang);
      }
      setLoaded(true);
    }
  }, []);

  const changeLanguage = (newLang) => {
    if (languages[newLang]) {
      setLang(newLang);
      localStorage.setItem("app_lang", newLang);
    }
  };

  const t = (key) => {
    const currentDict = languages[lang] || languages.uz;
    return currentDict[key] || key;
  };

  // Avoid flash of untranslated content or mismatch during hydration
  // though for client-only text it's usually fine. 
  // We'll return children immediately but `t` will use default until effect runs if needed.
  // Actually, for simplicity we just render.

  return (
    <LanguageContext.Provider value={{ lang, changeLanguage, t, loaded }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  return useContext(LanguageContext);
};
