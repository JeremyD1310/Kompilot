import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTeamActivity } from '../../hooks/useTeamActivity';
import { EmptyState } from '@blinkdotnew/ui';

interface TeamActivityPanelProps { workspaceOwnerId?: string; className?: string; limit?: number; }

export function TeamActivityPanel({ workspaceOwnerId, className, limit = 30 }: TeamActivityPanelProps) {
  const { items, isLoading } = useTeamActivity(workspaceOwnerId);
  const displayed = items.slice(0, limit);
  return (
    <div className={cn('flex flex-col h-full min-h-0', className)}>
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-1">
        {isLoading && [1,2,3,4].map(i => <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"><div className="w-8 h-8 rounded-full bg-muted animate-pulse shrink-0" /><div className="flex-1 space-y-1"><div className="h-3 bg-muted rounded animate-pulse w-3/4" /><div className="h-2.5 bg-muted/60 rounded animate-pulse w-1/3" /></div></div>)}
        {!isLoading && displayed.length === 0 && <div className="flex flex-col items-center justify-center py-10"><EmptyState icon={<Activity />} title="Aucune activité récente" description="Les actions de votre équipe apparaîtront ici." /></div>}
        {displayed.map((item, idx) => (
          <div key={item.id} className={cn('flex items-start gap-2.5 px-3 py-2.5 rounded-xl hover:bg-muted/30 transition-colors', idx === 0 && 'bg-primary/3')}>
            <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-base shrink-0">{item.emoji}</div>
            <div className="flex-1 min-w-0"><p className="text-xs text-foreground leading-snug">{item.text}</p><p className="text-[10px] text-muted-foreground mt-0.5">{item.timeAgo}</p></div>
            {idx === 0 && <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-primary animate-pulse mt-1.5" />}
          </div>
        ))}
      </div>
    </div>
  );
}
