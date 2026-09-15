import { useRef } from 'react';
import { RotateCcw, X } from 'lucide-react';
import { useDemoDialog } from './useDemoDialog';

interface DemoResetDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DemoResetDialog({ open, onClose, onConfirm }: DemoResetDialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  useDemoDialog({ open, onClose, dialogRef, initialFocusRef: closeRef });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-4" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="demo-reset-title" className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Réinitialisation locale</p>
            <h2 id="demo-reset-title" className="mt-1 text-lg font-bold text-slate-950">Recommencer la démonstration ?</h2>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Fermer la confirmation" className="grid min-h-11 min-w-11 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"><X size={18} /></button>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">Les brouillons, validations, réponses et sélections fictives seront restaurés à leur état initial. Aucun compte client ne sera modifié.</p>
        <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-900">Mode démo : action simulée, aucun envoi réel.</p>
        <div className="mt-5 flex gap-2 sm:justify-end">
          <button type="button" onClick={onClose} className="min-h-11 flex-1 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 sm:flex-none">Annuler</button>
          <button type="button" onClick={onConfirm} className="min-h-11 flex-1 rounded-xl bg-teal-700 px-4 text-sm font-bold text-white hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 sm:flex-none"><RotateCcw size={15} className="mr-2 inline" />Réinitialiser</button>
        </div>
      </section>
    </div>
  );
}
