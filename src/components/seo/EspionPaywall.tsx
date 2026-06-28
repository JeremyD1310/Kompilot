/**
 * EspionPaywall — Premium paywall when credits are exhausted.
 * Shows credit packs with pricing and upgrade CTA for Starter plans.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Zap, Crown, CreditCard, TrendingUp, Check, Loader2 } from 'lucide-react';
import { Button, toast } from '@blinkdotnew/ui';
import { blink } from '../../blink/client';

const BACKEND_URL = 'https://gbrhsehk.backend.blink.new';

interface EspionPaywallProps {
  plan: string; // 'starter' | 'agency' | 'pro' | 'expert'
  onRecharge?: (amount: number) => void;
  onUpgrade?: () => void;
}

async function createCreditPackCheckout(amount: number): Promise<string | null> {
  try {
    const token = await blink.auth.getValidToken();
    const res = await fetch(`${BACKEND_URL}/api/billing/credit-pack`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount }),
    });
    if (!res.ok) throw new Error('Checkout creation failed');
    const data = await res.json() as { url?: string };
    return data.url ?? null;
  } catch {
    return null;
  }
}

const CREDIT_PACKS = [
  { amount: 20, credits: 100, badge: null },
  { amount: 50, credits: 250, badge: null },
  { amount: 100, credits: 500, badge: null },
  { amount: 200, credits: 1250, badge: '-20%' },
  { amount: 500, credits: 3125, badge: '-20%' },
];

export function EspionPaywall({ plan, onRecharge, onUpgrade }: EspionPaywallProps) {
  const [customAmount, setCustomAmount] = useState('');
  const [loadingPack, setLoadingPack] = useState<number | null>(null);
  const isStarter = plan === 'starter' || plan === 'pro';

  const customCredits = customAmount ? Math.floor(Number(customAmount) / 0.2) : 0;

  const handlePackClick = async (amount: number) => {
    setLoadingPack(amount);
    try {
      const url = await createCreditPackCheckout(amount);
      if (url) {
        window.location.href = url;
      } else {
        // Fallback: call parent handler (legacy or demo mode)
        onRecharge?.(amount);
        toast.info(`Recharge de ${amount} € — mode démo`);
      }
    } catch {
      toast.error('Erreur lors de la création du checkout');
    } finally {
      setLoadingPack(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center mx-auto">
          <Lock size={28} className="text-amber-400" />
        </div>
        <h2 className="text-2xl font-black text-foreground">Crédits épuisés</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Chaque analyse de L'Espion consomme <strong className="text-foreground">1 crédit</strong> (0,20 € HT).
          Rechargez pour continuer à espionner vos concurrents.
        </p>
      </div>

      {/* Credit packs grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {CREDIT_PACKS.map((pack, i) => (
          <motion.button
            key={pack.amount}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.06 }}
            onClick={() => handlePackClick(pack.amount)}
            className={`relative rounded-xl border p-4 text-left transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 ${
              pack.badge
                ? 'border-primary/30 bg-primary/5'
                : 'border-border bg-card hover:bg-muted/20'
            }`}
          >
            {loadingPack === pack.amount && (
              <div className="absolute inset-0 bg-card/80 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
                <Loader2 size={20} className="animate-spin text-primary" />
              </div>
            )}
            {pack.badge && (
              <span className="absolute -top-2 -right-2 text-[10px] font-black bg-primary text-primary-foreground rounded-full px-2 py-0.5 shadow-sm">
                {pack.badge}
              </span>
            )}
            <p className="text-xl font-black text-foreground">{pack.amount} €</p>
            <p className="text-xs font-bold text-primary mt-1">{pack.credits} crédits</p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">
              {(pack.amount / pack.credits).toFixed(2)} €/crédit
            </p>
          </motion.button>
        ))}

        {/* Custom amount */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl border border-dashed border-border bg-card p-4 flex flex-col justify-between"
        >
          <div>
            <p className="text-xs font-bold text-muted-foreground mb-2">Montant libre</p>
            <div className="relative">
              <input
                type="number"
                value={customAmount}
                onChange={e => setCustomAmount(e.target.value)}
                placeholder="50"
                min="5"
                className="w-full h-10 rounded-lg border border-border bg-muted/30 px-3 pr-8 text-sm font-bold text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
            </div>
            {customCredits > 0 && (
              <p className="text-[10px] text-primary font-bold mt-1">= {customCredits} crédits</p>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={!customAmount || Number(customAmount) < 5}
            onClick={() => handlePackClick(Number(customAmount))}
            className="mt-2 h-8 text-xs"
          >
            Recharger
          </Button>
        </motion.div>
      </div>

      {/* Upgrade CTA for Starter plans */}
      {isStarter && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <Crown size={24} className="text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-foreground">Passez au plan Agency</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              149 €/mois — Inclut <strong className="text-foreground">100 recherches L'Espion</strong> + toutes les fonctionnalités Agence
            </p>
          </div>
          <Button
            onClick={() => onUpgrade?.()}
            className="h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs gap-2 shrink-0"
          >
            <TrendingUp size={14} />
            Passer au plan Agency
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
