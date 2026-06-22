/**
 * OrganicTrafficTab — SEO keywords + referring domains for a funnel domain.
 * Replaces the "Soon" placeholder in the FunnelSidebar Organic tab.
 */
import { useState, useEffect } from 'react';
import { BACKEND_URL } from '../../config/api';
import { blink } from '../../blink/client';

interface Keyword {
  keyword: string;
  position: number;
  volume: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface ReferringDomain {
  domain: string;
  authority: number;
  trafficShare: number;
}

interface OrganicData {
  domain: string;
  estimatedOrganicTraffic: number;
  topKeywords: Keyword[];
  topReferringDomains: ReferringDomain[];
  lastRefreshedAt: string;
}

interface OrganicTrafficTabProps {
  funnelId: string;
  domain: string;
}

const DIFF_COLORS: Record<string, string> = {
  easy: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  hard: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

function Skeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex items-center gap-2 py-2">
          <div className="flex-1 h-3 bg-muted rounded" />
          <div className="w-8 h-3 bg-muted rounded" />
          <div className="w-12 h-3 bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}

export function OrganicTrafficTab({ funnelId, domain }: OrganicTrafficTabProps) {
  const [data, setData] = useState<OrganicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    async function load() {
      try {
        const token = await blink.auth.getValidToken();
        const res = await fetch(`${BACKEND_URL}/api/funnels/${funnelId}/organic`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(10_000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: OrganicData = await res.json();
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [funnelId]);

  if (loading) {
    return (
      <div className="space-y-5 py-2">
        <Skeleton />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center">
        <p className="text-[11px] text-muted-foreground">Impossible de charger les données organiques.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header KPI */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400">
          ~{data.estimatedOrganicTraffic.toLocaleString('fr-FR')}/mois visites organiques
        </span>
      </div>

      {/* Top keywords */}
      <div className="rounded-xl border border-border bg-card p-3.5 space-y-2">
        <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">🔑 Top SEO Keywords</p>
        <div className="space-y-1">
          {data.topKeywords.slice(0, 8).map((kw, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 border-b border-border/50 last:border-0">
              <span className="text-[10px] font-mono font-bold w-6 text-muted-foreground">#{kw.position}</span>
              <span className="flex-1 text-[11px] text-foreground font-medium truncate">{kw.keyword}</span>
              <span className="text-[10px] text-muted-foreground shrink-0">{kw.volume.toLocaleString('fr-FR')}/mo</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${DIFF_COLORS[kw.difficulty]}`}>
                {kw.difficulty}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Referring domains */}
      <div className="rounded-xl border border-border bg-card p-3.5 space-y-2">
        <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">🔗 Referring Domains</p>
        <div className="space-y-2">
          {data.topReferringDomains.slice(0, 6).map((rd, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-foreground">{rd.domain}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">DA {rd.authority}</span>
                  <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400">{rd.trafficShare}%</span>
                </div>
              </div>
              <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-teal-500"
                  style={{ width: `${Math.min(rd.trafficShare * 2, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        Données estimatives • Actualisées le {new Date(data.lastRefreshedAt).toLocaleDateString('fr-FR')}
      </p>
    </div>
  );
}
