/**
 * GA4CalendarInsights — Bloc de KPIs Google Analytics 4 pour le Campaign Calendar
 *
 * Affiche côte à côte avec les données Meta Ads :
 *   • Sessions GA4 filtrées sur le trafic Meta (facebook/cpc, instagram, meta)
 *   • Taux d'engagement moyen pondéré
 *   • Conversions (achats, leads) issues des campagnes Meta
 *   • Chiffre d'affaires généré
 *   • Graphique en barres des sessions par jour (30 jours)
 *
 * Visible uniquement pour les utilisateurs Agency (currentPlan.unlimited = true).
 * Les autres voient un paywall doux (upsell Agency).
 *
 * Usage dans CalendarPage :
 *   <GA4CalendarInsights dateRange="30d" />
 */

import { useState, useEffect, useCallback } from 'react';
import { blink } from '@/blink/client';
import { Skeleton } from '@blinkdotnew/ui';
import {
  TrendingUp, MousePointerClick, ShoppingCart, Euro,
  RefreshCw, AlertTriangle, BarChart3, Lock, Zap,
} from 'lucide-react';

const BACKEND_URL = 'https://gbrhsehk.backend.blink.new';

// ── Types (miroir de GA4Summary dans analyticsService.ts) ────────────────────

interface GA4DailyMetric {
  date:           string;
  source:         string;
  sessions:       number;
  engagementRate: number;
  eventCount:     number;
  conversions:    number;
  revenue:        number;
}

interface GA4Summary {
  totalSessions:      number;
  avgEngagementRate:  number;   // en %
  totalConversions:   number;
  totalRevenue:       number;
  topSource:          string;
  dailyBreakdown:     GA4DailyMetric[];
  dateRange:          { startDate: string; endDate: string };
  propertyId:         string;
  fetchedAt:          string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Formate un nombre avec séparateur de milliers */
function fmt(n: number, decimals = 0): string {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: decimals });
}

/** Retourne startDate / endDate pour les N derniers jours */
function getDateRange(days: number): { startDate: string; endDate: string } {
  const end   = new Date();
  const start = new Date(Date.now() - days * 86_400_000);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate:   end.toISOString().slice(0, 10),
  };
}

// ── Mini graphique en barres (sessions/jour) ──────────────────────────────────

function SessionsBarChart({ daily }: { daily: GA4DailyMetric[] }) {
  // Agrège les sessions par date (plusieurs sources possibles par date)
  const byDate: Record<string, number> = {};
  for (const d of daily) {
    byDate[d.date] = (byDate[d.date] ?? 0) + d.sessions;
  }

  const entries = Object.entries(byDate).sort((a, b) => a[0].localeCompare(b[0])).slice(-30);
  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-16 text-xs text-muted-foreground">
        Pas de données de session
      </div>
    );
  }

  const max = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="flex items-end gap-0.5 h-14 w-full" title="Sessions Meta par jour">
      {entries.map(([date, sessions]) => (
        <div
          key={date}
          className="flex-1 min-w-0 rounded-sm transition-all hover:opacity-80 cursor-default"
          style={{
            height:     `${Math.max((sessions / max) * 100, 4)}%`,
            background: 'linear-gradient(to top, #4F46E5, #818CF8)',
          }}
          title={`${date} — ${sessions} sessions`}
        />
      ))}
    </div>
  );
}

// ── Carte KPI ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  icon:    React.ReactNode;
  label:   string;
  value:   string;
  sub?:    string;
  color:   string;
  loading: boolean;
}

function KpiCard({ icon, label, value, sub, color, loading }: KpiCardProps) {
  return (
    <div className="flex flex-col gap-1.5 p-4 rounded-xl border border-border bg-card min-w-0">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span style={{ color }}>{icon}</span>
        <span className="text-[11px] font-bold uppercase tracking-widest truncate">{label}</span>
      </div>
      {loading ? (
        <Skeleton className="h-7 w-20 rounded" />
      ) : (
        <>
          <span className="text-2xl font-black leading-none" style={{ color }}>{value}</span>
          {sub && <span className="text-[10px] text-muted-foreground">{sub}</span>}
        </>
      )}
    </div>
  );
}

// ── Paywall doux pour non-Agency ──────────────────────────────────────────────

function AgencyPaywall() {
  return (
    <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/20 dark:to-violet-950/20 p-5 flex flex-col items-center gap-3 text-center">
      <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
        <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
      </div>
      <div>
        <p className="font-bold text-sm text-indigo-800 dark:text-indigo-300">
          Données GA4 — Forfait Agency
        </p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          Croisez vos conversions GA4 réelles avec vos stats Meta Ads. Disponible en forfait Agency (149€ HT/mois).
        </p>
      </div>
      <div className="flex items-center gap-2 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
        <Zap className="w-3 h-3" /> Passer en Agency
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

interface GA4CalendarInsightsProps {
  /** "30d" | "7d" | "90d" — plage de dates à afficher */
  dateRange?: '7d' | '30d' | '90d';
  /** Le plan courant — si false, affiche le paywall */
  isAgency?: boolean;
}

export function GA4CalendarInsights({
  dateRange = '30d',
  isAgency  = false,
}: GA4CalendarInsightsProps) {
  const days = dateRange === '7d' ? 7 : dateRange === '90d' ? 90 : 30;

  const [data,    setData]    = useState<GA4Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // ── Fetch GA4 ─────────────────────────────────────────────────────────────

  const fetchGA4 = useCallback(async () => {
    if (!isAgency) return;   // pas de fetch pour les non-agency
    setLoading(true);
    setError(null);

    try {
      const token = await blink.auth.getValidToken();
      const { startDate, endDate } = getDateRange(days);

      const res = await fetch(
        `${BACKEND_URL}/api/ga4/campaign-conversions?startDate=${startDate}&endDate=${endDate}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const json = await res.json() as GA4Summary & { error?: string; code?: string; hint?: string };

      if (!res.ok) {
        // Messages d'erreur contextuels selon le code
        if (json.code === 'GA4_CONFIG_ABSENT') {
          setError('Secrets GA4 non configurés. Ajoutez GA4_PROPERTY_ID, GA4_CLIENT_EMAIL et GA4_PRIVATE_KEY dans les secrets du projet.');
        } else if (json.code === 'GA4_AUTH_FAILED') {
          setError(`Authentification GA4 échouée. ${json.hint ?? 'Vérifiez les identifiants du compte de service.'}`);
        } else {
          setError(json.error ?? `Erreur HTTP ${res.status}`);
        }
        return;
      }

      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, [isAgency, days]);

  useEffect(() => { fetchGA4(); }, [fetchGA4]);

  // ── Paywall ───────────────────────────────────────────────────────────────

  if (!isAgency) return <AgencyPaywall />;

  // ── Rendu ─────────────────────────────────────────────────────────────────

  const label = dateRange === '7d' ? '7 derniers jours' : dateRange === '90d' ? '90 derniers jours' : '30 derniers jours';

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-gradient-to-r from-indigo-500/5 to-violet-500/5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
            <BarChart3 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground leading-tight">
              Google Analytics 4 — Trafic Meta
            </p>
            <p className="text-[10px] text-muted-foreground">{label} · Filtre : facebook / instagram / meta</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data && (
            <span className="text-[10px] text-muted-foreground">
              {new Date(data.fetchedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={fetchGA4}
            disabled={loading}
            title="Actualiser"
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Erreur */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">{error}</p>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="Sessions"
            value={loading ? '–' : fmt(data?.totalSessions ?? 0)}
            sub="via campagnes Meta"
            color="#4F46E5"
            loading={loading}
          />
          <KpiCard
            icon={<MousePointerClick className="w-4 h-4" />}
            label="Engagement"
            value={loading ? '–' : `${fmt(data?.avgEngagementRate ?? 0, 1)} %`}
            sub="taux moyen pondéré"
            color="#0D9488"
            loading={loading}
          />
          <KpiCard
            icon={<ShoppingCart className="w-4 h-4" />}
            label="Conversions"
            value={loading ? '–' : fmt(data?.totalConversions ?? 0)}
            sub="achats + leads"
            color="#7C3AED"
            loading={loading}
          />
          <KpiCard
            icon={<Euro className="w-4 h-4" />}
            label="CA généré"
            value={loading ? '–' : `${fmt(data?.totalRevenue ?? 0, 2)} €`}
            sub="via Meta → GA4"
            color="#D97706"
            loading={loading}
          />
        </div>

        {/* Graphique sessions par jour */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Sessions Meta / jour
          </p>
          {loading ? (
            <Skeleton className="h-14 w-full rounded-lg" />
          ) : data?.dailyBreakdown.length ? (
            <SessionsBarChart daily={data.dailyBreakdown} />
          ) : !error ? (
            <div className="flex items-center justify-center h-14 text-xs text-muted-foreground rounded-lg border border-dashed border-border">
              Aucune session Meta trouvée sur cette période.
            </div>
          ) : null}
        </div>

        {/* Source principale + note */}
        {data && !loading && (
          <div className="flex items-center justify-between pt-1 border-t border-border/50">
            <span className="text-[11px] text-muted-foreground">
              Source principale : <span className="font-semibold text-foreground">{data.topSource}</span>
            </span>
            <span className="text-[10px] text-muted-foreground">
              Propriété GA4 : {data.propertyId}
            </span>
          </div>
        )}

        {/* Note méthodologique */}
        <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
          Données issues de la dimension <code className="font-mono bg-muted px-1 rounded">sessionSourceMedium</code> filtrée sur facebook/instagram/meta.
          Les conversions correspondent aux événements GA4 marqués comme objectifs de conversion (achats, leads).
        </p>
      </div>
    </div>
  );
}
