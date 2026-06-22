import { ShieldCheck } from 'lucide-react';

export function WhiteLabelBanner() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4">
      <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
        <ShieldCheck size={16} className="text-violet-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-violet-900">
          🔒 Protection Marque Blanche Activée
        </p>
        <p className="text-xs text-violet-700 mt-1 leading-relaxed">
          La facturation Kompilot n'est <strong>JAMAIS</strong> transmise à vos clients finaux.
          Seul votre logo et votre nom apparaissent sur les documents que vos clients reçoivent.
        </p>
      </div>
    </div>
  );
}
