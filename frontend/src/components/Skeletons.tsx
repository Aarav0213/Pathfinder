function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200/80 ${className}`} />;
}

export function JobListSkeleton() {
  return (
    <div className="grid gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="card p-6">
          <SkeletonBlock className="h-6 w-1/3" />
          <SkeletonBlock className="mt-3 h-4 w-1/4" />
          <SkeletonBlock className="mt-4 h-4 w-full" />
          <SkeletonBlock className="mt-2 h-4 w-5/6" />
          <SkeletonBlock className="mt-6 h-10 w-28" />
        </div>
      ))}
    </div>
  );
}

export function JobDetailSkeleton() {
  return (
    <div className="card p-8">
      <SkeletonBlock className="h-8 w-2/5" />
      <SkeletonBlock className="mt-3 h-4 w-1/4" />
      <SkeletonBlock className="mt-8 h-4 w-full" />
      <SkeletonBlock className="mt-2 h-4 w-11/12" />
      <SkeletonBlock className="mt-2 h-4 w-4/5" />
      <SkeletonBlock className="mt-8 h-40 w-full" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card p-6">
        <SkeletonBlock className="h-6 w-1/3" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-11 w-full" />
          ))}
        </div>
      </div>
      <div className="card p-6">
        <SkeletonBlock className="h-6 w-1/3" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ApplicationsSkeleton() {
  return (
    <div className="card p-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="mb-4 rounded-xl border border-slate-200 p-4">
          <SkeletonBlock className="h-5 w-2/5" />
          <SkeletonBlock className="mt-3 h-4 w-1/4" />
        </div>
      ))}
    </div>
  );
}

