export default function AddItemLoading() {
  return (
    <div className="min-h-screen bg-ivory dark:bg-black p-4 lg:p-8 flex items-center justify-center">
      <div className="w-full max-w-4xl bg-white dark:bg-neutral-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] border border-neutral-100 dark:border-white/5">
        
        {/* Sidebar Skeleton */}
        <div className="w-full md:w-1/3 bg-neutral-50 dark:bg-neutral-950 border-b md:border-b-0 md:border-r border-neutral-100 dark:border-white/5 p-8 flex flex-col">
          <div className="w-24 h-6 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse mb-10" />
          
          <div className="space-y-6">
            <div className="w-32 h-8 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse mb-6" />
            
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex gap-4">
                 <div className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse shrink-0" />
                 <div className="space-y-2 flex-1">
                    <div className="w-24 h-4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
                    <div className="w-16 h-2 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
                 </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Area Skeleton */}
        <div className="flex-1 p-8 lg:p-12 relative flex flex-col">
           <div className="my-auto space-y-8">
              <div className="space-y-3">
                 <div className="w-48 h-8 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
                 <div className="w-64 h-4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="h-64 rounded-3xl bg-neutral-100 dark:bg-neutral-800 animate-pulse border-2 border-transparent" />
                 <div className="h-64 rounded-3xl bg-neutral-100 dark:bg-neutral-800 animate-pulse border-2 border-transparent" />
              </div>
           </div>

           <div className="mt-8 flex items-center justify-between pt-6 border-t border-neutral-100 dark:border-white/5">
              <div className="w-24 h-10 bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
              <div className="w-32 h-12 bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
           </div>
        </div>

      </div>
    </div>
  );
}
