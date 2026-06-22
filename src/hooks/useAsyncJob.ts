/**
 * useAsyncJob — React hook to fire a heavy AI job asynchronously.
 *
 * Usage:
 *   const { fire, isActive, progress, label } = useAsyncJob('bulk_calendar');
 *
 *   fire(async () => { return await heavyAICall(); }, {
 *     onDone: (result) => setCalendar(result),
 *   });
 *
 *   // Show immediately: toast "Copilote au travail 🚀"
 *   // UI is unblocked instantly — result arrives later
 */

import { useState, useCallback, useEffect } from 'react';
import { toast } from '@blinkdotnew/ui';
import { enqueueJob, subscribeJobs, getJobs, type JobType } from '../lib/asyncJobManager';

interface UseAsyncJobReturn<T> {
  /** Fire the job — returns immediately, runs in background */
  fire: (work: () => Promise<T>, callbacks?: {
    onDone?: (result: T) => void;
    onError?: (err: string) => void;
  }) => void;
  /** True while this job type is running */
  isActive: boolean;
  /** 0–100 progress */
  progress: number;
  /** Current step label */
  stepLabel: string;
  /** Job id of the running job */
  jobId: string | null;
}

// Launch labels per type
const LAUNCH_LABELS: Record<JobType, string> = {
  bulk_calendar: '🚀 Copilote au travail ! Votre calendrier de 30 jours est en cours de génération. Vous pouvez continuer à utiliser l\'app.',
  geo_radar:     '🔭 Scan GEO lancé ! L\'IA interroge ChatGPT, Gemini et Perplexity. Résultat dans quelques secondes.',
  seo_article:   '✍️ Rédaction en cours ! L\'article SEO sera prêt dans quelques instants.',
  bulk_reply:    '💬 Génération des réponses en cours… Revenez dans quelques secondes.',
};

const DONE_LABELS: Record<JobType, string> = {
  bulk_calendar: '✅ Votre calendrier de 30 jours est prêt !',
  geo_radar:     '✅ Rapport GEO disponible ! Consultez vos résultats.',
  seo_article:   '✅ Article SEO généré — copiez-le dans votre calendrier.',
  bulk_reply:    '✅ Réponses générées avec succès.',
};

export function useAsyncJob<T = unknown>(type: JobType): UseAsyncJobReturn<T> {
  const [isActive, setIsActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepLabel, setStepLabel] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);

  // Sync with job store
  useEffect(() => {
    const sync = () => {
      const jobs = getJobs();
      const active = jobs.find(j => j.type === type && j.status === 'running');
      if (active) {
        setIsActive(true);
        setProgress(active.progress);
        if (jobId !== active.id) setJobId(active.id);
      } else if (isActive) {
        // job just finished
        setIsActive(false);
        setProgress(0);
        setStepLabel('');
      }
    };
    sync();
    return subscribeJobs(sync);
  }, [type, isActive, jobId]);

  const fire = useCallback((
    work: () => Promise<T>,
    callbacks?: { onDone?: (result: T) => void; onError?: (err: string) => void }
  ) => {
    // Show instant success toast — user is unblocked
    toast.success(LAUNCH_LABELS[type], { duration: 5000 });
    setIsActive(true);
    setProgress(5);

    enqueueJob<T>({
      type,
      work,
      onProgress: (pct, label) => {
        setProgress(pct);
        setStepLabel(label);
      },
      onDone: (result) => {
        setIsActive(false);
        toast.success(DONE_LABELS[type], { duration: 6000 });
        callbacks?.onDone?.(result);
      },
      onError: (err) => {
        setIsActive(false);
        toast.error(`Erreur : ${err}`);
        callbacks?.onError?.(err);
      },
    }).then(id => setJobId(id));
  }, [type]);

  return { fire, isActive, progress, stepLabel, jobId };
}
