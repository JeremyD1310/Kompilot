/**
 * StoryCalendar — Calendrier de contenu participatif hebdomadaire
 * Chaque lundi, le Mentor IA génère 3 templates de Stories interactives
 * (Sondages, Quiz, Curseurs) basés sur l'actualité et les avis clients.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, RefreshCw, Copy, Check,
  BarChart2, HelpCircle, Sliders, Sparkles,
} from 'lucide-react';
import { Button, Badge, toast } from '@blinkdotnew/ui';
import { aiGenerate } from '@/lib/aiRouterClient';
import { useEstablishment } from '@/context/EstablishmentContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { MOCK_REVIEWS } from '@/components/inbox/reviewsData';

interface StoryTemplate {
  id:       string;
  type:     'sondage' | 'quiz' | 'curseur';
  question: string;
  options:  string[];
  context:  string;
  platform: 'instagram' | 'facebook' | 'both';
}

const TYPE_CONFIG = {
  sondage:  { label: 'Sondage',  icon: BarChart2,   color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',  emoji: '📊' },
  quiz:     { label: 'Quiz',     icon: HelpCircle,  color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',   emoji: '🎯' },
  curseur:  { label: 'Curseur',  icon: Sliders,     color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400', emoji: '🎚️' },
};

function parseStoryTemplates(raw: string, ctx: string): StoryTemplate[] {
  // Essaie de parser le bloc JSON si l'IA en produit un,
  // sinon découpe sur les séparateurs "---"
  try {
    const jsonMatch = raw.match(/```json([\s\S]*?)```/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1].trim());
      if (Array.isArray(parsed)) return parsed.map((p, i) => ({ id: `t${i}`, ...p }));
    }
  } catch { /* fallback */ }

  const types: StoryTemplate['type'][] = ['sondage', 'quiz', 'curseur'];
  return raw.split(/---+/).filter(Boolean).slice(0, 3).map((block, i) => {
    const lines = block.trim().split('\n').filter(Boolean);
    return {
      id:       `t${i}`,
      type:     types[i] ?? 'sondage',
      question: lines[0]?.replace(/^[#*\d.]+\s*/, '') ?? `Idée ${i + 1}`,
      options:  lines.slice(1, 3).map(l => l.replace(/^[-*•]\s*/, '')),
      context:  ctx,
      platform: 'both',
    };
  });
}

export function StoryCalendarTab() {
  const { activeEstablishment } = useEstablishment();
  const { masterProfile } = useUserProfile();
  const [templates,  setTemplates]  = useState<StoryTemplate[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [copiedId,   setCopiedId]   = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);

  const recentFiveStars = MOCK_REVIEWS
    .filter(r => r.rating >= 5)
    .slice(0, 2)
    .map(r => `"${r.text.substring(0, 80)}..."`)
    .join(' | ');

  const sectorContext: Record<string, string> = {
    flux:         'restaurants, salons, commerce local',
    chantier:     'artisan BTP, rénovation, chantiers',
    produits:     'boutique locale, vente de produits',
    services_b2b: 'services professionnels, conseil',
    agence:       'agence marketing, marque blanche',
  };

  const generate = async () => {
    setLoading(true);
    setTemplates([]);
    const ctx = sectorContext[masterProfile ?? 'flux'] ?? 'commerce local';
    try {
      const res = await aiGenerate({
        taskType: 'CREATIVE_CONTENT',
        prompt: `Tu es expert en social media pour les TPE/PME françaises spécialisées en ${ctx}.
Génère exactement 3 templates de Stories interactives Instagram/Facebook pour cette semaine.
Contexte : établissement "${activeEstablishment.name}".
Avis 5★ récents à valoriser : ${recentFiveStars || 'Excellent service client'}

IMPORTANT : Pour chaque template, utilise la structure suivante séparée par "---" :

Template 1 — Type: SONDAGE
Question : [question du sondage courte et engageante]
Option A : [réponse 1]
Option B : [réponse 2]
Conseil visuel : [indication courte pour le design]

---

Template 2 — Type: QUIZ
Question : [question quiz sur l'activité]
Bonne réponse : [réponse correcte]
Mauvaise réponse : [réponse plausible mais fausse]
Conseil visuel : [indication courte]

---

Template 3 — Type: CURSEUR
Question : [phrase pour le curseur d'émotion]
Emoji de départ : [emoji bas]
Emoji de fin : [emoji haut]
Conseil visuel : [indication courte]

Sois créatif, local et engageant. Adapte au secteur "${ctx}".`,
        contextData: { name: activeEstablishment.name },
        maxTokens: 600,
      });

      const parsed = parseStoryTemplates(res.content, ctx);
      // Ensure types are properly assigned
      const typed = parsed.map((t, i) => ({
        ...t,
        type: (['sondage', 'quiz', 'curseur'] as StoryTemplate['type'][])[i] ?? t.type,
      }));
      setTemplates(typed.length > 0 ? typed : fallbackTemplates(activeEstablishment.name));
      setGeneratedAt(new Date());
    } catch {
      toast.error('Erreur IA — réessayez dans un instant');
      setTemplates(fallbackTemplates(activeEstablishment.name));
      setGeneratedAt(new Date());
    } finally {
      setLoading(false);
    }
  };

  const copyTemplate = (t: StoryTemplate) => {
    const text = `📱 Story ${TYPE_CONFIG[t.type].label.toUpperCase()}\n\n${t.question}\n${t.options.join(' | ')}`;
    navigator.clipboard.writeText(text);
    setCopiedId(t.id);
    toast.success('Template copié !');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const today = new Date();
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + (1 + 7 - today.getDay()) % 7 || 7);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-violet-500" />
            Calendrier de contenu participatif
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {generatedAt
              ? `Généré le ${generatedAt.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}`
              : `Prochain lundi : ${nextMonday.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}`}
          </p>
        </div>
        <Button
          onClick={generate}
          disabled={loading}
          size="sm"
          className="bg-violet-500 hover:bg-violet-600 text-white gap-2 shrink-0"
        >
          {loading
            ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Génération…</>
            : <><Sparkles className="w-3.5 h-3.5" /> {generatedAt ? 'Regénérer' : 'Générer les 3 Stories'}</>}
        </Button>
      </div>

      {/* Explainer (pre-generation) */}
      {!generatedAt && !loading && (
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-dashed border-slate-300 dark:border-slate-700 p-6 text-center space-y-3">
          <div className="text-4xl">📅</div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">3 Templates de Stories Interactives</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Le Mentor IA génère chaque semaine un Sondage, un Quiz et un Curseur
            basés sur vos avis clients et l'actualité de votre commerce.
          </p>
          <div className="flex justify-center gap-4">
            {Object.entries(TYPE_CONFIG).map(([k, v]) => (
              <div key={k} className="flex flex-col items-center gap-1">
                <span className="text-2xl">{v.emoji}</span>
                <span className="text-[10px] font-semibold text-slate-500">{v.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-28 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      )}

      {/* Templates */}
      <AnimatePresence>
        {templates.map((t, i) => {
          const typeCfg = TYPE_CONFIG[t.type];
          const Icon    = typeCfg.icon;
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${typeCfg.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <Badge className={`text-[10px] border-none ${typeCfg.color}`}>
                      {typeCfg.emoji} {typeCfg.label.toUpperCase()}
                    </Badge>
                    <p className="text-[10px] text-slate-400 mt-0.5">Story #{i + 1} · semaine</p>
                  </div>
                </div>
                <button
                  onClick={() => copyTemplate(t)}
                  className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                    copiedId === t.id ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {copiedId === t.id
                    ? <Check className="w-3.5 h-3.5 text-emerald-500" />
                    : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                </button>
              </div>

              {/* Question */}
              <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{t.question}</p>

              {/* Options */}
              {t.options.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {t.options.filter(Boolean).map((opt, j) => (
                    <span key={j} className="text-[11px] px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium border border-slate-200 dark:border-slate-700">
                      {opt}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/** Fallback templates si l'IA échoue */
function fallbackTemplates(name: string): StoryTemplate[] {
  return [
    {
      id: 'f1', type: 'sondage',
      question: `Quelle offre de ${name} vous intéresse le plus ?`,
      options: ['Formule classique', 'Formule premium'],
      context: 'fallback', platform: 'both',
    },
    {
      id: 'f2', type: 'quiz',
      question: `Depuis combien d'années ${name} est ouvert ?`,
      options: ['Bonne réponse ici', 'Fausse réponse plausible'],
      context: 'fallback', platform: 'both',
    },
    {
      id: 'f3', type: 'curseur',
      question: `Vous êtes fan de ${name} ?`,
      options: ['😐 Pas encore', '🔥 Totalement accro !'],
      context: 'fallback', platform: 'both',
    },
  ];
}
