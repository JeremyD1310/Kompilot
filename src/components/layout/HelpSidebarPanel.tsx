/**
 * HelpSidebarPanel — Retractable contextual help drawer
 *
 * Features:
 * - Always-visible ? button in top-right (injected by DashboardLayout)
 * - Detects current route and loads matching guide from userGuideConfig.json
 * - Mini video player at the top (PiP-ready native <video>)
 * - Click-by-click guided tour (step overlay with highlight + tooltip)
 * - Docs-as-code: all content driven by /public/userGuideConfig.json
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from '@tanstack/react-router';
import {
  X, Play, Pause, ChevronRight, ChevronLeft, HelpCircle,
  BookOpen, Video, MousePointerClick, Maximize2, Check,
  RefreshCw, Lightbulb,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface TourStep {
  id: string;
  target: string;
  title: string;
  body: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
}

interface MicroDocStep {
  step: string;
  text: string;
}

interface PageGuide {
  title: string;
  videoId: string;
  videoLabel: string;
  videoNote?: string;
  microDoc?: MicroDocStep[];
  summary: string;
  steps: TourStep[];
}

interface GuideConfig {
  _version: string;
  pages: Record<string, PageGuide>;
  defaultPage: PageGuide;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function matchRoute(pathname: string, pages: Record<string, PageGuide>): PageGuide | null {
  // Exact match first
  if (pages[pathname]) return pages[pathname];
  // Prefix match
  const keys = Object.keys(pages).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (key !== '/' && pathname.startsWith(key)) return pages[key];
  }
  if (pathname === '/' && pages['/dashboard']) return pages['/dashboard'];
  return null;
}

// ── Tour overlay ──────────────────────────────────────────────────────────────

interface TourOverlayProps {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

function TourOverlay({ step, stepIndex, totalSteps, onNext, onPrev, onClose }: TourOverlayProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const el = document.querySelector(step.target);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      setTargetRect(null);
    }
  }, [step.target]);

  const TOOLTIP_W = 300;
  const TOOLTIP_H = 160;
  const MARGIN = 12;

  const getTooltipPos = () => {
    if (!targetRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    const { top, bottom, left, right, width } = targetRect;
    if (step.placement === 'bottom') return { top: bottom + MARGIN, left: left + width / 2 - TOOLTIP_W / 2 };
    if (step.placement === 'top') return { top: top - TOOLTIP_H - MARGIN, left: left + width / 2 - TOOLTIP_W / 2 };
    if (step.placement === 'right') return { top: top, left: right + MARGIN };
    return { top: top, left: left - TOOLTIP_W - MARGIN };
  };

  const pos = getTooltipPos();

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Semi-transparent backdrop */}
      <div className="absolute inset-0 bg-black/40 pointer-events-auto" onClick={onClose} />

      {/* Highlight box around target */}
      {targetRect && (
        <div
          className="absolute rounded-xl ring-2 ring-primary ring-offset-2 bg-primary/5 pointer-events-none transition-all duration-300"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
        />
      )}

      {/* Tooltip card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute pointer-events-auto"
        style={{ ...pos, width: TOOLTIP_W }}
      >
        <div className="bg-card border border-border rounded-2xl shadow-2xl p-4 space-y-3">
          {/* Step counter */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Étape {stepIndex + 1} / {totalSteps}
            </span>
            <button onClick={onClose} className="p-0.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <X size={12} />
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
            />
          </div>

          <div>
            <p className="text-sm font-bold text-foreground mb-1">{step.title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{step.body}</p>
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              onClick={onPrev}
              disabled={stepIndex === 0}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
            >
              <ChevronLeft size={13} /> Précédent
            </button>
            {stepIndex < totalSteps - 1 ? (
              <button
                onClick={onNext}
                className="flex items-center gap-1 text-xs font-bold text-primary-foreground bg-primary rounded-lg px-3 py-1.5 hover:opacity-90 transition-opacity"
              >
                Suivant <ChevronRight size={13} />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 rounded-lg px-3 py-1.5 hover:bg-emerald-200 transition-colors"
              >
                <Check size={12} /> Terminé
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Mini video player ─────────────────────────────────────────────────────────

function MiniVideoPlayer({ videoId, label }: { videoId: string; label: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  const toggle = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else { videoRef.current.play().catch(() => setUnavailable(true)); setPlaying(true); }
  };

  const handlePiP = async () => {
    if (videoRef.current && document.pictureInPictureEnabled) {
      try { await videoRef.current.requestPictureInPicture(); }
      catch { /* not supported */ }
    }
  };

  return (
    <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
      <div className="relative aspect-video bg-zinc-900 group">
        {unavailable ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-zinc-400">
            <Video size={24} className="opacity-40" />
            <p className="text-[10px] text-center leading-snug px-4">
              Vidéo tutorielle disponible prochainement
            </p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              src={`/videos/${videoId}`}
              className="w-full h-full object-cover"
              onEnded={() => setPlaying(false)}
              onError={() => setUnavailable(true)}
              playsInline
              preload="none"
            />
            {/* Overlay controls */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
              <button
                onClick={toggle}
                className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
              >
                {playing ? <Pause size={16} className="text-zinc-900" /> : <Play size={16} className="text-zinc-900 ml-0.5" />}
              </button>
            </div>
            {/* PiP button */}
            <button
              onClick={handlePiP}
              title="Picture-in-Picture"
              className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70"
            >
              <Maximize2 size={11} />
            </button>
          </>
        )}
      </div>
      <div className="px-3 py-2 flex items-center gap-2">
        <Video size={11} className="text-primary shrink-0" />
        <span className="text-[10px] font-semibold text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

interface HelpSidebarPanelProps {
  open: boolean;
  onClose: () => void;
}

export function HelpSidebarPanel({ open, onClose }: HelpSidebarPanelProps) {
  const location = useLocation();
  const [config, setConfig] = useState<GuideConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [activeTab, setActiveTab] = useState<'guide' | 'video'>('guide');

  // Load config from JSON (Docs-as-Code)
  useEffect(() => {
    if (!open || config) return;
    setLoading(true);
    fetch('/userGuideConfig.json')
      .then(r => r.json())
      .then((data: GuideConfig) => { setConfig(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [open, config]);

  const currentGuide = config
    ? (matchRoute(location.pathname, config.pages) ?? config.defaultPage)
    : null;

  const startTour = () => {
    setTourStep(0);
    setTourActive(true);
    onClose(); // close panel while tour runs
  };

  const endTour = useCallback(() => {
    setTourActive(false);
    setTourStep(0);
  }, []);

  return (
    <>
      {/* Tour overlay — renders outside the panel */}
      {tourActive && currentGuide && currentGuide.steps.length > 0 && (
        <TourOverlay
          step={currentGuide.steps[tourStep]}
          stepIndex={tourStep}
          totalSteps={currentGuide.steps.length}
          onNext={() => setTourStep(s => Math.min(s + 1, currentGuide.steps.length - 1))}
          onPrev={() => setTourStep(s => Math.max(s - 1, 0))}
          onClose={endTour}
        />
      )}

      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="help-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[899] bg-black/20"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Slide-in panel */}
      <AnimatePresence>
        {open && (
          <motion.aside
            key="help-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-[900] w-[340px] max-w-[calc(100vw-3rem)] bg-background border-l border-border shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="shrink-0 flex items-center gap-3 px-5 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-teal-50/40 dark:to-teal-950/10">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <HelpCircle size={16} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">
                  {currentGuide?.title ?? 'Guide d\'utilisation'}
                </p>
                <p className="text-[10px] text-muted-foreground">Mis à jour automatiquement</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0"
              >
                <X size={15} />
              </button>
            </div>

            {/* Tab switcher */}
            <div className="shrink-0 flex border-b border-border">
              {([
                { id: 'guide', icon: <BookOpen size={13} />, label: 'Guide' },
                { id: 'video', icon: <Video size={13} />,    label: 'Vidéo' },
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
                    activeTab === tab.id
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-40 gap-2 text-muted-foreground">
                  <RefreshCw size={16} className="animate-spin" />
                  <span className="text-sm">Chargement du guide…</span>
                </div>
              ) : !currentGuide ? (
                <div className="p-5 text-center text-muted-foreground text-sm">
                  Aucun guide disponible pour cette page.
                </div>
              ) : (
                <div className="p-5 space-y-5">
                  {/* Video tab */}
                  {activeTab === 'video' && (
                    <div className="space-y-3">
                      <MiniVideoPlayer videoId={currentGuide.videoId} label={currentGuide.videoLabel} />

                      {/* videoNote — correlation marker */}
                      {currentGuide.videoNote && (
                        <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5">
                          <Play size={12} className="text-primary shrink-0 mt-0.5" />
                          <p className="text-[11px] text-primary font-medium leading-relaxed">
                            {currentGuide.videoNote}
                          </p>
                        </div>
                      )}

                      {/* microDoc — structured 3-step guide below video */}
                      {currentGuide.microDoc && currentGuide.microDoc.length > 0 && (
                        <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
                          <div className="px-3 py-2 border-b border-border bg-muted/40">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                              Comment utiliser ce module
                            </p>
                          </div>
                          <div className="px-3 py-2.5 space-y-2.5">
                            {currentGuide.microDoc.map((item) => (
                              <div key={item.step} className="flex items-start gap-2.5">
                                <span className="flex-none w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                                  {item.step}
                                </span>
                                <p className="text-[11px] text-foreground leading-relaxed">{item.text}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Guide tab */}
                  {activeTab === 'guide' && (
                    <>
                      {/* Summary */}
                      <div className="rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 flex items-start gap-2.5">
                        <Lightbulb size={14} className="text-primary shrink-0 mt-0.5" />
                        <p className="text-xs text-foreground leading-relaxed">{currentGuide.summary}</p>
                      </div>

                      {/* Start tour CTA */}
                      {currentGuide.steps.length > 0 && (
                        <button
                          onClick={startTour}
                          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-bold hover:opacity-90 transition-opacity shadow-md shadow-primary/20"
                        >
                          <MousePointerClick size={15} />
                          Lancer le parcours guidé ({currentGuide.steps.length} étapes)
                        </button>
                      )}

                      {/* Steps preview */}
                      {currentGuide.steps.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            Étapes du parcours
                          </p>
                          {currentGuide.steps.map((step, i) => (
                            <div key={step.id} className="flex items-start gap-3 rounded-xl border border-border bg-card px-3 py-2.5">
                              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              <div>
                                <p className="text-xs font-semibold text-foreground">{step.title}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{step.body}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {currentGuide.steps.length === 0 && (
                        <div className="text-center text-muted-foreground py-8 space-y-2">
                          <BookOpen size={28} className="mx-auto opacity-20" />
                          <p className="text-xs">Guide interactif à venir pour cette page.</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 px-5 py-3 border-t border-border bg-muted/20">
              <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                Le guide se met à jour automatiquement selon la page affichée.{' '}
                <button onClick={() => setConfig(null)} className="text-primary hover:underline">
                  Actualiser
                </button>
              </p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Floating trigger button ───────────────────────────────────────────────────

interface HelpButtonProps {
  onClick: () => void;
  active: boolean;
}

export function HelpButton({ onClick, active }: HelpButtonProps) {
  return (
    <button
      onClick={onClick}
      title="Aide & Guide d'utilisation"
      data-tour="help-button"
      className={`
        fixed top-3 right-4 z-[850] flex items-center justify-center
        w-9 h-9 rounded-full shadow-lg transition-all duration-200
        ${active
          ? 'bg-primary text-primary-foreground shadow-primary/30 scale-110'
          : 'bg-background border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 hover:shadow-md'
        }
      `}
    >
      {active ? <X size={15} /> : <HelpCircle size={15} />}
    </button>
  );
}
