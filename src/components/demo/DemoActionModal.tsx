import { useRef } from 'react';
import { X } from 'lucide-react';
import { useDemoDialog } from './useDemoDialog';

interface Props {
  action: string | null;
  draft: string;
  onDraftChange: (value: string) => void;
  channels: string[];
  onChannelsChange: (channels: string[]) => void;
  clientSummary?: { score: number; alert: string };
  onClose: () => void;
  onConfirm: () => void;
}

export function DemoActionModal({ action, draft, onDraftChange, channels, onChannelsChange, clientSummary, onClose, onConfirm }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  useDemoDialog({ open: Boolean(action), onClose, dialogRef, initialFocusRef: closeRef });

  if (!action) return null;
  const [actionType, actionTarget] = action.split(':', 2);
  const isReview = actionType === 'avis';
  const isPost = actionType === 'post';
  const isMessage = actionType === 'message';
  const isCampaign = actionType === 'campaign';
  const isClient = actionType === 'client';
  const needsDraft = isReview || isPost || isMessage || isCampaign;
  const title = isClient ? actionTarget ?? 'Client sélectionné' : isReview ? 'Répondre à un avis' : isPost ? 'Créer un brouillon' : isMessage ? 'Répondre à un message' : isCampaign ? 'Préparer une campagne' : 'Préparer une action';
  const toggleChannel = (channel: string) => onChannelsChange(channels.includes(channel) ? channels.filter(item => item !== channel) : [...channels, channel]);

  return (
    <div role="presentation" className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-3" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="demo-action-title" aria-describedby="demo-action-description" className="flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-2xl sm:max-h-[85dvh] sm:rounded-2xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 p-4 sm:p-5"><div><p className="text-xs font-bold uppercase tracking-wide text-teal-700">Simulation locale · étape 3 sur 5</p><h2 id="demo-action-title" className="mt-1 text-lg font-bold text-slate-950">{title}</h2></div><button ref={closeRef} type="button" onClick={onClose} aria-label="Fermer" className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-xl hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"><X size={18} /></button></div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5"><p id="demo-action-description" className="rounded-xl bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-900">Mode démo — aucun envoi réel. Cette action modifie uniquement les données fictives de la démonstration.</p>{needsDraft && <><label htmlFor="demo-action-draft" className="mt-4 block text-sm font-bold text-slate-800">{isPost ? 'Sujet du brouillon' : isReview ? 'Réponse proposée' : isMessage ? 'Réponse proposée' : 'Nom de la campagne'}</label><textarea id="demo-action-draft" value={draft} onChange={event => onDraftChange(event.target.value)} maxLength={280} className="mt-2 min-h-28 w-full rounded-xl border border-slate-300 p-3 text-sm leading-5 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100" />{isPost && <><p className="mt-1 text-right text-xs text-slate-500">{draft.length}/280 caractères</p><fieldset className="mt-4"><legend className="text-sm font-bold text-slate-800">Canaux enregistrés</legend><div className="mt-2 flex flex-wrap gap-2">{['Instagram', 'Facebook', 'Google'].map(channel => <label key={channel} className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-semibold"><input type="checkbox" checked={channels.includes(channel)} onChange={() => toggleChannel(channel)} /> {channel}</label>)}</div></fieldset></>}</>}{actionType === 'presence' && <div className="mt-4 rounded-xl border border-slate-200 p-4 text-sm leading-6 text-slate-600">Fiche locale fictive · horaires et catégorie à vérifier avant toute modification.</div>}{isClient && <div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div className="rounded-lg bg-slate-100 p-3">Score GEO<br /><strong>{clientSummary?.score ?? '—'}/100</strong></div><div className="rounded-lg bg-slate-100 p-3">Alertes<br /><strong>{clientSummary?.alert ?? 'Aucune donnée'}</strong></div></div>}</div>
        <div className="flex shrink-0 gap-2 border-t border-slate-200 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:justify-end sm:p-5"><button type="button" onClick={onClose} className="min-h-11 flex-1 rounded-xl border border-slate-300 px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 sm:flex-none">Annuler</button><button type="button" onClick={onConfirm} className="min-h-11 flex-1 rounded-xl bg-teal-700 px-4 text-sm font-bold text-white hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 sm:flex-none">Valider la simulation</button></div>
      </section>
    </div>
  );
}
