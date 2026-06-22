/**
 * ChurnSaverGeoWarning — MODULE 4
 * Step 1 of the Churn Saver tunnel: G.E.O. / AI positioning warning.
 * Displayed BEFORE the exit survey when user clicks "Résilier".
 * Shows the 7-day cliff of AI visibility loss + two retention offers.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Brain, TrendingDown, AlertTriangle,
  Pause, Tag, ArrowRight, X, Shield,
  MessageSquare, Search, Mic,
} from 'lucide-react';
import { Button } from '@blinkdotnew/ui';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  firstName?: string;
  onContinueCancel: () => void;    // → Exit Survey (Step 2)
  onAcceptDiscount: () => void;    // → Accept -50% 3 months
  onAcceptPause: () => void;       // → Free pause option
  onBack: () => void;              // → Close modal, don't cancel
}

// ── AI platforms at risk ──────────────────────────────────────────────────────

const AI_PLATFORMS = [
  {
    name: 'ChatGPT',
    icon: Brain,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    description: 'Recommandations locales GPT-4o',
  },
  {
    name: 'Siri / Apple Maps',
    icon: Mic,
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    description: 'Questions vocales iOS/macOS',
  },
  {
    name: 'Perplexity AI',
    icon: Search,
    color: 'text-violet-600',
    bg: 'bg-violet-50 dark:bg-violet-950/20',
    description: 'Moteur de recherche IA générative',
  },
  {
    name: 'Google AI Overviews',
    icon: MessageSquare,
    color: 'text-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    description: 'Résumés SGE dans les résultats Google',
  },
];

// ── Timeline of decline ───────────────────────────────────────────────────────

const DECLINE_TIMELINE = [
  { day: 'J+7', label: 'Disparition de ChatGPT', severity: 'high' },
  { day: 'J+14', label: 'Score Siri/Apple Maps en chute', severity: 'high' },
  { day: 'J+21', label: 'Perplexity ne vous recommande plus', severity: 'critical' },
  { day: 'J+30', label: 'Perte définitive de position GEO', severity: 'critical' },
];

// ── Main component ────────────────────────────────────────────────────────────

export function ChurnSaverGeoWarning({
  open,
  firstName = 'vous',
  onContinueCancel,
  onAcceptDiscount,
  onAcceptPause,
  onBack,
}: Props) {
  const [activeTab, setActiveTab] = useState<'warning' | 'offers'>('warning');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-red-50/60 to-amber-50/40 dark:from-red-950/15 dark:to-amber-950/10">
          <div className="flex items-start gap-3">
            <motion.div
              animate={{ rotate: [0, -10, 10, -5, 0] }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="w-11 h-11 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0"
            >
              <AlertTriangle size={22} className="text-red-600 dark:text-red-400" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-base text-foreground">
                ⚠️ Attention — Impact immédiat sur votre visibilité IA
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Résilier maintenant entraîne des conséquences durables sur votre présence digitale.
              </p>
            </div>
            <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors p-1 shrink-0">
              <X size={16} />
            </button>
          </div>

          {/* Tab selector */}
          <div className="flex mt-4 gap-1 p-1 rounded-xl bg-white/60 dark:bg-black/20">
            {[
              { id: 'warning' as const, label: '🔴 Impact G.E.O.' },
              { id: 'offers' as const, label: '💚 Alternatives' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-card shadow text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab: GEO Warning */}
        {activeTab === 'warning' && (
          <div className="px-6 py-5 space-y-5">
            {/* Key message */}
            <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 p-4">
              <div className="flex items-start gap-2.5">
                <TrendingDown size={18} className="text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-red-800 dark:text-red-300">
                    Sans Kompilot, votre positionnement G.E.O. s'effondre en 7 jours
                  </p>
                  <p className="text-xs text-red-700/80 dark:text-red-400/80 mt-1 leading-relaxed">
                    Les moteurs d'IA locaux (ChatGPT, Siri, Perplexity) perdront votre fiche de référence
                    et cesseront de vous recommander aux clients qui recherchent votre type de commerce.
                  </p>
                </div>
              </div>
            </div>

            {/* AI platforms grid */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Plateformes affectées
              </p>
              <div className="grid grid-cols-2 gap-2">
                {AI_PLATFORMS.map(platform => {
                  const Icon = platform.icon;
                  return (
                    <div key={platform.name} className={`flex items-center gap-2.5 rounded-xl p-3 ${platform.bg}`}>
                      <Icon size={16} className={platform.color} />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground">{platform.name}</p>
                        <p className="text-[10px] text-muted-foreground">{platform.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Decline timeline */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Chronologie de la perte de visibilité
              </p>
              <div className="relative pl-4">
                <div className="absolute left-1.5 top-2 bottom-2 w-px bg-border" />
                {DECLINE_TIMELINE.map((item, i) => (
                  <div key={i} className="relative flex items-center gap-3 mb-3 last:mb-0">
                    <div className={`absolute -left-1 w-3 h-3 rounded-full border-2 border-card ${
                      item.severity === 'critical' ? 'bg-red-500' : 'bg-amber-500'
                    }`} />
                    <span className={`text-xs font-mono font-bold ml-3 shrink-0 ${
                      item.severity === 'critical' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      {item.day}
                    </span>
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Offers */}
        {activeTab === 'offers' && (
          <div className="px-6 py-5 space-y-4">
            <p className="text-sm font-semibold text-foreground">
              Voici deux alternatives à la résiliation, {firstName} :
            </p>

            {/* Offer 1: -50% discount */}
            <motion.button
              whileTap={{ scale: 0.99 }}
              onClick={onAcceptDiscount}
              className="w-full rounded-2xl border-2 border-emerald-400 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 p-4 text-left hover:border-emerald-500 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                  <Tag size={18} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-extrabold text-sm text-foreground">-50% pendant 3 mois</p>
                    <span className="text-[10px] font-bold bg-emerald-500 text-white rounded-full px-2 py-0.5">
                      OFFRE SPÉCIALE
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Continuez à protéger votre visibilité G.E.O. à moitié prix.
                    Engagement non reconduit automatiquement.
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    Accepter cette offre <ArrowRight size={13} />
                  </div>
                </div>
              </div>
            </motion.button>

            {/* Offer 2: Free pause */}
            <motion.button
              whileTap={{ scale: 0.99 }}
              onClick={onAcceptPause}
              className="w-full rounded-2xl border-2 border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/20 p-4 text-left hover:border-blue-400 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                  <Pause size={18} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-extrabold text-sm text-foreground">Mettre en pause gratuitement</p>
                    <span className="text-[10px] font-bold bg-blue-400 text-white rounded-full px-2 py-0.5">
                      3 MOIS OFFERTS
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Votre score G.E.O. est préservé, votre abonnement gelé à 0€.
                    Reprise automatique dans 3 mois si vous le souhaitez.
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-blue-700 dark:text-blue-400">
                    Mettre en pause <ArrowRight size={13} />
                  </div>
                </div>
              </div>
            </motion.button>

            {/* Benefit reminder */}
            <div className="rounded-xl bg-muted/40 border border-border px-4 py-3">
              <div className="flex items-start gap-2">
                <Shield size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Votre score G.E.O. actuel, vos posts planifiés et vos données clients restent
                  intégralement conservés pendant la pause.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Retour au tableau de bord
          </button>
          <button
            onClick={onContinueCancel}
            className="text-xs text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors underline"
          >
            Je veux quand même résilier
          </button>
        </div>
      </motion.div>
    </div>
  );
}
