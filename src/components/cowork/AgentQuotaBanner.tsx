/**
 * AgentQuotaBanner — Fair Use Policy UI for Claude Cowork AI Agents.
 *
 * Shows:
 *  - Monthly usage bar with colour-coded states (green → amber → red)
 *  - Exhausted state with a full-screen soft block + upsell pack selector
 *  - Buy-pack modal (simulated — ties into Stripe flow)
 */
import { useState } from 'react';
import {
  Zap, ShoppingCart, CheckCircle2, X, ArrowRight,
  AlertTriangle, Lock, Sparkles, RefreshCw,
} from 'lucide-react';
import { cn } from '@blinkdotnew/ui';
import { type AgentQuota, CREDIT_PACKS, type CreditPack } from '../../hooks/useAgentQuota';
import { useSubscription } from '../../context/SubscriptionContext';
import { toast } from '@blinkdotnew/ui';

// ── Usage bar colour ──────────────────────────────────────────────────────────

function barColor(pct: number): string {
  if (pct >= 100) return 'bg-red-500';
  if (pct >= 80)  return 'bg-amber-400';
  if (pct >= 60)  return 'bg-yellow-400';
  return 'bg-emerald-400';
}

function textColor(pct: number): string {
  if (pct >= 100) return 'text-red-400';
  if (pct >= 80)  return 'text-amber-400';
  if (pct >= 60)  return 'text-yellow-400';
  return 'text-emerald-400';
}

// ── Pack purchase modal ───────────────────────────────────────────────────────

function BuyPackModal({
  onClose, onBuy,
}: {
  onClose: () => void;
  onBuy: (pack: CreditPack) => void;
}) {
  const [selected, setSelected] = useState<string>(CREDIT_PACKS[1].id);
  const [buying, setBuying] = useState(false);

  const handleBuy = () => {
    const pack = CREDIT_PACKS.find(p => p.id === selected);
    if (!pack) return;
    setBuying(true);
    // Simulate Stripe redirect / payment flow (2s)
    setTimeout(() => {
      onBuy(pack);
      setBuying(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-indigo-500/10 to-violet-500/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <ShoppingCart size={15} className="text-indigo-300" />
            </div>
            <div>
              <p className="text-sm font-black text-white">Recharger des crédits Agents</p>
              <p className="text-[11px] text-slate-400">Credits supplémentaires, sans durée de validité</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Pack list */}
        <div className="p-5 space-y-3">
          {CREDIT_PACKS.map(pack => (
            <button
              key={pack.id}
              onClick={() => setSelected(pack.id)}
              className={cn(
                'w-full flex items-center justify-between rounded-xl border p-4 text-left transition-all',
                selected === pack.id
                  ? 'border-indigo-500/60 bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
                  : 'border-slate-700/60 bg-slate-800/40 hover:border-slate-600',
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                  selected === pack.id ? 'border-indigo-400 bg-indigo-500' : 'border-slate-600',
                )}>
                  {selected === pack.id && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{pack.label}</span>
                    {pack.badge && (
                      <span className="text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {pack.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    +{pack.sprints} sprints · {(pack.priceHT / pack.sprints).toFixed(2)} €/sprint
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-base font-black text-white">{pack.priceHT}€</p>
                <p className="text-[10px] text-slate-500">HT</p>
              </div>
            </button>
          ))}
        </div>

        {/* Legal note */}
        <div className="px-5 pb-2">
          <p className="text-[10px] text-slate-500 text-center leading-relaxed">
            Les crédits supplémentaires n'expirent pas. Facturation immédiate via Stripe.
            Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation
            ne s'applique pas aux services numériques livrés immédiatement.
          </p>
        </div>

        {/* CTA */}
        <div className="px-5 pb-5">
          <button
            onClick={handleBuy}
            disabled={buying}
            className={cn(
              'w-full flex items-center justify-center gap-2.5 rounded-xl py-3.5 font-black text-sm transition-all',
              buying
                ? 'opacity-60 cursor-not-allowed bg-slate-700 text-slate-400'
                : 'bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white shadow-lg shadow-indigo-500/25',
            )}
          >
            {buying ? (
              <><RefreshCw size={15} className="animate-spin" /> Redirection Stripe…</>
            ) : (
              <><ShoppingCart size={15} /> Acheter ce pack <ArrowRight size={13} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Exhausted soft-block banner ───────────────────────────────────────────────

function ExhaustedBanner({
  quota, onBuy,
}: {
  quota: AgentQuota;
  onBuy: () => void;
}) {
  const { currentPlan } = useSubscription();
  const isAgency = currentPlan.id === 'expert';

  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-500/5 overflow-hidden">
      <div className="flex items-start gap-4 p-5">
        <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center shrink-0">
          <Lock size={18} className="text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-white mb-1">
            🚫 Quota mensuel atteint — Agents en pause
          </p>
          <p className="text-xs text-slate-400 leading-relaxed mb-3">
            Vous avez utilisé vos{' '}
            <span className="text-red-300 font-bold">{quota.planLimit} sprints {isAgency ? 'Agence' : 'Pro'}</span>
            {' '}du mois de {quota.monthLabel}.
            Les agents reprennent automatiquement le 1er du mois prochain,
            ou vous pouvez recharger des crédits maintenant.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onBuy}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all"
            >
              <Zap size={12} /> Recharger des crédits
            </button>
            <span className="flex items-center gap-1.5 text-[11px] text-slate-500 px-3 py-2 rounded-xl border border-slate-700">
              <RefreshCw size={11} /> Réinitialisation le 1er {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main quota banner (always-visible usage strip) ───────────────────────────

interface AgentQuotaBannerProps {
  quota: AgentQuota;
  onPackPurchased: (sprints: number) => void;
}

export function AgentQuotaBanner({ quota, onPackPurchased }: AgentQuotaBannerProps) {
  const [showModal, setShowModal] = useState(false);
  const { currentPlan } = useSubscription();
  const pct = quota.planUsagePercent;
  const isNearLimit = pct >= 80 && !quota.isExhausted;

  const handleBuy = (pack: CreditPack) => {
    onPackPurchased(pack.sprints);
    toast.success(`✅ +${pack.sprints} crédits ajoutés — ${pack.label} activé !`, {
      description: 'Vos agents peuvent reprendre immédiatement.',
    });
  };

  return (
    <>
      {/* Usage strip */}
      <div className={cn(
        'rounded-2xl border p-4 space-y-3 transition-colors',
        quota.isExhausted
          ? 'border-red-500/30 bg-red-500/5'
          : isNearLimit
            ? 'border-amber-500/30 bg-amber-500/5'
            : 'border-slate-700/60 bg-slate-800/30',
      )}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Label */}
          <div className="flex items-center gap-2">
            <Sparkles size={14} className={textColor(pct)} />
            <span className="text-xs font-bold text-slate-300">
              Fair Use · {currentPlan.name} · {quota.monthLabel}
            </span>
          </div>

          {/* Count */}
          <div className="flex items-center gap-3">
            {quota.extraCredits > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/25 px-2 py-0.5 rounded-full">
                <Zap size={10} /> +{quota.extraCredits} bonus
              </span>
            )}
            <span className={cn('text-xs font-black tabular-nums', textColor(pct))}>
              {quota.used} / {quota.total} sprints
            </span>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-300 hover:text-indigo-100 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 px-2.5 py-1 rounded-lg transition-colors"
            >
              <ShoppingCart size={11} /> Recharger
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="w-full h-2 rounded-full bg-slate-700/60 overflow-hidden">
            {/* Plan usage */}
            <div
              className={cn('h-full rounded-full transition-all duration-700', barColor(pct))}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>
              {quota.remaining > 0
                ? `${quota.remaining} sprint${quota.remaining > 1 ? 's' : ''} restant${quota.remaining > 1 ? 's' : ''}`
                : 'Quota épuisé'}
            </span>
            <span>Limite : {quota.planLimit} / mois (plan {currentPlan.name})</span>
          </div>
        </div>

        {/* Warning at 80%+ */}
        {isNearLimit && (
          <div className="flex items-start gap-2 rounded-xl bg-amber-500/8 border border-amber-500/20 px-3 py-2">
            <AlertTriangle size={13} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-200 leading-relaxed">
              Vous approchez de votre limite mensuelle.
              Pensez à recharger des crédits pour ne pas interrompre vos agents.
            </p>
          </div>
        )}

        {/* Exhausted block */}
        {quota.isExhausted && (
          <ExhaustedBanner quota={quota} onBuy={() => setShowModal(true)} />
        )}
      </div>

      {/* Pack purchase modal */}
      {showModal && (
        <BuyPackModal
          onClose={() => setShowModal(false)}
          onBuy={handleBuy}
        />
      )}
    </>
  );
}
