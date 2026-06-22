/**
 * MetaCampaignExportPanel — Export Calendar Kompilot → Meta Ads Manager
 *
 * Fonctionnalités :
 *   1. Bouton "Exporter sur Meta" sur chaque campagne planifiée
 *   2. Modal de configuration avant export (budget, objectif, ciblage)
 *   3. Mini-rapport de performance en temps réel sur les campagnes actives
 *      (Dépenses, Clics, Impressions, CTR) récupérés via /api/meta/campaign-performance
 *
 * Données externes :
 *   - Token Meta injecté côté serveur (ne passe jamais dans le client)
 *   - adAccountId : saisi par l'utilisateur (ex: act_123456789)
 *
 * Usage dans CalendarPage :
 *   <MetaCampaignExportPanel post={post} />
 */

import { useState, type ReactNode } from 'react';
import { blink } from '@/blink/client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Button, Badge, Skeleton, toast,
} from '@blinkdotnew/ui';
import {
  ExternalLink, RefreshCw, AlertCircle, CheckCircle2,
  TrendingUp, MousePointerClick, Eye, DollarSign,
  UploadCloud, BarChart3, X,
} from 'lucide-react';

const BACKEND_URL = 'https://gbrhsehk.backend.blink.new';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CampaignPerformanceMetrics {
  campaignId: string;
  campaignName: string;
  status: string;
  spendEur: number;
  clicks: number;
  impressions: number;
  ctrPct: number;
  cpcEur: number;
  cpmEur: number;
  reach: number;
  dateRange: { start: string; end: string };
}

interface ExportResult {
  success: boolean;
  campaignId?: string;
  adSetId?: string;
  adsManagerUrl?: string;
  error?: string;
  metaErrorCode?: number;
  status?: string;
}

interface PostLike {
  id: string;
  text: string;
  date: string;
  channels: string[];
}

interface MetaCampaignExportPanelProps {
  post: PostLike;
  /** ID du compte Meta sauvegardé (optionnel — l'utilisateur peut le saisir dans la modal) */
  savedAdAccountId?: string;
  /**
   * Bouton déclencheur personnalisé (optionnel).
   * Si fourni, remplace les boutons intégrés dans le panneau et ouvre
   * directement la modal d'export au clic. Utilisé par InlinePostEditor.
   */
  trigger?: ReactNode;
}

// ── Objectifs Meta disponibles ────────────────────────────────────────────────

const OBJECTIVES = [
  { value: 'REACH',            label: 'Notoriété — Portée maximale' },
  { value: 'BRAND_AWARENESS',  label: 'Notoriété de marque' },
  { value: 'LINK_CLICKS',      label: 'Trafic — Clics vers site' },
  { value: 'POST_ENGAGEMENT',  label: 'Engagement — Likes/commentaires' },
  { value: 'CONVERSIONS',      label: 'Conversions — Actions sur site' },
];

// ── Helper : appel authentifié ────────────────────────────────────────────────

async function backendFetch<T>(
  path: string,
  method: 'GET' | 'POST' = 'GET',
  body?: object,
): Promise<T> {
  const token = await blink.auth.getValidToken();
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method,
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept:         'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json() as T & { error?: string };
  if (!res.ok) throw new Error((json as { error?: string }).error ?? `HTTP ${res.status}`);
  return json;
}

// ── MetaKPIBadge — mini indicateur de KPI ────────────────────────────────────

function MetaKPIBadge({
  icon, label, value, color,
}: {
  icon: React.ReactNode; label: string; value: string; color: string;
}) {
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${color}`}>
      <span className="shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 leading-none">{label}</p>
        <p className="text-xs font-bold tabular-nums leading-snug">{value}</p>
      </div>
    </div>
  );
}

// ── MiniPerformanceReport — affichage en ligne des KPIs ──────────────────────

function MiniPerformanceReport({ metrics }: { metrics: CampaignPerformanceMetrics }) {
  const isActive = metrics.status === 'ACTIVE';
  return (
    <div className="mt-2 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/20 p-2">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <BarChart3 className="w-3 h-3 text-blue-600" />
          <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-400 truncate max-w-[140px]">
            {metrics.campaignName}
          </span>
        </div>
        <Badge className={`text-[9px] px-1.5 py-0 h-4 ${isActive ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>
          {isActive ? 'ACTIVE' : metrics.status}
        </Badge>
      </div>
      <div className="grid grid-cols-4 gap-1">
        <MetaKPIBadge
          icon={<DollarSign className="w-3 h-3 text-emerald-600" />}
          label="Dépenses"
          value={`${metrics.spendEur.toFixed(2)}€`}
          color="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300"
        />
        <MetaKPIBadge
          icon={<MousePointerClick className="w-3 h-3 text-blue-600" />}
          label="Clics"
          value={metrics.clicks.toLocaleString('fr-FR')}
          color="bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300"
        />
        <MetaKPIBadge
          icon={<Eye className="w-3 h-3 text-violet-600" />}
          label="Impressions"
          value={metrics.impressions >= 1000
            ? `${(metrics.impressions / 1000).toFixed(1)}k`
            : String(metrics.impressions)}
          color="bg-violet-50 dark:bg-violet-950/30 text-violet-800 dark:text-violet-300"
        />
        <MetaKPIBadge
          icon={<TrendingUp className="w-3 h-3 text-amber-600" />}
          label="CTR"
          value={`${metrics.ctrPct.toFixed(2)}%`}
          color="bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300"
        />
      </div>
      <p className="text-[9px] text-muted-foreground mt-1 text-right">
        {metrics.dateRange.start} → {metrics.dateRange.end}
      </p>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export function MetaCampaignExportPanel({
  post,
  savedAdAccountId = '',
  trigger,
}: MetaCampaignExportPanelProps) {
  // ── Modal export
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);

  // ── Config export
  const [adAccountId, setAdAccountId] = useState(savedAdAccountId);
  const [objective, setObjective]     = useState('REACH');
  const [budget, setBudget]           = useState('10');     // €/jour
  const [endDate, setEndDate]         = useState('');
  const [ageMin, setAgeMin]           = useState('18');
  const [ageMax, setAgeMax]           = useState('65');
  const [targetCountry, setTargetCountry] = useState('FR');
  const [destinationUrl, setDestinationUrl] = useState('');

  // ── Métriques de perf
  const [metrics, setMetrics]       = useState<CampaignPerformanceMetrics | null>(null);
  const [loadingPerf, setLoadingPerf] = useState(false);
  const [perfError, setPerfError]   = useState<string | null>(null);

  // ── Lancer l'export ───────────────────────────────────────────────────────

  async function handleExport() {
    if (!adAccountId) { toast.error('Saisissez votre ID de compte Meta.'); return; }
    const budgetCents = Math.round(parseFloat(budget) * 100);
    if (isNaN(budgetCents) || budgetCents < 100) {
      toast.error('Budget minimum : 1€/jour.');
      return;
    }

    setExporting(true);
    setExportResult(null);

    try {
      const result = await backendFetch<ExportResult>('/api/meta/export-campaign', 'POST', {
        adAccountId,
        message:          post.text,
        campaignName:     `Kompilot — ${post.date}`,
        objective,
        dailyBudgetCents: budgetCents,
        startDate:        post.date,
        endDate:          endDate || undefined,
        targetCountry,
        ageMin:           parseInt(ageMin),
        ageMax:           parseInt(ageMax),
        destinationUrl:   destinationUrl || undefined,
      });

      setExportResult(result);

      if (result.success) {
        toast.success('Campagne créée dans Meta Ads Manager (brouillon PAUSED).');
        // Charger les métriques automatiquement après l'export
        handleFetchPerformance();
      } else {
        toast.error(result.error ?? 'Erreur lors de l\'export Meta.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setExportResult({ success: false, error: msg });
      toast.error(msg);
    } finally {
      setExporting(false);
    }
  }

  // ── Charger les métriques ─────────────────────────────────────────────────

  async function handleFetchPerformance() {
    if (!adAccountId) { toast.error('Saisissez d\'abord votre ID de compte Meta.'); return; }
    setLoadingPerf(true);
    setPerfError(null);
    setMetrics(null);

    try {
      const res = await backendFetch<{
        metrics: CampaignPerformanceMetrics[];
        error?: string;
      }>(`/api/meta/campaign-performance?adAccountId=${encodeURIComponent(adAccountId)}&datePreset=last_30d`);

      if (res.metrics && res.metrics.length > 0) {
        // Afficher la campagne avec le plus de clics (heuristique)
        const best = res.metrics.sort((a, b) => b.clicks - a.clicks)[0];
        setMetrics(best);
      } else {
        setPerfError('Aucune donnée disponible pour ce compte sur les 30 derniers jours.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setPerfError(msg);
    } finally {
      setLoadingPerf(false);
    }
  }

  const inputCls = 'mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-shadow';

  // ── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Déclencheur : trigger personnalisé ou boutons intégrés ─────── */}
      {trigger ? (
        /* Mode trigger : un seul élément cliquable, wrappé dans un div qui ouvre la modal */
        <div onClick={() => setExportOpen(true)} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
      <div className="flex items-center gap-2 flex-wrap mt-2">
        <button
          onClick={() => setExportOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          Exporter sur Meta
        </button>

        {/* Bouton perf (visible si adAccountId déjà connu) */}
        {savedAdAccountId && (
          <button
            onClick={handleFetchPerformance}
            disabled={loadingPerf}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border border-border hover:bg-muted transition-colors"
          >
            {loadingPerf
              ? <RefreshCw className="w-3 h-3 animate-spin" />
              : <BarChart3 className="w-3 h-3" />}
            Performances
          </button>
        )}
      </div>
      )} {/* fin du bloc trigger conditionnel */}

      {/* ── Mini-rapport en ligne ─────────────────────────────────────────── */}
      {loadingPerf && (
        <div className="mt-2 space-y-1">
          <Skeleton className="h-3 w-full rounded" />
          <Skeleton className="h-8 w-full rounded-lg" />
        </div>
      )}
      {perfError && (
        <div className="mt-2 flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 rounded-md px-2 py-1.5 border border-amber-200 dark:border-amber-800">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          {perfError}
        </div>
      )}
      {metrics && <MiniPerformanceReport metrics={metrics} />}

      {/* ── Modal d'export ────────────────────────────────────────────────── */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
                <UploadCloud className="w-3.5 h-3.5 text-white" />
              </div>
              Exporter sur Meta Ads Manager
            </DialogTitle>
          </DialogHeader>

          {/* Résultat de l'export précédent */}
          {exportResult && (
            <div className={`rounded-lg p-3 mb-3 flex items-start gap-2.5 text-sm ${
              exportResult.success
                ? 'bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
                : 'bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-800'
            }`}>
              {exportResult.success
                ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                : <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
              <div className="min-w-0 flex-1">
                {exportResult.success ? (
                  <>
                    <p className="font-semibold text-emerald-700 dark:text-emerald-400">Campagne créée (brouillon)</p>
                    <p className="text-emerald-600 dark:text-emerald-300 text-xs mt-0.5">
                      ID : {exportResult.campaignId} · Ad Set : {exportResult.adSetId}
                    </p>
                    {exportResult.adsManagerUrl && (
                      <a href={exportResult.adsManagerUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-1.5 text-xs text-emerald-700 underline">
                        Ouvrir dans Ads Manager <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <p className="text-[10px] text-emerald-600/70 mt-1">Statut : PAUSED — activez manuellement dans Ads Manager.</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-red-700 dark:text-red-400">
                      Échec de l'export
                      {exportResult.metaErrorCode && <span className="ml-1 font-normal opacity-70">(code {exportResult.metaErrorCode})</span>}
                    </p>
                    <p className="text-red-600 dark:text-red-300 text-xs mt-0.5">{exportResult.error}</p>
                  </>
                )}
              </div>
              <button onClick={() => setExportResult(null)} className="text-muted-foreground hover:text-foreground shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Aperçu du texte */}
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground leading-relaxed mb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-foreground/50">Texte de l'annonce</p>
            <p className="line-clamp-3">{post.text}</p>
          </div>

          <div className="space-y-3">
            {/* Compte publicitaire */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground">ID du compte publicitaire Meta *</label>
              <input value={adAccountId} onChange={e => setAdAccountId(e.target.value)}
                placeholder="act_123456789" className={inputCls} />
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Trouvez votre ID dans <a href="https://adsmanager.facebook.com" target="_blank" rel="noopener noreferrer" className="underline">Gestionnaire de pubs</a> → paramètres du compte.
              </p>
            </div>

            {/* Objectif */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Objectif de la campagne *</label>
              <select value={objective} onChange={e => setObjective(e.target.value)} className={inputCls}>
                {OBJECTIVES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Budget */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Budget journalier (€) *</label>
                <input type="number" min="1" step="0.5" value={budget}
                  onChange={e => setBudget(e.target.value)} placeholder="10" className={inputCls} />
                <p className="text-[10px] text-muted-foreground mt-0.5">Min. 1€/jour</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Pays cible</label>
                <input value={targetCountry} onChange={e => setTargetCountry(e.target.value.toUpperCase())}
                  placeholder="FR" maxLength={2} className={inputCls} />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Début</label>
                <input type="date" value={post.date} readOnly className={`${inputCls} opacity-60 cursor-not-allowed`} />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Fin (optionnel)</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputCls} />
              </div>
            </div>

            {/* Âge */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Âge min</label>
                <input type="number" min="18" max="65" value={ageMin}
                  onChange={e => setAgeMin(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Âge max</label>
                <input type="number" min="18" max="65" value={ageMax}
                  onChange={e => setAgeMax(e.target.value)} className={inputCls} />
              </div>
            </div>

            {/* URL de destination */}
            {objective === 'LINK_CLICKS' && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground">URL de destination *</label>
                <input type="url" value={destinationUrl}
                  onChange={e => setDestinationUrl(e.target.value)}
                  placeholder="https://votre-site.fr" className={inputCls} />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => setExportOpen(false)}>
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleExport}
              disabled={exporting || !adAccountId || !budget}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {exporting
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Export en cours…</>
                : <><UploadCloud className="w-4 h-4" /> Créer dans Meta</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
