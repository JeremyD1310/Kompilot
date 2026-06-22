/**
 * OptimalPostingTimes
 *
 * AI-generated optimal posting schedule per social platform.
 * Uses audience activity patterns, sector benchmarks and the user's
 * current engagement data to recommend the 3 best time-slots per platform.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Sparkles, RefreshCw, TrendingUp, Zap } from 'lucide-react';
import { blink } from '../../blink/client';
import { useEstablishment } from '../../context/EstablishmentContext';

// ── Types ─────────────────────────────────────────────────────────────────────

interface TimeSlot {
  day: string;        // e.g. "Mardi"
  hour: string;       // e.g. "18h–19h"
  boostEstimate: string; // e.g. "+23%"
  reason: string;     // short rationale
}

interface PlatformRecommendation {
  platform: string;       // "Instagram" | "LinkedIn" | "Facebook" | "TikTok"
  emoji: string;
  primaryColor: string;   // CSS hex for the accent chip
  bestSlots: TimeSlot[];  // exactly 3 slots
  audienceInsight: string;
  worstTime: string;      // single phrase like "Lundi matin avant 9h"
}

interface PostingSchedule {
  platforms: PlatformRecommendation[];
  globalInsight: string;
}

// ── Day pill colors ────────────────────────────────────────────────────────────

const DAY_ABBR: Record<string, string> = {
  Lundi: 'Lu', Mardi: 'Ma', Mercredi: 'Me', Jeudi: 'Je',
  Vendredi: 'Ve', Samedi: 'Sa', Dimanche: 'Di',
};

const BOOST_COLOR = (val: string) => {
  const n = parseInt(val.replace(/[^0-9]/g, ''));
  if (n >= 25) return 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800';
  if (n >= 15) return 'text-primary bg-primary/8 border-primary/20';
  return 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800';
};

// ── Platform card ─────────────────────────────────────────────────────────────

function PlatformCard({ rec, index }: { rec: PlatformRecommendation; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      {/* Platform header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/20">
        <span className="text-xl">{rec.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-extrabold text-foreground">{rec.platform}</p>
          <p className="text-[10px] text-muted-foreground line-clamp-1">{rec.audienceInsight}</p>
        </div>
      </div>

      {/* Time slots */}
      <div className="p-3 space-y-2">
        {rec.bestSlots.map((slot, i) => (
          <div key={i} className="flex items-center gap-2 rounded-xl bg-muted/30 border border-border/60 px-3 py-2">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-extrabold text-muted-foreground/60 w-4 text-center">
                {DAY_ABBR[slot.day] ?? slot.day.slice(0, 2)}
              </span>
              <div className="flex items-center gap-1 bg-background border border-border rounded-lg px-2 py-0.5">
                <Clock size={9} className="text-muted-foreground shrink-0" />
                <span className="text-[11px] font-bold text-foreground whitespace-nowrap">{slot.hour}</span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground leading-snug flex-1 min-w-0 line-clamp-2">
              {slot.reason}
            </p>
            <span className={`shrink-0 text-[10px] font-extrabold border rounded-full px-2 py-0.5 whitespace-nowrap ${BOOST_COLOR(slot.boostEstimate)}`}>
              {slot.boostEstimate}
            </span>
          </div>
        ))}
      </div>

      {/* Worst time warning */}
      <div className="px-3 pb-3">
        <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 px-3 py-1.5">
          <span className="text-[10px] font-bold text-red-600 dark:text-red-400 shrink-0">🚫 Éviter :</span>
          <span className="text-[10px] text-red-700 dark:text-red-300">{rec.worstTime}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface OptimalPostingTimesProps {
  /** Engagement stats for context */
  topPlatform?: string;
  engagementRate?: number;
  sector?: string;
}

export function OptimalPostingTimes({ topPlatform = 'Instagram', engagementRate = 4.2, sector }: OptimalPostingTimesProps) {
  const { activeEstablishment } = useEstablishment();
  const [schedule, setSchedule] = useState<PostingSchedule | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const generate = async () => {
    setLoading(true);
    setDone(false);
    setSchedule(null);

    const sectorHint = sector ?? activeEstablishment?.activity ?? 'Commerce local';

    try {
      const { object } = await blink.ai.generateObject({
        model: 'gpt-4.1-mini',
        prompt: `Tu es un expert en marketing digital pour les TPE/PME françaises.
Analyse les habitudes d'audience et génère les meilleurs créneaux de publication pour chaque réseau social.

Contexte :
- Secteur : ${sectorHint}
- Établissement : ${activeEstablishment?.name ?? 'Commerce local'}
- Plateforme la plus performante : ${topPlatform}
- Taux d'engagement actuel : ${engagementRate}%
- Pays : France (fuseaux européens, habitudes françaises)

Génère des recommandations précises, basées sur les études comportementales d'audience françaises.
Pour chaque créneau, donne un boost estimé (%) vs une publication à un moment aléatoire.
Le boost doit être réaliste (entre +8% et +45%).`,
        schema: {
          type: 'object',
          properties: {
            platforms: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  platform: { type: 'string', description: 'Nom de la plateforme (Instagram, LinkedIn, Facebook, TikTok)' },
                  emoji: { type: 'string', description: 'Emoji de la plateforme' },
                  primaryColor: { type: 'string', description: 'Couleur hex de la plateforme' },
                  audienceInsight: { type: 'string', description: 'Insight clé sur l\'audience (1 phrase max 80 chars)' },
                  worstTime: { type: 'string', description: 'Créneau à éviter absolument (ex: Lundi avant 8h)' },
                  bestSlots: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        day:           { type: 'string', description: 'Jour de la semaine en français (Lundi…Dimanche)' },
                        hour:          { type: 'string', description: 'Plage horaire (ex: 18h–19h)' },
                        boostEstimate: { type: 'string', description: 'Boost estimé vs heure quelconque (ex: +28%)' },
                        reason:        { type: 'string', description: 'Raison courte en français (max 60 chars)' },
                      },
                      required: ['day', 'hour', 'boostEstimate', 'reason'],
                    },
                  },
                },
                required: ['platform', 'emoji', 'primaryColor', 'audienceInsight', 'worstTime', 'bestSlots'],
              },
            },
            globalInsight: { type: 'string', description: 'Insight global inter-plateformes (1 phrase max 120 chars)' },
          },
          required: ['platforms', 'globalInsight'],
        },
      });

      setSchedule(object as PostingSchedule);
      setDone(true);
    } catch (err: any) {
      if (err?.message?.includes('401') || err?.name === 'BlinkAuthError') {
        blink.auth.login(window.location.href);
        return;
      }
      console.error('[OptimalPostingTimes] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 p-5 border-b border-border bg-gradient-to-r from-primary/8 via-violet-500/5 to-transparent">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center shrink-0 shadow-sm">
            <Clock size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-extrabold text-foreground leading-tight">
              Meilleurs Créneaux de Publication ⏰
            </p>
            <p className="text-[11px] text-muted-foreground">
              {done ? `Analyse terminée · ${schedule?.platforms.length ?? 0} plateformes` : 'Basé sur les habitudes d\'audience françaises'}
            </p>
          </div>
          <button
            onClick={generate}
            disabled={loading}
            className={`flex items-center gap-1.5 rounded-xl text-xs font-extrabold px-3 py-2 transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed ${
              done
                ? 'border border-border text-muted-foreground hover:bg-muted'
                : 'bg-gradient-to-r from-primary to-violet-500 text-white shadow-md hover:opacity-90'
            }`}
          >
            {loading
              ? <><RefreshCw size={12} className="animate-spin" /> Analyse…</>
              : done
                ? <><RefreshCw size={12} /> Réanalyser</>
                : <><Zap size={12} /> Analyser mes créneaux</>
            }
          </button>
        </div>

        {/* Empty state */}
        {!loading && !done && (
          <div className="flex flex-col items-center justify-center gap-4 py-10 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center">
              <Clock size={24} className="text-primary/50" />
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-foreground">Optimisez vos créneaux de publication</p>
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                L'IA analyse les comportements d'audience pour votre secteur et recommande les 3 meilleurs créneaux par plateforme.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {[
                { icon: TrendingUp, label: 'Engagement +' },
                { icon: Clock, label: 'Horaires précis' },
                { icon: Sparkles, label: 'IA locale' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1">
                  <Icon size={11} className="text-primary/60" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <button
              onClick={generate}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-violet-500 text-white font-extrabold text-sm px-5 py-2.5 hover:opacity-90 active:scale-[0.98] transition-all shadow-md"
            >
              <Clock size={14} /> Analyser mes meilleurs créneaux
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3 animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted" />
                  <div className="space-y-1 flex-1">
                    <div className="h-3 bg-muted rounded w-1/3" />
                    <div className="h-2.5 bg-muted/60 rounded w-3/4" />
                  </div>
                </div>
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-10 rounded-lg bg-muted/40" />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      <AnimatePresence>
        {done && schedule && (
          <>
            {/* Global insight banner */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 rounded-xl bg-primary/5 border border-primary/20 px-4 py-3"
            >
              <Sparkles size={15} className="text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-foreground leading-relaxed">
                <strong className="font-bold">Insight global :</strong> {schedule.globalInsight}
              </p>
            </motion.div>

            {/* Platform cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {schedule.platforms.map((rec, i) => (
                <PlatformCard key={rec.platform} rec={rec} index={i} />
              ))}
            </div>

            {/* Footnote */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-[10px] text-muted-foreground text-center"
            >
              Recommandations basées sur les benchmarks d'audience française · Actualisez chaque mois pour affiner
            </motion.p>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
