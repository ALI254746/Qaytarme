"use client";

import { Search, SlidersHorizontal, MapPin, Navigation, Layers, Clock, ArrowRight, Smartphone, PawPrint, Key, X, Phone, MessageCircle, Calendar, Hash, Share2, Heart, Flag, Navigation2, Satellite, Map as MapIcon } from "lucide-react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUIContext } from "@/context/UIContext";
import { useLanguage } from "@/context/LanguageContext";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { SearchPageSkeleton } from "@/components/SkeletonLoader";

// Dynamically load the Map to avoid SSR issues with Leaflet
const Map = dynamic(() => import("@/components/Map"), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#f4f4f4] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        <span className="text-muted-foreground text-xs font-medium">Loading Map...</span>
      </div>
    </div>
  )
});

// Map ref type
interface MapRef {
  locate: () => void;
}

// Categories will be defined inside component to use translation

const mapItems = [
  {
    id: 1,
    title: "iPhone 13 Pro",
    type: "lost",
    category: "tech",
    image: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&q=80&w=400",
    location: "Chilonzor, 19-kvartal",
    date: "March 16, 2024",
    time: "12m ago",
    distance: "0.3km",
    description: "Lost my iPhone 13 Pro near Chilonzor metro station. It's in a black case with a screen protector. Contains important contacts and photos. Reward offered!",
    tags: ["iPhone", "Phone", "Electronics"],
    contact: "+998 90 777 88 99"
  },
  {
    id: 2,
    title: "Golden Retriever",
    type: "lost",
    category: "pets",
    image: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=400",
    location: "City Park",
    date: "March 15, 2024",
    time: "2h ago",
    distance: "1.2km",
    description: "Lost my beloved Golden Retriever near City Park. He's very friendly and responds to the name 'Max'. Last seen wearing a blue collar with a tag.",
    tags: ["Pet", "Dog", "Golden Retriever"],
    contact: "+998 90 123 45 67"
  },
  {
    id: 3,
    title: "Leather Wallet",
    type: "found",
    category: "wallet",
    image: "https://images.unsplash.com/photo-1605733513597-a8f8341084e6?auto=format&fit=crop&q=80&w=400",
    location: "Shopping Mall",
    date: "March 16, 2024",
    time: "5m ago",
    distance: "0.8km",
    description: "Found a brown leather wallet at the shopping mall. Contains ID and credit cards. Please contact to claim.",
    tags: ["Wallet", "Leather"],
    contact: "+998 90 111 22 33"
  }
];

export default function SearchPage() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedItem, setSelectedItem] = useState<typeof mapItems[0] | null>(null);
  const [itemDetailMounted, setItemDetailMounted] = useState(false);
  const [favoriteItems, setFavoriteItems] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [mapStyle, setMapStyle] = useState<"voyager" | "satellite">("voyager");
  const [isLayersOpen, setIsLayersOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showUserLocation, setShowUserLocation] = useState(false);
  const [locationRequestTrigger, setLocationRequestTrigger] = useState(0);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const { isNavVisible, setNavVisible } = useUIContext();
  const { t } = useLanguage();

  useEffect(() => {
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

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(10);
    }
  };

  const handleShare = async (item: typeof mapItems[0]) => {
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

  const handleReport = (item: typeof mapItems[0]) => {
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

  const handleLocationRequest = () => {
    triggerHaptic();
    setIsLocating(true);
    setShowUserLocation(true);
    
    // Trigger location request by incrementing trigger counter
    setLocationRequestTrigger(prev => prev + 1);
    
    // Reset loading state after animation
    setTimeout(() => {
      setIsLocating(false);
    }, 2000);
  };

  const handleMapStyleChange = (style: "voyager" | "satellite") => {
    triggerHaptic();
    setMapStyle(style);
    setIsLayersOpen(false);
  };

  const categories = useMemo(() => [
    { id: 'all', name: t("search.allCategories"), icon: Layers },
    { id: 'tech', name: t("search.electronics"), icon: Smartphone },
    { id: 'pets', name: t("search.pets"), icon: PawPrint },
    { id: 'keys', name: t("search.keys"), icon: Key },
    { id: 'wallet', name: t("search.walletBags"), icon: MapPin },
    { id: 'docs', name: t("search.documents"), icon: Navigation },
  ], [t]);

  const filters = useMemo(() => [
    { id: "all", label: t("common.search") },
    { id: "lost", label: t("add.lost") },
    { id: "found", label: t("add.found") },
  ], [t]);

  if (isLoading) {
    return <SearchPageSkeleton />;
  }

  return (
    <div className="w-full h-screen relative bg-background overflow-hidden flex flex-col font-sans">
      
      {/* 1. Real Interactive Map (Background) */}
      <div className="absolute inset-0 z-0">
         <Map 
           mapStyle={mapStyle}
           onLocationRequest={locationRequestTrigger > 0 ? () => setLocationRequestTrigger(0) : undefined}
           showUserLocation={showUserLocation}
         />
      </div>

      {/* 2. Floating Header & Search */}
      <motion.div 
        animate={{ y: isNavVisible ? 0 : -150, opacity: isNavVisible ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 pt-6 px-4 flex flex-col gap-3 pointer-events-none"
      >
         {/* Search Bar - Pointer events auto to allow interaction */}
         <div className="pointer-events-auto flex items-center gap-2">
            <div className="flex-1 bg-white/90 backdrop-blur-xl border border-white/60 rounded-[20px] h-12 shadow-md shadow-zinc-900/5 px-4 flex items-center transition-all focus-within:ring-2 focus-within:ring-primary/20">
                <Search className="w-5 h-5 text-zinc-500 mr-3" />
                <input 
                  type="text" 
                  placeholder={t("home.searchPlaceholder")} 
                  className="w-full bg-transparent outline-none text-zinc-900 placeholder:text-zinc-500 text-sm font-medium"
                />
            </div>
            <button 
                onClick={() => setIsFilterOpen(true)}
                className="w-12 h-12 bg-white/90 backdrop-blur-xl rounded-full flex items-center justify-center shadow-md border border-white/60 active:scale-95 transition-transform pointer-events-auto text-zinc-700"
            >
                <SlidersHorizontal className="w-5 h-5" strokeWidth={2.5} />
            </button>
         </div>

         {/* Filter Chips */}
         <div className="flex gap-2 pointer-events-auto overflow-x-auto no-scrollbar pb-2">
            {filters.map(f => (
                <button 
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={`px-4 h-9 rounded-full text-xs font-bold border backdrop-blur-md transition-all shadow-sm ${
                    activeFilter === f.id 
                    ? 'bg-zinc-900 text-white border-zinc-900' 
                    : 'bg-white/80 text-zinc-600 border-white/50'
                  }`}
                >
                    {f.label}
                </button>
            ))}
         </div>
      </motion.div>

      {/* 3. Map Controls (Right Side) */}
      <motion.div 
        animate={{ x: isNavVisible ? 0 : 100, opacity: isNavVisible ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-3 pointer-events-auto"
      >
          {/* My Location Button */}
          <motion.button 
            onClick={handleLocationRequest}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "btn-3d w-12 h-12 bg-white/90 backdrop-blur-xl rounded-full flex items-center justify-center shadow-lg border border-white/60 text-zinc-700 relative",
              isLocating && "bg-primary/20 border-primary/50"
            )}
          >
            {isLocating ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Navigation2 className="w-5 h-5 text-primary" strokeWidth={2.5} />
              </motion.div>
            ) : (
              <Navigation className="w-5 h-5" strokeWidth={2.5} />
            )}
          </motion.button>
          
          {/* Map Style Switcher Button */}
          <motion.button 
            onClick={() => setIsLayersOpen(!isLayersOpen)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "btn-3d w-12 h-12 bg-white/90 backdrop-blur-xl rounded-full flex items-center justify-center shadow-lg border border-white/60 text-zinc-700 relative",
              isLayersOpen && "bg-primary/20 border-primary/50"
            )}
          >
            <Layers className="w-5 h-5" strokeWidth={2.5} />
          </motion.button>
      </motion.div>

      {/* Map Style Switcher Popup */}
      <AnimatePresence>
        {isLayersOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-4 top-1/2 -translate-y-1/2 translate-x-16 z-20 pointer-events-auto"
          >
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-2 flex flex-col gap-2 min-w-[140px]">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleMapStyleChange("voyager")}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left",
                  mapStyle === "voyager" 
                    ? "bg-primary/10 border border-primary/30" 
                    : "hover:bg-muted/50"
                )}
              >
                <MapIcon className={cn(
                  "w-5 h-5",
                  mapStyle === "voyager" ? "text-primary" : "text-zinc-600"
                )} />
                <div>
                  <div className={cn(
                    "text-sm font-bold",
                    mapStyle === "voyager" ? "text-primary" : "text-zinc-900"
                  )}>{t("search.street")}</div>
                  <div className="text-[10px] text-zinc-500">Default view</div>
                </div>
                {mapStyle === "voyager" && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2 h-2 rounded-full bg-primary ml-auto"
                  />
                )}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleMapStyleChange("satellite")}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left",
                  mapStyle === "satellite" 
                    ? "bg-primary/10 border border-primary/30" 
                    : "hover:bg-muted/50"
                )}
              >
                <Satellite className={cn(
                  "w-5 h-5",
                  mapStyle === "satellite" ? "text-primary" : "text-zinc-600"
                )} />
                <div>
                  <div className={cn(
                    "text-sm font-bold",
                    mapStyle === "satellite" ? "text-primary" : "text-zinc-900"
                  )}>{t("search.satellite")}</div>
                  <div className="text-[10px] text-zinc-500">Aerial view</div>
                </div>
                {mapStyle === "satellite" && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2 h-2 rounded-full bg-primary ml-auto"
                  />
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Bottom Card (Item Preview) - Fixed above BottomNav with Carousel */}
      <motion.div 
        animate={{ y: isNavVisible ? 0 : 250, opacity: isNavVisible ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute bottom-24 left-4 right-4 z-20 pointer-events-auto"
      >
          <div className="relative overflow-hidden">
            {/* Carousel Container */}
            <motion.div
              className="flex"
              animate={{ x: `-${currentCardIndex * 100}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, { offset, velocity }) => {
                const swipeThreshold = 50;
                const swipeVelocity = 500;
                
                if (Math.abs(offset.x) > swipeThreshold || Math.abs(velocity.x) > swipeVelocity) {
                  if (offset.x > 0 && currentCardIndex > 0) {
                    // Swipe right - previous
                    setCurrentCardIndex(currentCardIndex - 1);
                    triggerHaptic();
                  } else if (offset.x < 0 && currentCardIndex < mapItems.length - 1) {
                    // Swipe left - next
                    setCurrentCardIndex(currentCardIndex + 1);
                    triggerHaptic();
                  }
                }
              }}
            >
              {mapItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="card-3d glass-3d rounded-[24px] p-3 flex gap-3 cursor-pointer min-w-full shrink-0"
                >
                  <div className="w-20 h-20 bg-zinc-100 rounded-2xl relative overflow-hidden shrink-0">
                    <Image 
                      src={item.image}
                      alt={item.title}
                      fill 
                      className="object-cover"
                    />
                    <div className={cn(
                      "absolute top-1 left-1 backdrop-blur-sm text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md",
                      item.type === "lost" ? "bg-black/60" : "bg-primary/80"
                    )}>
                      {item.type === "lost" ? t("add.lost").toUpperCase() : t("add.found").toUpperCase()}
                    </div>
                  </div>
                  <div className="flex-1 py-1">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-zinc-900 leading-tight truncate">{item.title}</h3>
                        <p className="text-[10px] text-zinc-500 font-medium mt-0.5">
                          {item.category === "tech" ? "Electronics" : 
                           item.category === "pets" ? "Pets" :
                           item.category === "wallet" ? "Wallet" : item.category}
                        </p>
                      </div>
                      <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shrink-0 ml-2">
                        <Clock className="w-3 h-3" /> {item.time}
                      </span>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-zinc-600 min-w-0 flex-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="text-[10px] font-medium truncate">{item.location}</span>
                        <span className="text-[10px] text-zinc-400 ml-1 shrink-0">• {item.distance}</span>
                      </div>
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center shrink-0"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Carousel Indicators */}
            {mapItems.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {mapItems.map((_, index) => (
                  <motion.button
                    key={index}
                    onClick={() => {
                      setCurrentCardIndex(index);
                      triggerHaptic();
                    }}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      currentCardIndex === index 
                        ? "w-6 bg-zinc-900" 
                        : "w-1.5 bg-zinc-400/50"
                    )}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  />
                ))}
              </div>
            )}

            {/* Navigation Arrows (if more than 1 item) */}
            {mapItems.length > 1 && (
              <>
                {currentCardIndex > 0 && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => {
                      setCurrentCardIndex(currentCardIndex - 1);
                      triggerHaptic();
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md border border-white/60 shadow-lg flex items-center justify-center text-zinc-700 z-10"
                  >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </motion.button>
                )}
                {currentCardIndex < mapItems.length - 1 && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => {
                      setCurrentCardIndex(currentCardIndex + 1);
                      triggerHaptic();
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md border border-white/60 shadow-lg flex items-center justify-center text-zinc-700 z-10"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                )}
              </>
            )}
          </div>
      </motion.div>
      
      {/* Category Filter Modal */}
      <AnimatePresence>
        {isFilterOpen && (
            <>
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    onClick={() => setIsFilterOpen(false)}
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                />
                <motion.div 
                    drag="y"
                    dragConstraints={{ top: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(e, { offset, velocity }) => {
                        if (offset.y > 100 || velocity.y > 500) {
                            setIsFilterOpen(false);
                        }
                    }}
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="fixed bottom-0 left-0 right-0 bg-background z-[70] rounded-t-[32px] overflow-hidden shadow-2xl border-t border-white/40 pb-10"
                >
                    {/* Drag Handle */}
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-zinc-300/50 rounded-full" />

                    <div className="p-6 pt-10 pb-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-heading font-bold">{t("add.category")}</h2>
                            <button onClick={() => setIsFilterOpen(false)} className="p-2 bg-muted rounded-full hover:bg-muted/80 transition-colors">
                                <X className="w-4 h-4 text-muted-foreground" />
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3">
                            {categories.map((cat) => (
                                <button 
                                    key={cat.id}
                                    onClick={() => {
                                        setSelectedCategory(cat.id);
                                        setIsFilterOpen(false);
                                    }}
                                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all active:scale-95 ${
                                        selectedCategory === cat.id 
                                        ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20' 
                                        : 'bg-card border-border hover:bg-muted/50'
                                    }`}
                                >
                                    <cat.icon className="w-6 h-6" />
                                    <span className="text-[10px] font-bold text-center leading-tight">{cat.name}</span>
                                </button>
                            ))}
                        </div>
                         <div className="mt-6 text-center">
                            <p className="text-xs text-muted-foreground font-medium">{t("common.close")}</p>
                        </div>
                    </div>
                </motion.div>
            </>
        )}
      </AnimatePresence>

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

                    {/* Contact Section */}
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
