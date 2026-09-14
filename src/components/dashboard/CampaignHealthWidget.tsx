/**
 * CampaignHealthWidget — Carte KPI "Santé Campagnes" pour le dashboard.
 *
 * Minimaliste fond blanc style Brevo/Planity. Trois états :
 *   - Aucun compte connecté → compact, 2 boutons CTA + social proof
 *   - Synchro en cours → barre de progression
 *   - Données disponibles → % de match + alerte si écart > 10%
 *   - Erreur → message sobre + réessayer
 *
 * Positionné dans la colonne droite du dashboard (sous "Actions rapides").
 */
import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Activity, ExternalLink, RefreshCw, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { useCampaignHealth, type PlatformHealth } from '../../hooks/useCampaignHealth';
import { useMetaOAuthConnect, useTiktokOAuthConnect } from '../../hooks/useSocialPublish';
import { IS_DEMO_DOMAIN } from '../../lib/demoDomain';

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
};

// ── Match Rate pill ──────────────────────────────────────────────────────────

function MatchPill({ platform, health }: { platform: 'meta' | 'tiktok'; health: PlatformHealth }) {
  const label = platform === 'meta' ? 'Meta Ads' : 'TikTok Ads';
  const rate = health.matchRate;
  const color =
    rate !== null && rate >= 0.70 ? 'text-emerald-600 bg-emerald-50'
    : rate !== null && rate >= 0.50 ? 'text-amber-600 bg-amber-50'
    : 'text-red-500 bg-red-50';

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border/60 bg-card">
      <span className="text-xs font-medium text-foreground/80">{label}</span>
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${rate !== null ? color : 'text-muted-foreground bg-muted'}`}>
        {rate !== null ? `${Math.round(rate * 100)}% match` : '—'}
      </span>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function CampaignHealthWidget() {
  const {
    isMetaConnected, isTiktokConnected, anyConnected,
    connectionLoading, healthData, healthLoading, healthError, isSyncing,
  } = useCampaignHealth();

  const { mutate: connectMeta, isPending: metaConnecting } = useMetaOAuthConnect();
  const { mutate: connectTiktok, isPending: tiktokConnecting } = useTiktokOAuthConnect();

  const [showDetail, setShowDetail] = useState(false);

  if (IS_DEMO_DOMAIN) {
    return (
      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={15} className="text-emerald-500" />
          <p className="text-sm font-semibold text-foreground">Santé campagnes</p>
          <span className="ml-auto rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">Données démo</span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Le tracking simulé est opérationnel. Connectez vos comptes depuis les intégrations pour activer les données live.</p>
      </motion.div>
    );
  }

  // ── Loading state ──────────────────────────────────────────────────────
  if (connectionLoading) {
    return (
      <motion.div variants={fadeUp} initial="hidden" animate="visible"
        className="rounded-xl border border-border bg-card overflow-hidden"
      >
        <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
          <Activity size={15} className="text-muted-foreground/40" />
          <h3 className="text-sm font-semibold text-foreground">Santé campagnes</h3>
        </div>
        <div className="p-4 flex items-center gap-2">
          <Loader2 size={14} className="animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Vérification des connexions…</span>
        </div>
      </motion.div>
    );
  }

  // ── State 0: No account connected ──────────────────────────────────────
  if (!anyConnected) {
    return (
      <motion.div variants={fadeUp} initial="hidden" animate="visible"
        className="rounded-xl border border-border bg-card overflow-hidden"
      >
        <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
          <Activity size={15} className="text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Santé campagnes</h3>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Connectez vos comptes publicitaires pour détecter le gaspillage lié au tracking cassé.
          </p>

          <button
            onClick={() => connectMeta()}
            disabled={metaConnecting}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-border bg-[#1877F2]/5 hover:bg-[#1877F2]/10 px-4 py-2.5 text-xs font-semibold text-[#1877F2] transition-colors disabled:opacity-50"
          >
            {metaConnecting ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            )}
            Connecter Meta Ads
          </button>

          <button
            onClick={() => connectTiktok()}
            disabled={tiktokConnecting}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-border bg-black/5 hover:bg-black/10 px-4 py-2.5 text-xs font-semibold text-foreground transition-colors disabled:opacity-50"
          >
            {tiktokConnecting ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
            )}
            Connecter TikTok Ads
          </button>

          <p className="text-[11px] text-muted-foreground/60 text-center">
            Les utilisateurs qui connectent leurs comptes réduisent leur gaspillage de 34% en moyenne.
          </p>
        </div>
      </motion.div>
    );
  }

  // ── State: Syncing / initial load ──────────────────────────────────────
  if (isSyncing || healthLoading) {
    return (
      <motion.div variants={fadeUp} initial="hidden" animate="visible"
        className="rounded-xl border border-border bg-card overflow-hidden"
      >
        <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
          <Activity size={15} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Santé campagnes</h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <RefreshCw size={13} className="animate-spin text-primary" />
            Récupération des 30 derniers jours de données…
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      </motion.div>
    );
  }

  // ── State: Error ───────────────────────────────────────────────────────
  if (healthError) {
    return (
      <motion.div variants={fadeUp} initial="hidden" animate="visible"
        className="rounded-xl border border-border bg-card overflow-hidden"
      >
        <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
          <Activity size={15} className="text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Santé campagnes</h3>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            Impossible de récupérer les données de santé pour le moment.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <RefreshCw size={12} /> Réessayer
          </button>
        </div>
      </motion.div>
    );
  }

  // ── State: Data available ──────────────────────────────────────────────
  const metaHealth = healthData?.meta;
  const tiktokHealth = healthData?.tiktok;

  const hasAlert =
    (metaHealth?.alertSeverity && metaHealth.alertSeverity !== 'ok') ||
    (tiktokHealth?.alertSeverity && tiktokHealth.alertSeverity !== 'ok');

  const criticalCampaigns =
    (metaHealth?.spend ?? 0) - (metaHealth?.attributedRevenue ?? 0) +
    (tiktokHealth?.spend ?? 0) - (tiktokHealth?.attributedRevenue ?? 0);

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible"
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${hasAlert ? 'bg-amber-400' : 'bg-emerald-400'}`} />
          <h3 className="text-sm font-semibold text-foreground">Santé campagnes</h3>
        </div>
        <Link to="/performance" className="text-[11px] font-medium text-primary hover:text-primary/80 flex items-center gap-0.5 transition-colors">
          Détail <ExternalLink size={10} />
        </Link>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────── */}
      <div className="p-4 space-y-3">
        {/* Per-platform match rates */}
        <div className="space-y-2">
          {isMetaConnected && metaHealth && (
            <MatchPill platform="meta" health={metaHealth} />
          )}
          {isTiktokConnected && tiktokHealth && (
            <MatchPill platform="tiktok" health={tiktokHealth} />
          )}
        </div>

        {/* Alert banner */}
        {hasAlert && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-100">
            <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-700">
                {criticalCampaigns > 100
                  ? `${Math.round(criticalCampaigns)}€ non attribués à une vente réelle`
                  : 'Écart de tracking détecté'}
              </p>
              <p className="text-[11px] text-amber-600/80 mt-0.5">
                {metaHealth?.alertSeverity === 'critical' && 'Meta '}
                {tiktokHealth?.alertSeverity === 'critical' && 'TikTok '}
                — {showDetail ? (
                  <span>Plus de 25% de votre budget publicitaire n'est pas tracé jusqu'à une conversion réelle. Vérifiez votre pixel et votre configuration CAPI.</span>
                ) : (
                  <button onClick={() => setShowDetail(true)} className="underline hover:text-amber-800">
                    Comprendre l'écart
                  </button>
                )}
              </p>
            </div>
          </div>
        )}

        {/* All good */}
        {!hasAlert && (
          <div className="flex items-center gap-2 p-2">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <span className="text-xs text-emerald-700 font-medium">Tracking en bonne santé</span>
          </div>
        )}

        {/* Manage connections */}
        <div className="pt-1 border-t border-border/50 flex items-center gap-2">
          <button
            onClick={() => connectMeta()}
            disabled={metaConnecting}
            className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            {isMetaConnected ? (
              <>
                <CheckCircle2 size={11} className="text-emerald-500" /> Meta ✓
              </>
            ) : (
              '+ Meta'
            )}
          </button>
          <span className="text-muted-foreground/30">·</span>
          <button
            onClick={() => connectTiktok()}
            disabled={tiktokConnecting}
            className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            {isTiktokConnected ? (
              <>
                <CheckCircle2 size={11} className="text-emerald-500" /> TikTok ✓
              </>
            ) : (
              '+ TikTok'
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
