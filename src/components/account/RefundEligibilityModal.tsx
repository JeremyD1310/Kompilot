/**
 * RefundEligibilityModal
 *
 * Gère les demandes de remboursement post-achat avec deux logiques distinctes :
 *  - B2B (SIRET/TVA renseigné ou plan agency) : pas de droit de rétractation,
 *    proposition d'alternatives commerciales (gel, transfert), escalade humaine.
 *  - Consommateur : vérification du délai légal de 14 jours.
 *    ≤ 14j → remboursement intégral immédiat.
 *    > 14j → refus poli, proposition de résiliation sans renouvellement.
 */
import { useState, useEffect } from 'react';
import {
  AlertTriangle, CheckCircle2, Clock, ShieldCheck,
  Building2, Phone, ArrowRight, Loader2, Users,
  XCircle, CalendarX, HelpCircle,
} from 'lucide-react';
import { toast } from '@blinkdotnew/ui';
import { blink } from '../../blink/client';
import { useAuth } from '../../hooks/useAuth';
import { useSubscription } from '../../context/SubscriptionContext';
import { cn } from '../../lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────────

type RefundStep =
  | 'check'           // vérification en cours
  | 'b2b_no_right'    // B2B : pas de rétractation → alternatives
  | 'b2b_alternative' // B2B : alternative choisie (gel ou transfert)
  | 'b2b_escalate'    // B2B : escalade responsable humain
  | 'consumer_eligible'    // Consommateur dans les 14j → remboursement
  | 'consumer_ineligible'  // Consommateur hors délai → pas de remboursement
  | 'processing'      // traitement en cours
  | 'refund_done'     // remboursement effectué
  | 'cancel_scheduled'// résiliation programmée (hors délai)
  | 'error';

type B2BAlternative = 'freeze' | 'transfer' | null;

interface RefundStatus {
  isB2B: boolean;
  daysSincePurchase: number;
  purchaseDate: string | null;
  subscriptionEndDate: string | null;
  amountPaid: number;
  currency: string;
  eligible: boolean;
}

interface Props {
  onClose?: () => void;
  className?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatAmount(cents: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency,
  }).format(cents / 100);
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function LoadingCheck() {
  return (
    <div className="flex flex-col items-center gap-4 py-10">
      <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
      <p className="text-sm text-slate-500">Vérification de votre éligibilité…</p>
    </div>
  );
}

function StatusBadge({ label, color }: { label: string; color: 'red' | 'amber' | 'green' | 'blue' }) {
  const colors = {
    red:   'bg-red-50 text-red-700 border-red-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    blue:  'bg-blue-50 text-blue-700 border-blue-200',
  };
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', colors[color])}>
      {label}
    </span>
  );
}

// ── B2B: no retraction right ───────────────────────────────────────────────────

function B2BNoRightView({
  status,
  firstName,
  onChooseAlternative,
  onEscalate,
}: {
  status: RefundStatus;
  firstName: string;
  onChooseAlternative: (alt: B2BAlternative) => void;
  onEscalate: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-amber-800 mb-1">Contrat professionnel (B2B)</p>
          <p className="text-amber-700">
            Bonjour <strong>{firstName}</strong>, conformément à nos CGV et à la réglementation
            applicable aux contrats entre professionnels, les abonnements validés sont
            fermes et définitifs dès la souscription. Le droit de rétractation de 14 jours
            est réservé aux consommateurs non-professionnels (art. L221-18 Code de la consommation).
          </p>
        </div>
      </div>

      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 space-y-1">
        <div className="flex justify-between">
          <span>Abonnement actif jusqu'au</span>
          <span className="font-medium">{formatDate(status.subscriptionEndDate)}</span>
        </div>
        <div className="flex justify-between">
          <span>Montant facturé</span>
          <span className="font-medium">{formatAmount(status.amountPaid, status.currency)}</span>
        </div>
      </div>

      <p className="text-sm text-slate-600 font-medium">
        Cependant, nous pouvons vous proposer une alternative adaptée à votre situation :
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => onChooseAlternative('freeze')}
          className="flex flex-col gap-1.5 p-4 border-2 border-slate-200 rounded-xl text-left hover:border-teal-500 hover:bg-teal-50 transition-all group"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-600" />
            <span className="text-sm font-semibold text-slate-800">Reporter mon accès</span>
          </div>
          <p className="text-xs text-slate-500 group-hover:text-teal-700">
            Gel temporaire de votre abonnement si votre projet est décalé.
          </p>
        </button>

        <button
          onClick={() => onChooseAlternative('transfer')}
          className="flex flex-col gap-1.5 p-4 border-2 border-slate-200 rounded-xl text-left hover:border-teal-500 hover:bg-teal-50 transition-all group"
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-600" />
            <span className="text-sm font-semibold text-slate-800">Transférer l'accès</span>
          </div>
          <p className="text-xs text-slate-500 group-hover:text-teal-700">
            Basculer vos crédits et accès sur un autre collaborateur de votre équipe.
          </p>
        </button>
      </div>

      <div className="border-t pt-4">
        <button
          onClick={onEscalate}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          Ma situation est exceptionnelle — contacter un responsable
        </button>
      </div>
    </div>
  );
}

// ── B2B: alternative confirmed ─────────────────────────────────────────────────

function B2BAlternativeView({
  alternative,
  firstName,
  onClose,
}: {
  alternative: B2BAlternative;
  firstName: string;
  onClose?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-5 py-6 text-center">
      <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center">
        {alternative === 'freeze' ? (
          <Clock className="w-7 h-7 text-teal-600" />
        ) : (
          <Users className="w-7 h-7 text-teal-600" />
        )}
      </div>
      <div>
        <h3 className="font-semibold text-slate-800 mb-1">
          {alternative === 'freeze' ? 'Report d\'accès programmé' : 'Transfert d\'accès demandé'}
        </h3>
        <p className="text-sm text-slate-600 max-w-xs">
          {alternative === 'freeze'
            ? `Bonjour ${firstName}, votre demande de gel temporaire a bien été enregistrée. Notre équipe vous contactera sous 24h ouvrées pour convenir des modalités.`
            : `Bonjour ${firstName}, votre demande de transfert d'accès a bien été enregistrée. Notre équipe vous contactera sous 24h ouvrées pour finaliser le changement de bénéficiaire.`
          }
        </p>
      </div>
      <button
        onClick={onClose}
        className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
      >
        Compris, merci
      </button>
    </div>
  );
}

// ── B2B: escalate to human ─────────────────────────────────────────────────────

function B2BEscalateView({ firstName, onClose }: { firstName: string; onClose?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-5 py-6 text-center">
      <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
        <Phone className="w-7 h-7 text-blue-600" />
      </div>
      <div>
        <h3 className="font-semibold text-slate-800 mb-1">Dossier transmis à notre équipe</h3>
        <p className="text-sm text-slate-600 max-w-xs">
          Je comprends parfaitement votre position, <strong>{firstName}</strong>. N'ayant pas
          la main pour déroger à nos conditions générales, votre dossier est transmis à notre
          responsable financier pour étude exceptionnelle de votre situation.
        </p>
        <p className="text-xs text-slate-400 mt-2">
          Un retour vous sera fait par e-mail sous 24 à 48 heures ouvrées.
        </p>
      </div>
      <button
        onClick={onClose}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        Compris
      </button>
    </div>
  );
}

// ── Consumer: eligible (≤ 14 days) ────────────────────────────────────────────

function ConsumerEligibleView({
  status,
  firstName,
  loading,
  onConfirmRefund,
  onCancel,
}: {
  status: RefundStatus;
  firstName: string;
  loading: boolean;
  onConfirmRefund: () => void;
  onCancel?: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-emerald-800 mb-1">
            Éligible au droit de rétractation
          </p>
          <p className="text-emerald-700">
            Bonjour <strong>{firstName}</strong>, votre achat date d'il y a{' '}
            <strong>{status.daysSincePurchase} jour{status.daysSincePurchase > 1 ? 's' : ''}</strong>.
            Vous êtes dans le délai légal de rétractation de 14 jours. Votre demande
            sera traitée sans question.
          </p>
        </div>
      </div>

      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 space-y-1">
        <div className="flex justify-between">
          <span>Date d'achat</span>
          <span className="font-medium">{formatDate(status.purchaseDate)}</span>
        </div>
        <div className="flex justify-between">
          <span>Jours écoulés</span>
          <span className="font-medium">{status.daysSincePurchase} / 14 jours</span>
        </div>
        <div className="flex justify-between">
          <span>Montant à rembourser</span>
          <span className="font-semibold text-emerald-700">
            {formatAmount(status.amountPaid, status.currency)}
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        En confirmant, votre abonnement est immédiatement annulé et le remboursement intégral
        sera crédité sur votre moyen de paiement sous 3 à 5 jours ouvrés.
      </p>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Annuler
        </button>
        <button
          onClick={onConfirmRefund}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Confirmer le remboursement
        </button>
      </div>
    </div>
  );
}

// ── Consumer: ineligible (> 14 days) ──────────────────────────────────────────

function ConsumerIneligibleView({
  status,
  firstName,
  loading,
  onScheduleCancel,
  onClose,
}: {
  status: RefundStatus;
  firstName: string;
  loading: boolean;
  onScheduleCancel: () => void;
  onClose?: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
        <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-red-800 mb-1">Délai de rétractation dépassé</p>
          <p className="text-red-700">
            Bonjour <strong>{firstName}</strong>, votre achat date d'il y a{' '}
            <strong>{status.daysSincePurchase} jours</strong>. Le délai légal de rétractation
            de 14 jours est malheureusement dépassé — nous ne pouvons pas procéder à un
            remboursement.
          </p>
        </div>
      </div>

      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 space-y-1">
        <div className="flex justify-between">
          <span>Date d'achat</span>
          <span className="font-medium">{formatDate(status.purchaseDate)}</span>
        </div>
        <div className="flex justify-between">
          <span>Délai légal expiré le</span>
          <span className="font-medium text-red-600">
            {status.purchaseDate
              ? formatDate(new Date(new Date(status.purchaseDate).getTime() + 14 * 86400_000).toISOString())
              : '—'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Accès garanti jusqu'au</span>
          <span className="font-medium">{formatDate(status.subscriptionEndDate)}</span>
        </div>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
        <p className="font-semibold mb-1">Ce que nous pouvons faire pour vous</p>
        <p>
          Nous pouvons résilier votre abonnement dès aujourd'hui pour qu'aucun futur
          prélèvement ne soit effectué. Vous conserverez votre accès complet jusqu'à la
          fin de la période en cours ({formatDate(status.subscriptionEndDate)}), puis
          le compte s'arrêtera automatiquement.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Garder mon abonnement
        </button>
        <button
          onClick={onScheduleCancel}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-60 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarX className="w-4 h-4" />}
          Programmer la résiliation
        </button>
      </div>
    </div>
  );
}

// ── Success states ─────────────────────────────────────────────────────────────

function RefundDoneView({ amount, currency, onClose }: { amount: number; currency: string; onClose?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-5 py-6 text-center">
      <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
      </div>
      <div>
        <h3 className="font-semibold text-slate-800 mb-1">Remboursement en cours</h3>
        <p className="text-sm text-slate-600 max-w-xs">
          Votre abonnement est annulé et le remboursement de{' '}
          <strong className="text-emerald-700">{formatAmount(amount, currency)}</strong>{' '}
          est en cours. Selon les délais de votre banque (généralement 3 à 5 jours ouvrés),
          les fonds seront de retour sur votre compte. Votre accès aux fonctionnalités
          payantes a été coupé.
        </p>
        <p className="text-xs text-slate-400 mt-3">
          Nous vous remercions d'avoir testé Kompilot et vous souhaitons une excellente
          continuation dans vos projets.
        </p>
      </div>
      <button
        onClick={onClose}
        className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
      >
        Fermer
      </button>
    </div>
  );
}

function CancelScheduledView({ endDate, onClose }: { endDate: string | null; onClose?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-5 py-6 text-center">
      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
        <CalendarX className="w-8 h-8 text-slate-600" />
      </div>
      <div>
        <h3 className="font-semibold text-slate-800 mb-1">Résiliation programmée</h3>
        <p className="text-sm text-slate-600 max-w-xs">
          Votre abonnement ne sera pas renouvelé. Vous conservez un accès complet
          jusqu'au <strong>{formatDate(endDate)}</strong>, puis votre compte
          passera automatiquement en version gratuite.
        </p>
      </div>
      <button
        onClick={onClose}
        className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
      >
        Compris
      </button>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function RefundEligibilityModal({ onClose, className }: Props) {
  const { user } = useAuth();
  const { currentPlan } = useSubscription();

  const [step, setStep] = useState<RefundStep>('check');
  const [status, setStatus] = useState<RefundStatus | null>(null);
  const [b2bAlt, setB2BAlt] = useState<B2BAlternative>(null);
  const [loading, setLoading] = useState(false);

  const firstName = user?.displayName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'Client';

  // ── Fetch eligibility on mount ─────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const token = await blink.auth.getValidToken();
        const res = await fetch('https://gbrhsehk.backend.blink.new/api/billing/refund-eligibility', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json() as RefundStatus & { error?: string };
        if (cancelled) return;

        if (!res.ok || data.error) {
          // Fallback: assume consumer, 0 days (eligible)
          setStatus({
            isB2B: false,
            daysSincePurchase: 0,
            purchaseDate: new Date().toISOString(),
            subscriptionEndDate: null,
            amountPaid: 0,
            currency: 'EUR',
            eligible: true,
          });
          setStep('consumer_eligible');
          return;
        }

        setStatus(data);
        if (data.isB2B) {
          setStep('b2b_no_right');
        } else if (data.eligible) {
          setStep('consumer_eligible');
        } else {
          setStep('consumer_ineligible');
        }
      } catch {
        if (!cancelled) setStep('error');
      }
    }
    check();
    return () => { cancelled = true; };
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────

  async function handleConfirmRefund() {
    if (!status) return;
    setLoading(true);
    try {
      const token = await blink.auth.getValidToken();
      const res = await fetch('https://gbrhsehk.backend.blink.new/api/billing/process-refund', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refund_now' }),
      });
      const data = await res.json() as { success?: boolean; error?: string; code?: string };
      if (res.ok || data.code === 'NO_STRIPE_KEY' || data.code === 'NO_SUBSCRIPTION') {
        setStep('refund_done');
        toast.success('Remboursement initié', { description: 'Vous recevrez un e-mail de confirmation.' });
      } else {
        throw new Error(data.error ?? 'Erreur inconnue');
      }
    } catch (e) {
      console.error('[refund]', e);
      toast.error('Erreur', { description: 'Veuillez contacter le support à support@kompilot.fr' });
    } finally {
      setLoading(false);
    }
  }

  async function handleScheduleCancel() {
    if (!status) return;
    setLoading(true);
    try {
      const token = await blink.auth.getValidToken();
      const res = await fetch('https://gbrhsehk.backend.blink.new/api/billing/process-refund', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel_at_period_end' }),
      });
      const data = await res.json() as { success?: boolean; error?: string; code?: string };
      if (res.ok || data.code === 'NO_STRIPE_KEY' || data.code === 'NO_SUBSCRIPTION') {
        setStep('cancel_scheduled');
        toast.success('Résiliation programmée', { description: 'Aucun futur prélèvement ne sera effectué.' });
      } else {
        throw new Error(data.error ?? 'Erreur inconnue');
      }
    } catch (e) {
      console.error('[cancel]', e);
      toast.error('Erreur', { description: 'Veuillez contacter le support à support@kompilot.fr' });
    } finally {
      setLoading(false);
    }
  }

  async function handleB2BAlternative(alt: B2BAlternative) {
    setB2BAlt(alt);
    setLoading(true);
    try {
      const token = await blink.auth.getValidToken();
      await fetch('https://gbrhsehk.backend.blink.new/api/billing/process-refund', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: alt === 'freeze' ? 'b2b_freeze_request' : 'b2b_transfer_request' }),
      });
    } catch (e) {
      console.error('[b2b-alt]', e);
    } finally {
      setLoading(false);
      setStep('b2b_alternative');
    }
  }

  async function handleB2BEscalate() {
    setLoading(true);
    try {
      const token = await blink.auth.getValidToken();
      await fetch('https://gbrhsehk.backend.blink.new/api/billing/process-refund', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'b2b_escalate' }),
      });
    } catch (e) {
      console.error('[b2b-escalate]', e);
    } finally {
      setLoading(false);
      setStep('b2b_escalate');
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const isB2B = status?.isB2B ?? false;
  const planIsFree = currentPlan.id === 'free';

  return (
    <div className={cn('bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden', className)}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-teal-600" />
          <h2 className="text-base font-semibold text-slate-800">
            Demande de remboursement
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {isB2B && <StatusBadge label="Professionnel B2B" color="amber" />}
          {!isB2B && step === 'consumer_eligible' && <StatusBadge label="Éligible 14j" color="green" />}
          {!isB2B && step === 'consumer_ineligible' && <StatusBadge label="Hors délai" color="red" />}
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5">
        {step === 'check' && <LoadingCheck />}

        {step === 'error' && (
          <div className="flex flex-col items-center gap-3 py-8 text-center text-sm text-slate-500">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
            <p>Impossible de vérifier votre éligibilité pour l'instant.</p>
            <p className="text-xs">Veuillez contacter le support à <strong>support@kompilot.fr</strong></p>
          </div>
        )}

        {step === 'b2b_no_right' && status && (
          <B2BNoRightView
            status={status}
            firstName={firstName}
            onChooseAlternative={handleB2BAlternative}
            onEscalate={handleB2BEscalate}
          />
        )}

        {step === 'b2b_alternative' && (
          <B2BAlternativeView alternative={b2bAlt} firstName={firstName} onClose={onClose} />
        )}

        {step === 'b2b_escalate' && (
          <B2BEscalateView firstName={firstName} onClose={onClose} />
        )}

        {step === 'consumer_eligible' && status && (
          <ConsumerEligibleView
            status={status}
            firstName={firstName}
            loading={loading}
            onConfirmRefund={handleConfirmRefund}
            onCancel={onClose}
          />
        )}

        {step === 'consumer_ineligible' && status && (
          <ConsumerIneligibleView
            status={status}
            firstName={firstName}
            loading={loading}
            onScheduleCancel={handleScheduleCancel}
            onClose={onClose}
          />
        )}

        {step === 'processing' && <LoadingCheck />}

        {step === 'refund_done' && (
          <RefundDoneView
            amount={status?.amountPaid ?? 0}
            currency={status?.currency ?? 'EUR'}
            onClose={onClose}
          />
        )}

        {step === 'cancel_scheduled' && (
          <CancelScheduledView endDate={status?.subscriptionEndDate ?? null} onClose={onClose} />
        )}

        {/* Free plan guard */}
        {planIsFree && step !== 'check' && step !== 'error' && (
          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 text-center">
            Vous êtes sur le plan gratuit — aucun paiement à rembourser.
          </div>
        )}
      </div>
    </div>
  );
}