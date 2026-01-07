export default function MapLoading() {
  return (
    <div className="h-[calc(100vh-64px)] lg:h-screen w-full relative bg-[#F7F6E2] dark:bg-black overflow-hidden">
       {/* Map Placeholder */}
       <div className="absolute inset-0 bg-neutral-200 dark:bg-neutral-900 animate-pulse">
          {/* Simulated Grid/Map Lines */}
          <div className="w-full h-full opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
       </div>

       {/* Sidebar / Overlay Skeleton */}
       <div className="absolute top-4 left-4 lg:top-8 lg:left-8 z-10 w-[calc(100%-32px)] lg:w-96 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl p-4 rounded-3xl border border-white/20 shadow-xl space-y-4">
          {/* Search Bar Skeleton */}
          <div className="h-12 bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
          
          {/* Filter Chips Skeleton */}
          <div className="flex gap-2 overflow-hidden">
             {[1, 2, 3].map(i => (
                <div key={i} className="h-8 w-20 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
             ))}
          </div>

          {/* List Items Skeleton */}
          <div className="space-y-3 pt-2">
             {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3 p-2">
                   <div className="w-16 h-16 rounded-xl bg-neutral-200 dark:bg-neutral-800 animate-pulse shrink-0" />
                   <div className="flex-1 space-y-2">
                      <div className="w-3/4 h-4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
                      <div className="w-1/2 h-3 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
                   </div>
                </div>
             ))}
          </div>
       </div>

       {/* Map Controls Skeleton (Zoom, etc) */}
       <div className="absolute bottom-24 right-4 lg:bottom-8 lg:right-8 flex flex-col gap-2">
          <div className="w-10 h-10 bg-white dark:bg-neutral-900 rounded-xl shadow-lg animate-pulse" />
          <div className="w-10 h-10 bg-white dark:bg-neutral-900 rounded-xl shadow-lg animate-pulse" />
       </div>
    </div>
  );
}
