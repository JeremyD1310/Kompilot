/**
 * DemoDashboardPage — Persistent demo dashboard at /demo/dashboard.
 *
 * Self-contained (no AuthGuard, no DashboardLayout, no subscription checks).
 * Uses local demo data from DemoModeContext + simulated activity log entries.
 * Session expires when sessionStorage clears (tab close).
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from '@tanstack/react-router';
import {
  LayoutDashboard, Calendar, Star, Mail, TrendingUp,
  ArrowRight, LogOut, Zap, Eye, Clock,
  BarChart3, Users, Globe, AlertTriangle, CheckCircle2,
  Info, XCircle, Activity, MessageSquare, PenLine, Search, RotateCcw,
} from 'lucide-react';
import { useDemoMode } from '../context/DemoModeContext';
import { normalizeOfficialSector, SECTOR_CATALOG } from '../data/sectors/sectorCatalog';
import {
  DEMO_EMAIL, DEMO_USER, clearDemoSession, saveDemoSession, DEMO_GEO_SCORE,
  DEMO_KPI, DEMO_CREDITS,
} from '../lib/demoAccount';
import { MobileKpiCard, AgencyBadge, DetailButton, UpgradeCTA, PlanGate } from '../components/shared/ResponsiveShared';
import { LocalVisibilityScanner } from '../components/geo/LocalVisibilityScanner';
import { B2BExecutiveDashboard } from '../components/dashboard/B2BExecutiveDashboard';

// ── Storage keys ─────────────────────────────────────────────────────────────
const DEMO_ACTIVE_KEY = 'kompilot_demo_active_session';
const DEMO_SESSION_KEY = 'kompilot_demo_session_v1';

// ── Simulated activity log ─────────────────────────────────────────────────
interface ActivityEntry { id: string; icon: React.ReactNode; iconColor: string; action: string; detail: string; severity: 'info' | 'warning' | 'success' | 'error'; time: string }

const DEMO_ACTIVITIES: ActivityEntry[] = [
  { id: 'a1', icon: <CheckCircle2 size={14} />, iconColor: 'text-emerald-500', action: 'Connexion réussie', detail: 'Authentification demo via /demo', severity: 'success', time: 'Il y a 2 min' },
  { id: 'a2', icon: <Eye size={14} />, iconColor: 'text-blue-500', action: 'Consultation tableau de bord', detail: 'Dashboard chargé avec données demo', severity: 'info', time: 'Il y a 3 min' },
  { id: 'a3', icon: <Calendar size={14} />, iconColor: 'text-violet-500', action: 'Post planifié (demo)', detail: '📅 Atelier découverte ce samedi — Instagram', severity: 'info', time: 'Il y a 12 min' },
  { id: 'a4', icon: <Star size={14} />, iconColor: 'text-amber-500', action: 'Nouvel avis Google', detail: 'Thomas R. — ⭐⭐⭐⭐⭐ "Service impeccable"', severity: 'info', time: 'Il y a 25 min' },
  { id: 'a5', icon: <Zap size={14} />, iconColor: 'text-violet-500', action: 'Crédit IA consommé', detail: 'Génération post IA — Cockpit — 1 crédit', severity: 'info', time: 'Il y a 38 min' },
  { id: 'a6', icon: <Mail size={14} />, iconColor: 'text-blue-500', action: 'Message inbox reçu', detail: 'Sophie Marchand — Demande de collaboration créative', severity: 'info', time: 'Il y a 1h' },
  { id: 'a7', icon: <AlertTriangle size={14} />, iconColor: 'text-amber-500', action: 'Score GEO alerte', detail: 'Score Citations: 71/100 — en dessous du seuil recommandé (75)', severity: 'warning', time: 'Il y a 2h' },
  { id: 'a8', icon: <Globe size={14} />, iconColor: 'text-emerald-500', action: 'Scan GEO complété', detail: 'Score global: 78/100 (+14 vs. mois dernier)', severity: 'success', time: 'Il y a 3h' },
  { id: 'a9', icon: <Users size={14} />, iconColor: 'text-blue-500', action: 'Nouveau follower', detail: 'Instagram: +12 followers cette semaine', severity: 'info', time: 'Il y a 5h' },
  { id: 'a10', icon: <XCircle size={14} />, iconColor: 'text-red-500', action: 'Publication échouée', detail: 'Facebook: erreur temporaire — replanifiée automatiquement', severity: 'error', time: 'Hier, 18:42' },
  { id: 'a11', icon: <TrendingUp size={14} />, iconColor: 'text-emerald-500', action: 'Métriques synchronisées', detail: 'Instagram + Facebook + LinkedIn — 12.8K vues totales', severity: 'info', time: 'Hier, 09:00' },
  { id: 'a12', icon: <CheckCircle2 size={14} />, iconColor: 'text-emerald-500', action: 'Réponse avis envoyée', detail: 'Réponse IA automatique envoyée pour avis de Julien M.', severity: 'success', time: '15 mai, 14:22' },
];

const SEVERITY_STYLES: Record<string, string> = {
  info:    'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  error:   'bg-red-500/10 text-red-600 dark:text-red-400',
};

// ── Animation ───────────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const, delay: i * 0.07 },
  }),
};

// ── Component ───────────────────────────────────────────────────────────────

export default function DemoDashboardPage() {
  const navigate = useNavigate();
  const { demoSector } = useDemoMode();
  const [loggingOut, setLoggingOut] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity'>('overview');
  const [showGeoDetail, setShowGeoDetail] = useState(false);

  const [sectorVersion, setSectorVersion] = useState(0);
  useEffect(() => {
    const handleSectorChange = () => setSectorVersion(version => version + 1);
    window.addEventListener('kompilot:sector-change', handleSectorChange);
    return () => window.removeEventListener('kompilot:sector-change', handleSectorChange);
  }, []);

  // A direct visit to /demo/dashboard is still a valid public demo entry.
  // Bootstrap the local sandbox session instead of redirecting back to /demo;
  // this also makes the CTA resilient if the browser drops sessionStorage.
  useEffect(() => {
    const session = sessionStorage.getItem(DEMO_ACTIVE_KEY);
    const stored = localStorage.getItem(DEMO_SESSION_KEY);
    if (!session && !stored) {
      saveDemoSession();
      sessionStorage.setItem(DEMO_ACTIVE_KEY, 'true');
      localStorage.setItem('kompilot_switcher_unlocked', '1');
      localStorage.setItem('kompilot_demo_sector', demoSector);
    }
  }, [demoSector]);

  const officialSector = normalizeOfficialSector((typeof window !== 'undefined' ? localStorage.getItem('kompilot_demo_sector') : null) ?? demoSector);
  void sectorVersion;
  const profile = SECTOR_CATALOG[officialSector];
  const sector = { label: profile.shortLabel, emoji: profile.emoji };
  const sectorName = profile.shortLabel;
  const averageEngagement = Math.round((profile.googleViewsChange / 10) * 10) / 10;
  const kpi = { ...DEMO_KPI, posts: profile.posts.length, engagement: averageEngagement };
  const geo = { ...DEMO_GEO_SCORE, overall: profile.geoScore };
  const credits = DEMO_CREDITS;
  const pendingReviews = profile.reviews.filter(review => review.rating < 5).length;

  const handleLogout = () => {
    setLoggingOut(true);
    clearDemoSession();
    sessionStorage.removeItem(DEMO_ACTIVE_KEY);
    localStorage.removeItem('kompilot_switcher_unlocked');
    localStorage.removeItem('kompilot_demo_credits_v1');
    localStorage.removeItem('kompilot_demo_start_v1');
    localStorage.removeItem('kompilot_demo_sector');
    setTimeout(() => navigate({ to: '/demo' }), 300);
  };

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="demo-dashboard" data-demo-dashboard="true">
      {/* ── Top banner ────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-500 text-white px-4 py-2.5 flex items-center justify-between gap-3" style={{ zIndex: 'var(--z-sticky)' }}>
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
          <span className="text-xs font-bold truncate">
            🎮 Mode Démo — {sector.emoji} {sector.label} — Données fictives
          </span>
          <span className="hidden sm:inline text-[10px] opacity-80">
            · Identifiants: {DEMO_EMAIL} · Session 12h
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLogout}
            className="hidden items-center gap-1.5 rounded-full border border-white/25 px-3 py-1 text-[10px] font-bold transition-colors hover:bg-white/15 sm:flex"
          >
            <RotateCcw size={11} /> Réinitialiser
          </button>
          <Link
            to="/demo"
            className="text-[10px] font-bold bg-white/20 hover:bg-white/30 rounded-full px-3 py-1 transition-colors"
          >
            ← Retour à /demo
          </Link>
        </div>
      </div>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-[--z-sticky]" style={{ zIndex: 'var(--z-sticky)' }}>
        <div className="max-w-[1200px] mx-auto px-4 md:px-7 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <LayoutDashboard size={16} className="text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight">Tableau de bord · {profile.shortLabel}</h1>
              <p className="text-[10px] text-muted-foreground leading-tight">
                {DEMO_USER.displayName} · Plan Expert
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Credits pill */}
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground bg-muted rounded-full px-3 py-1.5">
              <Zap size={10} className="text-amber-500" />
              {credits.remaining} crédits IA
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-destructive bg-muted hover:bg-destructive/8 rounded-lg px-3 py-2 transition-colors cursor-pointer"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-[1200px] mx-auto px-4 md:px-7 flex gap-1 -mb-px">
          {[
            { id: 'overview' as const, label: 'Vue d\'ensemble', icon: <BarChart3 size={13} /> },
            { id: 'activity' as const, label: 'Journal d\'activité', icon: <Activity size={13} /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer border-b-2 ${
                activeTab === tab.id
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <main className="max-w-[1200px] mx-auto px-3 sm:px-4 md:px-7 py-4 sm:py-6 pb-16">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' ? (
            <motion.div
              key="overview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* KPI Strip */}
              <motion.div
                custom={0} variants={fadeUp} initial="hidden" animate="visible"
                className="nc-mobile-summary mb-6"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <MobileKpiCard icon={<Eye size={15} />} value={`+${profile.googleViewsChange}%`} label="Vues fiche / mois" change="vs période précédente" trend="up" accent="bg-blue-500/10 text-blue-500" />
                  <MobileKpiCard icon={<Users size={15} />} value={`${profile.hoursSaved}h`} label="Temps gagné" change="chaque semaine" trend="up" accent="bg-violet-500/10 text-violet-500" />
                  <MobileKpiCard icon={<TrendingUp size={15} />} value={`${profile.googleRating}/5`} label="Note Google" change="excellent" trend="up" accent="bg-emerald-500/10 text-emerald-500" />
                  <MobileKpiCard icon={<Star size={15} />} value={geo.overall.toString()} label="Score GEO" change={`+${geo.trend}`} trend="up" accent="bg-amber-500/10 text-amber-500" />
                </div>
              </motion.div>

              <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="mb-6">
                <B2BExecutiveDashboard establishmentName={profile.businessName} isDemo />
              </motion.div>

              {/* Local visibility scanner + GEO breakdown */}
              <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible" className="mb-6">
                <LocalVisibilityScanner demo demoSector={officialSector} defaultBusinessName={profile.businessName} defaultCity={profile.city} defaultActivity={profile.shortLabel} />
                <p className="mt-2 text-[11px] text-muted-foreground">Mode démo : les résultats sont simulés pour explorer le parcours. Les liens d’action ouvrent les outils correspondants du cockpit.</p>
              </motion.div>
              <div className="mb-6">
                <DetailButton isOpen={showGeoDetail} onClick={() => setShowGeoDetail(!showGeoDetail)} label="Détail Score GEO" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible"
                  className={`md:col-span-2 rounded-xl border border-border bg-card p-3 sm:p-5 ${showGeoDetail ? 'block' : 'hidden'} sm:block`}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Globe size={15} className="text-primary" />
                    <span className="text-sm font-bold">Détail Score GEO</span>
                    <span className="ml-auto text-[10px] font-bold text-emerald-500 bg-emerald-500/10 rounded-full px-2 py-0.5">
                      +{geo.trend} ce mois
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Google Fiche', score: geo.breakdown.googleFiche, color: 'bg-emerald-500' },
                      { label: 'Citations', score: geo.breakdown.citations, color: 'bg-amber-500' },
                      { label: 'Avis', score: geo.breakdown.avis, color: 'bg-blue-500' },
                      { label: 'Contenu', score: geo.breakdown.contenu, color: 'bg-violet-500' },
                    ].map(item => (
                      <div key={item.label} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">{item.label}</span>
                          <span className="text-xs font-bold">{item.score}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full ${item.color} transition-all duration-700`}
                            style={{ width: `${item.score}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible"
                  className="rounded-xl border border-border bg-card p-3 sm:p-5"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Zap size={15} className="text-amber-500" />
                    <span className="text-sm font-bold">Crédits IA</span>
                  </div>
                  <div className="text-center space-y-2">
                    <span className="text-3xl font-extrabold tabular-nums">{credits.remaining}</span>
                    <p className="text-[11px] text-muted-foreground">crédits restants ce mois</p>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-700"
                        style={{ width: `${(credits.remaining / credits.total) * 100}%` }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {credits.used} / {credits.total} utilisés · Plan {credits.plan}
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Recent posts + Reviews */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible"
                  className="rounded-xl border border-border bg-card p-3 sm:p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={15} className="text-emerald-500" />
                      <span className="text-sm font-bold">Publications récentes</span>
                    </div>
                    <span className="text-[10px] font-semibold text-primary">{profile.shortLabel}</span>
                  </div>
                  <div className="space-y-2">
                    {profile.posts.map((post, i) => ({ title: post.title, status: i === 0 ? 'Publié' : 'Planifié', platform: post.platform, date: i === 0 ? 'Aujourd’hui' : 'Demain' })).map((post, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 hover:bg-muted/50 transition-colors">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{post.title}</p>
                          <p className="text-[10px] text-muted-foreground/50 flex items-center gap-1 mt-0.5">
                            <Clock size={9} /> {post.date} · {post.platform}
                          </p>
                        </div>
                        <span className={`shrink-0 text-[9px] font-bold rounded-full px-2 py-0.5 ${
                          post.status === 'Publié'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-blue-500/10 text-blue-600'
                        }`}>
                          {post.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                <motion.div custom={8} variants={fadeUp} initial="hidden" animate="visible"
                  className="rounded-xl border border-border bg-card p-3 sm:p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Star size={15} className="text-amber-500" />
                      <span className="text-sm font-bold">Avis Google · {sectorName}</span>
                      {pendingReviews > 0 && (
                        <span className="text-[9px] font-bold bg-red-500 text-white rounded-full px-1.5 py-0.5 animate-pulse">
                          {pendingReviews} en attente
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {profile.reviews.map((review) => (
                      <div key={review.author} className="rounded-lg border border-border bg-card px-3 py-2.5">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold">{review.author}</span>
                          <span className="text-[10px]">{'⭐'.repeat(review.rating)}</span>
                          <span className="ml-auto text-[9px] font-bold text-emerald-500 bg-emerald-500/10 rounded-full px-1.5 py-0.5">✓ Réponse IA prête</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{review.text}</p>
                        <p className="mt-2 border-l-2 border-teal-500 pl-2 text-[10px] leading-relaxed text-teal-700 line-clamp-2">{review.response}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              <div className="mb-6 rounded-xl border border-teal-200 bg-teal-50 p-4"><p className="text-sm font-bold text-teal-900">{profile.alert}</p><p className="mt-1 text-xs text-teal-700">{profile.alertDetail}</p></div>

              {/* Advanced Analytics — Agency feature preview */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-sm font-bold">Analytique avancée</h3>
                  <AgencyBadge size="sm" />
                </div>
                <UpgradeCTA feature="Rapports détaillés par plateforme" onUpgrade={() => {}} />
              </div>

              {/* Fonctionnalités clés */}
              <motion.div custom={9} variants={fadeUp} initial="hidden" animate="visible"
                className="mb-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                    <Zap size={13} className="text-primary" />
                  </div>
                  <span className="text-sm font-bold">Fonctionnalités clés</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { icon: <Calendar size={18} />, title: 'Calendrier de publications', desc: `Planifiez les contenus ${profile.shortLabel.toLowerCase()} sur toutes les plateformes.`, metric: `${profile.posts.length} prêts`, accent: 'bg-emerald-500/10 text-emerald-500' },
                    { icon: <Mail size={18} />, title: 'Boîte de réception unifiée', desc: 'Tous vos messages DM et emails dans un seul endroit.', metric: '8 non lus', accent: 'bg-blue-500/10 text-blue-500' },
                    { icon: <Globe size={18} />, title: `Score GEO · ${profile.shortLabel}`, desc: `Suivez la visibilité locale de ${profile.businessName} et ses citations IA.`, metric: `${profile.geoScore}/100`, accent: 'bg-violet-500/10 text-violet-500' },
                    { icon: <Star size={18} />, title: 'Avis Google automatisés', desc: `Réponses IA et suivi des avis pour ${profile.shortLabel.toLowerCase()}.`, metric: `${profile.googleRating}★ moy.`, accent: 'bg-amber-500/10 text-amber-500' },
                    { icon: <Zap size={18} />, title: 'Cockpit IA & génération de contenu', desc: `Générez des posts adaptés à ${profile.businessName}.`, metric: `${profile.hoursSaved}h gagnées`, accent: 'bg-pink-500/10 text-pink-500' },
                    { icon: <BarChart3 size={18} />, title: `Analytique ${profile.shortLabel}`, desc: 'KPI consolidés et rapports de performance multi-plateformes.', metric: `+${profile.googleViewsChange}% fiche`, accent: 'bg-teal-500/10 text-teal-500' },
                  ].map((feat, i) => (
                    <motion.div
                      key={feat.title}
                      custom={i} variants={fadeUp} initial="hidden" whileInView="visible"
                      viewport={{ once: true, amount: 0.3 }}
                      className="rounded-xl border border-border bg-card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${feat.accent}`}>
                          {feat.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-foreground leading-tight">{feat.title}</h4>
                          <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{feat.desc}</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50">Statut</span>
                        <span className="text-[10px] font-bold text-primary bg-primary/8 rounded-full px-2 py-0.5">{feat.metric}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Trafic par plateforme */}
              <motion.div custom={10} variants={fadeUp} initial="hidden" animate="visible"
                className="mb-6 rounded-xl border border-border bg-card p-3 sm:p-5"
              >
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={15} className="text-primary" />
                  <span className="text-sm font-bold">Trafic par plateforme</span>
                  <span className="ml-auto text-[10px] font-bold text-emerald-500 bg-emerald-500/10 rounded-full px-2 py-0.5">
                    +{profile.googleViewsChange}% local
                  </span>
                </div>
                <div className="space-y-3.5">
                  {[
                    { name: profile.posts[0]?.platform ?? 'Instagram', views: profile.kpis[0]?.value ?? '—', change: `+${profile.googleViewsChange}%`, width: 100, color: 'bg-gradient-to-r from-pink-500 to-rose-400' },
                    { name: profile.posts[1]?.platform ?? 'Google Business', views: profile.kpis[1]?.value ?? '—', change: `+${Math.max(35, profile.googleViewsChange - 8)}%`, width: 78, color: 'bg-gradient-to-r from-teal-600 to-teal-400' },
                  ].map((platform) => (
                    <div key={platform.name} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground">{platform.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold tabular-nums">{platform.views} vues</span>
                          <span className="text-[10px] font-bold text-emerald-500">{platform.change}</span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${platform.color}`}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${platform.width}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground/50 mt-4 pt-3 border-t border-border">
                  Données simulées des 30 derniers jours · {profile.shortLabel} · {profile.city}
                </p>
              </motion.div>

              {/* Actions rapides */}
              <motion.div custom={11} variants={fadeUp} initial="hidden" animate="visible"
                className="mb-6"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={14} className="text-amber-500" />
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions rapides</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { icon: <PenLine size={15} />, label: 'Créer un post', accent: 'hover:border-emerald-500/40 hover:bg-emerald-500/5' },
                    { icon: <MessageSquare size={15} />, label: 'Répondre aux avis', accent: 'hover:border-amber-500/40 hover:bg-amber-500/5' },
                    { icon: <Search size={15} />, label: 'Scanner mon GEO', accent: 'hover:border-blue-500/40 hover:bg-blue-500/5' },
                    { icon: <Calendar size={15} />, label: 'Voir le calendrier', accent: 'hover:border-violet-500/40 hover:bg-violet-500/5' },
                  ].map((action) => (
                    <button
                      key={action.label}
                      className={`flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-3.5 cursor-pointer transition-all duration-200 group ${action.accent}`}
                    >
                      <div className="text-muted-foreground group-hover:text-primary transition-colors">
                        {action.icon}
                      </div>
                      <span className="text-xs font-semibold text-foreground">{action.label}</span>
                      <ArrowRight size={12} className="ml-auto text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>
              </motion.div>

            </motion.div>
          ) : (
            /* ── Activity Log Tab ──────────────────────────────────────── */
            <motion.div
              key="activity"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible"
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                <div className="px-3 sm:px-5 py-4 border-b border-border flex items-center gap-2">
                  <Activity size={15} className="text-primary" />
                  <span className="text-sm font-bold">Journal d'activité</span>
                  <span className="ml-auto text-[10px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                    {DEMO_ACTIVITIES.length} événements
                  </span>
                </div>

                {/* Mobile card view */}
                <div className="sm:hidden divide-y divide-border/50">
                  {DEMO_ACTIVITIES.map((entry) => (
                    <div key={entry.id} className="px-3 py-3 flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${SEVERITY_STYLES[entry.severity]}`}>
                        {entry.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold">{entry.action}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{entry.detail}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">{entry.time}</span>
                    </div>
                  ))}
                </div>

                {/* Desktop table view */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        {['Action', 'Détail', 'Sévérité', 'Heure'].map(h => (
                          <th key={h} className={`text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 px-5 py-2.5 ${h === 'Heure' ? 'text-right' : ''}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {DEMO_ACTIVITIES.map((entry, i) => (
                        <tr key={entry.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${SEVERITY_STYLES[entry.severity]}`}>{entry.icon}</div>
                              <span className="text-xs font-semibold">{entry.action}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3"><span className="text-[11px] text-muted-foreground">{entry.detail}</span></td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center text-[9px] font-bold rounded-full px-2 py-0.5 ${SEVERITY_STYLES[entry.severity]}`}>
                              {entry.severity === 'success' ? 'OK' : entry.severity === 'warning' ? 'WARN' : entry.severity === 'error' ? 'ERR' : 'INFO'}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right"><span className="text-[10px] text-muted-foreground whitespace-nowrap">{entry.time}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="px-3 sm:px-5 py-3 border-t border-border bg-muted/20 flex items-center gap-2">
                  <Info size={12} className="text-muted-foreground/50" />
                  <span className="text-[10px] text-muted-foreground/60">
                    Données simulées — En production, les logs sont persistés en base via /api/activity/log
                  </span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
