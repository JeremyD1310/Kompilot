import { useState, useEffect } from 'react';
import { Card, Button, Badge, toast, Input } from '@blinkdotnew/ui';
import { TrendingUp, Sparkles, MapPin, Search, Send, Building2, Users, Clock, Zap } from 'lucide-react';

export default function GrowthHackingModule() {
  const [exitPopup, setExitPopup] = useState(false);
  const [fomoBanner, setFomoBanner] = useState(false);
  const [fomoText, setFomoText] = useState("🔥 Plus que 4 places disponibles pour le service de ce soir — Réservez maintenant !");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [expandedBiz, setExpandedBiz] = useState<string | null>(null);

  const businesses = [
    { id: 'b1', name: "Société BTP Lacroix", dist: "1.2km", staff: "45 salariés", pitch: "Propose une offre lunettes de sécurité personnalisée pour ses ouvriers." },
    { id: 'b2', name: "Restaurant Le Vieux Port", dist: "0.8km", staff: "12 salariés", pitch: "Formules déjeuner corporate pour fidéliser l'équipe après les bilans de vue." },
    { id: 'b3', name: "Pharmacie Centrale", dist: "0.4km", staff: "8 salariés", pitch: "Partenariat santé visuelle pour orienter les clients vers votre expertise." },
    { id: 'b4', name: "Hôtel Les Corsaires", dist: "1.7km", staff: "32 salariés", pitch: "Avantage collaborateurs : tarif préférentiel sur la gamme 'travail sur écran'." },
    { id: 'b5', name: "École Primaire Jean Moulin", dist: "0.6km", staff: "18 salariés", pitch: "Dépistage visuel enfants : journée de prévention organisée dans votre boutique." }
  ];

  const runSearch = () => {
    setSearching(true);
    setResults([]);
    setTimeout(() => {
      setSearching(false);
      setResults(businesses);
      toast.success('Recherche terminée !', { description: '5 prospects B2B ultra-locaux identifiés.' });
    }, 1500);
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Section A: Exit Intent Pop-up */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="text-2xl">🚪</span> Exit Intent Pop-up
        </h2>
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-bold">Activer le Pop-up d'Intention de Sortie</h3>
              <p className="text-xs text-muted-foreground">Se déclenche quand le visiteur s'apprête à quitter la page.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={exitPopup} onChange={() => setExitPopup(!exitPopup)} />
              <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
            </label>
          </div>

          <div className="p-4 bg-muted/30 rounded-xl border border-border border-dashed space-y-3">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Aperçu du message</p>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-border">
              <p className="text-sm font-medium">Attendez ! Ne partez pas les mains vides 👋 → <span className="text-primary font-bold">Profitez de -10% immédiats</span> sur votre première consultation</p>
            </div>
          </div>

          {exitPopup && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-lg animate-in zoom-in-95 duration-200">
              <TrendingUp size={16} className="text-emerald-500" />
              <p className="text-xs text-emerald-800 font-medium">72 visiteurs récupérés ce mois via ce pop-up</p>
            </div>
          )}
        </Card>
      </section>

      {/* Section B: FOMO Banner */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="text-2xl">🔥</span> FOMO Banner
        </h2>
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-bold">Activer la Bannière de Rareté (FOMO)</h3>
              <p className="text-xs text-muted-foreground">Crée un sentiment d'urgence pour accélérer la prise de décision.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={fomoBanner} onChange={() => setFomoBanner(!fomoBanner)} />
              <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
            </label>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Aperçu en direct</p>
            <div className="relative h-10 w-full overflow-hidden rounded-lg bg-gradient-to-r from-rose-600 to-rose-500 flex items-center px-4">
              <p className="text-[11px] text-white font-bold animate-pulse">{fomoText}</p>
              <div className="absolute right-2 top-1.5">
                <Badge className="bg-white/20 text-white border-none text-[8px] h-4">LIVE</Badge>
              </div>
            </div>
            <Input
              value={fomoText}
              onChange={(e) => setFomoText(e.target.value)}
              className="text-xs h-9"
              placeholder="Texte personnalisé de la bannière..."
            />
          </div>

          {fomoBanner && (
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center gap-3">
              <Sparkles size={16} className="text-primary" />
              <p className="text-xs text-primary font-bold">Bannière active sur votre site · 23% de conversions supplémentaires</p>
            </div>
          )}
        </Card>
      </section>

      {/* Section C: Scraping Éthique Local */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="text-2xl">🔍</span> Trouver des clients B2B (&lt; 2km)
        </h2>
        <Card className="p-6 space-y-6">
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground max-w-md mx-auto">Kompilot analyse les entreprises autour de votre point de vente pour identifier des opportunités de partenariats ou de contrats collectifs.</p>
            <Button
              className="gap-2 h-11 px-8 rounded-full shadow-lg shadow-primary/20"
              onClick={runSearch}
              disabled={searching}
            >
              {searching ? <Zap size={18} className="animate-spin" /> : <MapPin size={18} />}
              {searching ? 'Analyse du quartier...' : 'Lancer la recherche IA'}
            </Button>
          </div>

          {results.length > 0 && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {results.map((biz) => (
                <Card key={biz.id} className="overflow-hidden border-border/50 hover:border-primary/40 transition-colors">
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold">{biz.name}</h3>
                        <div className="flex gap-3 mt-1">
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium bg-muted px-1.5 py-0.5 rounded">
                            <MapPin size={10} /> {biz.dist}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium bg-muted px-1.5 py-0.5 rounded">
                            <Users size={10} /> {biz.staff}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm" variant="outline" className="text-[11px] h-8 gap-2"
                      onClick={() => setExpandedBiz(expandedBiz === biz.id ? null : biz.id)}
                    >
                      <Send size={12} /> Prospecter
                    </Button>
                  </div>
                  {expandedBiz === biz.id && (
                    <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="bg-primary/5 p-4 rounded-lg border border-primary/10 space-y-3">
                        <div className="flex items-center gap-2">
                          <Sparkles size={14} className="text-primary" />
                          <span className="text-xs font-bold text-primary">Approche IA suggérée :</span>
                        </div>
                        <p className="text-xs italic text-foreground leading-relaxed">"{biz.pitch}"</p>
                        <Button size="sm" className="w-full gap-2 text-xs h-8" onClick={() => {
                          toast.success('Message envoyé au responsable !');
                          setExpandedBiz(null);
                        }}>
                          Envoyer un message personnalisé
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
