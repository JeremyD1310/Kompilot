/**
 * DashboardSkeletons — Pulse skeleton placeholders for dashboard components.
 *
 * Displayed during initial data loading to prevent screen freeze and provide
 * instant visual feedback. Components switch to real content once data loads.
 */

/** Full-page dashboard skeleton — shown while auth + data is loading */
export function DashboardPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#0B1120]" aria-hidden>
      {/* Header skeleton */}
      <div className="flex items-center justify-between px-5 md:px-7 py-3.5 border-b border-white/[0.06]">
        <div className="h-6 bg-white/[0.06] rounded-full w-40 animate-pulse" />
        <div className="flex gap-2">
          <div className="h-8 bg-white/[0.06] rounded-lg w-24 animate-pulse" />
          <div className="h-8 bg-teal-500/20 rounded-lg w-32 animate-pulse" />
        </div>
      </div>
      {/* KPI cards */}
      <div className="px-5 md:px-7 pt-6 pb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-white/[0.07] bg-[#0F172A] px-5 py-4 flex flex-col gap-3">
            <div className="w-4 h-4 bg-white/[0.06] rounded-full animate-pulse" />
            <div>
              <div className="h-7 bg-white/[0.08] rounded-full w-10 animate-pulse mb-1.5" />
              <div className="h-2.5 bg-white/[0.04] rounded-full w-28 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
      {/* Two-col body */}
      <div className="px-5 md:px-7 pt-2 flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-3">
          <div className="h-2.5 bg-white/[0.04] rounded-full w-24 animate-pulse mb-3" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-[#0F172A] p-3.5">
              <div className="w-9 h-9 rounded-lg bg-white/[0.06] animate-pulse shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-white/[0.08] rounded-full w-32 animate-pulse" />
                <div className="h-2.5 bg-white/[0.04] rounded-full w-48 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
        <div className="w-full lg:w-80 shrink-0 space-y-4">
          <div className="rounded-xl border border-white/[0.07] bg-[#0F172A] p-5 space-y-3">
            <div className="h-3.5 bg-white/[0.08] rounded-full w-28 animate-pulse" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-white/[0.04] rounded-lg animate-pulse" />
            ))}
          </div>
          <div className="rounded-xl border border-white/[0.07] bg-[#0F172A] p-4 space-y-3">
            <div className="h-3 bg-white/[0.06] rounded-full w-36 animate-pulse" />
            <div className="h-2.5 bg-white/[0.04] rounded-full w-full animate-pulse" />
            <div className="h-2.5 bg-white/[0.04] rounded-full w-4/5 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Skeleton for the MiniKPIStrip (5-card grid) */
export function KPIStripSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3" aria-hidden>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card px-4 py-3 flex flex-col gap-2">
          <div className="h-2.5 bg-muted rounded-full w-2/3 animate-pulse" />
          <div className="h-6 bg-muted rounded-full w-1/2 animate-pulse" />
          <div className="h-2 bg-muted rounded-full w-3/4 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

/** Skeleton for UsageProgressBar */
export function UsageBarSkeleton() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5" aria-hidden>
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 bg-muted rounded-full w-56 animate-pulse" />
        <div className="h-6 bg-muted rounded-full w-24 animate-pulse" />
      </div>
      <div className="space-y-2">
        <div className="h-2.5 w-full rounded-full bg-muted animate-pulse" />
        <div className="flex justify-between">
          <div className="h-2.5 bg-muted rounded-full w-40 animate-pulse" />
          <div className="h-2.5 bg-muted rounded-full w-8 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

/** Skeleton for the local visibility widget */
export function LocalVisibilitySkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5" aria-hidden>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3.5 bg-muted rounded-full w-40 animate-pulse" />
          <div className="h-2.5 bg-muted rounded-full w-28 animate-pulse" />
        </div>
        <div className="w-16 h-7 bg-muted rounded-full animate-pulse" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border p-3 space-y-2">
            <div className="h-2.5 bg-muted rounded-full w-3/4 animate-pulse" />
            <div className="h-5 bg-muted rounded-full w-1/2 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Skeleton for planning table rows */
export function PlanningTableSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden" aria-hidden>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
        <div className="h-3.5 bg-muted rounded-full w-36 animate-pulse" />
        <div className="h-3 bg-muted rounded-full w-20 animate-pulse" />
      </div>
      <div className="divide-y divide-border">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2.5">
            <div className="w-2 h-2 rounded-full bg-muted animate-pulse shrink-0" />
            <div className="h-2.5 bg-muted rounded-full w-24 animate-pulse shrink-0" />
            <div className="h-2.5 bg-muted rounded-full flex-1 animate-pulse" />
            <div className="h-5 bg-muted rounded-full w-14 animate-pulse shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
