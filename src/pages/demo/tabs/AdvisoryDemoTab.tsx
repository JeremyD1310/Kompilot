import { useState } from 'react';
import { BrainCircuit, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { ADVISORY_DEMO_REPORT } from '../../../data/advisoryDemoData';
import { AdvisoryPillarAccordion } from '../../../components/advisory/AdvisoryPillarAccordion';
import type { AdvisoryPillarId } from '../../../lib/advisoryTypes';

export default function AdvisoryDemoTab() {
  const [openPillar, setOpenPillar] = useState<AdvisoryPillarId>('social');
  const report = ADVISORY_DEMO_REPORT;
  return (
    <div className="space-y-6 text-slate-900">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700"><BrainCircuit size={24} /></div>
            <div>
              <div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-black">Analyse & Conseil IA</h1><span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-700">Démo</span></div>
              <p className="mt-1 text-sm text-slate-500">Un cockpit stratégique basé sur le profil vérifié de Maison Éclat et ses signaux marketing.</p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500"><span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1"><ShieldCheck size={12} className="text-teal-600" /> Profil vérifié</span><span className="rounded-full bg-slate-100 px-2.5 py-1">Google Analytics 4</span><span className="rounded-full bg-slate-100 px-2.5 py-1">Meta · TikTok · GEO</span></div>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl bg-slate-50 px-5 py-4"><div><p className="text-3xl font-black text-teal-700">{report.overallScore}<span className="text-base text-slate-400">/100</span></p><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Score conseil</p></div><div className="h-10 w-px bg-slate-200" /><p className="text-xs font-semibold text-slate-600">{report.criticalCount} priorité haute<br /><span className="font-normal text-slate-400">sur 5 piliers</span></p></div>
        </div>
      </section>
      <div className="flex items-center gap-2"><Sparkles size={17} className="text-teal-600" /><div><h2 className="font-bold">Recommandations prioritaires</h2><p className="text-xs text-slate-500">Ouvrez un pilier pour explorer les signaux et les actions.</p></div></div>
      <div className="space-y-3">{report.pillars.map(pillar => <AdvisoryPillarAccordion key={pillar.id} pillar={pillar} open={openPillar === pillar.id} onToggle={() => setOpenPillar(current => current === pillar.id ? 'social' : pillar.id)} />)}</div>
      <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800"><CheckCircle2 size={15} /> Cette vue utilise des données de démonstration : aucune connexion externe n'est requise.</div>
    </div>
  );
}
