import { useState, useEffect, useCallback } from 'react';
import { Check, X, ArrowRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useEstablishment } from '../../context/EstablishmentContext';
import { TermTooltip } from '../shared/TermTooltip';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Step {
  emoji: string;
  label: string;
  description: string;
  done: boolean;
  href?: string;
  /** Clé glossaire pour afficher un badge tooltip (ex: 'AIO', 'GEO') */
  term?: string;
}

interface StartupChecklistProps {
  userId: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDismissedKey(userId: string) {
  return `kompilot_checklist_dismissed_${userId}`;
}

function getStateKey(userId: string) {
  return `kompilot_checklist_${userId}`;
}

function readBool(key: string): boolean {
  try { return !!localStorage.getItem(key); } catch { return false; }
}

function writeBool(key: string) {
  try { localStorage.setItem(key, '1'); } catch { /* noop */ }
}

// ── Step item ─────────────────────────────────────────────────────────────────

interface StepItemProps {
  step: Step;
  index: number;
  onMark?: () => void;
}

function StepItem({ step, index }: StepItemProps) {
  return (
    <div
      className="flex items-center gap-3 py-2.5 px-1 group"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Check icon */}
      <div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-500 ${
          step.done
            ? 'bg-emerald-500 border-emerald-500 scale-110'
            : 'border-muted-foreground/30 bg-background'
        }`}
      >
        {step.done && (
          <Check size={10} className="text-white" strokeWidth={3.5} />
        )}
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p
            className={`text-[13px] font-semibold leading-tight transition-colors ${
              step.done
                ? 'line-through text-muted-foreground'
                : 'text-foreground'
            }`}
          >
            <span className="mr-1.5">{step.emoji}</span>
            {step.label}
          </p>
          {step.term && !step.done && <TermTooltip term={step.term} size="sm" />}
        </div>
        {!step.done && step.description && (
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
            {step.description}
          </p>
        )}
      </div>

      {/* CTA */}
      {!step.done && step.href && (
        <Link
          to={step.href as any}
          className="shrink-0 flex items-center gap-0.5 text-[11px] font-bold text-primary hover:text-primary/70 transition-colors whitespace-nowrap"
        >
          Faire <ArrowRight size={9} className="mt-px" />
        </Link>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function StartupChecklist({ userId }: StartupChecklistProps) {
  const { activeEstablishment } = useEstablishment();

  // Derive step completion states
  const [socialConnected, setSocialConnected] = useState(() =>
    readBool(`social_connected_${userId}`)
  );
  const [firstPostCreated, setFirstPostCreated] = useState(() =>
    readBool(`first_post_created_${userId}`)
  );
  const [firstReview, setFirstReview] = useState(() => {
    try {
      const saved = localStorage.getItem(getStateKey(userId));
      if (saved) {
        const parsed = JSON.parse(saved);
        return !!parsed.firstReview;
      }
    } catch { /* noop */ }
    return false;
  });
  const [noshowActivated, setNoshowActivated] = useState(() =>
    readBool(`noshow_activated_${userId}`)
  );
  const [geoScanDone, setGeoScanDone] = useState(() =>
    readBool(`geo_scan_done_${userId}`)
  );
  const [smsCampaignSent, setSmsCampaignSent] = useState(() =>
    readBool(`sms_campaign_sent_${userId}`)
  );

  // Sync from localStorage on mount + listen for cross-tab changes
  const resync = useCallback(() => {
    setSocialConnected(readBool(`social_connected_${userId}`));
    setFirstPostCreated(readBool(`first_post_created_${userId}`));
    setNoshowActivated(readBool(`noshow_activated_${userId}`));
    setGeoScanDone(readBool(`geo_scan_done_${userId}`));
    setSmsCampaignSent(readBool(`sms_campaign_sent_${userId}`));
  }, [userId]);

  useEffect(() => {
    resync();
    window.addEventListener('storage', resync);
    return () => window.removeEventListener('storage', resync);
  }, [resync]);

  // Persist firstReview state
  useEffect(() => {
    try {
      const saved = localStorage.getItem(getStateKey(userId));
      const parsed = saved ? JSON.parse(saved) : {};
      localStorage.setItem(getStateKey(userId), JSON.stringify({ ...parsed, firstReview }));
    } catch { /* noop */ }
  }, [firstReview, userId]);

  // Dismissed flag
  const [dismissed, setDismissed] = useState(() =>
    readBool(getDismissedKey(userId))
  );

  const handleDismiss = () => {
    writeBool(getDismissedKey(userId));
    setDismissed(true);
  };

  // Build steps
  const steps: Step[] = [
    {
      emoji: '✅',
      label: 'Créer votre compte',
      description: 'Bienvenue sur Kompilot !',
      done: true,
    },
    {
      emoji: '🏪',
      label: 'Configurer votre établissement',
      description: 'Renseignez votre établissement pour personnaliser votre expérience.',
      done: !!activeEstablishment,
      href: '/settings',
    },
    {
      emoji: '📅',
      label: 'Planifier votre premier post',
      description: "Créez et planifiez votre premier contenu avec l'IA.",
      done: firstPostCreated,
      href: '/cockpit',
    },
    {
      emoji: '🔗',
      label: 'Connecter un réseau social',
      description: 'Synchronisez Instagram, Facebook ou Google pour publier directement.',
      done: socialConnected,
      href: '/settings',
    },
    {
      emoji: '⭐',
      label: 'Recevoir votre premier avis',
      description: "Partagez votre lien d'avis Google à vos premiers clients.",
      done: firstReview,
      href: '/reviews',
    },
    {
      emoji: '🛡️',
      label: 'Activer le Bouclier Anti-No-Show',
      description: 'Configurez Stripe Connect pour bloquer les no-shows et sécuriser vos revenus.',
      done: noshowActivated,
      href: '/settings',
    },
    {
      emoji: '🗺️',
      label: 'Scanner votre visibilité G.E.O.',
      description: "Lancez votre premier scan IA pour voir où vous apparaissez sur ChatGPT et Google.",
      done: geoScanDone,
      href: '/geo-authority',
      term: 'GEO',
    },
    {
      emoji: '🖼️',
      label: 'Générer un visuel avec Creative Factory IA',
      description: "Créez un visuel de marque Imagen 4.0 et planifiez-le sur Maps, Instagram ou en Story.",
      done: readBool(`creative_factory_used_${userId}`),
      href: '/creative-factory',
    },
    {
      emoji: '🎬',
      label: 'Publier votre première Story Instagram ou Facebook',
      description: "Basculez en format Story 9:16 dans Creative Factory et diffusez sur Instagram & Facebook.",
      done: readBool(`story_published_${userId}`),
      href: '/creative-factory',
    },
    {
      emoji: '🌐',
      label: 'Activer l\'AIO Sync (ChatGPT, Perplexity, Gemini)',
      description: "Configurez vos 12 mots-clés locaux pour apparaître dans les réponses des moteurs IA.",
      done: readBool(`aio_sync_activated_${userId}`),
      href: '/aio',
      term: 'AIO',
    },
    {
      emoji: '💬',
      label: 'Envoyer votre première campagne SMS',
      description: 'Activez vos leads SMS pour relancer vos clients inactifs automatiquement.',
      done: smsCampaignSent,
      href: '/lead-gen',
    },
    {
      emoji: '👥',
      label: 'Inviter votre équipe',
      description: 'Ajoutez un collaborateur (éditeur, admin) dans l\'espace Équipe pour travailler ensemble.',
      done: readBool(`team_member_invited_${userId}`),
      href: '/team',
    },
    {
      emoji: '🤖',
      label: 'Découvrir les Agents IA autonomes',
      description: 'Lancez votre premier sprint avec Content Factory, Ad Spy ou l\'Auto-Reporter dans Claude Cowork.',
      done: readBool(`agent_sprint_launched_${userId}`),
      href: '/agence/cowork',
    },
  ];

  const completedCount = steps.filter(s => s.done).length;
  const total = steps.length;
  const allDone = completedCount === total;
  const percent = Math.round((completedCount / total) * 100);

  // Hide if dismissed or fully completed
  if (dismissed || allDone) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-base shrink-0">🚀</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground leading-tight">
            Démarrage rapide
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Complétez ces étapes pour tirer le meilleur de Kompilot.
          </p>
        </div>

        {/* Badge X/5 */}
        <span
          className={`shrink-0 text-[11px] font-bold rounded-full px-2.5 py-0.5 border transition-colors ${
            completedCount === 0
              ? 'bg-muted text-muted-foreground border-border'
              : 'bg-primary/10 text-primary border-primary/20'
          }`}
        >
          {completedCount}/{total}
        </span>

        {/* Dismiss */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Masquer définitivement"
          className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/60 transition-colors ml-0.5"
        >
          <X size={13} />
        </button>
      </div>

      {/* ── Progress bar ── */}
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mb-4">
        <div
          className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* ── Steps list ── */}
      <div className="divide-y divide-border/40">
        {steps.map((step, i) => (
          <StepItem key={step.label} step={step} index={i} />
        ))}
      </div>

      {/* ── Footer link ── */}
      <div className="mt-3 pt-2.5 border-t border-border/40">
        <button
          onClick={handleDismiss}
          className="text-[11px] text-muted-foreground/50 hover:text-muted-foreground underline transition-colors"
        >
          Masquer cette checklist
        </button>
      </div>
    </div>
  );
}
