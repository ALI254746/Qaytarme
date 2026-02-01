"use client";

import { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { Settings2, SearchCheck, PackageCheck, Award, MapPin, Plus, X, Clock, Calendar, Hash, Phone, MessageCircle, Share2, Heart, Flag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { useUIContext } from "@/context/UIContext";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { ProfilePageSkeleton } from "@/components/SkeletonLoader";

interface ProfileItem {
  id: number;
  title: string;
  type: "lost" | "found";
  image: string;
  location: string;
  date: string;
  time: string;
  description: string;
  tags: string[];
  contact?: string;
}

const activePosts: ProfileItem[] = [
  {
    id: 1,
    title: "Nike Air Max",
    type: "lost",
    image: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=400&q=80",
    location: "City Park",
    date: "March 15, 2024",
    time: "2h ago",
    description: "Lost my Nike Air Max sneakers at the park. They're white with a blue swoosh. Please help me find them!",
    tags: ["Shoes", "Nike", "White"],
    contact: "+998 90 123 45 67"
  },
  {
    id: 2,
    title: "Beige Fedora",
    type: "found",
    image: "https://images.unsplash.com/photo-1533827432537-70133748f5c8?auto=format&fit=crop&w=400&q=80",
    location: "Central Station",
    date: "March 14, 2024",
    time: "1d ago",
    description: "Found a beige fedora hat at the central station. If this is yours, please contact me with a description.",
    tags: ["Hat", "Fedora", "Beige"],
    contact: "+998 90 987 65 43"
  },
  {
    id: 4,
    title: "House Keys",
    type: "lost",
    image: "https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=400&q=80",
    location: "Library",
    date: "March 13, 2024",
    time: "2d ago",
    description: "Lost my house keys at the library. They're on a keychain with a small red tag. Very important!",
    tags: ["Keys", "House", "Keychain"],
    contact: "+998 90 555 12 34"
  }
];

const historyPosts: ProfileItem[] = [
  {
    id: 5,
    title: "iPhone 13",
    type: "found",
    image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&q=80&w=200",
    location: "Coffee Shop",
    date: "March 10, 2024",
    time: "5d ago",
    description: "Found iPhone 13 at coffee shop. Returned to owner successfully.",
    tags: ["iPhone", "Phone", "Returned"]
  },
  {
    id: 6,
    title: "Wallet",
    type: "lost",
    image: "https://images.unsplash.com/photo-1605733513597-a8f8341084e6?auto=format&fit=crop&q=80&w=600",
    location: "Shopping Mall",
    date: "March 8, 2024",
    time: "7d ago",
    description: "Lost wallet. Found and returned by another user.",
    tags: ["Wallet", "Returned"]
  }
];

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [selectedItem, setSelectedItem] = useState<ProfileItem | null>(null);
  const [itemDetailMounted, setItemDetailMounted] = useState(false);
  const [favoriteItems, setFavoriteItems] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const { setNavVisible } = useUIContext();
  const { t } = useLanguage();

  useEffect(() => {
    if (typeof window !== 'undefined' && WebApp.initDataUnsafe?.user) {
      setUser(WebApp.initDataUnsafe.user);
    }
    setItemDetailMounted(true);
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (selectedItem) {
      document.body.style.overflow = 'hidden';
      setNavVisible(false);
    } else {
      document.body.style.overflow = '';
      setNavVisible(true);
    }
    return () => {
      document.body.style.overflow = '';
      setNavVisible(true);
    };
  }, [selectedItem, setNavVisible]);

  const currentItems = activeTab === "active" ? activePosts : historyPosts;

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(10);
    }
  };

  const handleShare = async (item: ProfileItem) => {
    triggerHaptic();
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: item.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      const text = `${item.title}\n${item.description}\n${window.location.href}`;
      await navigator.clipboard.writeText(text);
    }
  };

  const handleReport = (item: ProfileItem) => {
    triggerHaptic();
    console.log('Report item:', item.id);
  };

  const handleFavorite = (itemId: number) => {
    triggerHaptic();
    setFavoriteItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return <ProfilePageSkeleton />;
  }

  return (
    <div className="bg-background w-full min-h-screen relative font-sans flex flex-col pb-20">
      {/* Header / Settings Action */}
      <header className="pt-4 px-4 flex items-center justify-end">
          <Link href="/settings">
              <button className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-foreground hover:bg-card/80 transition-all active:scale-95">
                  <Settings2 className="w-5 h-5" />
              </button>
          </Link>
      </header>

      {/* Profile Hero Section */}
      <section className="flex flex-col items-center mt-4 px-4">
          <div className="w-24 h-24 rounded-full border-4 border-primary relative overflow-hidden">
            <Image 
              src={user?.photo_url || "https://i.pravatar.cc/300?u=aziz_profile"} 
              alt="Profile" 
              fill
              className="object-cover"
            />
          </div>

          <h1 className="text-2xl font-heading font-bold text-foreground mt-4">
            {user?.first_name || "Aziz Al-Rahman"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            @{user?.username || "aziz_dev"} • {t("profile.memberSince")} March 2024
          </p>
      </section>

      {/* Stats Row */}
      <section className="px-4 mt-6">
          <div className="flex items-center justify-between gap-3">
              {/* Stat 1 */}
              <div className="flex-1 bg-card border border-border rounded-2xl p-4 flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <SearchCheck className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                      <span className="block text-xl font-bold text-foreground">12</span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        {t("profile.found")}
                      </span>
                  </div>
              </div>

              {/* Stat 2 */}
              <div className="flex-1 bg-card border border-border rounded-2xl p-4 flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent-foreground">
                      <PackageCheck className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                      <span className="block text-xl font-bold text-foreground">8</span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t("profile.returned")}</span>
                  </div>
              </div>

              {/* Stat 3 */}
              <div className="flex-1 bg-card border border-border rounded-2xl p-4 flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground">
                      <Award className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                      <span className="block text-xl font-bold text-foreground">
                        4.5k
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t("profile.karma")}</span>
                  </div>
              </div>
          </div>
      </section>

      {/* Tab Switcher & Content */}
      <main className="mt-6 flex-1 overflow-y-auto">
          {/* Pill Tabs */}
          <div className="px-4 mb-4 shrink-0">
              <div className="w-full bg-muted/50 p-1 rounded-full flex relative border border-border">
                  <motion.button
                    onClick={() => setActiveTab("active")}
                    className={cn(
                      "flex-1 py-2.5 px-4 rounded-full font-bold text-sm transition-all text-center relative z-10",
                      activeTab === "active"
                        ? "text-foreground"
                        : "text-muted-foreground font-medium"
                    )}
                  >
                    {t("profile.activePosts")}
                    {activeTab === "active" && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-card rounded-full -z-10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </motion.button>
                  <motion.button
                    onClick={() => setActiveTab("history")}
                    className={cn(
                      "flex-1 py-2.5 px-4 rounded-full font-bold text-sm transition-all text-center relative z-10",
                      activeTab === "history"
                        ? "text-foreground"
                        : "text-muted-foreground font-medium"
                    )}
                  >
                    {t("profile.history")}
                    {activeTab === "history" && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-card rounded-full -z-10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </motion.button>
              </div>
          </div>

          {/* Masonry Grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              layout
              className="px-4 columns-2 gap-3 pb-4 space-y-3"
            >
              {currentItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedItem(item)}
                  className="break-inside-avoid w-full bg-card rounded-2xl overflow-hidden border border-border group hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="relative h-32 overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className={cn(
                      "absolute top-2 right-2 bg-background/90 rounded-full px-2 py-1 text-[10px] font-bold uppercase",
                      item.type === "lost" ? "text-destructive" : "text-primary"
                    )}>
                      {item.type}
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-foreground text-sm leading-tight">{item.title}</h3>
                    <div className="flex items-center gap-1 mt-1.5 text-muted-foreground text-xs">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{item.location}</span>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* New Alert Button (only in active tab) */}
              {activeTab === "active" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: currentItems.length * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="break-inside-avoid w-full bg-primary/10 rounded-2xl p-4 border border-primary/20 flex flex-col justify-center items-center text-center gap-2 cursor-pointer min-h-[120px]"
                >
                  <Link href="/add">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <Plus className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-primary">{t("profile.newAlert")}</span>
                  </Link>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
      </main>

      {/* Item Detail Sheet */}
      {itemDetailMounted && createPortal(
        <AnimatePresence>
          {selectedItem && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedItem(null)}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed left-0 right-0 bg-background z-[70] rounded-t-[32px] overflow-hidden shadow-2xl flex flex-col border-t border-white/40"
                style={{
                  top: "15vh",
                  height: "85vh",
                  maxHeight: "85vh",
                  willChange: "transform"
                }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.2}
                onDragEnd={(e, { offset, velocity }) => {
                  if (offset.y > 100 || velocity.y > 500) {
                    setSelectedItem(null);
                  }
                }}
              >
                {/* Drag Handle */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-muted-foreground/20 rounded-full" />
                
                {/* Close Button */}
                <button
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 z-10"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Content */}
                <div className="flex-1 overflow-y-auto no-scrollbar overscroll-y-contain">
                  {/* Image Section */}
                  <div className="relative w-full h-64 bg-gradient-to-br from-muted/20 to-muted/5">
                    <Image
                      src={selectedItem.image}
                      alt={selectedItem.title}
                      fill
                      className="object-cover"
                      sizes="100vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                    
                    {/* Status Badge */}
                    <div className={cn(
                      "absolute top-4 left-4 px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-wider shadow-lg z-10",
                      selectedItem.type === "lost"
                        ? "bg-destructive/90 text-white"
                        : "bg-primary/90 text-white"
                    )}>
                      {selectedItem.type}
                    </div>

                    {/* Action Buttons */}
                    <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                      <motion.button
                        whileHover={{ scale: 1.1, y: -1 }}
                        whileTap={{ scale: 0.9, y: 0 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFavorite(selectedItem.id);
                        }}
                        className={cn(
                          "w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center transition-all shadow-lg",
                          favoriteItems.has(selectedItem.id)
                            ? "bg-rose-500/90 border-rose-400/50 text-white"
                            : "bg-white/80 border-white/60 text-rose-500 hover:bg-white/90"
                        )}
                      >
                        <Heart 
                          className={cn(
                            "w-5 h-5 transition-all",
                            favoriteItems.has(selectedItem.id) && "fill-current"
                          )} 
                          strokeWidth={favoriteItems.has(selectedItem.id) ? 0 : 2.5}
                        />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1, y: -1 }}
                        whileTap={{ scale: 0.9, y: 0 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(selectedItem);
                        }}
                        className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-white/60 text-primary flex items-center justify-center hover:bg-white/90 transition-all shadow-lg"
                      >
                        <Share2 className="w-5 h-5" strokeWidth={2.5} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1, y: -1 }}
                        whileTap={{ scale: 0.9, y: 0 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReport(selectedItem);
                        }}
                        className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-white/60 text-muted-foreground flex items-center justify-center hover:bg-white/90 hover:text-destructive transition-all shadow-lg"
                      >
                        <Flag className="w-5 h-5" strokeWidth={2.5} />
                      </motion.button>
                    </div>
                  </div>

                  {/* Details Section */}
                  <div className="p-6 pb-20 space-y-6">
                    {/* Title & Basic Info */}
                    <div>
                      <h2 className="text-2xl font-heading font-bold text-foreground mb-2">{selectedItem.title}</h2>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          <span>{selectedItem.time}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          <span>{selectedItem.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <h3 className="text-sm font-bold text-foreground mb-2 uppercase tracking-wide">{t("detail.description")}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{selectedItem.description}</p>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-card border border-border/50 p-4 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span className="text-xs font-bold text-muted-foreground uppercase">{t("detail.location")}</span>
                        </div>
                        <p className="text-sm font-semibold text-foreground">{selectedItem.location}</p>
                      </div>
                      <div className="bg-card border border-border/50 p-4 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-primary" />
                          <span className="text-xs font-bold text-muted-foreground uppercase">{t("detail.date")}</span>
                        </div>
                        <p className="text-sm font-semibold text-foreground">{selectedItem.date}</p>
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Hash className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-bold text-muted-foreground uppercase">{t("detail.tags")}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedItem.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Contact Section (only for active posts) */}
                    {selectedItem.contact && (
                      <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <MessageCircle className="w-4 h-4 text-primary" />
                          <span className="text-xs font-bold text-primary uppercase">{t("detail.contact")}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-foreground">{selectedItem.contact}</p>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md shadow-primary/25"
                          >
                            <Phone className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md shadow-primary/25"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
