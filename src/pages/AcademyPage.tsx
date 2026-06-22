import { useState, useMemo } from 'react';
import { GraduationCap, Clock, BookOpen, Play, List, Lock, Search, Sparkles, TrendingUp, Briefcase, Megaphone, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSubscription } from '../context/SubscriptionContext';
import { useDemoMode } from '../context/DemoModeContext';
import { loadAcademyModules, ACADEMY_CHANNELS } from '../data/academyContent';
import type { AcademyModule, AcademyChannel } from '../data/academyContent';
import { AcademyCourseModal } from '../components/academy/AcademyCourseModal';
import { AcademyUpgradeModal } from '../components/academy/AcademyUpgradeModal';
import { PitchGeneratorPanel } from '../components/academy/PitchGeneratorPanel';

// ── Format icon ────────────────────────────────────────────────────────────────
function FormatIcon({ format }: { format: AcademyModule['format'] }) {
  if (format === 'video') return <Play size={11} className="fill-current" />;
  if (format === 'checklist') return <List size={11} />;
  return <BookOpen size={11} />;
}

// ── Module card ────────────────────────────────────────────────────────────────
function ModuleCard({
  module,
  canAccessPremium,
  onOpen,
  onUpgrade,
}: {
  module: AcademyModule;
  canAccessPremium: boolean;
  onOpen: (m: AcademyModule) => void;
  onUpgrade: (m: AcademyModule) => void;
}) {
  const channel = ACADEMY_CHANNELS.find(c => c.id === module.channel);
  const locked = module.tier === 'premium' && !canAccessPremium;

  const cardGradients: Record<string, string> = {
    'google-maps':  'from-red-50 to-rose-50 border-red-100',
    'tiktok-reels': 'from-pink-50 to-fuchsia-50 border-pink-100',
    'whatsapp':     'from-green-50 to-emerald-50 border-green-100',
    'seo':          'from-teal-50 to-cyan-50 border-teal-100',
    'email':        'from-indigo-50 to-blue-50 border-indigo-100',
    'instagram':    'from-purple-50 to-violet-50 border-purple-100',
    'facebook':     'from-blue-50 to-sky-50 border-blue-100',
    'sea':          'from-orange-50 to-amber-50 border-orange-100',
  };

  const gradient = cardGradients[module.channel] || 'from-slate-50 to-gray-50 border-slate-100';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onClick={() => locked ? onUpgrade(module) : onOpen(module)}
      className={`relative rounded-2xl border bg-gradient-to-br ${gradient} p-5 cursor-pointer group hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 ${locked ? 'opacity-85' : ''}`}
    >
      {/* Lock overlay */}
      {locked && (
        <div className="absolute inset-0 rounded-2xl bg-white/40 backdrop-blur-[1px] flex items-start justify-end p-3 z-10">
          <div className="flex items-center gap-1 rounded-full bg-amber-500 text-white text-[10px] font-extrabold px-2.5 py-1 shadow-sm">
            <Lock size={9} />
            Premium ✨
          </div>
        </div>
      )}

      {/* Premium badge (non-locked) */}
      {!locked && module.tier === 'premium' && (
        <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-extrabold px-2.5 py-0.5 border border-amber-200">
          <Sparkles size={9} />
          Masterclass
        </div>
      )}

      {/* Emoji */}
      <div className="text-3xl mb-3 select-none">{module.emoji}</div>

      {/* Channel tag */}
      {channel && (
        <span className={`inline-flex items-center gap-1 rounded-full border text-[10px] font-bold px-2 py-0.5 mb-2 ${channel.color}`}>
          {channel.emoji} {channel.label}
        </span>
      )}

      {/* Title */}
      <h3 className="text-sm font-bold text-foreground leading-snug mb-1 group-hover:text-primary transition-colors line-clamp-2">
        {module.title}
      </h3>
      <p className="text-[12px] text-muted-foreground line-clamp-2 leading-relaxed">
        {module.subtitle}
      </p>

      {/* Meta */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-black/5">
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock size={10} /> {module.duration}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground capitalize">
          <FormatIcon format={module.format} />
          {module.format === 'video' ? 'Vidéo' : module.format === 'checklist' ? 'Checklist' : 'Article'}
        </span>
      </div>
    </motion.div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function AcademyPage() {
  const { currentPlan } = useSubscription();
  const { isDemoActive } = useDemoMode();

  // Premium = Pro or Expert plan (or demo mode)
  const canAccessPremium = isDemoActive || currentPlan.id === 'pro' || currentPlan.id === 'expert';

  const [activeChannel, setActiveChannel] = useState<AcademyChannel>('all');
  const [search, setSearch] = useState('');
  const [openModule, setOpenModule] = useState<AcademyModule | null>(null);
  const [upgradeModule, setUpgradeModule] = useState<AcademyModule | null>(null);

  const allModules = useMemo(() => loadAcademyModules(), []);

  const filtered = useMemo(() => {
    let list = allModules;
    if (activeChannel !== 'all') {
      list = list.filter(m => m.channel === activeChannel);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(m =>
        m.title.toLowerCase().includes(q) ||
        m.subtitle.toLowerCase().includes(q) ||
        m.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [allModules, activeChannel, search]);

  const freeModules    = filtered.filter(m => m.tier === 'free');
  const seaModules     = filtered.filter(m => m.channel === 'sea' && m.tier === 'premium' && !m.metier);
  const metierModules  = filtered.filter(m => m.channel === 'sea' && m.metier);
  const otherPremium   = filtered.filter(m => m.tier === 'premium' && m.channel !== 'sea');

  const totalModules = allModules.length;
  const premiumCount = allModules.filter(m => m.tier === 'premium').length;
  const freeCount    = allModules.filter(m => m.tier === 'free').length;
  const seaCount     = allModules.filter(m => m.channel === 'sea').length;

  const [activePageTab, setActivePageTab] = useState<'academy' | 'pipeline'>('academy');

  return (
    <div className="flex-1 overflow-y-auto">
      {/* ── Hero banner ───────────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 px-6 py-10 overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <GraduationCap size={20} className="text-white" />
            </div>
            <span className="text-white/70 text-sm font-bold uppercase tracking-widest">Kompilot Academy</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white leading-tight mb-2">
            Maîtrisez votre présence en ligne 🚀
          </h1>
          <p className="text-white/80 text-base leading-relaxed mb-5">
            Des micro-formations de 45 secondes à 3 minutes, pensées pour les commerçants qui n'ont pas de temps à perdre.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap gap-4">
            {[
              { value: totalModules.toString(), label: 'Modules disponibles' },
              { value: freeCount.toString(), label: 'Contenus gratuits' },
              { value: premiumCount.toString(), label: 'Masterclass Premium' },
              { value: '≤ 3 min', label: 'Par module max' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2 bg-white/15 rounded-xl px-4 py-2">
                <span className="text-lg font-extrabold text-white">{s.value}</span>
                <span className="text-[11px] text-white/70">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Page tabs ─────────────────────────────────────────────────────── */}
      <div className="flex border-b border-border bg-background sticky top-0 z-10">
        {([
          { id: 'academy'  as const, icon: GraduationCap, label: 'Academy · Formations',  desc: 'Micro-formations & checklists' },
          { id: 'pipeline' as const, icon: Rocket,        label: 'Pipeline Agence',        desc: 'Générateur de pitchs de prospection' },
        ] as const).map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActivePageTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3.5 text-xs font-semibold border-b-2 transition-colors ${
                activePageTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              <span className={`hidden sm:inline text-[10px] font-normal ${activePageTab === tab.id ? 'text-primary/60' : 'text-muted-foreground/60'}`}>
                · {tab.desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Pipeline Agence ─────────────────────────────────────────────────── */}
      {activePageTab === 'pipeline' && (
        <div className="px-6 py-6 space-y-6">
          <div className="rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 to-emerald-50 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
              <Rocket size={18} className="text-teal-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-extrabold text-teal-900">Pipeline Agence — Vendez Kompilot sans effort</p>
              <p className="text-xs text-teal-700/80 mt-0.5 leading-relaxed">
                Générez des scripts de prospection sur-mesure par secteur. Copiez en 1 clic ou envoyez par SMS/Email à un prospect.
              </p>
            </div>
            <span className="shrink-0 text-[11px] font-bold text-teal-700 bg-teal-100 border border-teal-200 rounded-full px-3 py-1.5">
              🎯 Taux de conversion moyen : 34%
            </span>
          </div>
          <PitchGeneratorPanel />
        </div>
      )}

      {/* ── Academy content ───────────────────────────────────────────────── */}
      {activePageTab === 'academy' && (
      <div className="px-6 py-6 space-y-6">

        {/* ── NEW: SEA featured banner ──────────────────────────────────── */}
        {(activeChannel === 'all' || activeChannel === 'sea') && !search && (
          <div className="rounded-2xl overflow-hidden border border-orange-200 dark:border-orange-800/50">
            <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Megaphone size={20} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-extrabold text-white">🆕 Nouveau — Parcours Publicité Payante Locale</p>
                    <span className="text-[10px] font-bold bg-white/25 text-white rounded-full px-2 py-0.5 border border-white/30">
                      {seaCount} modules
                    </span>
                  </div>
                  <p className="text-xs text-white/85 leading-relaxed">
                    Google Ads & Meta Ads pour commerçants — de la configuration au ROI, avec des cas pratiques par métier.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveChannel('sea')}
                className="shrink-0 flex items-center gap-1.5 rounded-xl bg-white text-orange-600 text-xs font-extrabold px-4 py-2 hover:bg-orange-50 active:scale-[0.98] transition-all shadow-sm"
              >
                <TrendingUp size={13} /> Voir le parcours
              </button>
            </div>
          </div>
        )}

        {/* Search bar */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher un sujet, une plateforme..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Channel filters */}
        <div className="flex flex-wrap gap-2">
          {ACADEMY_CHANNELS.map(ch => (
            <button
              key={ch.id}
              onClick={() => setActiveChannel(ch.id)}
              className={`flex items-center gap-1.5 rounded-full border text-xs font-semibold px-3 py-1.5 transition-all ${
                activeChannel === ch.id
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : `${ch.color} hover:opacity-80`
              }`}
            >
              <span>{ch.emoji}</span> {ch.label}
            </button>
          ))}
        </div>

        {/* Premium access banner (for free users) */}
        {!canAccessPremium && (
          <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-800">
                ✨ {premiumCount} Masterclass disponibles en Business & Franchise
              </p>
              <p className="text-xs text-amber-700/80 mt-0.5">
                Google Ads, Meta Ads, stratégies TikTok, GEO et bien plus — réservés aux abonnés Pro & Expert.
              </p>
            </div>
            <a href="/subscription">
              <button className="shrink-0 flex items-center gap-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold px-4 py-2 hover:bg-amber-600 active:scale-[0.98] transition-all">
                <Sparkles size={13} /> Débloquer tout
              </button>
            </a>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-base font-semibold text-foreground">Aucun module trouvé</p>
            <p className="text-sm text-muted-foreground mt-1">Essayez un autre terme ou canal.</p>
          </div>
        )}

        {/* Free modules section */}
        {freeModules.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg bg-teal-100 flex items-center justify-center">
                <GraduationCap size={13} className="text-teal-600" />
              </div>
              <h2 className="text-sm font-bold text-foreground">Guides de base · Accès gratuit</h2>
              <span className="text-[11px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">{freeModules.length}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {freeModules.map(m => (
                <ModuleCard
                  key={m.id}
                  module={m}
                  canAccessPremium={canAccessPremium}
                  onOpen={setOpenModule}
                  onUpgrade={setUpgradeModule}
                />
              ))}
            </div>
          </section>
        )}

        {/* SEA parcours section */}
        {seaModules.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center">
                <TrendingUp size={13} className="text-orange-600" />
              </div>
              <h2 className="text-sm font-bold text-foreground">Publicité Payante Locale · Google Ads & Meta Ads</h2>
              <span className="text-[11px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">{seaModules.length} modules</span>
              <span className="text-[10px] font-bold rounded-full bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5">Premium ✨</span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Parcours complet : de la création de compte à l'analyse du ROI — Google Ads local et Meta Ads pour commerces.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {seaModules.map(m => (
                <ModuleCard
                  key={m.id}
                  module={m}
                  canAccessPremium={canAccessPremium}
                  onOpen={setOpenModule}
                  onUpgrade={setUpgradeModule}
                />
              ))}
            </div>
          </section>
        )}

        {/* Cas pratiques métiers section */}
        {metierModules.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Briefcase size={13} className="text-emerald-600" />
              </div>
              <h2 className="text-sm font-bold text-foreground">Cas Pratiques Métiers</h2>
              <span className="text-[11px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">{metierModules.length}</span>
              <span className="text-[10px] font-bold rounded-full bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5">Premium ✨</span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Fiches prêtes à l'emploi adaptées à votre secteur d'activité — restaurants, salons, instituts.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {metierModules.map(m => (
                <ModuleCard
                  key={m.id}
                  module={m}
                  canAccessPremium={canAccessPremium}
                  onOpen={setOpenModule}
                  onUpgrade={setUpgradeModule}
                />
              ))}
            </div>
          </section>
        )}

        {/* Other premium modules section */}
        {otherPremium.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center">
                <Sparkles size={13} className="text-amber-600" />
              </div>
              <h2 className="text-sm font-bold text-foreground">Masterclass Trends · Réservé Business & Franchise</h2>
              <span className="text-[11px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">{otherPremium.length}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {otherPremium.map(m => (
                <ModuleCard
                  key={m.id}
                  module={m}
                  canAccessPremium={canAccessPremium}
                  onOpen={setOpenModule}
                  onUpgrade={setUpgradeModule}
                />
              ))}
            </div>
          </section>
        )}
      </div>
      )} {/* end academy tab */}

      {/* Modals */}
      <AcademyCourseModal module={openModule} onClose={() => setOpenModule(null)} />
      <AcademyUpgradeModal
        open={!!upgradeModule}
        moduleTitle={upgradeModule?.title}
        onClose={() => setUpgradeModule(null)}
      />
    </div>
  );
}
