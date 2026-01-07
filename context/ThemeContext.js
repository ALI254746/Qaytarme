
"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({
  isDarkMode: false,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  // Boshlanishida false, keyin esa localStorage yoki tizim sozlamasini tekshiramiz
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // 1. LocalStorage dan o'qish
    const storedTheme = localStorage.getItem("theme");
    
    // 2. Agar oldin tanlagan bo'lsa
    if (storedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else if (storedTheme === "light") {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    } else {
      // 3. Agar tanlamagan bo'lsa, tizim (OS) sozlamasiga qarash
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setIsDarkMode(true);
        document.documentElement.classList.add("dark");
      }
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newMode = !prev;
      if (newMode) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
      return newMode;
    });
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
