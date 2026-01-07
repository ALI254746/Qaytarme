export default function MobileLoading() {
  return (
    <div className="min-h-screen bg-[#F7F6E2] dark:bg-black pb-24">
      {/* Top Bar Skeleton */}
      <div className="bg-white dark:bg-neutral-900 px-4 py-3 flex items-center justify-between sticky top-0 z-30 border-b border-[#2E2D2B]/5 dark:border-white/5">
        <div className="w-8 h-8 rounded-full bg-[#2E2D2B]/5 dark:bg-white/5 animate-pulse" />
        <div className="w-32 h-6 bg-[#2E2D2B]/5 dark:bg-white/5 rounded-full animate-pulse" />
        <div className="w-8 h-8 rounded-full bg-[#2E2D2B]/5 dark:bg-white/5 animate-pulse" />
      </div>

      <div className="p-4 space-y-6">
        {/* Banner Skeleton */}
        <div className="w-full h-40 rounded-3xl bg-[#2E2D2B]/5 dark:bg-white/5 animate-pulse" />

        {/* Stories/Filters Skeleton */}
        <div className="flex gap-3 overflow-hidden">
           {[1, 2, 3, 4].map(i => (
             <div key={i} className="w-16 h-16 rounded-full bg-[#2E2D2B]/5 dark:bg-white/5 animate-pulse shrink-0" />
           ))}
        </div>

        {/* Feed Skeleton */}
        <div className="space-y-4">
           {[1, 2, 3, 4].map(i => (
             <div key={i} className="bg-white dark:bg-neutral-900 rounded-3xl p-4 border border-[#2E2D2B]/5 dark:border-white/5">
                <div className="flex gap-3 mb-3">
                   <div className="w-10 h-10 rounded-full bg-[#2E2D2B]/5 dark:bg-white/5 animate-pulse" />
                   <div className="space-y-2">
                      <div className="w-24 h-3 bg-[#2E2D2B]/5 dark:bg-white/5 rounded-full animate-pulse" />
                      <div className="w-16 h-2 bg-[#2E2D2B]/5 dark:bg-white/5 rounded-full animate-pulse" />
                   </div>
                </div>
                <div className="w-full h-48 rounded-2xl bg-[#2E2D2B]/5 dark:bg-white/5 animate-pulse mb-3" />
                <div className="w-full h-4 bg-[#2E2D2B]/5 dark:bg-white/5 rounded-full animate-pulse" />
             </div>
           ))}
        </div>
      </div>
      
      {/* Bottom Nav Skeleton */}
      <div className="fixed bottom-0 left-0 w-full h-20 bg-white dark:bg-neutral-900 border-t border-[#2E2D2B]/5 dark:border-white/5 flex items-center justify-around px-6">
         {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="w-8 h-8 rounded-full bg-[#2E2D2B]/5 dark:bg-white/5 animate-pulse" />
         ))}
      </div>
    </div>
  );
}
