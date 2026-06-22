/**
 * OpenAIIntegrationPanel — Panneau d'intégration OpenAI pour Kompilot
 *
 * Permet de :
 *  1. Tester la connexion OpenAI (checkOpenAIConnection)
 *  2. Générer des idées de campagnes
 *  3. Suggérer du contenu pour les réseaux sociaux
 *  4. Optimiser un texte SEO
 *  5. Générer un texte publicitaire (Ad Copy)
 */

import { useState } from 'react';
import { blink } from '@/blink/client';
import {
  Card, CardHeader, CardTitle, CardContent,
  Button, Badge, Skeleton, Tabs, TabsList, TabsTrigger, TabsContent,
} from '@blinkdotnew/ui';
import {
  CheckCircle, XCircle, AlertTriangle, RefreshCw,
  Sparkles, Zap, Megaphone, Search, FileText,
} from 'lucide-react';

const BACKEND_URL = 'https://gbrhsehk.backend.blink.new';

// ── Types ─────────────────────────────────────────────────────────────────────

interface OpenAIStatus {
  connected: boolean;
  model?: string;
  response?: string;
  tokensUsed?: number;
  error?: string;
  statusCode?: number;
  checkedAt: string;
}

// ── Helper fetch authentifié ──────────────────────────────────────────────────

async function backendCall<T>(
  path: string,
  method: 'GET' | 'POST' = 'GET',
  body?: object,
): Promise<T> {
  const token = await blink.auth.getValidToken();
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json() as T & { error?: string };
  if (!res.ok) throw new Error((json as { error?: string }).error ?? `HTTP ${res.status}`);
  return json;
}

// ── Sous-composant : badge de statut ──────────────────────────────────────────

function StatusBadge({ connected }: { connected: boolean | null }) {
  if (connected === null) return <Badge variant="secondary">Non testé</Badge>;
  return connected
    ? <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400">Connecté</Badge>
    : <Badge variant="destructive">Erreur</Badge>;
}

// ── Composant principal ───────────────────────────────────────────────────────

export function OpenAIIntegrationPanel() {
  // ── État global connexion
  const [status, setStatus] = useState<OpenAIStatus | null>(null);
  const [checking, setChecking] = useState(false);

  // ── Onglet campagnes
  const [sector, setSector] = useState('restaurant');
  const [objective, setObjective] = useState('attirer de nouveaux clients');
  const [city, setCity] = useState('Paris');
  const [budget, setBudget] = useState('500');
  const [campaignIdeas, setCampaignIdeas] = useState('');
  const [loadingCampaign, setLoadingCampaign] = useState(false);

  // ── Onglet contenu social
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState<'instagram' | 'facebook' | 'google'>('instagram');
  const [suggestedContent, setSuggestedContent] = useState('');
  const [loadingContent, setLoadingContent] = useState(false);

  // ── Onglet SEO
  const [seoText, setSeoText] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [seoCity, setSeoCity] = useState('Paris');
  const [optimizedText, setOptimizedText] = useState('');
  const [loadingSEO, setLoadingSEO] = useState(false);

  // ── Onglet Ad Copy
  const [product, setProduct] = useState('');
  const [audience, setAudience] = useState('');
  const [adPlatform, setAdPlatform] = useState<'facebook' | 'google' | 'instagram'>('facebook');
  const [adCopy, setAdCopy] = useState<{ headline: string; body: string; cta: string } | null>(null);
  const [loadingAd, setLoadingAd] = useState(false);

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleCheck() {
    setChecking(true);
    try {
      const res = await backendCall<OpenAIStatus>('/api/openai/check');
      setStatus(res);
    } catch (err) {
      setStatus({ connected: false, error: err instanceof Error ? err.message : String(err), checkedAt: new Date().toISOString() });
    } finally { setChecking(false); }
  }

  async function handleCampaignIdeas() {
    setLoadingCampaign(true);
    setCampaignIdeas('');
    try {
      const res = await backendCall<{ ideas: string }>('/api/openai/campaign-ideas', 'POST', {
        sector, objective, city, budget: parseInt(budget),
      });
      setCampaignIdeas(res.ideas);
    } catch (err) { setCampaignIdeas(`Erreur : ${err instanceof Error ? err.message : String(err)}`); }
    finally { setLoadingCampaign(false); }
  }

  async function handleSuggestContent() {
    if (!topic) return;
    setLoadingContent(true);
    setSuggestedContent('');
    try {
      const res = await backendCall<{ content: string }>('/api/openai/suggest-content', 'POST', {
        topic, platform, sector, tone: 'professionnel',
      });
      setSuggestedContent(res.content);
    } catch (err) { setSuggestedContent(`Erreur : ${err instanceof Error ? err.message : String(err)}`); }
    finally { setLoadingContent(false); }
  }

  async function handleOptimizeSEO() {
    if (!seoText) return;
    setLoadingSEO(true);
    setOptimizedText('');
    try {
      const res = await backendCall<{ optimized: string }>('/api/openai/optimize-seo', 'POST', {
        text: seoText,
        keywords: seoKeywords.split(',').map(k => k.trim()).filter(Boolean),
        targetCity: seoCity,
      });
      setOptimizedText(res.optimized);
    } catch (err) { setOptimizedText(`Erreur : ${err instanceof Error ? err.message : String(err)}`); }
    finally { setLoadingSEO(false); }
  }

  async function handleGenerateAdCopy() {
    if (!product) return;
    setLoadingAd(true);
    setAdCopy(null);
    try {
      const res = await backendCall<{ adCopy: { headline: string; body: string; cta: string } }>(
        '/api/openai/generate-ad-copy', 'POST', { product, targetAudience: audience, platform: adPlatform, urgency: false },
      );
      setAdCopy(res.adCopy);
    } catch (err) { console.error(err); }
    finally { setLoadingAd(false); }
  }

  // ── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* ── Card connexion ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base">OpenAI GPT-4o</CardTitle>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-muted-foreground">API Marketing IA — gpt-4o / gpt-4o-mini</p>
                  <StatusBadge connected={status ? status.connected : null} />
                </div>
              </div>
            </div>
            <Button onClick={handleCheck} disabled={checking} size="sm" className="gap-2">
              {checking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {checking ? 'Test en cours…' : 'Tester la connexion'}
            </Button>
          </div>
        </CardHeader>

        {/* Résultat du test */}
        {status && (
          <CardContent className="pt-0">
            <div className={`rounded-lg p-3 flex items-start gap-3 text-sm ${
              status.connected
                ? 'bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
                : 'bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-800'
            }`}>
              {status.connected
                ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                : <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              }
              <div className="min-w-0 flex-1">
                {status.connected ? (
                  <>
                    <p className="font-medium text-emerald-700 dark:text-emerald-400">Clé API valide — connexion établie</p>
                    <div className="mt-1.5 space-y-0.5 text-emerald-800 dark:text-emerald-300 text-sm">
                      <p><span className="font-medium">Modèle testé :</span> {status.model}</p>
                      <p><span className="font-medium">Réponse :</span> {status.response}</p>
                      {status.tokensUsed !== undefined && (
                        <p><span className="font-medium">Tokens utilisés :</span> {status.tokensUsed}</p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-red-700 dark:text-red-400">
                      Connexion échouée
                      {status.statusCode && <span className="ml-1 font-normal opacity-70">(HTTP {status.statusCode})</span>}
                    </p>
                    <p className="mt-0.5 text-red-600 dark:text-red-300">{status.error}</p>
                    {status.statusCode === 401 && (
                      <div className="mt-2 flex items-start gap-1.5 text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <p className="text-xs">
                          Clé invalide. Vérifiez votre{' '}
                          <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">
                            OPENAI_API_KEY
                          </a>{' '}
                          et mettez à jour le secret dans Blink.
                        </p>
                      </div>
                    )}
                    {status.statusCode === 429 && (
                      <div className="mt-2 flex items-start gap-1.5 text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <p className="text-xs">
                          Quota épuisé ou crédit insuffisant. Rechargez votre compte sur{' '}
                          <a href="https://platform.openai.com/settings/organization/billing" target="_blank" rel="noopener noreferrer" className="underline">
                            platform.openai.com
                          </a>.
                        </p>
                      </div>
                    )}
                  </>
                )}
                <p className="mt-1.5 text-xs opacity-50">
                  Vérifié le {new Date(status.checkedAt).toLocaleString('fr-FR')}
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* ── Onglets fonctionnalités ──────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-4">
          <Tabs defaultValue="campaign">
            <TabsList className="grid grid-cols-4 w-full mb-4">
              <TabsTrigger value="campaign" className="gap-1.5 text-xs">
                <Megaphone className="w-3.5 h-3.5" />Campagnes
              </TabsTrigger>
              <TabsTrigger value="content" className="gap-1.5 text-xs">
                <Sparkles className="w-3.5 h-3.5" />Contenu
              </TabsTrigger>
              <TabsTrigger value="seo" className="gap-1.5 text-xs">
                <Search className="w-3.5 h-3.5" />SEO
              </TabsTrigger>
              <TabsTrigger value="adcopy" className="gap-1.5 text-xs">
                <FileText className="w-3.5 h-3.5" />Ad Copy
              </TabsTrigger>
            </TabsList>

            {/* ── Campagnes ──────────────────────────────────────────────── */}
            <TabsContent value="campaign" className="space-y-3">
              <p className="text-xs text-muted-foreground">Génère 3 idées de campagnes publicitaires locales adaptées à ton activité.</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Secteur</label>
                  <input value={sector} onChange={e => setSector(e.target.value)}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Ville</label>
                  <input value={city} onChange={e => setCity(e.target.value)}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Objectif</label>
                  <input value={objective} onChange={e => setObjective(e.target.value)}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Budget (€/mois)</label>
                  <input type="number" value={budget} onChange={e => setBudget(e.target.value)}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              </div>
              <Button onClick={handleCampaignIdeas} disabled={loadingCampaign} size="sm" className="gap-2 w-full">
                {loadingCampaign ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loadingCampaign ? 'Génération…' : 'Générer les idées'}
              </Button>
              {loadingCampaign && <Skeleton className="h-32 w-full rounded-lg" />}
              {campaignIdeas && (
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm whitespace-pre-wrap leading-relaxed">{campaignIdeas}</div>
              )}
            </TabsContent>

            {/* ── Contenu social ─────────────────────────────────────────── */}
            <TabsContent value="content" className="space-y-3">
              <p className="text-xs text-muted-foreground">Génère un post optimisé pour Instagram, Facebook ou Google Business.</p>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Sujet du post</label>
                <textarea value={topic} onChange={e => setTopic(e.target.value)} rows={2} placeholder="Ex: promotion de rentrée, nouvelle offre, événement…"
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
              </div>
              <div className="flex gap-2">
                {(['instagram', 'facebook', 'google'] as const).map(p => (
                  <button key={p} onClick={() => setPlatform(p)}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                      platform === p ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'
                    }`}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
              <Button onClick={handleSuggestContent} disabled={loadingContent || !topic} size="sm" className="gap-2 w-full">
                {loadingContent ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loadingContent ? 'Génération…' : 'Générer le post'}
              </Button>
              {loadingContent && <Skeleton className="h-24 w-full rounded-lg" />}
              {suggestedContent && (
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm whitespace-pre-wrap leading-relaxed">{suggestedContent}</div>
              )}
            </TabsContent>

            {/* ── SEO ────────────────────────────────────────────────────── */}
            <TabsContent value="seo" className="space-y-3">
              <p className="text-xs text-muted-foreground">Optimise un texte pour le SEO local et les moteurs IA (AEO).</p>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Texte à optimiser</label>
                <textarea value={seoText} onChange={e => setSeoText(e.target.value)} rows={4} placeholder="Collez votre description, article ou fiche Google…"
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Mots-clés cibles (virgule)</label>
                  <input value={seoKeywords} onChange={e => setSeoKeywords(e.target.value)} placeholder="restaurant paris, cuisine italienne"
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Ville cible</label>
                  <input value={seoCity} onChange={e => setSeoCity(e.target.value)}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              </div>
              <Button onClick={handleOptimizeSEO} disabled={loadingSEO || !seoText} size="sm" className="gap-2 w-full">
                {loadingSEO ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {loadingSEO ? 'Optimisation…' : 'Optimiser le texte'}
              </Button>
              {loadingSEO && <Skeleton className="h-32 w-full rounded-lg" />}
              {optimizedText && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800 p-3 text-sm whitespace-pre-wrap leading-relaxed">{optimizedText}</div>
              )}
            </TabsContent>

            {/* ── Ad Copy ────────────────────────────────────────────────── */}
            <TabsContent value="adcopy" className="space-y-3">
              <p className="text-xs text-muted-foreground">Génère un texte publicitaire structuré (Titre + Corps + CTA) prêt à l'emploi.</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">Produit / Offre</label>
                  <input value={product} onChange={e => setProduct(e.target.value)} placeholder="Ex: -30% sur les soins en semaine"
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">Audience cible</label>
                  <input value={audience} onChange={e => setAudience(e.target.value)} placeholder="Ex: femmes 25-45 ans, Paris 5km"
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              </div>
              <div className="flex gap-2">
                {(['facebook', 'instagram', 'google'] as const).map(p => (
                  <button key={p} onClick={() => setAdPlatform(p)}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                      adPlatform === p ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'
                    }`}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
              <Button onClick={handleGenerateAdCopy} disabled={loadingAd || !product} size="sm" className="gap-2 w-full">
                {loadingAd ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                {loadingAd ? 'Génération…' : 'Générer le texte pub'}
              </Button>
              {loadingAd && <Skeleton className="h-24 w-full rounded-lg" />}
              {adCopy && (
                <div className="rounded-lg border border-border overflow-hidden">
                  {[
                    { label: 'Titre', value: adCopy.headline, color: 'bg-violet-50 dark:bg-violet-950/30' },
                    { label: 'Corps', value: adCopy.body, color: 'bg-muted/30' },
                    { label: 'Call-to-Action', value: adCopy.cta, color: 'bg-primary/5' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className={`px-3 py-2 border-b border-border last:border-0 ${color}`}>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">{label}</p>
                      <p className="text-sm font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* ── Guide de configuration ─────────────────────────────────────── */}
      {!status && (
        <Card className="border-dashed">
          <CardContent className="py-5">
            <p className="text-sm font-medium mb-3">Configuration requise</p>
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
              <li>Créez une clé API sur <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">platform.openai.com/api-keys</a></li>
              <li>Assurez-vous d'avoir un crédit disponible sur votre compte</li>
              <li>Ajoutez le secret <code className="text-xs bg-muted px-1 rounded">OPENAI_API_KEY</code> dans les variables Cloudflare Workers</li>
              <li>Cliquez sur <strong>Tester la connexion</strong> ci-dessus</li>
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
