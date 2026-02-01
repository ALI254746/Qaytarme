"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Search,
  SlidersHorizontal,
  Smartphone,
  PawPrint,
  Key,
  MapPin,
  Plus,
  Wallet,
  Clock,
  Filter,
  PackageSearch,
  Settings2,
  SearchCheck,
  PackageCheck,
  Award,
  X,
  ChevronRight,
  Phone,
  MessageCircle,
  Calendar,
  Hash,
  Share2,
  Heart,
  Flag,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import NotificationsSheet from "@/components/NotificationsSheet";
import {
  FeedItemSkeleton,
  CategorySkeleton,
  HomePageSkeleton,
} from "@/components/SkeletonLoader";
import PullToRefresh from "@/components/PullToRefresh";
import EmptyState from "@/components/EmptyState";
import { useUIContext } from "@/context/UIContext";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/components/ToastProvider";

const Background3D = dynamic(() => import("@/components/Background3D"), {
  ssr: false,
});

// Categories will be defined inside component to use translation

const feedItems = [
  {
    id: 1,
    title: "Golden Retriever",
    category: "pets",
    type: "Lost",
    time: "2h ago",
    distance: "0.5km",
    image:
      "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600",
    height: "h-64",
    accent: "bg-black/60 text-white backdrop-blur-md border border-white/10",
    shadow: "shadow-black/5",
    description:
      "Lost my beloved Golden Retriever near City Park. He's very friendly and responds to the name 'Max'. Last seen wearing a blue collar with a tag. Please help me find him!",
    location: "City Park, Tashkent",
    date: "March 15, 2024",
    contact: "+998 90 123 45 67",
    tags: ["Pet", "Dog", "Golden Retriever"],
  },
  {
    id: 2,
    title: "AirPods Pro Case",
    category: "tech",
    type: "Found",
    time: "5m ago",
    distance: "100m",
    image:
      "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&q=80&w=600",
    height: "h-48",
    accent: "bg-white/90 text-zinc-900 backdrop-blur-md border border-white/40",
    shadow: "shadow-zinc-500/10",
    description:
      "Found an AirPods Pro case near the metro station. It's a white case with a small scratch on the side. If this is yours, please contact me with the serial number.",
    location: "Chilonzor Metro Station",
    date: "March 16, 2024",
    contact: "+998 90 987 65 43",
    tags: ["Electronics", "AirPods", "Case"],
  },
  {
    id: 3,
    title: "Vintage Keys",
    category: "keys",
    type: "Found",
    time: "1d ago",
    distance: "2.1km",
    image:
      "https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&q=80&w=600",
    height: "h-40",
    accent: "bg-white/90 text-zinc-900 backdrop-blur-md border border-white/40",
    shadow: "shadow-zinc-500/10",
    description:
      "Found a set of vintage keys at the bus stop. They appear to be old-style keys, possibly for an antique lock. Please describe the keys to claim them.",
    location: "Bus Stop, Yunusabad",
    date: "March 14, 2024",
    contact: "+998 90 555 12 34",
    tags: ["Keys", "Vintage", "Antique"],
  },
  {
    id: 4,
    title: "Silver Macbook Air",
    category: "tech",
    type: "Lost",
    time: "4h ago",
    distance: "3.5km",
    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=600",
    height: "h-56",
    accent: "bg-black/60 text-white backdrop-blur-md border border-white/10",
    shadow: "shadow-black/5",
    description:
      "Lost my MacBook Air 13-inch in a coffee shop. It's a silver model with a sticker on the lid. Contains important work files. Reward offered for return!",
    location: "Coffee Shop, Navoi Street",
    date: "March 16, 2024",
    contact: "+998 90 777 88 99",
    tags: ["Laptop", "MacBook", "Electronics"],
  },
  {
    id: 5,
    title: "Leather Wallet",
    category: "wallet",
    type: "Lost",
    time: "6h ago",
    distance: "1.2km",
    image:
      "https://images.unsplash.com/photo-1605733513597-a8f8341084e6?auto=format&fit=crop&q=80&w=600",
    height: "h-48",
    accent: "bg-black/60 text-white backdrop-blur-md border border-white/10",
    shadow: "shadow-black/5",
    description:
      "Lost my brown leather wallet with my ID and credit cards inside. It has a small tear on the corner. Please return if found - very important!",
    location: "Shopping Mall, Amir Temur Square",
    date: "March 16, 2024",
    contact: "+998 90 111 22 33",
    tags: ["Wallet", "Leather", "Personal"],
  },
];

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [_isRefreshing, setIsRefreshing] = useState(false);
  const [profileMounted, setProfileMounted] = useState(false);
  const [selectedItem, setSelectedItem] = useState<
    (typeof feedItems)[0] | null
  >(null);
  const [itemDetailMounted, setItemDetailMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [favoriteItems, setFavoriteItems] = useState<Set<number>>(new Set());
  const { setNavVisible } = useUIContext();
  const { t } = useLanguage();
  const { success, error: showError } = useToast();

  const categories = useMemo(
    () => [
      { id: "all", name: t("common.search"), icon: Filter },
      { id: "tech", name: t("search.electronics"), icon: Smartphone },
      { id: "pets", name: t("search.pets"), icon: PawPrint },
      { id: "keys", name: t("search.keys"), icon: Key },
      { id: "wallet", name: t("search.walletBags"), icon: Wallet },
    ],
    [t]
  );

  useEffect(() => {
    // Set mounted after component mounts
    const timer = setTimeout(() => {
      setMounted(true);
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setProfileMounted(true);
    setItemDetailMounted(true);
  }, []);

  // Prevent body scroll and hide bottom nav when item detail sheet is open
  useEffect(() => {
    if (selectedItem) {
      document.body.style.overflow = "hidden";
      setNavVisible(false);
    } else {
      document.body.style.overflow = "";
      setNavVisible(true);
    }
    return () => {
      document.body.style.overflow = "";
      setNavVisible(true);
    };
  }, [selectedItem, setNavVisible]);

  const triggerHaptic = () => {
    if (
      typeof window !== "undefined" &&
      window.navigator &&
      window.navigator.vibrate
    ) {
      window.navigator.vibrate(10);
    }
  };

  const handleShare = async (item: (typeof feedItems)[0]) => {
    triggerHaptic();
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: item.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      // Fallback: copy to clipboard
      const text = `${item.title}\n${item.description}\n${window.location.href}`;
      await navigator.clipboard.writeText(text);
      // You could show a toast here
    }
  };

  const handleReport = (item: (typeof feedItems)[0]) => {
    triggerHaptic();
    // Show report dialog or navigate to report page
    // For now, just log
    console.log("Report item:", item.id);
    // You could show a modal or navigate to a report page
  };

  const handleFavorite = (itemId: number) => {
    triggerHaptic();
    setFavoriteItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    triggerHaptic();
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  if (!mounted || isLoading) {
    return <HomePageSkeleton />;
  }

  const filteredFeed = (
    activeCategory === "all"
      ? feedItems
      : feedItems.filter((item) => item.category === activeCategory)
  ).filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.location.toLowerCase().includes(query) ||
      item.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  return (
    <div className="bg-background w-full min-h-screen relative font-sans pb-20">
      <Background3D />

      {/* Scrollable Feed Container */}
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="pt-6 px-4 space-y-5">
          {/* Header (Simplified) */}
          <header className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsProfileOpen(true)}
                className="active:scale-95 transition-transform"
              >
                <div className="w-9 h-9 rounded-full border border-zinc-200 relative overflow-hidden shadow-sm">
                  <Image
                    src="https://i.pravatar.cc/150?u=a"
                    alt="User"
                    fill
                    className="object-cover"
                  />
                </div>
              </button>
              <div className="flex flex-col">
                <h1 className="text-zinc-900 text-sm font-bold leading-tight text-shadow-sm">
                  {t("home.greeting")}, Aziza
                </h1>
                <p className="text-zinc-500 text-[10px] font-medium">
                  Tashkent
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsNotificationsOpen(true)}
              className="btn-3d w-9 h-9 rounded-full bg-white/60 backdrop-blur-xl border border-white/60 flex items-center justify-center text-zinc-800 relative"
            >
              <Bell className="w-5 h-5" strokeWidth={2} />
              <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
            </button>
          </header>

          {/* Search Bar (Compact) */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative z-20"
          >
            <motion.div
              whileFocus={{ scale: 1.02 }}
              className="flex items-center bg-white/70 backdrop-blur-2xl border border-white/60 rounded-[20px] px-4 h-11 shadow-sm transition-all duration-300 focus-within:bg-white focus-within:shadow-md"
            >
              <Search
                className="w-4 h-4 text-zinc-800 mr-2"
                strokeWidth={2.5}
              />
              <input
                type="text"
                placeholder={t("home.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-900 placeholder:text-zinc-400 font-medium h-full"
              />
              {searchQuery && (
                <motion.button
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSearchQuery("")}
                  className="p-1.5 text-zinc-400 hover:text-zinc-600"
                >
                  <X className="w-4 h-4" strokeWidth={2} />
                </motion.button>
              )}
              {!searchQuery && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1.5 text-zinc-400 hover:text-zinc-600"
                >
                  <SlidersHorizontal className="w-4 h-4" strokeWidth={2} />
                </motion.button>
              )}
            </motion.div>
          </motion.div>

          {/* Categories (Compact Row) */}
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-1 -mx-4 pl-4 items-center">
            {isLoading ? (
              <>
                {[1, 2, 3, 4, 5].map((i) => (
                  <CategorySkeleton key={i} />
                ))}
              </>
            ) : (
              categories.map((cat, i) => {
                const isActive = activeCategory === cat.id;
                return (
                  <motion.button
                    key={cat.id}
                    onClick={() => {
                      setActiveCategory(cat.id);
                      triggerHaptic();
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn(
                      "px-4 h-9 rounded-full flex items-center gap-1.5 border transition-all duration-300 shrink-0 text-xs font-semibold",
                      isActive
                        ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/25"
                        : "bg-white/50 backdrop-blur-md border-white/60 text-zinc-600 hover:bg-white/80"
                    )}
                  >
                    <cat.icon
                      className="w-3.5 h-3.5"
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    {cat.name}
                  </motion.button>
                );
              })
            )}
          </div>

          {/* Ultra-Slim Actions (Merged) */}
          <div className="grid grid-cols-2 gap-3 px-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Link href="/add?type=lost" onClick={triggerHaptic}>
                <motion.div
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98, y: 0 }}
                  className="btn-primary-3d bg-primary rounded-xl h-11 px-4 flex items-center justify-between border border-primary/50"
                >
                  <span className="text-primary-foreground text-xs font-bold text-shadow-sm">
                    {t("home.iLostIt")}
                  </span>
                  <Search
                    className="w-4 h-4 text-primary-foreground"
                    strokeWidth={2.5}
                  />
                </motion.div>
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Link href="/add?type=found" onClick={triggerHaptic}>
                <motion.div
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98, y: 0 }}
                  className="btn-3d glass-3d rounded-xl h-11 px-4 flex items-center justify-between"
                >
                  <span className="text-foreground text-xs font-bold text-shadow-sm">
                    {t("home.iFoundIt")}
                  </span>
                  <Plus className="w-4 h-4 text-foreground" strokeWidth={2.5} />
                </motion.div>
              </Link>
            </motion.div>
          </div>

          {/* Masonry Feed (Takes 60%+ Space) */}
          <section className="pt-2">
            <div className="flex items-center justify-between px-1 mb-3">
              <h2 className="text-lg font-bold text-zinc-900 font-heading">
                {t("home.recent")}
              </h2>
              <Link
                href="/search"
                className="text-[11px] font-bold text-zinc-400 hover:text-zinc-800 transition-colors"
              >
                {t("home.viewAll")}
              </Link>
            </div>

            {isLoading ? (
              <div className="columns-2 gap-3 space-y-3 px-0.5 pb-24">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <FeedItemSkeleton key={i} />
                ))}
              </div>
            ) : filteredFeed.length === 0 ? (
              <EmptyState
                icon={PackageSearch}
                title={t("home.noItems")}
                description={t("home.noItemsInCategory")}
                action={{
                  label: t("home.createFirstPost"),
                  onClick: () => (window.location.href = "/add"),
                }}
              />
            ) : (
              <motion.div
                layout
                className="columns-2 gap-3 space-y-3 px-0.5 pb-24"
              >
                <AnimatePresence mode="popLayout">
                  {filteredFeed.map((item) => (
                    <motion.div
                      layout="position"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{
                        opacity: 0,
                        scale: 0.9,
                        transition: { duration: 0.2 },
                      }}
                      transition={{
                        duration: 0.4,
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                      key={item.id}
                      className="break-inside-avoid relative group"
                      style={{ willChange: "transform, opacity" }}
                    >
                      <motion.div
                        onClick={() => {
                          setSelectedItem(item);
                          triggerHaptic();
                        }}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        className="card-3d relative rounded-[22px] overflow-hidden bg-white border border-white/60 transform-gpu cursor-pointer"
                      >
                        <div
                          className={cn(
                            "relative w-full overflow-hidden backface-hidden",
                            item.height
                          )}
                        >
                          <Image
                            src={item.image}
                            alt={item.title}
                            fill
                            sizes="(max-width: 768px) 50vw, 33vw"
                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                            priority={true}
                          />
                          {/* Gradient Overlay */}
                          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                          {/* Status Badge */}
                          <div
                            className={cn(
                              "absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg text-[8px] font-extrabold uppercase tracking-wider shadow-sm z-10",
                              item.accent
                            )}
                          >
                            {item.type === "Lost"
                              ? t("add.lost")
                              : t("add.found")}
                          </div>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                          <h3 className="font-bold text-white text-sm leading-tight mb-1 font-heading text-shadow-md">
                            {item.title}
                          </h3>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-white/90 text-[10px] font-medium">
                              <Clock className="w-3 h-3" />
                              <span>{item.time}</span>
                            </div>
                            <div className="flex items-center gap-1 text-white/90 text-[10px] font-medium">
                              <MapPin className="w-3 h-3" />
                              <span>{item.distance}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </section>
        </div>
      </PullToRefresh>
      {/* Notifications Sheet */}
      <NotificationsSheet
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      {/* Profile Sheet - 80% with drag control */}
      {profileMounted &&
        createPortal(
          <AnimatePresence>
            {isProfileOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsProfileOpen(false)}
                  className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                />
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="fixed left-0 right-0 bg-background z-[70] rounded-t-[32px] overflow-hidden shadow-2xl flex flex-col border-t border-white/40"
                  style={{
                    top: "20vh",
                    height: "80vh",
                    maxHeight: "80vh",
                    willChange: "transform",
                  }}
                  drag="y"
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={0.2}
                  onDragEnd={(e, { offset, velocity }) => {
                    if (offset.y > 100 || velocity.y > 500) {
                      setIsProfileOpen(false);
                    }
                  }}
                >
                  {/* Drag Handle */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-muted-foreground/20 rounded-full" />

                  {/* Close Button */}
                  <button
                    onClick={() => setIsProfileOpen(false)}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto p-6 pt-10 pb-20 flex flex-col items-center no-scrollbar overscroll-y-contain">
                    {/* Profile Header */}
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", damping: 20 }}
                      className="relative mb-6"
                    >
                      <div className="w-28 h-28 rounded-full border-4 border-white/80 shadow-2xl relative shrink-0 bg-gradient-to-br from-primary/20 to-primary/5">
                        <Image
                          src="https://i.pravatar.cc/300?u=aziz_profile"
                          alt="Profile"
                          fill
                          className="object-cover rounded-full"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-primary to-primary/80 text-white p-2 rounded-full border-4 border-background shadow-lg">
                          <Award className="w-4 h-4" />
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="text-center mb-6"
                    >
                      <h2 className="text-2xl font-heading font-bold text-foreground mb-1.5">
                        Aziz Al-Rahman
                      </h2>
                      <p className="text-muted-foreground text-sm font-medium">
                        @aziz_dev
                      </p>
                      <p className="text-muted-foreground/70 text-xs font-medium mt-1">
                        Member since March 2024
                      </p>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="grid grid-cols-3 gap-3 w-full mb-8 shrink-0"
                    >
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200/50 dark:border-blue-800/30 p-4 rounded-2xl flex flex-col items-center shadow-sm hover:shadow-md transition-shadow">
                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                          12
                        </span>
                        <span className="text-[10px] font-bold text-blue-600/70 dark:text-blue-400/70 uppercase tracking-wide">
                          Found
                        </span>
                      </div>
                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 border border-emerald-200/50 dark:border-emerald-800/30 p-4 rounded-2xl flex flex-col items-center shadow-sm hover:shadow-md transition-shadow">
                        <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                          8
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wide">
                          Returned
                        </span>
                      </div>
                      <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border border-amber-200/50 dark:border-amber-800/30 p-4 rounded-2xl flex flex-col items-center shadow-sm hover:shadow-md transition-shadow">
                        <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 mb-1">
                          4.5k
                        </span>
                        <span className="text-[10px] font-bold text-amber-600/70 dark:text-amber-400/70 uppercase tracking-wide">
                          Karma
                        </span>
                      </div>
                    </motion.div>

                    {/* Menu Items */}
                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="w-full space-y-3 shrink-0"
                    >
                      <Link
                        href="/profile"
                        className="w-full bg-gradient-to-r from-card to-card/80 hover:from-card/90 hover:to-card/70 p-4 rounded-xl border border-border/50 flex items-center justify-between active:scale-[0.98] transition-all shadow-sm hover:shadow-md group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 group-hover:from-blue-500/20 group-hover:to-blue-500/10 flex items-center justify-center transition-all">
                            <SearchCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="font-bold text-foreground text-base">
                            {t("profile.activePosts")}
                          </span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                      </Link>
                      <Link
                        href="/settings"
                        className="w-full bg-gradient-to-r from-card to-card/80 hover:from-card/90 hover:to-card/70 p-4 rounded-xl border border-border/50 flex items-center justify-between active:scale-[0.98] transition-all shadow-sm hover:shadow-md group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 group-hover:from-purple-500/20 group-hover:to-purple-500/10 flex items-center justify-center transition-all">
                            <Settings2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <span className="font-bold text-foreground text-base text-shadow-sm">
                            {t("common.settings")}
                          </span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                      </Link>
                    </motion.div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* Item Detail Sheet - 85% with drag control */}
      {itemDetailMounted &&
        createPortal(
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
                    willChange: "transform",
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
                      <div
                        className={cn(
                          "absolute top-4 left-4 px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-wider shadow-lg z-10",
                          selectedItem.accent
                        )}
                      >
                        {selectedItem.type === "Lost"
                          ? t("add.lost")
                          : t("add.found")}
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
                              favoriteItems.has(selectedItem.id) &&
                                "fill-current"
                            )}
                            strokeWidth={
                              favoriteItems.has(selectedItem.id) ? 0 : 2.5
                            }
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
                        <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
                          {selectedItem.title}
                        </h2>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            <span>{selectedItem.time}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4" />
                            <span>{selectedItem.distance}</span>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <h3 className="text-sm font-bold text-foreground mb-2 uppercase tracking-wide">
                          {t("detail.description")}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {selectedItem.description}
                        </p>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-card border border-border/50 p-4 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4 text-primary" />
                            <span className="text-xs font-bold text-muted-foreground uppercase">
                              {t("detail.location")}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-foreground">
                            {selectedItem.location}
                          </p>
                        </div>
                        <div className="bg-card border border-border/50 p-4 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span className="text-xs font-bold text-muted-foreground uppercase text-shadow-sm">
                              {t("detail.date")}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-foreground">
                            {selectedItem.date}
                          </p>
                        </div>
                      </div>

                      {/* Tags */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Hash className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs font-bold text-muted-foreground uppercase text-shadow-sm">
                            {t("detail.tags")}
                          </span>
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

                      {/* Contact Section */}
                      <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <MessageCircle className="w-4 h-4 text-primary" />
                          <span className="text-xs font-bold text-primary uppercase text-shadow-sm">
                            {t("detail.contact")}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-foreground">
                              {selectedItem.contact}
                            </p>
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
