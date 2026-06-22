/**
 * GeoGrowthRecommendation — AI Growth widget for Dashboard/GEO tab.
 * Rotates through actionable local keyword trend insights.
 * Design: emerald glow, spark icon, one-click "Adapter ma sémantique" CTA.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { AIContextualInsight } from '../shared/AIContextualInsight';
import { useEstablishment } from '../../context/EstablishmentContext';

// Simulated live recommendations (in production: fetched from AI router)
const GEO_INSIGHTS = [
  {
    insight: "Les recherches sur 'Brunch terrasse' augmentent de +35% dans votre ville ce mois-ci. Votre fiche Google ne mentionne pas ce mot-clé — vous perdez du trafic qualifié.",
    detail: "Selon les tendances sémantiques locales, les requêtes 'brunch terrasse', 'brunch en extérieur' et 'petit-déjeuner jardin' ont explosé +35% sur ChatGPT et Google Discover depuis 10 jours. Un seul post optimisé avec ces termes peut booster votre Score G.E.O. de +8 points.",
    action: "Adapter ma sémantique maintenant",
    route: '/calendrier',
    prefill: "🌿 Brunch terrasse — Venez profiter de notre espace en plein air ce week-end. Table sans réservation, ambiance cosy. #BrunchTerrasse #LocalFood",
    badge: "🔥 +35%",
  },
  {
    insight: "3 de vos concurrents sont cités par ChatGPT sur 'meilleur service rapide'. Votre fiche ne contient pas ce différenciateur — optimisation disponible en 1 clic.",
    detail: "Analyse G.E.O. en temps réel : vos concurrents directs ont 3× plus de citations sur les requêtes de rapidité de service. En ajoutant ce thème à votre fiche et vos posts, vous pouvez capturer ce segment en 30 jours.",
    action: "Générer le post différenciateur",
    route: '/calendrier',
    prefill: "⚡ Service express — Chez nous, votre commande est prête en moins de 10 minutes. On vous voit quand ?",
    badge: "📊 Analyse",
  },
  {
    insight: "Votre Score G.E.O. a baissé de -4 points cette semaine (67 → 63). Cause détectée : 8 avis Google sans réponse depuis +5 jours.",
    detail: "Les moteurs IA pénalisent les établissements qui ne répondent pas à leurs avis récents. 8 avis sans réponse depuis 5 jours pèsent directement sur votre Score G.E.O. Une réponse rapide peut récupérer +3 à +5 points dès ce soir.",
    action: "Répondre aux avis maintenant",
    route: '/inbox',
    badge: "⚠️ -4pts",
  },
  {
    insight: "Opportunité locale : la Fête des Voisins arrive dans 12 jours. Vos concurrents n'ont pas encore posté. Soyez le premier à capter ce flux sémantique.",
    detail: "Les tendances sémantiques montrent un pic annuel pour 'fête des voisins', 'événement local' et 'solidarité quartier' dans les 15 jours précédant l'événement. Premier à publier = premier à être cité par l'IA.",
    action: "Planifier le post événementiel",
    route: '/calendrier',
    prefill: "🎉 Fête des Voisins — Rejoignez-nous le [date] pour une célébration conviviale ! Au programme : [détails]. Réservation recommandée.",
    badge: "🗓️ J-12",
  },
];

interface GeoGrowthRecommendationProps {
  className?: string;
}

export function GeoGrowthRecommendation({ className }: GeoGrowthRecommendationProps) {
  const navigate = useNavigate();
  const { activeEstablishment } = useEstablishment();
  const [insightIdx, setInsightIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Simulate AI analysis on mount
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 1400);
    return () => clearTimeout(t);
  }, []);

  // Rotate insight every 45s
  useEffect(() => {
    if (isLoading) return;
    const t = setInterval(() => {
      setInsightIdx(i => (i + 1) % GEO_INSIGHTS.length);
    }, 45000);
    return () => clearInterval(t);
  }, [isLoading]);

  const current = GEO_INSIGHTS[insightIdx];

  const handleAction = () => {
    setActionLoading(true);
    setTimeout(() => {
      setActionLoading(false);
      navigate({ to: current.route as any });
    }, 600);
  };

  const handleNext = () => {
    setInsightIdx(i => (i + 1) % GEO_INSIGHTS.length);
  };

  const sectorHint = activeEstablishment?.activity
    ? ` (secteur : ${activeEstablishment.activity})`
    : '';

  return (
    <div className={className}>
      <AIContextualInsight
        title={`💡 Recommandation Croissance G.E.O.${sectorHint}`}
        insight={isLoading ? '' : current.insight}
        detail={current.detail}
        variant="emerald"
        icon="sparkles"
        badge={isLoading ? undefined : current.badge}
        isLoading={isLoading}
        action={isLoading ? undefined : {
          label: current.action,
          onClick: handleAction,
          loading: actionLoading,
        }}
        secondaryAction={isLoading ? undefined : {
          label: 'Autre conseil →',
          onClick: handleNext,
        }}
        dismissible={!isLoading}
      />
    </div>
  );
}
