import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronRight, Globe2, Megaphone, Search, Sparkles, Target, Users, X } from 'lucide-react';
import { LinkedinIcon } from '../components/icons/SocialIcons';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Input, Progress } from '@blinkdotnew/ui';
import { useAuth } from '../hooks/useAuth';
import { useDemoMode } from '../context/DemoModeContext';
import { KompilotLogo } from '../components/brand/KompilotLogo';

const steps = ['Profil', 'Canaux', 'SEO & GEO', 'Activation'];
const sectors = ['Commerce', 'Restauration', 'Services B2B', 'Santé', 'Immobilier', 'Autre'];
const sizes = ['Indépendant', '2–10 personnes', '11–50 personnes', '51+ personnes'];
const objectives = ['Acquisition B2B', 'Notoriété de marque', 'Leads SEO / GEO', 'Réengagement client'];
type ChannelState = 'pending' | 'connected';
type Channel = { id: string; label: string; detail: string; icon: ComponentType<{ size?: number | string; className?: string }>; state: ChannelState };

const initialChannels: Channel[] = [
  { id: 'ga4', label: 'Google Analytics 4', detail: 'Mesure du trafic et des conversions', icon: Globe2, state: 'pending' },
  { id: 'meta', label: 'Meta Graph API', detail: 'Facebook et Instagram', icon: Megaphone, state: 'pending' },
  { id: 'linkedin', label: 'LinkedIn API', detail: 'Page et campagnes B2B', icon: LinkedinIcon, state: 'pending' },
  { id: 'tiktok', label: 'TikTok API', detail: 'Portée et engagement vidéo', icon: Sparkles, state: 'pending' },
];

const ONBOARDING_KEY = 'kompilot_onboarding_b2b';
type OnboardingDraft = { step: 0 | 1 | 2 | 3; sector: string; size: string; objective: string; channels: Channel[]; keywords: string[] };

function readDraft(isDemoActive: boolean): OnboardingDraft {
  const fallback: OnboardingDraft = { step: 0, sector: '', size: '', objective: '', channels: initialChannels.map(item => ({ ...item })), keywords: isDemoActive ? ['marketing local', 'agence digitale', 'visibilité IA'] : [] };
  try {
    const stored = localStorage.getItem(ONBOARDING_KEY);
    if (!stored) return fallback;
    const parsed = JSON.parse(stored) as Partial<OnboardingDraft>;
    return { ...fallback, ...parsed, channels: Array.isArray(parsed.channels) ? parsed.channels : fallback.channels, keywords: Array.isArray(parsed.keywords) ? parsed.keywords : fallback.keywords };
  } catch { return fallback; }
}

export default function KompilotB2BOnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDemoActive } = useDemoMode();
  const draft = useMemo(() => readDraft(isDemoActive), [isDemoActive]);
  const [step, setStep] = useState<0 | 1 | 2 | 3>(draft.step);
  const [sector, setSector] = useState(draft.sector);
  const [size, setSize] = useState(draft.size);
  const [objective, setObjective] = useState(draft.objective);
  const [channels, setChannels] = useState<Channel[]>(draft.channels);
  const [keywords, setKeywords] = useState<string[]>(draft.keywords);
  const [keywordInput, setKeywordInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(ONBOARDING_KEY, JSON.stringify({ step, sector, size, objective, channels, keywords } satisfies OnboardingDraft)); } catch { /* storage can be unavailable */ }
  }, [step, sector, size, objective, channels, keywords]);

  const canContinue = step === 0 ? Boolean(sector && size && objective) : step === 2 ? keywords.length > 0 : true;
  const progress = ((step + 1) / steps.length) * 100;
  const firstName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'vous';
  const connectedCount = channels.filter(channel => channel.state === 'connected').length;
  const summary = useMemo(() => ({ sector: sector || 'Commerce', size: size || 'Indépendant', objective: objective || 'Leads SEO / GEO', keywords }), [sector, size, objective, keywords]);

  const toggleChannel = (id: string) => setChannels(current => current.map(channel => channel.id === id ? { ...channel, state: channel.state === 'connected' ? 'pending' : 'connected' } : channel));
  const addKeyword = () => { const value = keywordInput.trim(); if (value && !keywords.includes(value)) setKeywords(current => [...current, value]); setKeywordInput(''); };
  const removeKeyword = (keyword: string) => setKeywords(current => current.filter(item => item !== keyword));
  const activate = async () => { setSaving(true); localStorage.setItem('kompilot_onboarding_b2b', JSON.stringify({ completedAt: Date.now(), ...summary, connectedChannels: channels.filter(channel => channel.state === 'connected').map(channel => channel.id) })); await new Promise(resolve => setTimeout(resolve, 500)); navigate({ to: '/command-center' }); };

  return <div className="min-h-dvh bg-background text-foreground"><header className="flex h-16 items-center justify-between border-b border-border px-5 sm:px-8"><Link to="/" aria-label="Kompilot accueil"><KompilotLogo variant="full" height={25} textColor="currentColor" /></Link><div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="hidden sm:inline">Configuration de votre workspace</span><button onClick={() => navigate({ to: isDemoActive ? '/demo/dashboard' : '/command-center' })} className="flex items-center gap-1 font-semibold hover:text-foreground"><X size={14} /> Quitter</button></div></header>
    <main className="mx-auto grid min-h-[calc(100dvh-4rem)] w-full max-w-6xl grid-cols-1 gap-8 px-4 py-6 sm:px-8 lg:grid-cols-[220px_minmax(0,680px)] lg:gap-16 lg:py-12"><aside className="lg:pt-8"><p className="mb-6 text-xs font-bold uppercase tracking-[0.16em] text-primary">Bienvenue {firstName}</p><div className="flex gap-2 overflow-x-auto lg:block lg:space-y-5">{steps.map((label, index) => <div key={label} className={`flex shrink-0 items-center gap-3 text-sm font-semibold lg:gap-3 ${index === step ? 'text-foreground' : index < step ? 'text-primary' : 'text-muted-foreground/60'}`}><span className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs ${index < step ? 'border-primary bg-primary text-primary-foreground' : index === step ? 'border-primary bg-primary/10 text-primary' : 'border-border'}`}>{index < step ? <Check size={14} /> : index + 1}</span><span>{label}</span></div>)}</div><div className="mt-10 hidden rounded-2xl border border-border bg-card p-4 lg:block"><p className="text-xs font-bold text-foreground">Environ 3 minutes</p><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">Vous pouvez ignorer les connexions et les compléter plus tard.</p></div></aside>
      <section className="min-w-0"><div className="mb-7"><Progress value={progress} className="mb-5 h-1.5" /><p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Étape {step + 1} sur 4</p></div>
        {step === 0 && <Card className="border-border/80 shadow-[var(--shadow-dashboard)]"><CardHeader><CardTitle className="text-2xl tracking-tight sm:text-3xl">Parlons de votre entreprise.</CardTitle><p className="text-sm leading-relaxed text-muted-foreground">Nous allons calibrer votre cockpit sur votre contexte métier et votre objectif prioritaire.</p></CardHeader><CardContent className="space-y-7"><ChoiceGroup label="Votre secteur" items={sectors} value={sector} onChange={setSector} /><ChoiceGroup label="Taille de l’entreprise" items={sizes} value={size} onChange={setSize} /><ChoiceGroup label="Votre objectif principal" items={objectives} value={objective} onChange={setObjective} /></CardContent></Card>}
        {step === 1 && <Card className="border-border/80 shadow-[var(--shadow-dashboard)]"><CardHeader><CardTitle className="text-2xl tracking-tight sm:text-3xl">Branchez vos canaux.</CardTitle><p className="text-sm leading-relaxed text-muted-foreground">Connectez maintenant vos sources clés ou passez cette étape. Aucun secret n’est stocké dans votre navigateur.</p></CardHeader><CardContent className="space-y-3">{channels.map(({ id, label, detail, icon: Icon, state }) => <div key={id} className="flex items-center gap-4 rounded-2xl border border-border p-4 transition-colors hover:bg-muted/40"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon size={18} /></div><div className="min-w-0 flex-1"><p className="text-sm font-bold">{label}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div><button onClick={() => toggleChannel(id)} className={`min-h-10 rounded-xl px-3 text-xs font-bold transition-colors ${state === 'connected' ? 'bg-emerald-50 text-emerald-700' : 'border border-border text-muted-foreground hover:border-primary/40 hover:text-primary'}`}>{state === 'connected' ? 'Connecté' : 'Connecter'}</button></div>)}<div className="pt-4 text-center text-xs text-muted-foreground">{connectedCount} canal{connectedCount > 1 ? 'x' : ''} connecté{connectedCount > 1 ? 's' : ''} · Vous pourrez compléter cela dans Paramètres.</div></CardContent></Card>}
        {step === 2 && <Card className="border-border/80 shadow-[var(--shadow-dashboard)]"><CardHeader><CardTitle className="text-2xl tracking-tight sm:text-3xl">Quels signaux devons-nous suivre ?</CardTitle><p className="text-sm leading-relaxed text-muted-foreground">Ajoutez vos mots-clés stratégiques et vos requêtes cibles dans les moteurs de recherche et les assistants IA.</p></CardHeader><CardContent><div className="flex gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} /><Input value={keywordInput} onChange={event => setKeywordInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addKeyword(); } }} placeholder="ex. logiciel marketing local" className="h-11 rounded-xl pl-9" /></div><Button onClick={addKeyword} className="h-11 rounded-xl">Ajouter</Button></div><div className="mt-5 flex min-h-24 flex-wrap content-start gap-2 rounded-2xl border border-dashed border-border p-4">{keywords.length === 0 ? <p className="w-full self-center text-center text-xs text-muted-foreground">Ajoutez au moins une requête pour personnaliser votre premier rapport.</p> : keywords.map(keyword => <button key={keyword} onClick={() => removeKeyword(keyword)} className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/15">{keyword}<X size={12} /></button>)}</div><div className="mt-5 rounded-2xl bg-primary/5 p-4"><div className="flex gap-3"><Sparkles size={16} className="mt-0.5 shrink-0 text-primary" /><p className="text-xs leading-relaxed text-muted-foreground">Suggestion : ajoutez votre nom de marque, votre ville et une intention forte comme « meilleur prestataire ».</p></div></div></CardContent></Card>}
        {step === 3 && <Card className="border-border/80 shadow-[var(--shadow-dashboard)]"><CardHeader><CardTitle className="text-2xl tracking-tight sm:text-3xl">Votre cockpit est prêt.</CardTitle><p className="text-sm leading-relaxed text-muted-foreground">Voici les paramètres qui serviront à initialiser votre première vue de performance.</p></CardHeader><CardContent className="space-y-5"><SummaryRow icon={Users} label="Profil" value={`${summary.sector} · ${summary.size}`} /><SummaryRow icon={Target} label="Objectif" value={summary.objective} /><SummaryRow icon={Search} label="Requêtes suivies" value={`${summary.keywords.length} mots-clés`} /><div className="rounded-2xl bg-primary p-5 text-primary-foreground"><div className="flex items-start gap-3"><CheckCircle2 size={19} className="mt-0.5 shrink-0" /><div><p className="text-sm font-bold">Rapport de mise en route inclus</p><p className="mt-1 text-xs leading-relaxed text-primary-foreground/75">Vous retrouverez une première lecture de visibilité, d’activité et d’attribution dès l’activation.</p></div></div></div><Button onClick={() => void activate()} disabled={saving} className="h-12 w-full rounded-xl text-sm font-bold">{saving ? 'Initialisation…' : 'Activer mon dashboard'} <ArrowRight size={16} /></Button></CardContent></Card>}
        <div className="mt-7 flex items-center justify-between gap-3"><Button variant="ghost" onClick={() => setStep(current => (current === 0 ? 0 : (current - 1) as 0 | 1 | 2 | 3))} disabled={step === 0} className="gap-2"><ArrowLeft size={15} /> Retour</Button>{step < 3 && <Button onClick={() => setStep(current => (current + 1) as 0 | 1 | 2 | 3)} disabled={!canContinue} className="gap-2">Continuer <ArrowRight size={15} /></Button>}</div>
      </section>
    </main></div>;
}

function ChoiceGroup({ label, items, value, onChange }: { label: string; items: string[]; value: string; onChange: (value: string) => void }) {
  return <div><p className="mb-3 text-sm font-bold">{label}</p><div className="grid gap-2 sm:grid-cols-2">{items.map(item => <button key={item} onClick={() => onChange(item)} className={`min-h-12 rounded-xl border px-4 text-left text-sm font-semibold transition-[border-color,background-color,transform] hover:-translate-y-0.5 ${value === item ? 'border-primary bg-primary/8 text-primary' : 'border-border bg-card text-foreground hover:border-primary/35'}`}>{item}</button>)}</div></div>;
}

function SummaryRow({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return <div className="flex items-center gap-3 rounded-xl border border-border p-3"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon size={15} /></div><div><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div></div>;
}
