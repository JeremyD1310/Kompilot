/**
 * CalendarAIDraftSidebar
 * Date-aware AI post draft assistant for the calendar view.
 * Generates content suggestions based on the selected date's context:
 * day of week, proximity to French holidays, month period, and existing post density.
 */
import { useState, useRef, useEffect } from 'react';
import { format, differenceInDays, parseISO, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, CalendarDays, RefreshCw, ChevronRight,
  Lightbulb, Zap, Copy, Check, X, Info,
} from 'lucide-react';
import { blink } from '../../blink/client';
import { getFrenchHolidays } from '../../lib/frenchHolidays';
import type { ScheduledPost } from './CreatePostModal';

// ── Types ─────────────────────────────────────────────────────────────────────

interface DraftSuggestion {
  id: string;
  title: string;
  text: string;
  theme: string;
  channels: string[];
  emoji: string;
}

interface CalendarAIDraftSidebarProps {
  /** Currently selected/focused date (yyyy-MM-dd) */
  selectedDate: string | null;
  /** All currently scheduled posts (to infer density & themes) */
  existingPosts: ScheduledPost[];
  /** Called when user wants to schedule a suggestion */
  onSchedule: (text: string, date: string) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const DAY_NAMES_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTH_PERIODS = ['début de mois', 'milieu de mois', 'fin de mois'];
const SEASONAL_THEMES: Record<number, string[]> = {
  1:  ['Bonne année', 'Résolutions', 'Hiver'],
  2:  ['Saint-Valentin', 'Hiver', 'Chandeleur'],
  3:  ['Printemps', 'Mois de la femme', 'Renouveau'],
  4:  ['Pâques', 'Printemps', 'Journée de la Terre'],
  5:  ['Fête du Travail', 'Fête des Mères', 'Printemps'],
  6:  ['Été', 'Fête de la Musique', 'Mi-année'],
  7:  ['Fête Nationale', 'Soldes', 'Vacances d\'été'],
  8:  ['Vacances', 'Fin d\'été', 'Rentrée imminente'],
  9:  ['Rentrée', 'Automne', 'Nouvelles ambitions'],
  10: ['Halloween', 'Automne', 'Octobre Rose'],
  11: ['Toussaint', 'Black Friday', 'Noël en approche'],
  12: ['Noël', 'Réveillon', 'Bilan annuel'],
};

function getDateContext(dateStr: string, existingPosts: ScheduledPost[]) {
  const date = parseISO(dateStr);
  const dayOfWeek = date.getDay();
  const dayNum = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  // Period of month
  const period = dayNum <= 10 ? MONTH_PERIODS[0] : dayNum <= 20 ? MONTH_PERIODS[1] : MONTH_PERIODS[2];

  // Nearby holidays (within 7 days)
  const holidays = getFrenchHolidays(year);
  const nearbyHolidays: string[] = [];
  for (let offset = -3; offset <= 7; offset++) {
    const candidate = addDays(date, offset);
    const key = format(candidate, 'yyyy-MM-dd');
    if (holidays[key]) nearbyHolidays.push(`${holidays[key]} (${offset === 0 ? 'aujourd\'hui' : offset < 0 ? `il y a ${Math.abs(offset)}j` : `dans ${offset}j`})`);
  }

  // Post density that week (posts within ±3 days)
  const postsThisWeek = existingPosts.filter(p => {
    try {
      const diff = Math.abs(differenceInDays(parseISO(p.date), date));
      return diff <= 3;
    } catch { return false; }
  });

  // Seasonal themes
  const seasonal = SEASONAL_THEMES[month] ?? [];

  return {
    dayName: DAY_NAMES_FR[dayOfWeek],
    isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    period,
    month,
    year,
    nearbyHolidays,
    postsThisWeek: postsThisWeek.length,
    seasonal,
    formattedDate: format(date, "d MMMM yyyy", { locale: fr }),
  };
}

function buildPrompt(dateStr: string, context: ReturnType<typeof getDateContext>): string {
  const holidayLine = context.nearbyHolidays.length > 0
    ? `\nFêtes / jours fériés proches : ${context.nearbyHolidays.join(', ')}.`
    : '';
  const densityLine = context.postsThisWeek > 0
    ? `\n${context.postsThisWeek} publication(s) déjà planifiées cette semaine — varie le type de contenu.`
    : '\nAucune publication planifiée cette semaine — idéal pour diversifier.';

  return `Tu es un expert en marketing local pour les TPE/PME françaises.

Contexte de la date de publication :
- Date : ${context.formattedDate} (${context.dayName})
- Période : ${context.period}
- Jour : ${context.isWeekend ? 'week-end — ton plus décontracté, contenus lifestyle/offres' : 'semaine — bon équilibre entre professionnel et humain'}
- Thèmes saisonniers : ${context.seasonal.join(', ')}${holidayLine}${densityLine}

Génère 3 suggestions de publications VARIÉES (un conseil/astuce, un contenu humain/coulisses, une promotion ou actualité) adaptées à cette date et à ces thèmes. Chaque suggestion doit être directement utilisable.

Pour chaque suggestion :
- title : titre court de l'idée (4-6 mots max)
- text : texte complet prêt à publier en français (100-200 caractères), avec emojis et un appel à l'action
- theme : thème principal utilisé (ex: "Noël", "Rentrée", "Engagement communauté")
- channels : 1-3 canaux recommandés parmi [instagram, facebook, linkedin, google_business, tiktok]
- emoji : un seul emoji représentatif de la suggestion

Réponds uniquement avec un JSON valide.`;
}

// ── Copy button ───────────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async (e) => {
        e.stopPropagation();
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className="p-1.5 rounded-lg hover:bg-muted transition-colors"
      title="Copier"
    >
      {copied
        ? <Check size={12} className="text-emerald-500" />
        : <Copy size={12} className="text-muted-foreground" />
      }
    </button>
  );
}

// ── Suggestion card ───────────────────────────────────────────────────────────

function SuggestionCard({
  s,
  onSchedule,
  selectedDate,
}: {
  s: DraftSuggestion;
  onSchedule: (text: string, date: string) => void;
  selectedDate: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="group rounded-xl border border-border bg-card p-3.5 space-y-2.5 hover:border-primary/40 hover:shadow-sm transition-all duration-150 cursor-pointer"
      onClick={() => onSchedule(s.text, selectedDate)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-base shrink-0">{s.emoji}</span>
          <p className="text-xs font-semibold text-foreground leading-snug truncate">{s.title}</p>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <CopyBtn text={s.text} />
          <button
            onClick={(e) => { e.stopPropagation(); onSchedule(s.text, selectedDate); }}
            className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
            title="Planifier"
          >
            <ChevronRight size={12} className="text-primary" />
          </button>
        </div>
      </div>

      <p className="text-xs text-foreground/80 leading-relaxed line-clamp-3">{s.text}</p>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/8 border border-primary/15 rounded-full px-2 py-0.5">
          {s.theme}
        </span>
        {s.channels.slice(0, 2).map(ch => (
          <span key={ch} className="text-[10px] text-muted-foreground bg-muted/60 border border-border rounded-full px-1.5 py-0.5 capitalize">
            {ch.replace('_', ' ')}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-3.5 space-y-2.5 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-muted" />
        <div className="h-3 w-2/3 rounded-full bg-muted" />
      </div>
      <div className="space-y-1.5">
        <div className="h-2.5 rounded-full bg-muted/70 w-full" />
        <div className="h-2.5 rounded-full bg-muted/50 w-4/5" />
        <div className="h-2.5 rounded-full bg-muted/40 w-3/5" />
      </div>
      <div className="flex gap-2">
        <div className="h-4 w-16 rounded-full bg-muted/60" />
        <div className="h-4 w-12 rounded-full bg-muted/40" />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function CalendarAIDraftSidebar({
  selectedDate,
  existingPosts,
  onSchedule,
}: CalendarAIDraftSidebarProps) {
  const [suggestions, setSuggestions] = useState<DraftSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [lastGeneratedDate, setLastGeneratedDate] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-generate when selected date changes — cleanup aborts any in-flight request on unmount
  useEffect(() => {
    if (!selectedDate || selectedDate === lastGeneratedDate) return;
    generate(selectedDate);
    return () => {
      // Abort in-flight request if component unmounts before generation completes
      abortRef.current?.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const generate = async (date: string) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(false);
    setSuggestions([]);

    try {
      const ctx = getDateContext(date, existingPosts);
      const prompt = buildPrompt(date, ctx);

      const { object } = await blink.ai.generateObject({
        prompt,
        schema: {
          type: 'object',
          properties: {
            suggestions: {
              type: 'array',
              minItems: 3,
              maxItems: 3,
              items: {
                type: 'object',
                properties: {
                  id:       { type: 'string' },
                  title:    { type: 'string' },
                  text:     { type: 'string' },
                  theme:    { type: 'string' },
                  channels: { type: 'array', items: { type: 'string' } },
                  emoji:    { type: 'string' },
                },
                required: ['id', 'title', 'text', 'theme', 'channels', 'emoji'],
              },
            },
          },
          required: ['suggestions'],
        },
      });

      const data = object as { suggestions: DraftSuggestion[] };
      if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        setSuggestions(data.suggestions.map((s, i) => ({ ...s, id: s.id || `s${i}` })));
        setLastGeneratedDate(date);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      if (err?.message?.includes('401') || err?.name === 'BlinkAuthError') {
        blink.auth.login(window.location.href);
        return;
      }
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // ── No date selected ─────────────────────────────────────────────────────────
  if (!selectedDate) {
    return (
      <div className="w-72 shrink-0 rounded-2xl border border-dashed border-border bg-card/50 flex flex-col items-center justify-center gap-4 p-6 text-center min-h-[320px]">
        <div className="w-12 h-12 rounded-2xl bg-primary/8 flex items-center justify-center">
          <CalendarDays size={22} className="text-primary/50" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">Assistant de rédaction IA</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Cliquez sur un jour du calendrier pour obtenir des suggestions de contenu adaptées à cette date.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground/60">
          <Info size={11} />
          <span>Thèmes, jours fériés, saisonnalité</span>
        </div>
      </div>
    );
  }

  const ctx = getDateContext(selectedDate, existingPosts);

  return (
    <div className="w-72 shrink-0 flex flex-col gap-3">
      {/* Header */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-2.5 px-3.5 py-3 border-b border-border bg-gradient-to-r from-primary/8 to-violet-500/5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center shrink-0">
            <Sparkles size={13} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-extrabold text-foreground leading-tight">Rédaction IA ✨</p>
            <p className="text-[10px] text-muted-foreground">Basée sur la date sélectionnée</p>
          </div>
          <button
            onClick={() => generate(selectedDate)}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-40"
            title="Régénérer"
          >
            <RefreshCw size={13} className={`text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Date context pill */}
        <div className="px-3.5 py-3 space-y-2">
          <div className="flex items-center gap-2 rounded-lg bg-muted/60 border border-border px-3 py-2">
            <CalendarDays size={13} className="text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground capitalize">{ctx.formattedDate}</p>
              <p className="text-[10px] text-muted-foreground">
                {ctx.dayName} · {ctx.period} · {ctx.isWeekend ? '🌴 Week-end' : '💼 Semaine'}
              </p>
            </div>
          </div>

          {/* Seasonal themes */}
          {ctx.seasonal.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {ctx.seasonal.slice(0, 3).map(theme => (
                <span key={theme} className="inline-flex items-center gap-1 text-[10px] font-medium text-foreground/70 bg-muted/40 border border-border rounded-full px-2 py-0.5">
                  {theme}
                </span>
              ))}
            </div>
          )}

          {/* Nearby holidays */}
          {ctx.nearbyHolidays.length > 0 && (
            <div className="flex items-start gap-1.5 rounded-lg bg-amber-50 border border-amber-200/80 px-2.5 py-1.5">
              <span className="text-base shrink-0 leading-none mt-0.5">🎉</span>
              <p className="text-[10px] text-amber-800 leading-snug">
                <span className="font-semibold">Fête proche :</span> {ctx.nearbyHolidays[0]}
              </p>
            </div>
          )}

          {/* Post density */}
          {ctx.postsThisWeek > 0 && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Lightbulb size={10} className="text-primary/60 shrink-0" />
              {ctx.postsThisWeek} post{ctx.postsThisWeek > 1 ? 's' : ''} planifié{ctx.postsThisWeek > 1 ? 's' : ''} cette semaine — variez les contenus !
            </p>
          )}
        </div>
      </div>

      {/* Suggestions */}
      <div className="space-y-2.5">
        {loading && (
          <>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 px-0.5">
              <Zap size={11} className="text-primary animate-pulse shrink-0" />
              Génération des suggestions…
            </p>
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-border bg-card p-4 text-center space-y-3">
            <X size={20} className="mx-auto text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">Impossible de générer les suggestions.<br />Vérifiez votre connexion.</p>
            <button
              onClick={() => generate(selectedDate)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Réessayer
            </button>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {!loading && !error && suggestions.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <SuggestionCard
                s={s}
                onSchedule={onSchedule}
                selectedDate={selectedDate}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {!loading && !error && suggestions.length > 0 && (
          <p className="text-[10px] text-muted-foreground text-center pb-1">
            Cliquez sur une suggestion pour la planifier à cette date
          </p>
        )}
      </div>
    </div>
  );
}
