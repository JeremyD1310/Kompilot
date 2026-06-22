/**
 * WelcomeModal
 *
 * Full-screen celebration overlay shown immediately after a successful
 * subscription payment. Adapts content for B2C vs B2B franchise plans.
 * B2B includes an interactive onboarding checklist with persistent state.
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Zap, ArrowRight, Users, Calendar, BarChart2, Building2,
  CheckCircle2, Circle, ChevronRight, Settings, MapPin, UserPlus,
  LayoutDashboard, BookOpen,
} from 'lucide-react';
import { Button } from '@blinkdotnew/ui';
import { useNavigate } from '@tanstack/react-router';
import { detectWelcomeEmailType, getAICreditsBonusForPlan } from '../../lib/welcomeEmailTemplates';

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
  planName: string;
  firstName?: string;
}

// ── B2B Onboarding checklist ───────────────────────────────────────────────────

interface ChecklistItem {
  id: string;
  icon: React.ElementType;
  iconColor: string;
  label: string;
  desc: string;
  cta: string;
  href: string;
  estimatedTime: string;
  priority: 'required' | 'recommended' | 'optional';
}

const B2B_CHECKLIST: ChecklistItem[] = [
  {
    id: 'establishment',
    icon: Building2,
    iconColor: 'text-primary',
    label: 'Configurer votre premier établissement',
    desc: 'Renseignez le nom, secteur, ville et informations de contact de votre premier point de vente.',
    cta: 'Configurer →',
    href: '/establishments',
    estimatedTime: '3 min',
    priority: 'required',
  },
  {
    id: 'team',
    icon: UserPlus,
    iconColor: 'text-violet-500',
    label: 'Inviter vos managers locaux',
    desc: 'Donnez un accès sécurisé à chaque responsable de boutique, sans visibilité sur vos données financières.',
    cta: 'Inviter →',
    href: '/settings',
    estimatedTime: '2 min',
    priority: 'required',
  },
  {
    id: 'brand',
    icon: Settings,
    iconColor: 'text-teal-500',
    label: 'Personnaliser votre identité de marque',
    desc: "Ajoutez votre logo, charte couleurs et piliers de contenu pour que l'IA génère dans votre style.",
    cta: 'Configurer →',
    href: '/settings',
    estimatedTime: '5 min',
    priority: 'recommended',
  },
  {
    id: 'geo',
    icon: MapPin,
    iconColor: 'text-orange-500',
    label: 'Connecter votre fiche Google Maps',
    desc: "Liez vos fiches Google Business pour monitorer vos avis et votre présence locale en temps réel.",
    cta: 'Connecter →',
    href: '/settings',
    estimatedTime: '3 min',
    priority: 'recommended',
  },
  {
    id: 'calendar',
    icon: Calendar,
    iconColor: 'text-blue-500',
    label: 'Planifier votre première publication réseau',
    desc: "Créez un post type à dupliquer sur tous vos établissements en un clic grâce au multiposting IA.",
    cta: 'Planifier →',
    href: '/calendar',
    estimatedTime: '5 min',
    priority: 'recommended',
  },
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    iconColor: 'text-emerald-500',
    label: 'Explorer le tableau de bord réseau',
    desc: 'Découvrez les KPIs globaux, le comparateur de performances par établissement et le ROI consolidé.',
    cta: 'Explorer →',
    href: '/dashboard',
    estimatedTime: '2 min',
    priority: 'optional',
  },
  {
    id: 'guide',
    icon: BookOpen,
    iconColor: 'text-indigo-500',
    label: 'Lire le guide de démarrage réseau',
    desc: 'Meilleures pratiques pour déployer Kompilot sur 5, 20 ou 100+ établissements.',
    cta: 'Lire →',
    href: '/guide',
    estimatedTime: '10 min',
    priority: 'optional',
  },
];

const PRIORITY_LABELS = {
  required: { label: 'Requis', class: 'bg-red-100 text-red-700 border-red-200' },
  recommended: { label: 'Recommandé', class: 'bg-amber-100 text-amber-700 border-amber-200' },
  optional: { label: 'Optionnel', class: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const STORAGE_KEY = 'kompilot:b2b_checklist';

function useChecklistState() {
  const [checked, setChecked] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  return { checked, toggle };
}

// ── B2C content ────────────────────────────────────────────────────────────────

function B2CContent({ planName, onClose }: { planName: string; onClose: () => void }) {
  const navigate = useNavigate();
  const credits = getAICreditsBonusForPlan(planName);

  const NEXT_STEPS = [
    { icon: Zap, label: 'Lancer mon Audit GEO', href: '/cockpit', desc: 'Découvrez ce que ChatGPT dit de vous' },
    { icon: Calendar, label: 'Planifier mon 1er post', href: '/calendar', desc: 'Calendrier éditorial IA' },
    { icon: BarChart2, label: 'Voir mes stats', href: '/performance', desc: 'ROI et performances réseaux' },
  ];

  return (
    <div className="flex flex-col items-center text-center gap-6 py-2">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
        className="text-6xl leading-none"
      >
        🎉
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-2"
      >
        <h2 className="text-2xl font-extrabold text-foreground leading-tight">
          Bienvenue à bord de Kompilot !
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Merci pour votre confiance. Votre offre{' '}
          <strong className="text-primary">{planName}</strong> est activée.
          <br />
          Votre commerce est officiellement équipé de son copilote IA.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.35 }}
        className="w-full bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3"
      >
        <span className="text-2xl shrink-0">🎁</span>
        <p className="text-sm text-amber-800 leading-snug text-left">
          <strong>Bonus activé :</strong>{' '}
          <span className="text-primary font-bold">{credits} crédits IA</span> viennent d'être
          crédités sur votre compte pour tester la génération de masse !
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="w-full bg-gradient-to-r from-primary/8 to-violet-500/5 border border-primary/20 rounded-xl px-4 py-3"
      >
        <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">
          🚀 Prochaine étape (2 min chrono)
        </p>
        <p className="text-sm text-foreground leading-relaxed">
          Lancez votre premier <strong>Audit GEO</strong> depuis le Cockpit IA pour découvrir ce
          que <strong>ChatGPT et Gemini</strong> disent de vous dans votre quartier.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
        className="w-full space-y-2"
      >
        {NEXT_STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <button
              key={step.href}
              onClick={() => { navigate({ to: step.href as any }); onClose(); }}
              className="w-full flex items-center gap-3 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/4 px-4 py-3 text-left transition-all group"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <Icon size={15} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground leading-tight">{step.label}</p>
                <p className="text-[11px] text-muted-foreground">{step.desc}</p>
              </div>
              <ArrowRight size={14} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          );
        })}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="w-full"
      >
        <Button
          onClick={() => { navigate({ to: '/cockpit' }); onClose(); }}
          className="w-full gap-2 text-sm"
        >
          <Zap size={15} />
          Accéder à mon Cockpit IA ⚡
        </Button>
      </motion.div>
    </div>
  );
}

// ── B2B content with interactive checklist ─────────────────────────────────────

function B2BContent({ planName, onClose }: { planName: string; onClose: () => void }) {
  const navigate = useNavigate();
  const { checked, toggle } = useChecklistState();

  const requiredItems = B2B_CHECKLIST.filter((i) => i.priority === 'required');
  const otherItems = B2B_CHECKLIST.filter((i) => i.priority !== 'required');
  const totalRequired = requiredItems.length;
  const doneRequired = requiredItems.filter((i) => checked.has(i.id)).length;
  const totalAll = B2B_CHECKLIST.length;
  const doneAll = B2B_CHECKLIST.filter((i) => checked.has(i.id)).length;
  const progressPct = Math.round((doneAll / totalAll) * 100);
  const allRequiredDone = doneRequired === totalRequired;

  return (
    <div className="flex flex-col gap-4 py-1">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center"
      >
        <div className="text-4xl leading-none mb-2">🤝</div>
        <h2 className="text-xl font-extrabold text-foreground leading-tight">
          Bienvenue chez Kompilot !
        </h2>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          Offre <strong className="text-primary">{planName}</strong> — espace Tête de réseau configuré
        </p>
      </motion.div>

      {/* Progress bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-muted/30 border border-border rounded-xl px-4 py-3"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-foreground">
            Configuration réseau
          </span>
          <span className={`text-xs font-bold tabular-nums ${allRequiredDone ? 'text-emerald-600' : 'text-primary'}`}>
            {doneAll}/{totalAll} étapes
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full transition-all duration-500 ${allRequiredDone ? 'bg-emerald-500' : 'bg-gradient-to-r from-primary to-violet-500'}`}
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
          />
        </div>
        {!allRequiredDone && (
          <p className="text-[10px] text-muted-foreground mt-1.5">
            {totalRequired - doneRequired} étape{totalRequired - doneRequired > 1 ? 's' : ''} requise{totalRequired - doneRequired > 1 ? 's' : ''} restante{totalRequired - doneRequired > 1 ? 's' : ''}
          </p>
        )}
        {allRequiredDone && (
          <p className="text-[10px] text-emerald-600 font-semibold mt-1.5 flex items-center gap-1">
            <CheckCircle2 size={10} /> Configuration essentielle complète !
          </p>
        )}
      </motion.div>

      {/* Checklist */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-1.5 max-h-[340px] overflow-y-auto pr-0.5"
      >
        {/* Required section */}
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1 pb-0.5">
          Étapes obligatoires
        </p>
        {requiredItems.map((item, i) => (
          <ChecklistRow
            key={item.id}
            item={item}
            isChecked={checked.has(item.id)}
            onToggle={() => toggle(item.id)}
            onNavigate={() => { navigate({ to: item.href as any }); onClose(); }}
            delay={0.35 + i * 0.06}
          />
        ))}

        {/* Recommended & optional section */}
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1 pb-0.5 pt-2">
          Étapes recommandées & optionnelles
        </p>
        {otherItems.map((item, i) => (
          <ChecklistRow
            key={item.id}
            item={item}
            isChecked={checked.has(item.id)}
            onToggle={() => toggle(item.id)}
            onNavigate={() => { navigate({ to: item.href as any }); onClose(); }}
            delay={0.5 + i * 0.05}
          />
        ))}
      </motion.div>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
        className="flex gap-2 pt-1"
      >
        <Button
          onClick={() => { navigate({ to: '/establishments' as any }); onClose(); }}
          className="flex-1 gap-1.5 text-sm h-9"
        >
          <Building2 size={14} />
          Panneau Réseau 🏢
        </Button>
        <Button
          variant="outline"
          onClick={() => { navigate({ to: '/settings' as any }); onClose(); }}
          className="gap-1.5 text-sm h-9 px-3"
        >
          <Users size={14} />
          Équipe
        </Button>
      </motion.div>
    </div>
  );
}

// ── Checklist row sub-component ────────────────────────────────────────────────

function ChecklistRow({
  item,
  isChecked,
  onToggle,
  onNavigate,
  delay,
}: {
  item: ChecklistItem;
  isChecked: boolean;
  onToggle: () => void;
  onNavigate: () => void;
  delay: number;
}) {
  const Icon = item.icon;
  const priority = PRIORITY_LABELS[item.priority];

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 transition-all group ${
        isChecked
          ? 'bg-emerald-50/60 border-emerald-200/70 dark:bg-emerald-950/10 dark:border-emerald-800/40'
          : 'bg-card border-border hover:border-primary/30 hover:bg-muted/20'
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className="shrink-0 mt-0.5 transition-colors"
        aria-label={isChecked ? 'Marquer comme non fait' : 'Marquer comme fait'}
      >
        {isChecked ? (
          <CheckCircle2 size={18} className="text-emerald-500" />
        ) : (
          <Circle size={18} className="text-muted-foreground/40 group-hover:text-primary/40 transition-colors" />
        )}
      </button>

      {/* Icon + content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <div className={`flex items-center gap-1.5 min-w-0 flex-1 ${isChecked ? 'opacity-60' : ''}`}>
            <Icon size={13} className={`shrink-0 ${item.iconColor}`} />
            <p className={`text-xs font-semibold text-foreground leading-snug ${isChecked ? 'line-through decoration-muted-foreground/40' : ''}`}>
              {item.label}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className={`text-[9px] font-bold border rounded-full px-1.5 py-0.5 ${priority.class}`}>
              {priority.label}
            </span>
            <span className="text-[9px] text-muted-foreground/60 font-medium">{item.estimatedTime}</span>
          </div>
        </div>
        {!isChecked && (
          <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5 line-clamp-1">
            {item.desc}
          </p>
        )}
      </div>

      {/* Navigate CTA */}
      {!isChecked && (
        <button
          onClick={onNavigate}
          className="shrink-0 flex items-center gap-0.5 text-[10px] font-bold text-primary hover:text-primary/80 transition-colors mt-0.5"
        >
          {item.cta}
          <ChevronRight size={10} />
        </button>
      )}
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function WelcomeModal({ open, onClose, planName, firstName }: WelcomeModalProps) {
  const type = detectWelcomeEmailType(planName);
  const isB2B = type === 'b2b-franchise';

  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className={`pointer-events-auto w-full bg-card rounded-3xl shadow-[0_32px_80px_-12px_rgba(0,0,0,0.35)] border border-border overflow-hidden ${isB2B ? 'max-w-lg' : 'max-w-md'}`}>
              {/* Decorative header strip */}
              <div className="h-1.5 w-full bg-gradient-to-r from-primary via-violet-500 to-primary" />

              <div className="relative px-6 py-5">
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted/60 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors z-10"
                >
                  <X size={14} />
                </button>

                {isB2B ? (
                  <B2BContent planName={planName} onClose={onClose} />
                ) : (
                  <B2CContent planName={planName} onClose={onClose} />
                )}

                <button
                  onClick={onClose}
                  className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors mt-3"
                >
                  Fermer et explorer par moi-même
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
