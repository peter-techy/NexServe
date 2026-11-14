export default function PortalLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-white/60">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-200/80 rounded-lg animate-pulse" />
          <div className="h-4 w-72 bg-slate-200/50 rounded-md animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-28 bg-slate-200/60 rounded-xl animate-pulse" />
          <div className="h-9 w-32 bg-slate-200/80 rounded-xl animate-pulse" />
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/60 bg-white/60 p-4 shadow-sm backdrop-blur-md space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 bg-slate-200/80 rounded animate-pulse" />
              <div className="size-7 bg-slate-200/60 rounded-lg animate-pulse" />
            </div>
            <div className="h-7 w-16 bg-slate-300/70 rounded-md animate-pulse" />
            <div className="h-3 w-32 bg-slate-200/50 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-white/60 bg-white/60 p-5 shadow-sm backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/60">
              <div className="space-y-1.5">
                <div className="h-5 w-40 bg-slate-200/80 rounded animate-pulse" />
                <div className="h-3 w-56 bg-slate-200/50 rounded animate-pulse" />
              </div>
              <div className="h-7 w-20 bg-slate-200/60 rounded-lg animate-pulse" />
            </div>
            <div className="space-y-3 pt-2">
              {[1, 2, 3, 4, 5].map((row) => (
                <div
                  key={row}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/50 border border-white/60"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-slate-200/70 animate-pulse" />
                    <div className="space-y-1">
                      <div className="h-4 w-36 bg-slate-200/80 rounded animate-pulse" />
                      <div className="h-3 w-24 bg-slate-200/50 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="h-6 w-20 bg-slate-200/60 rounded-md animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-white/60 bg-white/60 p-5 shadow-sm backdrop-blur-md space-y-4">
            <div className="h-5 w-32 bg-slate-200/80 rounded animate-pulse" />
            <div className="space-y-2 pt-2">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-10 w-full bg-white/50 border border-white/60 rounded-xl animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
