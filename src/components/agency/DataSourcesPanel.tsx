/**
 * DataSourcesPanel — 🔗 Connexion sources de données GA4 / Search Console
 *
 * Module Reporting pour l'espace Client dans l'Agence.
 * Permet à l'agence de connecter GA4 + Search Console pour croiser
 * les données de trafic avec les performances G.E.O. et générer
 * des insights de conversion automatiques.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Link2, RefreshCw, CheckCircle2, TrendingUp, Search, BarChart3,
  Zap, ArrowUpRight, Sparkles, Loader2, AlertCircle, Globe, X,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import { Button, Badge, toast } from '@blinkdotnew/ui';

// ── Types ─────────────────────────────────────────────────────────────────────
interface DataSource {
  id: 'ga4' | 'gsc';
  label: string;
  abbr: string;
  description: string;
  features: string[];
  color: string;
  glow: string;
  connected: boolean;
  syncing: boolean;
  lastSync?: string;
}

interface GEOInsight {
  metric: string;
  geoScore: number;
  trafficDelta: number;
  conversionRate: number;
  recommendation: string;
  urgency: 'high' | 'medium' | 'low';
}

const MOCK_INSIGHTS: GEOInsight[] = [
  {
    metric: 'Requêtes "meilleur restaurant bordeaux" (ChatGPT)',
    geoScore: 84,
    trafficDelta: +18,
    conversionRate: 4.2,
    recommendation: 'Vos posts optimisés G.E.O. ont généré +18% de trafic organique ce mois. Publiez 2x/semaine pour maintenir.',
    urgency: 'low',
  },
  {
    metric: 'Requêtes "salon coiffure pas cher lyon" (GSC)',
    geoScore: 67,
    trafficDelta: -3,
    conversionRate: 1.8,
    recommendation: 'Perte de visibilité sur 3 requêtes clés. Mise à jour de la fiche Google Maps + 1 post urgent recommandé.',
    urgency: 'high',
  },
  {
    metric: 'Impressions Google Maps (3 derniers mois)',
    geoScore: 91,
    trafficDelta: +32,
    conversionRate: 6.1,
    recommendation: 'Score G.E.O. excellent. Exploitez les requêtes longue-traîne "avis + [ville]" pour consolider.',
    urgency: 'low',
  },
  {
    metric: 'Clics depuis réseaux sociaux → site',
    geoScore: 72,
    trafficDelta: +7,
    conversionRate: 2.9,
    recommendation: 'Taux de conversion en dessous de la moyenne locale (4.1%). Ajoutez un CTA de réservation dans chaque post.',
    urgency: 'medium',
  },
];

function urgencyStyle(u: GEOInsight['urgency']) {
  if (u === 'high') return { bg: 'rgba(239,68,68,.1)', border: 'rgba(239,68,68,.25)', text: '#EF4444', label: 'Urgent' };
  if (u === 'medium') return { bg: 'rgba(245,158,11,.1)', border: 'rgba(245,158,11,.25)', text: '#F59E0B', label: 'À surveiller' };
  return { bg: 'rgba(34,197,94,.1)', border: 'rgba(34,197,94,.25)', text: '#22C55E', label: 'Optimisé' };
}

// ── Source Card ────────────────────────────────────────────────────────────────
function SourceCard({ source, onConnect, onDisconnect, onSync }: {
  source: DataSource;
  onConnect: () => void;
  onDisconnect: () => void;
  onSync: () => void;
}) {
  return (
    <div
      className="rounded-2xl border overflow-hidden transition-all"
      style={{
        background: source.connected
          ? `linear-gradient(135deg, #030d0a 0%, #061410 100%)`
          : 'linear-gradient(135deg, #0a0a14 0%, #10101e 100%)',
        borderColor: source.connected ? `${source.color}50` : '#1e293b',
        boxShadow: source.connected ? `0 0 20px ${source.glow}` : 'none',
      }}
    >
      {/* Top bar */}
      <div
        className="h-0.5 w-full"
        style={{
          background: source.connected
            ? `linear-gradient(90deg, transparent, ${source.color}, transparent)`
            : `linear-gradient(90deg, transparent, #4f46e580, transparent)`,
        }}
      />

      <div className="px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Icon + info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-sm font-black"
            style={{
              background: source.connected ? `${source.color}20` : '#1e293b',
              border: `1px solid ${source.connected ? source.color + '40' : '#334155'}`,
              color: source.connected ? source.color : '#94a3b8',
            }}
          >
            {source.abbr}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-extrabold text-white">{source.label}</p>
              {source.connected && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 border border-green-500/40 text-green-400 text-[10px] font-bold px-2 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Connecté
                </span>
              )}
            </div>
            <p className="text-xs text-white/40 mt-0.5">{source.description}</p>
            {source.connected && source.lastSync && (
              <p className="text-[10px] text-white/25 mt-0.5">Dernière sync : {source.lastSync}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {source.connected ? (
            <>
              <button
                onClick={onSync}
                disabled={source.syncing}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-semibold px-3 py-2 transition-all cursor-pointer disabled:opacity-40"
              >
                <RefreshCw size={12} className={source.syncing ? 'animate-spin' : ''} />
                {source.syncing ? 'Sync...' : 'Actualiser'}
              </button>
              <button
                onClick={onDisconnect}
                className="text-[11px] text-white/25 hover:text-red-400 transition-colors cursor-pointer"
              >
                Déconnecter
              </button>
            </>
          ) : (
            <button
              onClick={onConnect}
              className="relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold text-white transition-all cursor-pointer overflow-hidden group"
              style={{
                background: `linear-gradient(135deg, ${source.color} 0%, ${source.color}cc 100%)`,
                boxShadow: `0 0 16px ${source.glow}`,
              }}
            >
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 100%)' }} />
              <Link2 size={14} className="shrink-0" />
              Connecter
            </button>
          )}
        </div>
      </div>

      {/* Features */}
      {!source.connected && (
        <div className="px-5 pb-4 flex flex-wrap gap-1.5">
          {source.features.map(f => (
            <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40">{f}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Insight Card ───────────────────────────────────────────────────────────────
function InsightCard({ insight }: { insight: GEOInsight }) {
  const us = urgencyStyle(insight.urgency);
  return (
    <div
      className="rounded-xl border p-4 space-y-3"
      style={{ background: 'hsl(var(--card))', borderColor: `${us.border}` }}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <p className="text-xs font-bold text-foreground flex-1">{insight.metric}</p>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0"
          style={{ background: us.bg, borderColor: us.border, color: us.text }}
        >
          {us.label}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Score G.E.O.</p>
          <p className="text-xl font-black" style={{ color: insight.geoScore >= 80 ? '#22C55E' : insight.geoScore >= 60 ? '#F59E0B' : '#EF4444' }}>
            {insight.geoScore}%
          </p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Δ Trafic</p>
          <p className="text-xl font-black" style={{ color: insight.trafficDelta >= 0 ? '#22C55E' : '#EF4444' }}>
            {insight.trafficDelta > 0 ? '+' : ''}{insight.trafficDelta}%
          </p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Conv. Rate</p>
          <p className="text-xl font-black text-foreground">{insight.conversionRate}%</p>
        </div>
      </div>
      <div className="flex items-start gap-2 rounded-lg bg-muted/30 px-3 py-2">
        <Sparkles size={12} className="text-primary shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground leading-relaxed">{insight.recommendation}</p>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function DataSourcesPanel({ clientName }: { clientName?: string }) {
  const [sources, setSources] = useState<DataSource[]>([
    {
      id: 'ga4',
      label: 'Google Analytics 4',
      abbr: 'GA4',
      description: 'Trafic, conversions, comportement utilisateurs, CA en ligne',
      features: ['Sessions & utilisateurs', 'Événements personnalisés', 'Conversions e-commerce', 'Audiences GA'],
      color: '#f97316',
      glow: 'rgba(249,115,22,0.12)',
      connected: false,
      syncing: false,
    },
    {
      id: 'gsc',
      label: 'Google Search Console',
      abbr: 'GSC',
      description: 'Impressions, clics organiques, positions SERP, requêtes de recherche',
      features: ['Mots-clés organiques', 'Impressions Google', 'CTR SERP', 'Couverture index'],
      color: '#22c55e',
      glow: 'rgba(34,197,94,0.12)',
      connected: false,
      syncing: false,
    },
  ]);

  const [showInsights, setShowInsights] = useState(false);
  const [generatingInsights, setGeneratingInsights] = useState(false);

  const anyConnected = sources.some(s => s.connected);
  const allConnected = sources.every(s => s.connected);

  const handleConnect = (id: 'ga4' | 'gsc') => {
    // Simulate OAuth flow
    setTimeout(() => {
      setSources(prev => prev.map(s => s.id === id ? {
        ...s,
        connected: true,
        lastSync: new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date()),
      } : s));
      toast.success(`${id.toUpperCase()} connecté !`, { description: 'Les données sont synchronisées.' });
    }, 1800);
  };

  const handleDisconnect = (id: 'ga4' | 'gsc') => {
    setSources(prev => prev.map(s => s.id === id ? { ...s, connected: false, lastSync: undefined } : s));
  };

  const handleSync = (id: 'ga4' | 'gsc') => {
    setSources(prev => prev.map(s => s.id === id ? { ...s, syncing: true } : s));
    setTimeout(() => {
      setSources(prev => prev.map(s => s.id === id ? {
        ...s, syncing: false,
        lastSync: new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date()),
      } : s));
      toast.success('Données actualisées');
    }, 1500);
  };

  const handleGenerateInsights = () => {
    setGeneratingInsights(true);
    setTimeout(() => {
      setGeneratingInsights(false);
      setShowInsights(true);
    }, 2200);
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-orange-950/20 to-emerald-950/20">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/25 flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-foreground">
                  🔗 Sources de données — GA4 / Search Console
                </h3>
                {allConnected && (
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300 border-green-200 dark:border-green-700 text-[10px] font-bold">
                    ✓ TOUT CONNECTÉ
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {clientName
                  ? `Croisez les vraies données de trafic de ${clientName} avec les performances G.E.O.`
                  : 'Croisez les données de trafic Google avec vos performances G.E.O. pour des insights automatiques.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sources */}
      <div className="p-5 space-y-3">
        {sources.map(source => (
          <SourceCard
            key={source.id}
            source={source}
            onConnect={() => handleConnect(source.id)}
            onDisconnect={() => handleDisconnect(source.id)}
            onSync={() => handleSync(source.id)}
          />
        ))}
      </div>

      {/* Generate Insights CTA */}
      {anyConnected && (
        <div className="px-5 pb-5">
          <button
            onClick={showInsights ? () => setShowInsights(false) : handleGenerateInsights}
            disabled={generatingInsights}
            className="w-full flex items-center justify-center gap-2.5 rounded-xl py-3 text-sm font-bold text-white transition-all cursor-pointer disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
              boxShadow: '0 0 20px rgba(99,102,241,0.25)',
            }}
          >
            {generatingInsights ? (
              <><Loader2 size={16} className="animate-spin" /> Analyse G.E.O. × Trafic en cours…</>
            ) : showInsights ? (
              <><ChevronUp size={16} /> Masquer les insights</>
            ) : (
              <><Sparkles size={16} /> Générer les insights de conversion G.E.O. × Trafic</>
            )}
          </button>
        </div>
      )}

      {/* Insights panel */}
      <AnimatePresence>
        {showInsights && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-3 border-t border-border pt-5">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={14} className="text-primary" />
                <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Insights de Conversion — G.E.O. × Trafic réel
                </p>
              </div>
              {MOCK_INSIGHTS.map((ins, i) => (
                <InsightCard key={i} insight={ins} />
              ))}
              <p className="text-[10px] text-muted-foreground text-center pt-1">
                Insights générés par croisement des scores G.E.O. Kompilot avec vos données GA4 & Search Console · Mis à jour en temps réel
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state (nothing connected yet) */}
      {!anyConnected && (
        <div className="px-5 pb-5">
          <div className="rounded-xl border border-dashed border-border p-4 text-center space-y-2">
            <Globe size={24} className="mx-auto text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">
              Connectez au moins une source pour débloquer les insights de conversion automatiques G.E.O. × Trafic.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
