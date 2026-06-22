/**
 * CancellationRetentionModal — Friction de rétention avant résiliation.
 *
 * Intercepte le clic "Résilier" et propose :
 * 1. Pause 30 jours (0€, données conservées)
 * 2. Downgrade plan inférieur
 * 3. Parler au support
 *
 * Seulement si l'utilisateur clique 2x "Résilier quand même" le portail
 * Stripe s'ouvre réellement.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PauseCircle, ArrowDownCircle, MessageCircle, ChevronRight, AlertTriangle } from 'lucide-react';
import { Button, Badge } from '@blinkdotnew/ui';

interface Props {
  open:         boolean;
  onClose:      () => void;
  onConfirmCancel: () => void;  // déclenche vraiment le portail Stripe
  planName?:    string;
  mrr?:         number;         // montant mensuel en €
}

const RETENTION_OPTIONS = [
  {
    id: 'pause',
    icon: PauseCircle,
    color: 'text-teal-500',
    bgColor: 'bg-teal-50 dark:bg-teal-900/20',
    borderColor: 'border-teal-200 dark:border-teal-800/40',
    label: 'Mettre en pause 30 jours',
    sublabel: '0€ prélevé — votre historique et vos données sont conservés',
    badge: 'Recommandé',
    badgeClass: 'bg-teal-100 text-teal-700 border-teal-200',
  },
  {
    id: 'downgrade',
    icon: ArrowDownCircle,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800/40',
    label: 'Passer au plan Découverte',
    sublabel: 'Gardez les fonctions essentielles gratuitement, sans engagement',
    badge: null,
    badgeClass: '',
  },
  {
    id: 'support',
    icon: MessageCircle,
    color: 'text-violet-500',
    bgColor: 'bg-violet-50 dark:bg-violet-900/20',
    borderColor: 'border-violet-200 dark:border-violet-800/40',
    label: 'Parler à un conseiller',
    sublabel: 'Trouvons ensemble une solution adaptée à votre situation',
    badge: null,
    badgeClass: '',
  },
];

export function CancellationRetentionModal({ open, onClose, onConfirmCancel, planName, mrr }: Props) {
  const [confirmStep, setConfirmStep] = useState(false);
  const [selected,    setSelected]    = useState<string | null>(null);

  const handleOption = (id: string) => {
    setSelected(id);
    if (id === 'support') {
      const chatBtn = document.querySelector<HTMLElement>('[data-chat-open]');
      chatBtn?.click();
      onClose();
    }
    // For pause/downgrade: show confirmation UI (would call billing API in production)
    onClose();
  };

  const reset = () => { setConfirmStep(false); setSelected(null); };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[900]"
            onClick={() => { reset(); onClose(); }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            className="fixed inset-0 z-[910] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">

              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    <h2 className="text-sm font-black text-slate-900 dark:text-white">
                      Avant de partir…
                    </h2>
                  </div>
                  {mrr && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Résiliation de {planName ?? 'votre abonnement'} ({mrr}€/mois)
                    </p>
                  )}
                </div>
                <button onClick={() => { reset(); onClose(); }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {!confirmStep ? (
                <div className="p-5 space-y-3">
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Voici ce que vous perdez en partant : votre historique de posts, vos avis collectés, votre score GEO et vos données CRM.
                    <strong className="text-slate-900 dark:text-white"> Nous avons 3 alternatives.</strong>
                  </p>

                  {RETENTION_OPTIONS.map(opt => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleOption(opt.id)}
                        className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all hover:scale-[1.01] ${opt.bgColor} ${opt.borderColor}`}
                      >
                        <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${opt.color}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">{opt.label}</span>
                            {opt.badge && (
                              <Badge className={`text-[10px] border ${opt.badgeClass}`}>{opt.badge}</Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{opt.sublabel}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setConfirmStep(true)}
                    className="w-full text-center text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors py-2 underline underline-offset-2"
                  >
                    Résilier quand même
                  </button>
                </div>
              ) : (
                <div className="p-5 space-y-4">
                  <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 p-4">
                    <p className="text-sm font-bold text-red-700 dark:text-red-400 mb-1">Confirmation de résiliation</p>
                    <p className="text-xs text-red-600 dark:text-red-500 leading-relaxed">
                      Votre abonnement sera actif jusqu'à la fin de la période en cours.
                      Après cette date, vos données seront conservées 90 jours puis supprimées définitivement.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={onConfirmCancel}
                      variant="destructive"
                      size="sm"
                      className="flex-1 h-10 text-xs font-bold"
                    >
                      Confirmer la résiliation
                    </Button>
                    <Button
                      onClick={() => setConfirmStep(false)}
                      variant="outline"
                      size="sm"
                      className="flex-1 h-10 text-xs"
                    >
                      Retour
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
