/**
 * AsyncJobToast — floating progress bar shown while a background job runs.
 * Mounts globally; listens to job events; auto-dismisses on completion.
 */
import { useState, useEffect } from 'react';
import { subscribeJobs, getJobs, type AsyncJob, type JobType } from '../../lib/asyncJobManager';
import { CheckCircle2, Zap, X } from 'lucide-react';
import { cn } from '../../lib/utils';

const TYPE_ICONS: Record<JobType, string> = {
  bulk_calendar: '📅',
  geo_radar:     '🔭',
  seo_article:   '✍️',
  bulk_reply:    '💬',
};

function JobBar({ job, onDismiss }: { job: AsyncJob; onDismiss: () => void }) {
  return (
    <div className={cn(
      'flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm transition-all',
      job.status === 'done'
        ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/50'
        : job.status === 'error'
          ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800/50'
          : 'bg-background border-border'
    )}>
      <span className="text-lg shrink-0">{TYPE_ICONS[job.type]}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <p className="text-xs font-bold text-foreground">{job.label}</p>
          {job.status === 'done' && <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />}
          {job.status === 'running' && (
            <span className="text-[9px] font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5">
              En cours…
            </span>
          )}
        </div>
        {job.status === 'running' && (
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${job.progress}%` }}
            />
          </div>
        )}
        {job.status === 'done' && (
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
            Terminé — résultat disponible ✓
          </p>
        )}
        {job.status === 'error' && (
          <p className="text-[10px] text-red-600 dark:text-red-400 font-semibold">
            Erreur — Réessayez ou vérifiez vos crédits.
          </p>
        )}
      </div>
      {(job.status === 'done' || job.status === 'error') && (
        <button onClick={onDismiss} className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors shrink-0">
          <X size={12} />
        </button>
      )}
      {job.status === 'running' && (
        <div className="shrink-0">
          <Zap size={14} className="text-primary animate-pulse" />
        </div>
      )}
    </div>
  );
}

export function AsyncJobToast() {
  const [jobs, setJobs] = useState<AsyncJob[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const sync = () => {
      const all = getJobs();
      // Show jobs from last 5 minutes
      const recent = all.filter(j => Date.now() - j.createdAt < 5 * 60_000);
      setJobs(recent);
    };
    sync();
    return subscribeJobs(sync);
  }, []);

  const visible = jobs.filter(j =>
    !dismissed.has(j.id) &&
    (j.status === 'running' || j.status === 'done' || j.status === 'error')
  );

  if (visible.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col gap-2 w-72 sm:w-80">
      {visible.map(job => (
        <JobBar
          key={job.id}
          job={job}
          onDismiss={() => setDismissed(prev => new Set([...prev, job.id]))}
        />
      ))}
    </div>
  );
}
