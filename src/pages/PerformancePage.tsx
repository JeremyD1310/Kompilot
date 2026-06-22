import { Page, PageHeader, PageTitle, PageBody, PageDescription } from '@blinkdotnew/ui';
import { useState, useEffect } from 'react';
import { ReviewsTab } from '../components/inbox/ReviewsTab';
import { GAConnectionSection } from '../components/analytics/GAConnectionSection';
import { DMSimulatorSection } from '../components/analytics/DMSimulatorSection';
import { TrendingUp, Star, BarChart2, Megaphone, Radar, Clock, Gift } from 'lucide-react';
import { LoyaltyReferralPanel } from '../components/loyalty/LoyaltyReferralPanel';
import { AIPerformanceInsights } from '../components/dashboard/AIPerformanceInsights';
import { AIPostGeneratorFromInsights } from '../components/dashboard/AIPostGeneratorFromInsights';
import { SmartPostStudio } from '../components/performance/SmartPostStudio';
import { AdCampaignsSection } from '../components/ads/AdCampaignsSection';
import { OptimalPostingTimes } from '../components/performance/OptimalPostingTimes';
import { LocalRadarTab } from '../components/performance/LocalRadarTab';
import { BookingPlatformClicksWidget } from '../components/performance/BookingPlatformClicksWidget';
import { ROIBusinessSection } from '../components/performance/ROIBusinessSection';
import {
  getBookingClicks,
  getMonthlyClicksTotal,
  estimateReservations,
  estimateRevenue,
  getAverageBasket,
} from '../lib/bookingClickTracker';

// ── Tab button ────────────────────────────────────────────────────────────────
function TabBtn({
  active,
  onClick,
  icon: Icon,
  label,
  highlight,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
        active
          ? highlight
            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_0_16px_rgba(34,197,94,0.3)]'
            : 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted'
      }`}
    >
      <Icon size={15} />
      {label}
      {highlight && !active && (
        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      )}
    </button>
  );
}

// ── ROI KPI cards — connected to real booking tracker data ────────────────────

export default function PerformancePage() {
  const [tab, setTab] = useState<'roi' | 'analytics' | 'reviews' | 'radar' | 'ads' | 'horaires' | 'fidelisation'>('roi');
  const [roiInfoOpen, setRoiInfoOpen] = useState(false);

  // Handle ?tab=analytics URL param (from AIPerformanceInsights "Générer un post" CTA)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'analytics') {
      setTab('analytics');
      setTimeout(() => {
        const el = document.getElementById('post-generator');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 400);
    }
  }, []);

  // Real booking click data
  const [totalClicks, setTotalClicks] = useState(0);
  const [monthlyClicks, setMonthlyClicks] = useState(0);

  const refreshKpis = () => {
    setTotalClicks(getBookingClicks());
    setMonthlyClicks(getMonthlyClicksTotal());
  };

  useEffect(() => {
    refreshKpis();
    window.addEventListener('kompilot:booking-click', refreshKpis);
    return () => window.removeEventListener('kompilot:booking-click', refreshKpis);
  }, []);

  const reservations = estimateReservations(monthlyClicks);
  const revenue = estimateRevenue(reservations, getAverageBasket());

  const ROI_KPIS = [
    {
      emoji: '💶',
      label: 'Chiffre d\'affaires estimé',
      value: revenue > 0 ? `${revenue.toLocaleString('fr-FR')} €` : '—',
      hint: revenue === 0 ? 'Activez les boutons de réservation dans le Cockpit IA' : null,
    },
    {
      emoji: '👥',
      label: 'Réservations générées',
      value: reservations > 0 ? `${reservations} rendez-vous` : '—',
      hint: null,
    },
    {
      emoji: '🔗',
      label: 'Clics sur le lien de réservation',
      value: monthlyClicks > 0 ? `${monthlyClicks} clic${monthlyClicks > 1 ? 's' : ''}` : '—',
      hint: monthlyClicks === 0 ? `${totalClicks > 0 ? `${totalClicks} clics au total` : 'Aucun clic tracké'}` : null,
    },
  ];

  return (
    <Page>
      <PageHeader>
        <PageTitle>Performance & Avis 📊</PageTitle>
        <PageDescription>Suivez votre ROI, statistiques et gérez vos avis Google depuis un seul endroit.</PageDescription>
      </PageHeader>
      <PageBody>
        {/* Tab switcher */}
        <div className="flex gap-2 mb-6 border-b border-border pb-4 flex-wrap">
          <TabBtn
            active={tab === 'roi'}
            onClick={() => setTab('roi')}
            icon={TrendingUp}
            label="ROI & Google Analytics"
            highlight
          />
          <TabBtn
            active={tab === 'analytics'}
            onClick={() => setTab('analytics')}
            icon={BarChart2}
            label="Statistiques réseaux"
          />
          <TabBtn
            active={tab === 'reviews'}
            onClick={() => setTab('reviews')}
            icon={Star}
            label="Avis Google"
          />
          <TabBtn
            active={tab === 'radar'}
            onClick={() => setTab('radar')}
            icon={Radar}
            label="Radar Local 🛰️"
            highlight
          />
          <TabBtn
            active={tab === 'ads'}
            onClick={() => setTab('ads')}
            icon={Megaphone}
            label="Publicité locale 🚀"
            highlight
          />
          <TabBtn
            active={tab === 'horaires'}
            onClick={() => setTab('horaires')}
            icon={Clock}
            label="Horaires IA ⏰"
            highlight
          />
          <TabBtn
            active={tab === 'fidelisation'}
            onClick={() => setTab('fidelisation')}
            icon={Gift}
            label="Fidélisation 🎁"
            highlight
          />
        </div>

        {/* ── ROI tab — GA4 connection + neon counters ── */}
        {tab === 'roi' && (
          <div className="space-y-6">
            {/* ── Business Conversion KPIs + CA Estimator + WhatsApp ── */}
            <ROIBusinessSection />

            {/* ── Divider ── */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Suivi réservations</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* ── KPI cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {ROI_KPIS.map((kpi) => (
                <div
                  key={kpi.label}
                  className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-2 hover:border-emerald-500/30 hover:shadow-md transition-all"
                >
                  <p className="text-sm text-muted-foreground leading-snug">
                    {kpi.emoji}&nbsp; {kpi.label}
                  </p>
                  <p className={`text-3xl font-black tabular-nums ${kpi.value === '—' ? 'text-muted-foreground/50' : 'text-emerald-500'}`}>
                    {kpi.value}
                  </p>
                  {kpi.hint && (
                    <p className="text-[10px] text-muted-foreground leading-snug">{kpi.hint}</p>
                  )}
                </div>
              ))}
            </div>

            {/* ── Booking platform click tracker ── */}
            <BookingPlatformClicksWidget />

            {/* ── ROI method explainer ── */}
            <div>
              <button
                onClick={() => setRoiInfoOpen((v) => !v)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2 decoration-dashed"
              >
                Comment ce résultat est-il calculé ?&nbsp;ℹ️
              </button>
              {roiInfoOpen && (
                <div className="mt-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-800 space-y-1.5">
                  <p>
                    <strong>Méthode A (GA4 Connecté) :</strong> Suivi précis des clics convertis en réservations réelles.
                  </p>
                  <p>
                    <strong>Méthode B (Tracking Interne) :</strong> Calcul basé sur un taux de conversion standard de 15% des clics et votre panier moyen configuré à l&apos;onboarding.
                  </p>
                </div>
              )}
            </div>

            <GAConnectionSection />

            {/* Smart Post Studio — idea + performance context → 3 platform posts */}
            <SmartPostStudio
              performanceContext={{
                topPlatform: 'Instagram',
                bestPostTitle: 'Meilleur post du mois',
                engagementRate: 6.6,
                reach: monthlyClicks > 0 ? monthlyClicks * 50 : 5000,
                posts: 8,
                topEngagementDay: 'Mercredi',
              }}
            />

            {/* DM Automatiques simulator */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <DMSimulatorSection />
            </div>

            {/* UTM explanation cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  emoji: '🔗',
                  title: 'Tags UTM automatiques',
                  desc: 'Chaque bouton de réservation (Planity, ZenChef, TheFork) est tagué UTM pour tracker la source.',
                },
                {
                  emoji: '📍',
                  title: 'Trafic Google Maps',
                  desc: 'Identifie les nouveaux clients qui vous découvrent via Google Maps et vos fiches locales.',
                },
                {
                  emoji: '🤖',
                  title: 'Attribution IA',
                  desc: 'Kompilot calcule précisément le CA généré par chaque post publié grâce à l\'IA.',
                },
              ].map(card => (
                <div
                  key={card.title}
                  className="rounded-2xl border border-border bg-card px-5 py-4 space-y-2 hover:border-primary/30 hover:shadow-sm transition-all"
                >
                  <span className="text-xl">{card.emoji}</span>
                  <p className="text-sm font-bold text-foreground">{card.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Analytics tab — social reach stats only (no bounce rate / sessions) ── */}
        {tab === 'analytics' && <SocialStatsTab />}

        {/* ── Radar Local tab ── */}
        {tab === 'radar' && <LocalRadarTab />}

        {/* ── Ads tab ── */}
        {tab === 'ads' && <AdCampaignsSection />}

        {/* ── Reviews tab ── */}
        {tab === 'reviews' && <ReviewsTab />}

        {/* ── Horaires IA tab ── */}
        {tab === 'horaires' && <OptimalPostingTimes />}

        {/* ── Fidélisation & Parrainage tab ── */}
        {tab === 'fidelisation' && (
          <LoyaltyReferralPanel />
        )}
      </PageBody>
    </Page>
  );
}

// ── Social stats tab (trimmed — no bounce rate / sessions / users active) ─────
function SocialStatsTab() {
  // Stable mock data
  const KPI_CARDS = [
    {
      id: 'visibility',
      emoji: '👁️',
      label: 'Visibilité',
      sublabel: 'Portée totale',
      value: '12 840',
      change: '+18%',
      trend: 'up',
      bgLight: 'bg-teal-50 border-teal-200',
      textColor: 'text-teal-700',
      desc: 'Personnes qui ont vu vos posts ce mois-ci',
    },
    {
      id: 'engagement',
      emoji: '❤️',
      label: 'Engagement',
      sublabel: 'Likes & Abonnés',
      value: '847',
      change: '+12%',
      trend: 'up',
      bgLight: 'bg-pink-50 border-pink-200',
      textColor: 'text-pink-700',
      desc: 'Interactions totales sur tous vos réseaux',
    },
    {
      id: 'actions',
      emoji: '🖱️',
      label: 'Actions Clients',
      sublabel: 'Clics & Conversions',
      value: '234',
      change: '+31%',
      trend: 'up',
      bgLight: 'bg-violet-50 border-violet-200',
      textColor: 'text-violet-700',
      desc: 'Clics vers téléphone, itinéraire ou réservation',
    },
  ];

  const weeklyPubs = [
    { week: 'Semaine 1', count: 8, platform: 'Instagram' },
    { week: 'Semaine 2', count: 7, platform: 'LinkedIn' },
    { week: 'Semaine 3', count: 9, platform: 'Instagram' },
    { week: 'Semaine 4', count: 10, platform: 'Facebook' },
  ];

  const topPosts = [
    { title: '🍕 Plat du jour : Tajine d\'agneau confit', platform: 'Instagram', reach: '3 240', engagement: '8.2%' },
    { title: '🏡 Nouvelle propriété disponible à Bordeaux', platform: 'Facebook', reach: '2 180', engagement: '5.1%' },
    { title: '✨ Soldes printemps — jusqu\'à -40%', platform: 'LinkedIn', reach: '1 920', engagement: '6.4%' },
    { title: '🎉 Anniversaire 5 ans !', platform: 'Instagram', reach: '4 100', engagement: '11.3%' },
  ];

  return (
    <div className="space-y-6">
      {/* AI Performance Insights */}
      <AIPerformanceInsights
        data={{
          reach: 12840,
          reachChange: 18,
          views: 12840,
          viewsChange: 18,
          engagement: 6.6,
          engagementChange: 12,
          posts: 8,
          bestPost: { title: '🎉 Anniversaire 5 ans', platform: 'Instagram', engagementRate: '11.3%' },
          topPlatform: 'Instagram',
          weeklyFrequency: 2,
        }}
      />

      {/* Smart Post Studio — idea input + performance context → 3 platform posts */}
      <div id="post-generator">
        <SmartPostStudio
          performanceContext={{
            topPlatform: 'Instagram',
            bestPostTitle: '🎉 Anniversaire 5 ans',
            engagementRate: 6.6,
            reach: 12840,
            posts: 8,
            topEngagementDay: 'Mercredi',
            reachTrend: 'up',
          }}
        />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {KPI_CARDS.map(kpi => (
          <div
            key={kpi.id}
            className={`rounded-2xl border p-5 ${kpi.bgLight} transition-all hover:shadow-md hover:-translate-y-0.5`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-2xl mb-0.5">{kpi.emoji}</p>
                <p className={`text-xs font-bold uppercase tracking-wide ${kpi.textColor}`}>{kpi.label}</p>
                <p className="text-[10px] text-muted-foreground">{kpi.sublabel}</p>
              </div>
              <span className={`flex items-center gap-1 rounded-full text-[10px] font-bold px-2 py-0.5 ${
                kpi.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {kpi.trend === 'up' ? '↑' : '↓'} {kpi.change}
              </span>
            </div>
            <p className="text-3xl font-extrabold text-foreground">{kpi.value}</p>
            <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{kpi.desc}</p>
          </div>
        ))}
      </div>

      {/* Top posts table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-sm font-extrabold text-foreground">🏆 Top publications du mois</p>
          <p className="text-xs text-muted-foreground mt-0.5">Classées par portée organique</p>
        </div>
        <div className="divide-y divide-border">
          {topPosts.map((post, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/30 transition-colors">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[11px] font-extrabold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <p className="flex-1 text-sm text-foreground truncate">{post.title}</p>
              <span className="text-[10px] font-bold text-muted-foreground bg-muted rounded-full px-2 py-0.5 shrink-0">
                {post.platform}
              </span>
              <span className="text-xs font-bold text-foreground tabular-nums shrink-0 w-16 text-right">
                {post.reach}
              </span>
              <span className="text-xs font-bold text-green-600 tabular-nums shrink-0 w-14 text-right">
                {post.engagement}
              </span>
            </div>
          ))}
        </div>
        <div className="px-5 py-2 border-t border-border bg-muted/20 flex justify-between text-[10px] text-muted-foreground">
          <span>Post</span>
          <div className="flex gap-8 pr-1">
            <span>Portée</span>
            <span>Taux d'eng.</span>
          </div>
        </div>
      </div>

      {/* Weekly publications */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-sm font-extrabold text-foreground">📅 Publications par semaine</p>
        </div>
        <div className="px-5 py-4 grid grid-cols-4 gap-3">
          {weeklyPubs.map((w) => (
            <div key={w.week} className="flex flex-col items-center gap-2">
              <div className="w-full bg-muted/40 rounded-xl overflow-hidden h-24 flex items-end">
                <div
                  className="w-full rounded-t-xl bg-primary/80 transition-all"
                  style={{ height: `${(w.count / 10) * 100}%` }}
                />
              </div>
              <p className="text-[10px] font-bold text-muted-foreground text-center">{w.week.replace('Semaine ', 'S')}</p>
              <p className="text-sm font-extrabold text-foreground">{w.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Hint to switch to ROI tab */}
      <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4">
        <TrendingUp size={16} className="text-primary shrink-0" />
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Envie de voir votre CA ?</strong>{' '}
          Connectez Google Analytics dans l'onglet <strong>ROI & Google Analytics</strong> pour traduire ces stats en chiffre d'affaires réel.
        </p>
      </div>
    </div>
  );
}
