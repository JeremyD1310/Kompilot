/**
 * CreditPackCards — Three purchase cards for credit packs.
 * Calls /api/billing/credit-packs and redirects to Stripe checkout.
 */

import { useState } from 'react';
import { Card, CardContent, Button, Badge, toast } from '@blinkdotnew/ui';
import { Zap, Loader2, Crown, Star } from 'lucide-react';
import { createContentPackCheckout } from '../../lib/billingClient';

interface PackOption {
  id: 'small' | 'medium' | 'large';
  name: string;
  credits: number;
  price: number;
  priceLabel: string;
  perCredit: string;
  highlighted?: boolean;
  badgeLabel?: string;
}

const PACKS: PackOption[] = [
  { id: 'small', name: 'Small', credits: 15, price: 4.99, priceLabel: '4,99 €', perCredit: '0,33 € / crédit' },
  { id: 'medium', name: 'Medium', credits: 30, price: 7.99, priceLabel: '7,99 €', perCredit: '0,27 € / crédit' },
  { id: 'large', name: 'Large', credits: 80, price: 14.99, priceLabel: '14,99 €', perCredit: '0,19 € / crédit', highlighted: true, badgeLabel: 'Meilleure valeur' },
];

export function CreditPackCards() {
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const handlePurchase = async (pack: PackOption) => {
    setPurchasingId(pack.id);
    try {
      const result = await createContentPackCheckout(pack.id);
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
                <span className="text-sm text-muted-foreground font-medium">crédits</span>
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
  );
}
