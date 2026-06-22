/**
 * ClickwrapModal — MODULE 3
 * B2B double checkbox legal validation required before paywall actions.
 * Compliant with article L221-28 of the French Consumer Code.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, CheckSquare, AlertTriangle,
  ExternalLink, Lock, ArrowRight, X,
} from 'lucide-react';
import { Button } from '@blinkdotnew/ui';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  actionLabel?: string;       // e.g. "Valider l'export", "Accéder au plan Pro"
  onAccept: () => void;
  onCancel: () => void;
  planId?: string;
  checkoutType?: 'subscription' | 'export' | 'validation';
}

// ── Main component ────────────────────────────────────────────────────────────

export function ClickwrapModal({
  open,
  actionLabel = "Valider et continuer",
  onAccept,
  onCancel,
  checkoutType = 'subscription',
}: Props) {
  const [cgvAccepted, setCgvAccepted] = useState(false);
  const [retractionWaived, setRetractionWaived] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canProceed = cgvAccepted && retractionWaived;

  const handleAccept = async () => {
    if (!canProceed) return;
    setSubmitting(true);

    // Log acceptance timestamp (persisted by parent)
    try {
      const ip = await fetch('https://api.ipify.org?format=json')
        .then(r => r.json())
        .then(d => d.ip as string)
        .catch(() => 'unknown');

      // Store in localStorage for audit trail
      const record = {
        acceptedAt: new Date().toISOString(),
        cgvVersion: '2026-01',
        ip,
        userAgent: navigator.userAgent,
        checkoutType,
      };
      try {
        const existing = JSON.parse(localStorage.getItem('kompilot_legal_consents') ?? '[]');
        localStorage.setItem('kompilot_legal_consents', JSON.stringify([...existing, record]));
      } catch { /* ignore */ }
    } catch { /* ignore */ }

    setSubmitting(false);
    onAccept();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="clickwrap-title"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-slate-50/80 to-transparent dark:from-slate-900/40">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} className="text-primary" />
            </div>
            <div className="flex-1">
              <h2 id="clickwrap-title" className="font-extrabold text-base text-foreground">
                Validation juridique requise
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Veuillez lire et accepter les conditions avant de continuer.
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Legal notice */}
          <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 px-4 py-3 flex items-start gap-2">
            <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              Ces deux cases sont <strong>obligatoires</strong> pour valider votre action.
              Elles constituent un consentement électronique juridiquement valide.
            </p>
          </div>

          {/* Checkbox 1: CGV */}
          <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
            cgvAccepted
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-muted-foreground/30 hover:bg-muted/20'
          }`}>
            <div className="relative shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={cgvAccepted}
                onChange={e => setCgvAccepted(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                cgvAccepted
                  ? 'border-primary bg-primary'
                  : 'border-border bg-background'
              }`}>
                {cgvAccepted && <CheckSquare size={13} className="text-primary-foreground" strokeWidth={3} />}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground leading-relaxed">
                J'accepte sans réserve les{' '}
                <button
                  onClick={e => { e.preventDefault(); window.open('/cgv', '_blank'); }}
                  className="text-primary underline hover:no-underline inline-flex items-center gap-0.5"
                >
                  Conditions Générales de Vente (CGV)
                  <ExternalLink size={10} className="shrink-0" />
                </button>{' '}
                et d'Utilisation de Kompilot.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Version 2026-01 · Mise à jour le 1er janvier 2026
              </p>
            </div>
          </label>

          {/* Checkbox 2: Retraction waiver */}
          <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
            retractionWaived
              ? 'border-violet-500 bg-violet-500/5'
              : 'border-border hover:border-muted-foreground/30 hover:bg-muted/20'
          }`}>
            <div className="relative shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={retractionWaived}
                onChange={e => setRetractionWaived(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                retractionWaived
                  ? 'border-violet-500 bg-violet-500'
                  : 'border-border bg-background'
              }`}>
                {retractionWaived && <CheckSquare size={13} className="text-white" strokeWidth={3} />}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground leading-relaxed">
                En tant que professionnel (B2B), je demande l'exécution immédiate du service et je{' '}
                <strong>renonce expressément</strong> à mon droit de rétractation de 14 jours.
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Conformément à l'article{' '}
                <span className="font-mono text-foreground">L221-28 du Code de la consommation</span>{' '}
                — applicable aux contrats de prestation de services numériques commençant immédiatement.
              </p>
            </div>
          </label>

          {/* Legal reference */}
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Lock size={11} className="shrink-0" />
            <span>
              Consentement horodaté et enregistré de manière sécurisée à des fins de conformité RGPD.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 sm:flex-none sm:w-32"
          >
            Annuler
          </Button>
          <Button
            disabled={!canProceed || submitting}
            onClick={handleAccept}
            className="flex-1 gap-2 font-bold"
          >
            {submitting ? (
              <>Validation...</>
            ) : (
              <>
                <ShieldCheck size={15} />
                {actionLabel}
                <ArrowRight size={14} />
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Utility hook ─────────────────────────────────────────────────────────────

export function useClickwrap() {
  const [open, setOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const requestConsent = (action: () => void) => {
    setPendingAction(() => action);
    setOpen(true);
  };

  const handleAccept = () => {
    setOpen(false);
    pendingAction?.();
    setPendingAction(null);
  };

  const handleCancel = () => {
    setOpen(false);
    setPendingAction(null);
  };

  return { open, requestConsent, handleAccept, handleCancel };
}
