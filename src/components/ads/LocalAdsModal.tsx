import { useState, useEffect, useRef } from 'react';
import {
  X, MapPin, Wallet, Sparkles, Rocket, ShieldCheck, Target,
  BarChart2, TrendingUp, Eye, Users, MousePointerClick, CalendarClock,
  RefreshCw, ArrowUpRight, Zap, FlaskConical,
} from 'lucide-react';
import { Button, toast } from '@blinkdotnew/ui';
import { cn } from '../../lib/utils';
import { AbTestPanel } from './AbTestPanel';

// ── Types ─────────────────────────────────────────────────────────────────────

interface LocalAdsModalProps {
  open: boolean;
  postTitle?: string;
  onClose: () => void;
}

type ModalTab = 'config' | 'analytics' | 'abtest';

// ── Constants ─────────────────────────────────────────────────────────────────

const BUDGETS = [
  { value: 30,  label: '30 €',  desc: 'Portée estimée : ~1 200 personnes' },
  { value: 50,  label: '50 €',  desc: 'Portée estimée : ~2 500 personnes', popular: true },
  { value: 100, label: '100 €', desc: 'Portée estimée : ~6 000 personnes' },
];

const PLATFORM_CHIPS = [
  { id: 'facebook',  label: 'Facebook',  color: 'bg-blue-500' },
  { id: 'instagram', label: 'Instagram', color: 'bg-pink-500' },
];

// Budget → reach multiplier
const REACH_BASE: Record<number, number> = { 30: 1200, 50: 2500, 100: 6000 };

// ── Analytics helpers ─────────────────────────────────────────────────────────

/** Deterministic pseudo-random to avoid re-seeding jitter */
function seededRand(seed: number, offset = 0) {
  const x = Math.sin(seed + offset) * 10000;
  return x - Math.floor(x);
}

function buildSparkline(budget: number, tick: number): number[] {
  const base = REACH_BASE[budget] ?? 2500;
  return Array.from({ length: 7 }, (_, i) => {
    const progress = Math.min(1, (tick + i * 3) / 80);
    return Math.round(base * (0.10 + 0.90 * progress) * (0.85 + 0.3 * seededRand(budget + i, tick)));
  });
}

interface LiveMetric { reach: number; impressions: number; clicks: number; ctr: number; rdv: number; cpc: number }

function computeMetrics(budget: number, tick: number, radius: number): LiveMetric {
  const base = REACH_BASE[budget] ?? 2500;
  const progress = Math.min(1, tick / 80);
  const noise = 0.92 + 0.16 * seededRand(budget + tick, radius);
  const reach      = Math.round(base * progress * noise);
  const impressions = Math.round(reach * (1.6 + 0.4 * seededRand(tick + 1, budget)));
  const ctr        = +(2.8 + 1.2 * seededRand(tick + 2, radius)).toFixed(1);
  const clicks      = Math.round(impressions * (ctr / 100));
  const rdv         = Math.round(clicks * (0.08 + 0.05 * seededRand(tick + 3, budget)));
  const cpc         = clicks > 0 ? +(budget * progress / clicks).toFixed(2) : 0;
  return { reach, impressions, clicks, ctr, rdv, cpc };
}

// Live feed events
const FEED_TEMPLATES = [
  (km: number) => `👤 Nouveau profil atteint à ${km} km`,
  () => '📱 Impression sur Instagram',
  () => '🖱️ Clic sur le bouton "En savoir plus"',
  (km: number) => `📍 Vue depuis ${km} km`,
  () => '❤️ Like sur Facebook',
  () => '📞 Clic sur "Appeler"',
  () => '🗓️ Clic sur "Réserver"',
  () => '👁️ Story visionnée',
];

interface FeedItem { id: number; text: string; ts: string }

// ── Sub-components ────────────────────────────────────────────────────────────

function MetricKpi({
  icon, label, value, sub, accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-3 space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className={cn('text-xl font-extrabold tabular-nums', accent ?? 'text-foreground')}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground leading-tight">{sub}</p>}
    </div>
  );
}

function Sparkline({ values, color = '#7c3aed' }: { values: number[]; color?: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-0.5 h-8">
      {values.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm transition-all duration-500"
          style={{ height: `${Math.max(8, Math.round((v / max) * 100))}%`, backgroundColor: color, opacity: 0.6 + 0.4 * (i / values.length) }}
        />
      ))}
    </div>
  );
}

// ── Analytics panel ───────────────────────────────────────────────────────────

function AnalyticsPanel({ budget, radius, launched }: { budget: number; radius: number; launched: boolean }) {
  const [tick, setTick]     = useState(launched ? 40 : 0);
  const [metrics, setMetrics] = useState<LiveMetric>(() => computeMetrics(budget, launched ? 40 : 0, radius));
  const [sparkline, setSparkline] = useState(() => buildSparkline(budget, launched ? 40 : 0));
  const [feed, setFeed]     = useState<FeedItem[]>([]);
  const [pulse, setPulse]   = useState(false);
  const tickRef = useRef(launched ? 40 : 0);
  const feedIdRef = useRef(0);

  useEffect(() => {
    if (!launched) return;
    const interval = setInterval(() => {
      tickRef.current = Math.min(80, tickRef.current + 1);
      const t = tickRef.current;
      setTick(t);
      setMetrics(computeMetrics(budget, t, radius));
      setSparkline(buildSparkline(budget, t));
      setPulse(true);
      setTimeout(() => setPulse(false), 300);

      // Occasionally push a live feed event
      if (Math.random() < 0.55) {
        const tpl = FEED_TEMPLATES[Math.floor(Math.random() * FEED_TEMPLATES.length)];
        const km = Math.round(1 + Math.random() * radius);
        const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const item: FeedItem = { id: ++feedIdRef.current, text: tpl(km), ts: now };
        setFeed(prev => [item, ...prev].slice(0, 12));
      }
    }, 1600);
    return () => clearInterval(interval);
  }, [launched, budget, radius]);

  const pct = Math.round((tick / 80) * 100);
  const dayElapsed = Math.max(0, Math.round((tick / 80) * 7 * 10) / 10);

  return (
    <div className="space-y-4">
      {/* Campaign progress */}
      <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn(
              'w-2 h-2 rounded-full shrink-0',
              launched ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/40'
            )} />
            <span className="text-xs font-bold text-foreground">
              {launched ? 'Campagne active' : 'Campagne non lancée'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <CalendarClock size={12} />
            {launched ? `Jour ${dayElapsed} / 7` : '—'}
          </div>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500 transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{pct}% du budget diffusé</span>
          <span className="font-semibold text-foreground">
            {launched ? `${budget} € · ${radius} km` : 'Configurez et lancez'}
          </span>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <MetricKpi
          icon={<Eye size={12} />}
          label="Portée"
          value={metrics.reach.toLocaleString('fr-FR')}
          sub="personnes atteintes"
          accent="text-violet-600"
        />
        <MetricKpi
          icon={<Users size={12} />}
          label="Impressions"
          value={metrics.impressions.toLocaleString('fr-FR')}
          sub="affichages totaux"
        />
        <MetricKpi
          icon={<MousePointerClick size={12} />}
          label="Clics"
          value={metrics.clicks.toLocaleString('fr-FR')}
          sub={`CTR ${metrics.ctr}%`}
          accent="text-emerald-600"
        />
        <MetricKpi
          icon={<TrendingUp size={12} />}
          label="RDV générés"
          value={String(metrics.rdv)}
          sub="estimés"
          accent="text-emerald-600"
        />
        <MetricKpi
          icon={<Zap size={12} />}
          label="Coût / clic"
          value={metrics.cpc > 0 ? `${metrics.cpc} €` : '—'}
          sub="CPC moyen"
        />
        <MetricKpi
          icon={<ArrowUpRight size={12} />}
          label="ROI estimé"
          value={metrics.rdv > 0 ? `×${Math.round((metrics.rdv * 45) / budget * 10) / 10}` : '—'}
          sub="CA / budget"
          accent="text-amber-600"
        />
      </div>

      {/* Reach sparkline */}
      <div className="rounded-xl border border-border bg-card px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
            <BarChart2 size={12} className="text-violet-500" /> Portée par jour
          </p>
          <div className={cn(
            'flex items-center gap-1 text-[10px] font-semibold transition-colors',
            pulse ? 'text-emerald-600' : 'text-muted-foreground'
          )}>
            <RefreshCw size={10} className={launched ? 'animate-spin' : ''} />
            {launched ? 'Live' : 'Inactif'}
          </div>
        </div>
        <Sparkline values={sparkline} />
        <div className="flex justify-between text-[9px] text-muted-foreground">
          {['J1', 'J2', 'J3', 'J4', 'J5', 'J6', 'J7'].map(d => (
            <span key={d}>{d}</span>
          ))}
        </div>
      </div>

      {/* Live feed */}
      {launched && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <p className="text-[11px] font-bold text-foreground">Activité en direct</p>
          </div>
          <div className="divide-y divide-border max-h-[130px] overflow-y-auto">
            {feed.length === 0 ? (
              <p className="px-3 py-3 text-[11px] text-muted-foreground italic">En attente d'activité…</p>
            ) : (
              feed.map(item => (
                <div key={item.id} className="flex items-center justify-between px-3 py-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <span className="text-[11px] text-foreground">{item.text}</span>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0 ml-2">{item.ts}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {!launched && (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <Sparkles size={14} className="text-amber-600 shrink-0" />
          <p className="text-[11px] text-amber-800 leading-snug">
            Lancez votre campagne pour voir les métriques en temps réel s'animer ici.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function LocalAdsModal({ open, postTitle, onClose }: LocalAdsModalProps) {
  const [tab, setTab]         = useState<ModalTab>('config');
  const [radius, setRadius]   = useState(5);
  const [budget, setBudget]   = useState(50);
  const [launching, setLaunching] = useState(false);
  const [launched, setLaunched]   = useState(false);

  // Reset on open
  useEffect(() => {
    if (open) {
      setTab('config');
      setLaunched(false);
    }
  }, [open]);

  const handleLaunch = async () => {
    setLaunching(true);
    await new Promise(r => setTimeout(r, 1400));
    setLaunching(false);
    setLaunched(true);
    setTab('analytics');
    toast.success('🚀 Campagne publicitaire lancée !', {
      description: `Diffusion dans ${radius} km — budget ${budget} € / 7 jours. Suivez les métriques en direct.`,
    });
  };

  if (!open) return null;

  const selectedBudget = BUDGETS.find(b => b.value === budget)!;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-foreground/25 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start gap-3 px-5 py-4 border-b border-border bg-gradient-to-r from-violet-50 to-emerald-50 dark:from-violet-950/30 dark:to-emerald-950/20 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-emerald-500 flex items-center justify-center shrink-0 shadow-md">
              <Target size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold text-foreground">Attirer de nouveaux clients autour de votre établissement</p>
              {postTitle && (
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  Publicité pour : <span className="font-semibold text-foreground">{postTitle}</span>
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <X size={15} />
            </button>
          </div>

          {/* Tab switcher */}
          <div className="flex items-center gap-1 px-5 pt-3 shrink-0">
            <button
              onClick={() => setTab('config')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                tab === 'config'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <Target size={12} /> Configurer
            </button>
            <button
              onClick={() => setTab('analytics')}
              className={cn(
                'relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                tab === 'analytics'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <BarChart2 size={12} /> Performance
              {launched && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>
            <button
              onClick={() => setTab('abtest')}
              className={cn(
                'relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                tab === 'abtest'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <FlaskConical size={12} /> Test A/B
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">

            {/* ── CONFIG TAB ── */}
            {tab === 'config' && (
              <>
                {/* Zone 1 — Ciblage géographique */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                      <MapPin size={13} className="text-violet-600" />
                    </div>
                    <p className="text-xs font-bold text-foreground uppercase tracking-wide">Zone géographique</p>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/20 px-4 py-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-foreground">Ciblez les clients à proximité :</p>
                      <span className="text-sm font-extrabold text-violet-600 tabular-nums bg-violet-50 border border-violet-200 rounded-lg px-2.5 py-1">
                        {radius} km
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1} max={25} step={1} value={radius}
                      onChange={e => setRadius(+e.target.value)}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer accent-violet-600"
                      style={{ background: `linear-gradient(to right, #7c3aed ${(radius / 25) * 100}%, #e5e7eb ${(radius / 25) * 100}%)` }}
                    />
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>1 km</span>
                      <span className="font-semibold">autour de votre adresse</span>
                      <span>25 km</span>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <p className="text-[11px] text-muted-foreground">Diffusion sur :</p>
                      {PLATFORM_CHIPS.map(p => (
                        <span key={p.id} className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${p.color}`}>
                          {p.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Zone 2 — Budget */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                      <Wallet size={13} className="text-emerald-600" />
                    </div>
                    <p className="text-xs font-bold text-foreground uppercase tracking-wide">Budget — 7 jours de diffusion</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    {BUDGETS.map(b => (
                      <button
                        key={b.value}
                        onClick={() => setBudget(b.value)}
                        className={cn(
                          'relative rounded-xl border p-3 text-center transition-all',
                          budget === b.value
                            ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-400/40 shadow-sm'
                            : 'border-border hover:border-emerald-300 hover:bg-emerald-50/40',
                        )}
                      >
                        {b.popular && (
                          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 text-white text-[8px] font-bold uppercase tracking-wide px-2 py-0.5 whitespace-nowrap">
                            ⭐ Recommandé
                          </span>
                        )}
                        <p className={cn('text-base font-extrabold', budget === b.value ? 'text-emerald-700' : 'text-foreground')}>
                          {b.label}
                        </p>
                        <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{b.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5">
                  <ShieldCheck size={14} className="text-primary shrink-0" />
                  <p className="text-[11px] text-foreground leading-snug">
                    <strong>{selectedBudget.label}</strong> sur <strong>7 jours</strong> dans un rayon de <strong>{radius} km</strong> — {selectedBudget.desc.toLowerCase()}
                  </p>
                </div>

                {/* AI reassurance */}
                <div className="flex items-start gap-2.5 rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50 to-emerald-50 px-4 py-3">
                  <Sparkles size={14} className="text-violet-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-violet-800 leading-snug">
                    <strong>✨ L'IA configure automatiquement votre ciblage</strong> sur Facebook & Instagram pour toucher uniquement les personnes susceptibles d'être intéressées par vos prestations.
                  </p>
                </div>
              </>
            )}

            {/* ── ANALYTICS TAB ── */}
            {tab === 'analytics' && (
              <AnalyticsPanel budget={budget} radius={radius} launched={launched} />
            )}

            {/* A/B TEST TAB */}
            {tab === 'abtest' && (
              <AbTestPanel
                budget={budget}
                baseRadius={radius}
                launched={launched}
                onLaunchTest={handleLaunch}
              />
            )}

          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-border bg-muted/10 shrink-0">
            {tab === 'config' ? (
              <>
                <Button
                  onClick={handleLaunch}
                  disabled={launching || launched}
                  className="w-full gap-2 text-sm font-bold py-5 bg-gradient-to-r from-violet-600 to-emerald-500 hover:from-violet-700 hover:to-emerald-600 border-0 text-white shadow-lg shadow-violet-500/20 disabled:opacity-70"
                >
                  {launching ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Lancement de la campagne…
                    </>
                  ) : launched ? (
                    <>✅ Campagne déjà active — voir les métriques</>
                  ) : (
                    <><Rocket size={15} /> Lancer la campagne publicitaire (Paiement sécurisé)</>
                  )}
                </Button>
                {!launched && (
                  <p className="text-[10px] text-muted-foreground text-center mt-2">
                    🔒 Paiement sécurisé · Annulation à tout moment · Sans engagement
                  </p>
                )}
                {launched && (
                  <button
                    onClick={() => setTab('analytics')}
                    className="w-full mt-2 text-[11px] text-primary font-semibold hover:underline text-center"
                  >
                    Voir les performances en direct →
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={onClose}
                className="w-full text-center text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                Fermer
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
