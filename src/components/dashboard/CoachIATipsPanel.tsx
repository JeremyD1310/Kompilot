/**
 * CoachIATipsPanel — Dashboard widget displaying AI coach tips
 * Fetches tips from backend, respects user settings, tracks interactions.
 * Includes "Submit a tip" and "Settings" buttons.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Lightbulb, Users, Heart, Eye, Sparkles,
  Settings, Plus, ChevronRight, ChevronLeft,
  ThumbsUp, ExternalLink,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  useCoachTips,
  useTipSettings,
  useTrackTipInteraction,
  type CoachTip,
} from '../../hooks/useCoachTips';
import { TipSubmitModal } from './TipSubmitModal';
import { CoachIASettingsModal } from './CoachIASettingsModal';

// ── Category metadata ────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { color: string; label: string; icon: typeof Users }> = {
  Followers: { color: '#E4405F', label: 'Followers', icon: Users },
  Engagement: { color: '#818CF8', label: 'Engagement', icon: Heart },
  Visibilite: { color: '#2DD4BF', label: 'Visibilité', icon: Eye },
  Contenu: { color: '#FBBF24', label: 'Contenu', icon: Sparkles },
  general: { color: '#64748B', label: 'Général', icon: Lightbulb },
};

export function CoachIATipsPanel() {
  const { data: tips, isLoading: tipsLoading } = useCoachTips();
  const { data: settings } = useTipSettings();
  const trackInteraction = useTrackTipInteraction();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [likedTips, setLikedTips] = useState<Set<string>>(new Set());
  const viewTracked = useRef<Set<string>>(new Set());

  // Filter tips by enabled categories
  const enabledCats = settings?.enabledCategories || ['Followers', 'Engagement', 'Visibilite', 'Contenu'];
  const enabled = settings?.isEnabled !== false;

  const filteredTips = (tips || []).filter(t =>
    enabledCats.includes(t.category) || t.category === 'general'
  );

  const frequency = (settings?.frequencySeconds || 4) * 1000;

  // Track view when a tip is shown
  useEffect(() => {
    if (filteredTips.length === 0) return;
    const tip = filteredTips[currentIndex % filteredTips.length];
    if (tip && !viewTracked.current.has(tip.id)) {
      viewTracked.current.add(tip.id);
      trackInteraction.mutate({ tipId: tip.id, type: 'view' });
    }
  }, [currentIndex, filteredTips]);

  // Auto-cycle tips
  useEffect(() => {
    if (!enabled || filteredTips.length <= 1) return;
    const iv = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % filteredTips.length);
        setIsTransitioning(false);
      }, 300);
    }, frequency);
    return () => clearInterval(iv);
  }, [enabled, filteredTips.length, frequency]);

  const handleNext = useCallback(() => {
    if (filteredTips.length <= 1) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % filteredTips.length);
      setIsTransitioning(false);
    }, 200);
  }, [filteredTips.length]);

  const handlePrev = useCallback(() => {
    if (filteredTips.length <= 1) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(prev => (prev - 1 + filteredTips.length) % filteredTips.length);
      setIsTransitioning(false);
    }, 200);
  }, [filteredTips.length]);

  const handleLike = useCallback((tip: CoachTip) => {
    if (likedTips.has(tip.id)) return;
    setLikedTips(prev => new Set(prev).add(tip.id));
    trackInteraction.mutate({ tipId: tip.id, type: 'like' });
    toast.success('Merci pour votre retour !');
  }, [likedTips]);

  if (!enabled || tipsLoading || filteredTips.length === 0) return null;

  const tip = filteredTips[currentIndex % filteredTips.length];
  const catMeta = CATEGORY_META[tip.category] || CATEGORY_META.general;
  const CatIcon = catMeta.icon;
  const isSystem = Number(tip.isSystem) > 0;

  return (
    <>
      <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
        {/* Gradient bar */}
        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${catMeta.color}88, ${catMeta.color}33)` }} />

        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: `${catMeta.color}18`, border: `1px solid ${catMeta.color}30` }}
              >
                <Lightbulb size={14} style={{ color: catMeta.color }} />
              </div>
              <div>
                <span className="text-xs font-bold text-foreground">Coach IA</span>
                <span className="text-[10px] text-muted-foreground ml-2">{currentIndex + 1}/{filteredTips.length}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowSubmitModal(true)}
                title="Proposer un conseil"
                className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <Plus size={13} />
              </button>
              <button
                onClick={() => setShowSettingsModal(true)}
                title="Paramètres Coach IA"
                className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-colors"
              >
                <Settings size={13} />
              </button>
            </div>
          </div>

          {/* Category badges row */}
          <div className="flex gap-1 mb-3 flex-wrap">
            {enabledCats.map(cat => {
              const m = CATEGORY_META[cat] || CATEGORY_META.general;
              const isActive = cat === tip.category;
              return (
                <span
                  key={cat}
                  className="text-[9px] font-bold px-2 py-0.5 rounded-full transition-all"
                  style={{
                    background: isActive ? `${m.color}18` : 'transparent',
                    color: isActive ? m.color : '#475569',
                    border: isActive ? `1px solid ${m.color}40` : '1px solid transparent',
                  }}
                >
                  {m.label}
                </span>
              );
            })}
          </div>

          {/* Tip content */}
          <div
            className="rounded-xl border px-3 py-3 transition-all duration-300"
            style={{
              background: `${catMeta.color}06`,
              borderColor: `${catMeta.color}18`,
              opacity: isTransitioning ? 0 : 1,
              transform: isTransitioning ? 'translateY(6px)' : 'translateY(0)',
            }}
          >
            <div className="flex items-start gap-2.5">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: `${catMeta.color}18` }}
              >
                <CatIcon size={12} style={{ color: catMeta.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-foreground leading-tight mb-1">{tip.title}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{tip.content}</p>

                {/* Meta row */}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {!isSystem && tip.submittedByName && (
                    <span className="text-[9px] text-muted-foreground/60 bg-muted/50 px-1.5 py-0.5 rounded">
                      Par {tip.submittedByName}
                    </span>
                  )}
                  {isSystem && (
                    <span className="text-[9px] text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded font-semibold">
                      Conseil IA
                    </span>
                  )}

                  {/* Like button */}
                  <button
                    onClick={() => handleLike(tip)}
                    disabled={likedTips.has(tip.id)}
                    className={`flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded transition-all ml-auto ${
                      likedTips.has(tip.id)
                        ? 'text-primary bg-primary/10 font-bold'
                        : 'text-muted-foreground/60 hover:text-primary hover:bg-primary/10'
                    }`}
                  >
                    <ThumbsUp size={9} />
                    {Number(tip.likes) + (likedTips.has(tip.id) ? 1 : 0)}
                  </button>
                  <span className="text-[9px] text-muted-foreground/40 flex items-center gap-0.5">
                    <Eye size={9} /> {Number(tip.views)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          {filteredTips.length > 1 && (
            <div className="flex items-center justify-between mt-3">
              <button
                onClick={handlePrev}
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
              >
                <ChevronLeft size={11} /> Précédent
              </button>
              {/* Dots */}
              <div className="flex gap-1">
                {filteredTips.slice(0, 8).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setIsTransitioning(true); setTimeout(() => { setCurrentIndex(i); setIsTransitioning(false); }, 200); }}
                    className="rounded-full transition-all duration-200"
                    style={{
                      width: i === currentIndex % 8 ? 12 : 4,
                      height: 4,
                      background: i === currentIndex % 8 ? catMeta.color : 'rgba(255,255,255,0.1)',
                    }}
                  />
                ))}
                {filteredTips.length > 8 && (
                  <span className="text-[8px] text-muted-foreground/40 ml-0.5">+{filteredTips.length - 8}</span>
                )}
              </div>
              <button
                onClick={handleNext}
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
              >
                Suivant <ChevronRight size={11} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <TipSubmitModal open={showSubmitModal} onClose={() => setShowSubmitModal(false)} />
      <CoachIASettingsModal open={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
    </>
  );
}
