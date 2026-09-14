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
    <nav aria-label="Navigation mobile de la démo" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] pt-1 shadow-[0_-8px_25px_rgba(15,23,42,.08)] backdrop-blur lg:hidden">
      {items.map(({ label, path, icon: Icon }) => (
        <Link key={path} to={path} className={`flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-bold ${currentPath === path ? 'text-teal-700' : 'text-slate-500'}`}>
          <Icon size={18} aria-hidden="true" />{label}
        </Link>
      ))}
      <button type="button" onClick={onMore} className="flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-bold text-slate-600">
        <MoreHorizontal size={18} aria-hidden="true" />Plus
      </button>
    </nav>
  );
}
