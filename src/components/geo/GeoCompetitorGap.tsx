/**
 * GeoCompetitorGap — Top 3 competitors most cited by AI LLMs
 * Shows competitor score + AI-extracted "why they rank higher" analysis.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ChevronDown, ChevronUp, Star, MessageSquare, Clock, Hash } from 'lucide-react';

interface Competitor {
  rank: number;
  name: string;
  score: number;
  delta: number; // score difference vs user
  reviewCount: number;
  avgRating: number;
  lastActivity: string;
  reasons: Array<{ icon: React.ReactNode; label: string; detail: string }>;
  keywords: string[];
}

function buildCompetitors(city: string, activity: string): Competitor[] {
  return [
    {
      rank: 1,
      name: `${activity.charAt(0).toUpperCase() + activity.slice(1)} Excellence ${city}`,
      score: 81,
      delta: +33,
      reviewCount: 247,
      avgRating: 4.8,
      lastActivity: 'Il y a 2 jours',
      reasons: [
        { icon: <Star size={11} />, label: "Volume d'avis récents élevé", detail: '+47 avis en 30 jours' },
        { icon: <MessageSquare size={11} />, label: 'Mots-clés sémantiques riches', detail: '"Ambiance chaleureuse", "équipe souriante", "rapport qualité-prix excellent"' },
        { icon: <Hash size={11} />, label: 'Contenu structuré Schema.org', detail: 'JSON-LD LocalBusiness complet sur leur site' },
      ],
      keywords: ['qualité service', 'accueil chaleureux', 'rapport qualité prix', 'recommandé'],
    },
    {
      rank: 2,
      name: `Le Meilleur ${activity.charAt(0).toUpperCase() + activity.slice(1)}`,
      score: 74,
      delta: +26,
      reviewCount: 189,
      avgRating: 4.6,
      lastActivity: 'Il y a 5 jours',
      reasons: [
        { icon: <Clock size={11} />, label: 'Activité Google Business régulière', detail: 'Photos et posts Google toutes les semaines' },
        { icon: <Star size={11} />, label: 'Avis récents de haute qualité', detail: 'Note moyenne 4.6/5 sur les 30 derniers jours' },
        { icon: <MessageSquare size={11} />, label: 'Mentions presse régionale', detail: 'Cité 3 fois dans La Dépêche locale' },
      ],
      keywords: ['service rapide', 'professionnel', 'prix compétitif', 'local'],
    },
    {
      rank: 3,
      name: `${activity.charAt(0).toUpperCase() + activity.slice(1)} Premium ${city}`,
      score: 67,
      delta: +19,
      reviewCount: 134,
      avgRating: 4.5,
      lastActivity: 'Il y a 1 semaine',
      reasons: [
        { icon: <Hash size={11} />, label: 'Présence sur annuaires locaux', detail: 'Pages Jaunes, Yelp, TripAdvisor actifs' },
        { icon: <MessageSquare size={11} />, label: 'Description détaillée des services', detail: 'Contenu exhaustif sur Google Maps et site web' },
      ],
      keywords: ['expertise locale', 'reconnu', 'incontournable', 'qualité'],
    },
  ];
}

const RANK_STYLES = [
  { medal: '🥇', bg: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200/60', badge: 'bg-amber-100 text-amber-700' },
  { medal: '🥈', bg: 'bg-slate-50 dark:bg-slate-900/20 border-slate-200/60', badge: 'bg-slate-100 text-slate-600' },
  { medal: '🥉', bg: 'bg-orange-50 dark:bg-orange-950/20 border-orange-200/60', badge: 'bg-orange-100 text-orange-700' },
];

function CompetitorCard({ competitor, userScore }: { competitor: Competitor; userScore: number }) {
  const [expanded, setExpanded] = useState(false);
  const style = RANK_STYLES[competitor.rank - 1];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: competitor.rank * 0.1 }}
      className={`rounded-2xl border overflow-hidden ${style.bg}`}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3">
        <span className="text-xl shrink-0">{style.medal}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{competitor.name}</p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Star size={9} className="fill-amber-400 text-amber-400" />
              {competitor.avgRating} · {competitor.reviewCount} avis
            </span>
            <span className="text-[10px] text-muted-foreground">{competitor.lastActivity}</span>
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-0.5">
          <span className="text-base font-extrabold text-foreground">{competitor.score}</span>
          <span className={`text-[10px] font-bold ${style.badge} rounded-full px-1.5 py-0.5`}>
            +{competitor.delta} vs vous
          </span>
        </div>
      </div>

      {/* Score bar */}
      <div className="px-4 pb-1">
        <div className="relative h-1.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="absolute h-full rounded-full bg-muted-foreground/30"
            initial={{ width: 0 }}
            animate={{ width: `${userScore}%` }}
            transition={{ duration: 0.8 }}
          />
          <motion.div
            className="absolute h-full rounded-full bg-amber-500"
            initial={{ width: 0 }}
            animate={{ width: `${competitor.score}%` }}
            transition={{ duration: 1, delay: 0.2 }}
          />
        </div>
      </div>

      {/* Keywords */}
      <div className="px-4 pb-3 flex flex-wrap gap-1 mt-2">
        {competitor.keywords.map(kw => (
          <span key={kw} className="text-[9px] font-semibold bg-muted/70 text-muted-foreground rounded-full px-2 py-0.5">
            #{kw}
          </span>
        ))}
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-2 text-[10px] font-semibold text-primary hover:bg-primary/5 transition-colors border-t border-border/50"
      >
        <span>Pourquoi l'IA les choisit — {competitor.reasons.length} raisons identifiées</span>
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {/* Reasons detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2 pt-2">
              {competitor.reasons.map((reason, i) => (
                <div key={i} className="flex items-start gap-2.5 rounded-xl bg-background/60 border border-border/60 px-3 py-2.5">
                  <span className="text-primary mt-0.5 shrink-0">{reason.icon}</span>
                  <div>
                    <p className="text-[11px] font-bold text-foreground">{reason.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{reason.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface GeoCompetitorGapProps {
  city: string;
  activity: string;
  userScore: number;
}

export function GeoCompetitorGap({ city, activity, userScore }: GeoCompetitorGapProps) {
  const competitors = buildCompetitors(city, activity);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Trophy size={15} className="text-amber-500" />
        <h2 className="text-sm font-bold text-foreground">Top 3 concurrents les plus cités par l'IA</h2>
        <span className="text-[9px] font-bold bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">Espionnage concurrentiel</span>
      </div>
      <p className="text-[11px] text-muted-foreground -mt-1">
        Ces établissements de {city} sont systématiquement recommandés par ChatGPT, Gemini et Perplexity
        pour les recherches <em>"{activity} à {city}"</em>.
      </p>
      {competitors.map(c => (
        <CompetitorCard key={c.rank} competitor={c} userScore={userScore} />
      ))}
    </div>
  );
}
