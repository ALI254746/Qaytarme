"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { getApiUrl } from "@/lib/api-config";

// --- TINDER-STYLE CARD COMPONENT ---
const MatchCard = ({ item, onSwipe }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const bg = useTransform(
    x,
    [-200, 0, 200],
    ["rgba(239, 68, 68, 0.2)", "rgba(255,255,255,0)", "rgba(169, 211, 201, 0.4)"]
  );

  const handleDragEnd = (_, info) => {
    if (info.offset.x > 100) onSwipe("right"); // Like/Match
    else if (info.offset.x < -100) onSwipe("left"); // Skip
  };

  return (
    <motion.div
      style={{ x, rotate, opacity, background: bg }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      className="absolute top-0 left-0 w-full h-[65vh] bg-white dark:bg-neutral-900 rounded-[3rem] shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing border border-neutral-100 dark:border-neutral-800"
    >
      <div className="relative h-3/5 w-full bg-neutral-200 dark:bg-neutral-800">
        {item.image?.url ? (
          <img src={item.image.url} alt="" className="w-full h-full object-cover pointer-events-none" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">📦</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        
        {/* Similarity Score Badge */}
        <div className="absolute top-6 right-6 bg-mint/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-white/20">
             <span className="text-xl font-black text-neutral-900">{Math.round(item.similarity * 100)}%</span>
             <span className="block text-[8px] font-bold text-neutral-800 uppercase tracking-widest text-center">O'xshashlik</span>
        </div>
      </div>

      <div className="p-8 flex flex-col h-2/5 justify-between relative z-10 bg-white dark:bg-neutral-900">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${item.status === 'found' ? 'bg-mint/20 text-mint' : 'bg-red-100 text-red-500'}`}>
                 {item.status === 'found' ? 'Topilgan' : 'Yo\'qolgan'}
              </span>
              <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">{new Date(item.createdAt).toLocaleDateString()}</span>
           </div>
           <h2 className="text-3xl font-black text-neutral-900 dark:text-white mb-2 line-clamp-1">{item.itemType}</h2>
           <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 line-clamp-2">{item.itemDescription}</p>
        </div>

        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
             <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                {item.user?.avatar ? <img src={item.user.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-neutral-400">{item.user?.name?.[0]}</div>}
             </div>
             <div>
                <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">E'lon egasi</div>
                <div className="text-sm font-black text-neutral-900 dark:text-white">{item.user?.name}</div>
             </div>
        </div>
      </div>

      {/* Swipe Indicators */}
      <motion.div style={{ opacity: useTransform(x, [50, 150], [0, 1]) }} className="absolute top-10 left-10 border-4 border-mint text-mint text-4xl font-black uppercase tracking-widest px-4 py-2 rounded-xl rotate-[-15deg]">
          Ha
      </motion.div>
      <motion.div style={{ opacity: useTransform(x, [-150, -50], [1, 0]) }} className="absolute top-10 right-10 border-4 border-red-500 text-red-500 text-4xl font-black uppercase tracking-widest px-4 py-2 rounded-xl rotate-[15deg]">
          Yo'q
      </motion.div>
    </motion.div>
  );
};

export default function MatchesPage() {
  const params = useParams();
  const router = useRouter();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Mock fetching matches (In real app, call /api/matcher endpoint)
    setTimeout(() => {
        // Fake match data for demo
        const demoMatches = Array.from({ length: 5 }).map((_, i) => ({
            _id: `match-${i}`,
            itemType: "iPhone 14 Pro",
            itemDescription: "Qora rangli, xotirasi 256GB. Ekranida ozgina chiziq bor.",
            status: "found",
            createdAt: new Date(),
            similarity: 0.85 + (Math.random() * 0.14), // 85-99% match
            image: { url: "https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=500&h=500&fit=crop" },
            user: { name: "Azizbek", avatar: null }
        }));
        setMatches(demoMatches);
        setLoading(false);
    }, 1500);
  }, [params.id]);

  const handleSwipe = (direction) => {
     if (direction === 'right') {
         // Handle visual "Check" action - maybe navigate to detail or save match
         const item = matches[currentIndex];
         router.push(`/mainpage/item/${item._id}`);
     }
     setTimeout(() => setCurrentIndex(prev => prev + 1), 200);
  };

  if (loading) {
      return (
          <div className="h-[80vh] flex flex-col items-center justify-center">
              <div className="relative w-32 h-32 mb-8">
                  <div className="absolute inset-0 border-4 border-neutral-200 dark:border-neutral-800 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-mint rounded-full border-t-transparent animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-4xl animate-pulse">⚡</div>
              </div>
              <h2 className="text-xl font-black text-neutral-900 dark:text-white uppercase tracking-tight mb-2">Qidirilmoqda...</h2>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium">Sun'iy intellekt mos variantlarni tahlil qilyapti</p>
          </div>
      );
  }

  if (currentIndex >= matches.length) {
      return (
          <div className="h-[80vh] flex flex-col items-center justify-center text-center px-8">
              <div className="w-24 h-24 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center text-4xl mb-6">🏁</div>
              <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-2">Tugadi!</h2>
              <p className="text-neutral-500 dark:text-neutral-400 mb-8 max-w-xs mx-auto">Hozircha boshqa mos keluvchi e'lonlar topilmadi. Keyinroq yana tekshirib ko'ring.</p>
              <button onClick={() => router.back()} className="px-8 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold rounded-xl uppercase tracking-widest text-xs">Ortga qaytish</button>
          </div>
      );
  }

  return (
    <div className="min-h-screen pb-24 overflow-hidden bg-neutral-50 dark:bg-black">
       {/* Valid Header for Navigation */}
       <div className="p-4 flex items-center gap-4">
           <button onClick={() => router.back()} className="w-10 h-10 bg-white dark:bg-neutral-900 rounded-xl flex items-center justify-center shadow-lg text-neutral-600 dark:text-white">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
           </button>
           <div>
               <h1 className="text-xl font-black text-neutral-900 dark:text-white uppercase tracking-tight">Mos keluvchilar</h1>
               <p className="text-xs font-bold text-mint uppercase tracking-wider">{matches.length} ta natija topildi</p>
           </div>
       </div>

       <div className="relative w-full max-w-md mx-auto h-[70vh] flex items-center justify-center mt-4">
           <AnimatePresence>
               {matches.slice(currentIndex).reverse().map((item, index) => (
                   <MatchCard 
                      key={item._id} 
                      item={item} 
                      onSwipe={handleSwipe} 
                   />
               ))}
           </AnimatePresence>
       </div>

       <p className="text-center text-xs font-bold text-neutral-400 mt-8 uppercase tracking-widest animate-pulse">
          Tanlash uchun kartani suring
       </p>
    </div>
  );
}
