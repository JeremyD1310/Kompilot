/**
 * PageSkeleton & PageError — Reusable loading/error states for pages.
 *
 * Usage:
 *   {isLoading && <PageSkeleton rows={5} />}
 *   {isError && <PageError message="..." onRetry={refetch} />}
 */
import { Skeleton, Button } from '@blinkdotnew/ui';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// ── PageSkeleton ──────────────────────────────────────────────────────────

interface PageSkeletonProps {
  rows?: number;
  header?: boolean;
}

export function PageSkeleton({ rows = 6, header = true }: PageSkeletonProps) {
  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 animate-pulse">
      {header && (
        <div className="flex items-center gap-3 mb-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-5 w-48 mb-1" />
            <Skeleton className="h-3 w-72" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={`stat-${i}`} className="rounded-xl border border-border p-4">
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </div>

      {Array.from({ length: rows }).map((_, i) => (
        <div key={`row-${i}`} className="rounded-xl border border-border p-4">
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      ))}
    </div>
  );
}

// ── PageError ────────────────────────────────────────────────────────────

interface PageErrorProps {
  message?: string;
  onRetry?: () => void;
}

export function PageError({
  message = 'Une erreur est survenue lors du chargement des données.',
  onRetry,
}: PageErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
        <AlertTriangle size={26} className="text-destructive" />
      </div>
      <h2 className="text-lg font-bold text-foreground mb-2">Erreur de chargement</h2>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="gap-2">
          <RefreshCw size={14} />
          Réessayer
        </Button>
      )}
    </div>
  );
}
