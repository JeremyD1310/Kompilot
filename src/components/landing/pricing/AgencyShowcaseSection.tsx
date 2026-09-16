/**
 * AgencyShowcaseSection — Premium showcase for the Agency plan (149€/mois).
 *
 * Highlights 5 key differentiators in a bento-grid layout:
 *  1. Centralisation Multi-Comptes
 *  2. Tracker de Visibilité LLM & AIO Sync
 *  3. Creative Studio Illimité
 *  4. Intégration Native AI Max (Nouveau !)
 *  5. Rapport d'Activité White-Label
 *
 * Dark premium aesthetic — indigo + violet accents on slate-900.
 */

import { motion } from 'framer-motion';
import {
  Users, Radar, Wand2, Plug, FileBarChart,
  ArrowRight, Zap, Sparkles, Globe, Layers,
} from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Button } from '@blinkdotnew/ui';

// ── Design tokens ────────────────────────────────────────────────────────────

const INDIGO = '#818CF8';
const VIOLET = '#A78BFA';
const DARK = '#0B1120';
const SURFACE = '#13193A';

// ── Feature data ─────────────────────────────────────────────────────────────

interface FeatureCard {
  icon: typeof Users;
  label: string;
  title: string;
  description: string;
  /** Gradient accent for the card's glow */
  gradient: string;
  /** Icon background color */
  iconBg: string;
  /** Grid span: 'col1' = 1 col, 'col2' = 2 cols on desktop */
  span: 'col1' | 'col2';
  /** Badge text for new features */
  badge?: string;
}

const FEATURES: FeatureCard[] = [
  {
    icon: Users,
    label: 'Multi-Comptes',
    title: 'Centralisation Multi-Comptes',
    description:
      'Gérez et segmentez les projets de tous vos clients depuis une seule interface. Ajoutez jusqu\'à 30 fiches Google Business, comptes Meta et établissements — sans multiplier les licences.',
    gradient: 'from-blue-600 to-cyan-400',
    iconBg: 'rgba(59,130,246,0.12)',
    span: 'col2',
  },
  {
    icon: Radar,
    label: 'LLM & AIO',
    title: 'Tracker de Visibilité LLM & AIO Sync',
    description:
      'Ajustez vos stratégies de contenu en temps réel selon les algorithmes d\'IA (ChatGPT, Perplexity, Gemini…). Surveillez votre position face aux concurrents sur chaque moteur de réponse IA.',
    gradient: 'from-violet-600 to-purple-400',
    iconBg: 'rgba(139,92,246,0.12)',
    span: 'col1',
  },
  {
    icon: Wand2,
    label: 'Creative Studio',
    title: 'Creative Studio Illimité',
    description:
      'Générez vos assets textuels et vidéos à la chaîne. Posts, stories, scripts UGC, visuels IA — sans limite de crédits. Double moteur GPT-4o + Claude pour une créativité maximale.',
    gradient: 'from-pink-600 to-rose-400',
    iconBg: 'rgba(236,72,153,0.12)',
    span: 'col1',
  },
  {
    icon: Plug,
    label: 'AI Max',
    title: 'Intégration Native AI Max',
    description:
      'Connectez votre clé API AI Max et propulsez instantanément les assets du Creative Studio dans vos campagnes SEA. Zéro copier-coller, zéro friction — de la création à la mise en ligne en un clic.',
    gradient: 'from-amber-500 to-orange-400',
    iconBg: 'rgba(245,158,11,0.12)',
    span: 'col1',
    badge: 'Nouveau !',
  },
  {
    icon: FileBarChart,
    label: 'White-Label',
    title: 'Rapport d\'Activité White-Label',
    description:
      'Exportez des bilans de performance SEO/AIO/SEA personnalisés aux couleurs de votre agence. Votre logo, vos couleurs, votre domaine — vos clients voient votre marque, pas la nôtre.',
    gradient: 'from-emerald-600 to-teal-400',
    iconBg: 'rgba(16,185,129,0.12)',
    span: 'col2',
  },
];

// ── Animations ───────────────────────────────────────────────────────────────

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
};

const stagger = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
};

// ── Single feature card ──────────────────────────────────────────────────────

function FeatureCard({ card, index }: { card: FeatureCard; index: number }) {
  const Icon = card.icon;
  const isWide = card.span === 'col2';

  return (
    <motion.div
      {...stagger}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className={`relative group flex flex-col rounded-2xl overflow-hidden ${
        isWide ? 'md:col-span-2' : 'md:col-span-1'
      }`}
      style={{
        background: SURFACE,
        border: '1px solid rgba(255,255,255,0.06)',
        minHeight: 200,
      }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 30% 20%, ${INDIGO}0A 0%, transparent 70%)`,
        }}
      />

      <div className={`relative z-10 p-6 sm:p-8 flex flex-col h-full ${isWide ? 'sm:flex-row sm:items-center gap-6' : ''}`}>
        {/* Icon + Badge */}
        <div className="flex items-start gap-3 mb-4 sm:mb-0">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: card.iconBg,
              border: `1px solid ${card.iconBg}`,
            }}
          >
            <Icon size={20} style={{ color: INDIGO }} />
          </div>
          {card.badge && (
            <span
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{
                background: 'rgba(245,158,11,0.15)',
                color: '#F59E0B',
                border: '1px solid rgba(245,158,11,0.25)',
              }}
            >
              <Sparkles size={10} />
              {card.badge}
            </span>
          )}
        </div>

        {/* Text */}
        <div className={`flex-1 ${isWide ? '' : ''}`}>
          <p
            className="text-[10px] font-bold uppercase tracking-widest mb-2"
            style={{ color: INDIGO }}
          >
            {card.label}
          </p>
          <h3
            className="text-base sm:text-lg font-extrabold mb-2.5 leading-snug"
            style={{ color: '#F1F5F9' }}
          >
            {card.title}
          </h3>
          <p
            className="text-sm leading-relaxed"
            style={{ color: '#64748B' }}
          >
            {card.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main section ─────────────────────────────────────────────────────────────

export function AgencyShowcaseSection() {
  return (
    <section
      className="relative py-20 sm:py-28 overflow-hidden"
      style={{ background: DARK }}
    >
      {/* Subtle dot grid background */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, ${INDIGO} 1px, transparent 0)`,
          backgroundSize: '28px 28px',
        }}
      />

      {/* Glow orb top-right */}
      <div
        className="absolute -top-32 -right-32 w-80 h-80 rounded-full blur-[120px] pointer-events-none"
        style={{ background: `${INDIGO}15` }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8">

        {/* ── Header ─────────────────────────────────────────────── */}
        <motion.div {...fadeUp} className="text-center mb-14">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5"
            style={{
              background: `${INDIGO}14`,
              border: `1px solid ${INDIGO}30`,
            }}
          >
            <Layers size={13} style={{ color: INDIGO }} />
            <span
              className="text-[11px] font-bold uppercase tracking-widest"
              style={{ color: INDIGO }}
            >
              Plan Agency — 149€ HT / mois
            </span>
          </div>

          <h2
            className="font-black leading-tight mb-4"
            style={{
              fontSize: 'clamp(1.75rem, 4.5vw, 2.8rem)',
              color: '#F1F5F9',
              letterSpacing: '-0.035em',
            }}
          >
            Chapeautez le SEO, l'AIO et le SEA<br className="hidden sm:block" />
            de tous vos clients au même endroit.
          </h2>

          <p
            className="text-base max-w-2xl mx-auto leading-relaxed"
            style={{ color: '#64748B' }}
          >
            Le plan Agency est conçu pour les professionnels du marketing qui veulent scaler
            leurs résultats sans multiplier les outils. Automatisez votre production, dominez
            les moteurs de recherche traditionnels comme les IA, et pilotez vos campagnes
            publicitaires avec une efficacité redoutable.
          </p>
        </motion.div>

        {/* ── Bento grid ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mb-12">
          {FEATURES.map((card, i) => (
            <FeatureCard key={card.label} card={card} index={i} />
          ))}
        </div>

        {/* ── CTA ────────────────────────────────────────────────── */}
        <motion.div {...fadeUp} className="text-center">
          <Link to="/signup">
            <Button
              className="font-bold text-sm sm:text-base px-8 py-4 rounded-xl inline-flex items-center gap-2.5 transition-all hover:scale-[1.03] active:scale-[0.98]"
              style={{
                background: `linear-gradient(135deg, ${INDIGO}, ${VIOLET})`,
                border: 'none',
                color: '#fff',
                boxShadow: `0 4px 24px ${INDIGO}40, 0 0 0 1px ${INDIGO}20`,
                height: 52,
              }}
            >
              <Zap size={16} className="fill-white" />
              Développer mon agence
              <span className="text-white/60 text-xs font-normal">(Essai gratuit de 14 jours)</span>
              <ArrowRight size={16} />
            </Button>
          </Link>

          {/* Trust micro-copy */}
          <div className="flex flex-wrap items-center justify-center gap-5 mt-6">
            {[
              { icon: <Globe size={13} />, label: 'Hébergé en Europe' },
              { icon: <Sparkles size={13} />, label: 'Sans engagement' },
              { icon: <Zap size={13} />, label: 'Activation instantanée' },
            ].map((t) => (
              <span
                key={t.label}
                className="flex items-center gap-1.5 text-[11px]"
                style={{ color: '#475569' }}
              >
                {t.icon} {t.label}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
