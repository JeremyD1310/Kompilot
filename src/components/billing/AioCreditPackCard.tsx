import { motion } from 'framer-motion';
import { Check, Loader2, Zap } from 'lucide-react';
import { toast } from '@blinkdotnew/ui';
import { useAioCreditPack, type AioCreditPack } from '../../hooks/useAioCreditPack';

interface AioCreditPackCardProps {
  compact?: boolean;
  onPurchaseStarted?: () => void;
}

function OfferDetails({ pack }: { pack: AioCreditPack }) {
  return (
    <>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-black text-foreground">+{pack.creditAmount.toLocaleString('fr-FR')}</span>
        <span className="text-sm font-medium text-muted-foreground">crédits IA</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{pack.description}</p>
    </>
  );
}

export function AioCreditPackCard({ compact = false, onPurchaseStarted }: AioCreditPackCardProps) {
  const { packs, purchase, purchasing, purchasingProductId, error } = useAioCreditPack();

  const handlePurchase = async (pack: AioCreditPack) => {
    const result = await purchase(pack.productId);
    if (result.url) {
      toast.success('Redirection vers Stripe…', { description: 'Le paiement s’effectue dans un nouvel onglet.' });
      onPurchaseStarted?.();
    } else if (result.error) {
      toast.error(result.error);
    }
  };

  if (compact) {
    const featured = packs[1];
    const isPurchasing = purchasingProductId === featured.productId;
    return (
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-primary/20 bg-primary/5 px-5 py-4">
        <div className="min-w-[200px] flex-1">
          <p className="font-bold text-foreground">{featured.label}</p>
          <p className="text-xs text-muted-foreground">{featured.creditAmount.toLocaleString('fr-FR')} crédits IA · achat unique</p>
        </div>
        <div className="text-right">
          <p className="mb-1 text-lg font-black text-primary">{featured.priceHT} € HT</p>
          <button
            type="button"
            onClick={() => void handlePurchase(featured)}
            disabled={purchasing}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPurchasing ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
            {isPurchasing ? 'Redirection…' : 'Recharger'}
          </button>
        </div>
        {error && <p className="basis-full text-center text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      aria-labelledby="aio-credit-pack-title"
      className="overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-lg"
    >
      <div className="border-b border-border bg-primary/5 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Zap size={19} /></div>
          <div>
            <h3 id="aio-credit-pack-title" className="font-extrabold text-foreground">Recharges IA</h3>
            <p className="text-xs text-muted-foreground">Crédits génériques, valables 12 mois</p>
          </div>
        </div>
      </div>
      <div className="grid gap-3 p-5 md:grid-cols-3">
        {packs.map((pack) => {
          const isPurchasing = purchasingProductId === pack.productId;
          const isFeatured = pack.productId === 'kompilot_ai_750_once';
          return (
            <article key={pack.productId} className={`flex flex-col rounded-xl border p-4 ${isFeatured ? 'border-primary/50 bg-primary/5 shadow-sm' : 'border-border bg-background/50'}`}>
              <OfferDetails pack={pack} />
              <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
                <div>
                  <p className="font-black text-primary">{pack.priceHT} € <span className="text-[10px] font-semibold text-muted-foreground">HT</span></p>
                  <p className="text-[11px] text-muted-foreground">{pack.priceTTC.toFixed(2)} € TTC</p>
                </div>
                <button
                  type="button"
                  onClick={() => void handlePurchase(pack)}
                  disabled={purchasing}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPurchasing ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
                  {isPurchasing ? '…' : 'Acheter'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
      <div className="flex items-center gap-2 border-t border-border px-6 py-4 text-xs text-muted-foreground">
        <Check size={14} className="shrink-0 text-primary" /> Aucun quota Luma ou SerpApi séparé
      </div>
      {error && <p className="px-6 pb-4 text-center text-xs text-destructive">{error}</p>}
    </motion.section>
  );
}
