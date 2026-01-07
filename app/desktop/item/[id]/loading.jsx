export default function ItemDetailsLoading() {
  return (
    <div className="min-h-screen bg-[#F7F6E2] dark:bg-black p-4 lg:p-8 animate-in fade-in">
        <div className="max-w-6xl mx-auto">
            {/* Back Button Skeleton */}
            <div className="w-32 h-6 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse mb-8" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                {/* Left: Image Skeleton */}
                <div className="aspect-square lg:aspect-[4/3] rounded-[2.5rem] bg-white dark:bg-neutral-900 shadow-xl overflow-hidden border border-[#2E2D2B]/5 dark:border-white/5 relative">
                   <div className="w-full h-full bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                   {/* Badge hint */}
                   <div className="absolute top-6 left-6 w-24 h-8 rounded-lg bg-neutral-300 dark:bg-neutral-700 animate-pulse" />
                </div>

                {/* Right: Info Skeleton */}
                <div className="space-y-8">
                    {/* Header */}
                    <div className="space-y-4">
                       <div className="w-24 h-6 bg-neutral-200 dark:bg-neutral-800 rounded-full animate-pulse" />
                       <div className="w-3/4 h-12 bg-neutral-200 dark:bg-neutral-800 rounded-2xl animate-pulse" />
                       <div className="w-full h-4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
                       <div className="w-2/3 h-4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
                    </div>

                    {/* Author Card Skeleton */}
                    <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-[#2E2D2B]/5 dark:border-white/5 space-y-4">
                        <div className="flex items-center gap-4">
                           <div className="w-14 h-14 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                           <div className="space-y-2">
                              <div className="w-32 h-4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
                              <div className="w-20 h-3 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
                           </div>
                        </div>
                        <div className="flex gap-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                           <div className="flex-1 h-12 bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
                           <div className="flex-1 h-12 bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
                        </div>
                    </div>

                    {/* Map Hint */}
                    <div className="h-48 rounded-3xl bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                </div>
            </div>
        </div>
    </div>
  );
}
