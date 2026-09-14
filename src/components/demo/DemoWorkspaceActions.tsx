import { BarChart3, Building2, Check, ChevronRight, FileCheck2, MessageSquare, PenLine, RotateCcw, Sparkles, Store } from 'lucide-react';
import type { DemoRecord, DemoWorkflowStatus } from '@/lib/demoProductData';

interface Props {
  data: DemoRecord;
  onAction: (action: string) => void;
  onNavigate: (path: string) => void;
  onReset: () => void;
  onApprovalChange: (id: string, status: DemoWorkflowStatus) => void;
}

const cardClass = 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5';
const touchClass = 'min-h-11 rounded-xl px-3 py-2 text-sm font-bold transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500';

const priorityByProfile = {
  commerce: { icon: MessageSquare, title: 'Répondre à un avis local', reason: 'Un avis fictif attend une réponse claire avant la prochaine visite.', impact: 'Renforcer la confiance locale', action: 'avis', cta: 'Préparer une réponse' },
  artisan: { icon: PenLine, title: 'Publier une réalisation', reason: 'Une réalisation fictive peut devenir un brouillon à relire pour votre zone desservie.', impact: 'Montrer votre savoir-faire local', action: 'post', cta: 'Créer le brouillon' },
  agency: { icon: FileCheck2, title: 'Valider le contenu d’un client', reason: 'Un contenu fictif est prêt à être relu dans votre portefeuille.', impact: 'Fluidifier les validations client', action: 'post', cta: 'Ouvrir la validation' },
  network: { icon: Store, title: 'Corriger une incohérence locale', reason: 'Un établissement fictif signale une alerte de cohérence à vérifier.', impact: 'Harmoniser la présence du réseau', action: 'presence', cta: 'Vérifier la fiche' },
} as const;

export function DemoWorkspaceActions({ data, onAction, onNavigate, onReset, onApprovalChange }: Props) {
  const priority = priorityByProfile[data.profile];
  const PriorityIcon = priority.icon;
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <section className={`${cardClass} order-1 border-teal-100 bg-gradient-to-br from-white to-teal-50`} aria-labelledby="priority-title">
        <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-teal-700">Priorité du jour</p><h2 id="priority-title" className="mt-1 text-lg font-black text-slate-950">{priority.title}</h2></div><Sparkles className="shrink-0 text-teal-700" size={20} /></div>
        <div className="mt-4 rounded-xl border border-teal-100 bg-white p-3"><div className="flex items-start gap-3"><PriorityIcon className="mt-0.5 shrink-0 text-teal-700" size={18} /><div className="min-w-0"><p className="text-sm font-bold text-slate-900">Pourquoi maintenant ?</p><p className="mt-1 text-sm leading-5 text-slate-600">{priority.reason}</p><p className="mt-2 text-xs font-semibold text-teal-800">Impact indicatif : {priority.impact}</p><p className="mt-2 text-[11px] font-semibold text-slate-500">Statut : À valider · Données simulées</p></div></div><button type="button" onClick={() => onAction(priority.action)} className={`${touchClass} mt-4 w-full bg-teal-700 text-white hover:bg-teal-800`}>{priority.cta}</button></div>
      </section>

      <section className={`${cardClass} order-2`} aria-labelledby="approvals-title"><div className="mb-4 flex items-start justify-between gap-3"><div><h2 id="approvals-title" className="text-base font-bold text-slate-950">À valider</h2><p className="text-xs text-slate-500">Une file unique : posts, avis, emails, messages et campagnes fictifs.</p></div><button type="button" onClick={() => onNavigate('/demo/workspace/approvals')} className="min-h-11 shrink-0 px-2 text-xs font-bold text-teal-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500">Voir tout</button></div><div className="space-y-2">{data.approvals.slice(0, 3).map(item => <div key={item.id} className="flex items-center gap-2 rounded-xl bg-slate-50 p-2"><button type="button" onClick={() => onAction(item.kind === 'review' ? 'avis' : item.kind === 'message' ? 'message' : item.kind === 'campaign' ? 'campaign' : 'post')} className="min-h-11 min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"><span className="block truncate text-sm font-semibold text-slate-800">{item.title}</span><span className="block truncate text-xs text-slate-500">{item.detail} · {item.status}</span></button><select aria-label={`Statut de ${item.title}`} value={item.status} onChange={event => onApprovalChange(item.id, event.target.value as DemoWorkflowStatus)} className="min-h-11 max-w-[7.5rem] rounded-lg border border-slate-300 bg-white px-2 text-xs"><option>Brouillon</option><option>À valider</option><option>Validé</option><option>Planifié</option><option>Publié</option></select></div>)}</div></section>

      <section className={`${cardClass} order-3`} aria-labelledby="results-title"><div className="mb-4 flex items-start justify-between gap-3"><div><h2 id="results-title" className="text-base font-bold text-slate-950">Résultats</h2><p className="text-xs text-slate-500">Chaque indicateur est un exemple de démonstration · Données simulées.</p></div><BarChart3 className="shrink-0 text-violet-600" size={18} /></div><div className="grid grid-cols-2 gap-3">{[['Visibilité locale', `${data.localVisibility}/100`], ['Avis', `${data.rating}/5`], ['Publications', `${data.approvals.filter(item => item.kind === 'post').length}`], ['Leads / conversions', `${data.leads} / ${data.conversions}`]].map(([label, value]) => <button type="button" key={label} onClick={() => onNavigate('/demo/workspace/results')} className="min-h-28 rounded-xl bg-slate-50 p-3 text-left transition active:scale-[.98] hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-2 text-xl font-black text-slate-900">{value}</p><p className="mt-2 text-xs font-bold text-teal-700">Voir le détail <ChevronRight className="inline" size={13} /></p></button>)}</div></section>

      <section className={`${cardClass} order-4`} aria-labelledby="activity-title"><div className="mb-4 flex items-center justify-between gap-3"><div><h2 id="activity-title" className="text-base font-bold text-slate-950">Activité récente</h2><p className="text-xs text-slate-500">Chronologie locale des actions fictives.</p></div><button type="button" onClick={onReset} className={`${touchClass} hidden border border-slate-200 text-slate-600 sm:inline-flex`}><RotateCcw size={13} className="mr-1.5" /> Réinitialiser</button></div><ol className="space-y-3">{data.notifications.map((item, index) => <li key={item} className="flex items-start gap-3 text-sm text-slate-600"><span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-teal-600" aria-hidden="true" /><span><strong className="font-semibold text-slate-800">{index === 0 ? 'Session' : index === 1 ? 'Validation' : 'Résultats'}</strong><span className="ml-1">{item}</span></span></li>)}</ol><button type="button" onClick={() => onNavigate('/demo/workspace/content')} className={`${touchClass} mt-4 inline-flex items-center border border-slate-200 text-slate-700 sm:hidden`}><PenLine size={15} className="mr-1.5" /> Créer un brouillon</button></section>

      <section className="order-5 grid gap-3 sm:grid-cols-3"><button type="button" onClick={() => onNavigate('/demo/workspace/content')} className={`${touchClass} flex items-center justify-center gap-2 border border-slate-200 bg-white text-slate-700 hover:border-teal-300`}><PenLine size={16} /> Créer</button><button type="button" onClick={() => onNavigate('/demo/workspace/presence')} className={`${touchClass} flex items-center justify-center gap-2 border border-slate-200 bg-white text-slate-700 hover:border-teal-300`}><Building2 size={16} /> Présence locale</button><button type="button" onClick={() => onNavigate('/demo/workspace/results')} className={`${touchClass} flex items-center justify-center gap-2 border border-slate-200 bg-white text-slate-700 hover:border-teal-300`}><Check size={16} /> Voir les résultats</button></section>
    </div>
  );
}
