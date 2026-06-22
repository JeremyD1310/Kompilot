/**
 * CockpitCACard — Hero card "💰 CA Sécurisé / Généré" (Money-First UX).
 * Affiche le total avec area sparkline et pills de ventilation.
 */

import { motion } from 'framer-motion';
import { Euro, ArrowUpRight, TrendingUp } from 'lucide-react';
import {
  AreaChart, Area, ResponsiveContainer, Tooltip as RechartsTooltip,
  XAxis, YAxis,
} from 'recharts';

const REVENUE_DATA = [
  { day: 'Lu', ca: 420 }, { day: 'Ma', ca: 580 }, { day: 'Me', ca: 510 },
  { day: 'Je', ca: 720 }, { day: 'Ve', ca: 890 }, { day: 'Sa', ca: 1040 },
  { day: 'Di', ca: 760 },
];

function DarkTooltip({ active, payload, label }: {
  active?: boolean; payload?: Array<{ value: number }>; label?: string;
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
      <p className="font-bold text-white">{payload[0].value} €</p>
    </div>
  );
}

interface CockpitCACardProps {
  noshow: number;
  coupons: number;
  relances: number;
  onClick?: () => void;
}

export function CockpitCACard({ noshow, coupons, relances, onClick }: CockpitCACardProps) {
  const totalCA = noshow + coupons + relances;

  return (
    <motion.div
      className="rounded-2xl p-5 space-y-4 cursor-pointer relative overflow-hidden"
      style={{
        background: 'linear-gradient(140deg, rgba(13,148,136,0.2) 0%, rgba(13,148,136,0.06) 60%, transparent 100%)',
        border: '1.5px solid rgba(13,148,136,0.32)',
        boxShadow: '0 4px 32px rgba(13,148,136,0.18)',
      }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
    >
      {/* Glow orb */}
      <div
        className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(13,148,136,0.22) 0%, transparent 70%)' }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(13,148,136,0.2)', border: '1px solid rgba(13,148,136,0.35)' }}
            >
              <Euro size={16} className="text-[#0D9488]" />
            </div>
            <div>
              <p className="text-[9px] text-[#0D9488]/70 uppercase tracking-widest font-bold">Priorité n°1</p>
              <p className="text-[11px] font-bold text-[#5EEAD4] leading-tight">💰 CA Sécurisé / Généré</p>
            </div>
          </div>
          <ArrowUpRight size={14} className="text-[#0D9488]/50" />
        </div>

        {/* Big number */}
        <div className="mb-3">
          <p className="text-4xl font-black text-white leading-none tracking-tight">
            {totalCA.toLocaleString('fr-FR')} €
          </p>
          <p className="text-[10px] text-slate-500 mt-1">ce mois · +12.7% vs mois précédent</p>
        </div>

        {/* Area sparkline */}
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center justify-between">
            <p className="text-[9px] text-slate-600 uppercase tracking-widest font-bold">CA Sécurisé — 7 jours</p>
            <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
              <TrendingUp size={9} /> +12.7% ce mois
            </span>
          </div>
          <ResponsiveContainer width="100%" height={68}>
            <AreaChart data={REVENUE_DATA} margin={{ top: 2, right: 2, left: -36, bottom: 0 }}>
              <defs>
                <linearGradient id="caGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0D9488" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#0D9488" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 8, fill: '#334155' }} axisLine={false} tickLine={false} />
              <YAxis tick={false} axisLine={false} tickLine={false} />
              <RechartsTooltip content={<DarkTooltip />} />
              <Area
                type="monotone" dataKey="ca"
                stroke="#0D9488" strokeWidth={2.5}
                fill="url(#caGradient)"
                dot={false} activeDot={{ r: 4, fill: '#0D9488', stroke: '#0A0F1E', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Breakdown pills */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: `🛡️ No-Show +${noshow} €`, color: '#F87171' },
            { label: `🎟️ Coupons +${coupons} €`, color: '#FCD34D' },
            { label: `🤖 Relances +${relances} €`, color: '#34D399' },
          ].map((p, i) => (
            <span
              key={i}
              className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
              style={{ background: `${p.color}12`, color: p.color, border: `1px solid ${p.color}22` }}
            >
              {p.label}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
