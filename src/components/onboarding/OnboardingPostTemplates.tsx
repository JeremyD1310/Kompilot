import { CalendarPlus, Check, Copy, Sparkles } from 'lucide-react';
import { Button, Card, CardContent } from '@blinkdotnew/ui';

const TEMPLATES = [
  { step: '01', title: 'Présenter votre activité', text: 'Bienvenue chez nous ! Découvrez notre savoir-faire, nos valeurs et ce qui rend notre établissement unique dans votre ville.' },
  { step: '02', title: 'Créer la preuve sociale', text: 'Nos clients parlent de nous : merci pour votre confiance. Découvrez leurs retours et venez vivre l’expérience à votre tour.' },
  { step: '03', title: 'Mettre en avant une offre', text: 'Une occasion de vous faire plaisir : profitez de notre offre du moment et réservez directement votre créneau.' },
  { step: '04', title: 'Fidéliser la communauté', text: 'Dans les coulisses de notre établissement : une équipe engagée, des gestes précis et la même exigence chaque jour.' },
];

export function OnboardingPostTemplates({ sector }: { sector?: string }) {
  const applyTemplate = (text: string) => {
    const enriched = sector ? `${text}\n\nSecteur : ${sector}` : text;
    window.location.assign(`/calendrier?prefill=${encodeURIComponent(enriched)}&source=onboarding_template`);
  };

  return <section className="space-y-4 rounded-2xl border border-teal-200 bg-teal-50/40 p-5 sm:p-6">
    <div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white"><Sparkles size={18} /></div><div><h2 className="text-base font-bold text-slate-900">Vos premiers modèles de publication</h2><p className="mt-1 text-xs leading-relaxed text-slate-600">Commencez avec une trame adaptée à chaque étape de lancement, puis personnalisez-la dans le calendrier.</p></div></div>
    <div className="grid gap-3 sm:grid-cols-2">{TEMPLATES.map(template => <Card key={template.step} className="border-slate-200 bg-white shadow-sm"><CardContent className="p-4"><div className="mb-3 flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-[10px] font-black text-teal-700">{template.step}</span><h3 className="text-sm font-bold text-slate-800">{template.title}</h3></div><p className="min-h-[58px] text-xs leading-relaxed text-slate-600">{template.text}</p><div className="mt-3 flex gap-2"><Button size="sm" onClick={() => applyTemplate(template.text)} className="h-8 gap-1.5 text-[11px]"><CalendarPlus size={12} /> Planifier</Button><Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(template.text); }} className="h-8 gap-1.5 text-[11px]"><Copy size={12} /> Copier</Button></div></CardContent></Card>)}</div>
    <p className="flex items-center gap-1.5 text-[11px] text-teal-700"><Check size={13} /> Chaque modèle reste modifiable avant publication.</p>
  </section>;
}
