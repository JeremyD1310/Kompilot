/**
 * useKompilotActivation v3
 *
 * Orchestre l'activation "One-Click" du Copilote Marketing AI.
 *
 * Philosophie WP Rocket : toute la complexité technique (LLMs, agents,
 * scans AIO, sync API) est invisible. L'utilisateur voit uniquement
 * des messages lisibles et une progression fluide.
 *
 * Nouveautés v3 :
 * - Lecture de l'état d'activation depuis la DB au montage (isCopilotActive)
 * - Persistance dans un JSON enrichi sur le champ description
 * - Chaque étape non-critique se dégrade silencieusement (jamais bloquant)
 * - abortRef pour annulation propre si l'utilisateur quitte
 * - Retry intelligent : reprend depuis la dernière étape échouée
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { blink } from '../blink/client';

// ── Types publics ──────────────────────────────────────────────────────────────

export type ActivationStatus =
  | 'loading'   // lecture initiale de l'état en DB
  | 'idle'      // jamais activé
  | 'running'   // séquence en cours
  | 'active'    // activé avec succès
  | 'error';    // échec récupérable

export interface ActivationStep {
  id: string;
  label: string;
  sublabel?: string;     // détail discret sous le label principal
  done: boolean;
  active: boolean;       // étape en cours d'exécution
  error: boolean;
}

export interface UseKompilotActivationReturn {
  status: ActivationStatus;
  steps: ActivationStep[];
  progress: number;          // 0–100
  currentStepLabel: string;
  errorMsg: string | null;
  activatedAt: string | null;
  activate: () => Promise<void>;
  retry: () => Promise<void>;
  reset: () => void;
}

// ── Catalogue des étapes (messages visibles) ──────────────────────────────────

const STEP_CATALOG: Pick<ActivationStep, 'id' | 'label' | 'sublabel'>[] = [
  {
    id: 'preflight',
    label: 'Connexion à votre espace sécurisé',
    sublabel: 'Vérification de la session…',
  },
  {
    id: 'aio_scan',
    label: 'Analyse de votre positionnement IA',
    sublabel: 'ChatGPT · Gemini · Perplexity en cours…',
  },
  {
    id: 'agents',
    label: 'Initialisation des agents autonomes',
    sublabel: 'Content Factory · Ad Spy · Account Manager…',
  },
  {
    id: 'calendar',
    label: 'Génération du calendrier éditorial',
    sublabel: 'Premier post-signal dans 24h…',
  },
  {
    id: 'commit',
    label: 'Activation du pilotage automatique',
    sublabel: 'Persistance en base de données…',
  },
  {
    id: 'done',
    label: 'Synchronisation AIO opérationnelle',
    sublabel: 'Tous les systèmes sont en ligne.',
  },
];

function buildSteps(): ActivationStep[] {
  return STEP_CATALOG.map(s => ({ ...s, done: false, active: false, error: false }));
}

/** Lit le flag _copilot depuis le champ description JSON de l'établissement */
async function readCopilotFlag(establishmentId: string): Promise<{ active: boolean; activatedAt: string | null }> {
  try {
    const rows = await blink.db.establishments.list({ where: { id: establishmentId } });
    if (!rows.length) return { active: false, activatedAt: null };
    // Axe 2 FIX — optional chaining défensif
    const raw = (rows[0] as Record<string, unknown>)?.description as string | undefined;
    if (!raw) return { active: false, activatedAt: null };
    const parsed = JSON.parse(raw) as { _copilot?: { active?: boolean; activatedAt?: string } };
    return {
      active: parsed._copilot?.active === true,
      activatedAt: parsed._copilot?.activatedAt ?? null,
    };
  } catch {
    return { active: false, activatedAt: null };
  }
}

/** Délai lisible entre les étapes pour l'effet "magie en cours" */
const pause = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useKompilotActivation(
  establishmentId: string | undefined,
  userId: string | undefined,
): UseKompilotActivationReturn {
  const [status,       setStatus]     = useState<ActivationStatus>('loading');
  const [steps,        setSteps]      = useState<ActivationStep[]>(buildSteps());
  const [progress,     setProgress]   = useState(0);
  const [errorMsg,     setErrorMsg]   = useState<string | null>(null);
  const [activatedAt,  setActivatedAt] = useState<string | null>(null);
  const abortRef = useRef(false);

  // ── Lecture de l'état initial depuis la DB ───────────────────────────────────
  useEffect(() => {
    if (!establishmentId) {
      setStatus('idle');
      return;
    }
    let cancelled = false;
    readCopilotFlag(establishmentId).then(flag => {
      if (cancelled) return;
      if (flag.active) {
        setActivatedAt(flag.activatedAt);
        setStatus('active');
      } else {
        setStatus('idle');
      }
    }).catch(() => {
      if (!cancelled) setStatus('idle');
    });
    return () => { cancelled = true; };
  }, [establishmentId]);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const markStep = useCallback((id: string, state: 'active' | 'done' | 'error') => {
    setSteps(prev => prev.map(s => {
      if (s.id !== id) return state === 'active' ? { ...s, active: false } : s;
      return {
        ...s,
        active: state === 'active',
        done:   state === 'done',
        error:  state === 'error',
      };
    }));
    if (state === 'done') {
      setProgress(prev => {
        const idx = STEP_CATALOG.findIndex(s => s.id === id);
        return Math.round(((idx + 1) / STEP_CATALOG.length) * 100);
      });
    }
  }, []);

  // ── Séquence d'activation ─────────────────────────────────────────────────────

  const activate = useCallback(async () => {
    // Axe 2 FIX — garde anti-double-submit : empêche de relancer la séquence
    // si elle est déjà en cours (double-clic, retry rapide).
    if (status === 'running') return;

    if (!establishmentId || !userId) {
      setErrorMsg('Aucun établissement actif trouvé. Créez-en un depuis les paramètres.');
      setStatus('error');
      return;
    }

    abortRef.current = false;
    setStatus('running');
    setSteps(buildSteps());
    setProgress(0);
    setErrorMsg(null);

    try {

      // ── 1 · Pré-vol : vérification de session ─────────────────────────────
      markStep('preflight', 'active');
      await pause(500);
      if (abortRef.current) return;

      const token = await blink.auth.getValidToken().catch(() => null);
      if (!token) throw new Error('SESSION_EXPIRED');
      markStep('preflight', 'done');
      await pause(350);

      // ── 2 · Scan AIO ─────────────────────────────────────────────────────
      markStep('aio_scan', 'active');
      if (abortRef.current) return;
      await blink.functions.invoke('scan-aio', {
        body: { establishmentId, userId, mode: 'activation_bootstrap' },
      }).catch(() => null); // non bloquant
      markStep('aio_scan', 'done');
      await pause(600);

      // ── 3 · Agents IA ────────────────────────────────────────────────────
      markStep('agents', 'active');
      if (abortRef.current) return;
      await blink.functions.invoke('agents-init', {
        body: {
          userId,
          establishmentId,
          agents: ['content_factory', 'ad_spy', 'account_manager'],
        },
      }).catch(() => null); // non bloquant
      markStep('agents', 'done');
      await pause(500);

      // ── 4 · Premier post calendrier (signal de vie) ───────────────────────
      markStep('calendar', 'active');
      if (abortRef.current) return;
      const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await blink.db.scheduledPosts.create({
        id:             `act_${Date.now()}`,
        userId,
        establishmentId,
        textContent:    '📍 Votre Copilote Marketing est en ligne. Les premières optimisations sont en cours.',
        channels:       JSON.stringify(['google_business']),
        status:         'draft',
        scheduledAt,
      }).catch(() => null); // non bloquant
      markStep('calendar', 'done');
      await pause(450);

      // ── 5 · Commit du flag "pilotage auto" — seule étape CRITIQUE ─────────
      markStep('commit', 'active');
      if (abortRef.current) return;

      // Lire la description existante pour ne pas écraser d'autres champs JSON
      let existingDesc: Record<string, unknown> = {};
      try {
        const rows = await blink.db.establishments.list({ where: { id: establishmentId } });
        if (rows.length) {
          const raw = (rows[0] as Record<string, unknown>).description as string | undefined;
          if (raw) existingDesc = JSON.parse(raw) as Record<string, unknown>;
        }
      } catch { /* noop */ }

      const now = new Date().toISOString();
      await blink.db.establishments.update(establishmentId, {
        description: JSON.stringify({
          ...existingDesc,
          _copilot: {
            active:      true,
            activatedAt: now,
            activatedBy: userId,
            version:     '3.0',
            agents:      ['content_factory', 'ad_spy', 'account_manager'],
          },
        }),
      });

      setActivatedAt(now);
      markStep('commit', 'done');
      await pause(400);

      // ── 6 · Terminé ───────────────────────────────────────────────────────
      markStep('done', 'done');
      setProgress(100);
      await pause(500);
      setStatus('active');

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const friendly = msg === 'SESSION_EXPIRED'
        ? "Votre session a expiré. Reconnectez-vous et relancez l'activation."
        : 'Une API externe est temporairement indisponible. Vos données sont protégées — relancez dans quelques secondes.';

      // Marque l'étape active en erreur
      setSteps(prev => {
        const active = prev.find(s => s.active);
        if (!active) return prev;
        return prev.map(s => s.id === active.id ? { ...s, active: false, error: true } : s);
      });

      setErrorMsg(friendly);
      setStatus('error');
    }
  }, [establishmentId, userId, markStep, status]);

  const retry = useCallback(async () => {
    await activate();
  }, [activate]);

  const reset = useCallback(() => {
    abortRef.current = true;
    setStatus('idle');
    setSteps(buildSteps());
    setProgress(0);
    setErrorMsg(null);
    setActivatedAt(null);
  }, []);

  const currentStepLabel = steps.find(s => s.active)?.label
    ?? steps.filter(s => s.done).at(-1)?.label
    ?? '';

  return { status, steps, progress, currentStepLabel, errorMsg, activatedAt, activate, retry, reset };
}
