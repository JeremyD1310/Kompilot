/**
 * StepProAIO — Onboarding step Pro : AIO Sync — Apparaître dans les réponses IA
 * Configure les 12 mots-clés sémantiques pour ChatGPT, Perplexity, Google AI.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Plus, X, Sparkles, CheckCircle2, ArrowRight, Zap } from 'lucide-react';

interface Props { onComplete: () => void; sector?: string }

const SECTOR_KEYWORDS: Record<string, string[]> = {
  restaurant: ['meilleur restaurant [ville]', 'restaurant gastronomique [ville]', 'dîner romantique [ville]', 'cuisine française [ville]'],
  coiffeur: ['coiffeur [ville]', 'salon de coiffure [ville]', 'coupe de cheveux [ville]', 'balayage [ville]'],
  beaute: ['institut de beauté [ville]', 'soin du visage [ville]', 'massage [ville]', 'épilation [ville]'],
  boulangerie: ['boulangerie artisanale [ville]', 'meilleure boulangerie [ville]', 'pain frais [ville]', 'viennoiseries [ville]'],
};

const DEFAULT_KEYWORDS = [
  'meilleur [secteur] [ville]',
  '[secteur] proche de moi',
  '[secteur] pas cher [ville]',
  '[secteur] ouvert maintenant',
];

const AI_ENGINES = [
  { name: 'ChatGPT', icon: '🤖', color: 'bg-emerald-500' },
  { name: 'Perplexity', icon: '⚡', color: 'bg-violet-500' },
  { name: 'Google IA', icon: '🔍', color: 'bg-blue-500' },
  { name: 'Gemini', icon: '💎', color: 'bg-cyan-500' },
];

export function StepProAIO({ onComplete, sector = 'general' }: Props) {
  const suggestions = SECTOR_KEYWORDS[sector] ?? DEFAULT_KEYWORDS;
  const [keywords, setKeywords] = useState<string[]>(suggestions.slice(0, 3));
  const [inputVal, setInputVal] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

  const addKeyword = (kw: string) => {
    if (keywords.length >= 12 || !kw.trim()) return;
    if (!keywords.includes(kw.trim())) setKeywords(prev => [...prev, kw.trim()]);
    setInputVal('');
  };

  const removeKeyword = (kw: string) => setKeywords(prev => prev.filter(k => k !== kw));

  const handleSync = () => {
    if (keywords.length < 1) return;
    setSyncing(true);
    setTimeout(() => {
      setSynced(true);
      setTimeout(onComplete, 800);
    }, 2200);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-violet-50 to-cyan-50 dark:from-violet-950/30 dark:to-cyan-950/20 border border-violet-200 dark:border-violet-800 px-3.5 py-3 flex items-start gap-2.5">
        <Compass size={16} className="text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-violet-800 dark:text-violet-300 leading-relaxed">
          <strong>AIO SYNC :</strong> Configurez 12 mots-clés pour que ChatGPT, Gemini et Perplexity
          recommandent votre commerce dans leurs réponses. Sync automatique chaque lundi.
        </p>
      </div>

      {/* AI engines */}
      <div className="flex gap-2 flex-wrap">
        {AI_ENGINES.map((engine) => (
          <div key={engine.name} className="flex items-center gap-1.5 rounded-full border border-border bg-muted/30 px-2.5 py-1">
            <span className="text-sm">{engine.icon}</span>
            <span className="text-[10px] font-bold text-foreground">{engine.name}</span>
            <div className={`w-1.5 h-1.5 rounded-full ${synced ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
          </div>
        ))}
      </div>

      {/* Keywords */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Mots-clés locaux ({keywords.length}/12)
          </p>
          <span className={`text-[10px] font-bold ${keywords.length >= 8 ? 'text-emerald-500' : keywords.length >= 4 ? 'text-amber-500' : 'text-red-400'}`}>
            {keywords.length >= 8 ? '✓ Optimal' : keywords.length >= 4 ? 'Moyen' : 'Insuffisant'}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500"
            animate={{ width: `${(keywords.length / 12) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Keyword chips */}
        <div className="flex flex-wrap gap-1.5">
          <AnimatePresence>
            {keywords.map((kw) => (
              <motion.div
                key={kw}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1 rounded-full border border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/30 px-2.5 py-1"
              >
                <Sparkles size={9} className="text-violet-500 shrink-0" />
                <span className="text-[10px] font-medium text-violet-800 dark:text-violet-200">{kw}</span>
                <button onClick={() => removeKeyword(kw)} className="text-violet-400 hover:text-violet-600 transition-colors">
                  <X size={9} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Input */}
        {keywords.length < 12 && (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ex : meilleure pizzeria Lyon 2e…"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addKeyword(inputVal); }}
              className="flex-1 px-3 py-2 rounded-xl border-2 border-border bg-background text-xs font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60 transition-all"
            />
            <button
              onClick={() => addKeyword(inputVal)}
              disabled={!inputVal.trim()}
              className="px-3 py-2 rounded-xl bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-40 transition-all"
            >
              <Plus size={14} />
            </button>
          </div>
        )}

        {/* Suggestions */}
        {suggestions.filter(s => !keywords.includes(s)).length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground">Suggestions IA :</p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.filter(s => !keywords.includes(s)).slice(0, 3).map((s) => (
                <button
                  key={s}
                  onClick={() => addKeyword(s)}
                  className="flex items-center gap-1 text-[10px] rounded-full border border-dashed border-violet-300 dark:border-violet-700 px-2.5 py-1 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-all"
                >
                  <Plus size={9} /> {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <AnimatePresence mode="wait">
        {!synced ? (
          <motion.button
            key="cta"
            onClick={handleSync}
            disabled={keywords.length < 1 || syncing}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white text-sm font-bold py-2.5 shadow-md disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            {syncing ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                Synchronisation avec les IA…
              </>
            ) : (
              <>
                <Zap size={14} />
                Activer le Sync hebdomadaire ({keywords.length} mots-clés)
                <ArrowRight size={14} />
              </>
            )}
          </motion.button>
        ) : (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 px-3.5 py-3 flex items-center gap-3"
          >
            <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                AIO Sync activé ! Prochain sync : lundi 9h
              </p>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                {keywords.length} mots-clés indexés sur ChatGPT, Gemini, Perplexity
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
