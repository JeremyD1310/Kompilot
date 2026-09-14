import { useRef } from 'react';
import { Building2, CalendarDays, Check, LogOut, MessageSquare, Settings, ShieldCheck, Users, X, Star, Store, UserCircle, Network } from 'lucide-react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useDemoDialog } from './useDemoDialog';
import type { DemoProfile } from '@/lib/demoProductData';

const links = [
  ['Présence locale', '/demo/workspace/presence', ShieldCheck],
  ['Avis', '/demo/workspace/reviews', Star],
  ['Messages', '/demo/workspace/messages', MessageSquare],
  ['Calendrier', '/demo/workspace/calendar', CalendarDays],
  ['Campagnes', '/demo/workspace/campaigns', Check],
  ['Clients / établissements', '/demo/workspace/organization', Building2],
  ['Équipe', '/demo/workspace/team', Users],
  ['Paramètres', '/demo/workspace/settings', Settings],
] as const;

export function DemoMoreMenu({ open, onClose, currentPath, onReset, profile, onProfileChange }: { open: boolean; onClose: () => void; currentPath: string; onReset: () => void; profile: DemoProfile; onProfileChange: (profile: DemoProfile) => void }) {
  const navigate = useNavigate();
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  useDemoDialog({ open, onClose, dialogRef, initialFocusRef: closeRef });
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/35 lg:hidden" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="demo-more-title" className="absolute inset-x-0 bottom-0 max-h-[82dvh] overflow-y-auto rounded-t-2xl border border-slate-200 bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl sm:inset-x-3 sm:bottom-20 sm:rounded-2xl">
        <div className="sticky top-0 z-10 mb-3 flex items-center justify-between gap-3 bg-white pb-2">
          <div>
            <h2 id="demo-more-title" className="text-base font-bold text-slate-950">Plus</h2>
            <p className="text-[11px] text-slate-500">Accès rapide à la démo locale</p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Fermer Plus" className="grid min-h-11 min-w-11 place-items-center rounded-xl hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500">
            <X size={17} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {links.map(([label, path, Icon]) => (
            <Link
              key={path}
              to={path}
              onClick={onClose}
              aria-current={currentPath === path ? 'page' : undefined}
              className={`flex min-h-12 items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                currentPath === path ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-700 hover:bg-teal-50'
              }`}
            >
              <Icon size={16} aria-hidden="true" />
              {label}
            </Link>
          ))}
        </div>
        <div className="mt-4 border-t border-slate-200 pt-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Changer de profil</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {([
              ['commerce', 'Commerce', Store],
              ['artisan', 'Artisan / PME', UserCircle],
              ['agency', 'Agence', Building2],
              ['network', 'Multi-sites', Network],
            ] as const).map(([value, label, Icon]) => (
              <button key={value} type="button" onClick={() => { onProfileChange(value); onClose(); }} aria-pressed={profile === value} className={`flex min-h-12 items-center gap-2 rounded-xl px-3 text-left text-xs font-bold active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${profile === value ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-700 hover:bg-teal-50'}`}>
                <Icon size={16} aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 grid gap-2 border-t border-slate-200 pt-3">
          <button type="button" onClick={() => { onReset(); onClose(); }} className="flex min-h-12 items-center gap-2 rounded-xl bg-slate-100 px-3 text-left text-xs font-bold text-slate-700 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500">
            <Settings size={16} />
            Réinitialiser la démo
          </button>
          <button type="button" onClick={() => { onClose(); navigate({ to: '/demo' }); }} className="flex min-h-12 items-center gap-2 rounded-xl px-3 text-left text-xs font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-700 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500">
            <LogOut size={16} />
            Quitter la démo
          </button>
        </div>
      </section>
    </div>
  );
}
