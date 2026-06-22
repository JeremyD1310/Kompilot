import { QuickScheduleWidget } from '../QuickScheduleWidget';
import { AISuggestionsBlock, type AISuggestion } from '../AISuggestionsBlock';
import { SparkDuJourBlock } from '../SparkDuJourBlock';

interface ContentAITabProps {
  onUseSuggestion: (s: AISuggestion) => void;
  onUseSpark: (text: string) => void;
}

export function ContentAITab({ onUseSuggestion, onUseSpark }: ContentAITabProps) {
  return (
    <div className="space-y-5">
      {/* Quick schedule */}
      <QuickScheduleWidget />

      {/* AI Suggestions */}
      <div data-tour="ai-suggestions">
        <AISuggestionsBlock onUseSuggestion={onUseSuggestion} />
      </div>

      {/* Spark du Jour */}
      <div data-tour="spark-du-jour" className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <SparkDuJourBlock onUseSpark={onUseSpark} />
      </div>
    </div>
  );
}
