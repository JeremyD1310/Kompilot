/**
 * GrowthSeaSection — Propulseur SEA (Publicité Locale)
 * Extracted from GrowthPage.tsx for size compliance.
 */
import { useState } from 'react';
import { Button, toast } from '@blinkdotnew/ui';
import { TrendingUp, Copy } from 'lucide-react';

const Spinner = () => (
  <div className="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
);

export function GrowthSeaSection({ name, bookingUrl }: { name: string; bookingUrl: string }) {
  const [adZone, setAdZone] = useState<'2km' | '5km' | '10km'>('5km');
  const [adBudget, setAdBudget] = useState(10);
  const [generatedAd, setGeneratedAd] = useState<{ title: string; text: string } | null>(null);
  const [isGeneratingAd, setIsGeneratingAd] = useState(false);

  const reservations = Math.round(adBudget * 0.8);
  const revenue      = reservations * 45;

  const zones: { value: '2km' | '5km' | '10km'; label: string }[] = [
    { value: '2km', label: '📍 Rayon de 2 km' },
    { value: '5km', label: '📍 Rayon de 5 km' },
    { value: '10km', label: '📍 Rayon de 10 km' },
  ];

  const handleGenerateAd = async () => {
    setIsGeneratingAd(true);
    await new Promise(r => setTimeout(r, 2000));
    setGeneratedAd({
      title: `${name.slice(0, 25)} — Réservez maintenant !`,
      text: `Découvrez ${name}, l'adresse incontournable près de chez vous. Réservation en ligne rapide. → ${bookingUrl}`,
    });
    setIsGeneratingAd(false);
    toast.success('🎯 Annonce générée ! Prête à lancer sur Google Ads ou Facebook Ads.');
  };

  const adText = generatedAd ? `Titre : ${generatedAd.title}\nTexte : ${generatedAd.text}` : '';

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
        <TrendingUp size={18} className="text-primary" /> Propulseur SEA (Publicité Locale)
      </h2>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Étape 1 — Zone géographique</p>
        <div className="flex flex-wrap gap-2">
          {zones.map(z => (
            <button key={z.value} onClick={() => setAdZone(z.value)}
              className={`rounded-xl border px-4 py-2 text-xs font-semibold transition-all ${
                adZone === z.value ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-foreground hover:border-primary/50'
              }`}>
              {z.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Étape 2 — Budget quotidien</p>
        <div className="space-y-2">
          <p className="text-sm font-bold text-foreground">Budget : {adBudget}€ / jour</p>
          <input type="range" min={5} max={20} step={1} value={adBudget}
            onChange={e => setAdBudget(Number(e.target.value))} className="w-full accent-primary" />
          <div className="flex justify-between text-xs text-muted-foreground"><span>5€</span><span>20€</span></div>
        </div>
        <div className="rounded-xl bg-primary/10 border border-primary/20 px-4 py-3">
          <p className="text-xs font-bold text-primary">
            📊 Estimation : ~{reservations} réservations/semaine · CA potentiel ~{revenue}€/semaine
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Étape 3 — Générer l'annonce</p>
        <Button onClick={handleGenerateAd} disabled={isGeneratingAd} className="gap-2">
          {isGeneratingAd ? <Spinner /> : '🎯'} Générer l'Annonce Sponsorisée
        </Button>
        {generatedAd && (
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
            <p className="text-sm"><span className="font-bold">Titre :</span> {generatedAd.title}</p>
            <p className="text-sm"><span className="font-bold">Texte :</span> {generatedAd.text}</p>
            <button onClick={() => { navigator.clipboard.writeText(adText); toast.success('Annonce copiée !'); }}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:opacity-80 transition-opacity mt-1">
              <Copy size={12} /> Copier l'annonce
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
