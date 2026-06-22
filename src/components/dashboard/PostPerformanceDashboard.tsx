/**
 * PostPerformanceDashboard
 * Full performance tracking section for posts generated and scheduled via Kompilot.
 * Includes KPI cards, trend chart, channel comparison, and per-post table.
 */
import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  BarChart3, RefreshCw, TrendingUp, Eye, MousePointerClick, ChevronDown, ChevronUp,
  Sparkles, Info, Wifi, WifiOff, Loader2,
} from 'lucide-react';
import {
  getChannelSummaries,
  getWeeklyTrends,
  type PostPerformanceMetrics,
} from './PostPerformanceData';
import { PostPerformanceKPIs } from './PostPerformanceKPIs';
import { WeeklyTrendChart, ChannelBarChart, EngagementRateList } from './PostPerformanceCharts';
import { PostPerformanceTable } from './PostPerformanceTable';
import { fetchCombinedAnalytics } from '../../lib/analyticsApi';
import { blink } from '../../blink/client';

type MetricTab = 'reach' | 'engagement' | 'clicks';
type ChartView = 'trend' | 'channels' | 'engRate';

const METRIC_TABS: { key: MetricTab; label: string; icon: React.ReactNode }[] = [
  { key: 'reach',      label: 'Portée',     icon: <Eye size={14} /> },
  { key: 'engagement', label: 'Engagement', icon: <TrendingUp size={14} /> },
  { key: 'clicks',     label: 'Clics',      icon: <MousePointerClick size={14} /> },
];

const CHART_VIEWS: { key: ChartView; label: string }[] = [
  { key: 'trend',    label: 'Évolution hebdomadaire' },
  { key: 'channels', label: 'Par canal' },
  { key: 'engRate',  label: 'Taux d\'engagement' },
];

export function PostPerformanceDashboard() {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<PostPerformanceMetrics[]>([]);
  const [dataSource, setDataSource] = useState<'live' | 'mock'>('mock');
  const [metaConnected, setMetaConnected] = useState(false);
  const [gmbConnected, setGmbConnected] = useState(false);
  const [metricTab, setMetricTab] = useState<MetricTab>('reach');
  const [chartView, setChartView] = useState<ChartView>('trend');
  const [tableExpanded, setTableExpanded] = useState(true);
  const [chartsExpanded, setChartsExpanded] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Get user auth token to pass to backend
      const token = await blink.auth.getValidToken().catch(() => undefined);
      const result = await fetchCombinedAnalytics(undefined, undefined, token ?? undefined);
      setPosts(result.posts);
      setDataSource(result.dataSource);
      setMetaConnected(result.meta.connected);
      setGmbConnected(result.gmb.connected);
    } catch {
      // Silent fallback already handled in fetchCombinedAnalytics
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const summaries = useMemo(() => getChannelSummaries(posts), [posts]);
  const trends = useMemo(() => getWeeklyTrends(posts), [posts]);

  const handleRefresh = () => { load(); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Section header ── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: 16, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'rgba(99,89,248,.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <BarChart3 size={20} style={{ color: '#6359F8' }} />
          </div>
          <div>
            <h2 style={{ fontWeight: 900, fontSize: '1rem', color: 'hsl(var(--foreground))', margin: 0 }}>
              Performance des Publications
            </h2>
            <p style={{ fontSize: '.73rem', color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>
              Engagement, portée et clics pour tous les posts générés via Kompilot
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Data source badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: dataSource === 'live' ? 'rgba(22,163,74,.1)' : 'rgba(99,89,248,.08)',
            border: `1px solid ${dataSource === 'live' ? 'rgba(22,163,74,.25)' : 'rgba(99,89,248,.2)'}`,
            borderRadius: 20, padding: '5px 12px',
            fontSize: '.72rem', color: dataSource === 'live' ? '#16A34A' : '#6359F8', fontWeight: 600,
          }}>
            {dataSource === 'live'
              ? <><Wifi size={12} /> Données en direct</>
              : <><Sparkles size={12} /> Données simulées</>
            }
          </div>
          {/* Platform connection badges */}
          {[
            { label: 'Meta', connected: metaConnected },
            { label: 'GMB', connected: gmbConnected },
          ].map(p => (
            <div key={p.label} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: p.connected ? 'rgba(22,163,74,.08)' : 'rgba(148,163,184,.08)',
              border: `1px solid ${p.connected ? 'rgba(22,163,74,.2)' : 'rgba(148,163,184,.2)'}`,
              borderRadius: 20, padding: '4px 10px',
              fontSize: '.68rem', color: p.connected ? '#16A34A' : '#94A3B8', fontWeight: 600,
            }}>
              {p.connected ? <Wifi size={10} /> : <WifiOff size={10} />}
              {p.label}
            </div>
          ))}
          <button
            onClick={handleRefresh}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))',
              color: 'hsl(var(--foreground))', borderRadius: 8, padding: '7px 12px',
              fontSize: '.78rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading
              ? <Loader2 size={13} style={{ animation: 'spin .7s linear infinite' }} />
              : <RefreshCw size={13} />
            }
            Actualiser
          </button>
        </div>
      </div>

      {/* ── Loading skeleton ── */}
      {loading && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{
              flex: 1, minWidth: 160, height: 100, borderRadius: 16,
              background: 'hsl(var(--muted))', animation: 'pulse 1.5s ease-in-out infinite',
              animationDelay: `${i * 100}ms`,
            }} />
          ))}
          <style>{`@keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}`}</style>
        </div>
      )}

      {/* ── KPI cards ── */}
      {!loading && <PostPerformanceKPIs posts={posts} />}

      {/* ── Charts section ── */}
      {!loading && (
      <div style={{
        background: 'hsl(var(--card))',
        border: '1.5px solid hsl(var(--border))',
        borderRadius: 18, overflow: 'hidden',
      }}>
        <div
          onClick={() => setChartsExpanded(e => !e)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 18px', cursor: 'pointer',
            borderBottom: chartsExpanded ? '1px solid hsl(var(--border))' : 'none',
            background: 'linear-gradient(135deg, rgba(99,89,248,.05) 0%, transparent 100%)',
          }}
        >
          <p style={{ fontWeight: 800, fontSize: '.9rem', color: 'hsl(var(--foreground))' }}>
            📈 Graphiques de performance
          </p>
          {chartsExpanded ? <ChevronUp size={16} style={{ color: 'hsl(var(--muted-foreground))' }} /> : <ChevronDown size={16} style={{ color: 'hsl(var(--muted-foreground))' }} />}
        </div>

        {chartsExpanded && (
          <div style={{ padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 4, background: 'hsl(var(--muted))', borderRadius: 10, padding: 3 }}>
                {CHART_VIEWS.map(v => (
                  <button
                    key={v.key}
                    onClick={() => setChartView(v.key)}
                    style={{
                      padding: '5px 12px', borderRadius: 8,
                      background: chartView === v.key ? 'hsl(var(--card))' : 'transparent',
                      border: chartView === v.key ? '1px solid hsl(var(--border))' : 'none',
                      color: chartView === v.key ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                      fontWeight: chartView === v.key ? 700 : 500,
                      fontSize: '.78rem', cursor: 'pointer', whiteSpace: 'nowrap',
                      boxShadow: chartView === v.key ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
                    }}
                  >{v.label}</button>
                ))}
              </div>
              {chartView === 'trend' && (
                <div style={{ display: 'flex', gap: 6 }}>
                  {METRIC_TABS.map(m => (
                    <button
                      key={m.key}
                      onClick={() => setMetricTab(m.key)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '5px 12px',
                        background: metricTab === m.key ? '#6359F8' : 'hsl(var(--muted))',
                        border: `1.5px solid ${metricTab === m.key ? '#6359F8' : 'hsl(var(--border))'}`,
                        color: metricTab === m.key ? '#fff' : 'hsl(var(--foreground))',
                        borderRadius: 8, fontWeight: 600, fontSize: '.78rem', cursor: 'pointer',
                        transition: 'all .15s',
                      }}
                    >{m.icon}{m.label}</button>
                  ))}
                </div>
              )}
            </div>
            {chartView === 'trend' && <WeeklyTrendChart data={trends} activeMetric={metricTab} />}
            {chartView === 'channels' && <ChannelBarChart summaries={summaries} />}
            {chartView === 'engRate' && <div style={{ padding: '8px 0' }}><EngagementRateList summaries={summaries} /></div>}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5, marginTop: 12,
              padding: '8px 12px', background: 'hsl(var(--muted))', borderRadius: 8,
            }}>
              <Info size={12} style={{ color: 'hsl(var(--muted-foreground))', flexShrink: 0 }} />
              <span style={{ fontSize: '.68rem', color: 'hsl(var(--muted-foreground))' }}>
                {dataSource === 'live'
                  ? 'Données en direct depuis Meta Insights et Google My Business.'
                  : 'Données simulées — ajoutez META_ACCESS_TOKEN + META_PAGE_ID (Meta) ou GMB_ACCESS_TOKEN + GMB_ACCOUNT_ID (Google) dans Secrets pour connecter vos vraies statistiques.'}
              </span>
            </div>
          </div>
        )}
      </div>
      )}

      {/* ── Per-post table ── */}
      {!loading && (
      <div style={{
        background: 'hsl(var(--card))',
        border: '1.5px solid hsl(var(--border))',
        borderRadius: 18, overflow: 'hidden',
      }}>
        <div
          onClick={() => setTableExpanded(e => !e)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 18px', cursor: 'pointer',
            borderBottom: tableExpanded ? '1px solid hsl(var(--border))' : 'none',
            background: 'linear-gradient(135deg, rgba(99,89,248,.05) 0%, transparent 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <p style={{ fontWeight: 800, fontSize: '.9rem', color: 'hsl(var(--foreground))' }}>
              📋 Détail par publication
            </p>
            <span style={{
              background: '#6359F8', color: '#fff',
              borderRadius: 20, padding: '2px 9px', fontSize: '.68rem', fontWeight: 700,
            }}>
              {posts.filter(p => p.status === 'published').length} publiés
            </span>
          </div>
          {tableExpanded ? <ChevronUp size={16} style={{ color: 'hsl(var(--muted-foreground))' }} /> : <ChevronDown size={16} style={{ color: 'hsl(var(--muted-foreground))' }} />}
        </div>
        {tableExpanded && <PostPerformanceTable posts={posts} />}
      </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
