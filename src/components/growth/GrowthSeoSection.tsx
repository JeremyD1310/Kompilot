/**
 * GrowthSeoSection — SEO Local & Google Maps
 * Extracted from GrowthPage.tsx for size compliance.
 */
import { useState } from 'react';
import { Button, toast } from '@blinkdotnew/ui';
import { Search, Copy } from 'lucide-react';

const Spinner = () => (
  <div className="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
);

function GeneratedBox({ text, onCopy }: { text: string; onCopy?: () => void }) {
  return (
    <div className="relative">
      <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed">{text}</div>
      {onCopy && (
        <button onClick={onCopy} className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-primary hover:opacity-80 transition-opacity">
          <Copy size={12} /> Copier
        </button>
      )}
    </div>
  );
}

export function GrowthSeoSection({ name, city, activity, bookingUrl }: {
  name: string; city: string; activity: string; bookingUrl: string;
}) {
  const [scanning, setScanning] = useState(false);
  const [scanDone, setScanDone] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [isGeneratingKeywords, setIsGeneratingKeywords] = useState(false);
  const [seoDesc, setSeoDesc] = useState('');
  const [isGeneratingSeoDesc, setIsGeneratingSeoDesc] = useState(false);
  const [competitor, setCompetitor] = useState('');
  const [counterStrategy, setCounterStrategy] = useState('');
  const [isGeneratingCounter, setIsGeneratingCounter] = useState(false);

  const handleScan = () => {
    setScanning(true); setScanProgress(0);
    const step = setInterval(() => setScanProgress(p => Math.min(p + 4, 100)), 120);
    setTimeout(() => { clearInterval(step); setScanProgress(100); setScanning(false); setScanDone(true); }, 3000);
  };

  const handleKeywords = async () => {
    setIsGeneratingKeywords(true);
    await new Promise(r => setTimeout(r, 1500));
    setKeywords([`${activity} artisanale ${city}`, `Livraison ${activity.toLowerCase()} ${city}`, `${activity} maison ${city}`, `${activity} artisanale bio`, `Meilleure ${activity.toLowerCase()} ${city}`]);
    setIsGeneratingKeywords(false);
  };

  const handleSeoDesc = async () => {
    setIsGeneratingSeoDesc(true);
    await new Promise(r => setTimeout(r, 1500));
    setSeoDesc(`Bienvenue chez ${name}, votre ${activity.toLowerCase()} artisanale de référence à ${city} ! Nous vous proposons une sélection de produits faits maison avec des ingrédients locaux et de saison. Découvrez nos spécialités, réservez en ligne : ${bookingUrl}`);
    setIsGeneratingSeoDesc(false);
  };

  const handleCounter = async () => {
    if (!competitor.trim()) { toast.error('Entrez le nom d\'un concurrent.'); return; }
    setIsGeneratingCounter(true);
    await new Promise(r => setTimeout(r, 1500));
    setCounterStrategy(`📣 Pourquoi choisir ${name} plutôt que ${competitor} ?\n\n✅ Produits 100 % artisanaux fabriqués sur place\n✅ Ingrédients locaux & de saison\n✅ Réservation en ligne simple et rapide\n\nVenez découvrir la différence ! 👉 ${bookingUrl}`);
    setIsGeneratingCounter(false);
    toast.success('🕵️ Contre-stratégie générée !');
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
        <Search size={18} className="text-primary" /> SEO Local &amp; Google Maps
      </h2>
      {!scanDone ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Analysez votre fiche Google pour détecter les axes d'amélioration.</p>
          <Button onClick={handleScan} disabled={scanning} className="gap-2">
            {scanning ? <Spinner /> : '🔍'} Scanner ma Fiche Google
          </Button>
          {scanning && (
            <div className="space-y-1">
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-100" style={{ width: `${scanProgress}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">Analyse en cours… {scanProgress}%</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-5 p-4 rounded-xl bg-primary/5 border border-primary/20">
            <div className="relative w-16 h-16 shrink-0">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="22" fill="none" stroke="currentColor" strokeWidth="5" className="text-muted/30" />
                <circle cx="28" cy="28" r="22" fill="none" stroke="currentColor" strokeWidth="5" strokeDasharray="138.2" strokeDashoffset="38.7" strokeLinecap="round" className="text-primary" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold text-primary">72%</span>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Score de visibilité locale</p>
              <p className="text-xs text-muted-foreground mt-0.5">3 axes d'amélioration détectés</p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Optimiseur de mots-clés 🏷️</p>
            <Button variant="outline" size="sm" onClick={handleKeywords} disabled={isGeneratingKeywords} className="gap-2">
              {isGeneratingKeywords ? <Spinner /> : null} Générer mes mots-clés manquants
            </Button>
            {keywords.length > 0 && (
              <ul className="space-y-1 pt-1">
                {keywords.map((kw, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" /> {kw}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Générateur de description SEO 📝</p>
            <Button variant="outline" size="sm" onClick={handleSeoDesc} disabled={isGeneratingSeoDesc} className="gap-2">
              {isGeneratingSeoDesc ? <Spinner /> : null} Générer ma description Google Maps
            </Button>
            {seoDesc && <GeneratedBox text={seoDesc} onCopy={() => { navigator.clipboard.writeText(seoDesc); toast.success('Description copiée !'); }} />}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Analyser un concurrent 🕵️‍♂️</p>
            <div className="flex gap-2">
              <input value={competitor} onChange={e => setCompetitor(e.target.value)} placeholder="Nom du commerce concurrent..."
                className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <Button size="sm" onClick={handleCounter} disabled={isGeneratingCounter} className="gap-2 shrink-0">
                {isGeneratingCounter ? <Spinner /> : null} Contre-Stratégie
              </Button>
            </div>
            {counterStrategy && <GeneratedBox text={counterStrategy} onCopy={() => { navigator.clipboard.writeText(counterStrategy); toast.success('Copié !'); }} />}
          </div>
        </div>
      )}
    </div>
  );
}
