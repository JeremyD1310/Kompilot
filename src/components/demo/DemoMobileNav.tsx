import { BarChart3, Check, LayoutDashboard, MoreHorizontal, PenLine } from 'lucide-react';
import { Link } from '@tanstack/react-router';

const items = [
  { label: 'Aujourd’hui', path: '/demo/workspace', icon: LayoutDashboard },
  { label: 'À valider', path: '/demo/workspace/approvals', icon: Check },
  { label: 'Créer', path: '/demo/workspace/content', icon: PenLine },
  { label: 'Résultats', path: '/demo/workspace/results', icon: BarChart3 },
] as const;

export function DemoMobileNav({ currentPath, onMore }: { currentPath: string; onMore: () => void }) {
  return (
    <nav aria-label="Navigation mobile de la démo" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 items-end border-t border-slate-200 bg-white/95 px-1 pb-[max(env(safe-area-inset-bottom),0.25rem)] pt-1 shadow-[0_-8px_25px_rgba(15,23,42,.08)] backdrop-blur lg:hidden">
      {items.map(({ label, path, icon: Icon }, index) => {
        const active = path === '/demo/workspace' ? currentPath === path : currentPath.startsWith(path);
        const isCreate = index === 2;
        return (
          <Link key={path} to={path} aria-current={active ? 'page' : undefined} className={`flex min-h-14 min-w-0 items-center justify-center gap-1.5 rounded-xl px-1 py-2 text-center text-[10px] font-bold transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${isCreate ? '-mt-3 min-h-16 bg-teal-700 text-white shadow-lg' : active ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Icon size={18} aria-hidden="true" />
            <span className="max-w-[4.2rem] truncate">{label}</span>
          </Link>
        );
      })}
      <button type="button" onClick={onMore} aria-label="Ouvrir Plus" className="flex min-h-14 min-w-0 items-center justify-center gap-1.5 rounded-xl px-1 py-2 text-center text-[10px] font-bold text-slate-600 transition-colors hover:bg-slate-50 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500">
        <MoreHorizontal size={18} aria-hidden="true" />
        <span>Plus</span>
      </button>
    </nav>
  );
}
