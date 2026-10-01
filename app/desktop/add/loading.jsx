function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-md bg-neutral-200 ${className}`} aria-hidden="true" />;
}

export default function AddItemLoading() {
  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 pb-4 pt-4 sm:px-8 lg:px-8 lg:pt-[18px]">
      <header className="mb-[14px] flex min-h-[42px] items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-3 w-44" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-px w-8 sm:w-12" />
          <Skeleton className="h-6 w-32 rounded-full" />
        </div>
      </header>

      <section className="overflow-hidden rounded-[14px] border border-neutral-200 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <div className="grid md:grid-cols-[0.7fr_1fr]">
          <div className="space-y-5 border-b border-neutral-100 p-4 sm:p-5 md:border-b-0 md:border-r">
            <div className="space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>

          <div className="space-y-2 p-4 sm:p-5">
            {[1, 2, 3].map((field) => (
              <div key={field} className="space-y-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-[30px] w-full rounded-lg" />
              </div>
            ))}
            <div className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-[68px] w-full rounded-lg" />
            </div>
            <div className="space-y-2 pt-1">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-56" />
              <Skeleton className="h-3 w-44" />
              <Skeleton className="h-3 w-full max-w-64" />
            </div>
          </div>
        </div>

        <footer className="flex h-[65px] items-center justify-between gap-3 border-t border-neutral-100 px-4 sm:px-5">
          <Skeleton className="h-3 w-20" />
          <div className="flex items-center gap-3">
            <Skeleton className="hidden h-3 w-24 sm:block" />
            <Skeleton className="h-9 w-36 rounded-lg" />
          </div>
        </footer>
      </section>
    </div>
  );
}
