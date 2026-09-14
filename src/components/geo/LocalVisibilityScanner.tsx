import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { AlertCircle, ArrowRight, CheckCircle2, Gauge, Loader2, MapPin, Radar, RotateCcw, Sparkles, Target, TrendingUp } from 'lucide-react';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Progress } from '@blinkdotnew/ui';
import { blink } from '../../blink/client';
import { SECTOR_CATALOG, type OfficialSector } from '../../data/sectors/sectorCatalog';

type SourceStatus = 'heuristic_unverified' | 'scan_failed' | 'available';
type Signal = { key: string; label: string; score: number };
type ScanResult = {
  score: number;
  confidence: number;
  sourceStatus: SourceStatus;
  factors: string[];
  recommendations: string[];
  preview?: { label: string; disclaimer: string; signals: Signal[] } | null;
  scoringVersion?: string;
  computedAt?: string;
};

type Props = {
  demo?: boolean;
  demoSector?: OfficialSector;
  defaultBusinessName?: string;
  defaultCity?: string;
  defaultActivity?: string;
  defaultWebsite?: string;
};

function demoResult(sector: OfficialSector): ScanResult {
  const profile = SECTOR_CATALOG[sector];
  return {
    score: profile.geoScore,
    confidence: 78,
    sourceStatus: 'heuristic_unverified',
    scoringVersion: 'demo-sector-v1',
    computedAt: new Date().toISOString(),
    factors: [
      `Secteur ${profile.shortLabel.toLowerCase()} identifié`,
      `Zone locale analysée : ${profile.city}`,
      `${profile.geoQueries.length} requêtes locales prioritaires détectées`,
      'Base de réputation et signaux éditoriaux disponibles',
    ],
    recommendations: [
      `Publier une actualité locale sur ${profile.geoQueries[0]}`,
      `Répondre aux avis en mentionnant naturellement ${profile.reviewTopics.slice(0, 2).join(' et ')}`,
      `Créer une FAQ dédiée à ${profile.geoQueries[1]}`,
    ],
    preview: {
      label: 'Aperçu de démonstration',
      disclaimer: 'Données fictives adaptées au secteur sélectionné. Lancez un scan réel pour analyser votre entreprise.',
      signals: [
        { key: 'local_presence', label: 'Présence locale', score: profile.geoScore },
        { key: 'ai_discoverability', label: 'Découvrabilité IA', score: Math.max(0, profile.geoScore - 7) },
        { key: 'reputation', label: 'Réputation', score: Math.min(100, Math.round(profile.googleRating * 20)) },
      ],
    },
  };
}

function actionFor(recommendation: string) {
  const value = recommendation.toLowerCase();
  if (value.includes('avis')) return { label: 'Gérer les avis', to: '/reviews' };
  if (value.includes('faq') || value.includes('publier') || value.includes('contenu')) return { label: 'Créer un contenu', to: '/cockpit' };
  if (value.includes('fiche') || value.includes('google') || value.includes('téléphone')) return { label: 'Vérifier la fiche', to: '/google-maps' };
  if (value.includes('site web')) return { label: 'Améliorer le site', to: '/seo-local' };
  return { label: 'Voir le plan', to: '/geo-command-center' };
}

function formatScanDate(value?: string) {
  if (!value) return 'À l’instant';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'À l’instant' : `Analysé le ${date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`;
}

export function LocalVisibilityScanner({
  demo = false,
  demoSector = 'commerce',
  defaultBusinessName = '',
  defaultCity = '',
  defaultActivity = '',
  defaultWebsite = '',
}: Props) {
  const [businessName, setBusinessName] = useState(defaultBusinessName);
  const [city, setCity] = useState(defaultCity);
  const [activity, setActivity] = useState(defaultActivity);
  const [website, setWebsite] = useState(defaultWebsite);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const runScan = async () => {
    if (!businessName.trim() || !city.trim()) {
      setError('Ajoutez le nom de l’entreprise et la ville pour lancer l’analyse.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (demo) {
        await new Promise(resolve => setTimeout(resolve, 850));
        setResult(demoResult(demoSector));
      } else {
        const response = await blink.functions.invoke<ScanResult>('api/scanner/scan-fast', {
          method: 'POST',
          body: { businessName, city, activity, website },
        });
        setResult(((response as { data?: ScanResult }).data ?? response) as ScanResult);
      }
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : 'Le scan n’a pas pu être terminé.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError('');
  };

  return (
    <Card className="overflow-hidden border-primary/20 shadow-sm">
      <CardHeader className="border-b border-border/70 bg-primary/[0.04] pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Radar size={19} /></div>
            <div>
              <CardTitle className="text-base">Scanner de visibilité locale</CardTitle>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">Mesurez vos signaux locaux et obtenez les prochaines actions pour être mieux trouvé sur Google et les moteurs IA.</p>
            </div>
          </div>
          {result && <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5 text-xs"><RotateCcw size={13} /> Nouveau scan</Button>}
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-4 sm:p-6">
        {!result && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-xs font-semibold">Entreprise<Input value={businessName} onChange={event => setBusinessName(event.target.value)} placeholder="Ex. Atelier Central" /></label>
            <label className="space-y-1.5 text-xs font-semibold">Ville<Input value={city} onChange={event => setCity(event.target.value)} placeholder="Ex. Tours" /></label>
            <label className="space-y-1.5 text-xs font-semibold">Activité<Input value={activity} onChange={event => setActivity(event.target.value)} placeholder="Ex. boutique locale" /></label>
            <label className="space-y-1.5 text-xs font-semibold">Site public <span className="font-normal text-muted-foreground">(facultatif)</span><Input value={website} onChange={event => setWebsite(event.target.value)} placeholder="https://..." /></label>
            <div className="sm:col-span-2 flex flex-wrap items-center gap-3 pt-1">
              <Button onClick={() => void runScan()} disabled={loading} className="gap-2">
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                {loading ? 'Analyse en cours…' : 'Lancer le scanner'}
              </Button>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"><MapPin size={13} /> Résultat en moins d’une minute</span>
            </div>
          </div>
        )}

        {error && <div className="flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-xs text-destructive"><AlertCircle size={14} className="mt-0.5 shrink-0" />{error}</div>}

        {result && (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-[180px_1fr]">
              <div className="rounded-xl border border-primary/15 bg-primary/[0.04] p-4 text-center">
                <Gauge className="mx-auto mb-2 text-primary" size={19} />
                <p className="text-4xl font-black tracking-tight text-primary">{result.score}<span className="text-lg text-muted-foreground">/100</span></p>
                <p className="mt-1 text-[11px] font-semibold text-muted-foreground">Score de visibilité locale</p>
                <Badge variant="outline" className="mt-3 text-[10px]">Confiance {result.confidence}%</Badge>
                <p className="mt-2 text-[10px] text-muted-foreground">{formatScanDate(result.computedAt)}</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-bold">Lecture des signaux</p><p className="text-[11px] text-muted-foreground">{result.sourceStatus === 'heuristic_unverified' ? 'Estimation à partir des informations saisies — à confirmer avec vos connexions.' : 'Analyse disponible.'}</p></div><TrendingUp size={18} className="text-emerald-500" /></div>
                {(result.preview?.signals ?? []).map(signal => <div key={signal.key}><div className="mb-1 flex justify-between text-[11px]"><span>{signal.label}</span><span className="font-bold">{signal.score}/100</span></div><Progress value={signal.score} className="h-1.5 [&>div]:bg-primary" /></div>)}
              </div>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-[11px] leading-relaxed text-amber-900"><span className="font-bold">À retenir :</span> {result.preview?.disclaimer ?? 'Les recommandations sont proposées à partir des signaux disponibles.'}</div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground"><span>Source : {result.scoringVersion ?? 'analyse locale'}</span><span>Les résultats sont indicatifs et ne remplacent pas une connexion aux plateformes.</span></div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div><p className="mb-2 flex items-center gap-2 text-xs font-bold"><CheckCircle2 size={14} className="text-emerald-500" /> Signaux détectés</p><div className="space-y-2">{result.factors.map(factor => <div key={factor} className="rounded-lg bg-muted/45 px-3 py-2 text-[11px] text-muted-foreground">{factor}</div>)}</div></div>
              <div><p className="mb-2 flex items-center gap-2 text-xs font-bold"><Target size={14} className="text-primary" /> Recommandations actionnables</p><div className="space-y-2">{result.recommendations.map(recommendation => { const action = actionFor(recommendation); return <div key={recommendation} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5"><span className="flex-1 text-[11px] leading-relaxed">{recommendation}</span><Link to={action.to} className="shrink-0 text-[10px] font-bold text-primary hover:underline">{action.label}<ArrowRight size={11} className="ml-1 inline" /></Link></div>; })}</div></div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
