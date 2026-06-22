/**
 * asyncJobManager — Background job queue for heavy AI operations.
 *
 * Pattern:
 *   1. User clicks a heavy action (Bulk Calendar 30j, GEO Radar scan…)
 *   2. Immediately show success animation "Copilote au travail 🚀" — user is unblocked
 *   3. Job runs in background (simulated async, real in Blink Queue future)
 *   4. On completion → push in-app notification + update shared job store
 *
 * Components can subscribe via useAsyncJob() hook.
 */

export type JobStatus = 'queued' | 'running' | 'done' | 'error';
export type JobType = 'bulk_calendar' | 'geo_radar' | 'seo_article' | 'bulk_reply';

export interface AsyncJob {
  id: string;
  type: JobType;
  label: string;
  status: JobStatus;
  progress: number;      // 0–100
  createdAt: number;
  completedAt?: number;
  result?: unknown;
  error?: string;
}

// ── In-memory + localStorage store ───────────────────────────────────────────

const STORE_KEY = 'kompilot_jobs_v1';
const MAX_JOBS = 20;

// Event bus for cross-component reactivity without a full Context
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(fn => fn());
}

export function subscribeJobs(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function readJobs(): AsyncJob[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function writeJobs(jobs: AsyncJob[]): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(jobs.slice(0, MAX_JOBS)));
  } catch { /* noop */ }
}

function upsertJob(job: AsyncJob): void {
  const jobs = readJobs();
  const idx = jobs.findIndex(j => j.id === job.id);
  if (idx >= 0) jobs[idx] = job;
  else jobs.unshift(job);
  writeJobs(jobs);
  notify();
}

// ── Job labels ────────────────────────────────────────────────────────────────

const JOB_LABELS: Record<JobType, string> = {
  bulk_calendar: 'Calendrier 30 jours',
  geo_radar:     'Scan Radar GEO & GEA',
  seo_article:   'Article SEO local',
  bulk_reply:    'Réponses en masse',
};

// ── Progress simulation steps ─────────────────────────────────────────────────

const PROGRESS_STEPS: Record<JobType, { pct: number; delay: number; label: string }[]> = {
  bulk_calendar: [
    { pct: 15,  delay: 600,  label: 'Analyse des objectifs…' },
    { pct: 35,  delay: 1200, label: 'Génération des idées de posts…' },
    { pct: 60,  delay: 1800, label: 'Rédaction des contenus…' },
    { pct: 80,  delay: 1400, label: 'Optimisation des hashtags…' },
    { pct: 100, delay: 900,  label: 'Finalisation du calendrier…' },
  ],
  geo_radar: [
    { pct: 20,  delay: 800,  label: 'Interrogation de ChatGPT…' },
    { pct: 45,  delay: 1000, label: 'Interrogation de Gemini…' },
    { pct: 70,  delay: 1200, label: 'Interrogation de Perplexity…' },
    { pct: 90,  delay: 800,  label: 'Calcul du score GEO…' },
    { pct: 100, delay: 500,  label: 'Rapport prêt ✓' },
  ],
  seo_article: [
    { pct: 30, delay: 700,  label: 'Analyse sémantique…' },
    { pct: 70, delay: 1500, label: 'Rédaction de l\'article…' },
    { pct: 100, delay: 600, label: 'Article prêt ✓' },
  ],
  bulk_reply: [
    { pct: 50,  delay: 800,  label: 'Analyse des avis…' },
    { pct: 100, delay: 1000, label: 'Réponses générées ✓' },
  ],
};

// ── Public API ────────────────────────────────────────────────────────────────

export function getJobs(): AsyncJob[] {
  return readJobs();
}

export function getJob(id: string): AsyncJob | undefined {
  return readJobs().find(j => j.id === id);
}

/**
 * Enqueue a background job.
 * Returns the job id immediately.
 * Calls onDone(result) when finished.
 * Calls onProgress(pct, label) at each step.
 */
export async function enqueueJob<T>(opts: {
  type: JobType;
  work: () => Promise<T>;
  onDone?: (result: T) => void;
  onProgress?: (pct: number, label: string) => void;
  onError?: (err: string) => void;
}): Promise<string> {
  const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const job: AsyncJob = {
    id,
    type: opts.type,
    label: JOB_LABELS[opts.type],
    status: 'queued',
    progress: 0,
    createdAt: Date.now(),
  };
  upsertJob(job);

  // Run async in background — do NOT await at call site
  (async () => {
    try {
      upsertJob({ ...job, status: 'running', progress: 5 });

      // Simulate progress steps in parallel with real work
      const steps = PROGRESS_STEPS[opts.type];
      let stepIdx = 0;

      const progressLoop = async () => {
        while (stepIdx < steps.length) {
          const step = steps[stepIdx];
          await sleep(step.delay);
          const pct = Math.min(step.pct, 95); // never reach 100 until done
          upsertJob({ ...job, status: 'running', progress: pct });
          opts.onProgress?.(pct, step.label);
          stepIdx++;
        }
      };

      const [result] = await Promise.all([
        opts.work(),
        progressLoop(),
      ]);

      const done: AsyncJob = {
        ...job,
        status: 'done',
        progress: 100,
        completedAt: Date.now(),
        result: result as unknown,
      };
      upsertJob(done);
      opts.onDone?.(result);

      // Dispatch in-app notification event
      window.dispatchEvent(new CustomEvent('kompilot:job:done', {
        detail: { id, type: opts.type, label: JOB_LABELS[opts.type] },
      }));

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      upsertJob({ ...job, status: 'error', error: msg, completedAt: Date.now() });
      opts.onError?.(msg);
    }
  })();

  return id;
}

function sleep(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms));
}
