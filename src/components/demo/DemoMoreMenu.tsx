import { X } from 'lucide-react';
import { Link } from '@tanstack/react-router';

const links = [
  ['Calendrier', '/demo/workspace/calendar'],
  ['Présence locale', '/demo/workspace/presence'],
  ['Avis', '/demo/workspace/reviews'],
  ['Messages', '/demo/workspace/messages'],
  ['Campagnes', '/demo/workspace/campaigns'],
  ['Clients / établissements', '/demo/workspace/organization'],
  ['Paramètres', '/demo/workspace/settings'],
] as const;

export function DemoMoreMenu({ open, onClose, currentPath, onReset }: { open: boolean; onClose: () => void; currentPath: string; onReset: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-x-3 bottom-20 z-50 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl lg:hidden">
      <div className="mb-2 flex items-center justify-between"><strong>Autres fonctions</strong><button type="button" onClick={onClose} aria-label="Fermer"><X size={17} /></button></div>
      <div className="grid grid-cols-2 gap-2">
        {links.map(([label, path]) => <Link key={path} to={path} onClick={onClose} className={`rounded-xl px-3 py-2 text-xs font-bold ${currentPath === path ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-700'}`}>{label}</Link>)}
        <button type="button" onClick={onReset} className="rounded-xl bg-slate-100 px-3 py-2 text-left text-xs font-bold">Réinitialiser la démo</button>
      </div>
    </div>
  );
}
