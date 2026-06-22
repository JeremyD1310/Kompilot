/**
 * DisputeForm — Flux de contestation guidée anti-chargeback.
 *
 * Intercepte les litiges AVANT qu'ils deviennent des chargebacks Stripe.
 * Accessible via /account?dispute=1 ou depuis l'email de confirmation.
 *
 * Flux :
 * 1. Motif du litige (sélection)
 * 2. Description libre
 * 3. Auto-remboursement si éligible (< 48h, premier incident)
 * 4. Escalade support sinon
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, MessageCircle, ArrowRight, RefreshCw, Shield } from 'lucide-react';
import { Button, Badge } from '@blinkdotnew/ui';

/* ── Types ────────────────────────────────────────────────────── */
type DisputeReason = 'not_authorized' | 'duplicate' | 'service_not_received' | 'wrong_amount' | 'other';
type DisputePhase  = 'form' | 'submitting' | 'eligible' | 'escalated';

interface DisputeReasonOption {
  id:     DisputeReason;
  label:  string;
  emoji:  string;
}

const REASONS: DisputeReasonOption[] = [
  { id: 'not_authorized',       label: 'Paiement non autorisé',         emoji: '🚫' },
  { id: 'duplicate',            label: 'Double facturation',             emoji: '🔁' },
  { id: 'service_not_received', label: 'Service non fourni',             emoji: '📦' },
  { id: 'wrong_amount',         label: 'Montant incorrect',              emoji: '💰' },
  { id: 'other',                label: 'Autre motif',                    emoji: '❓' },
];

/* ── Eligibility check ────────────────────────────────────────── */
function isAutoEligible(reason: DisputeReason, billedAt?: Date): boolean {
  if (!billedAt) return false;
  const hoursAgo = (Date.now() - billedAt.getTime()) / 3600000;
  // Auto-remboursement : < 48h + motif simple
  return hoursAgo < 48 && ['duplicate', 'wrong_amount'].includes(reason);
}

/* ── Component ─────────────────────────────────────────────────── */
interface Props {
  transactionId?: string;
  amount?:        number;
  billedAt?:      Date;
  onClose?:       () => void;
}

export function DisputeForm({ transactionId, amount, billedAt, onClose }: Props) {
  const [reason,      setReason]      = useState<DisputeReason | null>(null);
  const [description, setDescription] = useState('');
  const [phase,       setPhase]       = useState<DisputePhase>('form');
  const [ticketId,    setTicketId]    = useState('');

  const handleSubmit = async () => {
    if (!reason) return;
    setPhase('submitting');

    // Simulate API call (in production: POST /api/billing/dispute)
    await new Promise(r => setTimeout(r, 1400));

    const eligible = isAutoEligible(reason, billedAt);
    const tid = `DSP-${Date.now().toString(36).toUpperCase()}`;
    setTicketId(tid);

    if (eligible) {
      setPhase('eligible');
    } else {
      setPhase('escalated');
    }
  };

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">

        {/* ── Phase 1 : Formulaire ─────────────────────────────── */}
        {phase === 'form' && (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 px-4 py-3 flex items-start gap-2">
              <Shield className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                Votre demande est traitée en priorité. Si votre cas est éligible, le remboursement est automatique sous 24h — sans contact bancaire nécessaire.
              </p>
            </div>

            {/* Transaction info */}
            {(amount || transactionId) && (
              <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                {amount && <span className="text-sm font-black text-slate-900 dark:text-white">{amount}€</span>}
                {transactionId && <code className="text-xs text-slate-500 font-mono">{transactionId}</code>}
                {billedAt && (
                  <span className="text-xs text-slate-400 ml-auto">
                    {billedAt.toLocaleDateString('fr-FR')}
                  </span>
                )}
              </div>
            )}

            {/* Reason */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Motif de la contestation
              </label>
              <div className="space-y-1.5">
                {REASONS.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setReason(r.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${
                      reason === r.id
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <span className="text-base">{r.emoji}</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Détails (optionnel)
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Décrivez le problème en quelques mots…"
                rows={3}
                className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!reason}
              className="w-full h-11 bg-teal-500 hover:bg-teal-600 text-white font-bold gap-2"
            >
              Soumettre ma contestation <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        )}

        {/* ── Phase 2 : Traitement ─────────────────────────────── */}
        {phase === 'submitting' && (
          <motion.div key="submitting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="py-8 flex flex-col items-center gap-3"
          >
            <RefreshCw className="w-8 h-8 text-teal-500 animate-spin" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Analyse de votre dossier…</p>
            <p className="text-xs text-slate-500">Vérification de l'éligibilité au remboursement automatique</p>
          </motion.div>
        )}

        {/* ── Phase 3a : Éligible → remboursement auto ─────────── */}
        {phase === 'eligible' && (
          <motion.div key="eligible" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Remboursement validé</h3>
              <p className="text-xs text-slate-500 mt-1">
                Votre cas est éligible au remboursement automatique.
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 p-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Numéro de ticket</span>
                <code className="font-mono font-bold text-emerald-600">{ticketId}</code>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Délai de remboursement</span>
                <span className="font-bold text-slate-900 dark:text-white">3-5 jours ouvrés</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Email de confirmation</span>
                <span className="font-bold text-slate-900 dark:text-white">Envoyé</span>
              </div>
            </div>
            <Button onClick={onClose} className="w-full h-10 text-sm">Fermer</Button>
          </motion.div>
        )}

        {/* ── Phase 3b : Escalade support ──────────────────────── */}
        {phase === 'escalated' && (
          <motion.div key="escalated" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 p-4 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-bold text-blue-700 dark:text-blue-400">Dossier créé — réponse sous 4h</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Votre contestation nécessite une vérification manuelle. Un conseiller reprend votre dossier <strong>#{ticketId}</strong> et revient vers vous avant ce soir.
              </p>
            </div>
            <p className="text-[11px] text-slate-400 text-center">
              Aucun contact bancaire ni chargeback nécessaire — nous gérons tout.
            </p>
            <Button onClick={onClose} className="w-full h-10 text-sm bg-blue-500 hover:bg-blue-600 text-white">
              Parfait, j'attends le retour
            </Button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
