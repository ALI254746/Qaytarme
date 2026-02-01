"use client";

import { motion } from "framer-motion";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular" | "card";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className = "", variant = "rectangular", width, height }: SkeletonProps) {
  const baseClasses = "bg-gradient-to-r from-muted via-muted/50 to-muted animate-pulse rounded";
  
  const variantClasses = {
    text: "h-4 rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
    card: "rounded-2xl"
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
    />
  );
}

// Feed Item Skeleton
export function FeedItemSkeleton() {
  return (
    <div className="break-inside-avoid relative">
      <div className="relative rounded-[22px] overflow-hidden bg-card shadow-sm border border-border/50">
        <Skeleton variant="rectangular" className="w-full" height="200px" />
        <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
          <Skeleton variant="text" width="60%" height="16px" />
          <div className="flex gap-2">
            <Skeleton variant="text" width="40px" height="12px" />
            <Skeleton variant="text" width="50px" height="12px" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Profile Card Skeleton
export function ProfileCardSkeleton() {
  return (
    <div className="flex flex-col items-center space-y-4">
      <Skeleton variant="circular" width={128} height={128} />
      <div className="space-y-2 w-full max-w-xs">
        <Skeleton variant="text" width="70%" height="24px" className="mx-auto" />
        <Skeleton variant="text" width="50%" height="16px" className="mx-auto" />
      </div>
      <div className="grid grid-cols-3 gap-3 w-full">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="card" height="100px" />
        ))}
      </div>
    </div>
  );
}

// Category Button Skeleton
export function CategorySkeleton() {
  return (
    <Skeleton variant="rectangular" width={100} height={36} className="rounded-full shrink-0" />
  );
}

// Profile Page Skeleton
export function ProfilePageSkeleton() {
  return (
    <div className="bg-background w-full relative overflow-hidden font-sans flex flex-col" style={{ height: "80vh", maxHeight: "80vh" }}>
      {/* Header */}
      <div className="relative z-10 pt-6 px-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Skeleton variant="circular" width={40} height={40} />
            <div className="space-y-2">
              <Skeleton variant="text" width={120} height={20} />
              <Skeleton variant="text" width={80} height={14} />
            </div>
          </div>
          <Skeleton variant="circular" width={40} height={40} />
        </div>
        
        {/* Tabs */}
        <div className="w-full bg-muted/50 p-1 rounded-full flex relative border border-border/50">
          <Skeleton variant="rectangular" className="flex-1 h-12 rounded-full" />
          <Skeleton variant="rectangular" className="flex-1 h-12 rounded-full" />
        </div>
      </div>

      {/* Masonry Grid */}
      <div className="px-6 columns-2 gap-4 pb-4 space-y-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="break-inside-avoid w-full">
            <Skeleton variant="card" className="w-full" height={Math.random() * 100 + 150} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Search Page Skeleton
export function SearchPageSkeleton() {
  return (
    <div className="w-full h-screen relative bg-background overflow-hidden flex flex-col font-sans">
      {/* Map Area */}
      <div className="absolute inset-0 z-0">
        <Skeleton variant="rectangular" className="w-full h-full" />
      </div>

      {/* Header & Search */}
      <div className="relative z-10 pt-6 px-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Skeleton variant="rectangular" className="flex-1 h-12 rounded-[20px]" />
          <Skeleton variant="circular" width={48} height={48} />
        </div>
      </div>

      {/* Bottom Card */}
      <div className="absolute bottom-24 left-4 right-4 z-20">
        <Skeleton variant="card" className="w-full h-24 rounded-[24px]" />
      </div>
    </div>
  );
}

// Chat Page Skeleton
export function ChatPageSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-hidden font-sans pb-32">
      {/* Header */}
      <header className="relative z-10 pt-6 px-6 flex items-center gap-4">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width={120} height={18} />
          <Skeleton variant="text" width={80} height={14} />
        </div>
        <Skeleton variant="circular" width={40} height={40} />
      </header>

      {/* Context Strip */}
      <div className="sticky top-2 z-20 px-6 mt-6">
        <Skeleton variant="card" className="w-full h-20 rounded-[24px]" />
      </div>

      {/* Messages */}
      <main className="relative z-10 px-6 mt-6 flex flex-col gap-4 pb-32">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] ${i % 2 === 0 ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              <Skeleton variant="rectangular" className="rounded-2xl" width={Math.random() * 150 + 100} height={50} />
              <Skeleton variant="text" width={40} height={12} />
            </div>
          </div>
        ))}
      </main>

      {/* Input Area */}
      <div className="fixed bottom-[112px] left-6 right-6 z-40">
        <Skeleton variant="rectangular" className="w-full h-14 rounded-[20px]" />
      </div>
    </div>
  );
}

// Matches Page Skeleton
export function MatchesPageSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-hidden font-sans pb-24">
      {/* Header */}
      <header className="relative z-10 pt-6 px-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <Skeleton variant="text" width={150} height={28} />
          <Skeleton variant="circular" width={40} height={40} />
        </div>
        
        {/* Filters */}
        <div className="flex gap-3 mb-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" className="h-10 rounded-full" width={100} />
          ))}
        </div>
      </header>

      {/* Match Cards */}
      <main className="relative z-10 px-6 flex-1 overflow-y-auto">
        <div className="space-y-4 pb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="card" className="w-full h-32 rounded-[24px]" />
          ))}
        </div>
      </main>
    </div>
  );
}

// Add Page Skeleton
export function AddPageSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans relative overflow-hidden pb-24">
      {/* Header */}
      <header className="relative z-10 pt-4 px-4 pb-3 flex items-center gap-3">
        <Skeleton variant="circular" width={36} height={36} />
        <Skeleton variant="text" width={100} height={20} />
      </header>

      {/* Form */}
      <main className="flex-1 px-4 overflow-y-auto no-scrollbar space-y-6 mt-4">
        {/* Image Upload */}
        <div className="space-y-2">
          <Skeleton variant="text" width={60} height={16} />
          <Skeleton variant="rectangular" className="w-full aspect-[4/3] rounded-3xl" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Skeleton variant="text" width={60} height={16} />
          <Skeleton variant="rectangular" className="w-full h-14 rounded-2xl" />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Skeleton variant="text" width={80} height={16} />
          <Skeleton variant="rectangular" className="w-full h-32 rounded-2xl" />
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Skeleton variant="text" width={70} height={16} />
          <Skeleton variant="rectangular" className="w-full h-14 rounded-2xl" />
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Skeleton variant="text" width={50} height={16} />
          <Skeleton variant="rectangular" className="w-full h-14 rounded-2xl" />
        </div>
      </main>

      {/* Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border/40 z-20 pb-8">
        <Skeleton variant="rectangular" className="w-full h-14 rounded-[20px]" />
      </div>
    </div>
  );
}

// Settings Page Skeleton
export function SettingsPageSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-hidden font-sans pb-24">
      {/* Header */}
      <header className="relative z-10 pt-4 px-4 pb-3 flex items-center gap-3">
        <Skeleton variant="circular" width={36} height={36} />
        <Skeleton variant="text" width={100} height={20} />
      </header>

      {/* Settings Items */}
      <main className="relative z-10 px-4 mt-4 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} variant="card" className="w-full h-20 rounded-[24px]" />
        ))}
      </main>
    </div>
  );
}

// Home Page Skeleton
export function HomePageSkeleton() {
  return (
    <div className="bg-background w-full min-h-screen relative font-sans pb-20">
      <div className="pt-6 px-4 space-y-5">
        {/* Header Skeleton */}
        <header className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <Skeleton variant="circular" width={36} height={36} />
            <div className="space-y-1.5">
              <Skeleton variant="text" width={80} height={16} />
              <Skeleton variant="text" width={60} height={12} />
            </div>
          </div>
          <Skeleton variant="circular" width={36} height={36} />
        </header>

        {/* Search Bar Skeleton */}
        <div className="relative z-20">
          <Skeleton variant="rectangular" className="w-full h-11 rounded-[20px]" />
        </div>

        {/* Categories Skeleton */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar px-1 -mx-4 pl-4 items-center">
          {[1, 2, 3, 4, 5].map((i) => (
            <CategorySkeleton key={i} />
          ))}
        </div>

        {/* Action Buttons Skeleton */}
        <div className="grid grid-cols-2 gap-3 px-1">
          <Skeleton variant="rectangular" className="w-full h-11 rounded-xl" />
          <Skeleton variant="rectangular" className="w-full h-11 rounded-xl" />
        </div>

        {/* Section Header Skeleton */}
        <section className="pt-2">
          <div className="flex items-center justify-between px-1 mb-3">
            <Skeleton variant="text" width={80} height={20} />
            <Skeleton variant="text" width={60} height={14} />
          </div>

          {/* Feed Items Skeleton */}
          <div className="columns-2 gap-3 space-y-3 px-0.5 pb-24">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <FeedItemSkeleton key={i} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
