"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Globe, Bell, Shield, Moon, Sun, Volume2, VolumeX } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage, type Language } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { SettingsPageSkeleton } from "@/components/SkeletonLoader";

export default function SettingsPage() {
  const router = useRouter();
  const { language, setLanguage, languages, t } = useLanguage();
  const { darkMode, toggleDarkMode } = useTheme();
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const handleBack = () => {
    // Check if there's history to go back to
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      // Fallback to home page if no history
      router.push('/');
    }
  };

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);


  if (isLoading) {
    return <SettingsPageSkeleton />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-hidden font-sans pb-24">
      {/* Ambient Background Blobs */}
      <div className="fixed top-[-100px] right-[-100px] w-[400px] h-[400px] bg-primary/20 rounded-full blur-[80px] pointer-events-none mix-blend-multiply"></div>
      <div className="fixed top-[20%] left-[-50px] w-[300px] h-[300px] bg-secondary/60 rounded-full blur-[60px] pointer-events-none mix-blend-multiply"></div>

      {/* Header */}
      <header className="relative z-10 pt-4 px-4 pb-3 flex items-center gap-3">
        <motion.button
          onClick={handleBack}
          whileTap={{ scale: 0.95 }}
          className="w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm border border-white/40 flex items-center justify-center text-foreground active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" />
        </motion.button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-heading font-bold text-foreground truncate">
            {t("common.settings")}
          </h1>
        </div>
      </header>

      {/* Settings Content */}
      <main className="relative z-10 px-4 mt-4 space-y-3">
        {/* Language Selection */}
        <div className="bg-card/90 backdrop-blur-xl border border-white/50 rounded-[24px] overflow-hidden shadow-sm">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsLanguageOpen(!isLanguageOpen)}
            className="w-full p-4 flex items-center justify-between active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-foreground text-sm">{t("settings.language")}</h3>
                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                  {languages.find((l) => l.code === language)?.nativeName || "O'zbek"}
                </p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: isLanguageOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronLeft className="w-5 h-5 text-muted-foreground rotate-90" />
            </motion.div>
          </motion.button>

          {/* Language Options */}
          <AnimatePresence>
            {isLanguageOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-border/50"
              >
                <div className="p-2 space-y-1">
                  {languages.map((lang) => (
                    <motion.button
                      key={lang.code}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setLanguage(lang.code);
                        setIsLanguageOpen(false);
                      }}
                      className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${
                        language === lang.code
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <span className="text-2xl">{lang.flag}</span>
                      <div className="flex-1 text-left">
                        <div className="font-bold text-foreground text-sm">
                          {lang.nativeName}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {lang.name}
                        </div>
                      </div>
                      {language === lang.code && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                        >
                          <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dark Mode Toggle */}
        <div className="bg-card/90 backdrop-blur-xl border border-white/50 rounded-[24px] overflow-hidden shadow-sm">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={toggleDarkMode}
            className="w-full p-4 flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                {darkMode ? (
                  <Moon className="w-5 h-5 text-foreground" />
                ) : (
                  <Sun className="w-5 h-5 text-foreground" />
                )}
              </div>
              <div className="text-left">
                <h3 className="font-bold text-foreground text-sm">{t("settings.darkMode")}</h3>
                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                  {darkMode ? t("common.success") : t("common.cancel")}
                </p>
              </div>
            </div>
            <motion.div
              animate={{ x: darkMode ? 0 : 0 }}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${
                darkMode ? "bg-primary" : "bg-muted"
              }`}
            >
              <motion.div
                animate={{ x: darkMode ? 24 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="w-4 h-4 rounded-full bg-white shadow-sm"
              />
            </motion.div>
          </motion.button>
        </div>

        {/* Notifications Settings */}
        <div className="bg-card/90 backdrop-blur-xl border border-white/50 rounded-[24px] overflow-hidden shadow-sm">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="w-full p-4 flex items-center justify-between active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-foreground" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-foreground text-sm">Notifications</h3>
                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                  {notificationsEnabled ? "Enabled" : "Disabled"}
                </p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: isNotificationsOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronLeft className="w-5 h-5 text-muted-foreground rotate-90" />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {isNotificationsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-border/50"
              >
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Bell className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Push Notifications</span>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                      className={`w-12 h-6 rounded-full p-1 transition-colors ${
                        notificationsEnabled ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <motion.div
                        animate={{ x: notificationsEnabled ? 24 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="w-4 h-4 rounded-full bg-white shadow-sm"
                      />
                    </motion.button>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      {soundEnabled ? (
                        <Volume2 className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <VolumeX className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium text-foreground">Sound</span>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className={`w-12 h-6 rounded-full p-1 transition-colors ${
                        soundEnabled ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <motion.div
                        animate={{ x: soundEnabled ? 24 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="w-4 h-4 rounded-full bg-white shadow-sm"
                      />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Privacy Settings */}
        <div className="bg-card/90 backdrop-blur-xl border border-white/50 rounded-[24px] overflow-hidden shadow-sm">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsPrivacyOpen(!isPrivacyOpen)}
            className="w-full p-4 flex items-center justify-between active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-foreground" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-foreground text-sm">Privacy</h3>
                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                  Privacy settings
                </p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: isPrivacyOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronLeft className="w-5 h-5 text-muted-foreground rotate-90" />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {isPrivacyOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-border/50"
              >
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Shield className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Show Location</span>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowLocation(!showLocation)}
                      className={`w-12 h-6 rounded-full p-1 transition-colors ${
                        showLocation ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <motion.div
                        animate={{ x: showLocation ? 24 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="w-4 h-4 rounded-full bg-white shadow-sm"
                      />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
