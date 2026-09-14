import { useState } from 'react';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { Menu, RotateCcw, ShieldCheck, X } from 'lucide-react';
import { DemoActionModal } from '@/components/demo/DemoActionModal';
import { DemoMobileNav } from '@/components/demo/DemoMobileNav';
import { DemoMoreMenu } from '@/components/demo/DemoMoreMenu';
import { DemoSafetyNotice } from '@/components/demo/DemoSafetyNotice';
import { DemoWorkspaceActions } from '@/components/demo/DemoWorkspaceActions';
import { useDemoData } from '../context/DemoDataProvider';
import { PROFILE_META, type DemoProfile } from '../lib/demoProductData';

const NAV = [
  ['Dashboard', '/demo/workspace'], ['À valider', '/demo/workspace/approvals'], ['Calendrier', '/demo/workspace/calendar'],
  ['Présence locale', '/demo/workspace/presence'], ['Avis', '/demo/workspace/reviews'], ['Studio de contenu', '/demo/workspace/content'],
  ['Messages', '/demo/workspace/messages'], ['Campagnes', '/demo/workspace/campaigns'], ['Résultats', '/demo/workspace/results'],
  ['Clients / établissements', '/demo/workspace/organization'], ['Paramètres', '/demo/workspace/settings'],
] as const;

function titleForPath(path: string) {
  const match = NAV.find(([, route]) => route === path);
  return match?.[0] ?? 'Bonjour, voici votre cockpit';
}

export default function DemoWorkspacePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, data, setProfile, resetDemo, updateApproval, simulateAction, lastAction } = useDemoData();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [action, setAction] = useState<string | null>(null);
  const [draft, setDraft] = useState('Bonjour, merci pour votre retour. Votre avis nous aide à progresser.');
  const currentPath = location.pathname;
  const title = titleForPath(currentPath);

  const openAction = (nextAction: string) => {
    setAction(nextAction);
    setDraft(nextAction === 'avis' ? 'Bonjour, merci pour votre retour. Votre avis nous aide à progresser.' : '');
  };
  const confirmAction = () => {
    if (action === 'avis') simulateAction('réponse à un avis validée localement');
    else if (action === 'post') simulateAction('brouillon créé et validé localement');
    else simulateAction(`${action ?? 'action'} confirmée localement`);
    setAction(null);
  };

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900 pb-20 lg:pb-0">
      <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
        <div className="flex items-center gap-3"><button type="button" onClick={() => setMobileMenuOpen(true)} className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" aria-label="Ouvrir le menu"><Menu size={20} /></button><Link to="/demo" className="text-lg font-black tracking-tight text-teal-700">Kompilot</Link><span className="hidden rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-800 sm:inline-flex">Données simulées</span></div>
        <div className="flex items-center gap-2"><button type="button" onClick={resetDemo} className="hidden items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 sm:inline-flex"><RotateCcw size={13} /> Réinitialiser</button><Link to="/signup" className="hidden rounded-lg bg-teal-700 px-3 py-2 text-xs font-bold text-white hover:bg-teal-800 sm:inline-flex">Créer mon espace</Link><button type="button" onClick={() => navigate({ to: '/demo' })} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">Quitter</button></div>
      </header>
      <div className="mx-auto flex max-w-[1500px]">
        <aside className={`${mobileMenuOpen ? 'fixed inset-y-0 left-0 z-50 flex' : 'hidden'} w-72 shrink-0 flex-col border-r border-slate-200 bg-white p-4 lg:sticky lg:top-16 lg:flex lg:h-[calc(100dvh-4rem)]`}>
          <div className="mb-4 flex items-center justify-between lg:hidden"><strong>Navigation</strong><button type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Fermer"><X size={18} /></button></div>
          <div className="mb-4 rounded-xl border border-teal-100 bg-teal-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-teal-700">Profil sélectionné</p><select aria-label="Choisir un profil" value={profile} onChange={event => setProfile(event.target.value as DemoProfile)} className="mt-2 min-h-10 w-full rounded-lg border border-teal-200 bg-white px-2 text-sm font-semibold"><option value="commerce">Commerce local</option><option value="artisan">Artisan ou PME</option><option value="agency">Agence</option><option value="network">Multi-établissements</option></select></div>
          <nav aria-label="Navigation de démonstration" className="min-h-0 flex-1 space-y-1 overflow-y-auto">{NAV.map(([label, path]) => <Link key={path} to={path} onClick={() => setMobileMenuOpen(false)} className={`flex items-center rounded-xl px-3 py-2.5 text-sm font-semibold transition ${currentPath === path ? 'bg-teal-100 text-teal-800' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'}`}>{label}</Link>)}</nav>
          <div className="mt-4 border-t border-slate-200 pt-4"><button type="button" onClick={() => { resetDemo(); setMobileMenuOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 sm:hidden"><RotateCcw size={15} /> Réinitialiser</button><Link to="/pricing" className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"><ShieldCheck size={15} /> Voir les offres</Link></div>
        </aside>
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8"><div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-slate-500"><span>Démo locale</span><span>·</span><span>{data.establishment}</span><span>·</span><span>{data.city}</span>{lastAction && <span className="ml-auto rounded-full bg-emerald-100 px-2 py-1 font-semibold text-emerald-800">{lastAction}</span>}</div><div className="mb-6"><DemoSafetyNotice /><h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{title}</h1><p className="mt-1 text-sm text-slate-500">{PROFILE_META[profile].description} Aucun service externe n’est appelé.</p></div>{currentPath === '/demo/workspace' ? <DemoWorkspaceActions data={data} onAction={openAction} onNavigate={path => navigate({ to: path })} onReset={resetDemo} onApprovalChange={updateApproval} /> : <section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold">{title}</h2><p className="mt-1 text-sm text-slate-500">Explorez ce parcours fictif sans écriture de production.</p></div><button type="button" onClick={() => openAction('nouvelle action')} className="min-h-11 rounded-xl bg-teal-700 px-4 py-2 text-sm font-bold text-white hover:bg-teal-800">Créer une simulation</button></div><div className="grid gap-3 md:grid-cols-2">{data.notifications.map(item => <button type="button" key={item} onClick={() => simulateAction(item)} className="rounded-xl border border-slate-200 p-4 text-left text-sm font-semibold hover:border-teal-300 hover:bg-teal-50">{item}<span className="mt-2 block text-xs font-normal text-slate-500">Cliquez pour simuler une action locale.</span></button>)}</div>{currentPath.endsWith('/organization') && <div className="mt-5 grid gap-3 md:grid-cols-3">{data.clients.map(client => <button type="button" key={client.id} onClick={() => openAction(`client:${client.name}`)} className="rounded-xl border border-slate-200 p-4 text-left hover:border-teal-300 hover:bg-teal-50"><strong>{client.name}</strong><p className="text-xs text-slate-500">{client.city}</p><p className="mt-4 text-2xl font-bold text-teal-700">{client.score}/100</p></button>)}</div>}</section>}<footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5 text-xs text-slate-500"><span>Simulation locale · Aucun email, SMS, publication ou paiement réel</span><Link to="/signup" className="font-bold text-teal-700 hover:underline">Demander une démonstration</Link></footer></main>
      </div>
      <DemoMobileNav currentPath={currentPath} onMore={() => setMoreOpen(true)} /><DemoMoreMenu open={moreOpen} onClose={() => setMoreOpen(false)} currentPath={currentPath} onReset={resetDemo} /><DemoActionModal action={action} draft={draft} onDraftChange={setDraft} onClose={() => setAction(null)} onConfirm={confirmAction} />
    </div>
  );
}
