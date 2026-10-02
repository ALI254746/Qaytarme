function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded bg-neutral-200 ${className}`} />;
}

export default function MapLoading() {
  return (
    <div className="flex min-h-[620px] flex-col gap-2.5 pb-2 pt-3 lg:h-[calc(100dvh-8px)] lg:min-h-[640px]" aria-label="Hududiy xarita yuklanmoqda">
      <div className="flex shrink-0 items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-2 w-28" />
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-3 w-72" />
        </div>
        <Skeleton className="h-8 w-52" />
      </div>
      <div className="flex shrink-0 flex-wrap gap-1.5 rounded-lg border border-neutral-200 bg-white p-1.5">
        {[230, 104, 120, 116, 105, 108, 76].map((width, index) => (
          <Skeleton key={index} className="h-9" style={{ width }} />
        ))}
      </div>
      <div className="grid min-h-0 flex-1 gap-2 lg:grid-cols-[minmax(250px,0.38fr)_minmax(0,1fr)]">
        <div className="flex min-h-[210px] flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-2">
          <Skeleton className="h-9 w-full" />
          {[1, 2, 3, 4].map((row) => <Skeleton key={row} className="h-16 w-full" />)}
        </div>
        <div className="relative min-h-[260px] overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
          <div className="absolute right-2 top-2 w-52 space-y-2 rounded-lg border border-neutral-200 bg-white p-3">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      </div>
      <Skeleton className="h-10 w-full shrink-0 rounded-lg" />
    </div>
  );
}
