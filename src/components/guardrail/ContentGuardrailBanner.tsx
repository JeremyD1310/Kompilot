/**
 * ContentGuardrailBanner — MODULE 6
 * Orange warning banner shown when suspicious/injection content is detected.
 * Blocks publication and requires manual validation.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, ShieldAlert, Eye, CheckCircle2,
  RefreshCw, ChevronDown, ChevronUp, X,
} from 'lucide-react';
import { Button } from '@blinkdotnew/ui';
import {
  analyzeContent,
  getCategoryLabel,
  type GuardrailResult,
  type ViolationCategory,
} from '../../lib/guardrails/contentGuardrail';

// ── Category color mapping ────────────────────────────────────────────────────

const CATEGORY_STYLE: Record<ViolationCategory, { color: string; badge: string }> = {
  prompt_injection: {
    color: 'text-red-700 dark:text-red-400',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  harmful: {
    color: 'text-orange-700 dark:text-orange-400',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  },
  spam: {
    color: 'text-amber-700 dark:text-amber-400',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  false_claims: {
    color: 'text-violet-700 dark:text-violet-400',
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  },
};

// ── Inline banner (shows above editor) ───────────────────────────────────────

interface BannerProps {
  result: GuardrailResult;
  onDismiss?: () => void;
  onRequestValidation?: () => void;
  onModify?: () => void;
}

export function ContentGuardrailBanner({
  result,
  onDismiss,
  onRequestValidation,
  onModify,
}: BannerProps) {
  const [expanded, setExpanded] = useState(false);

  if (result.safe) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="rounded-xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 overflow-hidden"
      role="alert"
    >
      {/* Main alert row */}
      <div className="flex items-start gap-3 px-4 py-3.5">
        <motion.div
          animate={{ rotate: [0, -8, 8, -4, 0] }}
          transition={{ duration: 0.5, repeat: 2, delay: 0.1 }}
          className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0 mt-0.5"
        >
          <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400" />
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
              ⚠️ Contenu suspect détecté. Validation manuelle requise avant envoi.
            </p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              result.riskScore >= 80
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            }`}>
              Risque : {result.riskScore >= 80 ? 'Élevé' : result.riskScore >= 50 ? 'Moyen' : 'Faible'}
            </span>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
            {result.violations.length} problème{result.violations.length > 1 ? 's' : ''} identifié{result.violations.length > 1 ? 's' : ''}.
            {' '}La publication est temporairement bloquée pour votre protection.
          </p>

          {/* Violation badges */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {[...new Set(result.violations.map(v => v.category))].map(cat => (
              <span key={cat} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                CATEGORY_STYLE[cat]?.badge ?? 'bg-muted text-muted-foreground'
              }`}>
                {getCategoryLabel(cat)}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-amber-600 dark:text-amber-400 hover:text-amber-800 transition-colors p-1"
            title="Voir les détails"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-amber-600 dark:text-amber-400 hover:text-amber-800 transition-colors p-1"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Expanded violation details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-amber-200 dark:border-amber-800/50 pt-3 space-y-2">
              <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                Détails des violations détectées
              </p>
              {result.violations.slice(0, 5).map((v, i) => (
                <div key={i} className="flex items-start gap-2.5 rounded-lg bg-white/60 dark:bg-black/20 px-3 py-2">
                  <ShieldAlert size={13} className={CATEGORY_STYLE[v.category]?.color ?? 'text-muted-foreground'} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">
                      {getCategoryLabel(v.category)}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Terme détecté :{' '}
                      <code className="font-mono bg-muted px-1 rounded text-foreground">
                        "{v.matchedText}"
                      </code>
                    </p>
                  </div>
                </div>
              ))}
              {result.violations.length > 5 && (
                <p className="text-[11px] text-muted-foreground">
                  + {result.violations.length - 5} autre{result.violations.length - 5 > 1 ? 's' : ''} violation{result.violations.length - 5 > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-amber-200 dark:border-amber-800/50 bg-amber-50/60 dark:bg-amber-950/10">
        {onModify && (
          <Button
            size="sm"
            variant="outline"
            onClick={onModify}
            className="h-7 text-xs gap-1.5 border-amber-300 dark:border-amber-700 hover:bg-amber-100"
          >
            <RefreshCw size={11} /> Modifier le texte
          </Button>
        )}
        {onRequestValidation && (
          <Button
            size="sm"
            onClick={onRequestValidation}
            className="h-7 text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Eye size={11} /> Demander validation manuelle
          </Button>
        )}
        <p className="ml-auto text-[10px] text-amber-600 dark:text-amber-500">
          🔒 GuardrailAI v1.0
        </p>
      </div>
    </motion.div>
  );
}

// ── Approved banner (after manual validation) ─────────────────────────────────

export function ContentApprovedBanner({ onPublish }: { onPublish: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-950/20 px-4 py-3 flex items-center justify-between gap-3"
    >
      <div className="flex items-center gap-2.5">
        <CheckCircle2 size={16} className="text-green-600 dark:text-green-400 shrink-0" />
        <p className="text-sm font-semibold text-green-800 dark:text-green-300">
          ✅ Contenu approuvé manuellement — Publication autorisée
        </p>
      </div>
      <Button size="sm" onClick={onPublish} className="h-7 text-xs">
        Publier maintenant
      </Button>
    </motion.div>
  );
}

// ── Hook: guardrail with state ────────────────────────────────────────────────

export function useContentGuardrail() {
  const [result, setResult] = useState<GuardrailResult | null>(null);
  const [manuallyApproved, setManuallyApproved] = useState(false);

  const check = (text: string): boolean => {
    const r = analyzeContent(text);
    setResult(r);
    setManuallyApproved(false);
    return r.safe;
  };

  const approve = () => setManuallyApproved(true);
  const reset = () => { setResult(null); setManuallyApproved(false); };

  const isBlocked = result !== null && !result.safe && !manuallyApproved;
  const canPublish = result === null || result.safe || manuallyApproved;

  return { result, check, approve, reset, isBlocked, canPublish, manuallyApproved };
}
