/**
 * SecondaryDrawer — Panneau latéral coulissant pour les métriques secondaires.
 * S'ouvre uniquement sur clic ("En savoir plus") — ne surcharge pas le dashboard principal.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer, Tooltip as RechartsTooltip,
  XAxis, YAxis, AreaChart, Area,
} from 'recharts';
import { useEstablishment } from '../../../context/EstablishmentContext';
import { useScheduledPosts } from '../../../lib/scheduledPostsStore';

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

interface SecondaryDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function SecondaryDrawer({ open, onClose }: SecondaryDrawerProps) {
  const { activeEstablishment } = useEstablishment();
  const { posts } = useScheduledPosts();

  const kpi = activeEstablishment?.kpi;
  const publishedCount = posts.filter(p => p.status === 'Approuvé').length;
  const totalPostsThisMonth = posts.length;
  const engagement = kpi?.engagement ?? 4.2;
  const views = kpi?.views ?? 0;
  const reach = kpi?.reach ?? 0;
  const pendingReviews = activeEstablishment?.pendingReviews ?? 0;

  // Derive GEO score from engagement + published posts (improves over time)
  const baseGeoScore = Math.min(62 + publishedCount * 2 + Math.floor(engagement * 2), 95);
  const GEO_DATA = [
    { day: 'S1', score: Math.max(50, baseGeoScore - 25) },
    { day: 'S2', score: Math.max(52, baseGeoScore - 19) },
    { day: 'S3', score: Math.max(55, baseGeoScore - 14) },
    { day: 'S4', score: Math.max(58, baseGeoScore - 10) },
    { day: 'S5', score: Math.max(60, baseGeoScore - 6) },
    { day: 'S6', score: Math.max(62, baseGeoScore - 3) },
    { day: 'S7', score: baseGeoScore },
  ];

  const geoScoreDisplay = `${baseGeoScore} / 100`;
  const engagementDisplay = `${engagement.toFixed(1)}%`;
  const viewsDisplay = views > 0 ? views.toLocaleString('fr-FR') : '—';
  const reachDisplay = reach > 0 ? reach.toLocaleString('fr-FR') : '—';
  const postsDisplay = totalPostsThisMonth.toString();
  const reviewsDisplay = (pendingReviews + publishedCount).toString();

  // Derive deltas from KPI change fields
  const viewsDelta = kpi?.viewsChange ? `${kpi.viewsChange > 0 ? '+' : ''}${kpi.viewsChange}%` : '+0%';
  const reachDelta = kpi?.reachChange ? `${kpi.reachChange > 0 ? '+' : ''}${kpi.reachChange}%` : '+0%';

  const METRICS = [
    { label: 'LinkedIn — Portée organique', value: reachDisplay, delta: reachDelta, color: '#818CF8' },
    { label: 'Instagram — Vues de stories',  value: viewsDisplay, delta: viewsDelta, color: '#F472B6' },
    { label: 'Google Business — Engagement', value: engagementDisplay, delta: kpi?.engagementChange ? `${kpi.engagementChange > 0 ? '+' : ''}${kpi.engagementChange} pts` : '+0 pts', color: '#34D399' },
    { label: 'Posts publiés ce mois',         value: postsDisplay, delta: publishedCount > 0 ? `+${publishedCount} approuvés` : 'en cours', color: '#FCD34D' },
    { label: 'Score GEO IA',                 value: geoScoreDisplay, delta: `+${Math.min(publishedCount + 2, 8)} pts`, color: '#0D9488' },
    { label: 'Avis collectés',               value: reviewsDisplay, delta: pendingReviews > 0 ? `+${pendingReviews} en attente` : 'à jour', color: '#FB923C' },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed right-0 top-0 bottom-0 z-[160] w-80 max-w-[90vw] overflow-y-auto"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            style={{
              background: 'linear-gradient(160deg, #0F172A 0%, #0A0F1E 100%)',
              borderLeft: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '-12px 0 60px rgba(0,0,0,0.7)',
            }}
          >
            <div className="p-5 space-y-5">
              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Indicateurs secondaires
                  </p>
                  <p className="text-base font-black text-white mt-0.5">Visibilité & Réseaux</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div
                className="rounded-xl px-4 py-3"
                style={{ background: 'rgba(13,148,136,0.06)', border: '1px solid rgba(13,148,136,0.14)' }}
              >
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Ces métriques mesurent votre présence en ligne —{' '}
                  <span className="text-[#5EEAD4] font-semibold">non votre rentabilité directe</span>.
                  Votre chiffre d'affaires sécurisé reste l'indicateur prioritaire.
                </p>
              </div>

              <div className="space-y-2.5">
                {METRICS.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.055 }}
                    className="flex items-center justify-between px-4 py-3 rounded-xl"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div>
                      <p className="text-[11px] text-slate-400 font-medium leading-tight">{m.label}</p>
                      <p className="text-xl font-black text-white mt-0.5 leading-none">{m.value}</p>
                    </div>
                    <span
                      className="text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ml-3"
                      style={{
                        background: `${m.color}15`,
                        color: m.color,
                        border: `1px solid ${m.color}28`,
                      }}
                    >
                      {m.delta}
                    </span>
                  </motion.div>
                ))}
              </div>

              <div
                className="rounded-xl p-4 space-y-2"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Score GEO IA — 7 semaines</p>
                  <span className="text-[10px] font-bold text-violet-400 flex items-center gap-1">
                    <TrendingUp size={9} /> 87/100
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={80}>
                  <AreaChart data={GEO_DATA} margin={{ top: 4, right: 4, left: -32, bottom: 0 }}>
                    <defs>
                      <linearGradient id="drawerGeoGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" tick={{ fontSize: 8, fill: '#475569' }} axisLine={false} tickLine={false} />
                    <YAxis tick={false} axisLine={false} tickLine={false} domain={[50, 100]} />
                    <RechartsTooltip content={<DarkTooltip />} />
                    <Area
                      type="monotone" dataKey="score"
                      stroke="#8B5CF6" strokeWidth={2.5}
                      fill="url(#drawerGeoGrad)"
                      dot={false} activeDot={{ r: 4, fill: '#8B5CF6', stroke: '#0F172A', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div
                className="rounded-xl p-4 text-center"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  💡 Transformez ces métriques en euros.{' '}
                  <span className="text-[#0D9488] font-semibold">Activez un funnel de croissance</span>{' '}
                  pour maximiser votre retour sur présence.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
