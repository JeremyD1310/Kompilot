import { BarChart3, Building2, Check, ChevronRight, MessageSquare, PenLine, RotateCcw, Sparkles } from 'lucide-react';
import type { DemoRecord, DemoWorkflowStatus } from '@/lib/demoProductData';

interface Props {
  data: DemoRecord;
  onAction: (action: string) => void;
  onNavigate: (path: string) => void;
  onReset: () => void;
  onApprovalChange: (id: string, status: DemoWorkflowStatus) => void;
}

const cardClass = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm';

export function DemoWorkspaceActions({ data, onAction, onNavigate, onReset, onApprovalChange }: Props) {
  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Résultats clés">
        {[
          ['Visibilité locale', `${data.localVisibility}/100`, 'Voir les résultats'],
          ['Score GEO', `${data.geoScore}/100`, 'Voir les résultats'],
          ['Avis à traiter', `${data.reviewsToAnswer}`, 'Ouvrir les avis'],
          ['Leads / conversions', `${data.leads} / ${data.conversions}`, 'Voir les résultats'],
        ].map(([label, value, action]) => (
          <button key={label} type="button" onClick={() => onNavigate(action === 'Ouvrir les avis' ? '/demo/workspace/reviews' : '/demo/workspace/results')} className={`${cardClass} text-left transition hover:-translate-y-0.5 hover:border-teal-300`}>
            <p className="text-xs font-semibold text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
            <p className="mt-2 text-xs font-bold text-teal-700">{action} <ChevronRight className="inline" size={13} /></p>
          </button>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <section className={cardClass}>
          <div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="text-base font-bold text-slate-950">Priorité du jour</h2><p className="text-xs text-slate-500">Les actions fictives les plus utiles à traiter maintenant.</p></div><Sparkles className="text-teal-700" size={18} /></div>
          <div className="space-y-2">
            <button type="button" onClick={() => onAction('avis')} className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left hover:border-teal-300 hover:bg-teal-50"><MessageSquare className="text-teal-700" size={17} /><span className="min-w-0 flex-1"><strong className="block text-sm">Répondre aux avis</strong><span className="block text-xs text-slate-500">{data.reviewsToAnswer} réponses préparées pour validation</span></span><ChevronRight size={15} /></button>
            <button type="button" onClick={() => onAction('post')} className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left hover:border-teal-300 hover:bg-teal-50"><PenLine className="text-teal-700" size={17} /><span className="min-w-0 flex-1"><strong className="block text-sm">Créer un brouillon</strong><span className="block text-xs text-slate-500">Publication préparée par l’IA, puis validée par vous</span></span><ChevronRight size={15} /></button>
            <button type="button" onClick={() => onNavigate('/demo/workspace/presence')} className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left hover:border-teal-300 hover:bg-teal-50"><Building2 className="text-teal-700" size={17} /><span className="min-w-0 flex-1"><strong className="block text-sm">Vérifier la présence locale</strong><span className="block text-xs text-slate-500">Une information fictive mérite votre attention</span></span><ChevronRight size={15} /></button>
          </div>
        </section>

        <section className={cardClass}>
          <div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="text-base font-bold text-slate-950">À valider</h2><p className="text-xs text-slate-500">Chaque carte ouvre une action locale.</p></div><button type="button" onClick={() => onNavigate('/demo/workspace/approvals')} className="text-xs font-bold text-teal-700 hover:underline">Voir la file</button></div>
          <div className="space-y-3">
            {data.approvals.slice(0, 3).map(item => <div key={item.id} className="flex items-center gap-2"><button type="button" onClick={() => onAction(item.kind === 'review' ? 'avis' : 'post')} className="min-w-0 flex-1 text-left"><span className="block truncate text-sm font-semibold text-slate-800">{item.title}</span><span className="block text-xs text-slate-500">{item.detail}</span></button><select aria-label={`Statut de ${item.title}`} value={item.status} onChange={event => onApprovalChange(item.id, event.target.value as DemoWorkflowStatus)} className="min-h-9 max-w-28 rounded-lg border border-slate-300 bg-white px-2 text-xs"><option>Brouillon</option><option>À valider</option><option>Validé</option><option>Planifié</option><option>Publié</option></select></div>)}
          </div>
        </section>
      </div>

      <section className={cardClass}>
        <div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="text-base font-bold text-slate-950">Résultats</h2><p className="text-xs text-slate-500">Indicateurs fictifs pour comprendre le cockpit.</p></div><button type="button" onClick={() => onNavigate('/demo/workspace/results')} className="text-xs font-bold text-teal-700 hover:underline">Ouvrir le détail</button></div>
        <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-teal-50 p-4"><p className="text-xs text-teal-800">Portée simulée</p><p className="mt-1 text-2xl font-bold text-teal-900">{data.reach.toLocaleString('fr-FR')}</p></div><div className="rounded-xl bg-slate-100 p-4"><p className="text-xs text-slate-600">Engagement estimé</p><p className="mt-1 text-2xl font-bold text-slate-900">{data.engagement}%</p></div><div className="rounded-xl bg-amber-50 p-4"><p className="text-xs text-amber-800">Conversions fictives</p><p className="mt-1 text-2xl font-bold text-amber-900">{data.conversions}</p></div></div>
      </section>

      <section className={cardClass}>
        <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-base font-bold text-slate-950">Activité récente</h2><p className="text-xs text-slate-500">Journal local de la session.</p></div><button type="button" onClick={onReset} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"><RotateCcw size={13} /> Réinitialiser</button></div>
        <ul className="grid gap-2 sm:grid-cols-3">{data.notifications.map(item => <li key={item} className="rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-600"><Check className="mr-1 inline text-teal-700" size={13} />{item}</li>)}</ul>
      </section>
    </div>
  );
}
