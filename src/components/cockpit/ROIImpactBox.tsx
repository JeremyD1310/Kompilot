import { useState } from 'react';
import { cn } from '../../lib/utils';

interface ROIImpactBoxProps {
  format: string;
  isCarousel: boolean;
  category: string;
}

const DISCOUNT_OPTIONS = ['5%', '10%', '15%'];

export function ROIImpactBox({ format, isCarousel, category }: ROIImpactBoxProps) {
  const [showFlash, setShowFlash] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<string | null>(null);
  const [customDiscount, setCustomDiscount] = useState('');

  const formatLabel = isCarousel ? 'Carrousel' : format === 'reel' ? 'Reel' : format === 'story' ? 'Story' : 'Post';

  const AVG_BASKET: Record<string, number> = {
    Restaurant: 35, Coiffeur: 55, Boulangerie: 18, Spa: 80, Fleuriste: 45, default: 40,
  };
  const basket = AVG_BASKET[category] ?? AVG_BASKET.default;
  const low = Math.round(basket * 4);
  const high = Math.round(basket * 9);

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 space-y-2">
      <div className="flex items-start gap-2">
        <span className="text-lg">🎯</span>
        <div>
          <p className="text-xs font-bold text-emerald-900">Impact business estimé</p>
          <p className="text-[11px] text-emerald-800 leading-relaxed">
            Ce format ({formatLabel}) publié à l'heure optimale peut générer entre{' '}
            <span className="font-bold text-emerald-700">+{low}€ et +{high}€</span>{' '}
            de chiffre d'affaires direct basé sur votre panier moyen.
          </p>
        </div>
      </div>

      <div>
        <button
          onClick={() => setShowFlash(v => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 px-3 py-1.5 text-[11px] font-bold hover:bg-amber-100 transition-colors w-full justify-center"
        >
          ⚡ Associer une Offre Flash
        </button>

        {showFlash && (
          <div className="mt-2 space-y-2">
            <p className="text-[10px] text-muted-foreground">Appliquer une remise de :</p>
            <div className="flex gap-2 flex-wrap">
              {DISCOUNT_OPTIONS.map(d => (
                <button
                  key={d}
                  onClick={() => setSelectedDiscount(d)}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-xs font-bold transition-all',
                    selectedDiscount === d
                      ? 'border-amber-500 bg-amber-500 text-white'
                      : 'border-border text-muted-foreground hover:border-amber-400 hover:bg-amber-50'
                  )}
                >
                  {d}
                </button>
              ))}
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="Personnalisée"
                  value={customDiscount}
                  onChange={e => { setCustomDiscount(e.target.value); setSelectedDiscount(null); }}
                  className="w-24 rounded-lg border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>
            </div>
            {(selectedDiscount || customDiscount) && (
              <p className="text-[10px] text-emerald-700 font-medium">
                ✅ L'IA intégrera le CTA avec remise de{' '}
                <strong>{selectedDiscount || customDiscount}</strong> et un code promo automatique dans la légende.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
