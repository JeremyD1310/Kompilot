import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Zap, Share2 } from 'lucide-react';
import { Button } from '@blinkdotnew/ui';
import { getLevel } from './guideHelpers';

// ── Props ──────────────────────────────────────────────────────────────────────

interface RecapScreenProps {
  totalXP: number;
  completedCount: number;
  totalCount: number;
  mode: 'pro' | 'agency';
  onClose: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function RecapScreen({
  totalXP,
  completedCount,
  totalCount,
  mode,
  onClose,
}: RecapScreenProps) {
  const { level, label, color } = getLevel(totalXP);
  const pct = Math.round((completedCount / totalCount) * 100);
  const [shared, setShared] = useState(false);

  const handleShare = () => {
    const text = `J'ai complété ${pct}% du guide ${mode === 'agency' ? 'Agence' : 'Pro'} Kompilot et atteint le niveau ${label} avec ${totalXP} XP ! 🚀`;
    if (navigator.share) {
      navigator.share({ text, url: 'https://kompilot.fr' }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => setShared(true));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-5 space-y-5 text-center"
    >
      {/* Trophy */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
        className="flex items-center justify-center"
      >
        <div className="w-20 h-20 rounded-full bg-amber-500/15 border-2 border-amber-500/30 flex items-center justify-center">
          <Trophy size={36} className="text-amber-400" />
        </div>
      </motion.div>

      <div>
        <h3 className="text-xl font-black text-white">Guide complété !</h3>
        <p className="text-slate-400 text-sm mt-1">{completedCount}/{totalCount} étapes · {pct}% de maîtrise</p>
      </div>

      {/* XP */}
      <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 space-y-2">
        <p className={`text-2xl font-black ${color}`}>{totalXP} XP</p>
        <p className={`text-sm font-bold ${color}`}>Niveau {level} — {label}</p>
        <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((totalXP / 700) * 100, 100)}%` }}
            transition={{ duration: 1, delay: 0.3 }}
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { value: completedCount.toString(), label: 'Étapes\ncomplétées', icon: '✅' },
          { value: `${pct}%`, label: 'Progression\noverall', icon: '📈' },
          { value: `Niv. ${level}`, label: 'Votre\nniveau', icon: '🏆' },
        ].map((s, i) => (
          <div key={i} className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
            <p className="text-lg">{s.icon}</p>
            <p className="text-base font-black text-white mt-1">{s.value}</p>
            <p className="text-[9px] text-slate-500 leading-tight whitespace-pre-line">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={handleShare}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs font-bold py-2.5 hover:bg-white/15 transition-all"
        >
          <Share2 size={13} />
          {shared ? 'Copié dans le presse-papier !' : 'Partager ma progression'}
        </button>
        <Button onClick={onClose} className="w-full py-3 text-sm font-black bg-amber-600 hover:bg-amber-500">
          <Zap size={14} className="mr-2" />
          Retourner au cockpit
        </Button>
      </div>
    </motion.div>
  );
}
