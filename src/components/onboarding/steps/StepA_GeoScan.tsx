/**
 * StepA_GeoScan — GEO AI Radar Scan
 * Scalecity-style sector picker → contextualised AI scan tunnel.
 * Simulates querying ChatGPT, Gemini & Perplexity for local business visibility,
 * then reveals a competitor alert and auto-completes.
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ArrowRight, ChevronRight } from 'lucide-react';

interface Props { onComplete: () => void }

// ── Sector configuration ──────────────────────────────────────────────────────

const SECTORS = [
  { id: 'restaurant',  label: 'Restauration',        emoji: '🍽️',  keywords: 'restaurant, bistrot, traiteur', competitor: 'Bistrot du Marché' },
  { id: 'beauty',      label: 'Coiffure & Beauté',    emoji: '💇',  keywords: 'coiffeur, esthétique, salon', competitor: 'Salon Belle Époque' },
  { id: 'retail',      label: 'Commerce de détail',   emoji: '🛍️',  keywords: 'boutique, commerce, magasin', competitor: 'La Petite Boutique' },
  { id: 'artisan',     label: 'Artisanat',             emoji: '🔨',  keywords: 'artisan, plombier, électricien', competitor: 'Artisans & Co' },
  { id: 'health',      label: 'Santé & Bien-être',     emoji: '🌿',  keywords: 'médecin, kiné, ostéopathe', competitor: 'Centre Santé Plus' },
  { id: 'other',       label: 'Autre',                 emoji: '🏢',  keywords: 'commerce local', competitor: 'Votre Concurrent Local' },
] as const;

type SectorId = typeof SECTORS[number]['id'];

const SCAN_LABELS = [
  'Analyse ChatGPT...',
  'Vérification Gemini...',
  'Audit Perplexity...',
];

export function StepA_GeoScan({ onComplete }: Props) {
  const [selectedSector, setSelectedSector] = useState<SectorId | null>(null);
  const [phase, setPhase] = useState<'sector' | 'idle' | 'scanning' | 'result'>('sector');
  const [progress, setProgress] = useState(0);
  const [labelIdx, setLabelIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Demo bypass state
  const [showBypass, setShowBypass] = useState(false);
  const [bypassAddress, setBypassAddress] = useState('');
  const [bypassPhase, setBypassPhase] = useState<'form' | 'simulating' | 'done'>('form');
  const [bypassProgress, setBypassProgress] = useState(0);
  const bypassTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeSector = SECTORS.find(s => s.id === selectedSector);

  const handleSectorSelect = (id: SectorId) => {
    setSelectedSector(id);
    // Brief visual delay before advancing to scan step
    setTimeout(() => setPhase('idle'), 300);
  };

  const handleBypassSimulate = () => {
    if (!bypassAddress.trim()) return;
    setBypassPhase('simulating');
    let prog = 0;
    bypassTimerRef.current = setInterval(() => {
      prog += 3;
      setBypassProgress(Math.min(prog, 100));
      if (prog >= 100) {
        clearInterval(bypassTimerRef.current!);
        setBypassPhase('done');
        setTimeout(() => onComplete(), 800);
      }
    }, 60);
  };

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (bypassTimerRef.current) clearInterval(bypassTimerRef.current);
  }, []);

  const handleScan = () => {
    setPhase('scanning');
    setProgress(0);
    setLabelIdx(0);

    let prog = 0;
    intervalRef.current = setInterval(() => {
      prog += 2;
      setProgress(Math.min(prog, 100));
      if (prog === 33) setLabelIdx(1);
      if (prog === 66) setLabelIdx(2);
      if (prog >= 100) {
        clearInterval(intervalRef.current!);
        setPhase('result');
        setTimeout(() => onComplete(), 500);
      }
    }, 50);
  };

  return (
    <div className="space-y-4">
      {/* ── Hook banner ─────────────────────────────────────────────────────── */}
      <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 px-4 py-3">
        <p className="text-sm font-extrabold text-amber-900 dark:text-amber-300 leading-snug">
          Votre visibilité locale vous rapporte-t-elle assez ?
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
          Vérifiez en 60 secondes si vos clients vous trouvent sur Google, ChatGPT & Gemini.
        </p>
      </div>

      {/* ── STEP 1: Sector picker (Scalecity-style) ──────────────────────── */}
      <AnimatePresence mode="wait">
        {phase === 'sector' && (
          <motion.div
            key="sector-picker"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-3"
          >
            <p className="text-xs font-semibold text-foreground/70 uppercase tracking-widest">
              Votre secteur d'activité
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SECTORS.map(sector => (
                <motion.button
                  key={sector.id}
                  onClick={() => handleSectorSelect(sector.id)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`flex flex-col items-center gap-2 rounded-2xl border-2 px-3 py-4 text-center transition-all duration-150 ${
                    selectedSector === sector.id
                      ? 'border-primary bg-primary/10 shadow-md shadow-primary/20'
                      : 'border-border bg-card hover:border-primary/40 hover:bg-primary/5'
                  }`}
                >
                  <span className="text-2xl leading-none">{sector.emoji}</span>
                  <span className="text-[11px] font-bold text-foreground leading-tight">
                    {sector.label}
                  </span>
                </motion.button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              Le scan IA adaptera ses critères à votre secteur
            </p>
          </motion.div>
        )}

        {/* ── STEP 2: Scan panel ──────────────────────────────────────────── */}
        {(phase === 'idle' || phase === 'scanning' || phase === 'result') && (
          <motion.div
            key="scan-panel"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {/* Selected sector badge + change */}
            {activeSector && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1.5">
                  <span className="text-base leading-none">{activeSector.emoji}</span>
                  <span className="text-xs font-bold text-primary">{activeSector.label}</span>
                </div>
                <button
                  onClick={() => { setPhase('sector'); setSelectedSector(null); }}
                  className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  Changer <ChevronRight size={10} />
                </button>
              </div>
            )}

            {/* Intro banner */}
            <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3.5 py-3 flex items-start gap-2.5">
              <span className="text-base shrink-0">🤖</span>
              <p className="text-[11px] text-red-800 dark:text-red-300 leading-relaxed">
                <strong>RADAR G.E.O. IA :</strong> Découvrez si ChatGPT, Gemini et Perplexity recommandent
                votre {activeSector?.label.toLowerCase() || 'commerce'} aux clients qui recherchent{' '}
                «&nbsp;{activeSector?.keywords || 'vos services'}&nbsp;» en ce moment.
              </p>
            </div>

            {/* Dark scanner panel */}
            <div className="relative rounded-2xl border border-zinc-700 bg-zinc-900 p-4 overflow-hidden">
              {/* Teal scanner sweep line — visible during scanning */}
              <AnimatePresence>
                {phase === 'scanning' && (
                  <motion.div
                    key="sweep"
                    initial={{ top: '0%' }}
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                    className="absolute left-0 right-0 h-px bg-teal-400/70 shadow-[0_0_8px_2px_rgba(45,212,191,0.4)] pointer-events-none"
                  />
                )}
              </AnimatePresence>

              <p className="text-[10px] font-bold text-teal-400 uppercase tracking-widest mb-3">
                🤖 Radar IA — G.E.O. Scanner
              </p>

              <AnimatePresence mode="wait">
                {/* IDLE */}
                {phase === 'idle' && (
                  <motion.button
                    key="idle-btn"
                    onClick={handleScan}
                    whileTap={{ scale: 0.97 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-bold py-2.5 shadow-md transition-all"
                  >
                    🔍 Lancer le scan IA pour {activeSector?.label}
                  </motion.button>
                )}

                {/* SCANNING */}
                {phase === 'scanning' && (
                  <motion.div
                    key="scanning"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-400" />
                      </span>
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={labelIdx}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.25 }}
                          className="text-xs font-semibold text-teal-300"
                        >
                          {SCAN_LABELS[labelIdx]}
                        </motion.p>
                      </AnimatePresence>
                    </div>

                    {/* Progress bar */}
                    <div className="h-2 rounded-full bg-zinc-700 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-400"
                        style={{ width: `${progress}%` }}
                        transition={{ duration: 0.08 }}
                      />
                    </div>

                    <p className="text-[10px] text-zinc-500 text-right">{progress}%</p>
                  </motion.div>
                )}

                {/* RESULT */}
                {phase === 'result' && (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="space-y-3"
                  >
                    {/* Red alert badge */}
                    <div className="flex items-center gap-2 rounded-xl bg-red-500/20 border border-red-500/50 px-3 py-2">
                      <span className="text-base">⚠️</span>
                      <p className="text-xs font-bold text-red-400">Invisible sur ChatGPT</p>
                    </div>

                    {/* Competitor alert — sector-specific */}
                    <div className="rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2.5 space-y-1">
                      <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wide">
                        Un concurrent prend vos clients
                      </p>
                      <p className="text-xs text-zinc-200 leading-relaxed">
                        <span className="font-bold text-white">"{activeSector?.competitor}"</span>
                        {' '}
                        <span className="text-yellow-400">4.8★</span>
                        {' '}— recommandé par ChatGPT dans votre secteur {activeSector?.label}.
                      </p>
                    </div>

                    {/* Green reassurance */}
                    <div className="flex items-start gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-2.5">
                      <span className="text-base shrink-0">✅</span>
                      <p className="text-xs text-emerald-400 leading-relaxed">
                        Pas de panique, nous allons corriger cela à l'étape suivante.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Bypass block ── */}
            {phase !== 'scanning' && !showBypass && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 px-3.5 py-3"
              >
                <p className="text-[11px] text-muted-foreground leading-snug mb-2">
                  🔗 Vous ne parvenez pas à connecter votre fiche Google Business ?
                </p>
                <button
                  onClick={() => setShowBypass(true)}
                  className="flex items-center gap-2 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                >
                  <MapPin size={12} />
                  Activer le mode démonstration de mon quartier
                  <ArrowRight size={12} />
                </button>
              </motion.div>
            )}

            {/* ── Bypass form ── */}
            <AnimatePresence>
              {showBypass && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-2xl border border-teal-200 dark:border-teal-800/50 bg-teal-50 dark:bg-teal-950/20 p-4 space-y-3"
                >
                  <div className="flex items-start gap-2.5">
                    <MapPin size={15} className="text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-extrabold text-teal-800 dark:text-teal-300 leading-snug">
                        Mode démonstration de mon quartier
                      </p>
                      <p className="text-[10px] text-teal-700 dark:text-teal-400 leading-relaxed mt-0.5">
                        Saisissez votre adresse pour charger des données simulées réalistes — testez le Cockpit IA et le Calendrier sans aucun blocage.
                      </p>
                    </div>
                  </div>

                  {bypassPhase === 'form' && (
                    <>
                      <input
                        type="text"
                        placeholder="Ex : 12 Rue du Commerce, Lyon 69001"
                        value={bypassAddress}
                        onChange={e => setBypassAddress(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleBypassSimulate()}
                        className="w-full rounded-xl border border-teal-300 dark:border-teal-700 bg-white dark:bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-400/50"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleBypassSimulate}
                          disabled={!bypassAddress.trim()}
                          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2 transition-colors disabled:opacity-50"
                        >
                          <MapPin size={12} /> Charger les données de simulation
                        </button>
                        <button
                          onClick={() => setShowBypass(false)}
                          className="rounded-xl border border-teal-300 dark:border-teal-700 px-3 py-2 text-xs text-teal-700 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors"
                        >
                          Annuler
                        </button>
                      </div>
                    </>
                  )}

                  {bypassPhase === 'simulating' && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-500 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
                        </span>
                        <p className="text-xs font-semibold text-teal-700 dark:text-teal-300">
                          Génération des données de simulation pour votre secteur...
                        </p>
                      </div>
                      <div className="h-1.5 rounded-full bg-teal-200 dark:bg-teal-900 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-teal-500"
                          style={{ width: `${bypassProgress}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-teal-600 dark:text-teal-400 text-right">{bypassProgress}%</p>
                    </div>
                  )}

                  {bypassPhase === 'done' && (
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-400/40 px-3 py-2">
                      <span className="text-base">✅</span>
                      <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        Données de démonstration chargées ! Vous pouvez tester toutes les fonctionnalités.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
