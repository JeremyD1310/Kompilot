/**
 * AgencyOpportunityAlerts — AI Opportunity column for Agency multi-account dashboard.
 * Monitors client GEO scores and surfaces upsell opportunities.
 * Includes "Plan de Conquête IA" full strategy generator.
 */
import { useState } from 'react';
import { AlertTriangle, Sparkles, TrendingDown, TrendingUp, Loader2, FileText, Zap, CheckCircle2, ChevronDown, ChevronUp, X } from 'lucide-react';
import { toast } from '@blinkdotnew/ui';

export interface ClientOpportunity {
  clientId: string;
  clientName: string;
  clientType: string;
  emoji: string;
  alertType: 'geo_drop' | 'no_reviews' | 'competitor_rising' | 'no_posts' | 'sms_low_credits' | 'stripe_dispute' | 'lead_captured';
  alertMessage: string;
  urgency: 'high' | 'medium' | 'low';
  potentialRevenue: number; // €/mois récupérables
  cta: string;
  reportGenerated?: string;
}

// Default alerts based on mock client data
const DEFAULT_ALERTS: ClientOpportunity[] = [
  {
    clientId: '3',
    clientName: 'Garage Martin',
    clientType: 'Automobile',
    emoji: '🔧',
    alertType: 'geo_drop',
    alertMessage: "Baisse de -3 pts sur Score G.E.O. (58%) — absent des citations ChatGPT sur 'garage Nantes'. Un concurrent vient d'optimiser sa fiche.",
    urgency: 'high',
    potentialRevenue: 320,
    cta: 'Générer rapport d\'audit G.E.O.',
  },
  {
    clientId: '5',
    clientName: 'Cabinet Dentaire Moreau',
    clientType: 'Santé',
    emoji: '🦷',
    alertType: 'no_reviews',
    alertMessage: "2 avis négatifs non traités depuis 6 jours. Risque de chute de score. Réponse IA recommandée immédiatement.",
    urgency: 'high',
    potentialRevenue: 480,
    cta: 'Répondre aux avis maintenant',
  },
  {
    clientId: '2',
    clientName: 'Studio Beauté Léa',
    clientType: 'Coiffure',
    emoji: '💇‍♀️',
    alertType: 'competitor_rising',
    alertMessage: "Un concurrent vient d'atteindre 4.8★ Google (vs vos 4.2★). Opportunité : générer une campagne avis clients pour remonter.",
    urgency: 'medium',
    potentialRevenue: 195,
    cta: 'Créer campagne avis',
  },
  {
    clientId: '4',
    clientName: 'Boulangerie Dupont',
    clientType: 'Boulangerie',
    emoji: '🥐',
    alertType: 'sms_low_credits',
    alertMessage: 'Solde SMS critique : 4 crédits restants. La prochaine campagne de relance client sera bloquée. Rechargez maintenant.',
    urgency: 'high',
    potentialRevenue: 240,
    cta: 'Recharger les crédits SMS',
  },
  {
    clientId: '6',
    clientName: 'Centre Médical Voltaire',
    clientType: 'Santé',
    emoji: '🏥',
    alertType: 'lead_captured',
    alertMessage: '3 nouveaux leads capturés via widget ce matin — aucun SMS de relance envoyé. Activez la séquence automatique pour convertir.',
    urgency: 'medium',
    potentialRevenue: 380,
    cta: 'Activer la relance automatique',
  },
];

const CONQUEST_PLAN_TEMPLATE = (clientName: string, clientType: string) => `
📋 PLAN DE CONQUÊTE IA — ${clientName}
═══════════════════════════════════════

📅 FEUILLE DE ROUTE 90 JOURS — ${clientType}

MOIS 1 — FONDATIONS G.E.O. & VISIBILITÉ
─────────────────────────────────────
Semaine 1-2 :
→ Audit complet fiche Google My Business
→ Optimisation sémantique G.E.O. (mots-clés IA : ChatGPT, Gemini, Perplexity)
→ Génération 8 posts réseaux (Instagram + Google Posts)
→ Activation Bouclier Anti-No-Show à 25%

Semaine 3-4 :
→ Campagne de collecte d'avis (objectif : +10 avis)
→ Réponse à 100% des avis existants (IA + validation)
→ Mise en place inbox unifiée
→ Score G.E.O. cible : +12 points

KPI Mois 1 :
• Score G.E.O. : ${Math.floor(Math.random() * 15 + 65)}% → ${Math.floor(Math.random() * 10 + 75)}%
• Avis Google : +10 avis · Note cible : 4.5★
• No-shows bloqués : estimé 4-6/mois → 520€ sécurisés

MOIS 2 — ACCÉLÉRATION & CONTENU IA
─────────────────────────────────────
→ Calendrier éditorial 30 posts/mois (IA)
→ Module G.E.A. (Google Ads IA)
→ Rapports G.E.O. hebdomadaires
→ Optimisation Radar Concurrentiel

KPI Mois 2 :
• Portée organique : +45%
• Nouveaux clients estimés : +8/mois
• Taux de conversion réservations : +22%

MOIS 3 — CONSOLIDATION & UPSELL
─────────────────────────────────────
→ Audit ROI mensuel complet
→ Proposition offre annuelle (fidélisation)
→ Présentation rapport en réunion (PDF marque blanche)
→ Identification prochaine opportunité upsell

ROI ESTIMÉ SUR 3 MOIS :
• Revenus récupérés (no-show) : 1 560€
• Clients supplémentaires : 24 (panier moyen 85€)
• CA additionnel estimé : 2 040€
• ROI total estimé : +3 600€

INVESTISSEMENT MENSUEL : 149€ HT
ROI × 24 dès le 1er mois
`.trim();

// Individual alert card
function OpportunityAlertCard({ alert, onGenerateReport }: {
  alert: ClientOpportunity;
  onGenerateReport: (alert: ClientOpportunity) => void;
}) {
  const [generating, setGenerating] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const urgencyStyle = {
    high: { border: 'rgba(239,68,68,.3)', bg: 'rgba(239,68,68,.06)', color: '#EF4444', pulseBg: '#EF4444' },
    medium: { border: 'rgba(245,158,11,.3)', bg: 'rgba(245,158,11,.06)', color: '#F59E0B', pulseBg: '#F59E0B' },
    low: { border: 'rgba(16,185,129,.3)', bg: 'rgba(16,185,129,.06)', color: '#10B981', pulseBg: '#10B981' },
  }[alert.urgency];

  const handleCta = async () => {
    setGenerating(true);
    await new Promise(r => setTimeout(r, 1000));
    setGenerating(false);
    onGenerateReport(alert);
  };

  return (
    <div
      className="rounded-xl p-3 relative transition-all"
      style={{ background: urgencyStyle.bg, border: `1px solid ${urgencyStyle.border}` }}
    >
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center opacity-40 hover:opacity-80 transition-opacity"
        style={{ color: urgencyStyle.color }}
      >
        <X size={10} />
      </button>

      <div className="flex items-start gap-2.5 pr-5">
        {/* Pulsing dot + emoji */}
        <div className="relative mt-0.5 shrink-0">
          <span className="text-lg">{alert.emoji}</span>
          <div
            className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full animate-pulse"
            style={{ background: urgencyStyle.pulseBg }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="text-xs font-bold text-foreground">{alert.clientName}</p>
            <span className="text-[9px] font-semibold text-muted-foreground">{alert.clientType}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mb-2">{alert.alertMessage}</p>

          <div className="flex items-center justify-between gap-2">
            <span
              className="text-[10px] font-black rounded-full px-2 py-0.5"
              style={{ background: 'rgba(34,197,94,.12)', color: '#22C55E' }}
            >
              +{alert.potentialRevenue}€/mois potentiel
            </span>
            <button
              onClick={handleCta}
              disabled={generating}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all active:scale-95 disabled:opacity-60"
              style={{ background: urgencyStyle.bg, color: urgencyStyle.color, border: `1px solid ${urgencyStyle.border}` }}
            >
              {generating
                ? <><Loader2 size={9} className="animate-spin" /> Génération…</>
                : <><Zap size={9} /> {alert.cta}</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Conquest plan generator modal
function ConquestPlanModal({ clientName, clientType, onClose }: {
  clientName: string; clientType: string; onClose: () => void;
}) {
  const [generating, setGenerating] = useState(true);
  const [plan, setPlan] = useState('');
  const [copied, setCopied] = useState(false);

  useState(() => {
    setTimeout(() => {
      setPlan(CONQUEST_PLAN_TEMPLATE(clientName, clientType));
      setGenerating(false);
    }, 2200);
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(plan);
    setCopied(true);
    toast.success('Plan copié dans le presse-papier !');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,.7)' }}>
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/25 flex items-center justify-center">
              <FileText size={17} className="text-violet-400" />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">Plan de Conquête IA</p>
              <p className="text-xs text-muted-foreground">{clientName} · {clientType}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!generating && (
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold bg-violet-500/10 text-violet-400 border border-violet-500/25 hover:bg-violet-500/20 transition-all"
              >
                {copied ? <><CheckCircle2 size={12} /> Copié !</> : <><FileText size={12} /> Copier le plan</>}
              </button>
            )}
            <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-muted transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {generating ? (
            <div className="flex flex-col items-center justify-center h-40 gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 size={16} className="animate-spin text-violet-400" />
                <span>L'IA rédige votre plan de conquête personnalisé…</span>
              </div>
              <div className="text-xs text-muted-foreground/60">Analyse sémantique · Données concurrents · Optimisation G.E.O.</div>
            </div>
          ) : (
            <pre className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap font-mono bg-muted/30 rounded-xl p-4">
              {plan}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

// Main component
interface AgencyOpportunityAlertsProps {
  alerts?: ClientOpportunity[];
  className?: string;
}

export function AgencyOpportunityAlerts({ alerts = DEFAULT_ALERTS, className }: AgencyOpportunityAlertsProps) {
  const [expanded, setExpanded] = useState(true);
  const [conquestTarget, setConquestTarget] = useState<{ name: string; type: string } | null>(null);
  const [generatingPlan, setGeneratingPlan] = useState(false);

  const visibleAlerts = alerts.filter(a => a.urgency === 'high');
  const allAlerts = alerts;

  const handleGenerateReport = (alert: ClientOpportunity) => {
    toast.success(`Rapport d'audit G.E.O. généré pour ${alert.clientName} !`);
  };

  const handleConquestPlan = (clientName: string, clientType: string) => {
    setConquestTarget({ name: clientName, type: clientType });
  };

  return (
    <>
      <div
        className={`rounded-2xl overflow-hidden ${className || ''}`}
        style={{
          background: 'linear-gradient(135deg, rgba(239,68,68,.05), rgba(139,92,246,.04))',
          border: '1px solid rgba(239,68,68,.25)',
          boxShadow: '0 0 0 1px rgba(239,68,68,.12), 0 4px 24px rgba(139,92,246,.08)',
        }}
      >
        {/* Header */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full p-4 flex items-center gap-3 text-left"
          style={{ borderBottom: expanded ? '1px solid rgba(239,68,68,.15)' : 'none' }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.3)' }}
          >
            <AlertTriangle size={15} style={{ color: '#EF4444' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold" style={{ color: '#EF4444' }}>🚨 Alertes Opportunité IA</p>
              {visibleAlerts.length > 0 && (
                <span
                  className="text-[10px] font-black rounded-full px-2 py-0.5 animate-pulse"
                  style={{ background: 'rgba(239,68,68,.2)', color: '#EF4444' }}
                >
                  {visibleAlerts.length} urgent{visibleAlerts.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">L'IA surveille votre parc clients en temps réel</p>
          </div>
          {expanded ? <ChevronUp size={14} className="shrink-0 text-muted-foreground" /> : <ChevronDown size={14} className="shrink-0 text-muted-foreground" />}
        </button>

        {expanded && (
          <div className="p-4 space-y-3">
            {allAlerts.map(alert => (
              <OpportunityAlertCard
                key={alert.clientId}
                alert={alert}
                onGenerateReport={handleGenerateReport}
              />
            ))}

            {/* Conquest plan CTA */}
            <div
              className="rounded-xl p-3 mt-2"
              style={{
                background: 'rgba(139,92,246,.06)',
                border: '1px solid rgba(139,92,246,.25)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={13} style={{ color: '#A78BFA' }} />
                <p className="text-xs font-bold" style={{ color: '#A78BFA' }}>Plan de Conquête IA</p>
                <span className="text-[9px] font-black rounded-full px-1.5 py-0.5 bg-violet-500/15 text-violet-400">
                  NOUVEAU
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                Générez une feuille de route marketing complète et personnalisée pour n'importe quel client — prête à présenter en réunion en 1 clic.
              </p>
              <div className="flex flex-wrap gap-2">
                {allAlerts.slice(0, 3).map(alert => (
                  <button
                    key={alert.clientId}
                    onClick={() => handleConquestPlan(alert.clientName, alert.clientType)}
                    className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-bold transition-all active:scale-95 hover:scale-105"
                    style={{
                      background: 'rgba(139,92,246,.12)',
                      color: '#A78BFA',
                      border: '1px solid rgba(139,92,246,.25)',
                    }}
                  >
                    <FileText size={10} />
                    {alert.emoji} {alert.clientName.split(' ')[0]}…
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Conquest plan modal */}
      {conquestTarget && (
        <ConquestPlanModal
          clientName={conquestTarget.name}
          clientType={conquestTarget.type}
          onClose={() => setConquestTarget(null)}
        />
      )}
    </>
  );
}
