/**
 * GrowthPage — Accélérateur de Croissance
 *
 * Layout rules:
 *   • Agency / Premium (business | franchise) : bottom row = 2-column grid
 *     [Le Parcours Client Viral] | [Pipeline Agence — Whitelabel]
 *   • Solo (starter) : Pipeline Agence hidden,
 *     "Le Parcours Client Viral" stretches to full width.
 */
import { Page, PageHeader, PageTitle, PageDescription, PageBody } from '@blinkdotnew/ui';
import { Target, Code2, Gift, Store, Lock } from 'lucide-react';
import { useEstablishment } from '../context/EstablishmentContext';
import { usePlan } from '../hooks/usePlan';

// ── Section components ────────────────────────────────────────────────────────
import { GrowthSeoSection }     from '../components/growth/GrowthSeoSection';
import { GrowthSeaSection }     from '../components/growth/GrowthSeaSection';
import { GrowthHackingSection } from '../components/growth/GrowthHackingSection';
import { BeforeAfterComparator } from '../components/growth/BeforeAfterComparator';
import { AntiVideEngine }       from '../components/growth/anti-vide/AntiVideEngine';
import { ActiveAudienceEngine } from '../components/growth/active-audience/ActiveAudienceEngine';
import { ABTestingEngine }      from '../components/growth/ABTestingEngine';
import { GrowthFunnelsCatalog } from '../components/growth/GrowthFunnelsCatalog';
import { EmbedWidgetGenerator } from '../components/website/EmbedWidgetGenerator';
import { ReferralGrowthBadges } from '../components/loyalty/ReferralGrowthBadges';
import { AgencyGrowthLoopPanel } from '../components/loyalty/AgencyGrowthLoopPanel';
import { KompilotIndexWidget } from '../components/growth/KompilotIndexWidget';
import { MarginOptimizerWidget } from '../components/growth/MarginOptimizerWidget';
import { SectorTrendReportExporter } from '../components/agency/SectorTrendReportExporter';

// ── Dark section wrapper ──────────────────────────────────────────────────────
function DarkPanel({
  icon: Icon, iconColor, borderColor, title, subtitle, children, className = '',
}: {
  icon: React.ElementType; iconColor: string; borderColor: string;
  title: string; subtitle: string; children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border ${borderColor} bg-gradient-to-br from-[#0F172A] to-[#1E293B] p-5 space-y-4 shadow-lg ${className}`}>
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl ${iconColor} flex items-center justify-center shrink-0`}>
          <Icon size={18} className="opacity-80" style={{ color: 'currentColor' }} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white">{title}</h2>
          <p className="text-[11px] text-slate-400">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

// ── Upgrade nudge for Solo users ───────────────────────────────────────────────
function AgencyUpgradeTeaser() {
  return (
    <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-[#0F172A] to-[#1E293B] p-5 space-y-3 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-400 flex items-center justify-center shrink-0">
          <Store size={18} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white">Pipeline Agence — Sous-Comptes WhiteLabel</h2>
          <p className="text-[11px] text-slate-400">Activez les Growth Loops indépendants pour chaque enseigne gérée</p>
        </div>
      </div>

      {/* Blurred preview */}
      <div className="relative rounded-xl overflow-hidden">
        <div className="space-y-2 blur-[3px] pointer-events-none select-none opacity-50">
          {['Restaurant Le Bistrot', 'Salon Coiffure & Beauté', 'Boulangerie Artisanale'].map(name => (
            <div key={name} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-700/50 bg-slate-800/30">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-xs font-bold text-white">🏪</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{name}</p>
                <p className="text-[10px] text-slate-400">Sous-compte</p>
              </div>
              <div className="h-7 w-14 rounded-lg bg-slate-700/50 border border-slate-600" />
            </div>
          ))}
        </div>

        {/* Lock overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 bg-[#0F172A]/80 backdrop-blur-sm rounded-2xl px-6 py-5 border border-violet-500/30 text-center max-w-xs">
            <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
              <Lock size={18} className="text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-white leading-tight">Réservé aux comptes Agency & Premium</p>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Gérez plusieurs enseignes en Whitelabel avec des Growth Loops indépendants par sous-compte.
              </p>
            </div>
            <a
              href="/subscription"
              className="flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-4 py-2 transition-colors shadow-sm"
            >
              Passer en offre Agency ✨
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function GrowthPage() {
  const { activeEstablishment } = useEstablishment();
  const { name, address, category, bookingUrl = '' } = activeEstablishment;
  const city = address.split(',').pop()?.trim() ?? 'votre ville';

  const { isStarter, isBusiness, isFranchise } = usePlan();
  // Show Agency panel for Premium (business) or Agency (franchise) tiers
  const showAgencyPanel = isBusiness || isFranchise;

  return (
    <Page>
      <PageHeader>
        <div>
          <PageTitle className="flex items-center gap-2">
            <Target size={22} className="text-primary" />
            Accélérateur de Croissance 🚀
          </PageTitle>
          <PageDescription>
            SEO local, publicité ciblée, growth hacking, embed viral & pipeline agence pour booster {name} à {city}.
          </PageDescription>
        </div>
      </PageHeader>

      <PageBody className="space-y-6 max-w-5xl">
        {/* ── Kompilot Index Benchmark ── */}
        <KompilotIndexWidget />

        {/* ── Margin Optimizer — Saturation & Pricing Engine ── */}
        <MarginOptimizerWidget />

        {/* ── Active Audience Engine ── */}
        <ActiveAudienceEngine />

        {/* ── Catalog of Automated Growth Funnels ── */}
        <GrowthFunnelsCatalog />

        {/* ── Growth Anti-Vide Engine ── */}
        <AntiVideEngine name={name} city={city} />

        <BeforeAfterComparator />

        {/* Existing sections */}
        <GrowthSeoSection name={name} city={city} activity={category} bookingUrl={bookingUrl} />
        <GrowthSeaSection name={name} bookingUrl={bookingUrl} />
        <GrowthHackingSection name={name} bookingUrl={bookingUrl} />

        {/* ── A/B Testing Engine ── */}
        <ABTestingEngine />

        {/* ── Widget Embed Viral — Lead Magnet ── */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border bg-muted/20">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <Code2 size={16} className="text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Lead Magnet — Scan GEO Gratuit Public</h2>
              <p className="text-[11px] text-muted-foreground">
                Générez votre code d'intégration viral avec filigrane affilié automatique
              </p>
            </div>
          </div>
          <div className="p-5">
            <EmbedWidgetGenerator />
          </div>
        </div>

        {/* ── Bottom row: Viral Journey + Agency Pipeline ──────────────────────
            Layout:
              Agency/Premium → 2-col grid (Viral left, Agency right)
              Solo           → Viral full-width, Agency replaced by locked teaser
        ────────────────────────────────────────────────────────────────────── */}
        <div className={
          showAgencyPanel
            ? 'grid grid-cols-1 lg:grid-cols-2 gap-5 items-start'
            : 'space-y-6'
        }>
          {/* ── Le Parcours Client Viral — always visible ── */}
          <DarkPanel
            icon={Gift}
            iconColor="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
            borderColor="border-emerald-500/20"
            title="Le Parcours Client Viral — Badges & Récompenses"
            subtitle="Transformez vos meilleurs clients en ambassadeurs de votre marque"
            className={showAgencyPanel ? '' : 'w-full'}
          >
            <ReferralGrowthBadges />
          </DarkPanel>

          {/* ── Pipeline Agence — Agency/Premium only ── */}
          {showAgencyPanel ? (
            <DarkPanel
              icon={Store}
              iconColor="bg-violet-500/20 border border-violet-500/30 text-violet-400"
              borderColor="border-violet-500/20"
              title="Pipeline Agence — Sous-Comptes WhiteLabel"
              subtitle="Activez les Growth Loops indépendants pour chaque enseigne gérée"
            >
              <AgencyGrowthLoopPanel />
              <div className="pt-2">
                <SectorTrendReportExporter />
              </div>
            </DarkPanel>
          ) : (
            /* Solo: show locked teaser with upgrade CTA */
            <AgencyUpgradeTeaser />
          )}
        </div>
      </PageBody>
    </Page>
  );
}
