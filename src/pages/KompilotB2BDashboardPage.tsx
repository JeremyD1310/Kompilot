import { useMemo, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, ArrowRight, BarChart3, CalendarDays, CheckCircle2, ChevronDown, CircleHelp, FileText, Gauge, Globe2, LayoutDashboard, LogOut, Menu, MessageSquare, Plus, Search, Settings2, Sparkles, Target, Users, X } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Progress } from '@blinkdotnew/ui';
import { useAuth } from '../hooks/useAuth';
import { useDemoMode } from '../context/DemoModeContext';
import { useEstablishment } from '../context/EstablishmentContext';
import { KompilotLogo } from '../components/brand/KompilotLogo';
import { LocalVisibilityScanner } from '../components/geo/LocalVisibilityScanner';

const chartData = [
  { day: 'Lun', visibility: 46, leads: 18 }, { day: 'Mar', visibility: 58, leads: 24 },
  { day: 'Mer', visibility: 52, leads: 20 }, { day: 'Jeu', visibility: 71, leads: 31 },
  { day: 'Ven', visibility: 68, leads: 28 }, { day: 'Sam', visibility: 82, leads: 39 },
  { day: 'Dim', visibility: 78, leads: 35 },
];

const channels = [
  { label: 'LinkedIn', value: 34, color: 'bg-primary' },
  { label: 'SEO local', value: 27, color: 'bg-cyan-500' },
  { label: 'Meta', value: 21, color: 'bg-violet-500' },
  { label: 'GEO / IA', value: 12, color: 'bg-amber-500' },
  { label: 'TikTok', value: 6, color: 'bg-foreground/45' },
];

const navItems = [
  { to: '/command-center', label: "Vue d'ensemble", icon: LayoutDashboard },
  { to: '/geo-command-center', label: 'SEO & GEO', icon: Globe2 },
  { to: '/social', label: 'Réseaux sociaux', icon: Activity },
  { to: '/campaigns', label: 'Campagnes', icon: Target },
  { to: '/marketing-attribution', label: 'Traçabilité', icon: BarChart3 },
] as const;

function getFirstName(displayName?: string | null, email?: string | null) {
  return displayName?.trim().split(/\s+/)[0] || email?.split('@')[0] || 'vous';
}

function B2BSidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const content = (
    <div className="flex h-full w-[min(86vw,16rem)] flex-col border-r border-border bg-sidebar">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
        <Link to="/command-center" onClick={onClose} aria-label="Kompilot accueil"><KompilotLogo variant="full" height={25} textColor="currentColor" /></Link>
        <button onClick={onClose} className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted" aria-label="Fermer le menu"><X size={18} /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-5">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/65">Espace de pilotage</p>
        <nav className="space-y-1" aria-label="Navigation principale">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = window.location.pathname === to || window.location.pathname.startsWith(`${to}/`);
            return <Link key={to} to={to} onClick={onClose} className={`group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-[color,background-color,transform] hover:translate-x-0.5 ${active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-foreground/70 hover:bg-primary/8 hover:text-primary'}`}><Icon size={17} className="shrink-0" /><span>{label}</span>{active && <ChevronDown size={14} className="ml-auto -rotate-90" />}</Link>;
          })}
        </nav>
        <div className="my-6 border-t border-border" />
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/65">Raccourcis</p>
        <div className="space-y-1">
          <Link to="/calendrier" onClick={onClose} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-foreground/70 hover:bg-muted hover:text-foreground"><CalendarDays size={17} /> Calendrier</Link>
          <Link to="/inbox" onClick={onClose} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-foreground/70 hover:bg-muted hover:text-foreground"><MessageSquare size={17} /> Boîte de réception</Link>
          <Link to="/account" onClick={onClose} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-foreground/70 hover:bg-muted hover:text-foreground"><Settings2 size={17} /> Paramètres</Link>
        </div>
      </div>
      <div className="shrink-0 border-t border-border p-3">
        <div className="mb-2 flex items-center gap-3 rounded-xl bg-muted/55 px-3 py-2.5"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{getFirstName(user?.displayName, user?.email).slice(0, 2).toUpperCase()}</div><div className="min-w-0"><p className="truncate text-xs font-bold text-foreground">{getFirstName(user?.displayName, user?.email)}</p><p className="text-[10px] text-muted-foreground">Workspace actif</p></div></div>
        <button onClick={async () => { await logout(); navigate({ to: '/' }); }} className="flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-xs font-semibold text-muted-foreground hover:bg-destructive/8 hover:text-destructive"><LogOut size={15} /> Se déconnecter</button>
      </div>
    </div>
  );
  return <><aside className="hidden h-dvh shrink-0 md:block">{content}</aside>{mobileOpen && <div className="fixed inset-0 z-[120] md:hidden"><button className="absolute inset-0 bg-foreground/25" onClick={onClose} aria-label="Fermer le menu" />{content}</div>}</>;
}

function MetricCard({ icon: Icon, label, value, change, tone = 'primary' }: { icon: typeof Gauge; label: string; value: string; change: string; tone?: 'primary' | 'amber' | 'violet' | 'cyan' }) {
  const toneClass = { primary: 'bg-primary/10 text-primary', amber: 'bg-amber-500/10 text-amber-600', violet: 'bg-violet-500/10 text-violet-600', cyan: 'bg-cyan-500/10 text-cyan-600' }[tone];
  return <Card className="border-border/80 shadow-[var(--shadow-dashboard)] transition-transform hover:-translate-y-0.5"><CardContent className="p-5"><div className="mb-5 flex items-center justify-between"><div className={`flex h-9 w-9 items-center justify-center rounded-xl ${toneClass}`}><Icon size={17} /></div><span className="text-[10px] font-bold text-emerald-600">{change}</span></div><p className="text-2xl font-black tracking-tight text-foreground">{value}</p><p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p></CardContent></Card>;
}

function DateRange({ value, setValue }: { value: string; setValue: (value: string) => void }) {
  return <div className="flex max-w-full gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1 shadow-sm">{['Aujourd’hui', '7 jours', '30 jours', 'Mois en cours', 'Année'].map(option => <button key={option} onClick={() => setValue(option)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${value === option ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>{option}</button>)}</div>;
}

export default function KompilotB2BDashboardPage() {
  const { user } = useAuth();
  const { isDemoActive, demoData } = useDemoMode();
  const { activeEstablishment } = useEstablishment();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [range, setRange] = useState('7 jours');
  const [connected, setConnected] = useState<string[]>(isDemoActive ? ['Google Business', 'LinkedIn'] : []);
  const firstName = getFirstName(user?.displayName, user?.email);
  const company = activeEstablishment?.name || (isDemoActive ? 'Atelier Horizon' : 'votre entreprise');
  const demoLeads = isDemoActive ? demoData.messages.length || 37 : 0;
  const score = isDemoActive ? 78 : 0;
  const posts = isDemoActive ? demoData.posts.length || 12 : 0;
  const channelData = useMemo(() => channels.map(channel => ({ ...channel, value: isDemoActive ? channel.value : 0 })), [isDemoActive]);

  return <div className="flex min-h-dvh bg-background text-foreground">
    <B2BSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    <main className="min-w-0 flex-1 overflow-y-auto">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/92 px-4 backdrop-blur-md sm:px-7"><div className="flex items-center gap-3"><button onClick={() => setMobileOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-border md:hidden" aria-label="Ouvrir le menu"><Menu size={18} /></button><div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex"><Search size={15} /> Rechercher une action, une campagne…</div></div><div className="flex items-center gap-2"><Badge className="hidden border-emerald-200 bg-emerald-50 text-emerald-700 sm:inline-flex"><span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" /> Synchronisé</Badge><Link to="/account" className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{firstName.slice(0, 2).toUpperCase()}</Link></div></header>
      <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-7 lg:px-10 lg:py-9">
        <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">Cockpit marketing</p><h1 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">Bonjour, {firstName}.</h1><p className="mt-2 text-sm text-muted-foreground">Voici la lecture de votre présence digitale pour <span className="font-semibold text-foreground">{company}</span>.</p></div><DateRange value={range} setValue={setRange} /></div>
        <section className="relative mb-8 overflow-hidden rounded-[1.6rem] bg-[hsl(var(--dashboard-hero))] px-6 py-7 text-primary-foreground shadow-[0_22px_55px_-25px_hsl(var(--dashboard-hero)/.7)] sm:px-8 sm:py-9"><div className="relative z-10 max-w-2xl"><div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1.5 text-[11px] font-bold"><Sparkles size={13} /> Performance multi-canal</div><h2 className="max-w-xl text-2xl font-black tracking-[-0.03em] sm:text-3xl">Votre visibilité avance dans la bonne direction.</h2><p className="mt-3 max-w-xl text-sm leading-relaxed text-primary-foreground/75">Kompilot centralise vos contenus, vos signaux SEO/GEO et vos leads pour transformer chaque action marketing en prochaine meilleure action.</p><div className="mt-6 flex flex-wrap gap-3"><Link to="/cockpit" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary-foreground px-4 text-sm font-bold text-primary transition-transform hover:-translate-y-0.5">Créer une action <ArrowRight size={15} /></Link><Link to="/analytics" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary-foreground/25 px-4 text-sm font-bold text-primary-foreground hover:bg-primary-foreground/10">Voir le détail</Link></div></div><div className="absolute -right-14 -top-24 h-72 w-72 rounded-full border-[32px] border-primary-foreground/8" /><div className="absolute -bottom-44 right-24 h-80 w-80 rounded-full border-[44px] border-primary-foreground/6" /></section>
        <section className="mb-8 grid grid-cols-1 gap-4 min-[540px]:grid-cols-2 xl:grid-cols-4"><MetricCard icon={Gauge} label="Visibilité GEO" value={isDemoActive ? `${score}/100` : '—'} change={isDemoActive ? '+14% ce mois' : 'À connecter'} /><MetricCard icon={Users} label="Leads générés" value={isDemoActive ? String(demoLeads) : '—'} change={isDemoActive ? '+18% vs période' : 'À connecter'} tone="cyan" /><MetricCard icon={FileText} label="Publications actives" value={String(posts)} change={isDemoActive ? '+3 cette semaine' : 'À venir'} tone="violet" /><MetricCard icon={MessageSquare} label="Taux d’engagement" value={isDemoActive ? '6,8%' : '—'} change={isDemoActive ? '+1,2 pts' : 'À connecter'} tone="amber" /></section>
        <section className="mb-8"><LocalVisibilityScanner demo={isDemoActive} demoSector="commerce" defaultBusinessName={company !== 'votre entreprise' ? company : ''} defaultCity={isDemoActive ? 'Tours' : ''} defaultActivity={isDemoActive ? 'commerce local' : ''} /><p className="mt-2 text-[11px] text-muted-foreground">En mode démo, les signaux sont simulés pour vous permettre d’explorer le parcours. Activez vos connexions pour passer à une analyse de votre établissement.</p></section>
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]"><Card className="border-border/80 shadow-[var(--shadow-dashboard)]"><CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-border/70 pb-4"><div><CardTitle className="text-base">Activité marketing</CardTitle><p className="mt-1 text-xs text-muted-foreground">Visibilité et leads captés sur les 7 derniers jours</p></div><Badge variant="outline" className="hidden sm:inline-flex">Tous les canaux</Badge></CardHeader><CardContent className="p-4 sm:p-6"><div className="h-[260px] w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} barGap={6}><CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="4 4" /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} /><Tooltip cursor={{ fill: 'hsl(var(--muted) / .5)' }} contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', fontSize: 12 }} /><Bar dataKey="visibility" name="Visibilité" fill="hsl(var(--primary))" radius={[5, 5, 0, 0]} /><Bar dataKey="leads" name="Leads" fill="hsl(var(--chart-3))" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div><div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground"><span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-primary" /> Visibilité</span><span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[hsl(var(--chart-3))]" /> Leads</span></div></CardContent></Card>
          <Card className="border-border/80 shadow-[var(--shadow-dashboard)]"><CardHeader><CardTitle className="text-base">Attribution des canaux</CardTitle><p className="mt-1 text-xs text-muted-foreground">Part estimée des résultats</p></CardHeader><CardContent className="space-y-5">{channelData.map(channel => <div key={channel.label}><div className="mb-2 flex items-center justify-between text-xs"><span className="font-semibold text-foreground">{channel.label}</span><span className="font-bold text-muted-foreground">{channel.value}%</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${channel.color} transition-all duration-700`} style={{ width: `${channel.value}%` }} /></div></div>)}<div className="mt-5 rounded-xl bg-primary/5 p-4"><div className="flex gap-3"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-primary" /><p className="text-xs leading-relaxed text-muted-foreground">{isDemoActive ? 'Votre mix est équilibré : le SEO local et LinkedIn portent la croissance.' : 'Connectez vos canaux pour obtenir une attribution personnalisée.'}</p></div></div></CardContent></Card></section>
        <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3"><Card className="border-border/80 lg:col-span-2"><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="text-base">Prochaines actions</CardTitle><p className="mt-1 text-xs text-muted-foreground">Les 3 leviers qui méritent votre attention</p></div><Link to="/command-center" className="text-xs font-bold text-primary hover:underline">Tout voir</Link></CardHeader><CardContent className="grid gap-3 sm:grid-cols-3">{['Répondre aux avis en attente', 'Publier le post de la semaine', 'Suivre votre visibilité GEO'].map((item, index) => <Link key={item} to={index === 2 ? '/geo-command-center' : index === 1 ? '/calendrier' : '/reviews'} className="group rounded-xl border border-border p-4 transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-sm"><div className="mb-4 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Plus size={15} /></div><p className="text-sm font-bold leading-snug">{item}</p><p className="mt-2 text-[11px] text-muted-foreground group-hover:text-primary">Ouvrir <ArrowRight className="ml-1 inline" size={12} /></p></Link>)}</CardContent></Card><Card className="border-border/80"><CardHeader><CardTitle className="text-base">Canaux connectés</CardTitle><p className="mt-1 text-xs text-muted-foreground">État de vos intégrations</p></CardHeader><CardContent className="space-y-3">{['Google Business', 'LinkedIn', 'Meta', 'TikTok'].map(channel => { const isConnected = connected.includes(channel); return <button key={channel} onClick={() => setConnected(prev => isConnected ? prev.filter(item => item !== channel) : [...prev, channel])} className="flex w-full items-center justify-between rounded-xl border border-border px-3 py-3 text-left transition-colors hover:bg-muted"><span className="text-xs font-semibold">{channel}</span><span className={`text-[10px] font-bold ${isConnected ? 'text-emerald-600' : 'text-muted-foreground'}`}>{isConnected ? 'Connecté' : 'Connecter'}</span></button>; })}</CardContent></Card></section>
      </div>
    </main>
  </div>;
}
