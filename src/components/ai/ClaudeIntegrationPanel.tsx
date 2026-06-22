/**
 * ClaudeIntegrationPanel — Panneau d'intégration Anthropic Claude pour Kompilot
 *
 * Permet de :
 *  1. Tester la connexion Claude (checkClaudeConnection)
 *  2. Assistant co-working longue-contexte
 *  3. Analyser un concurrent
 *  4. Générer un plan de campagne 30 jours
 *  5. Auditer la qualité d'un texte
 *  6. Générer un audit flash visibilité locale
 */

import { useState } from 'react';
import { blink } from '@/blink/client';
import {
  Card, CardHeader, CardTitle, CardContent,
  Button, Badge, Skeleton, Tabs, TabsList, TabsTrigger, TabsContent,
} from '@blinkdotnew/ui';
import {
  CheckCircle, XCircle, AlertTriangle, RefreshCw,
  Brain, BarChart2, Calendar, Star, Zap, Shield,
} from 'lucide-react';

const BACKEND_URL = 'https://gbrhsehk.backend.blink.new';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ClaudeStatus {
  connected: boolean;
  model?: string;
  response?: string;
  inputTokens?: number;
  outputTokens?: number;
  error?: string;
  statusCode?: number;
  checkedAt: string;
}

interface ContentReview {
  score: number;
  feedback: string;
  improved: string;
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

// ── Badge statut connexion ────────────────────────────────────────────────────

function StatusBadge({ connected }: { connected: boolean | null }) {
  if (connected === null) return <Badge variant="secondary">Non testé</Badge>;
  return connected
    ? <Badge className="bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400">Connecté</Badge>
    : <Badge variant="destructive">Erreur</Badge>;
}

// ── Score visuel (audit qualité) ──────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const color = score >= 8 ? 'bg-emerald-500' : score >= 6 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score * 10}%` }} />
      </div>
      <span className="text-sm font-bold tabular-nums">{score}/10</span>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export function ClaudeIntegrationPanel() {
  // ── État connexion
  const [status, setStatus] = useState<ClaudeStatus | null>(null);
  const [checking, setChecking] = useState(false);

  // ── Co-working
  const [cwTask, setCwTask] = useState('');
  const [cwContext, setCwContext] = useState('');
  const [cwResult, setCwResult] = useState('');
  const [loadingCw, setLoadingCw] = useState(false);

  // ── Analyse concurrent
  const [compName, setCompName] = useState('');
  const [compData, setCompData] = useState('');
  const [ourStrengths, setOurStrengths] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loadingComp, setLoadingComp] = useState(false);

  // ── Plan campagne
  const [planSector, setPlanSector] = useState('restaurant');
  const [planObjective, setPlanObjective] = useState('attirer 20 nouveaux clients');
  const [planBudget, setPlanBudget] = useState('800');
  const [planCity, setPlanCity] = useState('Paris');
  const [planChannels, setPlanChannels] = useState('instagram,google,sms');
  const [campaignPlan, setCampaignPlan] = useState('');
  const [loadingPlan, setLoadingPlan] = useState(false);

  // ── Audit qualité
  const [auditContent, setAuditContent] = useState('');
  const [auditType, setAuditType] = useState<'post' | 'review_reply' | 'description' | 'ad'>('post');
  const [auditSector, setAuditSector] = useState('restaurant');
  const [review, setReview] = useState<ContentReview | null>(null);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // ── Audit flash
  const [flashBusiness, setFlashBusiness] = useState('');
  const [flashSector, setFlashSector] = useState('restaurant');
  const [flashCity, setFlashCity] = useState('Paris');
  const [flashIssues, setFlashIssues] = useState('avis sans réponse,fiche GMB incomplète');
  const [flashAudit, setFlashAudit] = useState('');
  const [loadingFlash, setLoadingFlash] = useState(false);

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleCheck() {
    setChecking(true);
    try {
      const res = await backendCall<ClaudeStatus>('/api/claude/check');
      setStatus(res);
    } catch (err) {
      setStatus({ connected: false, error: err instanceof Error ? err.message : String(err), checkedAt: new Date().toISOString() });
    } finally { setChecking(false); }
  }

  async function handleCoworking() {
    if (!cwTask) return;
    setLoadingCw(true); setCwResult('');
    try {
      const res = await backendCall<{ result: string }>('/api/claude/coworking', 'POST', {
        task: cwTask, context: cwContext,
      });
      setCwResult(res.result);
    } catch (err) { setCwResult(`Erreur : ${err instanceof Error ? err.message : String(err)}`); }
    finally { setLoadingCw(false); }
  }

  async function handleAnalyzeCompetitor() {
    if (!compName) return;
    setLoadingComp(true); setAnalysis('');
    try {
      const res = await backendCall<{ analysis: string }>('/api/claude/analyze-competitor', 'POST', {
        competitorName: compName, competitorData: compData, ourStrengths,
      });
      setAnalysis(res.analysis);
    } catch (err) { setAnalysis(`Erreur : ${err instanceof Error ? err.message : String(err)}`); }
    finally { setLoadingComp(false); }
  }

  async function handleCampaignPlan() {
    setLoadingPlan(true); setCampaignPlan('');
    try {
      const res = await backendCall<{ plan: string }>('/api/claude/campaign-plan', 'POST', {
        sector: planSector, objective: planObjective,
        budget: parseInt(planBudget), city: planCity,
        channels: planChannels.split(',').map(c => c.trim()).filter(Boolean),
      });
      setCampaignPlan(res.plan);
    } catch (err) { setCampaignPlan(`Erreur : ${err instanceof Error ? err.message : String(err)}`); }
    finally { setLoadingPlan(false); }
  }

  async function handleAuditContent() {
    if (!auditContent) return;
    setLoadingAudit(true); setReview(null);
    try {
      const res = await backendCall<{ review: ContentReview }>('/api/claude/review-content', 'POST', {
        content: auditContent, type: auditType, sector: auditSector,
      });
      setReview(res.review);
    } catch (err) { console.error(err); }
    finally { setLoadingAudit(false); }
  }

  async function handleAuditFlash() {
    if (!flashBusiness) return;
    setLoadingFlash(true); setFlashAudit('');
    try {
      const res = await backendCall<{ audit: string }>('/api/claude/audit-flash', 'POST', {
        businessName: flashBusiness, sector: flashSector, city: flashCity,
        issues: flashIssues.split(',').map(i => i.trim()).filter(Boolean),
      });
      setFlashAudit(res.audit);
    } catch (err) { setFlashAudit(`Erreur : ${err instanceof Error ? err.message : String(err)}`); }
    finally { setLoadingFlash(false); }
  }

  // ── Input commun ──────────────────────────────────────────────────────────

  const inputCls = 'mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40';

  // ── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* ── Card connexion ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base">Anthropic Claude 3.5 Sonnet</CardTitle>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-muted-foreground">Moteur co-working & analyse longue-contexte (200k tokens)</p>
                  <StatusBadge connected={status ? status.connected : null} />
                </div>
              </div>
            </div>
            <Button onClick={handleCheck} disabled={checking} size="sm" className="gap-2 bg-amber-600 hover:bg-amber-700 text-white">
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
                ? 'bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800'
                : 'bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-800'
            }`}>
              {status.connected
                ? <CheckCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                : <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              }
              <div className="min-w-0 flex-1">
                {status.connected ? (
                  <>
                    <p className="font-medium text-amber-700 dark:text-amber-400">Clé Anthropic valide — crédit de 20$ actif</p>
                    <div className="mt-1.5 space-y-0.5 text-amber-800 dark:text-amber-300 text-sm">
                      <p><span className="font-medium">Modèle testé :</span> {status.model}</p>
                      <p><span className="font-medium">Réponse :</span> {status.response}</p>
                      {status.inputTokens !== undefined && (
                        <p><span className="font-medium">Tokens :</span> {status.inputTokens} in / {status.outputTokens} out</p>
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
                          Clé invalide. Vérifiez{' '}
                          <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="underline">
                            console.anthropic.com
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
          <Tabs defaultValue="coworking">
            <TabsList className="grid grid-cols-5 w-full mb-4">
              <TabsTrigger value="coworking"  className="text-[10px] gap-1"><Brain className="w-3 h-3" />Co-work</TabsTrigger>
              <TabsTrigger value="competitor" className="text-[10px] gap-1"><BarChart2 className="w-3 h-3" />Concurrent</TabsTrigger>
              <TabsTrigger value="plan"       className="text-[10px] gap-1"><Calendar className="w-3 h-3" />Plan 30j</TabsTrigger>
              <TabsTrigger value="audit"      className="text-[10px] gap-1"><Star className="w-3 h-3" />Qualité</TabsTrigger>
              <TabsTrigger value="flash"      className="text-[10px] gap-1"><Shield className="w-3 h-3" />Flash</TabsTrigger>
            </TabsList>

            {/* ── Co-working ─────────────────────────────────────────────── */}
            <TabsContent value="coworking" className="space-y-3">
              <p className="text-xs text-muted-foreground">Assistant Claude longue-contexte : analyse de briefs, rédaction complexe, conseil stratégique.</p>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Tâche à réaliser</label>
                <textarea value={cwTask} onChange={e => setCwTask(e.target.value)} rows={3}
                  placeholder="Ex: Analyse ce brief et propose 3 angles de différenciation pour notre stratégie Instagram..."
                  className={`${inputCls} resize-none`} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Contexte additionnel (optionnel)</label>
                <textarea value={cwContext} onChange={e => setCwContext(e.target.value)} rows={2}
                  placeholder="Données, contraintes, exemples, documents de référence..."
                  className={`${inputCls} resize-none`} />
              </div>
              <Button onClick={handleCoworking} disabled={loadingCw || !cwTask} size="sm" className="w-full gap-2 bg-amber-600 hover:bg-amber-700 text-white">
                {loadingCw ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                {loadingCw ? 'Claude réfléchit…' : 'Lancer le co-working'}
              </Button>
              {loadingCw && <Skeleton className="h-40 w-full rounded-lg" />}
              {cwResult && <div className="rounded-lg border border-amber-200 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-900 p-3 text-sm whitespace-pre-wrap leading-relaxed">{cwResult}</div>}
            </TabsContent>

            {/* ── Analyse concurrent ─────────────────────────────────────── */}
            <TabsContent value="competitor" className="space-y-3">
              <p className="text-xs text-muted-foreground">SWOT concurrent + opportunités de différenciation + actions immédiates.</p>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nom du concurrent</label>
                <input value={compName} onChange={e => setCompName(e.target.value)} placeholder="Ex: La Boulangerie du Centre" className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Données disponibles (posts, avis, description…)</label>
                <textarea value={compData} onChange={e => setCompData(e.target.value)} rows={3}
                  placeholder="Collez les données collectées : extraits de posts, avis Google, description GMB..."
                  className={`${inputCls} resize-none`} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nos forces à valoriser</label>
                <textarea value={ourStrengths} onChange={e => setOurStrengths(e.target.value)} rows={2}
                  placeholder="Ex: 15 ans d'expérience, produits locaux, livraison gratuite..."
                  className={`${inputCls} resize-none`} />
              </div>
              <Button onClick={handleAnalyzeCompetitor} disabled={loadingComp || !compName} size="sm" className="w-full gap-2 bg-amber-600 hover:bg-amber-700 text-white">
                {loadingComp ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BarChart2 className="w-4 h-4" />}
                {loadingComp ? 'Analyse en cours…' : 'Analyser le concurrent'}
              </Button>
              {loadingComp && <Skeleton className="h-40 w-full rounded-lg" />}
              {analysis && <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm whitespace-pre-wrap leading-relaxed">{analysis}</div>}
            </TabsContent>

            {/* ── Plan 30 jours ──────────────────────────────────────────── */}
            <TabsContent value="plan" className="space-y-3">
              <p className="text-xs text-muted-foreground">Plan de campagne marketing complet sur 30 jours avec calendrier, budget et KPIs.</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Secteur</label>
                  <input value={planSector} onChange={e => setPlanSector(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Ville</label>
                  <input value={planCity} onChange={e => setPlanCity(e.target.value)} className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">Objectif</label>
                  <input value={planObjective} onChange={e => setPlanObjective(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Budget (€/mois)</label>
                  <input type="number" value={planBudget} onChange={e => setPlanBudget(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Canaux (virgule)</label>
                  <input value={planChannels} onChange={e => setPlanChannels(e.target.value)} placeholder="instagram,google,sms" className={inputCls} />
                </div>
              </div>
              <Button onClick={handleCampaignPlan} disabled={loadingPlan} size="sm" className="w-full gap-2 bg-amber-600 hover:bg-amber-700 text-white">
                {loadingPlan ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                {loadingPlan ? 'Génération du plan…' : 'Générer le plan 30 jours'}
              </Button>
              {loadingPlan && <Skeleton className="h-48 w-full rounded-lg" />}
              {campaignPlan && <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">{campaignPlan}</div>}
            </TabsContent>

            {/* ── Audit qualité texte ────────────────────────────────────── */}
            <TabsContent value="audit" className="space-y-3">
              <p className="text-xs text-muted-foreground">Évalue et améliore un texte marketing selon les critères de qualité Kompilot.</p>
              <div className="flex gap-2 flex-wrap">
                {(['post', 'review_reply', 'description', 'ad'] as const).map(t => (
                  <button key={t} onClick={() => setAuditType(t)}
                    className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
                      auditType === t ? 'bg-amber-600 text-white border-amber-600' : 'border-border hover:bg-muted'
                    }`}>
                    {t === 'post' ? 'Post' : t === 'review_reply' ? 'Avis' : t === 'description' ? 'Description' : 'Pub'}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Secteur</label>
                <input value={auditSector} onChange={e => setAuditSector(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Texte à évaluer</label>
                <textarea value={auditContent} onChange={e => setAuditContent(e.target.value)} rows={4}
                  placeholder="Collez le texte à auditer..."
                  className={`${inputCls} resize-none`} />
              </div>
              <Button onClick={handleAuditContent} disabled={loadingAudit || !auditContent} size="sm" className="w-full gap-2 bg-amber-600 hover:bg-amber-700 text-white">
                {loadingAudit ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                {loadingAudit ? 'Audit en cours…' : 'Auditer le texte'}
              </Button>
              {loadingAudit && <Skeleton className="h-32 w-full rounded-lg" />}
              {review && (
                <div className="space-y-3">
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Score qualité</p>
                    <ScoreBar score={review.score} />
                    <p className="text-sm mt-2 text-muted-foreground">{review.feedback}</p>
                  </div>
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-900 p-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-1">Version améliorée</p>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{review.improved}</p>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ── Audit Flash ────────────────────────────────────────────── */}
            <TabsContent value="flash" className="space-y-3">
              <p className="text-xs text-muted-foreground">Génère un audit flash percutant pour un prospect ou un client existant.</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">Nom de l'établissement</label>
                  <input value={flashBusiness} onChange={e => setFlashBusiness(e.target.value)} placeholder="Ex: Boulangerie Martin" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Secteur</label>
                  <input value={flashSector} onChange={e => setFlashSector(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Ville</label>
                  <input value={flashCity} onChange={e => setFlashCity(e.target.value)} className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">Problèmes détectés (virgule)</label>
                  <input value={flashIssues} onChange={e => setFlashIssues(e.target.value)}
                    placeholder="avis sans réponse, fiche GMB incomplète, pas de posts" className={inputCls} />
                </div>
              </div>
              <Button onClick={handleAuditFlash} disabled={loadingFlash || !flashBusiness} size="sm" className="w-full gap-2 bg-amber-600 hover:bg-amber-700 text-white">
                {loadingFlash ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                {loadingFlash ? 'Génération de l\'audit…' : 'Générer l\'audit flash'}
              </Button>
              {loadingFlash && <Skeleton className="h-48 w-full rounded-lg" />}
              {flashAudit && (
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">{flashAudit}</div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* ── Guide configuration ────────────────────────────────────────── */}
      {!status && (
        <Card className="border-dashed">
          <CardContent className="py-5">
            <p className="text-sm font-medium mb-3">Configuration requise</p>
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
              <li>Créez une clé API sur <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-amber-600 underline">console.anthropic.com</a></li>
              <li>Rechargez votre compte avec au moins 5$ de crédit</li>
              <li>Ajoutez <code className="text-xs bg-muted px-1 rounded">ANTHROPIC_API_KEY</code> dans les secrets Cloudflare Workers</li>
              <li>Cliquez sur <strong>Tester la connexion</strong> ci-dessus</li>
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
