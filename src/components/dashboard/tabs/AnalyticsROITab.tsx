/**
 * AnalyticsROITab — Safe, crash-resistant ROI & local ranking overview.
 *
 * Wrapped in a React error boundary so a sub-component failure never
 * brings down the full dashboard.
 *
 * Blocks:
 *   1. ROI Global du mois — 3 KPI cards (Appels, Itinéraires, CA estimé)
 *   2. GéoGrid simplifié — keyword ranking table with achievement badges
 *   3. AI insights + ROI widget + full data table
 */
import React, { Component } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, DataTable, Badge } from '@blinkdotnew/ui';
import { Calendar, TrendingUp, Phone, Navigation2, DollarSign, MapPin, CheckCircle2, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { ROIWidget } from '../ROIWidget';
import { AIROIAdvisor } from '../AIROIAdvisor';
import { KPICards } from '../KPICards';
import { PostPerformanceWidget } from '../PostPerformanceWidget';
import { InboxOverviewWidget } from '../InboxOverviewWidget';
import { SegmentPerformanceDashboard } from '../SegmentPerformanceDashboard';
import { AIPerformanceInsights } from '../AIPerformanceInsights';
import { useDemoMode } from '../../../context/DemoModeContext';

// ── Error boundary ────────────────────────────────────────────────────────────

interface EBState { hasError: boolean; }

class TabErrorBoundary extends Component<{ children: React.ReactNode }, EBState> {
  state: EBState = { hasError: false };

  static getDerivedStateFromError(): EBState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
            <AlertCircle size={20} className="text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Données en cours de chargement</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Certains widgets nécessitent vos données Google connectées. Revenez après avoir lié votre fiche Google Business.
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors underline underline-offset-2"
          >
            Réessayer
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── ROI KPI Cards ─────────────────────────────────────────────────────────────

const ROI_KPIS = [
  {
    icon: <Phone size={16} className="text-emerald-600" />,
    label: 'Appels générés',
    value: '+87%',
    sub: 'vs mois précédent',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40',
    bar: 87,
  },
  {
    icon: <Navigation2 size={16} className="text-foreground" />,
    label: 'Demandes d\'itinéraires',
    value: '+45%',
    sub: 'Google Maps',
    color: 'text-foreground',
    bg: 'bg-card border-border',
    bar: 45,
  },
  {
    icon: <DollarSign size={16} className="text-emerald-600" />,
    label: 'CA estimé par l\'IA',
    value: '+64%',
    sub: 'basé sur votre panier moyen',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40',
    bar: 64,
  },
];

function ROIKPISection() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border bg-muted/20">
        <TrendingUp size={14} className="text-primary" />
        <span className="text-sm font-bold text-foreground">ROI Global du mois</span>
        <span className="ml-auto text-[10px] text-muted-foreground">Mise à jour : aujourd'hui</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
        {ROI_KPIS.map((kpi, i) => (
          <div key={i} className={`px-5 py-4 space-y-3 rounded-none border-0 ${i === 0 ? '' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${kpi.bg}`}>
                  {kpi.icon}
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground leading-tight">{kpi.label}</span>
              </div>
            </div>
            <p className={`text-2xl font-extrabold tabular-nums leading-none ${kpi.color}`}>{kpi.value}</p>
            <div className="space-y-1">
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                  style={{ width: `${kpi.bar}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">{kpi.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── GéoGrid keyword table ─────────────────────────────────────────────────────

const GEO_KEYWORDS = [
  { keyword: 'Coiffeur proche de moi',      rank: 2,  change: +14, achieved: true,  badge: 'Top 3 atteint 🎉' },
  { keyword: 'Salon de coiffure La Rochelle', rank: 1, change: +21, achieved: true,  badge: 'N°1 local 🥇' },
  { keyword: 'Coiffeur pas cher La Rochelle', rank: 5, change: +8,  achieved: false, badge: 'Progression : +8 places' },
];

function GeoGridSection() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border bg-muted/20">
        <MapPin size={14} className="text-primary" />
        <span className="text-sm font-bold text-foreground">Évolution du Rangement Local</span>
        <span className="ml-auto text-[10px] text-muted-foreground">3 mots-clés principaux</span>
      </div>
      <div className="divide-y divide-border">
        {GEO_KEYWORDS.map((kw, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/20 transition-colors">
            {/* Rank */}
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-extrabold ${
              kw.rank <= 3
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                : 'bg-muted text-muted-foreground'
            }`}>
              {kw.rank}
            </div>

            {/* Keyword */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{kw.keyword}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Position actuelle</p>
            </div>

            {/* Change */}
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 shrink-0">
              <TrendingUp size={11} />
              +{kw.change} places
            </div>

            {/* Badge */}
            <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold shrink-0 ${
              kw.achieved
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
            }`}>
              {kw.achieved ? <CheckCircle2 size={10} /> : <TrendingUp size={10} />}
              {kw.badge}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Posts table ───────────────────────────────────────────────────────────────

const latestPosts = [
  { id: '1', title: 'Lancement du nouveau produit',       status: 'Publié',    date: '2024-05-15', platform: 'LinkedIn'  },
  { id: '2', title: 'Conseils pour les PME en 2024',      status: 'Planifié',  date: '2024-05-20', platform: 'Instagram' },
  { id: '3', title: 'Recrutement : Nous recherchons !',   status: 'Brouillon', date: '2024-05-22', platform: 'Facebook'  },
];

const postColumns = [
  { accessorKey: 'title',    header: 'Titre' },
  {
    accessorKey: 'status',
    header: 'Statut',
    cell: ({ row }: any) => {
      const s = row.getValue('status');
      const v = s === 'Publié' ? 'default' : s === 'Planifié' ? 'secondary' : 'outline';
      return <Badge variant={v as any}>{s}</Badge>;
    },
  },
  { accessorKey: 'date',     header: 'Date' },
  { accessorKey: 'platform', header: 'Plateforme' },
];

// ── Engaging empty state ──────────────────────────────────────────────────────

function ROISyncEmptyState() {
  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-teal-500/3 to-primary/5 overflow-hidden">
      <div className="flex flex-col items-center justify-center gap-4 px-6 py-10 text-center">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles size={24} className="text-primary" />
          </div>
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 flex items-center justify-center text-[10px]">🔍</span>
        </div>
        <div className="space-y-2 max-w-sm">
          <p className="text-sm font-extrabold text-foreground leading-snug">
            Votre Copilote IA analyse votre secteur...
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Vos premières statistiques ROI, appels générés et positions Google Maps apparaîtront ici d'ici{' '}
            <strong className="text-foreground">24 heures</strong> après la connexion de votre fiche Google Business.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <Link
            to="/guide"
            className="flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold px-4 py-2 hover:bg-primary/90 active:scale-[0.98] transition-all shadow-sm"
          >
            📋 Compléter mon Guide de démarrage <ArrowRight size={12} />
          </Link>
          <Link
            to="/google-maps"
            className="flex items-center gap-1.5 rounded-xl border border-border bg-card text-xs font-semibold text-foreground px-4 py-2 hover:bg-muted transition-colors"
          >
            🗺️ Connecter Google Business
          </Link>
        </div>
      </div>
      {/* Animated progress bar */}
      <div className="h-0.5 bg-muted overflow-hidden">
        <div className="h-full bg-gradient-to-r from-primary via-teal-400 to-primary animate-pulse" style={{ width: '60%' }} />
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

function AnalyticsROITabContent() {
  const { isDemoActive, demoData } = useDemoMode();

  return (
    <div className="space-y-6">
      {/* Block 1 — ROI Global (demo only) or empty state */}
      {isDemoActive ? <ROIKPISection /> : <ROISyncEmptyState />}

      {/* Block 2 — GeoGrid simplifié (demo only) */}
      {isDemoActive && <GeoGridSection />}

      {/* AI Performance Insights */}
      <TabErrorBoundary>
        <AIPerformanceInsights />
      </TabErrorBoundary>

      {/* ROI + AI Advisor */}
      <TabErrorBoundary>
        <ROIWidget />
      </TabErrorBoundary>
      <TabErrorBoundary>
        <AIROIAdvisor />
      </TabErrorBoundary>

      {/* KPI cards */}
      <TabErrorBoundary>
        <div data-tour="kpi-cards">
          <KPICards />
        </div>
      </TabErrorBoundary>

      {/* Charts grid */}
      <TabErrorBoundary>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <PostPerformanceWidget />
          <InboxOverviewWidget />
        </div>
      </TabErrorBoundary>

      {/* Segment performance */}
      <TabErrorBoundary>
        <SegmentPerformanceDashboard />
      </TabErrorBoundary>

      {/* Publications table */}
      <Card className="shadow-sm border-border/50">
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Calendar size={14} className="text-primary" />
            Dernières publications
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-xs h-7">Voir tout</Button>
        </CardHeader>
        <CardContent className="pt-0">
          <TabErrorBoundary>
            <DataTable
              columns={postColumns}
              data={isDemoActive
                ? demoData.posts.map((p: any) => ({
                    id: p.id, title: p.title, status: p.status,
                    date: p.date, platform: p.platform,
                  }))
                : latestPosts
              }
            />
          </TabErrorBoundary>
        </CardContent>
      </Card>
    </div>
  );
}

export function AnalyticsROITab() {
  return (
    <TabErrorBoundary>
      <AnalyticsROITabContent />
    </TabErrorBoundary>
  );
}
