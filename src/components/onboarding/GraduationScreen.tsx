/**
 * GraduationScreen — "Diplôme de Croissance Kompilot"
 *
 * Visual layers:
 *  1. Canvas confetti (launchConfetti) — full-page burst on mount
 *  2. CSS particle burst inside the modal — immediate sparkle within the card
 *  3. Animated SVG trophy with glow ring + rays
 *  4. Diploma card with decorative border & watermark
 *  5. Skill badges — staggered spring reveal, each checks in with a draw animation
 *  6. Segmented bonus progress bar — 3 segments unlock sequentially
 *  7. CTA button with shimmer sweep on hover
 */
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import { Rocket, Bell, BellOff } from 'lucide-react';
import { launchConfetti } from '../../lib/confetti';

interface Props {
  onClaimBonus: () => void;
}

// ── Skill definitions ──────────────────────────────────────────────────────────

const SKILLS = [
  { label: 'Cockpit IA',           icon: '🎙️', color: 'from-violet-500 to-purple-600' },
  { label: 'Multi-posting',        icon: '📱', color: 'from-blue-500 to-indigo-500'   },
  { label: 'Audit Flash',          icon: '🌐', color: 'from-amber-500 to-orange-500'  },
  { label: 'Mode Équipe',          icon: '👥', color: 'from-teal-500 to-emerald-500'  },
  { label: 'Publicité locale',     icon: '🎯', color: 'from-orange-500 to-red-500'    },
  { label: 'Calendrier en Masse',  icon: '📅', color: 'from-violet-500 to-indigo-600' },
  { label: 'Sérénité & Safe Mode', icon: '⚡', color: 'from-teal-500 to-emerald-500'  },
];

// ── Bonus segments ─────────────────────────────────────────────────────────────

const BONUS_SEGMENTS = [
  { label: '3 Crédits IA',   icon: '⚡', delay: 1.0 },
  { label: '5€ Meta Ads',    icon: '💸', delay: 1.5 },
  { label: 'Essai Premium',  icon: '🌟', delay: 2.0 },
];

// ── CSS particle emitter ───────────────────────────────────────────────────────

const PARTICLE_COLORS = ['#8b5cf6','#10b981','#f59e0b','#3b82f6','#ec4899','#f97316','#06b6d4','#84cc16','#ef4444'];

function InlineParticles() {
  const particles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
    x: (Math.sin(i * 137.5 * Math.PI / 180) * 60) + (i % 3 - 1) * 30,
    y: -(40 + Math.abs(Math.cos(i * 37 * Math.PI / 180)) * 80),
    rotate: i * 47,
    size: 4 + (i % 4) * 2,
    delay: (i % 8) * 0.06,
  }));

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden" style={{ zIndex: 10 }}>
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
          animate={{ opacity: 0, x: p.x, y: p.y, rotate: p.rotate, scale: 0.3 }}
          transition={{ duration: 0.9 + p.delay, delay: p.delay, ease: [0.22, 1, 0.36, 1] }}
          className="absolute rounded-sm"
          style={{ width: p.size, height: p.size * 0.55, background: p.color }}
        />
      ))}
    </div>
  );
}

// ── SVG Trophy ─────────────────────────────────────────────────────────────────

function TrophyIcon() {
  const glowControls = useAnimationControls();

  useEffect(() => {
    const loop = async () => {
      while (true) {
        await glowControls.start({ opacity: [0.4, 1, 0.4], scale: [0.95, 1.08, 0.95] }, { duration: 2.2, ease: 'easeInOut' });
      }
    };
    loop();
  }, [glowControls]);

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Glow rings */}
      <motion.div
        animate={{ scale: [1, 1.35, 1], opacity: [0.3, 0, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
        className="absolute w-24 h-24 rounded-full bg-amber-400/30"
      />
      <motion.div
        animate={{ scale: [1, 1.6, 1], opacity: [0.15, 0, 0.15] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.3 }}
        className="absolute w-24 h-24 rounded-full bg-amber-400/20"
      />

      {/* Trophy circle */}
      <motion.div
        initial={{ scale: 0.5, rotate: -15, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.6, type: 'spring', stiffness: 220, damping: 14 }}
        className="relative w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-500 shadow-2xl shadow-amber-400/50 flex items-center justify-center"
      >
        {/* Inner shine */}
        <div className="absolute top-2 left-3 w-5 h-3 rounded-full bg-white/35 blur-[2px]" />

        {/* Rotating star rays */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full"
        >
          {[0,45,90,135,180,225,270,315].map(deg => (
            <div
              key={deg}
              className="absolute w-0.5 h-4 bg-white/20 rounded-full"
              style={{
                top: '50%', left: '50%',
                transformOrigin: '0 0',
                transform: `rotate(${deg}deg) translateY(-50%) translateX(-50%) translateY(-44px)`,
              }}
            />
          ))}
        </motion.div>

        {/* Trophy emoji */}
        <motion.span
          animate={glowControls}
          className="text-3xl relative z-10 select-none"
          style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}
        >
          🏆
        </motion.span>
      </motion.div>

      {/* Orbiting stars */}
      {[0, 120, 240].map((startDeg, i) => (
        <motion.div
          key={i}
          animate={{ rotate: 360 }}
          transition={{ duration: 5 + i * 1.2, repeat: Infinity, ease: 'linear', delay: i * 0.4 }}
          className="absolute w-20 h-20"
          style={{ transformOrigin: 'center' }}
        >
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.5 }}
            className="absolute text-xs"
            style={{
              top: '0%', left: '50%',
              transform: `rotate(${startDeg}deg) translateX(-50%) translateY(-28px) rotate(-${startDeg}deg)`,
            }}
          >
            ✨
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Animated checkmark SVG ─────────────────────────────────────────────────────

function AnimatedCheck({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -90 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ delay, type: 'spring', stiffness: 300, damping: 16 }}
      className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-sm shadow-emerald-300"
    >
      <motion.svg
        width="10" height="10" viewBox="0 0 12 12" fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: delay + 0.15, duration: 0.35, ease: 'easeOut' }}
      >
        <motion.path
          d="M2 6l3 3 5-5"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: delay + 0.15, duration: 0.35, ease: 'easeOut' }}
        />
      </motion.svg>
    </motion.div>
  );
}

// ── Diploma watermark ──────────────────────────────────────────────────────────

function DiplomaWatermark() {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-[0.025] pointer-events-none"
      viewBox="0 0 400 200"
      fill="none"
    >
      <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle"
        fontSize="88" fontWeight="900" fill="currentColor" fontFamily="serif">
        NC
      </text>
    </svg>
  );
}

// ── Shimmer overlay for CTA ────────────────────────────────────────────────────

function ShimmerButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.button
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileTap={{ scale: 0.97 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 2.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-teal-500 to-emerald-500 text-white text-sm font-extrabold py-4 shadow-xl shadow-primary/30 transition-shadow hover:shadow-2xl hover:shadow-primary/40"
    >
      {/* Shimmer sweep */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: 'easeInOut' }}
            className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12"
          />
        )}
      </AnimatePresence>
      <span className="relative flex items-center justify-center gap-2.5">
        <Rocket size={16} />
        Réclamer mon bonus et lancer mon essai gratuit
      </span>
    </motion.button>
  );
}

// ── Segmented bonus bar ────────────────────────────────────────────────────────

function BonusBar() {
  return (
    <div className="space-y-2.5">
      {/* Segment track */}
      <div className="flex gap-1.5 h-3">
        {BONUS_SEGMENTS.map((seg, i) => (
          <motion.div
            key={seg.label}
            initial={{ scaleX: 0, opacity: 0.3 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: seg.delay, duration: 0.55, ease: 'easeOut' }}
            style={{ transformOrigin: 'left' }}
            className="flex-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 relative overflow-hidden"
          >
            {/* Shine on each segment */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ delay: seg.delay + 0.4, duration: 0.4, ease: 'easeOut' }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            />
          </motion.div>
        ))}
      </div>
      {/* Segment labels */}
      <div className="flex gap-1.5">
        {BONUS_SEGMENTS.map((seg, i) => (
          <motion.div
            key={seg.label}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: seg.delay + 0.2, duration: 0.3 }}
            className="flex-1 flex items-center justify-center gap-1"
          >
            <span className="text-[10px]">{seg.icon}</span>
            <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 truncate">{seg.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export function GraduationScreen({ onClaimBonus }: Props) {
  const [showParticles, setShowParticles] = useState(true);
  const [pushGranted, setPushGranted] = useState<boolean | null>(null);

  const handleRequestPush = async () => {
    if (!('Notification' in window)) { setPushGranted(false); return; }
    const perm = await Notification.requestPermission();
    setPushGranted(perm === 'granted');
    if (perm === 'granted') {
      localStorage.setItem('nc_push_opted_in', '1');
    }
  };

  useEffect(() => {
    // Slight delay so modal finishes entering before burst
    const t = setTimeout(() => launchConfetti(200), 150);
    const t2 = setTimeout(() => setShowParticles(false), 1200);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, []);

  return (
    <div className="relative px-5 pt-6 pb-6 space-y-5 text-center overflow-hidden">

      {/* CSS particle burst */}
      <AnimatePresence>{showParticles && <InlineParticles />}</AnimatePresence>

      {/* ── Trophy ── */}
      <div className="flex flex-col items-center gap-3">
        <TrophyIcon />

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <p className="text-[10px] font-extrabold text-primary uppercase tracking-[0.2em]">
            Diplôme de Croissance
          </p>
          <h2 className="text-lg font-extrabold text-foreground leading-tight mt-1">
            Félicitations — vous êtes prêt à propulser votre commerce ! 🚀
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            7 compétences Kompilot validées · Niveau <span className="font-bold text-primary">Expert Local</span>
          </p>
        </motion.div>
      </div>

      {/* ── Diploma card ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/4 via-teal-50/50 to-emerald-50/30 dark:from-primary/8 dark:via-teal-950/20 dark:to-emerald-950/10 p-4 overflow-hidden text-left"
      >
        <DiplomaWatermark />

        {/* Corner decorations */}
        <div className="absolute top-2 left-2 w-3 h-3 border-l-2 border-t-2 border-primary/30 rounded-tl-sm" />
        <div className="absolute top-2 right-2 w-3 h-3 border-r-2 border-t-2 border-primary/30 rounded-tr-sm" />
        <div className="absolute bottom-2 left-2 w-3 h-3 border-l-2 border-b-2 border-primary/30 rounded-bl-sm" />
        <div className="absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2 border-primary/30 rounded-br-sm" />

        <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mb-3 text-center">
          7 / 7 acquis validés
        </p>

        <div className="space-y-2">
          {SKILLS.map((skill, i) => (
            <motion.div
              key={skill.label}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + i * 0.11, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-2.5"
            >
              <AnimatedCheck delay={0.75 + i * 0.11} />

              {/* Skill icon pill */}
              <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${skill.color} flex items-center justify-center text-[12px] shrink-0 shadow-sm`}>
                {skill.icon}
              </div>

              <p className="text-xs font-bold text-foreground flex-1">{skill.label}</p>

              {/* Stars rating */}
              <div className="flex gap-0.5 shrink-0">
                {[1,2,3].map(s => (
                  <motion.span
                    key={s}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.85 + i * 0.11 + s * 0.06, type: 'spring', stiffness: 400 }}
                    className="text-amber-400 text-[10px]"
                  >
                    ★
                  </motion.span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Bonus block ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl border-2 border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/25 dark:via-yellow-950/15 dark:to-orange-950/10 p-4 space-y-3 text-left overflow-hidden relative"
      >
        {/* Glow blob */}
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

        {/* Header row */}
        <div className="flex items-center gap-2.5 relative">
          <motion.div
            animate={{ rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.15, 1] }}
            transition={{ duration: 1.4, delay: 1.5, repeat: Infinity, repeatDelay: 3 }}
            className="text-2xl select-none shrink-0"
          >
            🎁
          </motion.div>
          <div>
            <p className="text-[10px] font-extrabold text-amber-800 dark:text-amber-300 uppercase tracking-widest leading-none">
              Cadeau de bienvenue activé
            </p>
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mt-0.5">
              3 Crédits de posts IA + 5€ budget Meta offerts !
            </p>
          </div>
          {/* Activated badge */}
          <motion.span
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 2.2, type: 'spring', stiffness: 280 }}
            className="ml-auto shrink-0 text-[9px] font-extrabold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 rounded-full px-2 py-0.5"
          >
            ✓ Activé
          </motion.span>
        </div>

        {/* Segmented progress bar */}
        <BonusBar />

        <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed relative">
          Utilisez votre bonus dès aujourd'hui pour propulser votre premier contenu dans votre quartier.
        </p>
      </motion.div>

      {/* ── Push notification opt-in (before CTA) ── */}
      {pushGranted === null ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.8 }}
          className="mb-4 rounded-xl border border-teal-200 dark:border-teal-800/60 bg-teal-50 dark:bg-teal-950/30 px-4 py-3"
        >
          <p className="text-xs font-extrabold text-teal-800 dark:text-teal-300 mb-1">
            📲 Dernière étape — Alertes de Chiffre d'Affaires
          </p>
          <p className="text-[11px] text-teal-700 dark:text-teal-400 leading-relaxed mb-3">
            Autorisez Kompilot à vous alerter dès qu'une <strong>opportunité de chiffre d'affaires</strong> est détectée sur votre zone — no-show imminent, relance à échéance, lead capturé.
          </p>
          <button
            onClick={handleRequestPush}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2 transition-colors"
          >
            <Bell size={13} /> Activer les alertes de trésorerie
          </button>
        </motion.div>
      ) : pushGranted ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-2.5 flex items-center gap-2"
        >
          <Bell size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            ✅ Alertes activées — vous ne manquerez aucune opportunité
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 px-4 py-2.5 flex items-center gap-2"
        >
          <BellOff size={14} className="text-slate-400 shrink-0" />
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Vous pouvez activer les alertes à tout moment dans vos Paramètres.
          </p>
        </motion.div>
      )}

      {/* ── CTA ── */}
      <ShimmerButton onClick={onClaimBonus} />

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        className="text-[10px] text-muted-foreground"
      >
        Votre bonus de bienvenue sera appliqué sur le forfait choisi
      </motion.p>

      {/* Keyframes for check draw */}
      <style>{`
        @keyframes nc-grad-float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
