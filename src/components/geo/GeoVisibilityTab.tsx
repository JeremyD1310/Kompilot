/**
 * GeoVisibilityTab — Visibilité LLM
 * KPI row + per-engine cards + recent query results table
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Globe, Search, TrendingUp, TrendingDown, BarChart3,
  Eye, CheckCircle2, XCircle, Clock, Copy, Check, ExternalLink,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, toast } from '@blinkdotnew/ui';
import {
  MOCK_GEO_VISIBILITY_TRACKERS,
  MOCK_GEO_LLM_RESULTS,
} from '../../lib/demoMockData';

const ENGINE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  openai: { label: 'ChatGPT', color: 'text-emerald-700', bg: 'bg-emerald-50', icon: '🤖' },
  claude: { label: 'Claude', color: 'text-violet-700', bg: 'bg-violet-50', icon: '🧠' },
  perplexity: { label: 'Perplexity', color: 'text-sky-700', bg: 'bg-sky-50', icon: '🔍' },
  gemini: { label: 'Gemini', color: 'text-amber-700', bg: 'bg-amber-50', icon: '✨' },
};

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35 } }),
};

export function GeoVisibilityTab() {
  const tracker = MOCK_GEO_VISIBILITY_TRACKERS[0];
  const results = MOCK_GEO_LLM_RESULTS;

  // Compute KPIs
  const totalMentions = results.filter((r) => r.brandMentioned === 1).length;
  const totalQueries = results.length;
  const mentionedResults = results.filter((r) => r.brandMentioned === 1 && r.brandPosition != null);
  const avgPosition = mentionedResults.length > 0
    ? (mentionedResults.reduce((s, r) => s + (r.brandPosition ?? 0), 0) / mentionedResults.length).toFixed(1)
    : '—';

  // Per-engine aggregation
  const engines = Object.keys(ENGINE_CONFIG).map((key) => {
    const engineResults = results.filter((r) => r.engine === key);
    const mentioned = engineResults.filter((r) => r.brandMentioned === 1);
    const positions = mentioned.filter((r) => r.brandPosition != null).map((r) => r.brandPosition as number);
    const avgPos = positions.length > 0 ? (positions.reduce((a, b) => a + b, 0) / positions.length).toFixed(1) : '—';
    const latestDate = engineResults.length > 0
      ? new Date(engineResults[engineResults.length - 1].checkedAt).toLocaleDateString('fr-FR')
      : '—';
    const positiveCount = engineResults.filter((r) => r.sentiment === 'positive').length;
    const sentiment = positiveCount > engineResults.length / 2 ? 'positif' : engineResults.length > 0 ? 'neutre' : '—';
    return {
      key,
      ...ENGINE_CONFIG[key],
      mentionCount: mentioned.length,
      total: engineResults.length,
      avgPosition: avgPos,
      lastCheck: latestDate,
      sentiment,
      isMentioned: mentioned.length > 0,
    };
  });

  const kpis = [
    { label: 'Score GEO Global', value: `${tracker.overallVisibilityScore}/100`, icon: <BarChart3 className="h-5 w-5" />, color: tracker.overallVisibilityScore >= 50 ? 'text-emerald-600' : 'text-amber-600' },
    { label: 'Mentions marque', value: `${totalMentions}/${totalQueries}`, icon: <Eye className="h-5 w-5" />, color: 'text-primary' },
    { label: 'Requêtes suivies', value: String(totalQueries), icon: <Search className="h-5 w-5" />, color: 'text-primary' },
    { label: 'Position moyenne', value: String(avgPosition), icon: <TrendingUp className="h-5 w-5" />, color: 'text-primary' },
  ];

  const [copiedQuery, setCopiedQuery] = useState<string | null>(null);

  const handleCopyQuery = (query: string) => {
    navigator.clipboard.writeText(query);
    setCopiedQuery(query);
    toast.success('Requête copiée !');
    setTimeout(() => setCopiedQuery(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} custom={i} initial="hidden" animate="visible" variants={fadeIn}>
            <Card className="card-hover">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <span className={kpi.color}>{kpi.icon}</span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    <p className={`text-xl font-semibold ${kpi.color}`}>{kpi.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Per-Engine Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {engines.map((eng, i) => (
          <motion.div key={eng.key} custom={i + 4} initial="hidden" animate="visible" variants={fadeIn}>
            <Card className="card-hover h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <span className="text-lg">{eng.icon}</span>
                    {eng.label}
                  </CardTitle>
                  <Badge variant={eng.isMentioned ? 'default' : 'secondary'} className="text-xs">
                    {eng.isMentioned ? 'Mentionné' : 'Non trouvé'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mentions</span>
                  <span className="font-medium">{eng.mentionCount}/{eng.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Position moy.</span>
                  <span className="font-medium">{eng.avgPosition}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sentiment</span>
                  <Badge variant={eng.sentiment === 'positif' ? 'default' : 'secondary'} className="text-xs">
                    {eng.sentiment}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Dernier check</span>
                  <span className="text-xs flex items-center gap-1">
                    <Clock className="h-3 w-3" />{eng.lastCheck}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Results Table */}
      <motion.div custom={8} initial="hidden" animate="visible" variants={fadeIn}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" />
              Résultats récents des requêtes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Requête</th>
                    <th className="pb-3 pr-4 font-medium">Moteur</th>
                    <th className="pb-3 pr-4 font-medium">Mentionné</th>
                    <th className="pb-3 pr-4 font-medium">Position</th>
                    <th className="pb-3 pr-4 font-medium">URL citée</th>
                    <th className="pb-3 pr-4 font-medium">Sentiment</th>
                    <th className="pb-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => {
                    const engCfg = ENGINE_CONFIG[r.engine] ?? { label: r.engine, icon: '❓', color: '', bg: '' };
                    return (
                      <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-3 pr-4">
                          <button
                            onClick={() => handleCopyQuery(r.queryText)}
                            className="flex items-center gap-1.5 text-left hover:text-primary transition-colors group"
                          >
                            <span className="max-w-[200px] truncate">{r.queryText}</span>
                            {copiedQuery === r.queryText
                              ? <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                              : <Copy className="h-3 w-3 opacity-0 group-hover:opacity-60 shrink-0 transition-opacity" />}
                          </button>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${engCfg.bg} ${engCfg.color}`}>
                            {engCfg.icon} {engCfg.label}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          {r.brandMentioned === 1
                            ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            : <XCircle className="h-4 w-4 text-muted-foreground/40" />}
                        </td>
                        <td className="py-3 pr-4 font-medium">
                          {r.brandPosition != null ? `#${r.brandPosition}` : '—'}
                        </td>
                        <td className="py-3 pr-4">
                          {r.urlCited === 1 && r.urlCitedText ? (
                            <span className="flex items-center gap-1 text-primary text-xs">
                              <ExternalLink className="h-3 w-3" />
                              <span className="truncate max-w-[120px]">{r.urlCitedText}</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">Non citée</span>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant={r.sentiment === 'positive' ? 'default' : 'secondary'} className="text-xs">
                            {r.sentiment}
                          </Badge>
                        </td>
                        <td className="py-3 text-xs text-muted-foreground">
                          {new Date(r.checkedAt).toLocaleDateString('fr-FR')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
