"use client";

import { 
  ChevronLeft, 
  Search,
  Filter,
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle2,
  HeartHandshake,
  Sparkles,
  TrendingUp,
  X,
  Star,
  AlertCircle,
  Info, 
  Calendar,
  Hash,
  Phone,
  MessageCircle,
  Smartphone,
  Wallet,
  PawPrint,
  Key,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import EmptyState from "@/components/EmptyState";
import { useUIContext } from "@/context/UIContext";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { MatchesPageSkeleton } from "@/components/SkeletonLoader";

// Mock data - My posts
const myPosts = [
  {
    id: 1,
    title: "Silver Macbook Air",
    category: "tech",
    type: "lost",
    image:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca4?auto=format&fit=crop&q=80&w=200",
    location: "Central Library",
    date: "2024-03-15",
    time: "4h ago",
    description: "Silver MacBook Air, 13 inch, with stickers on the lid",
    tags: ["silver", "laptop", "sticker"],
  },
  {
    id: 2,
    title: "Leather Wallet",
    category: "wallet",
    type: "lost",
    image:
      "https://images.unsplash.com/photo-1605733513597-a8f8341084e6?auto=format&fit=crop&q=80&w=200",
    location: "City Park",
    date: "2024-03-14",
    time: "1d ago",
    description: "Brown leather wallet with ID and credit cards",
    tags: ["brown", "leather", "wallet"],
  },
];

// Mock data - Other users' posts that might match
const potentialMatches = [
  {
    id: 101,
    userId: 1,
    userName: "Sarah Chen",
    userAvatar: "https://i.pravatar.cc/150?u=sarah",
    title: 'MacBook Pro 14"',
    category: "tech",
    type: "found",
    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=200",
    location: "Central Library",
    date: "2024-03-15",
    time: "2h ago",
    distance: "0.5km",
    matchScore: 85,
    matchReasons: ["Same location", "Similar item", "Same date"],
    matchedWith: 1,
    description: "Found a MacBook near the library entrance",
    tags: ["macbook", "laptop", "silver"],
    isOnline: true,
    verified: true,
  },
  {
    id: 102,
    userId: 2,
    userName: "Alex Johnson",
    userAvatar: "https://i.pravatar.cc/150?u=alex",
    title: "iPhone 13 Pro",
    category: "tech",
    type: "found",
    image:
      "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&q=80&w=200",
    location: "City Park",
    date: "2024-03-14",
    time: "5h ago",
    distance: "1.2km",
    matchScore: 45,
    matchReasons: ["Same category"],
    matchedWith: null,
    description: "Found iPhone near the fountain",
    tags: ["iphone", "phone"],
    isOnline: false,
    verified: false,
  },
  {
    id: 103,
    userId: 3,
    userName: "Emma Wilson",
    userAvatar: "https://i.pravatar.cc/150?u=emma",
    title: "Brown Leather Wallet",
    category: "wallet",
    type: "found",
    image:
      "https://images.unsplash.com/photo-1605733513597-a8f8341084e6?auto=format&fit=crop&q=80&w=200",
    location: "City Park",
    date: "2024-03-14",
    time: "1d ago",
    distance: "0.8km",
    matchScore: 92,
    matchReasons: ["Same location", "Exact match", "Same date", "Same color"],
    matchedWith: 2,
    description: "Found wallet with cards inside",
    tags: ["brown", "leather", "wallet"],
    isOnline: true,
    verified: true,
  },
  {
    id: 104,
    userId: 4,
    userName: "David Kim",
    userAvatar: "https://i.pravatar.cc/150?u=david",
    title: "MacBook Air Silver",
    category: "tech",
    type: "found",
    image:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca4?auto=format&fit=crop&q=80&w=200",
    location: "Library Area",
    date: "2024-03-15",
    time: "3h ago",
    distance: "0.3km",
    matchScore: 78,
    matchReasons: ["Same location", "Exact match", "Same date"],
    matchedWith: 1,
    description: "Silver MacBook found at library",
    tags: ["macbook", "silver", "laptop"],
    isOnline: false,
    verified: true,
  },
];

export default function MatchesPage() {
  const [activeFilter, setActiveFilter] = useState<"all" | "high" | "medium">(
    "all"
  );
  const [selectedMyPost, setSelectedMyPost] = useState<number | null>(null);
  const [expandedMatch, setExpandedMatch] = useState<number | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMatch, setSelectedMatch] = useState<
    (typeof potentialMatches)[0] | null
  >(null);
  const [matchDetailMounted, setMatchDetailMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { setNavVisible } = useUIContext();
  const { t } = useLanguage();

  useEffect(() => {
    setMatchDetailMounted(true);
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (selectedMatch) {
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
  }, [selectedMatch, setNavVisible]);

  const filters = [
    { id: "all", label: t("matches.allMatches"), icon: Filter },
    { id: "high", label: t("matches.highMatch"), icon: Star },
    { id: "medium", label: t("matches.medium"), icon: TrendingUp },
  ];

  // Filter matches based on selected my post
  const filteredMatches = selectedMyPost
    ? potentialMatches.filter((m) => m.matchedWith === selectedMyPost)
    : potentialMatches;

  // Filter by match score
  const scoreFilteredMatches =
    activeFilter === "all"
      ? filteredMatches
      : activeFilter === "high"
      ? filteredMatches.filter((m) => m.matchScore >= 75)
      : filteredMatches.filter((m) => m.matchScore >= 50 && m.matchScore < 75);

  // Filter by search query
  const searchFilteredMatches = searchQuery.trim()
    ? scoreFilteredMatches.filter(
        (m) =>
          m.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : scoreFilteredMatches;

  const getMatchColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (score >= 60) return "text-blue-600 bg-blue-50 border-blue-200";
    return "text-amber-600 bg-amber-50 border-amber-200";
  };

  const getMatchLabel = (score: number) => {
    if (score >= 80) return t("matches.highMatchLabel");
    if (score >= 60) return t("matches.mediumMatch");
    return t("matches.lowMatch");
  };

  const getMatchIcon = (score: number) => {
    if (score >= 80) return Star;
    if (score >= 60) return TrendingUp;
    return AlertCircle;
  };

  if (isLoading) {
    return <MatchesPageSkeleton />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-hidden font-sans pb-24">
      {/* Ambient Background Blobs */}
      <div className="fixed top-[-100px] right-[-100px] w-[400px] h-[400px] bg-primary/20 rounded-full blur-[80px] pointer-events-none mix-blend-multiply"></div>
      <div className="fixed top-[20%] left-[-50px] w-[300px] h-[300px] bg-secondary/60 rounded-full blur-[60px] pointer-events-none mix-blend-multiply"></div>

      {/* Header - Compact for Telegram Mini App */}
      <header className="relative z-10 pt-4 px-4 pb-3 flex items-center gap-3">
          <Link href="/">
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm border border-white/40 flex items-center justify-center text-foreground active:scale-95 transition-transform"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
          </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-heading font-bold text-foreground truncate">
            {t("common.matches")}
          </h1>
          <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
            {searchFilteredMatches.length} {t("matches.found")}
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsSearchOpen(true)}
          className="w-9 h-9 rounded-full bg-transparent flex items-center justify-center text-foreground hover:bg-card/20 active:scale-95 transition-colors"
        >
          <Search className="w-4.5 h-4.5" />
        </motion.button>
      </header>

      {/* Search Modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSearchOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border/50 shadow-lg"
            >
              <div className="px-4 pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsSearchOpen(false)}
                    className="w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm border border-white/40 flex items-center justify-center text-foreground active:scale-95 transition-transform"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </motion.button>
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder={t("common.search") + "..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                      className="w-full h-10 pl-10 pr-4 bg-card/50 border border-border/50 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:bg-card transition-all"
                    />
                    {searchQuery && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Combined Filters - Compact Design */}
      <div className="relative z-10 px-4 mb-3">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
          {/* My Posts Filter - Compact */}
          {myPosts.length > 0 && (
            <div className="flex items-center gap-3 shrink-0 pr-4">
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.95, y: 0 }}
                onClick={() => setSelectedMyPost(null)}
                className={`h-14 w-14 rounded-[33px] transition-all shrink-0 flex items-center justify-center ${
                  selectedMyPost === null
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/30 shadow-md shadow-primary/25"
                    : "bg-card border border-border/50 text-muted-foreground hover:bg-card/80 shadow-sm"
                }`}
              >
                <X className="w-6 h-6" strokeWidth={selectedMyPost === null ? 2.5 : 2} />
              </motion.button>
              {myPosts.map((post) => {
                // Get icon based on category
                let CategoryIcon = MapPin;
                if (post.category === "tech") CategoryIcon = Smartphone;
                else if (post.category === "wallet") CategoryIcon = Wallet;
                else if (post.category === "pets") CategoryIcon = PawPrint;
                else if (post.category === "keys") CategoryIcon = Key;

                return (
                  <motion.button
                    key={post.id}
                    whileHover={{ scale: 1.05, y: -1 }}
                    whileTap={{ scale: 0.95, y: 0 }}
                    onClick={() => setSelectedMyPost(post.id)}
                    className={cn(
                      "h-14 w-14 rounded-[33px] transition-all shrink-0 flex items-center justify-center",
                      selectedMyPost === post.id
                        ? "bg-primary text-primary-foreground ring-2 ring-primary/30 shadow-md shadow-primary/25"
                        : "bg-card border border-border/50 text-muted-foreground hover:bg-card/80 shadow-sm"
                    )}
                  >
                    <CategoryIcon 
                      className={cn(
                        "w-6 h-6",
                        selectedMyPost === post.id && "text-primary-foreground"
                      )} 
                      strokeWidth={selectedMyPost === post.id ? 2.5 : 2}
                    />
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* Match Score Filter - Compact */}
          <div className="flex gap-3 flex-1 min-w-0">
            {filters.map((filter) => {
              const FilterIcon = filter.icon;
              return (
                <motion.button
                  key={filter.id}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.95, y: 0 }}
                  onClick={() =>
                    setActiveFilter(filter.id as "all" | "high" | "medium")
                  }
                  className={`h-14 w-14 rounded-[33px] transition-all shrink-0 flex items-center justify-center ${
                    activeFilter === filter.id
                      ? "bg-primary text-primary-foreground ring-2 ring-primary/30 shadow-md shadow-primary/25"
                      : "bg-card border border-border/50 text-muted-foreground hover:bg-card/80 shadow-sm"
                  }`}
                >
                  <FilterIcon 
                    className="w-6 h-6" 
                    strokeWidth={activeFilter === filter.id ? 2.5 : 2}
                  />
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Matches List */}
      <main className="relative z-10 px-6 flex-1 overflow-y-auto">
        {searchFilteredMatches.length === 0 ? (
          <EmptyState
            icon={HeartHandshake}
            title={t("matches.noMatches")}
            description={
              searchQuery.trim()
                ? t("matches.noMatches")
                : selectedMyPost
                ? t("matches.noMatches")
                : t("matches.noMatches")
            }
          />
        ) : (
          <div className="space-y-4 pb-6">
            <AnimatePresence>
              {searchFilteredMatches
                .sort((a, b) => b.matchScore - a.matchScore)
                .map((match, index) => {
                  const MatchIcon = getMatchIcon(match.matchScore);
                  const isExpanded = expandedMatch === match.id;

                  return (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                      layout
                    >
                      <motion.div
                        whileHover={{ scale: 1.01, y: -2 }}
                        onClick={(e) => {
                          // Don't open detail if clicking on buttons or links
                          const target = e.target as HTMLElement;
                          if (target.closest("button") || target.closest("a")) {
                            return;
                          }
                          setSelectedMatch(match);
                        }}
                        className="card-3d bg-card/90 backdrop-blur-xl border border-white/50 rounded-[24px] relative overflow-hidden cursor-pointer"
                      >
                        {/* Match Score Badge - Top Right */}
                        <div className="absolute top-3 right-3 z-10">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.1 + 0.2 }}
                            className={`px-2.5 py-1.5 rounded-xl flex flex-col items-center gap-0.5 border ${getMatchColor(
                              match.matchScore
                            )} shadow-sm`}
                            style={{ minWidth: "54px", maxWidth: "70px" }}
                          >
                            <div className="flex items-center gap-1">
                              <MatchIcon className="w-3 h-3 shrink-0" />
                              <span className="text-xs font-bold leading-none">
                                {match.matchScore}%
                              </span>
                            </div>
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.1 + 0.3 }}
                              className={`text-[8px] font-bold text-center leading-tight whitespace-nowrap ${
                                getMatchColor(match.matchScore).split(" ")[0]
                              }`}
                            >
                              {getMatchLabel(match.matchScore)}
                            </motion.span>
                          </motion.div>
                        </div>

                        <div className="p-4">
                          <div className="flex items-start gap-3 pr-14">
                            {/* Left Side - Avatar and Item Image */}
                            <div className="flex flex-col gap-2.5 shrink-0 items-center">
                              {/* User Avatar */}
                              <div className="relative shrink-0">
                                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/40 shadow-sm relative">
                  <Image 
                                    src={match.userAvatar}
                                    alt={match.userName}
                    fill
                    className="object-cover" 
                  />
                                </div>
                                {match.isOnline && (
                                  <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{
                                      duration: 2,
                                      repeat: Infinity,
                                    }}
                                    className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"
                                  />
                                )}
                                {match.verified && (
                                  <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                                    <CheckCircle2 className="w-2 h-2 text-primary-foreground" />
              </div>
                                )}
                  </div>

                              {/* Item Image */}
                              <div
                                className="rounded-xl bg-muted overflow-hidden shrink-0 relative border border-white/40 shadow-sm"
                                style={{ width: "90px", height: "90px" }}
                              >
                                <Image
                                  src={match.image}
                                  alt={match.title}
                                  fill
                                  className="object-cover"
                                />
                                <div className="absolute top-1 left-1 bg-primary/90 text-primary-foreground text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                                  <Hash className="w-2.5 h-2.5" />
                                  {match.type.toUpperCase()}
              </div>
          </div>
      </div>

                            {/* Right Side - Content */}
                            <div className="flex-1 min-w-0">
                              <div className="mb-2">
                                <h3 className="font-bold text-foreground text-sm leading-tight truncate">
                                  {match.userName}
                                </h3>
                                <p
                                  className="font-semibold text-foreground text-xs mt-0.5 leading-tight overflow-hidden"
                                  style={{
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                  }}
                                >
                                  {match.title}
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-2 text-[10px] text-muted-foreground">
                                <div className="flex items-center gap-1 shrink-0">
                                  <MapPin className="w-3 h-3 shrink-0" />
                                  <span className="truncate max-w-[180px]">
                                    {match.location}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Clock className="w-3 h-3 shrink-0" />
                                  <span>{match.time}</span>
                                </div>
                                <span className="shrink-0 text-muted-foreground/70">
                                  • {match.distance}
                                </span>
                              </div>

                              {/* Match Reasons */}
                              {match.matchReasons &&
                                match.matchReasons.length > 0 && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{
                                      opacity: isExpanded ? 1 : 0,
                                      height: isExpanded ? "auto" : 0,
                                    }}
                                    className="mt-2 flex flex-wrap gap-1.5 overflow-hidden"
                                  >
                                    {match.matchReasons.map((reason, idx) => (
                                      <span
                                        key={idx}
                                        className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-bold rounded-full border border-primary/20 shrink-0"
                                      >
                                        {reason}
                                      </span>
                                    ))}
                                  </motion.div>
                                )}

                              {/* Matched With Indicator */}
                              {match.matchedWith && (
                                <motion.div
                                  initial={{ opacity: 0, y: -5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="mt-2"
                                >
                                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 rounded-lg border border-primary/20 w-fit">
                                    <HeartHandshake className="w-3.5 h-3.5 text-primary shrink-0" />
                                    <span className="text-[10px] font-bold text-primary leading-tight">
                                      {t("matches.matchesYour")}{" "}
                                      <span className="underline">
                                        {myPosts.find(
                                          (p) => p.id === match.matchedWith
                                        )?.title || "item"}
                                      </span>
                                    </span>
                                  </div>
                                </motion.div>
                              )}
                            </div>
          </div>

                          {/* Expandable Details */}
                          <AnimatePresence>
                            {isExpanded && (
          <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 pt-4 border-t border-border/50"
                              >
                                <div className="space-y-3">
                                  <div className="flex items-start gap-2">
                                    <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                    <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                                      {match.description}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                    <span className="text-[10px] text-muted-foreground">
                                      Found on {match.date}
                                    </span>
                                  </div>
                                  {match.tags && match.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                      {match.tags.map((tag, idx) => (
                                        <span
                                          key={idx}
                                          className="px-2 py-0.5 bg-muted text-muted-foreground text-[9px] font-medium rounded shrink-0"
                                        >
                                          #{tag}
                                        </span>
                                      ))}
              </div>
                                  )}
              </div>
          </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Action Buttons */}
                        <div className="px-4 pb-4 flex items-center gap-2">
                          <motion.button
                            whileHover={{ scale: 1.02, y: -1 }}
                            whileTap={{ scale: 0.98, y: 0 }}
                            onClick={(e) => {
                              e.preventDefault();
                              setExpandedMatch(isExpanded ? null : match.id);
                            }}
                            className="btn-3d flex-1 h-10 rounded-xl bg-muted/50 text-muted-foreground text-xs font-bold flex items-center justify-center gap-2 hover:bg-muted"
                          >
                            <Info className="w-4 h-4" />
                            {isExpanded ? t("matches.lessDetails") : t("matches.moreDetails")}
                          </motion.button>
                          <Link
                            href={`/chat?id=${match.id}`}
                            className="flex-1"
                          >
                            <motion.button
                              whileHover={{ scale: 1.02, y: -1 }}
                              whileTap={{ scale: 0.98, y: 0 }}
                              className="btn-primary-3d w-full h-10 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-2"
                            >
                              <HeartHandshake className="w-4 h-4" />
                              <span className="text-shadow-sm">{t("matches.contact")}</span>
                              <ArrowRight className="w-4 h-4" />
                            </motion.button>
                          </Link>
                        </div>
                      </motion.div>
                    </motion.div>
                  );
                })}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Match Detail Sheet */}
      {matchDetailMounted &&
        createPortal(
          <AnimatePresence>
            {selectedMatch && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedMatch(null)}
                  className="fixed inset-0 bg-black/40 backdrop-blur-sm z-60"
                />
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="fixed left-0 right-0 bg-background z-70 rounded-t-[32px] overflow-hidden shadow-2xl flex flex-col border-t border-white/40"
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
                      setSelectedMatch(null);
                    }
                  }}
                >
                  {/* Drag Handle */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-muted-foreground/20 rounded-full" />

                  {/* Close Button */}
                  <button
                    onClick={() => setSelectedMatch(null)}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto no-scrollbar overscroll-y-contain">
                    {/* Image Section */}
                    <div className="relative w-full h-64 bg-linear-to-br from-muted/20 to-muted/5">
                      <Image
                        src={selectedMatch.image}
                        alt={selectedMatch.title}
                        fill
                        className="object-cover"
                        sizes="100vw"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-background via-background/50 to-transparent" />

                      {/* Status Badge */}
                      <div
                        className={cn(
                          "absolute top-4 left-4 px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-wider shadow-lg z-10",
                          selectedMatch.type === "lost"
                            ? "bg-destructive/90 text-white"
                            : "bg-primary/90 text-white"
                        )}
                      >
                        {selectedMatch.type}
                      </div>

                      {/* Match Score Badge */}
                      <div
                        className={cn(
                          "absolute top-4 right-4 px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-wider shadow-lg z-10 flex items-center gap-1.5",
                          getMatchColor(selectedMatch.matchScore)
                        )}
                      >
                        {getMatchIcon(selectedMatch.matchScore)({
                          className: "w-4 h-4",
                        })}
                        <span>{selectedMatch.matchScore}%</span>
                      </div>
                    </div>

                    {/* Details Section */}
                    <div className="p-6 pb-20 space-y-6">
                      {/* Title & User Info */}
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/40 shadow-sm relative">
                            <Image
                              src={selectedMatch.userAvatar}
                              alt={selectedMatch.userName}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <h2 className="text-xl font-heading font-bold text-foreground">
                              {selectedMatch.title}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                              by {selectedMatch.userName}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            <span>{selectedMatch.time}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4" />
                            <span>{selectedMatch.location}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span>{selectedMatch.distance}</span>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      {selectedMatch.description && (
                        <div>
                          <h3 className="text-sm font-bold text-foreground mb-2 uppercase tracking-wide">
                            Description
                          </h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {selectedMatch.description}
                          </p>
                        </div>
                      )}

                      {/* Match Reasons */}
                      {selectedMatch.matchReasons &&
                        selectedMatch.matchReasons.length > 0 && (
                          <div>
                            <h3 className="text-sm font-bold text-foreground mb-2 uppercase tracking-wide">
                              Match Reasons
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {selectedMatch.matchReasons.map(
                                (reason, index) => (
                                  <span
                                    key={index}
                                    className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20"
                                  >
                                    {reason}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-card border border-border/50 p-4 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4 text-primary" />
                            <span className="text-xs font-bold text-muted-foreground uppercase">
                              Location
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-foreground">
                            {selectedMatch.location}
                          </p>
                        </div>
                        <div className="bg-card border border-border/50 p-4 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span className="text-xs font-bold text-muted-foreground uppercase">
                              Date
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-foreground">
                            {selectedMatch.date}
                          </p>
                  </div>
              </div>

                      {/* Tags */}
                      {selectedMatch.tags && selectedMatch.tags.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Hash className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs font-bold text-muted-foreground uppercase">
                              Tags
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {selectedMatch.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
              </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <motion.button
                          whileHover={{ scale: 1.02, y: -1 }}
                          whileTap={{ scale: 0.98, y: 0 }}
                          onClick={() => {
                            // Open Telegram chat with the user
                            if (
                              typeof window !== "undefined" &&
                              (window as any).Telegram?.WebApp
                            ) {
                              // Try to get username from match data
                              const username =
                                (selectedMatch as any).userName
                                  ?.toLowerCase()
                                  .replace(/\s+/g, "") ||
                                (selectedMatch as any).username ||
                                `user${selectedMatch.userId}`;
                              (window as any).Telegram.WebApp.openTelegramLink(
                                `https://t.me/${username}`
                              );
                            } else {
                              // Fallback: open Telegram
                              window.open("https://t.me", "_blank");
                            }
                            setSelectedMatch(null);
                          }}
                          className="btn-primary-3d flex-1 h-12 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2"
                        >
                          <MessageCircle className="w-5 h-5" />
                          <span className="text-shadow-sm">
                            {t("detail.contactViaTelegram")}
                          </span>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05, y: -1 }}
                          whileTap={{ scale: 0.95, y: 0 }}
                          onClick={() => {
                            // Call functionality - if phone number is available
                            const phone =
                              (selectedMatch as any).phone ||
                              (selectedMatch as any).user?.phone;
                            if (phone) {
                              window.location.href = `tel:${phone}`;
                            }
                          }}
                          className="btn-3d w-12 h-12 rounded-xl bg-muted text-foreground flex items-center justify-center"
                        >
                          <Phone className="w-5 h-5" />
                        </motion.button>
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
