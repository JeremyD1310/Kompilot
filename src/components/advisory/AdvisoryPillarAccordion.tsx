import { useState } from 'react';
import { ArrowUpRight, CalendarPlus, ChevronDown, CircleAlert, CircleCheck, Lightbulb, Minus, Send, Sparkles, Target } from 'lucide-react';
import { Link, useNavigate } from '@tanstack/react-router';
import { toast } from '@blinkdotnew/ui';
import type { AdvisoryPillar, AdvisoryStatus } from '../../lib/advisoryTypes';
import { usePublishNow } from '../../hooks/useSocialPublish';

const statusMeta: Record<AdvisoryStatus, { label: string; color: string; icon: typeof CircleAlert }> = {
  critical: { label: 'Priorité haute', color: 'text-red-600 bg-red-50 border-red-200', icon: CircleAlert },
  attention: { label: 'À surveiller', color: 'text-amber-700 bg-amber-50 border-amber-200', icon: CircleAlert },
  opportunity: { label: 'Opportunité', color: 'text-blue-700 bg-blue-50 border-blue-200', icon: Lightbulb },
  healthy: { label: 'Sain', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: CircleCheck },
};

function scoreWidth(score: number) {
  if (score >= 90) return 'w-[90%]';
  if (score >= 80) return 'w-[80%]';
  if (score >= 70) return 'w-[70%]';
  if (score >= 60) return 'w-[60%]';
  if (score >= 50) return 'w-[50%]';
  if (score >= 40) return 'w-[40%]';
  return 'w-[30%]';
}

export function AdvisoryPillarAccordion({ pillar, open, onToggle }: { pillar: AdvisoryPillar; open: boolean; onToggle: () => void }) {
  const [completed, setCompleted] = useState<string[]>([]);
  const navigate = useNavigate();
  const publishNow = usePublishNow();
  const meta = statusMeta[pillar.status];
  const StatusIcon = meta.icon;

  const suggestionFor = (title: string, detail: string) => `${title}\n\n${detail}\n\n#ConseilKompilot #${pillar.id}`;
  const handlePublish = async (title: string, detail: string) => {
    try {
      const result = await publishNow.mutateAsync({
        channels: ['linkedin', 'facebook', 'instagram'],
        text: suggestionFor(title, detail),
      });
      const failed = result.results.filter(item => !item.success);
      if (result.success) toast.success('Suggestion publiée', { description: 'Le post a été envoyé aux réseaux connectés.' });
      else toast.error('Publication non envoyée', { description: failed[0]?.error ?? 'Connectez au moins un réseau social.' });
    } catch (error) {
      toast.error('Publication impossible', { description: error instanceof Error ? error.message : 'Réessayez plus tard.' });
    }
  };

  const handleRepurpose = (title: string, detail: string, actionId: string, impact: string, effort: string) => {
    try {
      sessionStorage.setItem('kompilot_repurpose_source', JSON.stringify({
        sourceText: suggestionFor(title, detail), sourceLabel: title, sourceType: 'advisory',
        recommendationId: actionId, recommendationTitle: title, recommendationDetail: detail,
        pillarId: pillar.id, pillarLabel: pillar.label, impact, effort, score: pillar.score,
        generatedAt: new Date().toISOString(),
      }));
      navigate({ to: '/repurposing' });
      toast.success('Recommandation transférée au Repurposing IA');
    } catch (error) {
      toast.error('Transfert impossible', { description: error instanceof Error ? error.message : 'Réessayez plus tard.' });
    }
  };

  return (
    <article className={`rounded-2xl border bg-white transition-shadow ${open ? 'border-slate-300 shadow-md' : 'border-slate-200 shadow-sm'}`}>
      <button type="button" onClick={onToggle} aria-expanded={open} className="w-full flex items-start gap-3 p-4 text-left sm:items-center sm:gap-4 sm:p-5">
        <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
          <Target size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-bold text-slate-900">{pillar.label}</h2>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${meta.color}`}>
              <StatusIcon size={12} /> {meta.label}
            </span>
          </div>
          <p className="text-sm text-slate-500 truncate mt-1">{pillar.summary}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden h-2 w-24 overflow-hidden rounded-full bg-slate-100 sm:block"><div className={`h-full rounded-full bg-teal-600 ${scoreWidth(pillar.score)}`} /></div>
          <span className="text-lg font-black text-slate-900 tabular-nums">{pillar.score}</span>
          <ChevronDown size={18} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 pb-5 sm:px-5">
          <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr] pt-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">Signaux détectés</p>
              <ul className="space-y-2">
                {pillar.signals.map(signal => <li key={signal} className="flex gap-2 text-sm text-slate-600"><Minus size={14} className="mt-0.5 text-teal-600 shrink-0" />{signal}</li>)}
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">Actions recommandées</p>
              <div className="space-y-2">
                {pillar.actions.map(action => {
                  const done = completed.includes(action.id);
                  return (
                    <div key={action.id} className={`rounded-xl border p-3 transition-colors ${done ? 'border-emerald-200 bg-emerald-50/60' : 'border-slate-200 bg-slate-50/70'}`}>
                      <div className="flex items-start gap-3">
                        <button type="button" aria-label={done ? 'Action terminée' : 'Marquer comme terminée'} onClick={() => setCompleted(value => done ? value.filter(id => id !== action.id) : [...value, action.id])} className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 text-transparent'}`}><CircleCheck size={13} /></button>
                        <div className="min-w-0 flex-1"><p className={`text-sm font-bold ${done ? 'text-emerald-800 line-through' : 'text-slate-800'}`}>{action.title}</p><p className="text-xs text-slate-500 mt-1 leading-relaxed">{action.detail}</p><div className="flex flex-wrap items-center gap-2 mt-3">{!done && <button type="button" onClick={() => handleRepurpose(action.title, action.detail, action.id, action.impact, action.effort)} className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1.5 text-[11px] font-bold text-primary hover:bg-primary/10"><Sparkles size={12} /> Recycler avec l’IA</button>} {!done && <button type="button" onClick={() => void handlePublish(action.title, action.detail)} disabled={publishNow.isPending} className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1.5 text-[11px] font-bold text-teal-700 hover:bg-teal-100 disabled:opacity-50"><Send size={12} /> Publier la suggestion</button>} {!done && <button type="button" onClick={() => navigate({ to: '/calendrier' })} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100"><CalendarPlus size={12} /> Planifier</button>}</div></div>
                        {action.href && !done && <Link to={action.href as any} className="text-teal-700 hover:text-teal-900 shrink-0" aria-label={`Ouvrir ${action.title}`}><ArrowUpRight size={16} /></Link>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
