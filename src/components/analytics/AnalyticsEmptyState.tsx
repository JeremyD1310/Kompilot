import { BarChart3 } from 'lucide-react';
import { EmptyStateOverlay } from '../shared/EmptyStateOverlay';

function AnalyticsSkeletonContent() {
  return (
    <div className="space-y-5">
      {/* 3 KPI skeleton cards */}
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="skeleton h-3 w-1/2 rounded" />
            <div className="skeleton h-8 w-3/4 rounded" />
            <div className="skeleton h-2.5 w-1/3 rounded" />
          </div>
        ))}
      </div>

      {/* Large area chart skeleton */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="skeleton h-3 w-1/4 rounded" />
        <div className="skeleton h-[280px] w-full rounded-lg" />
      </div>

      {/* 2 smaller chart skeletons side by side */}
      <div className="grid grid-cols-2 gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="skeleton h-3 w-1/3 rounded" />
            <div className="skeleton h-[200px] w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnalyticsEmptyState() {
  return (
    <EmptyStateOverlay
      title="Connectez votre premier réseau"
      description="Vos statistiques de portée, d'engagement et de publications apparaîtront ici une fois vos réseaux sociaux connectés."
      ctaLabel="Connecter mes réseaux"
      ctaHref="/settings"
      icon={<BarChart3 className="h-12 w-12 text-primary" />}
    >
      <AnalyticsSkeletonContent />
    </EmptyStateOverlay>
  );
}
