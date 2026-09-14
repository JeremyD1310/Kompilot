/**
 * ConnectionStatusWidget — Shows connection status for each social platform
 */
import { useFacebookStatus, useInstagramStatus, useLinkedInStatus, useTiktokStatus, useGbpStatus, useYouTubeStatus } from '@/hooks/useSocialPublish';
import { cn } from '@/lib/utils';

const STATUS_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  facebook:       { label: 'Facebook',       icon: '📘', color: '#1877F2' },
  instagram:      { label: 'Instagram',       icon: '📸', color: '#E4405F' },
  linkedin:       { label: 'LinkedIn',        icon: '💼', color: '#0A66C2' },
  tiktok:         { label: 'TikTok',          icon: '🎵', color: '#69C9D0' },
  google_business:{ label: 'Google Business', icon: '📍', color: '#4285F4' },
  youtube:        { label: 'YouTube',         icon: '📺', color: '#FF0000' },
};

export function ConnectionStatusWidget() {
  const { data: fbStatus } = useFacebookStatus();
  const { data: igStatus } = useInstagramStatus();
  const { data: liStatus } = useLinkedInStatus();
  const { data: ttStatus } = useTiktokStatus();
  const { data: gbpStatus } = useGbpStatus();
  const { data: ytStatus } = useYouTubeStatus();

  const platforms = [
    { key: 'facebook', connected: !!fbStatus?.connected },
    { key: 'instagram', connected: !!igStatus?.connected },
    { key: 'linkedin', connected: !!liStatus?.connected },
    { key: 'tiktok', connected: !!ttStatus?.connected },
    { key: 'google_business', connected: !!gbpStatus?.connected },
    { key: 'youtube', connected: !!ytStatus?.connected },
  ];

  const connectedCount = platforms.filter(p => p.connected).length;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground font-medium mr-1">
        {connectedCount}/{platforms.length} connectées :
      </span>
      {platforms.map(p => {
        const cfg = STATUS_LABELS[p.key];
        return (
          <span
            key={p.key}
            className={cn(
              'inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border',
              p.connected
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-muted text-muted-foreground border-border'
            )}
          >
            <span>{cfg?.icon}</span>
            {cfg?.label}
            <span className={cn('w-1.5 h-1.5 rounded-full', p.connected ? 'bg-emerald-500' : 'bg-muted-foreground/30')} />
          </span>
        );
      })}
    </div>
  );
}
