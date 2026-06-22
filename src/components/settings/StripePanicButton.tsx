/**
 * StripePanicButton — Bouton d'urgence pour annuler manuellement
 * une pénalité Stripe Anti-No-Show pour un client de confiance.
 *
 * S'intègre dans : AntiNoShowShield, MessageDetail, Inbox appointments.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldOff, Check, AlertTriangle, X, Lock } from 'lucide-react';

type PanicState = 'idle' | 'confirm' | 'success';

interface StripePanicButtonProps {
  clientName?: string;
  /** Compact = petite version pour les listes, full = carte complète */
  variant?: 'compact' | 'full';
  onBypass?: (clientName: string) => void;
}

export function StripePanicButton({
  clientName = 'ce client',
  variant = 'full',
  onBypass,
}: StripePanicButtonProps) {
  const [state, setState] = useState<PanicState>('idle');
  const [customName, setCustomName] = useState(clientName);

  const handleBypass = () => {
    setState('success');
    onBypass?.(customName);
    setTimeout(() => setState('idle'), 4000);
  };

  // ── Compact variant (inline in lists/inbox) ──────────────────────────────
  if (variant === 'compact') {
    return (
      <div className="relative">
        <AnimatePresence mode="wait">
          {state === 'idle' && (
            <motion.button
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              type="button"
              onClick={() => setState('confirm')}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg px-2.5 py-1.5 transition-all active:scale-95 min-h-[32px]"
            >
              <ShieldOff size={12} />
              🔓 Annuler pénalité
            </motion.button>
          )}

          {state === 'confirm' && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute bottom-full mb-2 right-0 w-[260px] bg-card border border-amber-200 rounded-xl shadow-xl p-3 z-50 space-y-2.5"
            >
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-foreground font-semibold leading-snug">
                  Annuler la pénalité Stripe pour <span className="text-primary">{customName}</span> ?
                </p>
                <button onClick={() => setState('idle')} className="ml-auto text-muted-foreground hover:text-foreground shrink-0">
                  <X size={13} />
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Cette action bypasse l'algorithme anti-no-show et annule l'empreinte bancaire en attente.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setState('idle')}
                  className="flex-1 text-[11px] font-semibold text-muted-foreground bg-muted hover:bg-muted/80 rounded-lg py-2 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleBypass}
                  className="flex-1 text-[11px] font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg py-2 transition-colors"
                >
                  ✅ Confirmer
                </button>
              </div>
            </motion.div>
          )}

          {state === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5 min-h-[32px]"
            >
              <Check size={12} />
              Pénalité annulée ✅
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── Full variant (card in AntiNoShowShield) ───────────────────────────────
  return (
    <AnimatePresence mode="wait">
      {state === 'idle' && (
        <motion.div
          key="idle"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/40 p-5 space-y-3"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
              <Lock size={16} className="text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-extrabold text-sm text-foreground">🔓 Bouton Panique Stripe</h3>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Bypassez instantanément l'algorithme anti-no-show pour un client de confiance. 
                Annule l'empreinte bancaire sans délai.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              Nom du client (optionnel)
            </label>
            <input
              type="text"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              placeholder="ex. Marie Dupont"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>

          <button
            type="button"
            onClick={() => setState('confirm')}
            className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-amber-300 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 font-bold text-sm py-3 transition-all active:scale-[0.98] min-h-[48px]"
          >
            <ShieldOff size={16} />
            🔓 Annuler la pénalité Stripe manuellement
          </button>
        </motion.div>
      )}

      {state === 'confirm' && (
        <motion.div
          key="confirm"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          className="rounded-2xl border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/30 p-5 space-y-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-200 dark:bg-amber-800/50 flex items-center justify-center shrink-0 animate-pulse">
              <AlertTriangle size={18} className="text-amber-700 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-extrabold text-sm text-foreground">Confirmation requise</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Vous êtes sur le point d'annuler l'empreinte bancaire Stripe pour{' '}
                <strong className="text-foreground">{customName || 'ce client'}</strong>. 
                Cette action est irréversible et sera consignée dans votre historique.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setState('idle')}
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-muted hover:bg-muted/80 text-foreground font-semibold text-sm py-3 transition-all active:scale-[0.98] min-h-[48px]"
            >
              <X size={15} />
              Annuler
            </button>
            <button
              type="button"
              onClick={handleBypass}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm py-3 transition-all active:scale-[0.98] shadow-md min-h-[48px]"
            >
              <Check size={15} />
              Oui, bypasser
            </button>
          </div>
        </motion.div>
      )}

      {state === 'success' && (
        <motion.div
          key="success"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 p-5 flex items-center gap-4"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0"
          >
            <Check size={22} className="text-emerald-600" />
          </motion.div>
          <div className="flex-1">
            <p className="font-extrabold text-sm text-emerald-700 dark:text-emerald-400">
              ✅ Pénalité annulée avec succès !
            </p>
            <p className="text-xs text-emerald-600/80 dark:text-emerald-500 mt-0.5 leading-relaxed">
              L'empreinte bancaire de <strong>{customName || 'ce client'}</strong> a été supprimée. 
              Aucun prélèvement ne sera effectué.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
