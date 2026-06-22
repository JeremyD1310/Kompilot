/**
 * CustomPromptEditor — lets users define a custom system prompt
 * that overrides the default Claude Cowork behaviour for their workspace.
 *
 * Persists to localStorage per userId + spaceType.
 * Exposes: useCustomPrompt() hook + CustomPromptPanel component.
 */
import { useState, useEffect, useCallback } from 'react';
import { SlidersHorizontal, Save, RotateCcw, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { cn, toast } from '@blinkdotnew/ui';
import { useAuth } from '../../hooks/useAuth';
import type { CoworkSpaceType } from '../../hooks/useCoworkHistory';

// ── Storage ───────────────────────────────────────────────────────────────────

function promptKey(userId: string, space: CoworkSpaceType) {
  return `cowork_custom_prompt_${userId}_${space}`;
}

export function loadCustomPrompt(userId: string, space: CoworkSpaceType): string {
  try { return localStorage.getItem(promptKey(userId, space)) ?? ''; } catch { return ''; }
}

function saveCustomPrompt(userId: string, space: CoworkSpaceType, value: string) {
  try { localStorage.setItem(promptKey(userId, space), value); } catch {}
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useCustomPrompt(space: CoworkSpaceType) {
  const { user } = useAuth();
  const [customPrompt, setCustomPromptState] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    setCustomPromptState(loadCustomPrompt(user.id, space));
  }, [user?.id, space]);

  const setCustomPrompt = useCallback((value: string) => {
    setCustomPromptState(value);
    if (user?.id) saveCustomPrompt(user.id, space, value);
  }, [user?.id, space]);

  return { customPrompt, setCustomPrompt };
}

// ── Default prompts reference ─────────────────────────────────────────────────

const DEFAULT_HINTS: Record<CoworkSpaceType, string> = {
  agence: `Exemples d'instructions personnalisées :
• "Utilise toujours un tableau récapitulatif en fin de réponse."
• "Cible exclusivement les commerces du secteur beauté/bien-être."
• "Intègre systématiquement une estimation de ROI chiffrée."`,
  pro: `Exemples d'instructions personnalisées :
• "Mes publications ciblent une clientèle 35-55 ans, ton de proximité."
• "Je suis gérant d'un salon de coiffure à Lyon — adapte tes réponses."
• "Termine chaque réponse par une liste d'actions concrètes numérotées."`,
};

// ── Component ─────────────────────────────────────────────────────────────────

interface CustomPromptPanelProps {
  space: CoworkSpaceType;
  onSave: (prompt: string) => void;
}

export function CustomPromptPanel({ space, onSave }: CustomPromptPanelProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user?.id || !open) return;
    setDraft(loadCustomPrompt(user.id, space));
  }, [user?.id, space, open]);

  const handleSave = () => {
    if (!user?.id) return;
    saveCustomPrompt(user.id, space, draft);
    onSave(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    toast.success('✅ Prompt personnalisé sauvegardé');
  };

  const handleReset = () => {
    setDraft('');
    if (user?.id) saveCustomPrompt(user.id, space, '');
    onSave('');
    toast.success('Prompt réinitialisé — comportement par défaut restauré');
  };

  const hasCustom = draft.trim().length > 0;

  return (
    <div className={cn(
      'rounded-2xl border transition-all duration-200 overflow-hidden',
      hasCustom ? 'border-violet-500/30 bg-violet-500/5' : 'border-slate-700/40 bg-slate-800/20'
    )}>
      {/* Toggle header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2.5">
          <SlidersHorizontal size={15} className={hasCustom ? 'text-violet-400' : 'text-slate-500'} />
          <div>
            <p className={cn('text-xs font-bold', hasCustom ? 'text-violet-300' : 'text-slate-400')}>
              Prompt personnalisé
              {hasCustom && <span className="ml-2 text-[9px] bg-violet-500/20 text-violet-300 border border-violet-500/30 px-1.5 py-0.5 rounded-full font-black uppercase tracking-wide">Actif</span>}
            </p>
            {!open && hasCustom && (
              <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[300px]">{draft.slice(0, 60)}…</p>
            )}
            {!open && !hasCustom && (
              <p className="text-[10px] text-slate-600">Instructions IA par défaut · Cliquez pour personnaliser</p>
            )}
          </div>
        </div>
        {open ? <ChevronUp size={14} className="text-slate-500 shrink-0" /> : <ChevronDown size={14} className="text-slate-500 shrink-0" />}
      </button>

      {/* Editor */}
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-700/40 pt-3">
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Définissez des instructions supplémentaires que l'IA appliquera à <strong className="text-slate-300">toutes vos conversations</strong> dans cet espace.
          </p>

          {/* Hint chips */}
          <div className="rounded-xl bg-slate-800/40 border border-slate-700/40 p-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
              <Sparkles size={9} className="inline mr-1" />Inspiration
            </p>
            <p className="text-[11px] text-slate-500 leading-relaxed whitespace-pre-line">{DEFAULT_HINTS[space]}</p>
          </div>

          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder={`Ex: "Je gère un restaurant gastronomique à Paris. Adapte toujours tes réponses à ce contexte et intègre des suggestions de hashtags locaux."`}
            rows={5}
            maxLength={2000}
            className="w-full rounded-xl bg-slate-900 border border-slate-700/60 text-sm text-slate-200 placeholder:text-slate-600 px-3 py-2.5 resize-none focus:outline-none focus:border-violet-500/50 transition-colors"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-600">{draft.length}/2000 caractères</span>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                disabled={!hasCustom}
                className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-300 disabled:opacity-30 transition-colors px-3 py-1.5 rounded-lg border border-slate-700/40 hover:border-slate-600"
              >
                <RotateCcw size={11} /> Réinitialiser
              </button>
              <button
                onClick={handleSave}
                className={cn(
                  'flex items-center gap-1.5 text-[11px] font-bold px-4 py-1.5 rounded-lg border transition-all',
                  saved
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-violet-500/15 border-violet-500/30 text-violet-300 hover:bg-violet-500/25'
                )}
              >
                <Save size={11} /> {saved ? 'Sauvegardé !' : 'Appliquer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
