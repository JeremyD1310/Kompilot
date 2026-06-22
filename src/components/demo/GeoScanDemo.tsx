/**
 * GeoScanDemo — Démo interactive du scan GEO + GEA pour la DemoPage.
 *
 * Parcours en 3 phases animées :
 *   1. Scan en cours (progress + logs en temps réel)
 *   2. Résultats détaillés (score, citations par IA, gap concurrentiel)
 *   3. Plan d'action GEA (publicité générative + ROI projeté)
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Brain, Sparkles, TrendingUp, TrendingDown,
  ChevronRight, RotateCcw, Zap, Globe, AlertTriangle,
  CheckCircle2, ArrowRight, Target, BarChart2,
} from 'lucide-react';
import { Button, Badge, Progress } from '@blinkdotnew/ui';

/* ── Types ── */
type Phase = 'idle' | 'scanning' | 'results' | 'gea';

interface AICitation {
  engine: string;
  logo: string;
  status: 'cited' | 'absent' | 'partial';
  query: string;
  snippet?: string;
  position?: number;
}

interface ScanLog {
  icon: string;
  text: string;
  done: boolean;
}

/* ── Constantes ── */
const SCAN_LOGS: ScanLog[] = [
  { icon: '🔍', text: 'Analyse de votre fiche Google Business…', done: false },
  { icon: '🤖', text: 'Interrogation de ChatGPT (GPT-4o)…', done: false },
  { icon: '💎', text: 'Interrogation de Gemini 1.5 Pro…', done: false },
  { icon: '🔮', text: 'Interrogation de Perplexity AI…', done: false },
  { icon: '🌐', text: 'Détection des concurrents cités à votre place…', done: false },
  { icon: '📊', text: 'Calcul du score G.E.O. global…', done: false },
];

const AI_CITATIONS: AICitation[] = [
  {
    engine: 'ChatGPT',
    logo: '🤖',
    status: 'absent',
    query: '"meilleur café restaurant Paris 11e"',
    snippet: 'ChatGPT cite "Café Oberkampf", "Le Servan" et "Septime" — mais pas votre établissement.',
  },
  {
    engine: 'Gemini',
    logo: '💎',
    status: 'partial',
    query: '"où déjeuner Paris 11ème arrondissement"',
    snippet: 'Gemini vous mentionne en position 4 sur 5 — trop bas pour générer du trafic réel.',
    position: 4,
  },
  {
    engine: 'Perplexity',
    logo: '🔮',
    status: 'absent',
    query: '"brunch Paris 11e week-end"',
    snippet: 'Aucune mention. Perplexity recommande exclusivement vos 3 concurrents directs.',
  },
  {
    engine: 'Claude',
    logo: '🟠',
    status: 'partial',
    query: '"café cosy Paris quartier Bastille"',
    snippet: 'Claude vous cite en réponse longue mais pas en réponse courte (la plus lue).',
    position: 2,
  },
];

const COMPETITORS = [
  { name: 'Café Oberkampf', score: 94, delta: +7, reason: 'Schema.org enrichi + 847 avis Google' },
  { name: 'Le Servan', score: 89, delta: +2, reason: 'Articles de presse locaux récents × 6' },
  { name: 'Brunch & Co', score: 71, delta: -16, reason: 'Mots-clés sémantiques insuffisants' },
];

/* ── Composant principal ── */
export function GeoScanDemo() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [logsDone, setLogsDone] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [geoScore] = useState(58);
  const [afterScore] = useState(87);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Lance le scan animé */
  const startScan = () => {
    setPhase('scanning');
    setLogsDone(0);
    setScanProgress(0);

    let step = 0;
    timerRef.current = setInterval(() => {
      step += 1;
      setLogsDone(step);
      setScanProgress(Math.round((step / SCAN_LOGS.length) * 100));
      if (step >= SCAN_LOGS.length) {
        clearInterval(timerRef.current!);
        setTimeout(() => setPhase('results'), 600);
      }
    }, 620);
  };

  const reset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('idle');
    setLogsDone(0);
    setScanProgress(0);
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">

      {/* ── En-tête ── */}
      <div className="bg-gradient-to-r from-[#0D9488] to-teal-600 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Brain size={18} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white">Scan G.E.O. & G.E.A. en direct</h3>
            <p className="text-white/75 text-xs mt-0.5">
              Découvrez si les IA (ChatGPT, Gemini, Perplexity) recommandent votre commerce
            </p>
          </div>
          {phase !== 'idle' && (
            <button
              onClick={reset}
              className="ml-auto p-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors"
              title="Recommencer"
            >
              <RotateCcw size={14} className="text-white" />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ────────────────────────── PHASE IDLE ────────────────────── */}
        {phase === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-5 space-y-5"
          >
            {/* Explication de la valeur */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  icon: '💬',
                  title: '73 % des recherches locales',
                  desc: 'passent désormais par une IA avant Google Maps',
                  color: 'from-teal-50 to-teal-100/50 dark:from-teal-950/40 dark:to-teal-900/20 border-teal-200 dark:border-teal-800/50',
                  textColor: 'text-teal-700 dark:text-teal-400',
                },
                {
                  icon: '🚨',
                  title: 'Invisible = inexistant',
                  desc: 'Si ChatGPT ne vous cite pas, vous perdez des clients sans le savoir',
                  color: 'from-red-50 to-red-100/50 dark:from-red-950/40 dark:to-red-900/20 border-red-200 dark:border-red-800/50',
                  textColor: 'text-red-700 dark:text-red-400',
                },
                {
                  icon: '📈',
                  title: '+40 % de trafic qualifié',
                  desc: 'en moyenne après optimisation G.E.O. sur 60 jours',
                  color: 'from-violet-50 to-violet-100/50 dark:from-violet-950/40 dark:to-violet-900/20 border-violet-200 dark:border-violet-800/50',
                  textColor: 'text-violet-700 dark:text-violet-400',
                },
              ].map(({ icon, title, desc, color, textColor }) => (
                <div key={title} className={`rounded-xl border bg-gradient-to-br ${color} px-4 py-3`}>
                  <span className="text-2xl block mb-1.5">{icon}</span>
                  <p className={`text-xs font-extrabold ${textColor} mb-1`}>{title}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            {/* Simulateur : aperçu de ce que fait un scan */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 space-y-3">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Search size={13} className="text-[#0D9488]" />
                Ce que le scan va analyser pour "Le Café du Marché, Paris 11e"
              </p>
              <div className="grid grid-cols-2 gap-2">
                {SCAN_LOGS.map((log, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="text-base leading-none">{log.icon}</span>
                    {log.text.replace('…', '')}
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={startScan}
              className="w-full bg-[#0D9488] hover:bg-[#0B7A6F] text-white font-bold h-12 gap-2.5 rounded-xl text-sm shadow-md shadow-teal-500/20 transition-all hover:scale-[1.01]"
            >
              <Sparkles size={16} />
              Lancer le scan G.E.O. en démonstration
            </Button>
          </motion.div>
        )}

        {/* ────────────────────────── PHASE SCANNING ────────────────── */}
        {phase === 'scanning' && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-5 space-y-5"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Scan en cours…</p>
              <span className="text-xs font-extrabold text-[#0D9488]">{scanProgress}%</span>
            </div>
            <Progress
              value={scanProgress}
              className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"
              indicatorClassName="bg-gradient-to-r from-[#0D9488] to-teal-400 transition-all duration-500"
            />

            <div className="space-y-2">
              {SCAN_LOGS.map((log, i) => {
                const done = i < logsDone;
                const active = i === logsDone;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: done || active ? 1 : 0.3, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 py-1.5"
                  >
                    <span className="text-base shrink-0">{log.icon}</span>
                    <span className={`text-xs flex-1 ${done ? 'text-slate-400 dark:text-slate-500 line-through' : active ? 'text-slate-900 dark:text-white font-semibold' : 'text-slate-300 dark:text-slate-600'}`}>
                      {log.text}
                    </span>
                    {done && <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />}
                    {active && <div className="w-3.5 h-3.5 border-2 border-[#0D9488]/30 border-t-[#0D9488] rounded-full animate-spin shrink-0" />}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ────────────────────────── PHASE RESULTS ─────────────────── */}
        {phase === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-5 space-y-5"
          >
            {/* Score global */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700">
              {/* Score actuel */}
              <div className="text-center shrink-0">
                <div className="relative w-16 h-16">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
                    <circle
                      cx="28" cy="28" r="22" fill="none"
                      stroke="#ef4444" strokeWidth="5"
                      strokeDasharray={`${(geoScore / 100) * 138.2} 138.2`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-base font-black text-white">{geoScore}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Score actuel</p>
              </div>

              <ArrowRight size={16} className="text-slate-500 shrink-0" />

              {/* Score projeté */}
              <div className="text-center shrink-0">
                <div className="relative w-16 h-16">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
                    <circle
                      cx="28" cy="28" r="22" fill="none"
                      stroke="#0D9488" strokeWidth="5"
                      strokeDasharray={`${(afterScore / 100) * 138.2} 138.2`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-base font-black text-[#0D9488]">{afterScore}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Avec Kompilot</p>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-extrabold text-white mb-1">G.E.O. Score : 58/100</p>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Votre commerce est <strong className="text-red-400">invisible</strong> dans 3 IA sur 4.
                  En moyenne, vos concurrents vous devancent de <strong className="text-amber-400">+29 points</strong>.
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <AlertTriangle size={11} className="text-amber-400 shrink-0" />
                  <p className="text-[10px] text-amber-400 font-semibold">Risque élevé : perte de trafic estimée à −34%</p>
                </div>
              </div>
            </div>

            {/* Citations par moteur IA */}
            <div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5 flex items-center gap-1.5">
                <Brain size={13} className="text-[#0D9488]" />
                Présence dans les réponses IA
              </p>
              <div className="space-y-2">
                {AI_CITATIONS.map((c, i) => (
                  <motion.div
                    key={c.engine}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className={`rounded-xl border p-3 ${
                      c.status === 'cited'
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50'
                        : c.status === 'partial'
                        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50'
                        : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="text-lg leading-none shrink-0">{c.logo}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-extrabold text-slate-900 dark:text-white">{c.engine}</span>
                          <Badge className={`text-[9px] px-1.5 py-0 border-none ${
                            c.status === 'cited' ? 'bg-emerald-500 text-white' :
                            c.status === 'partial' ? 'bg-amber-500 text-white' :
                            'bg-red-500 text-white'
                          }`}>
                            {c.status === 'cited' ? '✓ Cité' : c.status === 'partial' ? `Position ${c.position}` : '✗ Absent'}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 italic mb-1">
                          Requête : {c.query}
                        </p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">{c.snippet}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Gap concurrentiel */}
            <div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5 flex items-center gap-1.5">
                <Target size={13} className="text-violet-500" />
                Vos concurrents qui vous devancent dans les IA
              </p>
              <div className="space-y-2">
                {COMPETITORS.map((comp, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                    <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 text-sm">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{comp.name}</p>
                        <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${comp.delta > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {comp.delta > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          {comp.delta > 0 ? `+${comp.delta} pts` : `${comp.delta} pts`}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{comp.reason}</p>
                    </div>
                    <span className="text-lg font-extrabold text-slate-700 dark:text-slate-200 shrink-0">{comp.score}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={() => setPhase('gea')}
              className="w-full bg-gradient-to-r from-[#0D9488] to-teal-600 hover:opacity-90 text-white font-bold h-11 gap-2 rounded-xl text-sm shadow-md shadow-teal-500/20"
            >
              <Zap size={15} />
              Voir le plan d'action G.E.A. (publicité dans les IA)
              <ChevronRight size={15} />
            </Button>
          </motion.div>
        )}

        {/* ────────────────────────── PHASE GEA ─────────────────────── */}
        {phase === 'gea' && (
          <motion.div
            key="gea"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-5 space-y-5"
          >
            {/* Explication G.E.A. */}
            <div className="rounded-xl border border-violet-200 dark:border-violet-800/50 bg-gradient-to-br from-violet-50 to-violet-100/30 dark:from-violet-950/40 dark:to-violet-900/10 p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0">
                  <Globe size={17} className="text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-violet-900 dark:text-violet-300 mb-1">
                    G.E.A. — Generative Engine Advertising
                  </p>
                  <p className="text-[11px] text-violet-700 dark:text-violet-400 leading-relaxed">
                    Comme Google Ads, mais pour les IA. Kompilot injecte vos données commerciales
                    directement dans le contexte des grandes IA pour que <strong>vous apparaissiez en premier</strong>
                    {' '}quand un client interroge ChatGPT, Gemini ou Perplexity sur votre secteur.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions prioritaires */}
            <div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5 flex items-center gap-1.5">
                <BarChart2 size={13} className="text-[#0D9488]" />
                Plan d'action automatique en 3 étapes
              </p>
              <div className="space-y-2.5">
                {[
                  {
                    step: '1',
                    action: 'Enrichissement sémantique de votre fiche',
                    detail: "L'IA rédige et publie 8 entrées FAQ + mots-clés sectoriels sur votre Google Business Profile",
                    time: '24h',
                    impact: '+18 pts G.E.O.',
                    color: 'bg-teal-500',
                  },
                  {
                    step: '2',
                    action: 'Campagne de citations IA (G.E.A.)',
                    detail: 'Vos informations sont soumises aux APIs d\'indexation de ChatGPT, Perplexity et Gemini',
                    time: '3–7 jours',
                    impact: '+11 pts G.E.O.',
                    color: 'bg-violet-500',
                  },
                  {
                    step: '3',
                    action: 'Génération d\'articles de presse locaux',
                    detail: 'Publication automatique de 2 articles sur des médias locaux pour booster vos Trust Signals',
                    time: '7–14 jours',
                    impact: '+9 pts G.E.O.',
                    color: 'bg-amber-500',
                  },
                ].map(({ step, action, detail, time, impact, color }) => (
                  <div key={step} className="flex gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                    <div className={`w-6 h-6 rounded-full ${color} flex items-center justify-center text-white text-[11px] font-extrabold shrink-0 mt-0.5`}>
                      {step}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{action}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{detail}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] text-slate-400">⏱ {time}</span>
                        <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                          <TrendingUp size={9} /> {impact}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ROI projeté */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Citations IA / mois', before: '1', after: '12+', color: 'text-teal-600 dark:text-teal-400' },
                { label: 'Score G.E.O.', before: '58', after: '87', color: 'text-violet-600 dark:text-violet-400' },
                { label: 'Clients IA / sem.', before: '0', after: '8–12', color: 'text-amber-600 dark:text-amber-400' },
              ].map(({ label, before, after, color }) => (
                <div key={label} className="rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <span className="text-[11px] text-slate-400 line-through">{before}</span>
                    <ArrowRight size={9} className="text-slate-400" />
                    <span className={`text-sm font-extrabold ${color}`}>{after}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">{label}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={reset}
                variant="outline"
                className="flex-1 h-10 text-xs font-semibold gap-1.5"
              >
                <RotateCcw size={13} /> Refaire le scan
              </Button>
              <Button
                onClick={() => window.location.href = '/signup'}
                className="flex-1 bg-[#0D9488] hover:bg-[#0B7A6F] text-white font-bold h-10 gap-1.5 text-xs shadow-md shadow-teal-500/20"
              >
                <Zap size={13} />
                Activer G.E.O. pour mon commerce
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
