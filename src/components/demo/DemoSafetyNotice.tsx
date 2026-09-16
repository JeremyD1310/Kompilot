import { ShieldCheck } from 'lucide-react';

export function DemoSafetyNotice() {
  return (
    <p className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-teal-800">
      <ShieldCheck size={13} aria-hidden="true" />
      Mode démo : action simulée, aucun envoi réel.
    </p>
  );
}
