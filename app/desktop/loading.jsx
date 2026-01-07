export default function DesktopLoading() {
  return (
    <div className="min-h-screen bg-[#F7F6E2] dark:bg-black transition-colors duration-300">
      {/* Sidebar Skeleton */}
      <div className="hidden lg:flex w-72 h-screen fixed left-0 top-0 bg-white dark:bg-neutral-950 border-r border-[#2E2D2B]/5 dark:border-white/5 flex-col z-50 p-8">
         <div className="w-32 h-10 bg-[#2E2D2B]/10 dark:bg-white/10 rounded-xl animate-pulse mb-8" />
         <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="w-full h-12 bg-[#2E2D2B]/5 dark:bg-white/5 rounded-2xl animate-pulse" />
            ))}
         </div>
      </div>

      {/* Main Content Area */}
      <div className="lg:ml-72 flex flex-col min-h-screen">
        {/* Top Header Skeleton */}
        <div className="h-20 bg-white/50 dark:bg-black/50 backdrop-blur-md sticky top-0 z-40 border-b border-[#2E2D2B]/5 dark:border-white/5 px-8 flex items-center justify-between">
           <div className="w-64 h-10 bg-[#2E2D2B]/5 dark:bg-white/5 rounded-xl animate-pulse" />
           <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-[#2E2D2B]/5 dark:bg-white/5 animate-pulse" />
              <div className="w-10 h-10 rounded-full bg-[#2E2D2B]/5 dark:bg-white/5 animate-pulse" />
           </div>
        </div>

        {/* Page Content Skeleton */}
        <main className="p-4 lg:p-8 space-y-8">
           {/* Banner Skeleton */}
           <div className="w-full h-[300px] rounded-[2.5rem] bg-[#2E2D2B]/5 dark:bg-white/5 animate-pulse" />
           
           {/* Filters Skeleton */}
           <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="w-32 h-12 rounded-xl bg-[#2E2D2B]/5 dark:bg-white/5 animate-pulse shrink-0" />
              ))}
           </div>

           {/* Cards Grid Skeleton */}
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="bg-white dark:bg-neutral-900 rounded-[2rem] border border-[#2E2D2B]/5 dark:border-white/5 h-[350px] overflow-hidden">
                   <div className="h-48 bg-[#2E2D2B]/5 dark:bg-white/5 animate-pulse" />
                   <div className="p-5 space-y-3">
                      <div className="w-24 h-4 bg-[#2E2D2B]/5 dark:bg-white/5 rounded-full animate-pulse" />
                      <div className="w-full h-4 bg-[#2E2D2B]/5 dark:bg-white/5 rounded-full animate-pulse" />
                      <div className="w-3/4 h-4 bg-[#2E2D2B]/5 dark:bg-white/5 rounded-full animate-pulse" />
                   </div>
                </div>
              ))}
           </div>
        </main>
      </div>
    </div>
  );
}
