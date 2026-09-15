/**
 * EspionPaywall — canonical AI credit top-ups only.
 * The browser sends a catalog product reference; the backend owns price lookup.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Crown, TrendingUp, Loader2 } from 'lucide-react';
import { Button, toast } from '@blinkdotnew/ui';
import { createOneTimeCheckout } from '../../lib/billingClient';
import { ONE_TIME_PRODUCTS, type PricingProductId } from '../../../shared/pricingCatalog';
import { useDemoMode } from '../../context/DemoModeContext';

interface EspionPaywallProps {
  plan: string;
  onUpgrade?: () => void;
}

const AI_TOP_UPS = ONE_TIME_PRODUCTS.filter((product) => product.productType === 'topup' && product.creditType === 'ai');
const CGV_VERSION = 'CGV_V1.0_2026-06';

export function EspionPaywall({ plan, onUpgrade }: EspionPaywallProps) {
  const [loadingPack, setLoadingPack] = useState<PricingProductId | null>(null);
  const { isDemoActive } = useDemoMode();
  const isStarter = plan === 'pro';

  const handlePackClick = async (productId: PricingProductId) => {
    if (isDemoActive) {
      toast.info('Les paiements sont désactivés dans la démo.');
      return;
    }
    setLoadingPack(productId);
    try {
      const result = await createOneTimeCheckout(productId as Exclude<PricingProductId, 'starter' | 'agency' | 'enterprise'>, {
        cgvAccepted: true,
        retractionWaived: true,
        cgvVersion: CGV_VERSION,
        acceptedAt: new Date().toISOString(),
      });
      if (!result.url) throw new Error(result.error || 'Checkout indisponible');
      window.open(result.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création du checkout');
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

      {/* Canonical AI credit packs — no custom amounts or browser-side pricing */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {AI_TOP_UPS.map((pack, i) => (
          <motion.button
            key={pack.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.06 }}
            onClick={() => handlePackClick(pack.id)}
            disabled={loadingPack !== null || isDemoActive}
            className="relative rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingPack === pack.id && (
              <div className="absolute inset-0 bg-card/80 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
                <Loader2 size={20} className="animate-spin text-primary" />
              </div>
            )}
            <p className="text-xl font-black text-foreground">{pack.amountEurHt} € HT</p>
            <p className="text-xs font-bold text-primary mt-1">{pack.creditAmount} crédits IA</p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">Paiement ponctuel · valable 12 mois</p>
          </motion.button>
        ))}
      </div>
      {isDemoActive && (
        <p className="text-center text-xs font-medium text-muted-foreground">Le paiement est indisponible pendant la démonstration.</p>
      )}

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
