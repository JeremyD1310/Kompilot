/**
 * agentsTypes.ts — Types, constantes et définitions partagées pour AIAgentsModule
 */
import type React from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

export type AgentStatus = 'active' | 'watching' | 'idle';

export interface AgentCard {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  status: AgentStatus;
  statusLabel: string;
  statusColor: string;
  metric: string;
  metricLabel: string;
  insight?: string;
  ctaLabel: string;
  ctaIcon: React.ReactNode;
  gradient: string;
  borderColor: string;
}

// ── Live terminal logs ────────────────────────────────────────────────────────

export const LIVE_LOGS: string[] = [
  '[Claude Cowork] 🤖 Initialisation du protocole multi-agents...',
  '[Agent Content] ⚙️ Extraction des tendances du secteur sélectionné...',
  '[Agent Ad Spy] 🔍 Analyse des citations de marque et part de voix G.E.O...',
  '[Agent Reporter] 📊 Calcul des métriques de rétention et synchronisation Stripe...',
  '[System] ✅ Injection des nouveaux prompts créatifs dans le Studio...',
  '[Agent Content] ⚙️ Génération du planning éditorial semaine S+1...',
  '[Agent Ad Spy] 🔍 Détection de 3 angles concurrentiels à forte conversion...',
  '[Agent Reporter] 📈 Extraction des métriques Google Business et GMB Insights...',
  '[System] 🔄 Synchronisation réussie avec le module Creative Studio...',
  '[Agent Content] ✨ Script vidéo Reel généré pour Instagram & TikTok...',
  '[Agent Ad Spy] 🛡️ Veille SEO locale — Position 3 détectée pour "salon coiffure Paris 15"...',
  '[Agent Reporter] 📋 Rapport mensuel client prêt — 12 pages générées...',
  '[Claude Cowork] 🤖 Cycle d\'agents terminé — prochain sprint dans 4h...',
  '[System] ✅ Backup automatique des données — 0 erreur détectée...',
  '[Agent Content] ⚙️ Analyse du brief client effectuée pour le secteur restauration...',
  '[Agent Ad Spy] 🔍 Scannage des angles publicitaires concurrents en cours...',
  '[Agent Reporter] 📊 Calcul des métriques de conversion Stripe et Google en cours...',
  '[System] ✅ Protocole de supervision activé — agents opérationnels...',
];
