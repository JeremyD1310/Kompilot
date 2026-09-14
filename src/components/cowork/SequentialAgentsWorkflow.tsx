import { useState } from 'react';
import { Check, Circle, Loader2, Play, ShieldCheck, Target, Users } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, toast } from '@blinkdotnew/ui';
import { useAgentSprint, type SequentialWorkflowParams, type WorkflowStep } from '../../hooks/useAgentSprint';
import { useAgentQuota } from '../../hooks/useAgentQuota';

const STEPS: Array<{ id: Exclude<WorkflowStep, 'idle' | 'failed' | 'completed'>; label: string; description: string; icon: typeof Target }> = [
  { id: 'media_planner', label: 'Media Planner', description: 'Acquisition, conversion, rétention et KPIs.', icon: Target },
  { id: 'ad_spy', label: 'Ad Spy & Copywriter', description: 'Angles, hooks et objections à contrer.', icon: ShieldCheck },
  { id: 'account_manager', label: 'Account Manager', description: 'Synthèse ROI et plan d’action priorisé.', icon: Users },
];

const initialForm: SequentialWorkflowParams = {
  brief: 'Lancer une offre locale et générer des demandes de réservation ce mois-ci.',
  sector: 'restaurant',
  tone: 'chaleureux et direct',
  platforms: ['Instagram', 'Facebook'],
  postCount: 3,
  clientName: '',
  competitor: '',
  period: 'Sprint de lancement — août 2026',
  satisfaction: 4,
  highlights: '',
};

function statusForStep(step: typeof STEPS[number]['id'], current: WorkflowStep) {
  if (current === 'completed') return 'done';
  const currentIndex = STEPS.findIndex(item => item.id === current);
  const stepIndex = STEPS.findIndex(item => item.id === step);
  if (current === step) return 'running';
  if (currentIndex > stepIndex) return 'done';
  return 'pending';
}

export function SequentialAgentsWorkflow() {
  const [form, setForm] = useState<SequentialWorkflowParams>(initialForm);
  const [result, setResult] = useState<{ mediaPlan: string; adSpy: string; report: string } | null>(null);
  const { runSequentialWorkflow, workflowStep, isRunning, logs } = useAgentSprint();
  const quota = useAgentQuota();

  function update<K extends keyof SequentialWorkflowParams>(key: K, value: SequentialWorkflowParams[K]) {
    setForm(current => ({ ...current, [key]: value }));
  }

  const launch = async () => {
    if (!form.clientName.trim() || !form.competitor.trim()) {
      toast.error('Complétez le nom du client et le concurrent principal.');
      return;
    }
    if (!quota.consume()) {
      toast.error('Quota d’agents épuisé', { description: 'Ajoutez un pack de sprints pour relancer le workflow.' });
      return;
    }
    setResult(null);
    try {
      const workflow = await runSequentialWorkflow(form);
      setResult({ mediaPlan: workflow.sprint.content, adSpy: workflow.adSpy.content, report: workflow.report.content });
      toast.success('Workflow multi-agents terminé', { description: 'Les trois livrables sont prêts.' });
    } catch (error) {
      toast.error('Workflow interrompu', { description: error instanceof Error ? error.message : 'Réessayez dans quelques instants.' });
    }
  };

  return (
    <Card className="overflow-hidden border-indigo-500/20 bg-slate-950 text-slate-100 shadow-lg">
      <CardHeader className="border-b border-slate-800 bg-gradient-to-r from-indigo-950/70 to-slate-950 px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-300">Orchestration séquentielle</p>
            <CardTitle className="text-lg text-slate-50">Media Planner → Ad Spy → Account Manager</CardTitle>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-400">Un seul brief, trois expertises coordonnées. Chaque agent reçoit la sortie du précédent avant de produire son livrable.</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-right">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Crédits disponibles</p>
            <p className="text-lg font-black text-indigo-300">{quota.remaining}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-300">Brief stratégique</label>
              <textarea value={form.brief} onChange={event => update('brief', event.target.value)} rows={4} className="mt-1.5 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500" placeholder="Objectif, offre, saisonnalité, friction d’achat…" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="text-xs text-slate-300">Client / entreprise</label><input value={form.clientName} onChange={event => update('clientName', event.target.value)} className="mt-1.5 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" placeholder="Ex. Maison Alba" /></div>
              <div><label className="text-xs text-slate-300">Concurrent principal</label><input value={form.competitor} onChange={event => update('competitor', event.target.value)} className="mt-1.5 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" placeholder="Ex. Le Café Central" /></div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="text-xs text-slate-300">Secteur</label><input value={form.sector} onChange={event => update('sector', event.target.value)} className="mt-1.5 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" /></div>
              <div><label className="text-xs text-slate-300">Ton</label><input value={form.tone} onChange={event => update('tone', event.target.value)} className="mt-1.5 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" /></div>
            </div>
            <div><label className="text-xs text-slate-300">Contexte complémentaire</label><textarea value={form.highlights} onChange={event => update('highlights', event.target.value)} rows={3} className="mt-1.5 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500" placeholder="Résultats passés, contraintes, preuve sociale…" /></div>
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-3">
          {STEPS.map(step => {
            const status = statusForStep(step.id, workflowStep);
            const Icon = step.icon;
            return <div key={step.id} className={`rounded-xl border p-3 transition-colors ${status === 'running' ? 'border-indigo-400/60 bg-indigo-500/10' : status === 'done' ? 'border-emerald-400/40 bg-emerald-500/10' : 'border-slate-800 bg-slate-900/60'}`}><div className="flex items-center gap-2"><span className={status === 'running' ? 'text-indigo-300' : status === 'done' ? 'text-emerald-300' : 'text-slate-500'}>{status === 'running' ? <Loader2 size={16} className="animate-spin" /> : status === 'done' ? <Check size={16} /> : <Icon size={16} />}</span><span className="text-xs font-bold text-slate-200">{step.label}</span></div><p className="mt-1 text-[11px] leading-relaxed text-slate-500">{step.description}</p></div>;
          })}
        </div>

        <Button onClick={launch} disabled={isRunning} className="w-full gap-2 bg-indigo-500 text-white hover:bg-indigo-400 sm:w-auto"><Play size={14} />{isRunning ? 'Workflow en cours…' : 'Lancer le workflow complet'}</Button>

        {logs.length > 0 && <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-800 bg-[#0b1020] p-3 font-mono text-[10px] text-slate-400">{logs.slice(-14).map((log, index) => <p key={`${log}-${index}`} className="leading-relaxed">{log}</p>)}</div>}

        {result && <div className="grid gap-3 lg:grid-cols-3">{[['Media Planner', result.mediaPlan], ['Ad Spy & Copywriter', result.adSpy], ['Account Manager', result.report]].map(([title, content]) => <div key={title} className="max-h-64 overflow-y-auto rounded-xl border border-slate-800 bg-slate-900/80 p-4"><div className="mb-2 flex items-center gap-2 text-xs font-bold text-indigo-200"><Circle size={7} className="fill-current" />{title}</div><p className="whitespace-pre-wrap text-[11px] leading-relaxed text-slate-300">{content}</p></div>)}</div>}
      </CardContent>
    </Card>
  );
}
