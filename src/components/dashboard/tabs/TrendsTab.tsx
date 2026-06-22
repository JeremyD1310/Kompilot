import { TrendRadarWidget } from '../TrendRadarWidget';
import { TrendWatchSection } from '../TrendWatchSection';
import { TrendingWidget } from '../TrendingWidget';

interface TrendsTabProps {
  onOpenCreatePost: (text?: string) => void;
}

export function TrendsTab({ onOpenCreatePost }: TrendsTabProps) {
  return (
    <div className="space-y-5">
      {/* Radar de tendances & algorithmes */}
      <TrendRadarWidget onOpenStoryCreator={() => onOpenCreatePost()} />

      {/* Trend Watch — tendances sectorielles */}
      <div data-tour="trend-watch" className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm overflow-hidden">
        <TrendWatchSection
          onUseTrend={(hashtag) => onOpenCreatePost(`${hashtag} `)}
        />
      </div>

      {/* Trending topics */}
      <TrendingWidget />
    </div>
  );
}
