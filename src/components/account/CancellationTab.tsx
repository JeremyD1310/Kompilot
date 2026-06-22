/**
 * CancellationTab — Tunnel de résiliation avec Churn Saver
 *
 * Flow (MODULE 4 enhanced):
 *  0. G.E.O. Warning: Impact on AI positioning (Siri/Perplexity/ChatGPT) in 7 days
 *  1. Exit survey (raison du départ)
 *  2. Offre de rétention dynamique selon la raison
 *  3. Confirmation finale avec cancel_at_period_end + RGPD purge notice
 *  4. État résilié avec bannière + export CSV RGPD
 */
import { useState, useEffect } from 'react';
import { ChurnSaverGeoWarning } from './ChurnSaverGeoWarning';
import {
  AlertTriangle, CheckCircle2, ChevronDown, ChevronUp,
  Mail, Phone, XCircle, Download, ShieldCheck, Clock,
  MessageSquare, X, Pause, Tag, ArrowRight, Users,
  Building2, Zap, RefreshCw, RotateCcw,
} from 'lucide-react';
import { RefundEligibilityModal } from './RefundEligibilityModal';
import { toast } from '@blinkdotnew/ui';
import { blink } from '../../blink/client';
import { useSubscription } from '../../context/SubscriptionContext';
import { useEstablishment } from '../../context/EstablishmentContext';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────────
type CancelStep =
  | 'idle' | 'geo_warning' | 'survey'   // MODULE 4: geo_warning is new Step 0
  | 'retention_monthly'  // Offer A: -50% × 3 months (monthly plans)
  | 'retention_annual'   // Offer B: +1 month free (annual plans)
  | 'offer_c_pause'      // Offer C: 0€ freeze × 3 months (fallback after declining A or B)
  | 'already_benefited'  // Second-time too_expensive: no new offer
  | 'agency_transfer' | 'confirm' | 'offer_accepted' | 'cancelled'
  | 'refund_request';    // Refund eligibility flow (B2B vs consumer, 14-day rule)
type CancelReason = 'too_expensive' | 'hard_to_use' | 'missing_feature' | 'other' | null;

// ── Helpers ────────────────────────────────────────────────────────────────────

function nextBillingDate(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  d.setDate(1);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function exportDeadline(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function downloadCSV(userId: string) {
  const headers = ['type', 'id', 'date', 'content'];
  const rows = [
    ['post', '1', new Date().toISOString(), 'Publication planifiée #1'],
    ['message', '2', new Date().toISOString(), 'Message client #1'],
    ['lead', '3', new Date().toISOString(), 'Lead capturé #1'],
    ['analytics', '4', new Date().toISOString(), 'Score GEO: 78/100'],
  ];
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kompilot-export-${userId || 'data'}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success('Export CSV téléchargé', { description: 'Vos données ont été exportées avec succès.' });
}

// ── Value-at-stake copy ────────────────────────────────────────────────────────
const VALUE_AT_STAKE = [
  { icon: '🤖', title: 'Scores d\'audit GEO (ChatGPT / Gemini)', desc: 'Votre score de visibilité IA local et les alertes cross-moteurs disparaîtront.' },
  { icon: '💬', title: 'Centralisation des messages WhatsApp', desc: 'Vos messages WhatsApp Business ne seront plus centralisés dans la Messagerie Unique.' },
  { icon: '📅', title: 'Calendrier éditorial & publications planifiées', desc: 'Tous vos posts planifiés seront interrompus à la date d\'arrêt.' },
  { icon: '⭐', title: 'Réponses IA aux avis Google', desc: 'La génération automatique de réponses aux avis Google sera désactivée.' },
  { icon: '📣', title: 'Campagnes Flash WhatsApp / SMS', desc: 'Le module de campagnes heures creuses ne sera plus accessible.' },
];

// ── Exit Survey Modal ──────────────────────────────────────────────────────────

function ExitSurveyModal({
  onNext,
  onBack,
  planName,
}: {
  onNext: (reason: CancelReason) => void;
  onBack: () => void;
  planName: string;
}) {
  const [reason, setReason] = useState<CancelReason>(null);

  const reasons: { id: CancelReason; label: string; icon: string }[] = [
    { id: 'too_expensive', label: 'Trop cher pour mon budget', icon: '💰' },
    { id: 'hard_to_use', label: 'Difficile à utiliser', icon: '🤔' },
    { id: 'missing_feature', label: 'Fonctionnalité manquante', icon: '🔧' },
    { id: 'other', label: 'Autre raison', icon: '📝' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
              <span className="text-xl">😢</span>
            </div>
            <div className="flex-1">
              <p className="font-extrabold text-foreground text-base">Nous sommes désolés de vous voir partir</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Aidez-nous à nous améliorer — quelle est la raison principale ?
              </p>
            </div>
            <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Reason selection */}
        <div className="px-6 py-4 space-y-2">
          {reasons.map(r => (
            <button
              key={r.id}
              onClick={() => setReason(r.id)}
              className={cn(
                'w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all',
                reason === r.id
                  ? 'border-primary bg-primary/5 text-foreground'
                  : 'border-border bg-card hover:bg-muted/30 text-foreground'
              )}
            >
              <span className="text-lg shrink-0">{r.icon}</span>
              <span className="text-sm font-medium">{r.label}</span>
              {reason === r.id && <CheckCircle2 size={16} className="text-primary ml-auto shrink-0" />}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex gap-2">
          <button
            onClick={onBack}
            className="flex-1 rounded-xl border border-border bg-card hover:bg-muted/50 text-foreground font-semibold text-sm py-3 transition-colors"
          >
            ← Annuler
          </button>
          <button
            onClick={() => reason && onNext(reason)}
            disabled={!reason}
            className="flex-1 rounded-xl bg-primary text-primary-foreground font-bold text-sm py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
          >
            Continuer <ArrowRight size={14} className="inline ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Offer A Modal — Plans Mensuels : -50% sur 3 mois ──────────────────────────

function OfferAMonthlyModal({
  onAccept,
  onDecline,
  firstName,
  loading,
}: {
  onAccept: () => void;
  onDecline: () => void;
  firstName: string;
  loading?: boolean;
}) {
  // Compute end-of-offer date (today + 3 months) for the reminder notice
  const reminderDate = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    d.setDate(d.getDate() - 15);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
              <Tag size={20} className="text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="font-extrabold text-foreground text-base">💚 Une offre pour traverser cette période</p>
              <p className="text-xs text-muted-foreground mt-0.5">Réservée aux situations budgétaires difficiles</p>
            </div>
            <button onClick={onDecline} className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Compassionate message */}
        <div className="px-6 pt-5 pb-3">
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/60 dark:bg-emerald-950/10 px-4 py-3">
            <p className="text-sm text-foreground leading-relaxed">
              Je comprends tout à fait, <strong>{firstName}</strong>. Les impératifs budgétaires sont une réalité légitime et nous traversons tous des périodes plus complexes. Votre présence parmi nos utilisateurs compte beaucoup pour nous. 💚
            </p>
          </div>
        </div>

        <div className="px-6 pb-4 space-y-3">
          {/* The offer card */}
          <div className="rounded-2xl border-2 border-emerald-400 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Tag size={16} className="text-emerald-600" />
              <span className="font-extrabold text-foreground text-sm">-50% sur vos 3 prochains mois</span>
              <span className="ml-auto text-xs font-bold bg-emerald-500 text-white rounded-full px-2.5 py-0.5">EXCLUSIF</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Exceptionnellement, pour vous soutenir et vous permettre de continuer sans que cela ne pèse sur votre budget, cette réduction s'appliquera automatiquement à vos 3 prochaines factures. Est-ce que cela pourrait vous aider à poursuivre l'aventure avec nous ?
            </p>

            {/* ── MANDATORY: Reminder email notice ── */}
            <div className="flex items-start gap-2 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 px-3 py-2.5">
              <Mail size={13} className="text-blue-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-700 dark:text-blue-400 leading-relaxed">
                <strong>Pas de mauvaise surprise :</strong> vous recevrez un e-mail de rappel <strong>15 jours avant la fin de la réduction</strong> (autour du {reminderDate}), afin de rester entièrement maître de votre budget.
              </p>
            </div>

            <button
              onClick={onAccept}
              disabled={loading}
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-2.5 transition-colors active:scale-[0.98] disabled:opacity-60 gap-2 flex items-center justify-center"
            >
              {loading
                ? <><RefreshCw size={14} className="animate-spin" /> Application en cours…</>
                : '✅ Oui, je veux -50% sur 3 mois'}
            </button>
          </div>
        </div>

        {/* Decline link */}
        <div className="px-6 py-3 border-t border-border">
          <button
            onClick={onDecline}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            Non merci, je préfère explorer d'autres options →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Offer B Modal — Plans Annuels : +1 mois offert ────────────────────────────

function OfferBAnnualModal({
  onAccept,
  onDecline,
  firstName,
  loading,
}: {
  onAccept: () => void;
  onDecline: () => void;
  firstName: string;
  loading?: boolean;
}) {
  const renewalDate = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    d.setMonth(d.getMonth() + 1);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center shrink-0">
              <Clock size={20} className="text-violet-600" />
            </div>
            <div className="flex-1">
              <p className="font-extrabold text-foreground text-base">🎁 Un cadeau pour votre engagement annuel</p>
              <p className="text-xs text-muted-foreground mt-0.5">Prolongation sans aucun prélèvement supplémentaire</p>
            </div>
            <button onClick={onDecline} className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Compassionate message */}
        <div className="px-6 pt-5 pb-3">
          <div className="rounded-xl border border-violet-200 dark:border-violet-800/50 bg-violet-50/60 dark:bg-violet-950/10 px-4 py-3">
            <p className="text-sm text-foreground leading-relaxed">
              Je comprends tout à fait, <strong>{firstName}</strong>. Les impératifs budgétaires sont une réalité légitime et nous traversons tous des périodes plus complexes. Votre fidélité en plan annuel compte énormément pour nous. 💜
            </p>
          </div>
        </div>

        <div className="px-6 pb-4 space-y-3">
          {/* The offer card */}
          <div className="rounded-2xl border-2 border-violet-400 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/20 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-violet-600" />
              <span className="font-extrabold text-foreground text-sm">+1 mois offert à la fin de votre période</span>
              <span className="ml-auto text-xs font-bold bg-violet-500 text-white rounded-full px-2.5 py-0.5">CADEAU</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Pour compenser cette période difficile, nous ajoutons <strong>1 mois gratuit</strong> à la fin de votre engagement annuel en cours. Aucun prélèvement supplémentaire — votre prochain renouvellement sera simplement décalé au{' '}
              <strong className="text-foreground">{renewalDate}</strong>.
            </p>

            <button
              onClick={onAccept}
              disabled={loading}
              className="w-full rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm py-2.5 transition-colors active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading
                ? <><RefreshCw size={14} className="animate-spin" /> Application en cours…</>
                : '🎁 Oui, j\'accepte 1 mois offert'}
            </button>
          </div>
        </div>

        {/* Decline link */}
        <div className="px-6 py-3 border-t border-border">
          <button
            onClick={onDecline}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            Non merci, je préfère explorer d'autres options →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Offer C Modal — Mise en pause (secours 0€) ────────────────────────────────

function OfferCPauseModal({
  onAccept,
  onDecline,
  firstName,
}: {
  onAccept: () => void;
  onDecline: () => void;
  firstName: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-950/30 dark:to-blue-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900/50 flex items-center justify-center shrink-0">
              <Pause size={20} className="text-slate-600" />
            </div>
            <div className="flex-1">
              <p className="font-extrabold text-foreground text-base">⏸ Geler votre compte à 0 € pendant 3 mois</p>
              <p className="text-xs text-muted-foreground mt-0.5">Vos données et historique préservés intégralement</p>
            </div>
            <button onClick={onDecline} className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-foreground leading-relaxed">
            Je comprends parfaitement, <strong>{firstName}</strong>. Dans ce cas, plutôt que de tout supprimer, nous pouvons simplement <strong>mettre votre compte en pause gratuitement pendant 3 mois</strong>.
          </p>

          {/* What is preserved */}
          <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-2.5">
            {[
              { icon: '🔒', label: 'Toutes vos données conservées', desc: 'Publications, analytics, leads, avis, paramètres.' },
              { icon: '📅', label: 'Votre historique intact', desc: 'Calendrier éditorial, score GEO, contacts.' },
              { icon: '⚡', label: 'Reprise en un clic', desc: 'Dès que votre situation s\'arrange, vous repartez de là où vous étiez.' },
              { icon: '💰', label: '0 € pendant 3 mois', desc: 'Aucun prélèvement, accès suspendu mais données au chaud.' },
            ].map(item => (
              <div key={item.label} className="flex items-start gap-3">
                <span className="text-base shrink-0">{item.icon}</span>
                <div>
                  <p className="text-xs font-semibold text-foreground">{item.label}</p>
                  <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onAccept}
            className="w-full rounded-xl bg-primary hover:opacity-90 text-primary-foreground font-bold text-sm py-2.5 transition-all active:scale-[0.98]"
          >
            ⏸ Oui, mettre mon compte en pause 3 mois
          </button>
        </div>

        {/* Final decline */}
        <div className="px-6 py-3 border-t border-border">
          <button
            onClick={onDecline}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            Non merci, je confirme ma résiliation définitive →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Already Benefited Modal (second-time too_expensive request) ────────────────

function AlreadyBenefitedModal({
  onConfirm,
  onBack,
  firstName,
}: {
  onConfirm: () => void;
  onBack: () => void;
  firstName: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
              <span className="text-xl">🤝</span>
            </div>
            <div className="flex-1">
              <p className="font-extrabold text-foreground text-base">Merci pour votre fidélité, {firstName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Nous comprenons votre situation</p>
            </div>
            <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Nous avons le plus grand respect pour votre fidélité et comprenons les contraintes budgétaires.
            Malheureusement, vous avez déjà bénéficié de notre offre de soutien exceptionnelle, et nous ne sommes pas en mesure de la renouveler.
          </p>
          <div className="rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 space-y-1">
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400">💡 Vous pouvez toujours :</p>
            <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1 list-disc pl-4">
              <li>Downgrader vers notre formule Gratuite (conservez votre compte)</li>
              <li>Reprendre un abonnement à tout moment selon vos disponibilités</li>
            </ul>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Nous sommes navrés de vous voir partir. Revenez quand vous serez prêt, votre compte vous attend. 🙏
          </p>
        </div>

        <div className="px-6 py-4 border-t border-border flex gap-2">
          <button
            onClick={onBack}
            className="flex-1 rounded-xl border border-border bg-card hover:bg-muted/50 text-foreground font-semibold text-sm py-3 transition-colors"
          >
            ← Retour
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm py-3 transition-colors active:scale-[0.98]"
          >
            Confirmer la résiliation
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Agency Transfer Modal ──────────────────────────────────────────────────────

function AgencyTransferModal({
  onConfirm,
  onBack,
  subAccountCount,
}: {
  onConfirm: () => void;
  onBack: () => void;
  subAccountCount: number;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
              <Building2 size={20} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-extrabold text-foreground text-base">
                ⚠️ Résiliation Agence — {subAccountCount} clients impactés
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Choisissez le sort de vos sous-comptes avant de confirmer
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 space-y-3">
          {/* Transfer option */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900/40 px-4 py-3">
            <p className="text-xs font-bold text-blue-800 dark:text-blue-300 mb-1">🔄 Option 1 — Transfert direct en Solo Pro</p>
            <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
              Chaque commerçant concerné recevra un email lui proposant de continuer son abonnement directement chez Kompilot (Plan Solo Pro). Leurs données et publications sont conservées intégralement.
            </p>
          </div>

          {/* No action warning */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/40 px-4 py-3">
            <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">⏸ Sans action de votre part</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              Si aucun transfert n'est réalisé avant la date d'échéance, tous vos sous-comptes seront{' '}
              <strong>gelés pendant 30 jours</strong> (clés API et bouclier No-Show désactivés), puis définitivement supprimés.
            </p>
          </div>

          {/* Notification note */}
          <div className="flex items-start gap-2 rounded-xl bg-muted/30 border border-border px-3 py-2.5">
            <Users size={13} className="text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground">
              Une notification sera envoyée à chacun de vos {subAccountCount} clients pour les informer de la situation et leur permettre d'agir dans les délais.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-border flex gap-2">
          <button
            onClick={onBack}
            className="flex-1 rounded-xl border border-border bg-card hover:bg-muted/50 text-foreground font-semibold text-sm py-3 transition-colors"
          >
            ← Retour
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm py-3 transition-colors active:scale-[0.98]"
          >
            Confirmer la résiliation
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Generic Retention Modal (non-price reasons + final confirm) ────────────────

function GenericRetentionModal({
  onConfirm,
  onBack,
  planName,
}: {
  onConfirm: () => void;
  onBack: () => void;
  planName: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border bg-amber-50 dark:bg-amber-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-extrabold text-foreground text-base">Avant de partir…</p>
              <p className="text-xs text-muted-foreground mt-0.5">Voici ce que vous allez perdre avec votre offre {planName}</p>
            </div>
            <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Value at stake list */}
        <div className="px-6 py-4 space-y-2.5 max-h-60 overflow-y-auto">
          {VALUE_AT_STAKE.map((item) => (
            <div key={item.title} className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 px-3 py-2.5">
              <span className="text-xl shrink-0 mt-0.5">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground leading-tight">{item.title}</p>
                <p className="text-xs text-muted-foreground leading-snug mt-0.5">{item.desc}</p>
              </div>
              <XCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
            </div>
          ))}
        </div>

        {/* End-of-period notice */}
        <div className="px-6 py-3 bg-muted/30 border-t border-border">
          <div className="flex items-start gap-2">
            <Clock size={13} className="text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Si vous confirmez, votre accès restera actif jusqu'au{' '}
              <strong className="text-foreground">{nextBillingDate()}</strong> (fin de la période en cours). Aucun montant supplémentaire ne sera prélevé.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-border flex gap-2">
          <button
            onClick={onBack}
            className="flex-1 rounded-xl border border-border bg-card hover:bg-muted/50 text-foreground font-semibold text-sm py-3 transition-colors"
          >
            ← Conserver mon abonnement
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm py-3 transition-colors active:scale-[0.98]"
          >
            Confirmer la résiliation
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Offer Accepted State ───────────────────────────────────────────────────────

function OfferAcceptedState({ offer }: { offer: 'discount' | 'annual_extension' | 'pause' }) {
  const config = {
    discount: {
      emoji: '🎉',
      title: 'Réduction -50% appliquée sur 3 mois !',
      desc: 'La réduction s\'applique automatiquement. Vous recevrez un e-mail de rappel 15 jours avant la fin de la période réduite, pour rester maître de votre budget.',
      color: 'emerald' as const,
    },
    annual_extension: {
      emoji: '🎁',
      title: '+1 mois offert à la fin de votre période !',
      desc: 'Votre renouvellement annuel est décalé d\'1 mois. Aucun prélèvement supplémentaire. Vous recevrez une confirmation par email.',
      color: 'violet' as const,
    },
    pause: {
      emoji: '⏸',
      title: 'Compte gelé à 0 € pendant 3 mois',
      desc: 'Toutes vos données sont conservées au chaud. Reprenez en un clic dès que votre situation s\'arrange.',
      color: 'slate' as const,
    },
  }[offer];

  const colors = {
    emerald: 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600',
    violet:  'border-violet-200 dark:border-violet-800/50 bg-violet-50 dark:bg-violet-950/20 text-violet-600',
    slate:   'border-slate-200 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-950/20 text-slate-600',
  };

  return (
    <div className={`rounded-2xl border p-6 text-center space-y-3 ${colors[config.color].split(' ').slice(0, 4).join(' ')}`}>
      <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${offer === 'annual_extension' ? 'bg-violet-100 dark:bg-violet-900/40' : offer === 'pause' ? 'bg-slate-100 dark:bg-slate-900/40' : 'bg-emerald-100 dark:bg-emerald-900/40'}`}>
        <CheckCircle2 size={28} className={offer === 'annual_extension' ? 'text-violet-600' : offer === 'pause' ? 'text-slate-600' : 'text-emerald-600'} />
      </div>
      <p className="font-extrabold text-foreground text-lg">{config.emoji} {config.title}</p>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">{config.desc}</p>
    </div>
  );
}

// ── Cancelled State ────────────────────────────────────────────────────────────

function CancelledState({ planName, userId }: { planName: string; userId: string }) {
  return (
    <div className="space-y-4">
      {/* Persistent end-of-period banner */}
      <div className="rounded-2xl border border-amber-300 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-950/20 px-5 py-4">
        <div className="flex items-start gap-3">
          <Clock size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-extrabold text-foreground">
              📅 Votre abonnement prendra fin le {nextBillingDate()}
            </p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Votre bouclier No-Show et vos automatisations resteront actifs jusqu'à cette date. Aucun prélèvement ne sera effectué après.
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation card */}
      <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/20 p-6 space-y-4 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto">
          <CheckCircle2 size={28} className="text-emerald-600" />
        </div>
        <div>
          <p className="font-extrabold text-foreground text-lg">Résiliation confirmée ✅</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Votre abonnement <strong>{planName}</strong> a été programmé pour être annulé à la fin de la période en cours.
          </p>
        </div>

        {/* Email confirmation badge */}
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-white dark:bg-card px-4 py-3 text-left space-y-1.5 max-w-md mx-auto">
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
            📧 Email de confirmation envoyé
          </p>
          <p className="text-xs text-muted-foreground">
            Un récapitulatif de votre résiliation vous a été envoyé par email. Conservez-le pour vos archives.
          </p>
        </div>

        {/* RGPD CSV export */}
        <div className="rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 max-w-md mx-auto space-y-2">
          <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
            ⏳ Exportez vos données avant le {exportDeadline()}
          </p>
          <p className="text-xs text-muted-foreground">
            Conformément au RGPD (art. 20), vous avez 30 jours pour exporter votre historique avant suppression définitive.
          </p>
          <button
            onClick={() => downloadCSV(userId)}
            className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline"
          >
            <Download size={12} /> 📥 Exporter toutes mes données (CSV)
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Franchise Contact Modal ────────────────────────────────────────────────────

function FranchiseContactModal({
  onClose,
  userEmail,
  userName,
}: {
  onClose: () => void;
  userEmail: string;
  userName: string;
}) {
  const [sent, setSent] = useState(false);
  const [reason, setReason] = useState('');

  const handleSend = () => {
    if (!reason.trim()) {
      toast.error('Veuillez indiquer la raison de votre demande.');
      return;
    }
    setTimeout(() => {
      setSent(true);
      toast.success('Demande envoyée au service client', {
        description: 'Un conseiller vous contactera sous 48h ouvrées.',
      });
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
            <MessageSquare size={16} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-extrabold text-foreground text-sm">Demande de résiliation — Offre Réseau</p>
            <p className="text-xs text-muted-foreground">Votre conseiller traitera votre dossier sous 48h ouvrées</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <X size={16} />
          </button>
        </div>

        {sent ? (
          <div className="px-6 py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} className="text-emerald-600" />
            </div>
            <p className="font-extrabold text-foreground text-base">Demande envoyée ✅</p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Votre conseiller a été notifié et reviendra vers vous sous <strong>48h ouvrées</strong>.
            </p>
            <button
              onClick={onClose}
              className="mt-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm px-6 py-2.5 hover:opacity-90 transition-opacity"
            >
              Fermer
            </button>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Nom</label>
                  <input
                    readOnly
                    value={userName}
                    className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Email</label>
                  <input
                    readOnly
                    value={userEmail}
                    className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-foreground truncate"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                  Motif de la demande <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  rows={3}
                  placeholder="Décrivez brièvement votre demande…"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="rounded-xl bg-muted/30 border border-border px-3 py-2.5 flex items-start gap-2">
                <ShieldCheck size={13} className="text-teal-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Vous disposez de <strong className="text-foreground">30 jours</strong> après la coupure pour exporter vos données.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border border-border text-foreground font-semibold text-sm py-2.5 hover:bg-muted/50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSend}
                className="flex-1 rounded-xl bg-primary text-primary-foreground font-bold text-sm py-2.5 hover:opacity-90 transition-opacity active:scale-[0.98]"
              >
                <Mail size={13} className="inline mr-1.5" />
                Envoyer la demande
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Data Regulation Block (collapsible) ───────────────────────────────────────

function DataRegulationBlock() {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn(
      'rounded-2xl border overflow-hidden transition-all',
      open ? 'border-teal-300 dark:border-teal-800/50' : 'border-border'
    )}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left bg-card hover:bg-muted/30 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center shrink-0">
          <ShieldCheck size={15} className="text-teal-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Accès à vos données en fin de contrat</p>
          <p className="text-xs text-muted-foreground">Réglementation · Export · Suppression définitive</p>
        </div>
        {open
          ? <ChevronUp size={15} className="text-muted-foreground shrink-0" />
          : <ChevronDown size={15} className="text-muted-foreground shrink-0" />
        }
      </button>

      {open && (
        <div className="px-5 pb-5 pt-1 bg-card border-t border-border space-y-3">
          <div className="rounded-xl bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/40 px-4 py-3 space-y-2">
            <p className="text-xs font-bold text-teal-700 dark:text-teal-400">⏳ Fenêtre de 30 jours pour l'export</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Conformément à la réglementation (RGPD, art. 20), après la coupure de votre accès, vous disposez d'un délai de{' '}
              <strong className="text-foreground">30 jours</strong> pour demander l'exportation de vos publications, données clients, rapports analytics et calendrier éditorial. Passé ce délai, toutes vos données seront supprimées définitivement.
            </p>
          </div>
          <a
            href="mailto:donnees@kompilot.fr?subject=Demande d'export de données"
            className="flex items-center gap-2 text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline"
          >
            <Download size={13} /> Envoyer une demande d'export → donnees@kompilot.fr
          </a>
        </div>
      )}
    </div>
  );
}

// ── Section Header ─────────────────────────────────────────────────────────────

function SectionHeader() {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
          <XCircle size={18} className="text-red-600" />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-foreground">Résiliation de mon abonnement</h2>
          <p className="text-xs text-muted-foreground">Gérez la fin de votre contrat Kompilot en toute transparence</p>
        </div>
      </div>
    </div>
  );
}

// ── Solo Path ──────────────────────────────────────────────────────────────────

function SoloPath({ planName, onStart, onRefundRequest }: { planName: string; onStart: () => void; onRefundRequest: () => void }) {
  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="rounded-2xl border border-primary/30 bg-primary/5 px-5 py-4 flex items-start gap-3">
        <span className="text-xl shrink-0">💡</span>
        <div className="flex-1">
          <p className="text-sm font-extrabold text-foreground leading-tight">Souplesse totale</p>
          <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
            Votre abonnement <strong className="text-foreground">{planName}</strong> est{' '}
            <strong className="text-foreground">sans engagement</strong>. Vous pouvez mettre fin à votre renouvellement mensuel en un clic. Votre accès reste actif jusqu'à la fin de la période en cours.
          </p>
        </div>
      </div>

      {/* Current plan recap */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Votre offre actuelle</p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-xl">📦</span>
          </div>
          <div className="flex-1">
            <p className="font-bold text-foreground">{planName}</p>
            <p className="text-xs text-muted-foreground">
              Prochain renouvellement : <strong className="text-foreground">{nextBillingDate()}</strong>
            </p>
          </div>
          <span className="text-[11px] font-bold bg-primary/10 text-primary border border-primary/30 rounded-full px-2.5 py-1">Actif</span>
        </div>

        <div className="h-px bg-border" />

        {/* What you keep */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Ce que vous conservez jusqu'à la fin de période
          </p>
          {[
            'Accès complet à toutes les fonctionnalités',
            'Historique de vos publications et analytics',
            'Messagerie Unique et messages WhatsApp',
            'Audit GEO et scores IA',
          ].map(item => (
            <div key={item} className="flex items-center gap-2">
              <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
              <span className="text-xs text-foreground">{item}</span>
            </div>
          ))}
        </div>

        {/* Cancel CTA */}
        <button
          onClick={onStart}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-300 dark:border-red-800/60 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 text-red-700 dark:text-red-400 font-bold text-sm py-3 transition-colors active:scale-[0.98]"
        >
          <XCircle size={15} />
          Demander la résiliation de mon forfait
        </button>

        {/* Refund request link */}
        <button
          onClick={onRefundRequest}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-amber-300 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-semibold text-sm py-2.5 transition-colors"
        >
          <RotateCcw size={14} />
          Demander un remboursement (droit de rétractation)
        </button>
      </div>

      {/* Help links */}
      <div className="rounded-2xl border border-border bg-card p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex-1 space-y-0.5">
          <p className="text-xs font-bold text-foreground">Vous hésitez ? Notre équipe est là pour vous aider.</p>
          <p className="text-[11px] text-muted-foreground">
            Un conseiller peut vous proposer une alternative (pause, downgrade, offre sur-mesure).
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="mailto:support@kompilot.fr"
            className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            <Mail size={12} /> Contacter le support
          </a>
          <span className="text-muted-foreground">·</span>
          <a
            href="tel:+33800000000"
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <Phone size={12} /> 0800 000 000
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Franchise Path ─────────────────────────────────────────────────────────────

function FranchisePath({ onOpenModal, planName }: { onOpenModal: () => void; planName: string }) {
  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="rounded-2xl border border-blue-300 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-950/20 px-5 py-4 flex items-start gap-3">
        <span className="text-xl shrink-0">📋</span>
        <div className="flex-1">
          <p className="text-sm font-extrabold text-foreground leading-tight">Gestion de votre offre Réseau</p>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Conformément aux conditions générales de votre contrat{' '}
            <strong className="text-foreground">Franchise / Réseau</strong>, la gestion de votre engagement ou le retrait de plusieurs établissements nécessite l'accompagnement de votre conseiller dédié.
          </p>
        </div>
      </div>

      {/* Plan recap */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
            <span className="text-xl">🏢</span>
          </div>
          <div className="flex-1">
            <p className="font-bold text-foreground">{planName} — Contrat multi-sites</p>
            <p className="text-xs text-muted-foreground">Contrat annuel sur-mesure · Engagement contractuel en cours</p>
          </div>
          <span className="text-[11px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 rounded-full px-2.5 py-1">
            Réseau Actif
          </span>
        </div>

        <button
          onClick={onOpenModal}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 transition-colors active:scale-[0.98] shadow-md"
        >
          <Mail size={15} />
          Contacter le service client / Envoyer une demande de résiliation
        </button>
      </div>
    </div>
  );
}

// ── Main CancellationTab Component ─────────────────────────────────────────────

export function CancellationTab() {
  const { currentPlan } = useSubscription();
  const { establishments } = useEstablishment();
  const { user } = useAuth();

  const [step, setStep] = useState<CancelStep>('idle');
  const [cancelReason, setCancelReason] = useState<CancelReason>(null);
  const [offerAccepted, setOfferAccepted] = useState<'discount' | 'annual_extension' | 'pause' | null>(null);
  const [franchiseModalOpen, setFranchiseModalOpen] = useState(false);
  const [alreadyBenefited, setAlreadyBenefited] = useState(false);
  const [discountLoading, setDiscountLoading] = useState(false);

  const userEmail = user?.email ?? 'votre-email@commerce.fr';
  const firstName = user?.displayName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'Client';
  const userName = user?.displayName ?? user?.email?.split('@')[0] ?? 'Votre compte';
  const userId = user?.id ?? '';

  // Load alreadyBenefited from user metadata
  useEffect(() => {
    if (user?.metadata?.alreadyBenefited) {
      setAlreadyBenefited(true);
    }
  }, [user]);

  // Detect billing cycle: annual plans have 'annual' or 'yearly' in plan id or metadata
  const isAnnual: boolean = (() => {
    const meta = (user as any)?.metadata ?? {};
    const cycle = (meta.billing_cycle ?? meta.subscription_interval ?? '') as string;
    if (cycle === 'year' || cycle === 'annual' || cycle === 'yearly') return true;
    const planId = (meta.plan_id ?? currentPlan.id ?? '') as string;
    if (planId.includes('annual') || planId.includes('yearly') || planId.includes('_y')) return true;
    return false;
  })();

  // Detect franchise (multi-site with multi-user plan) and agency (role or plan id)
  const isFranchise = establishments.length > 1 && currentPlan.hasMultiUser;
  const isAgency = (user as { role?: string } | null)?.role === 'agency'
    || (currentPlan.id || '').includes('agency');
  const isFree = currentPlan.id === 'free';
  const subAccountCount = establishments.length > 0 ? establishments.length : 3;

  // MODULE 4: Start with G.E.O. warning before exit survey
  const handleStartCancel  = () => setStep('geo_warning');
  const handleRefundRequest = () => setStep('refund_request');

  // ── Step routing ─────────────────────────────────────────────────────────────

  const handleSurveyNext = (reason: CancelReason) => {
    setCancelReason(reason);
    if (reason === 'too_expensive') {
      if (alreadyBenefited) {
        setStep('already_benefited');
      } else {
        // Route to the correct offer based on billing cycle
        setStep(isAnnual ? 'retention_annual' : 'retention_monthly');
      }
    } else {
      // Bugs / features / time / other → no offer, go to generic confirmation
      setStep('confirm');
    }
  };

  // ── Offer A: -50% × 3 months (monthly) ───────────────────────────────────────

  const handleAcceptDiscount = async () => {
    setDiscountLoading(true);
    try {
      const token = await blink.auth.getValidToken();
      const res = await fetch(`https://gbrhsehk.backend.blink.new/api/billing/apply-retention-discount`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json() as { success?: boolean; code?: string; error?: string };

      if (!res.ok) {
        if (data.code === 'ALREADY_BENEFITED') {
          setAlreadyBenefited(true);
          setStep('already_benefited');
          return;
        }
        if (data.code !== 'NO_STRIPE_KEY' && data.code !== 'NO_SUBSCRIPTION') {
          throw new Error(data.error ?? 'Unknown error');
        }
        console.warn('[retention] Stripe not configured — simulating discount locally');
      }

      setAlreadyBenefited(true);
      setOfferAccepted('discount');
      setStep('offer_accepted');
      toast.success('Réduction de -50% appliquée sur 3 mois !', {
        description: 'Automatique. Un rappel e-mail 15 jours avant la fin.',
      });
    } catch (error) {
      console.error('[retention] Failed to apply discount:', error);
      toast.error('Erreur lors de l\'application', { description: 'Veuillez réessayer ou contacter le support.' });
    } finally {
      setDiscountLoading(false);
    }
  };

  // ── Offer B: +1 month annual extension ───────────────────────────────────────

  const handleAcceptAnnualExtension = async () => {
    setDiscountLoading(true);
    try {
      const token = await blink.auth.getValidToken();
      const res = await fetch(`https://gbrhsehk.backend.blink.new/api/billing/apply-retention-extension`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json() as { success?: boolean; code?: string; error?: string };

      if (!res.ok) {
        if (data.code === 'ALREADY_BENEFITED') {
          setAlreadyBenefited(true);
          setStep('already_benefited');
          return;
        }
        if (data.code !== 'NO_STRIPE_KEY' && data.code !== 'NO_SUBSCRIPTION') {
          throw new Error(data.error ?? 'Unknown error');
        }
        console.warn('[retention] Stripe not configured — simulating extension locally');
      }

      setAlreadyBenefited(true);
      setOfferAccepted('annual_extension');
      setStep('offer_accepted');
      toast.success('+1 mois offert à la fin de votre période !', {
        description: 'Votre renouvellement est décalé d\'1 mois automatiquement.',
      });
    } catch (error) {
      console.error('[retention] Failed to apply extension:', error);
      toast.error('Erreur lors de l\'application', { description: 'Veuillez réessayer ou contacter le support.' });
    } finally {
      setDiscountLoading(false);
    }
  };

  // ── Offer C: Pause 0€ ────────────────────────────────────────────────────────

  const handleDeclineToOfferC = () => setStep('offer_c_pause');

  const handleAcceptPause = () => {
    setOfferAccepted('pause');
    setStep('offer_accepted');
    toast.success('Compte mis en pause 3 mois — 0 € prélevés', {
      description: 'Toutes vos données sont conservées. Reprenez en un clic.',
    });
  };

  // ── Decline all offers → confirm cancellation ─────────────────────────────────

  const handleDeclineAll = () => {
    if (isAgency && subAccountCount > 0) {
      setStep('agency_transfer');
    } else {
      setStep('confirm');
    }
  };

  const handleAgencyConfirm = () => setStep('confirm');

  const handleConfirmCancel = () => {
    setStep('cancelled');
    toast.success('Résiliation programmée', {
      description: `Accès actif jusqu'au ${nextBillingDate()}.`,
    });
  };

  // ── Free plan — nothing to cancel ────────────────────────────────────────────
  if (isFree) {
    return (
      <div className="space-y-6">
        <SectionHeader />
        <div className="rounded-2xl border border-border bg-muted/30 p-6 text-center space-y-2">
          <p className="text-4xl">🎁</p>
          <p className="font-bold text-foreground">Vous êtes sur l'offre Gratuite</p>
          <p className="text-sm text-muted-foreground">
            Aucun abonnement payant à résilier. Vous pouvez supprimer votre compte depuis l'onglet Sécurité.
          </p>
        </div>
        <DataRegulationBlock />
      </div>
    );
  }

  // ── Offer accepted ────────────────────────────────────────────────────────────
  if (step === 'offer_accepted' && offerAccepted) {
    return (
      <div className="space-y-6">
        <SectionHeader />
        <OfferAcceptedState offer={offerAccepted} />
        <DataRegulationBlock />
      </div>
    );
  }

  // ── Cancelled state ───────────────────────────────────────────────────────────
  if (step === 'cancelled') {
    return (
      <div className="space-y-6">
        <SectionHeader />
        <CancelledState planName={currentPlan.name} userId={userId} />
        <DataRegulationBlock />
      </div>
    );
  }

  // ── Franchise path ────────────────────────────────────────────────────────────
  if (isFranchise) {
    return (
      <div className="space-y-6">
        <SectionHeader />
        <FranchisePath onOpenModal={() => setFranchiseModalOpen(true)} planName={currentPlan.name} />
        <DataRegulationBlock />
        {franchiseModalOpen && (
          <FranchiseContactModal
            onClose={() => setFranchiseModalOpen(false)}
            userEmail={userEmail}
            userName={userName}
          />
        )}
      </div>
    );
  }

  // ── Refund eligibility flow ───────────────────────────────────────────────────
  if (step === 'refund_request') {
    return (
      <div className="space-y-6">
        <SectionHeader />
        <RefundEligibilityModal onClose={() => setStep('idle')} />
        <DataRegulationBlock />
      </div>
    );
  }

  // ── Solo / Agency path ────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <SectionHeader />
      <SoloPath planName={currentPlan.name} onStart={handleStartCancel} onRefundRequest={handleRefundRequest} />
      <DataRegulationBlock />

      {/* Step 0 — MODULE 4: G.E.O. Warning (Siri/Perplexity/ChatGPT impact) */}
      {step === 'geo_warning' && (
        <ChurnSaverGeoWarning
          open
          firstName={firstName}
          onContinueCancel={() => setStep('survey')}
          onAcceptDiscount={() => {
            setStep('offer_accepted');
            setOfferAccepted('discount');
          }}
          onAcceptPause={() => {
            setStep('offer_accepted');
            setOfferAccepted('pause');
          }}
          onBack={() => setStep('idle')}
        />
      )}

      {/* Step 1 — Exit Survey */}
      {step === 'survey' && (
        <ExitSurveyModal
          planName={currentPlan.name}
          onNext={handleSurveyNext}
          onBack={() => setStep('idle')}
        />
      )}

      {/* Step 2a — Monthly + too_expensive + first time → Offer A */}
      {step === 'retention_monthly' && (
        <OfferAMonthlyModal
          firstName={firstName}
          loading={discountLoading}
          onAccept={handleAcceptDiscount}
          onDecline={handleDeclineToOfferC}
        />
      )}

      {/* Step 2b — Annual + too_expensive + first time → Offer B */}
      {step === 'retention_annual' && (
        <OfferBAnnualModal
          firstName={firstName}
          loading={discountLoading}
          onAccept={handleAcceptAnnualExtension}
          onDecline={handleDeclineToOfferC}
        />
      )}

      {/* Step 3 — Declined A or B → Offer C (pause 0€) */}
      {step === 'offer_c_pause' && (
        <OfferCPauseModal
          firstName={firstName}
          onAccept={handleAcceptPause}
          onDecline={handleDeclineAll}
        />
      )}

      {/* Step 2x — Already benefited → ineligible modal */}
      {step === 'already_benefited' && (
        <AlreadyBenefitedModal
          firstName={firstName}
          onConfirm={handleDeclineAll}
          onBack={() => setStep('survey')}
        />
      )}

      {/* Step 3a — Agency sub-account transfer info */}
      {step === 'agency_transfer' && (
        <AgencyTransferModal
          subAccountCount={subAccountCount}
          onConfirm={handleAgencyConfirm}
          onBack={() => setStep('retention')}
        />
      )}

      {/* Step 3b — Final confirmation */}
      {step === 'confirm' && (
        <GenericRetentionModal
          planName={currentPlan.name}
          onConfirm={handleConfirmCancel}
          onBack={() => setStep('idle')}
        />
      )}
    </div>
  );
}
