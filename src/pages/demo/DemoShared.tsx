import { Sparkles } from 'lucide-react';
import { Button } from '@blinkdotnew/ui';

/* ── Onglet persona ──────────────────────────────────────────── */
export function PersonaTab({ active, onClick, icon, label }: {
  active: boolean; onClick: () => void;
  icon: React.ReactNode; label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm transition-all ${
        active
          ? 'bg-white dark:bg-slate-800 text-[#0D9488] font-bold border-[#0D9488] shadow-md'
          : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
    >
      {icon}<span>{label}</span>
    </button>
  );
}

/* ── Feed item card ──────────────────────────────────────────── */
export function FeedItem({ icon, title, desc, color }: {
  icon: string; title: string; desc: string; color?: 'amber';
}) {
  const btnCls = color === 'amber'
    ? 'bg-amber-500 hover:bg-amber-600'
    : 'bg-[#0D9488] hover:bg-[#0B7A6F]';

  return (
    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex gap-3">
      <span className="text-xl shrink-0">{icon}</span>
      <div className="flex-1 space-y-1 min-w-0">
        <h4 className="font-bold text-xs text-slate-900 dark:text-white">{title}</h4>
        <p className="text-[11px] text-slate-500 leading-relaxed">{desc}</p>
        <Button size="sm" className={`mt-1.5 ${btnCls} text-white gap-1.5 h-7 text-[11px] px-3`}>
          <Sparkles className="w-3 h-3" /> Générer le visuel
        </Button>
      </div>
    </div>
  );
}

/* ── Mini stat tile ──────────────────────────────────────────── */
export function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center">
      <p className="text-lg font-black text-slate-900 dark:text-white">{value}</p>
      <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}
