/**
 * SMSBalanceWidget — Affiche le solde SMS restant et propose une recharge si épuisé.
 * À intégrer à côté de SMSFlashWidget dans le Dashboard.
 */
import { useState } from 'react';
import { MessageSquare, Zap, X, TrendingUp, Gift, ChevronRight } from 'lucide-react';
import { useSmsCredits } from '../../hooks/useSmsCredits';
import { useTrial } from '../../context/TrialContext';
import { Link } from '@tanstack/react-router';
import { useAlertSettings } from '../../context/AlertSettingsContext';

// ── Recharge modal ────────────────────────────────────────────────────────────

function SmsRechargeModal({ onClose, balance, planMonthlyQuota }: {
  onClose: () => void;
  balance: number;
  planMonthlyQuota: number;
}) {
  const plans = [
    {
      id: 'pro',
      label: 'Pro',
      sms: 200,
      price: '19€/mois',
      highlight: false,
      description: 'Idéal pour les commerces indépendants',
    },
    {
      id: 'expert',
      label: 'Expert',
      sms: 1000,
      price: '39€/mois',
      highlight: true,
      description: 'Pour les agences & multi-établissements',
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-4 bottom-4 md:inset-auto md:left-1/2 md:-translate-x-1/2 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:w-full md:max-w-md bg-card border border-border rounded-3xl shadow-2xl z-50 overflow-hidden">

        {/* Header */}
        <div className="relative bg-gradient-to-br from-emerald-600 to-teal-600 px-6 py-5">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X size={14} className="text-white" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <MessageSquare size={20} className="text-white" />
            </div>
            <div>
              <p className="font-extrabold text-white text-lg leading-tight">Recharger vos SMS</p>
              <p className="text-white/70 text-xs mt-0.5">
                {balance === 0
                  ? 'Votre solde est épuisé'
                  : `Solde actuel : ${balance} SMS restants`}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Passez à un forfait supérieur pour envoyer plus de campagnes SMS/WhatsApp chaque mois et
            débloquer l'envoi en production réelle.
          </p>

          {/* Plan cards */}
          <div className="space-y-3">
            {plans.map(plan => (
              <div
                key={plan.id}
                className={`relative rounded-2xl border p-4 transition-all ${
                  plan.highlight
                    ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
                    : 'border-border bg-muted/30'
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-2.5 left-4 bg-emerald-500 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                    ⭐ Recommandé
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-foreground">{plan.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">à partir de</p>
                    <p className="font-extrabold text-foreground">{plan.price}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <MessageSquare size={13} className="text-emerald-500 shrink-0" />
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    {plan.sms.toLocaleString('fr-FR')} SMS/WhatsApp par mois inclus
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <Link
            to="/subscription"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-white font-bold text-sm py-3.5 shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98]"
          >
            <Zap size={15} /> Choisir mon forfait
            <ChevronRight size={14} />
          </Link>

          <button
            onClick={onClose}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            Continuer avec les SMS en simulation
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main widget ───────────────────────────────────────────────────────────────

export function SMSBalanceWidget() {
  const { balance, totalUsed, planMonthlyQuota, loading } = useSmsCredits();
  const { isTrialActive } = useTrial();
  const [showModal, setShowModal] = useState(false);
  const { settings: alertSettings } = useAlertSettings();

  const pct = Math.round((balance / Math.max(planMonthlyQuota, 1)) * 100);
  const isEmpty = balance === 0;
  const isLow = balance > 0 && balance <= 10;

  // If user disabled SMS alerts and balance is only in alert territory, hide the alert banner
  // (the full widget always renders — only the red/amber alert section is gated)
  const showSmsAlertBanner = alertSettings.showSmsAlerts;

  const barColor = isEmpty
    ? 'bg-red-500'
    : isLow
    ? 'bg-amber-400'
    : 'bg-emerald-500';

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 animate-pulse">
        <div className="h-4 w-32 bg-muted rounded mb-2" />
        <div className="h-2 w-full bg-muted rounded" />
      </div>
    );
  }

  return (
    <>
      <div
        className={`rounded-2xl border p-4 space-y-3 transition-all ${
          isEmpty
            ? 'border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-800/40'
            : isLow
            ? 'border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/40'
            : 'border-emerald-200/60 bg-emerald-50/50 dark:bg-emerald-950/10 dark:border-emerald-800/30'
        }`}
      >
        {/* Header row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MessageSquare
              size={14}
              className={isEmpty ? 'text-red-500' : isLow ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}
            />
            <span className="text-xs font-bold text-foreground">
              💬 Solde SMS restants
            </span>
            {isTrialActive && (
              <span className="text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-1.5 py-0.5 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700/50">
                Simulation
              </span>
            )}
          </div>
          <span className={`text-sm font-extrabold tabular-nums ${
            isEmpty ? 'text-red-600 dark:text-red-400'
            : isLow ? 'text-amber-600 dark:text-amber-400'
            : 'text-emerald-700 dark:text-emerald-400'
          }`}>
            {balance} <span className="text-xs font-normal text-muted-foreground">/ {planMonthlyQuota}</span>
          </span>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${Math.max(2, pct)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{totalUsed} utilisés</span>
            <span>{pct}% restant</span>
          </div>
        </div>

        {/* Alerte & action — only shown if SMS alerts are enabled */}
        {showSmsAlertBanner && isEmpty && (
          <div className="space-y-2">
            <p className="text-xs text-red-600 dark:text-red-400 font-semibold leading-snug">
              ⚠️ Votre solde SMS est épuisé. Rechargez pour envoyer de nouvelles campagnes.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 w-full justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-white text-xs font-bold py-2.5 shadow transition-all active:scale-[0.98]"
            >
              <Zap size={12} /> Recharger mes SMS
            </button>
          </div>
        )}

        {showSmsAlertBanner && isLow && !isEmpty && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium leading-snug flex-1">
              ⏳ Solde faible — {balance} SMS restants
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-300 dark:border-emerald-700/50 rounded-lg px-2.5 py-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors whitespace-nowrap shrink-0"
            >
              <TrendingUp size={10} /> Upgrade
            </button>
          </div>
        )}

        {!isEmpty && !isLow && isTrialActive && (
          <div className="flex items-center gap-1.5">
            <Gift size={11} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
              Pack de bienvenue actif — SMS en simulation pendant l'essai
            </p>
          </div>
        )}
      </div>

      {showModal && (
        <SmsRechargeModal
          onClose={() => setShowModal(false)}
          balance={balance}
          planMonthlyQuota={planMonthlyQuota}
        />
      )}
    </>
  );
}
