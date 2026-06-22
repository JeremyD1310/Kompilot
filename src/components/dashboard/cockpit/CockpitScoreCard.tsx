/**
 * CockpitScoreCard — Fiche de score glassmorphism style nimt.ai.
 * Affiche une métrique clé avec animation hover et glow coloré.
 */

import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

interface CockpitScoreCardProps {
  label: string;
  value: string;
  subtext: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  color: string;
  onClick?: () => void;
}

export function CockpitScoreCard({
  label, value, subtext, icon: Icon, color, onClick,
}: CockpitScoreCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.97 }}
      className="rounded-2xl p-4 cursor-pointer relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        border: `1px solid ${color}22`,
        boxShadow: `0 4px 24px ${color}0D`,
      }}
      onClick={onClick}
    >
      {/* Glow orb */}
      <div
        className="absolute -top-6 -right-6 w-16 h-16 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${color}18 0%, transparent 70%)` }}
      />

      <div className="relative z-10 space-y-2.5">
        <div className="flex items-center justify-between">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: `${color}15`, border: `1px solid ${color}22` }}
          >
            <Icon size={15} style={{ color }} />
          </div>
          <TrendingUp size={10} style={{ color, opacity: 0.5 }} />
        </div>
        <div>
          <p className="text-2xl font-black text-white leading-none">{value}</p>
          <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{subtext}</p>
        </div>
        <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">{label}</p>
      </div>
    </motion.div>
  );
}
