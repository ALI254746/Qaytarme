"use client";

import { Home, Map, Plus, HeartHandshake, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useUIContext } from "@/context/UIContext";
import { useLanguage } from "@/context/LanguageContext";

export default function BottomNav() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const { isNavVisible: isContextVisible } = useUIContext();
  const { t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false); // Scrolling down -> Hide
      } else {
        setIsVisible(true); // Scrolling up -> Show
      }
      setLastScrollY(currentScrollY);
    };

    const handleFocusIn = () => {
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
        setIsKeyboardOpen(true);
      }
    };

    const handleFocusOut = () => {
       setIsKeyboardOpen(false);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("focusin", handleFocusIn);
    window.addEventListener("focusout", handleFocusOut);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("focusin", handleFocusIn);
      window.removeEventListener("focusout", handleFocusOut);
    };
  }, [lastScrollY]);

  const navItems = [
    { name: "Home", href: "/", icon: Home, label: t("common.home") },
    { name: "Map", href: "/search", icon: Map, label: t("common.search") },
    { name: "Add", href: "/add", icon: Plus, isMain: true },
    { name: "Matches", href: "/matches", icon: HeartHandshake, label: t("common.matches") },
    { name: "Profile", href: "/profile", icon: User, label: t("common.profile") },
  ];

  return (
    <motion.div 
      initial={{ y: 0 }}
      animate={{ y: (isVisible && isContextVisible && !isKeyboardOpen) ? 0 : 120 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed bottom-0 left-0 right-0 z-50"
    >
      {/* Remove border-t and use a gradient fade mask instead for cleaner look */}
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none"></div>
      <div className="absolute inset-0 bg-card/60 backdrop-blur-md shadow-[0_-5px_30px_rgba(0,0,0,0.02)] pointer-events-none"></div>
      
      <nav className="relative flex justify-around items-center h-[70px] px-2 pb-2 max-w-md mx-auto">
        
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.isMain) {
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className="flex flex-col items-center justify-center w-14 group -mt-5"
              >
                <motion.div
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9, y: 0 }}
                  className="btn-primary-3d w-12 h-12 bg-accent rounded-full flex items-center justify-center border-4 border-background/50 backdrop-blur-sm"
                >
                  <Icon className="w-6 h-6 text-accent-foreground" />
                </motion.div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center w-16 gap-1.5 group"
            >
              <motion.div 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="relative p-1.5"
              >
                <Icon 
                  className={cn(
                    "w-6 h-6 transition-colors duration-300",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )} 
                />
                {isActive && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(169,211,201,0.8)]"
                  />
                )}
                {/* Notification dot example for Chat */}
                {item.name === 'Matches' && !isActive && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="absolute top-1 right-1 w-2 h-2 bg-destructive border border-card rounded-full"
                  />
                )}
              </motion.div>
              <motion.span
                animate={{ 
                  fontWeight: isActive ? 600 : 500,
                  letterSpacing: isActive ? "0.05em" : "0"
                }}
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive ? "text-primary font-semibold tracking-wide" : "text-muted-foreground group-hover:text-foreground"
                )}
              >
                {item.label}
              </motion.span>
            </Link>
          );
        })}

      </nav>
    </motion.div>
  );
}
