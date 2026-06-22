import { Calendar } from 'lucide-react';
import { EmptyStateOverlay } from '../shared/EmptyStateOverlay';

interface CalendarEmptyStateProps {
  onCreatePost: () => void;
}

function CalendarSkeletonContent() {
  return (
    <div className="space-y-3">
      {/* Month header skeleton */}
      <div className="flex items-center gap-3 px-1 py-2">
        <div className="skeleton h-5 w-[140px] rounded" />
        <div className="ml-auto flex gap-2">
          <div className="skeleton h-8 w-8 rounded-lg" />
          <div className="skeleton h-8 w-8 rounded-lg" />
        </div>
      </div>

      {/* Week day header — 7 pills */}
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="skeleton h-7 rounded-md" />
        ))}
      </div>

      {/* 5 × 7 day grid */}
      {Array.from({ length: 5 }).map((_, row) => (
        <div key={row} className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 7 }).map((_, col) => (
            <div
              key={col}
              className="skeleton h-[80px] rounded-lg border border-border/40"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CalendarEmptyState({ onCreatePost }: CalendarEmptyStateProps) {
  return (
    <EmptyStateOverlay
      title="Planifiez votre premier post"
      description="Votre calendrier éditorial apparaîtra ici. Commencez par planifier votre premier contenu pour rester visible en ligne."
      ctaLabel="Planifier mon premier post"
      ctaOnClick={onCreatePost}
      icon={<Calendar className="h-12 w-12 text-primary" />}
    >
      <CalendarSkeletonContent />
    </EmptyStateOverlay>
  );
}
