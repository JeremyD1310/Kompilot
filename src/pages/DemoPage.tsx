import { useEffect, useState } from 'react';
import { ArrowRight, Building2, CheckCircle2, Network, Store, UserCircle } from 'lucide-react';
import { Button } from '@blinkdotnew/ui';
import { useNavigate } from '@tanstack/react-router';
import { DemoSafetyNotice } from '@/components/demo/DemoSafetyNotice';
import { useDemoData } from '../context/DemoDataProvider';
import type { DemoProfile } from '../lib/demoProductData';

const profiles: Array<{ id: DemoProfile; label: string; detail: string; icon: typeof Store }> = [
  { id: 'commerce', label: 'Commerce local', detail: 'Avis, fiche Google et contenus locaux', icon: Store },
  { id: 'artisan', label: 'Artisan ou PME', detail: 'Réalisations, demandes et présence locale', icon: UserCircle },
  { id: 'agency', label: 'Agence', detail: 'Clients, validations et rapports', icon: Building2 },
  { id: 'network', label: 'Multi-établissements', detail: 'Cohérence et pilotage consolidé', icon: Network },
];

const journey = [
  ['1', 'Voir la priorité', 'Commencez par l’action la plus utile.'],
  ['2', 'Valider', 'Relisez un contenu, un avis ou un message.'],
  ['3', 'Simuler', 'Testez l’action sans aucun envoi externe.'],
  ['4', 'Mesurer', 'Consultez des indicateurs clairement fictifs.'],
  ['5', 'Décider', 'Identifiez la prochaine étape à réaliser.'],
] as const;

export default function DemoPage() {
  const navigate = useNavigate();
  const { profile, setProfile } = useDemoData();
  const [demoInfoOpen, setDemoInfoOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDemoInfoOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 pb-16 text-slate-950">
      <header className="sticky top-0 z-40 border-b border-teal-800 bg-teal-700 text-white shadow-sm">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <button type="button" onClick={() => setDemoInfoOpen(true)} className="min-h-11 rounded-xl px-2 text-left text-sm font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            Kompilot <span className="ml-1 rounded-full bg-white/15 px-2 py-1 text-[10px] uppercase tracking-wide">Démo</span>
          </button>
          <Button onClick={() => navigate({ to: '/signup' })} className="min-h-11 bg-white px-4 text-xs font-bold text-teal-800 hover:bg-slate-100">Créer mon espace</Button>
        </div>
      </header>

      {demoInfoOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40" role="presentation" onMouseDown={event => event.target === event.currentTarget && setDemoInfoOpen(false)}>
          <section role="dialog" aria-modal="true" aria-labelledby="demo-info-title" className="absolute inset-x-3 top-20 mx-auto max-w-xl rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div><h2 id="demo-info-title" className="text-lg font-black">Une démonstration sans risque</h2><p className="mt-2 text-sm leading-6 text-slate-600">Toutes les informations sont fictives et restent dans ce navigateur. Aucun compte, service externe, paiement ou donnée client n’est utilisé.</p></div>
              <button type="button" onClick={() => setDemoInfoOpen(false)} aria-label="Fermer les informations de démonstration" className="grid min-h-11 min-w-11 place-items-center rounded-xl text-xl text-slate-600 hover:bg-slate-100">×</button>
            </div>
          </section>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <DemoSafetyNotice />
        <section className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[.16em] text-teal-700">Visite guidée · environ 3 minutes</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Découvrez Kompilot simplement</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">Choisissez le profil qui vous ressemble, puis explorez un seul cockpit. Chaque action est simulée et explicitement identifiée.</p>
        </section>

        <section className="mt-10" aria-labelledby="demo-profile-title">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-teal-700">Étape 1</p><h2 id="demo-profile-title" className="mt-1 text-xl font-black">Choisissez votre profil</h2></div><p className="text-xs text-slate-500">Vous pourrez le changer dans le cockpit.</p></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {profiles.map(item => {
              const Icon = item.icon;
              const selected = profile === item.id;
              return <button key={item.id} type="button" onClick={() => setProfile(item.id)} aria-pressed={selected} className={`min-h-32 rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-teal-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${selected ? 'border-teal-600 ring-2 ring-teal-100' : 'border-slate-200'}`}><Icon size={21} className="text-teal-700" /><strong className="mt-4 block text-sm">{item.label}</strong><span className="mt-1 block text-xs leading-5 text-slate-500">{item.detail}</span></button>;
            })}
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="demo-journey-title">
          <p className="text-xs font-bold uppercase tracking-wide text-teal-700">Étape 2</p>
          <h2 id="demo-journey-title" className="mt-1 text-xl font-black">Suivez un parcours unique</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-5">
            {journey.map(([number, title, detail]) => <article key={number} className="rounded-2xl bg-slate-50 p-4"><span className="grid h-8 w-8 place-items-center rounded-full bg-teal-700 text-xs font-black text-white">{number}</span><h3 className="mt-3 text-sm font-black">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p></article>)}
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600"><CheckCircle2 size={16} className="text-teal-700" /> Aucun compte requis · aucune action réelle</p>
            <Button size="lg" data-testid="demo-enter-workspace" onClick={() => navigate({ to: '/demo/workspace' })} className="min-h-12 gap-2 bg-teal-700 px-6 font-bold text-white hover:bg-teal-800">Explorer le cockpit <ArrowRight size={16} /></Button>
          </div>
        </section>
      </div>
    </main>
  );
}
