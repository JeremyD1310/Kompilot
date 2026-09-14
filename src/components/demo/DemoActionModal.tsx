import { useEffect } from 'react';
import { X } from 'lucide-react';

interface Props {
  action: string | null;
  draft: string;
  onDraftChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function DemoActionModal({ action, draft, onDraftChange, onClose, onConfirm }: Props) {
  useEffect(() => {
    if (!action) return;
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [action, onClose]);

  if (!action) return null;
  const isReview = action === 'avis';
  const isPost = action === 'post';
  const isClient = action.startsWith('client:');

  return (
    <div role="dialog" aria-modal="true" aria-label="Action simulée" className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/40 p-3 sm:items-center">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-teal-700">Simulation locale</p>
            <h2 className="mt-1 text-lg font-bold text-slate-950">{isClient ? action.slice(7) : isReview ? 'Réponse à un avis' : isPost ? 'Créer un brouillon' : 'Préparer une action'}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer"><X size={18} /></button>
        </div>
        <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-900">Aucun envoi externe. Cette action modifie uniquement les données fictives de la démonstration.</p>
        {isReview && <textarea value={draft} onChange={event => onDraftChange(event.target.value)} className="mt-4 min-h-28 w-full rounded-xl border border-slate-300 p-3 text-sm" aria-label="Brouillon de réponse" />}
        {isPost && <input defaultValue="Nouveau brouillon fictif" className="mt-4 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm" aria-label="Titre du brouillon" />}
        {action === 'presence' && <div className="mt-4 rounded-xl border border-slate-200 p-4 text-sm text-slate-600">Fiche locale fictive · horaires et catégorie à vérifier avant toute modification.</div>}
        {isClient && <div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div className="rounded-lg bg-slate-100 p-3">Score GEO<br /><strong>84/100</strong></div><div className="rounded-lg bg-slate-100 p-3">Alertes<br /><strong>3 à traiter</strong></div></div>}
        <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold">Annuler</button><button type="button" onClick={onConfirm} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white hover:bg-teal-800">Valider la simulation</button></div>
      </div>
    </div>
  );
}
