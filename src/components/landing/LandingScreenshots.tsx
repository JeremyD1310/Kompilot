import {
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Eye,
  LayoutDashboard,
  MessageCircle,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

type PreviewVariant = 'dashboard' | 'inbox' | 'analytics';

type ScreenshotCard = {
  title: string;
  caption: string;
  icon: typeof LayoutDashboard;
  tone: 'teal' | 'violet' | 'amber';
  variant: PreviewVariant;
};

const SCREENSHOTS: ScreenshotCard[] = [
  {
    title: 'Le cockpit en un regard',
    caption: 'Pilotage des signaux locaux et des priorités de la semaine.',
    icon: LayoutDashboard,
    tone: 'teal',
    variant: 'dashboard',
  },
  {
    title: 'Une inbox, toutes vos réponses',
    caption: 'Centralisez vos avis, messages et demandes sans changer d’outil.',
    icon: MessageCircle,
    tone: 'violet',
    variant: 'inbox',
  },
  {
    title: 'Des décisions lisibles',
    caption: 'Transformez vos données de visibilité en prochaines actions concrètes.',
    icon: BarChart3,
    tone: 'amber',
    variant: 'analytics',
  },
];

const STAT_CARDS = [
  { label: 'Score local', value: '74', change: '+12%', color: 'text-teal-300' },
  { label: 'Avis à traiter', value: '08', change: '4 nouveaux', color: 'text-amber-300' },
  { label: 'Portée mensuelle', value: '12,4K', change: '+18,6%', color: 'text-violet-300' },
];

function BrowserChrome() {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-800/70 px-3 py-2.5 sm:px-4">
      <div className="flex shrink-0 items-center gap-1.5" aria-hidden="true">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
      </div>
      <div className="min-w-0 rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 text-center sm:px-3">
        <span className="block truncate font-mono text-[9px] text-slate-400 sm:text-[10px]">app.kompilot.io/dashboard</span>
      </div>
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-400/15 text-teal-300">
        <ZapMark />
      </div>
    </div>
  );
}

function ZapMark() {
  return <Sparkles size={10} aria-hidden="true" />;
}

function DashboardPreview({ variant }: { variant: PreviewVariant }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-950/90 p-2 shadow-[0_24px_70px_-28px_rgba(0,0,0,.9)] backdrop-blur-xl transition-transform duration-500 group-hover:scale-[1.015]">
      <BrowserChrome />
      <div className="space-y-3 rounded-b-xl bg-slate-900/95 p-3 sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[9px] font-semibold uppercase tracking-[0.16em] text-teal-300">Kompilot cockpit</p>
            <p className="mt-1 truncate text-xs font-bold text-slate-100">Bonjour, Le Petit Bistro</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[8px] font-semibold text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> En ligne
          </div>
        </div>

        {variant === 'dashboard' && <DashboardPanel />}
        {variant === 'inbox' && <InboxPanel />}
        {variant === 'analytics' && <AnalyticsPanel />}
      </div>
    </div>
  );
}

function DashboardPanel() {
  return (
    <>
      <div className="grid grid-cols-3 gap-1.5">
        {STAT_CARDS.map((stat) => (
          <div key={stat.label} className="min-w-0 rounded-lg border border-slate-800 bg-slate-950/70 p-2">
            <p className="truncate text-[8px] text-slate-500">{stat.label}</p>
            <p className={`mt-1 text-sm font-black ${stat.color}`}>{stat.value}</p>
            <p className="truncate text-[8px] text-slate-500">{stat.change}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-[1.2fr_.8fr]">
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[9px] font-bold text-slate-300">Prochaines actions</span>
            <CalendarDays size={11} className="text-teal-300" />
          </div>
          {['Répondre à 3 avis Google', 'Publier la story du midi', 'Vérifier votre visibilité'].map((item, index) => (
            <div key={item} className="flex items-center gap-1.5 border-t border-slate-800/70 py-1.5 text-[8px] text-slate-400">
              <CheckCircle2 size={10} className={index === 0 ? 'text-amber-300' : 'text-teal-300'} />
              <span className="truncate">{item}</span>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-teal-400/15 bg-teal-400/[0.06] p-2.5">
          <Sparkles size={12} className="text-teal-300" />
          <p className="mt-2 text-[9px] font-bold text-slate-200">Suggestion IA</p>
          <p className="mt-1 text-[8px] leading-4 text-slate-400">Mettez votre menu du jour en avant ce midi.</p>
        </div>
      </div>
    </>
  );
}

function InboxPanel() {
  const messages = [
    ['Google', 'Marie D.', 'Super expérience, je recommande !', '2 min'],
    ['Instagram', '@foodie_paris', 'Vous ouvrez le dimanche ?', '15 min'],
    ['WhatsApp', 'Jean-Pierre', 'Réservation pour samedi', '1 h'],
  ];

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[9px] font-bold text-slate-300">Inbox unifiée</span>
        <span className="rounded-full bg-violet-400/15 px-2 py-0.5 text-[8px] font-bold text-violet-300">4 nouveaux</span>
      </div>
      <div className="space-y-1.5">
        {messages.map(([source, name, message, time]) => (
          <div key={name} className="flex items-start gap-2 rounded-md border border-slate-800/80 bg-slate-900/80 p-2">
            <span className="mt-0.5 rounded bg-slate-800 px-1 py-0.5 text-[7px] font-bold text-slate-400">{source}</span>
            <div className="min-w-0 flex-1">
              <div className="flex justify-between gap-2">
                <span className="truncate text-[9px] font-semibold text-slate-300">{name}</span>
                <span className="shrink-0 text-[8px] text-slate-600">{time}</span>
              </div>
              <p className="mt-0.5 truncate text-[8px] text-slate-500">{message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsPanel() {
  return (
    <>
      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[9px] font-bold text-slate-300">Visibilité locale</span>
            <p className="mt-1 text-lg font-black text-amber-300">74<span className="text-[9px] font-medium text-slate-500"> / 100</span></p>
          </div>
          <div className="flex items-center gap-1 text-[8px] font-bold text-emerald-300"><TrendingUp size={10} /> +311%</div>
        </div>
        <div className="mt-3 flex h-12 items-end gap-1">
          {[28, 34, 31, 42, 38, 55, 50, 64, 74].map((height, index) => (
            <div key={index} className="flex-1 rounded-t bg-gradient-to-t from-amber-500/30 to-amber-300/80" style={{ height: `${height}%` }} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {['47 avis Google', '12,4K portée', '8 citations IA', '96% de réponse'].map((metric) => (
          <div key={metric} className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/60 p-2 text-[8px] text-slate-400">
            <Eye size={10} className="shrink-0 text-amber-300" />
            <span className="truncate">{metric}</span>
          </div>
        ))}
      </div>
    </>
  );
}

export function LandingScreenshots() {
  return (
    <section className="relative border-y border-white/[0.07] bg-[#0B1120] px-4 py-16 sm:px-6 lg:py-24" aria-labelledby="screenshots-title">
      <div className="mx-auto max-w-[1120px]">
        <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div className="max-w-xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-teal-300">À l’intérieur de Kompilot</p>
            <h2 id="screenshots-title" className="text-3xl font-black tracking-[-0.04em] text-slate-100 sm:text-4xl">Votre présence locale, enfin lisible.</h2>
            <p className="mt-3 text-sm leading-7 text-slate-400 sm:text-base">Un espace de travail pensé pour passer du signal à l’action, sans empiler les tableaux de bord.</p>
          </div>
          <a href="/signup" className="inline-flex w-fit items-center gap-2 text-sm font-bold text-teal-300 transition-colors hover:text-teal-200">
            Voir l’espace complet <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {SCREENSHOTS.map(({ title, caption, icon: Icon, tone, variant }) => (
            <article key={title} className="group overflow-hidden rounded-2xl border border-white/[0.09] bg-white/[0.035] shadow-[0_20px_60px_-35px_rgba(0,0,0,.8)] transition-transform duration-300 hover:-translate-y-1">
              <div className="relative overflow-hidden border-b border-white/[0.07] bg-[#172231] p-2">
                <DashboardPreview variant={variant} />
                <div className="pointer-events-none absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-slate-950/75 text-slate-100 backdrop-blur-sm">
                  <Icon size={17} aria-hidden="true" />
                </div>
              </div>
              <div className="p-5">
                <p className={`mb-2 text-[10px] font-bold uppercase tracking-[0.14em] ${tone === 'teal' ? 'text-teal-300' : tone === 'violet' ? 'text-violet-300' : 'text-amber-300'}`}>Kompilot workspace</p>
                <h3 className="text-base font-bold text-slate-100">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{caption}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
