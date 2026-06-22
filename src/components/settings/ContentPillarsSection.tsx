import React, { useState } from 'react';
import { Card, Input, Button, Badge, cn, toast, Textarea } from '@blinkdotnew/ui';
import { Check, Save, Sparkles } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useContentPillars } from '../../context/ContentPillarsContext';

const EMOJI_PRESETS = [
  ['🎓', '💡', '📚', '🔬', '🏆', '⭐'],
  ['🎬', '📸', '🤝', '🏗️', '🌟', '💼'],
  ['🎯', '💰', '🛒', '🎁', '🔥', '✨'],
];

const COLOR_PRESETS = [
  ['from-blue-500 to-cyan-400', 'from-blue-600 to-indigo-500', 'from-cyan-500 to-teal-400'],
  ['from-violet-500 to-purple-400', 'from-purple-600 to-pink-500', 'from-indigo-500 to-purple-500'],
  ['from-amber-500 to-orange-400', 'from-orange-500 to-red-400', 'from-yellow-400 to-orange-500'],
];

export function ContentPillarsSection() {
  const { pillars, setPillar } = useContentPillars();
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Piliers de contenu mis à jour');
    }, 800);
  };

  const handleTestAI = () => {
    toast.success('Allez voir le Spark du Jour !');
    navigate({ to: '/dashboard' });
  };

  // AI Readiness Score: count pillars with description.length > 10, divide by 3, * 100
  const enrichedCount = pillars.filter(p => (p.description?.length ?? 0) > 10).length;
  const aiScore = Math.round((enrichedCount / 3) * 100);
  const scoreColor =
    aiScore >= 80 ? 'bg-emerald-500' :
    aiScore >= 40 ? 'bg-amber-400' :
    'bg-rose-500';
  const scoreLabelColor =
    aiScore >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
    aiScore >= 40 ? 'text-amber-600 dark:text-amber-400' :
    'text-rose-600 dark:text-rose-400';

  return (
    <div className="space-y-6">

      {/* ── AI Readiness Score bar ── */}
      <div className="rounded-xl border border-border/60 bg-card px-4 py-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-primary shrink-0" />
            <span className="text-xs font-semibold text-foreground">Score d'inspiration IA</span>
          </div>
          <span className={cn('text-xs font-bold tabular-nums', scoreLabelColor)}>
            {aiScore}%
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-700 ease-out', scoreColor)}
            style={{ width: `${aiScore}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground">
          {enrichedCount} / {pillars.length} piliers enrichis avec des mots-clés IA
        </p>
      </div>

      {/* ── Aperçu des Piliers (pill badges row) ── */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Aperçu des Piliers
        </span>
        <div className="flex flex-wrap gap-2">
          {pillars.map((p) => (
            <div
              key={p.id}
              className={cn(
                'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r shadow-sm',
                p.color
              )}
            >
              <span>{p.emoji}</span>
              <span>{p.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3-column pillar cards grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pillars.map((pillar, idx) => (
          <Card
            key={pillar.id}
            className={cn(
              'overflow-hidden flex flex-col transition-all duration-200',
              'hover:ring-2 hover:ring-offset-2',
              // derive a per-pillar ring color from the gradient class
              idx === 0 && 'hover:ring-blue-400',
              idx === 1 && 'hover:ring-violet-400',
              idx === 2 && 'hover:ring-amber-400',
            )}
          >
            {/* Gradient header — h-28 */}
            <div
              className={cn(
                'h-28 flex items-center justify-center relative bg-gradient-to-br',
                pillar.color
              )}
            >
              {/* Decorative star behind emoji */}
              <span className="absolute text-5xl text-white/20 select-none pointer-events-none">
                ✦
              </span>
              <span className="relative text-4xl drop-shadow-md z-10">{pillar.emoji}</span>
              {/* Number badge */}
              <div className="absolute top-2 right-2 bg-black/25 backdrop-blur-sm text-white text-[11px] font-bold w-6 h-6 rounded-full flex items-center justify-center ring-1 ring-white/20">
                #{idx + 1}
              </div>
            </div>

            <div className="p-4 space-y-4 flex-1">
              {/* Emoji picker */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase">Emoji</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_PRESETS[idx].map((e) => (
                    <button
                      key={e}
                      onClick={() => setPillar(pillar.id, { emoji: e })}
                      className={cn(
                        'w-8 h-8 rounded-md flex items-center justify-center transition-all',
                        pillar.emoji === e
                          ? 'bg-primary text-primary-foreground scale-110'
                          : 'bg-muted hover:bg-accent'
                      )}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Label input */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase">
                  Nom du pilier
                </label>
                <Input
                  value={pillar.label}
                  onChange={(e) => setPillar(pillar.id, { label: e.target.value.slice(0, 30) })}
                  placeholder="Ex: Conseils Experts"
                  className="h-9"
                />
              </div>

              {/* Description / keywords */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase">
                  Mots-clés &amp; description
                </label>
                <Textarea
                  value={pillar.description || ''}
                  onChange={(e) => setPillar(pillar.id, { description: e.target.value })}
                  placeholder="Ex: conseils marketing, stratégie réseaux sociaux, ROI..."
                  className="text-xs min-h-[60px] resize-none"
                  maxLength={120}
                />
                <p className="text-[10px] text-muted-foreground">
                  {(pillar.description || '').length}/120 — utilisé par l'IA pour personnaliser les idées
                </p>

                {/* Live IA preview */}
                {(pillar.description || '').length > 0 && (
                  <div className="bg-muted/50 rounded-md px-3 py-2 text-xs italic text-muted-foreground leading-relaxed">
                    L'IA utilisera ces mots-clés : {pillar.description}
                  </div>
                )}
              </div>

              {/* Color picker */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase">
                  Couleur
                </label>
                <div className="flex gap-2">
                  {COLOR_PRESETS[idx].map((c) => (
                    <button
                      key={c}
                      onClick={() => setPillar(pillar.id, { color: c })}
                      className={cn(
                        'w-full h-6 rounded-md bg-gradient-to-br border-2 transition-all',
                        c,
                        pillar.color === c ? 'border-foreground' : 'border-transparent'
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Save row ── */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border/50">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-muted-foreground uppercase">Aperçu :</span>
          <div className="flex gap-2">
            {pillars.map((p) => (
              <div
                key={p.id}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r shadow-sm',
                  p.color
                )}
              >
                {p.emoji} {p.label}
              </div>
            ))}
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className={cn(isSaving && 'bg-green-600 hover:bg-green-700')}
        >
          {isSaving ? <Check className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          {isSaving ? 'Enregistré' : 'Enregistrer'}
        </Button>
      </div>

      {/* ── Tester l'IA maintenant ── */}
      <div className="flex justify-center pt-1">
        <Button
          variant="outline"
          className="gap-2 border-primary/40 text-primary hover:bg-primary/5 hover:border-primary transition-all"
          onClick={handleTestAI}
        >
          <Sparkles className="w-4 h-4" />
          Tester l'IA maintenant
        </Button>
      </div>

    </div>
  );
}
