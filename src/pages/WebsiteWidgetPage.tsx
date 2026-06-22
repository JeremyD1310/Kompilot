import { useState } from 'react';
import { Page, PageHeader, PageTitle, PageDescription, PageBody, Button, Badge, Tabs, TabsList, TabsTrigger, TabsContent, Card, toast } from '@blinkdotnew/ui';
import { Globe, Star, Copy, Check, ChevronLeft, ChevronRight, Code2, Sparkles, RefreshCw, Settings2, BarChart2, Search, Send, Target, Zap, Shield } from 'lucide-react';

import ConversionDashboard from '../components/website/ConversionDashboard';
import SEOModule from '../components/website/SEOModule';
import SEAModule from '../components/website/SEAModule';
import LeadGenModule from '../components/website/LeadGenModule';
import GrowthHackingModule from '../components/website/GrowthHackingModule';
import { TrustCitationsBadge } from '../components/website/TrustCitationsBadge';

const MOCK_REVIEWS = [
  { id: 1, name: 'Sophie L.', avatar: 'SL', rating: 5, text: "Une expérience absolument parfaite ! L'équipe est accueillante, les plats délicieux et le cadre magnifique.", date: 'Il y a 3 jours', source: 'Google' },
  { id: 2, name: 'Marc D.', avatar: 'MD', rating: 5, text: "Excellent rapport qualité/prix. Les produits sont frais et savoureux. Le service est rapide et souriant.", date: 'Il y a 1 semaine', source: 'Google' },
  { id: 3, name: 'Isabelle T.', avatar: 'IT', rating: 5, text: "Accueil chaleureux, produits de qualité. Exactement ce qu'on cherchait pour notre déjeuner d'équipe.", date: 'Il y a 2 semaines', source: 'Google' },
  { id: 4, name: 'Thomas R.', avatar: 'TR', rating: 5, text: "Coup de cœur total ! Le cadre est intime, la cuisine créative et les prix très raisonnables.", date: 'Il y a 3 semaines', source: 'Google' },
  { id: 5, name: 'Camille B.', avatar: 'CB', rating: 5, text: "Réservation facile, service impeccable et une cuisine qui sort de l'ordinaire.", date: 'Il y a 1 mois', source: 'Google' },
];

const WIDGET_THEMES = [
  { id: 'light', label: 'Clair', bg: '#ffffff', text: '#1e293b', card: '#f8fafc', star: '#f59e0b' },
  { id: 'dark', label: 'Sombre', bg: '#0f172a', text: '#f1f5f9', card: '#1e293b', star: '#fbbf24' },
  { id: 'teal', label: 'Teal', bg: '#f0fdfa', text: '#0f172a', card: '#ffffff', star: '#0d9488' },
  { id: 'minimal', label: 'Minimal', bg: '#fafafa', text: '#18181b', card: '#ffffff', star: '#6366f1' },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star key={i} size={12} className={i < rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />
      ))}
    </div>
  );
}

function ReviewCarousel({ theme }: { theme: typeof WIDGET_THEMES[0] }) {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const goTo = (idx: number) => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => { setCurrent(idx); setAnimating(false); }, 200);
  };
  const prev = () => goTo((current - 1 + MOCK_REVIEWS.length) % MOCK_REVIEWS.length);
  const next = () => goTo((current + 1) % MOCK_REVIEWS.length);
  const review = MOCK_REVIEWS[current];
  return (
    <div className="rounded-2xl p-5 shadow-lg border border-border/20 w-full select-none" style={{ backgroundColor: theme.bg, color: theme.text }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest opacity-60">Ils parlent de nous</p>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => <Star key={i} size={14} className="fill-amber-400 text-amber-400" />)}
            </div>
            <span className="text-lg font-bold">4.9/5</span>
            <span className="text-[11px] opacity-60">sur Google</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 border border-border/30" style={{ backgroundColor: theme.card }}>
          <span className="text-[10px] font-semibold">Google</span>
        </div>
      </div>
      <div className="rounded-xl p-4 mb-4 transition-opacity duration-200" style={{ backgroundColor: theme.card, opacity: animating ? 0 : 1 }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: theme.star + '22', color: theme.star }}>{review.avatar}</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate">{review.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <StarRating rating={review.rating} />
              <span className="text-[10px] opacity-50">{review.date}</span>
            </div>
          </div>
        </div>
        <p className="text-xs leading-relaxed line-clamp-3 opacity-80">"{review.text}"</p>
      </div>
      <div className="flex items-center justify-between">
        <button onClick={prev} className="w-7 h-7 rounded-full flex items-center justify-center border border-border/30" style={{ backgroundColor: theme.card }}><ChevronLeft size={14} /></button>
        <div className="flex items-center gap-1">
          {MOCK_REVIEWS.map((_, i) => <div key={i} className="rounded-full transition-all duration-200" style={{ width: i === current ? 16 : 6, height: 6, backgroundColor: i === current ? theme.star : theme.text + '33' }} />)}
        </div>
        <button onClick={next} className="w-7 h-7 rounded-full flex items-center justify-center border border-border/30" style={{ backgroundColor: theme.card }}><ChevronRight size={14} /></button>
      </div>
    </div>
  );
}

function WidgetAvisTab() {
  const [selectedTheme, setSelectedTheme] = useState(WIDGET_THEMES[0]);
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(`<!-- Kompilot Widget -->`).then(() => {
      setCopied(true);
      toast.success('Code copié !');
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
      <div className="space-y-6">
        <div className="bg-muted/30 p-6 rounded-2xl border border-border/50">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><Settings2 size={16} /> Personnalisation</h3>
          <div className="flex flex-wrap gap-2 mb-6">
            {WIDGET_THEMES.map(t => (
              <button key={t.id} onClick={() => setSelectedTheme(t)} className={`px-4 py-1.5 text-xs rounded-full border transition-all ${selectedTheme.id === t.id ? 'bg-primary text-white border-primary' : 'bg-background text-muted-foreground border-border'}`}>{t.label}</button>
            ))}
          </div>
          <ReviewCarousel theme={selectedTheme} />
        </div>
      </div>
      <div className="space-y-6">
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono text-slate-400">widget-integration.html</span>
            <Button size="sm" variant="outline" className="text-xs h-8 bg-white/5 border-white/10 text-white hover:bg-white/10" onClick={handleCopy}>
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copié' : 'Copier'}
            </Button>
          </div>
          <pre className="text-[10px] font-mono text-slate-300 overflow-x-auto p-4 bg-black/20 rounded-lg">
            {`<script src="https://widget.kompilot.fr/reviews.js" \n data-token="nc_tok_xxxx" data-theme="${selectedTheme.id}"></script>\n<div id="kompilot-reviews"></div>`}
          </pre>
        </div>
        <div className="bg-amber-50 border border-amber-100 p-5 rounded-xl space-y-3">
          <p className="text-xs font-bold text-amber-900 flex items-center gap-2">💡 Comment ça marche ?</p>
          <p className="text-xs text-amber-800 leading-relaxed">Le widget se met à jour automatiquement dès qu'un nouvel avis est publié sur Google. Aucune maintenance n'est requise.</p>
        </div>
      </div>
    </div>
  );
}

export default function WebsiteWidgetPage() {
  return (
    <Page>
      <PageHeader className="border-b-0 pb-0">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <PageTitle className="text-3xl font-black tracking-tight flex items-center gap-3">
                <span className="p-2 bg-primary/10 rounded-xl"><Globe className="text-primary" size={24} /></span>
                Cockpit Marketing
              </PageTitle>
              <PageDescription className="text-base">Gérez la croissance de votre site internet avec l'intelligence Kompilot.</PageDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 py-1.5 px-3 rounded-full flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> SEO actif
              </Badge>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-100 py-1.5 px-3 rounded-full flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-500" /> Ads en attente
              </Badge>
              <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-100 py-1.5 px-3 rounded-full flex items-center gap-1.5">
                <span className="font-bold">42</span> leads ce mois
              </Badge>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-primary to-indigo-600 rounded-2xl p-6 text-white shadow-xl shadow-primary/20 relative overflow-hidden group">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Sparkles className="text-amber-300" /> Kompilot AI Intelligence
                </h2>
                <p className="text-white/80 text-sm max-w-xl">
                  Votre cockpit marketing analyse en permanence votre site pour optimiser votre visibilité et capter de nouveaux clients. 
                  <span className="font-bold text-white"> +34% de trafic estimé</span> ce mois-ci.
                </p>
              </div>
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 border-none font-bold gap-2">
                <Zap size={18} /> Optimiser mon site
              </Button>
            </div>
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <BarChart2 size={160} />
            </div>
          </div>
        </div>
      </PageHeader>

      <PageBody>
        <Tabs defaultValue="performance" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 rounded-xl w-fit flex flex-wrap h-auto gap-1">
            <TabsTrigger value="performance" className="gap-2 rounded-lg px-4 py-2"><BarChart2 size={16} /> Performance</TabsTrigger>
            <TabsTrigger value="seo" className="gap-2 rounded-lg px-4 py-2"><Search size={16} /> SEO & Netlinking</TabsTrigger>
            <TabsTrigger value="sea" className="gap-2 rounded-lg px-4 py-2"><Target size={16} /> Publicité (SEA)</TabsTrigger>
            <TabsTrigger value="leads" className="gap-2 rounded-lg px-4 py-2"><Send size={16} /> Génération de Leads</TabsTrigger>
            <TabsTrigger value="growth" className="gap-2 rounded-lg px-4 py-2"><Zap size={16} /> Growth Hacking</TabsTrigger>
            <TabsTrigger value="widget" className="gap-2 rounded-lg px-4 py-2"><Star size={16} /> Widget Avis</TabsTrigger>
            <TabsTrigger value="trust" className="gap-2 rounded-lg px-4 py-2"><Shield size={16} /> Citations Confiance</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="animate-in fade-in slide-in-from-bottom-2 duration-400">
            <div className="space-y-8">
              <ConversionDashboard />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 border-emerald-100 bg-emerald-50/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-emerald-800">Résumé Santé SEO</h3>
                    <Badge className="bg-emerald-500 text-white border-none">85/100</Badge>
                  </div>
                  <p className="text-sm text-emerald-700 mb-4">Votre site est dans le top 10% des opticiens locaux à La Rochelle.</p>
                  <Button variant="outline" className="text-emerald-700 border-emerald-200 bg-white" size="sm">Voir les détails SEO</Button>
                </Card>
                <Card className="p-6 border-indigo-100 bg-indigo-50/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-indigo-800">Campagnes Ads</h3>
                    <Badge variant="outline" className="text-indigo-600 border-indigo-200">En attente</Badge>
                  </div>
                  <p className="text-sm text-indigo-700 mb-4">Vous avez 150€ de budget publicitaire prêt à être déployé.</p>
                  <Button variant="outline" className="text-indigo-700 border-indigo-200 bg-white" size="sm">Lancer une campagne</Button>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="seo" className="animate-in fade-in slide-in-from-bottom-2 duration-400"><SEOModule /></TabsContent>
          <TabsContent value="sea" className="animate-in fade-in slide-in-from-bottom-2 duration-400"><SEAModule /></TabsContent>
          <TabsContent value="leads" className="animate-in fade-in slide-in-from-bottom-2 duration-400"><LeadGenModule /></TabsContent>
          <TabsContent value="growth" className="animate-in fade-in slide-in-from-bottom-2 duration-400"><GrowthHackingModule /></TabsContent>
          <TabsContent value="widget" className="animate-in fade-in slide-in-from-bottom-2 duration-400"><WidgetAvisTab /></TabsContent>
          <TabsContent value="trust" className="animate-in fade-in slide-in-from-bottom-2 duration-400">
            <div className="max-w-2xl">
              <TrustCitationsBadge />
            </div>
          </TabsContent>
        </Tabs>
      </PageBody>
    </Page>
  );
}