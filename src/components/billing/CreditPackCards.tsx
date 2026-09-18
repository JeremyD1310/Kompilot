/**
 * CreditPackCards — Three purchase cards for credit packs.
 * Calls /api/billing/credit-packs and redirects to Stripe checkout.
 */

import { useState } from 'react';
import { Card, CardContent, Button, Badge, toast } from '@blinkdotnew/ui';
import { Zap, Loader2, Crown, Star } from 'lucide-react';
import { createOneTimeCheckout } from '../../lib/billingClient';
import { ONE_TIME_PRODUCTS, type PricingProductId } from '../../../shared/pricingCatalog';
import { LegalConsentBlock, isLegalConsentValid, type LegalConsentState, CGV_VERSION } from '../subscription/LegalConsentBlock';

type TopupProductId = Extract<PricingProductId,
  | 'kompilot_ai_250_once' | 'kompilot_ai_750_once' | 'kompilot_ai_2000_once'
  | 'kompilot_sms_100_once' | 'kompilot_sms_500_once' | 'kompilot_sms_1500_once'>;

interface PackOption {
  id: TopupProductId;
  name: string;
  credits: number;
  creditType: 'ai' | 'sms';
  price: number;
  priceLabel: string;
  perCredit: string;
  highlighted?: boolean;
  badgeLabel?: string;
}

const isTopupProduct = (product: (typeof ONE_TIME_PRODUCTS)[number]): product is (typeof ONE_TIME_PRODUCTS)[number] & { id: TopupProductId; creditType: 'ai' | 'sms' } =>
  product.productType === 'topup' && (product.creditType === 'ai' || product.creditType === 'sms');

const PACKS: PackOption[] = ONE_TIME_PRODUCTS.filter(isTopupProduct).map((product, index) => ({
  id: product.id, creditType: product.creditType, name: product.name.replace(' crédits IA', '').replace(' SMS', ''), credits: product.creditAmount ?? 0,
  price: product.amountEurHt ?? 0, priceLabel: `${product.amountEurHt ?? 0} €`, perCredit: `${((product.amountEurHt ?? 0) / (product.creditAmount ?? 1)).toFixed(2).replace('.', ',')} € / unité`,
  highlighted: index === 1, badgeLabel: index === 1 ? 'Meilleure valeur' : undefined,
}));

export function CreditPackCards() {
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [consent, setConsent] = useState<LegalConsentState>({ cgvAccepted: false, retractionWaived: false });

  const handlePurchase = async (pack: PackOption) => {
    if (!isLegalConsentValid(consent)) return;
    setPurchasingId(pack.id);
    try {
      const result = await createOneTimeCheckout(pack.id, { ...consent, cgvVersion: CGV_VERSION, acceptedAt: new Date().toISOString(), userAgent: navigator.userAgent });
      if (!result.url) throw new Error(result.error || 'Erreur lors de la création du paiement');
      const paymentWindow = window.open(result.url, '_blank', 'noopener,noreferrer');
      if (!paymentWindow) throw new Error('Autorisez les fenêtres pop-up puis réessayez.');
      toast.success('Redirection vers Stripe…', { description: 'Le paiement s’effectue dans un nouvel onglet.' });
    } catch (err: unknown) {
      toast.error('Paiement indisponible', { description: err instanceof Error ? err.message : 'Une erreur est survenue' });
    } finally {
      setPurchasingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <LegalConsentBlock state={consent} onChange={setConsent} disabled={Boolean(purchasingId)} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PACKS.map((pack) => {
          const isPurchasing = purchasingId === pack.id;
          return (
            <Card
              key={pack.id}
              className={`card-hover relative overflow-hidden ${
                pack.highlighted
                  ? 'border-primary/40 shadow-md'
                  : ''
              }`}
            >
              {pack.highlighted && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary" />
              )}
              <CardContent className="pt-6 pb-5 flex flex-col items-center text-center">
                {pack.badgeLabel && (
                  <Badge className="mb-3 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
                    <Crown size={12} className="mr-1" />
                    {pack.badgeLabel}
                  </Badge>
                )}
                {!pack.badgeLabel && <div className="h-7 mb-3" />}

                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <Zap size={22} className="text-primary" />
                </div>

                <h3 className="text-base font-bold text-foreground mb-1">{pack.name}</h3>

                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-black text-foreground">+{pack.credits}</span>
                  <span className="text-sm text-muted-foreground font-medium">{pack.creditType === 'sms' ? 'SMS' : 'crédits'}</span>
                </div>

                <p className="text-xs text-muted-foreground mb-4">{pack.perCredit}</p>

                <div className="w-full pt-4 border-t border-border">
                  <p className="text-xl font-black text-primary mb-3">{pack.priceLabel}</p>
                  <Button
                    onClick={() => handlePurchase(pack)}
                    disabled={isPurchasing}
                    className={`w-full font-bold ${
                      pack.highlighted
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : ''
                    }`}
                    variant={pack.highlighted ? 'default' : 'outline'}
                  >
                    {isPurchasing ? (
                      <>
                        <Loader2 size={14} className="mr-2 animate-spin" />
                        Redirection…
                      </>
                    ) : (
                      <>
                        <Star size={14} className="mr-2" />
                        Acheter
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
