/**
 * AdAuditPage — Performance Publicitaire & Audit GA4
 *
 * Analyse croisée dépenses publicitaires × données GA4.
 * 5 sections : ROAS Réel vs MER · Tracking Audit · Funnel Diagnostic · Synthèse · Plan d'Action 48h
 */

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Page, PageHeader, PageTitle, PageBody, Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Badge, Skeleton, cn } from '@blinkdotnew/ui'
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Target,
  BarChart3, Eye, Zap, DollarSign, Activity, RefreshCw, FileText,
  ArrowRight, ShieldAlert, Gauge, Users, MousePointerClick,
} from 'lucide-react'
import { useCpcData, useGenerateAudit, type AuditRequest, type AuditResult } from '@/hooks/useAdAudit'
import { trackEvent, setAdAuditDimensions } from '@/hooks/useAnalytics'

// ── KPI Card ───────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, color = 'primary',
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; color?: string
}) {
  const colors: Record<string, string> = {
    primary:  'bg-primary/10 text-primary',
    green:    'bg-emerald-500/10 text-emerald-500',
    red:      'bg-red-500/10 text-red-500',
    amber:    'bg-amber-500/10 text-amber-500',
    blue:     'bg-blue-500/10 text-blue-500',
    violet:   'bg-violet-500/10 text-violet-500',
  }
  return (
    <Card className="border border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', colors[color])}>
            <Icon size={16} />
          </div>
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

// ── Section Card ───────────────────────────────────────────────────────────────

function AuditSection({
  number, title, icon: Icon, children, severity,
}: {
  number: number; title: string; icon: React.ElementType;
  children: React.ReactNode; severity?: 'info' | 'warning' | 'danger' | 'success'
}) {
  const borderColors: Record<string, string> = {
    info:    'border-l-blue-500',
    warning: 'border-l-amber-500',
    danger:  'border-l-red-500',
    success: 'border-l-emerald-500',
  }
  return (
    <Card className={cn('border border-border/50 border-l-4', severity ? borderColors[severity] : 'border-l-primary')}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
            {number}
          </div>
          <div className="flex items-center gap-2">
            <Icon size={18} className="text-primary" />
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  )
}

// ── Alert Badge ────────────────────────────────────────────────────────────────

function AlertBadge({ type, children }: { type: 'success' | 'warning' | 'danger' | 'info'; children: React.ReactNode }) {
  const styles: Record<string, string> = {
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    danger:  'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    info:    'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  }
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border', styles[type])}>
      {children}
    </span>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AdAuditPage() {
  // Form state
  const [form, setForm] = useState<AuditRequest>({
    sector: '',
    adChannels: 'Meta Ads, Google Ads',
    adSpend: 5000,
    targetRoas: 3.5,
    displayedRoas: '',
    cpcTrend: '',
    churnRate: '',
    ltv: '',
  })

  // GA4 preview
  const { data: cpcData, isLoading: cpcLoading, error: cpcError } = useCpcData()

  // Audit generation
  const { mutate: generateAudit, data: audit, isPending: auditLoading, error: auditError } = useGenerateAudit()

  // ── GA4 Event Tracking ─────────────────────────────────────────────────────

  // Track page view on mount
  useEffect(() => {
    trackEvent('ad_audit_page_view', { page_path: '/ad-audit' })
  }, [])

  // Track CPC data load result
  useEffect(() => {
    if (cpcData) {
      trackEvent('ad_audit_cpc_data_loaded', {
        cpc_sessions: cpcData.cpcSessions,
        cpc_engagement_rate: cpcData.cpcEngagementRate,
        cpc_conversions: cpcData.cpcConversions,
        cpc_revenue: cpcData.cpcRevenue,
        sources_count: cpcData.sources.length,
      })
    }
  }, [cpcData])

  useEffect(() => {
    if (cpcError) {
      trackEvent('ad_audit_cpc_data_error', {
        error_message: cpcError instanceof Error ? cpcError.message : 'unknown',
        ad_audit_error_code: 'cpc_data_fetch_failed',
      })
    }
  }, [cpcError])

  // Track audit generation result with custom dimensions
  useEffect(() => {
    if (audit) {
      // Derive ROAS status for custom dimension
      let roasStatus: string
      if (audit.computed.realRoas >= audit.inputs.targetRoas) {
        roasStatus = 'above_target'
      } else if (audit.computed.realRoas >= audit.inputs.targetRoas * 0.5) {
        roasStatus = 'below_target'
      } else {
        roasStatus = 'critical'
      }

      trackEvent('ad_audit_generate_success', {
        // Custom dimensions (must match GA4 Admin → Custom Definitions)
        ad_audit_sector: audit.inputs.sector,
        ad_audit_channels: audit.inputs.adChannels,
        ad_audit_roas_status: roasStatus,
        // Metrics
        ad_spend: audit.inputs.adSpend,
        target_roas: audit.inputs.targetRoas,
        real_roas: audit.computed.realRoas,
        mer: audit.computed.mer,
        conversion_rate: audit.computed.conversionRate,
        cpa: audit.computed.cpa,
        cpc_sessions: audit.ga4.cpcSessions,
        cpc_engagement_rate: audit.ga4.cpcEngagementRate,
        cpc_conversions: audit.ga4.cpcConversions,
        cpc_revenue: audit.ga4.cpcRevenue,
      })
    }
  }, [audit])

  // Track audit generation errors
  useEffect(() => {
    if (auditError) {
      const errorMsg = auditError instanceof Error ? auditError.message : 'unknown'
      // Parse API error code from the message if present (e.g. "API 503: {...}")
      const codeMatch = errorMsg.match(/API\s+\d+:\s*(.*)/s)
      let errorDetail = errorMsg
      if (codeMatch) {
        try {
          const parsed = JSON.parse(codeMatch[1])
          errorDetail = parsed.error || parsed.code || codeMatch[1].slice(0, 200)
        } catch {
          errorDetail = codeMatch[1].slice(0, 200)
        }
      }

      trackEvent('ad_audit_generate_error', {
        ad_audit_sector: form.sector,
        ad_audit_channels: form.adChannels,
        ad_audit_error_code: 'audit_generation_failed',
        error_message: errorDetail.slice(0, 500),
        ad_spend: form.adSpend,
        target_roas: form.targetRoas,
      })
    }
  }, [auditError, form.sector, form.adChannels, form.adSpend, form.targetRoas])

  // ── Form & Actions ──────────────────────────────────────────────────────────

  const handleGenerate = useCallback(() => {
    // Set GA4 custom dimensions for sector & channels (persists for subsequent events)
    setAdAuditDimensions({ sector: form.sector, channels: form.adChannels })

    // Derive ROAS status from CPC data if available
    let roasStatus = 'pending'
    if (cpcData && form.adSpend > 0) {
      const estimatedRoas = cpcData.cpcRevenue / form.adSpend
      roasStatus = estimatedRoas >= form.targetRoas ? 'above_target' : estimatedRoas >= form.targetRoas * 0.5 ? 'below_target' : 'critical'
    }

    trackEvent('ad_audit_generate_click', {
      // Custom dimensions
      ad_audit_sector: form.sector,
      ad_audit_channels: form.adChannels,
      ad_audit_roas_status: roasStatus,
      // Form context
      ad_spend: form.adSpend,
      target_roas: form.targetRoas,
      has_displayed_roas: !!form.displayedRoas,
      has_cpc_trend: !!form.cpcTrend,
      has_churn_rate: !!form.churnRate,
      has_ltv: !!form.ltv,
    })
    generateAudit(form)
  }, [form, generateAudit, cpcData])

  // ── Diagnostic logic ─────────────────────────────────────────────────────────
  const diagnosis = useMemo(() => {
    if (!audit) return null

    const { computed, ga4, inputs } = audit
    const issues: { severity: 'danger' | 'warning' | 'info' | 'success'; text: string }[] = []

    // 1. ROAS check
    if (computed.realRoas < inputs.targetRoas * 0.5) {
      issues.push({ severity: 'danger', text: `ROAS réel (${computed.realRoas}x) critique — inférieur à la moitié du seuil de rentabilité (${inputs.targetRoas}x).` })
    } else if (computed.realRoas < inputs.targetRoas) {
      issues.push({ severity: 'warning', text: `ROAS réel (${computed.realRoas}x) en dessous du break-even (${inputs.targetRoas}x).` })
    }

    // 2. Engagement check
    if (ga4.cpcEngagementRate < 40) {
      issues.push({ severity: 'danger', text: `Taux d'engagement CPC très bas (${ga4.cpcEngagementRate}%) — trafic peu qualifié ou landing page inadaptée.` })
    } else if (ga4.cpcEngagementRate < 55) {
      issues.push({ severity: 'warning', text: `Taux d'engagement CPC moyen (${ga4.cpcEngagementRate}%) — amélioration possible.` })
    }

    // 3. Conversion rate check
    if (computed.conversionRate < 1) {
      issues.push({ severity: 'danger', text: `Taux de conversion CPC faible (${computed.conversionRate}%) — friction majeure dans le funnel.` })
    }

    // 4. CPC trend + engagement combo
    if (inputs.cpcTrend?.includes('+') && ga4.cpcEngagementRate < 50) {
      issues.push({ severity: 'danger', text: `CPC en hausse + engagement en baisse = Fatigue créative confirmée. Renouveler les visuels d'urgence.` })
    }

    // 5. CPA check
    if (inputs.ltv && computed.cpa > 0) {
      const ltvNum = parseFloat(inputs.ltv.replace(/[^\d.]/g, ''))
      if (!isNaN(ltvNum) && computed.cpa > ltvNum * 0.3) {
        issues.push({ severity: 'warning', text: `CPA (${computed.cpa.toFixed(0)}€) représente ${(computed.cpa / ltvNum * 100).toFixed(0)}% de la LTV — marge sous pression.` })
      }
    }

    // 6. MER check
    if (computed.mer < 2) {
      issues.push({ severity: 'warning', text: `MER global (${computed.mer}x) faible — la rentabilité globale est fragile.` })
    }

    if (issues.length === 0) {
      issues.push({ severity: 'success', text: 'Aucun signal d\'alerte majeur détecté. Performance globale saine.' })
    }

    return issues
  }, [audit])

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Page>
      <PageHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 size={20} className="text-primary" />
            </div>
            <div>
              <PageTitle>Audit Publicitaire & GA4</PageTitle>
              <p className="text-sm text-muted-foreground">Analyse croisée dépenses × données comportementales</p>
            </div>
          </div>
          {cpcData && (
            <Badge variant="outline" className="text-xs">
              GA4 connecté · {cpcData.totalSiteSessions.toLocaleString()} sessions
            </Badge>
          )}
        </div>
      </PageHeader>

      <PageBody>
        <div className="space-y-6">

          {/* ── GA4 Connection Status ── */}
          {cpcError && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="p-4 flex items-center gap-3">
                <ShieldAlert size={20} className="text-amber-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">GA4 non connecté</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Configurez GA4_PROPERTY_ID, GA4_CLIENT_EMAIL et GA4_PRIVATE_KEY dans les secrets du projet.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── CPC Data Preview Cards ── */}
          {cpcLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
            </div>
          ) : cpcData ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KpiCard label="Sessions CPC" value={cpcData.cpcSessions.toLocaleString()} sub="Trafic payant total" icon={Users} color="blue" />
              <KpiCard label="Engagement CPC" value={`${cpcData.cpcEngagementRate}%`} sub="Taux pondéré" icon={Activity} color={cpcData.cpcEngagementRate > 50 ? 'green' : 'amber'} />
              <KpiCard label="Conversions CPC" value={cpcData.cpcConversions.toLocaleString()} sub="Événements clés" icon={MousePointerClick} color="violet" />
              <KpiCard label="Revenu CPC" value={`${cpcData.cpcRevenue.toLocaleString()}€`} sub="CA trafic payant" icon={DollarSign} color="green" />
            </div>
          ) : null}

          {/* ── Configuration Form ── */}
          <Card className="border border-border/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target size={16} className="text-primary" />
                Paramètres de l'audit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs">Secteur d'activité</Label>
                  <Input
                    placeholder="Ex: E-commerce Mode"
                    value={form.sector}
                    onChange={e => {
                      setForm(f => ({ ...f, sector: e.target.value }))
                      // Set custom dimension as user types sector (debounced by GA4)
                      if (e.target.value.length > 2) {
                        setAdAuditDimensions({ sector: e.target.value })
                      }
                    }}
                    onBlur={() => {
                      if (form.sector) {
                        trackEvent('ad_audit_field_change', {
                          ad_audit_sector: form.sector,
                          field_name: 'sector',
                        })
                      }
                    }}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Canaux publicitaires</Label>
                  <Input
                    placeholder="Meta Ads, Google Ads"
                    value={form.adChannels}
                    onChange={e => {
                      setForm(f => ({ ...f, adChannels: e.target.value }))
                      if (e.target.value.length > 3) {
                        setAdAuditDimensions({ channels: e.target.value })
                      }
                    }}
                    onBlur={() => {
                      if (form.adChannels) {
                        trackEvent('ad_audit_field_change', {
                          ad_audit_channels: form.adChannels,
                          field_name: 'ad_channels',
                        })
                      }
                    }}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Budget mensuel (€)</Label>
                  <Input
                    type="number"
                    value={form.adSpend}
                    onChange={e => setForm(f => ({ ...f, adSpend: Number(e.target.value) }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">ROAS cible (break-even)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={form.targetRoas}
                    onChange={e => setForm(f => ({ ...f, targetRoas: Number(e.target.value) }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">ROAS affiché régies (optionnel)</Label>
                  <Input
                    placeholder="Ex: Meta 2.8 / Google 4.1"
                    value={form.displayedRoas}
                    onChange={e => setForm(f => ({ ...f, displayedRoas: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Tendance CPC (optionnel)</Label>
                  <Input
                    placeholder="Ex: +15% hausse / Stable"
                    value={form.cpcTrend}
                    onChange={e => setForm(f => ({ ...f, cpcTrend: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Taux de churn (optionnel)</Label>
                  <Input
                    placeholder="Ex: 5%"
                    value={form.churnRate}
                    onChange={e => setForm(f => ({ ...f, churnRate: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">LTV client (optionnel)</Label>
                  <Input
                    placeholder="Ex: 120€"
                    value={form.ltv}
                    onChange={e => setForm(f => ({ ...f, ltv: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <Button
                  onClick={handleGenerate}
                  disabled={!form.sector || !form.adSpend || auditLoading || !!cpcError}
                  className="gap-2"
                >
                  {auditLoading ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Zap size={14} />
                  )}
                  {auditLoading ? 'Analyse en cours…' : "Lancer l'audit"}
                </Button>
                {!form.sector && (
                  <p className="text-xs text-muted-foreground">Renseignez au minimum le secteur et le budget.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ── Audit Results ── */}
          {audit && (
            <div className="space-y-5">

              {/* ── KPIs computed ── */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard
                  label="ROAS Réel (GA4)"
                  value={`${audit.computed.realRoas}x`}
                  sub={`Cible : ${audit.inputs.targetRoas}x`}
                  icon={audit.computed.realRoas >= audit.inputs.targetRoas ? TrendingUp : TrendingDown}
                  color={audit.computed.realRoas >= audit.inputs.targetRoas ? 'green' : 'red'}
                />
                <KpiCard
                  label="MER (Blended ROAS)"
                  value={`${audit.computed.mer}x`}
                  sub="CA Total ÷ Dépenses"
                  icon={Gauge}
                  color={audit.computed.mer >= 3 ? 'green' : audit.computed.mer >= 2 ? 'amber' : 'red'}
                />
                <KpiCard
                  label="Taux de Conv. CPC"
                  value={`${audit.computed.conversionRate}%`}
                  sub={`${audit.ga4.cpcConversions} conv. / ${audit.ga4.cpcSessions.toLocaleString()} sessions`}
                  icon={MousePointerClick}
                  color={audit.computed.conversionRate >= 2 ? 'green' : audit.computed.conversionRate >= 1 ? 'amber' : 'red'}
                />
                <KpiCard
                  label="CPA (Coût/Acquisition)"
                  value={`${audit.computed.cpa.toFixed(0)}€`}
                  sub={`Budget ${audit.inputs.adSpend}€ ÷ ${audit.ga4.cpcConversions} conv.`}
                  icon={DollarSign}
                  color="violet"
                />
              </div>

              {/* ── 1. ROAS Réel vs MER ── */}
              <AuditSection
                number={1}
                title="ROAS Réel vs MER"
                icon={Target}
                severity={audit.computed.realRoas >= audit.inputs.targetRoas ? 'success' : 'warning'}
              >
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground mb-1">ROAS Réel (GA4)</p>
                      <p className="text-xl font-bold">{audit.computed.realRoas}x</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {audit.ga4.cpcRevenue.toLocaleString()}€ revenu CPC ÷ {audit.inputs.adSpend}€ budget
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground mb-1">MER (Blended)</p>
                      <p className="text-xl font-bold">{audit.computed.mer}x</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {audit.ga4.totalSiteRevenue.toLocaleString()}€ CA total ÷ {audit.inputs.adSpend}€ budget
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground mb-1">Seuil de rentabilité</p>
                      <p className="text-xl font-bold">{audit.inputs.targetRoas}x</p>
                      <p className="text-xs text-muted-foreground mt-1">Break-even cible</p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground leading-relaxed">
                    {audit.computed.realRoas >= audit.inputs.targetRoas ? (
                      <p>
                        <CheckCircle2 size={14} className="inline text-emerald-500 mr-1" />
                        Votre ROAS réel ({audit.computed.realRoas}x) dépasse le seuil de rentabilité ({audit.inputs.targetRoas}x).
                        {audit.computed.mer > audit.computed.realRoas && ` Votre MER (${audit.computed.mer}x) est encore meilleur grâce au trafic organique, ce qui signifie que votre rentabilité globale est saine.`}
                      </p>
                    ) : (
                      <p>
                        <AlertTriangle size={14} className="inline text-amber-500 mr-1" />
                        Votre ROAS réel ({audit.computed.realRoas}x) est en dessous du break-even ({audit.inputs.targetRoas}x).
                        {audit.computed.mer >= audit.inputs.targetRoas
                          ? ` Cependant, votre MER (${audit.computed.mer}x) couvre le seuil grâce au trafic organique — la rentabilité globale reste correcte, mais chaque euro publicitaire est sous-optimal.`
                          : ` Et votre MER (${audit.computed.mer}x) ne couvre pas non plus le break-even — la rentabilité globale est fragile.`}
                      </p>
                    )}
                  </div>
                </div>
              </AuditSection>

              {/* ── 2. Tracking Audit ── */}
              <AuditSection
                number={2}
                title="Audit Tracking & Attribution"
                icon={Eye}
                severity={audit.inputs.displayedRoas !== 'Non fourni' ? 'info' : 'warning'}
              >
                <div className="space-y-3 text-sm">
                  {audit.inputs.displayedRoas !== 'Non fourni' ? (
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground mb-2">ROAS affiché par les régies</p>
                      <p className="font-semibold">{audit.inputs.displayedRoas}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Comparez ces chiffres avec le ROAS réel GA4 ({audit.computed.realRoas}x).
                        Un écart &gt; 30% signale une perte de signal (iOS ATT, bloqueurs de pub, UTMs manquants).
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                      <AlertTriangle size={14} className="inline text-amber-500 mr-1" />
                      <span className="text-amber-600 dark:text-amber-400 font-medium">Données régies non fournies.</span>
                      <p className="text-xs text-muted-foreground mt-1">
                        Pour un audit complet, renseignez les ROAS affichés par Meta/Google/TikTok afin de calculer l'écart d'attribution.
                      </p>
                    </div>
                  )}
                  <p className="text-muted-foreground">
                    <strong>Sources CPC détectées par GA4 :</strong>{' '}
                    {audit.ga4.sources.length > 0
                      ? audit.ga4.sources.map(s => s.source).join(', ')
                      : 'Aucune source CPC détectée — vérifiez les UTMs et la connexion GA4.'}
                  </p>
                </div>
              </AuditSection>

              {/* ── 3. Funnel & Creative Fatigue ── */}
              <AuditSection
                number={3}
                title="Diagnostic Funnel & Fatigue Créative"
                icon={Gauge}
                severity={audit.ga4.cpcEngagementRate < 40 ? 'danger' : audit.ga4.cpcEngagementRate < 55 ? 'warning' : 'success'}
              >
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground mb-1">Taux d'engagement CPC</p>
                      <p className="text-xl font-bold">{audit.ga4.cpcEngagementRate}%</p>
                      <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all', audit.ga4.cpcEngagementRate > 55 ? 'bg-emerald-500' : audit.ga4.cpcEngagementRate > 40 ? 'bg-amber-500' : 'bg-red-500')}
                          style={{ width: `${Math.min(audit.ga4.cpcEngagementRate, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground mb-1">Tendance CPC</p>
                      <p className="text-xl font-bold">{audit.inputs.cpcTrend || 'Non renseigné'}</p>
                    </div>
                  </div>
                  <div className="text-muted-foreground leading-relaxed">
                    {audit.inputs.cpcTrend?.includes('+') && audit.ga4.cpcEngagementRate < 50 ? (
                      <>
                        <AlertTriangle size={14} className="inline text-red-500 mr-1" />
                        <strong>Alerte Fatigue Créative :</strong> Le CPC monte ({audit.inputs.cpcTrend}) tandis que l'engagement GA4 est bas ({audit.ga4.cpcEngagementRate}%).
                        L'audience est saturée — renouvelez les visuels et testez de nouveaux angles créatifs sous 48h.
                      </>
                    ) : audit.ga4.cpcEngagementRate < 40 ? (
                      <>
                        <AlertTriangle size={14} className="inline text-amber-500 mr-1" />
                        <strong>Engagement faible :</strong> Le trafic payant arrive sur le site mais ne s'engage pas.
                        Causes probables : déconnexion entre la promesse publicitaire et la landing page, ou ciblage trop large.
                      </>
                    ) : audit.computed.conversionRate < 1 && audit.ga4.cpcEngagementRate > 50 ? (
                      <>
                        <AlertTriangle size={14} className="inline text-amber-500 mr-1" />
                        <strong>Blocage à la conversion :</strong> L'engagement est bon ({audit.ga4.cpcEngagementRate}%) mais les conversions sont faibles ({audit.computed.conversionRate}%).
                        Le problème est probablement une friction technique ou psychologique sur le site (panier, checkout, prix, confiance).
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} className="inline text-emerald-500 mr-1" />
                        Le funnel semble sain : engagement correct ({audit.ga4.cpcEngagementRate}%) et taux de conversion acceptable ({audit.computed.conversionRate}%).
                      </>
                    )}
                  </div>
                </div>
              </AuditSection>

              {/* ── 4. Synthèse Executive ── */}
              <AuditSection
                number={4}
                title="Synthèse Executive"
                icon={FileText}
                severity={diagnosis?.some(d => d.severity === 'danger') ? 'danger' : diagnosis?.some(d => d.severity === 'warning') ? 'warning' : 'success'}
              >
                <div className="space-y-3">
                  {diagnosis?.map((d, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <AlertBadge type={d.severity}>
                        {d.severity === 'danger' ? '🔴' : d.severity === 'warning' ? '🟡' : d.severity === 'success' ? '🟢' : '🔵'}
                        {d.severity === 'danger' ? 'Critique' : d.severity === 'warning' ? 'Attention' : d.severity === 'success' ? 'OK' : 'Info'}
                      </AlertBadge>
                      <p className="text-muted-foreground leading-relaxed flex-1">{d.text}</p>
                    </div>
                  ))}
                  {audit.inputs.churnRate && audit.inputs.churnRate !== 'Non fourni' && (
                    <div className="rounded-lg bg-muted/50 p-3 text-sm">
                      <p className="text-xs text-muted-foreground mb-1">Analyse Rétention vs Acquisition</p>
                      <p className="text-muted-foreground">
                        Churn mensuel de <strong>{audit.inputs.churnRate}</strong>
                        {audit.inputs.ltv && ` · LTV de ${audit.inputs.ltv}`}.
                        {parseFloat(audit.inputs.churnRate) > 5
                          ? ' Le churn est élevé — chaque client acquis disparaît vite. Priorité à la rétention avant d\'augmenter le budget acquisition.'
                          : ' Le churn est sous contrôle — vous pouvez investir plus agressivement en acquisition.'}
                      </p>
                    </div>
                  )}
                </div>
              </AuditSection>

              {/* ── 5. Plan d'Action 48h ── */}
              <AuditSection
                number={5}
                title="Plan d'Action Prioritaire (48h)"
                icon={Zap}
                severity="info"
              >
                <div className="space-y-3">
                  {getActionItems(audit, diagnosis).map((action, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">{action.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{action.detail}</p>
                      </div>
                      <ArrowRight size={14} className="text-muted-foreground shrink-0 mt-1" />
                    </div>
                  ))}
                </div>
              </AuditSection>

              {/* ── Source Breakdown Table ── */}
              {audit.ga4.sources.length > 0 && (
                <Card className="border border-border/50">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 size={16} className="text-primary" />
                      Détail par source CPC
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 text-xs text-muted-foreground font-medium">Source</th>
                            <th className="text-right py-2 text-xs text-muted-foreground font-medium">Sessions</th>
                            <th className="text-right py-2 text-xs text-muted-foreground font-medium">Engagement</th>
                            <th className="text-right py-2 text-xs text-muted-foreground font-medium">Conversions</th>
                            <th className="text-right py-2 text-xs text-muted-foreground font-medium">Revenu</th>
                          </tr>
                        </thead>
                        <tbody>
                          {audit.ga4.sources.map((src, i) => (
                            <tr key={i} className="border-b border-border/30 hover:bg-muted/30">
                              <td className="py-2 font-medium">{src.source}</td>
                              <td className="text-right py-2">{src.sessions.toLocaleString()}</td>
                              <td className="text-right py-2">
                                <span className={cn('font-medium', src.engagementRate > 0.5 ? 'text-emerald-500' : src.engagementRate > 0.35 ? 'text-amber-500' : 'text-red-500')}>
                                  {(src.engagementRate * 100).toFixed(1)}%
                                </span>
                              </td>
                              <td className="text-right py-2">{src.conversions}</td>
                              <td className="text-right py-2 font-medium">{src.revenue.toLocaleString()}€</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

            </div>
          )}
        </div>
      </PageBody>
    </Page>
  )
}

// ── Action Items Generator ─────────────────────────────────────────────────────

function getActionItems(audit: AuditResult, diagnosis: { severity: string; text: string }[] | null) {
  const actions: { title: string; detail: string }[] = []
  const hasDanger  = diagnosis?.some(d => d.severity === 'danger')
  const hasWarning = diagnosis?.some(d => d.severity === 'warning')

  // Action 1 — always prioritize based on severity
  if (audit.computed.realRoas < audit.inputs.targetRoas) {
    actions.push({
      title: 'Couper les campagnes sous-performantes (ROAS < 1x)',
      detail: `Identifiez les campagnes avec un ROAS affiché inférieur à 1x dans Meta/Google Ads et mettez-les en pause. Réallouez le budget vers les campagnes avec un ROAS > ${audit.inputs.targetRoas}x.`,
    })
  }

  // Action 2 — creative fatigue
  if (audit.inputs.cpcTrend?.includes('+') && audit.ga4.cpcEngagementRate < 50) {
    actions.push({
      title: 'Renouveler les créatifs publicitaires sous 24h',
      detail: 'Le CPC monte et l\'engagement chute — signe de fatigue créative. Lancez 3 nouvelles variantes visuelles (UGC, carrousel, vidéo courtes) et testez-les en A/B pendant 48h.',
    })
  }

  // Action 3 — tracking
  if (audit.inputs.displayedRoas === 'Non fourni') {
    actions.push({
      title: 'Auditer le tracking GA4 & les UTMs',
      detail: 'Vérifiez que tous les liens publicitaires contiennent des paramètres UTM (utm_source, utm_medium, utm_campaign). Activez les API de Conversions Meta/Google pour fiabiliser l\'attribution post-iOS.',
    })
  }

  // Action 4 — landing page
  if (audit.computed.conversionRate < 1.5 && audit.ga4.cpcEngagementRate > 45) {
    actions.push({
      title: 'Lancer un A/B test sur la landing page',
      detail: `L'engagement est correct (${audit.ga4.cpcEngagementRate}%) mais la conversion est faible (${audit.computed.conversionRate}%). Testez : (A) page actuelle vs (B) page avec offre simplifiée + preuve sociale renforcée + CTA plus visible.`,
    })
  }

  // Action 5 — CPA
  if (audit.computed.cpa > 0 && audit.inputs.ltv) {
    const ltvNum = parseFloat(audit.inputs.ltv.replace(/[^\d.]/g, ''))
    if (!isNaN(ltvNum) && audit.computed.cpa > ltvNum * 0.3) {
      actions.push({
        title: 'Réduire le CPA ou augmenter la LTV',
        detail: `Votre coût d'acquisition (${audit.computed.cpa.toFixed(0)}€) représente ${(audit.computed.cpa / ltvNum * 100).toFixed(0)}% de la LTV. Actions : affiner le ciblage, ajouter des audiences lookalike, ou augmenter le panier moyen via upsell.`,
      })
    }
  }

  // Fallback actions if not enough generated
  if (actions.length === 0) {
    actions.push({
      title: 'Optimiser les audiences et le ciblage',
      detail: 'Analysez les audiences qui convertissent le mieux dans Meta/Google Ads et concentrez-y 80% du budget. Créez des lookalikes sur vos convertisseurs.',
    })
    actions.push({
      title: 'Vérifier la cohérence pub → landing page',
      detail: 'Assurez-vous que chaque campagne pointe vers une landing page dédiée avec un message cohérent avec la promesse publicitaire.',
    })
  }

  // Always add a tracking action if we have warnings
  if (hasWarning || hasDanger) {
    actions.push({
      title: 'Planifier un point de suivi dans 48h',
      detail: 'Relancez cet audit dans 2 jours pour vérifier l\'impact des actions correctives. Surveillez le CPC, l\'engagement et le taux de conversion quotidiennement.',
    })
  }

  return actions.slice(0, 3) // max 3 actions
}
