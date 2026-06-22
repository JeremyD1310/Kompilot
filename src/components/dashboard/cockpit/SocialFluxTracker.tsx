/**
 * SocialFluxTracker — Encart 2 "Statut du Flux Social" (Mini-Tracker).
 *
 * Affiche le statut des automatisations actives : prochain post planifié,
 * stratégie Comment-to-DM, cadence éditoriale, campagne SMS flash…
 *
 * Responsive :
 *  - Mobile (<768px) : MASQUÉ — évite le scroll excessif sur téléphone
 *  - Tablet + Desktop (≥768px) : visible dans la colonne communication
 */

import { motion } from 'framer-motion';
import { useNavigate } from '@tanstack/react-router';
import { getScheduledPosts } from '../../../lib/scheduledPostsStore';
import { useMemo } from 'react';
import { CalendarDays, MessageSquare, Zap, Radio, ChevronRight } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

type AutomationStatus = {
  id: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  status: 'active' | 'paused' | 'scheduled' | 'warning';
  route?: string;
  accent: string;
};

// ── Status dot ───────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: AutomationStatus['status'] }) {
  const colors = {
    active:    { bg: '#34D399', pulse: true  },
    scheduled: { bg: '#60A5FA', pulse: false },
    paused:    { bg: '#94A3B8', pulse: false },
    warning:   { bg: '#FBBF24', pulse: true  },
  };
  const { bg, pulse } = colors[status];
  return (
    <span
      className={`w-1.5 h-1.5 rounded-full shrink-0 ${pulse ? 'animate-pulse' : ''}`}
      style={{ background: bg }}
    />
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SocialFluxTracker() {
  const navigate = useNavigate();

  // Pull real next scheduled post from store
  const { nextPostLabel, postCount } = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const all = getScheduledPosts();
    const upcoming = all
      .filter(p => p.date >= today)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    const next = upcoming[0] ?? null;

    let label = 'Aucun post planifié';
    if (next) {
      const isToday = next.date === today;
      if (isToday) {
        label = `Aujourd'hui à ${next.time}`;
      } else {
        const d = new Date(next.date + 'T00:00');
        const day = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
        label = `${day} à ${next.time}`;
      }
    }
    return { nextPostLabel: label, postCount: upcoming.length };
  }, []);

  const automations: AutomationStatus[] = [
    {
      id: 'next-post',
      icon: <CalendarDays size={12} />,
      label: 'Prochain post',
      value: nextPostLabel,
      status: postCount > 0 ? 'scheduled' : 'warning',
      route: '/calendar',
      accent: '#60A5FA',
    },
    {
      id: 'comment-to-dm',
      icon: <MessageSquare size={12} />,
      label: 'Stratégie Comment-to-DM',
      value: 'Active',
      status: 'active',
      route: '/inbox',
      accent: '#34D399',
    },
    {
      id: 'cadence',
      icon: <Radio size={12} />,
      label: 'Cadence éditoriale',
      value: `${postCount} post${postCount !== 1 ? 's' : ''} planifié${postCount !== 1 ? 's' : ''}`,
      status: postCount >= 3 ? 'active' : postCount > 0 ? 'scheduled' : 'warning',
      route: '/calendar',
      accent: '#0D9488',
    },
    {
      id: 'sms',
      icon: <Zap size={12} />,
      label: 'Flash SMS Heures Creuses',
      value: 'En veille',
      status: 'paused',
      route: '/dashboard',
      accent: '#FBBF24',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.08, ease: 'easeOut' }}
      className="rounded-2xl overflow-hidden flex flex-col h-full"
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 pt-4 pb-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: 'rgba(96,165,250,0.12)',
              border: '1px solid rgba(96,165,250,0.2)',
            }}
          >
            <Radio size={12} className="text-blue-400" />
          </div>
          <div>
            <p className="text-[9px] text-blue-400/70 uppercase tracking-widest font-black">Réseaux Sociaux</p>
            <p className="text-[11px] font-bold text-white leading-tight">Statut du Flux</p>
          </div>
        </div>
        <span
          className="text-[9px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
          style={{
            background: 'rgba(52,211,153,0.08)',
            border: '1px solid rgba(52,211,153,0.18)',
            color: '#34D399',
          }}
        >
          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
          {automations.filter(a => a.status === 'active').length} actives
        </span>
      </div>

      {/* ── Automation rows ─────────────────────────────────────── */}
      <div className="flex-1 px-2 py-2 space-y-0.5">
        {automations.map((a, i) => (
          <motion.button
            key={a.id}
            onClick={() => a.route && navigate({ to: a.route as '/' })}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.12 + i * 0.05 }}
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all group"
          >
            {/* Icon */}
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${a.accent}12`, color: a.accent }}
            >
              {a.icon}
            </div>

            {/* Label + value */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-500 font-medium truncate">{a.label}</p>
              <p className="text-xs font-bold text-slate-300 truncate">{a.value}</p>
            </div>

            {/* Status dot + chevron */}
            <div className="flex items-center gap-1.5 shrink-0">
              <StatusDot status={a.status} />
              <ChevronRight
                size={10}
                className="text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>
          </motion.button>
        ))}
      </div>

      {/* ── Footer CTA ──────────────────────────────────────────── */}
      <div
        className="px-4 py-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
      >
        <button
          onClick={() => navigate({ to: '/calendar' })}
          className="w-full text-[10px] font-semibold text-slate-500 hover:text-[#0D9488] transition-colors flex items-center justify-center gap-1.5"
        >
          Gérer le calendrier éditorial
          <ChevronRight size={10} />
        </button>
      </div>
    </motion.div>
  );
}

export default SocialFluxTracker;
