/**
 * CockpitDashboard — Orchestrateur principal du tableau de bord premium (style nimt.ai).
 *
 * Responsive :
 *   Mobile  (<768px)  : 1 col — CA KPI + Copilot bar + Quick Suggestions uniquement
 *   Tablet  (768–1023): 2 col — Copilot + activité / stats majeures
 *   Desktop (≥1024px) : 3 col ultra-aérées, graphiques secondaires en Drawer (clic uniquement)
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck, Star, BarChart2, Eye,
  Zap, MessageSquare, ChevronRight, Activity,
  TrendingUp, Sparkles,
} from 'lucide-react';
import { ReviewRaidDashboardAlert } from './ReviewRaidDashboardAlert';
import { GEAWidget } from './GEAWidget';
import { useTrial } from '../../context/TrialContext';
import { useAlertSettings } from '../../context/AlertSettingsContext';
import {
  AreaChart, Area, ResponsiveContainer,
  Tooltip as RechartsTooltip, XAxis, YAxis,
} from 'recharts';
import { CopilotCommandBar } from './CopilotCommandBar';
import { SecondaryDrawer } from './cockpit/SecondaryDrawer';
import { CockpitScoreCard } from './cockpit/CockpitScoreCard';
import { CockpitCACard } from './cockpit/CockpitCACard';
import { FlashPostGenerator } from './cockpit/FlashPostGenerator';
import { SocialFluxTracker } from './cockpit/SocialFluxTracker';
import { usePremiumWin } from '../shared/PremiumWinEngine';
import { useEstablishment } from '../../context/EstablishmentContext';
import { useScheduledPosts } from '../../lib/scheduledPostsStore';
import { useNavigate } from '@tanstack/react-router';
import { useActivityFeed } from '../../hooks/useActivityFeed';
import CreativeStudio from '../cockpit/ads/CreativeStudio';

function DarkTooltip({ active, payload, label, unit = 'pts' }: {
  active?: boolean; payload?: Array<{ value: number }>; label?: string; unit?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 text-xs rounded-xl"
      style={{
        background: '#1E293B',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        color: '#E2E8F0',
      }}
    >
      <p className="text-slate-400 text-[10px] mb-0.5">{label}</p>
      <p className="font-bold text-white">{payload[0].value} {unit}</p>
    </div>
  );
}

interface CockpitDashboardProps {
  onPromptSubmit?: (text: string) => void;
  /** Called when user approves a flash post — opens CreatePostModal pre-filled */
  onOpenCreatePost?: (text: string, channels?: string[]) => void;
}

export function CockpitDashboard({ onPromptSubmit, onOpenCreatePost }: CockpitDashboardProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [raidAlertDismissed, setRaidAlertDismissed] = useState(false);
  // Simulated raid detection for demo — always true in demo context
  const isRaidDetected = true;
  const { settings: alertSettings } = useAlertSettings();
  const { activeEstablishment } = useEstablishment();
  const { triggerWin } = usePremiumWin();
  const navigate = useNavigate();
  const { items: activityItems, scheduledCount, unreadCount } = useActivityFeed();
  const { gateAction } = useTrial();
  const { posts } = useScheduledPosts();

  // Revenue metrics — derived from real KPI data
  const { noshow, coupons, relances, noshowBlocked, geoScore, GEO_DATA } = useMemo(() => {
    const kpi = activeEstablishment?.kpi;
    const views = kpi?.views ?? 0;
    const engagement = kpi?.engagement ?? 4.0;
    const publishedCount = posts.filter(p => p.status === 'Approuvé').length;

    // Estimate revenue components based on visible activity
    // No-show: 35€ avg basket × estimated blocked events (1% of views ÷ 10)
    const noshowEvt = Math.max(1, Math.round(views * 0.001) + publishedCount);
    const noshow = noshowEvt * 35;
    // Coupons: avg 15€ discount × published posts * engagement factor
    const coupons = Math.max(50, Math.round(publishedCount * 15 * (engagement / 4)));
    // Relances: emails reactivées (0.5% views × 25€ avg)
    const relances = Math.max(100, Math.round(views * 0.005 * 25));
    // No-show blocked count
    const noshowBlocked = Math.max(0, noshowEvt);
    // GEO score — derived from engagement + published posts
    const geoScore = Math.min(62 + publishedCount * 2 + Math.floor(engagement * 2), 95);
    // GEO trend data over 7 weeks
    const GEO_DATA = [
      { day: 'S1', score: Math.max(50, geoScore - 25) },
      { day: 'S2', score: Math.max(52, geoScore - 19) },
      { day: 'S3', score: Math.max(55, geoScore - 14) },
      { day: 'S4', score: Math.max(58, geoScore - 10) },
      { day: 'S5', score: Math.max(60, geoScore - 6) },
      { day: 'S6', score: Math.max(62, geoScore - 3) },
      { day: 'S7', score: geoScore },
    ];
    return { noshow, coupons, relances, noshowBlocked, geoScore, GEO_DATA };
  }, [activeEstablishment, posts]);

  return (
    <>
      <SecondaryDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* ═══════════════════════════════════════════════════
          COCKPIT — Dark background, dot grid, colored glows
      ═══════════════════════════════════════════════════ */}
      <div
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #080D1A 0%, #0A0F1E 40%, #0D1225 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 20px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        {/* Dot grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* Emerald glow — top-left */}
        <div
          className="absolute -top-20 -left-20 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(13,148,136,0.14) 0%, transparent 65%)' }}
        />
        {/* Violet glow — bottom-right */}
        <div
          className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.09) 0%, transparent 65%)' }}
        />

        <div className="relative z-10 p-5 md:p-7 lg:p-8">

          {/* ── Header ──────────────────────────────────── */}
          <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
            <div>
              <p className="text-[9px] text-slate-600 uppercase tracking-[0.2em] font-black">
                Kompilot · Cockpit
              </p>
              <p className="text-xl font-black text-white leading-tight mt-0.5">
                {activeEstablishment?.shortName ?? 'Établissement'}
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <div
                className="flex items-center gap-1.5 text-[10px] font-bold rounded-full px-3 py-1.5"
                style={{
                  background: 'rgba(13,148,136,0.1)',
                  border: '1px solid rgba(13,148,136,0.22)',
                  color: '#34D399',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Moteur actif
              </div>
              <button
                onClick={() => setDrawerOpen(true)}
                className="hidden lg:flex items-center gap-1.5 text-[10px] font-semibold rounded-full px-3 py-1.5 transition-all hover:bg-white/5"
                style={{ border: '1px solid rgba(255,255,255,0.08)', color: '#64748B' }}
              >
                <Activity size={11} />
                Métriques secondaires
                <ChevronRight size={11} />
              </button>
            </div>
          </div>

          {/* ── Raid alert (demo) — hidden if user disabled raid alerts ── */}
          {isRaidDetected && !raidAlertDismissed && alertSettings.showRaidAlerts && (
            <div className="mb-5">
              <ReviewRaidDashboardAlert
                onViewDetails={() => navigate({ to: '/inbox' })}
                onDismiss={() => setRaidAlertDismissed(true)}
              />
            </div>
          )}

          {/* ═══════════════════════════════════════════════
              RESPONSIVE GRID
              Mobile: 1 col | Tablet: 2 col | Desktop: 3 col
          ═══════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-7">

            {/* COL 1 — CA Hero + Score badges */}
            <div className="space-y-4">
              <CockpitCACard
                noshow={noshow}
                coupons={coupons}
                relances={relances}
                onClick={() => triggerWin({ type: 'coupon', amount: coupons })}
              />
              <div className="grid grid-cols-2 gap-3">
                <CockpitScoreCard
                  label="No-Show bloqués"
                  value={noshowBlocked > 0 ? String(noshowBlocked) : '—'}
                  subtext="ce mois"
                  icon={ShieldCheck}
                  color="#F87171"
                  onClick={() => triggerWin({ type: 'noshowBlocked', amount: noshow })}
                />
                <CockpitScoreCard
                  label="Score GEO IA"
                  value={String(geoScore)}
                  subtext="/ 100"
                  icon={Eye}
                  color="#8B5CF6"
                  onClick={() => navigate({ to: '/growth' })}
                />
              </div>
            </div>

            {/* COL 2 — Copilot Command Bar + Activité récente */}
            <div className="space-y-4">
              {/* Command bar container */}
              <div
                className="rounded-2xl p-4"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <div className="flex items-center gap-1.5 mb-3">
                  <Zap size={10} className="text-[#0D9488]" />
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black">
                    Copilote IA
                  </p>
                </div>
                <CopilotCommandBar onPromptSubmit={onPromptSubmit} />
              </div>

              {/* Activity feed */}
              <div
                className="rounded-2xl p-4 space-y-3"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black">
                    Activité récente
                  </p>
                  <span className="text-[9px] text-emerald-500/60 font-semibold flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                  </span>
                </div>
                {activityItems.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="flex items-center gap-3"
                  >
                    <span className="text-sm shrink-0">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-300 truncate">{item.text}</p>
                      <p className="text-[9px] text-slate-600">{item.time}</p>
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: item.color }} />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* COL 3 — GEO chart + Score cards (desktop only) */}
            <div className="hidden lg:flex flex-col space-y-4">
              {/* GEO area chart */}
              <div
                className="rounded-2xl p-4 space-y-3"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(139,92,246,0.15)',
                }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black">
                    Score GEO IA — 7 semaines
                  </p>
                  <span className="text-[10px] font-bold text-violet-400 flex items-center gap-1">
                    <TrendingUp size={9} /> {geoScore}/100
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={80}>
                  <AreaChart data={GEO_DATA} margin={{ top: 4, right: 4, left: -36, bottom: 0 }}>
                    <defs>
                      <linearGradient id="geoGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" tick={{ fontSize: 8, fill: '#334155' }} axisLine={false} tickLine={false} />
                    <YAxis tick={false} axisLine={false} tickLine={false} domain={[50, 100]} />
                    <RechartsTooltip content={<DarkTooltip />} />
                    <Area
                      type="monotone" dataKey="score"
                      stroke="#8B5CF6" strokeWidth={2.5}
                      fill="url(#geoGradient)"
                      dot={false} activeDot={{ r: 4, fill: '#8B5CF6', stroke: '#0A0F1E', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  58% des clients de votre zone cherchent votre expertise sur l'IA et finissent chez vos
                  concurrents.{' '}
                  <span className="text-violet-400 font-semibold">Voulez-vous inverser la tendance ?</span>
                </p>
              </div>

              {/* Score cards */}
              <div className="grid grid-cols-2 gap-3">
                <CockpitScoreCard
                  label="Avis collectés"
                  value={unreadCount > 0 ? String(unreadCount) : '—'}
                  subtext="non lus"
                  icon={Star}
                  color="#FCD34D"
                  onClick={() => navigate({ to: '/inbox' })}
                />
                <CockpitScoreCard
                  label="Posts planifiés"
                  value={scheduledCount > 0 ? String(scheduledCount) : '—'}
                  subtext="à venir"
                  icon={MessageSquare}
                  color="#34D399"
                  onClick={() => navigate({ to: '/calendar' })}
                />
              </div>

              <div className="flex-1" />

              {/* Métriques secondaires CTA */}
              <button
                onClick={() => setDrawerOpen(true)}
                className="w-full flex items-center justify-between rounded-2xl px-4 py-3.5 transition-all hover:opacity-80 group"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: '#64748B',
                }}
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <BarChart2 size={14} />
                  Métriques Secondaires (Visibilité)
                </span>
                <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>

          </div>

          {/* ═══════════════════════════════════════════════════
              SECTION PUBLICATIONS FLASH
              ─ Mobile : Encart 1 uniquement (FlashPostGenerator)
              ─ Tablet + Desktop : 2 encarts côte à côte
          ═══════════════════════════════════════════════════ */}
          <div className="mt-5 lg:mt-6">
            {/* Separator + label */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.2em] font-black"
                style={{ color: '#475569' }}
              >
                <Zap size={9} className="text-[#0D9488]" />
                Communication & Réseaux Sociaux
              </div>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
            </div>

            {/* 2-column grid on md+, single column on mobile — equal height */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 md:items-stretch">
              {/* Encart 1 — FlashPostGenerator (always visible) */}
              <FlashPostGenerator
                onApprove={(text, channel) => {
                  gateAction(() => { onOpenCreatePost?.(text, [channel]); });
                }}
              />

              {/* Encart 2 — SocialFluxTracker (hidden on mobile, full height on md+) */}
              <div className="hidden md:flex md:flex-col">
                <SocialFluxTracker />
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════
              G.E.A. — Generative Engine Advertising
          ═══════════════════════════════════════════════════ */}
          <div className="mt-5 lg:mt-6">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.2em] font-black"
                style={{ color: '#475569' }}
              >
                <Zap size={9} className="text-[#0D9488]" />
                Publicité sur Moteurs IA (G.E.A.)
              </div>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
            </div>
            <GEAWidget />
          </div>

          {/* ═══════════════════════════════════════════════════
              Creative Studio × Claude — Analyse Meta Ads
          ═══════════════════════════════════════════════════ */}
          <div className="mt-5 lg:mt-6">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.2em] font-black"
                style={{ color: '#475569' }}
              >
                <Sparkles size={9} className="text-violet-400" />
                Creative Studio — Analyse Meta Ads IA
              </div>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
            </div>
            <CreativeStudio />
          </div>

          {/* Mobile / Tablet: Métriques secondaires button */}
          <div className="lg:hidden mt-4">
            <button
              onClick={() => setDrawerOpen(true)}
              className="w-full flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all hover:bg-white/5"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#64748B',
              }}
            >
              <span className="flex items-center gap-2">
                <BarChart2 size={14} />
                Métriques Secondaires (Visibilité)
              </span>
              <ChevronRight size={14} />
            </button>
          </div>

        </div>
      </div>
    </>
  );
}

export default CockpitDashboard;
