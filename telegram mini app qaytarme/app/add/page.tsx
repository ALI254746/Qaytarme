"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Search, ArrowRight, Gift, ChevronLeft, Camera, MapPin, Calendar, Check } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useUIContext } from "@/context/UIContext";
import { useLanguage } from "@/context/LanguageContext";
import dynamic from "next/dynamic";
import FormField from "@/components/FormField";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ToastProvider";
import { AddPageSkeleton } from "@/components/SkeletonLoader";

const LocationPicker = dynamic(() => import("@/components/LocationPicker"), { ssr: false });

function AddContent() {
  const [view, setView] = useState<"selection" | "form">("selection");
  const [type, setType] = useState<"lost" | "found">("lost");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { setNavVisible } = useUIContext();
  const { showToast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
      // Hide BottomNav when in form view to give more space
      if (view === "form") {
          setNavVisible(false);
      } else {
          setNavVisible(true);
      }
      return () => setNavVisible(true);
  }, [view, setNavVisible]);

  const handleSelect = (selectedType: "lost" | "found") => {
      setType(selectedType);
      setIsLoading(true);
      // Simulate loading
      setTimeout(() => {
        setIsLoading(false);
        setView("form");
      }, 500);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSelectedImage(url);
    }
  };

  const categories = [
      { id: "pets", emoji: "🐾", label: t("add.pets") },
      { id: "tech", emoji: "📱", label: t("add.tech") },
      { id: "keys", emoji: "🔑", label: t("add.keys") },
      { id: "wallet", emoji: "👛", label: t("add.wallet") },
      { id: "docs", emoji: "📄", label: t("add.docs") },
      { id: "other", emoji: "📦", label: t("add.other") },
  ];

  const [activeCategory, setActiveCategory] = useState("tech");

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = t("add.titleRequired");
    }
    if (!selectedImage) {
      newErrors.image = t("add.uploadPhoto");
    }
    if (!location) {
      newErrors.location = t("add.selectLocation");
    }
    if (!formData.date) {
      newErrors.date = t("add.dateRequired");
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showToast("error", t("add.pleaseFillAll"));
      return;
    }
    
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    
    showToast("success", t("add.postCreated"));
    setTimeout(() => router.push("/"), 500);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans relative overflow-hidden pb-24">
      
      {/* Map Picker Modal */}
      {isMapOpen && (
          <LocationPicker 
            onCancel={() => setIsMapOpen(false)}
            onConfirm={(lat, lng) => {
                setLocation({ lat, lng });
                setIsMapOpen(false);
            }}
          />
      )}

      <AnimatePresence mode="wait">
        
        {/* VIEW 1: SELECTION SCREEN */}
        {view === "selection" && !isLoading && (
            <motion.div 
                key="selection"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col h-full"
            >
                {/* Header */}
                <header className="px-6 pt-6 pb-4 flex justify-between items-center z-10 relative flex-none">
                    <div className="flex flex-col">
                        <span className="text-muted-foreground text-sm font-medium mb-0.5">{t("add.startReport")}</span>
                        <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">{t("add.whatHappened")}</h1>
                    </div>
                    <Link href="/">
                        <button className="w-12 h-12 rounded-full bg-card border border-border/40 shadow-sm flex items-center justify-center active:scale-95 transition-transform duration-200">
                            <X className="w-[22px] h-[22px] text-foreground" />
                        </button>
                    </Link>
                </header>

                <main className="flex-1 px-6 pb-28 pt-2 flex flex-col gap-5 relative z-0">
                    {/* Option 1: Lost */}
                    <motion.button 
                        onClick={() => handleSelect("lost")}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98, y: 0 }}
                        className="btn-primary-3d group relative flex-1 bg-primary rounded-[32px] p-8 w-full text-left overflow-hidden transition-all duration-300"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none group-hover:bg-white/20 transition-colors"></div>
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-bold text-primary-foreground uppercase tracking-wider mb-4">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                                    High Urgency
                                </div>
                                <h2 className="text-3xl font-heading font-bold text-primary-foreground mb-2 text-shadow-md">{t("home.iLostIt")}<br/>{t("common.search")}</h2>
                                <p className="text-primary-foreground/80 text-sm font-medium leading-relaxed max-w-[80%]">Report missing item to notify others.</p>
                            </div>
                            <div className="flex justify-between items-end">
                                <span className="text-primary-foreground font-semibold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">{t("add.createAlert")} <ArrowRight className="w-4 h-4"/></span>
                                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10">
                                    <Search className="w-8 h-8 text-primary-foreground" />
                                </div>
                            </div>
                        </div>
                    </motion.button>

                    {/* OR Badge */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                        <div className="w-12 h-12 rounded-full bg-background border-4 border-background flex items-center justify-center shadow-sm">
                            <span className="font-bold text-[10px] text-muted-foreground uppercase">Or</span>
                        </div>
                    </div>

                    {/* Option 2: Found */}
                    <motion.button 
                        onClick={() => handleSelect("found")}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98, y: 0 }}
                        className="btn-3d glass-3d group relative flex-1 rounded-[32px] p-8 w-full text-left overflow-hidden transition-all duration-300"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none group-hover:bg-emerald-500/20 transition-colors"></div>
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100/50 backdrop-blur-md border border-emerald-200 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-4">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                                    Good Karma
                                </div>
                                <h2 className="text-3xl font-heading font-bold text-zinc-900 mb-2 text-shadow-md">{t("home.iFoundIt")}<br/>{t("common.search")}</h2>
                                <p className="text-zinc-500 text-sm font-medium leading-relaxed max-w-[80%]">Help reuse a lost item with its owner.</p>
                            </div>
                            <div className="flex justify-between items-end">
                                <span className="text-zinc-900 font-semibold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">Report finding <ArrowRight className="w-4 h-4"/></span>
                                <div className="w-16 h-16 rounded-full bg-emerald-100/50 flex items-center justify-center backdrop-blur-sm border border-emerald-200">
                                    <Gift className="w-8 h-8 text-emerald-600" />
                                </div>
                            </div>
                        </div>
                    </motion.button>
                </main>
            </motion.div>
        )}

        {/* VIEW 2: FORM SCREEN */}
        {isLoading && view === "form" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AddPageSkeleton />
          </motion.div>
        )}
        {!isLoading && view === "form" && (
            <motion.div 
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col h-full pb-20"
            >
                {/* Form Header */}
                <header className="px-4 pt-6 pb-2 flex justify-between items-center mb-4">
                    <button 
                        onClick={() => setView("selection")}
                        className="w-10 h-10 rounded-full bg-card border border-border/50 flex items-center justify-center active:scale-95 transition-transform"
                    >
                        <ChevronLeft className="w-6 h-6 text-foreground" />
                    </button>
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border ${
                        type === 'lost' 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'bg-white text-zinc-900 border-zinc-200'
                    }`}>
                        New {type} Item
                    </span>
                    <div className="w-10" /> {/* Spacer */}
                </header>

                <main className="flex-1 px-4 overflow-y-auto no-scrollbar space-y-6">
                    
                    {/* Image Upload */}
                    <FormField label="Photo" error={errors.image} required>
                        <motion.div 
                            className="relative"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <motion.div 
                                onClick={() => !selectedImage && fileInputRef.current?.click()}
                                whileHover={{ scale: selectedImage ? 1 : 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                className={cn(
                                    "relative w-full aspect-[4/3] bg-card/50 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all group",
                                    errors.image ? "border-destructive" : "border-border hover:border-primary/50",
                                    selectedImage && "border-solid border-primary/50"
                                )}
                            >
                                {selectedImage ? (
                                    <>
                                        <Image src={selectedImage} alt="Preview" fill className="object-cover" />
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                                        <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    fileInputRef.current?.click();
                                                }}
                                                className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg"
                                            >
                                                <Camera className="w-5 h-5 text-foreground" />
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedImage(null);
                                                    setErrors({ ...errors, image: "" });
                                                }}
                                                className="w-12 h-12 rounded-full bg-destructive/90 backdrop-blur-sm flex items-center justify-center shadow-lg"
                                            >
                                                <X className="w-5 h-5 text-white" />
                                            </motion.button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 rounded-full bg-background shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            <Camera className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <p className="text-sm font-semibold text-foreground">Tap to upload</p>
                                        <p className="text-xs text-muted-foreground">Main photo of the item</p>
                                    </>
                                )}
                                <input ref={fileInputRef} type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                            </motion.div>
                        </motion.div>
                    </FormField>

                    {/* Categories */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-foreground px-1">{t("add.category")}</label>
                        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-1 -mx-1">
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`flex items-center gap-2 px-4 py-3 rounded-2xl border transition-all shrink-0 ${
                                        activeCategory === cat.id
                                        ? "bg-foreground text-background border-foreground shadow-lg"
                                        : "bg-card border-border hover:bg-muted"
                                    }`}
                                >
                                    <span className="text-lg">{cat.emoji}</span>
                                    <span className="text-xs font-bold">{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Simple Inputs */}
                    <div className="space-y-4">
                        <FormField label={t("add.title")} error={errors.title} required>
                            <motion.input
                                whileFocus={{ scale: 1.01 }}
                                type="text" 
                                placeholder="iPhone 13 Pro, Black Wallet, etc." 
                                value={formData.title}
                                onChange={(e) => {
                                    setFormData({ ...formData, title: e.target.value });
                                    if (errors.title) {
                                        setErrors({ ...errors, title: "" });
                                    }
                                }}
                                className={cn(
                                    "w-full h-14 bg-card/50 border rounded-2xl px-4 text-foreground text-sm font-medium outline-none focus:bg-card transition-all",
                                    errors.title ? "border-destructive focus:border-destructive" : "border-border/50 focus:border-primary/50"
                                )}
                            />
                        </FormField>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField label={t("add.date")} error={errors.date} required>
                                <div className="relative">
                                    <input 
                                        type="date" 
                                        value={formData.date}
                                        onChange={(e) => {
                                            setFormData({ ...formData, date: e.target.value });
                                            if (errors.date) {
                                                setErrors({ ...errors, date: "" });
                                            }
                                        }}
                                        className={cn(
                                            "w-full h-14 bg-card/50 border rounded-2xl px-4 text-foreground text-sm font-medium outline-none transition-all font-sans",
                                            errors.date ? "border-destructive focus:border-destructive" : "border-border/50 focus:border-primary/50"
                                        )}
                                    />
                                    <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                                </div>
                            </FormField>
                            <FormField label={t("add.time")}>
                                <input 
                                    type="time" 
                                    value={formData.time}
                                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                    className="w-full h-14 bg-card/50 border border-border/50 rounded-2xl px-4 text-foreground text-sm font-medium outline-none focus:border-primary/50 transition-all font-sans"
                                />
                            </FormField>
                        </div>

                        <FormField label={t("add.description")}>
                            <textarea 
                                placeholder="Any distinguishing marks, location details..." 
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full h-32 bg-card/50 border border-border/50 rounded-2xl p-4 text-foreground text-sm font-medium outline-none focus:border-primary/50 focus:bg-card transition-all resize-none"
                            ></textarea>
                        </FormField>
                        
                         <FormField label={t("add.location")} error={errors.location} required>
                             <motion.div 
                                onClick={() => {
                                    setIsMapOpen(true);
                                    if (errors.location) {
                                        setErrors({ ...errors, location: "" });
                                    }
                                }}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                className={cn(
                                    "w-full h-14 bg-card/50 border rounded-2xl px-4 flex items-center justify-between transition-transform cursor-pointer",
                                    errors.location ? "border-destructive focus:border-destructive" : "border-border/50"
                                )}
                             >
                                 <div className="flex items-center gap-3">
                                     <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                                         <MapPin className="w-4 h-4 text-accent-foreground" />
                                     </div>
                                     <span className="text-sm font-medium text-foreground">
                                         {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : "Select on map"}
                                     </span>
                                 </div>
                                 <ArrowRight className="w-4 h-4 text-muted-foreground" />
                             </motion.div>
                         </FormField>
                    </div>

                    <div className="h-20" /> {/* Bottom spacer */}
                </main>

                {/* Submit Bar via Portal or Fixed */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border/40 z-20 pb-8">
                    <motion.button 
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98, y: 0 }}
                        disabled={isSubmitting}
                        className={`btn-primary-3d w-full h-14 rounded-[20px] font-bold text-lg flex items-center justify-center gap-2 bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:y-0`}
                        onClick={handleSubmit}
                    >
                        {isSubmitting ? (
                            <>
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
                                />
                                <span className="text-shadow-sm">{t("add.publishing")}</span>
                            </>
                        ) : (
                            <>
                                <Check className="w-5 h-5 stroke-[3]" />
                                <span className="text-shadow-sm">{t("add.submit")} {type === 'lost' ? t("add.lost") : t("add.found")}</span>
                            </>
                        )}
                    </motion.button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AddPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AddContent />
    </Suspense>
  );
}
