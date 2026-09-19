import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Compass, LineChart, Megaphone, ShieldCheck } from 'lucide-react';
import { Button } from '@blinkdotnew/ui';
import { useNavigate } from '@tanstack/react-router';

import { saveDemoSession } from '../lib/demoAccount';

const STORAGE_KEY = 'kompilot_b2b_demo_onboarding_v1';
type DemoProfile = 'commerce' | 'artisan' | 'agency' | 'network';
interface OnboardingState { step: number; company: string; profile: DemoProfile; goals: string[]; channels: string[]; completed: boolean; }
const INITIAL: OnboardingState = { step: 0, company: 'Mon entreprise', profile: 'commerce', goals: [], channels: [], completed: false };
const steps = [
  { title: 'Votre activité', description: 'Un aperçu adapté à votre quotidien.', icon: Compass },
  { title: 'Votre priorité', description: 'Choisissez ce que vous voulez piloter.', icon: LineChart },
  { title: 'Vos canaux', description: 'Sélectionnez les points de contact à réunir.', icon: Megaphone },
  { title: 'Votre cockpit', description: 'Tout est prêt pour explorer vos résultats.', icon: ShieldCheck },
];
const profiles: { id: DemoProfile; label: string; detail: string }[] = [
  { id: 'commerce', label: 'Commerce local', detail: 'Une boutique ou un établissement' },
  { id: 'artisan', label: 'Indépendant / PME', detail: 'Une activité de service ou artisanale' },
  { id: 'agency', label: 'Agence / freelance', detail: 'Plusieurs clients à accompagner' },
  { id: 'network', label: 'Multi-établissements', detail: 'Un réseau à consolider' },
];
const goals = ['Générer plus de demandes', 'Gagner du temps', 'Améliorer ma visibilité', 'Prouver mon ROI'];
const channels = ['Google Business', 'Instagram', 'Facebook', 'Site web'];

export default function DemoOnboardingPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<OnboardingState>(() => { try { const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<OnboardingState>; return { ...INITIAL, ...stored, company: stored.company?.trim() || INITIAL.company }; } catch { return INITIAL; } });
  const current = steps[state.step];
  const Icon = current.icon;
  const canContinue = state.step === 0 ? state.company.trim().length > 1 : state.step === 1 ? state.goals.length > 0 : state.step === 2 ? state.channels.length > 0 : true;

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }, [state]);
  const update = (patch: Partial<OnboardingState>) => setState(previous => ({ ...previous, ...patch }));
  const toggle = (key: 'goals' | 'channels', value: string) => update({ [key]: state[key].includes(value) ? state[key].filter(item => item !== value) : [...state[key], value] });
  const finish = () => {
    const completedState = { ...state, step: steps.length - 1, completed: true };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(completedState));
    saveDemoSession();
    sessionStorage.setItem('kompilot_demo_active_session', 'true');
    localStorage.setItem('kompilot_switcher_unlocked', '1');
    localStorage.setItem('kompilot_demo_sector', state.profile);
    navigate({ to: '/demo/workspace' });
  };
  const progress = useMemo(() => `${((state.step + 1) / steps.length) * 100}%`, [state.step]);

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex items-center justify-between gap-4"><button type="button" onClick={() => navigate({ to: '/demo' })} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-bold text-muted-foreground hover:bg-secondary hover:text-foreground"><ArrowLeft size={16} /> Retour à la démo</button><span className="rounded-full bg-primary/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-primary">Démo locale</span></header>
        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-8">
          <div className="mb-8"><div className="mb-3 flex items-center justify-between text-xs font-bold text-muted-foreground"><span>Étape {state.step + 1} sur {steps.length}</span><span>{Math.round(((state.step + 1) / steps.length) * 100)} %</span></div><div className="h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: progress }} /></div></div>
          <div className="mb-8 flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon size={21} /></span><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Construisons votre aperçu</p><h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{current.title}</h1><p className="mt-1 text-sm text-muted-foreground">{current.description}</p></div></div>

          {state.step === 0 && <div className="space-y-5"><label className="block text-sm font-bold">Nom de votre entreprise<input value={state.company} onChange={event => update({ company: event.target.value })} placeholder="Ex. Atelier Martin" className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-3 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" autoFocus /></label><div className="grid gap-3 sm:grid-cols-2">{profiles.map(profile => <button key={profile.id} type="button" onClick={() => update({ profile: profile.id })} className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${state.profile === profile.id ? 'border-primary bg-primary/5 ring-2 ring-primary/15' : 'border-border bg-background hover:border-primary/40'}`}><span className="text-sm font-black">{profile.label}</span><span className="mt-1 block text-xs text-muted-foreground">{profile.detail}</span></button>)}</div></div>}
          {state.step === 1 && <ChoiceGrid title="Votre objectif principal" items={goals} values={state.goals} onToggle={value => toggle('goals', value)} single />}
          {state.step === 2 && <ChoiceGrid title="Les canaux à réunir" items={channels} values={state.channels} onToggle={value => toggle('channels', value)} />}
          {state.step === 3 && <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5"><div className="flex items-start gap-3"><Check className="mt-0.5 text-primary" size={18} /><div><h2 className="font-black">Votre cockpit est prêt</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Vous allez découvrir un tableau de bord pré-rempli pour {state.company || 'votre entreprise'}, avec des métriques d’acquisition, de conversion et d’attribution. Rien n’est envoyé et aucune connexion externe n’est utilisée.</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><Summary label="Objectif" value={state.goals[0] ?? 'Pilotage global'} /><Summary label="Canaux" value={`${state.channels.length} sélectionnés`} /><Summary label="Profil" value={profiles.find(item => item.id === state.profile)?.label ?? 'Entreprise'} /></div></div>}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-between"><Button variant="outline" className="bg-background" disabled={state.step === 0} onClick={() => update({ step: state.step - 1 })}>Précédent</Button>{state.step < steps.length - 1 ? <Button type="button" data-testid="onboarding-continue" disabled={!canContinue} onClick={() => update({ step: state.step + 1 })} className="gap-2">Continuer <ArrowRight size={15} /></Button> : <Button type="button" data-testid="onboarding-finish" onClick={finish} className="gap-2">Ouvrir mon cockpit <ArrowRight size={15} /></Button>}</div>
        </section>
        <p className="mt-5 text-center text-xs text-muted-foreground">Votre progression est sauvegardée dans ce navigateur et peut être reprise à tout moment.</p>
      </div>
    </main>
  );
}

function ChoiceGrid({ title, items, values, onToggle, single = false }: { title: string; items: string[]; values: string[]; onToggle: (value: string) => void; single?: boolean }) {
  return <div><h2 className="mb-4 text-sm font-bold">{title}</h2><div className="grid gap-3 sm:grid-cols-2">{items.map(item => <button key={item} type="button" onClick={() => onToggle(item)} aria-pressed={values.includes(item)} className={`flex min-h-16 items-center justify-between rounded-2xl border p-4 text-left text-sm font-bold transition hover:-translate-y-0.5 ${values.includes(item) ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/15' : 'border-border bg-background hover:border-primary/40'}`}><span>{item}</span>{values.includes(item) && <Check size={16} />}</button>)}</div>{single && <p className="mt-3 text-xs text-muted-foreground">Vous pourrez ajuster cet objectif plus tard.</p>}</div>;
}

function Summary({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-background p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 truncate text-xs font-black text-foreground">{value}</p></div>; }
