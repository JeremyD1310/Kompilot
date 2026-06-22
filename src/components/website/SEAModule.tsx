import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, toast } from '@blinkdotnew/ui';
import { Sparkles, TrendingUp, Target, Search, AlertTriangle, Check } from 'lucide-react';

export default function SEAModule() {
  const [budget, setBudget] = useState(150);
  const [showAd, setShowAd] = useState(false);
  const [pixelActive, setPixelActive] = useState(false);

  return (
    <div className="space-y-8 pb-10">
      {/* Section A: Google Ads en 2 clics */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="text-2xl">🚀</span> Google Ads en 2 clics
        </h2>
        <Card className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-foreground">Budget mensuel : <span className="text-primary font-bold">{budget}€/mois</span></label>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Investissement recommandé</span>
            </div>
            <input
              type="range" min="50" max="500" step="10"
              value={budget} onChange={(e) => setBudget(parseInt(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="grid grid-cols-3 gap-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground uppercase mb-1">Reach estimé</p>
                <p className="text-sm font-bold text-primary">~{Math.round(budget * 16)} impressions/j</p>
              </div>
              <div className="text-center border-x border-primary/10">
                <p className="text-[10px] text-muted-foreground uppercase mb-1">Trafic estimé</p>
                <p className="text-sm font-bold text-primary">~{Math.round(budget * 0.32)} clics/jour</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground uppercase mb-1">ROI estimé</p>
                <p className="text-sm font-bold text-emerald-600">×4.2</p>
              </div>
            </div>
          </div>

          <Button className="w-full gap-2 py-6 text-base shadow-lg shadow-primary/20" onClick={() => setShowAd(true)}>
            <Sparkles size={18} /> Générer mon annonce IA
          </Button>

          {showAd && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
              <p className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                <Target size={14} className="text-primary" /> Aperçu de votre annonce Google
              </p>
              <div className="border border-border/50 rounded-lg p-4 bg-white shadow-sm max-w-xl">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-bold text-foreground bg-gray-100 px-1 rounded">Sponsorisé</span>
                  <span className="text-[10px] text-gray-500">https://votre-site.fr</span>
                </div>
                <h3 className="text-blue-700 text-lg font-medium hover:underline cursor-pointer mb-0.5">
                  Opticien Expert à La Rochelle | Bilan de Vue Offert
                </h3>
                <h4 className="text-blue-700 text-lg font-medium hover:underline cursor-pointer mb-1.5">
                  Montures Créateurs · RDV en 2 min · Sans Attente
                </h4>
                <p className="text-gray-600 text-xs leading-relaxed">
                  Votre optique de quartier depuis 12 ans. Prise en charge mutuelle 100%. Réservez votre créneau maintenant →
                </p>
              </div>
            </div>
          )}
        </Card>
      </section>

      {/* Section B: Retargeting (Pixel & Tag) */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="text-2xl">🔄</span> Retargeting (Pixel & Tag)
        </h2>
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-bold">Activer le Pixel de Reciblage</h3>
              <p className="text-xs text-muted-foreground">Reprenez contact avec vos visiteurs perdus.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={pixelActive} onChange={() => setPixelActive(!pixelActive)} />
              <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
            </label>
          </div>

          {pixelActive ? (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3 animate-in zoom-in-95 duration-200">
              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                <Check size={14} className="text-white" />
              </div>
              <div className="space-y-1">
                <Badge className="bg-emerald-500 text-white border-none text-[10px]">Pixel actif</Badge>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Votre pixel suit désormais <span className="font-bold">147 visiteurs</span>. Les publicités Kompilot seront diffusées uniquement aux personnes ayant visité votre site sans réserver au cours des 7 derniers jours.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-muted/50 border border-dashed border-border rounded-xl flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                <TrendingUp size={14} className="text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Diffusez des publicités ciblées uniquement aux personnes qui ont visité votre site sans réserver au cours des 7 derniers jours. <span className="text-foreground font-bold">Économisez 60% de budget publicitaire.</span>
              </p>
            </div>
          )}
        </Card>
      </section>

      {/* Section C: A/B Testing IA */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="text-2xl">📊</span> Optimisation automatique
        </h2>
        <Card className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/30 space-y-3 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50">Variante A</Badge>
                <Badge className="bg-rose-500 text-white border-none text-[10px]">En retrait</Badge>
              </div>
              <Button size="sm" variant="outline" className="bg-white border-rose-200">Réserver</Button>
              <div className="flex gap-4 pt-2">
                <div><p className="text-[10px] text-muted-foreground">Clics</p><p className="font-bold text-sm">32</p></div>
                <div><p className="text-[10px] text-muted-foreground">CTR</p><p className="font-bold text-sm">2.1%</p></div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-3 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">Variante B</Badge>
                <Badge className="bg-emerald-500 text-white border-none text-[10px]">🏆 Gagnante</Badge>
              </div>
              <Button size="sm" variant="default" className="bg-emerald-600 border-none">Prendre RDV en 2 min</Button>
              <div className="flex gap-4 pt-2">
                <div><p className="text-[10px] text-muted-foreground">Clics</p><p className="font-bold text-sm">51</p></div>
                <div><p className="text-[10px] text-muted-foreground">CTR</p><p className="font-bold text-sm">3.4%</p></div>
              </div>
              <div className="absolute top-0 right-0 p-2 opacity-5">
                <Sparkles size={80} />
              </div>
            </div>
          </div>

          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center gap-3">
            <Sparkles size={16} className="text-indigo-600 shrink-0" />
            <p className="text-xs text-indigo-800">
              <span className="font-bold">L'intelligence artificielle</span> a détecté que la Variante B convertit 15% de plus — 100% du budget publicitaire a été basculé dessus.
            </p>
          </div>
        </Card>
      </section>
    </div>
  );
}
