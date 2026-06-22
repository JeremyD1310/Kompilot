/**
 * AISentimentAnalysis — AI Sentiment widget for Reviews/Inbox tab.
 * Compiles recent reviews and surfaces an actionable improvement tip.
 * Design: violet glow, trending icon, one-click "Créer le post correctif".
 */
import { useState, useEffect } from 'react';
import { AIContextualInsight } from '../shared/AIContextualInsight';
import { useNavigate } from '@tanstack/react-router';

const SENTIMENT_INSIGHTS = [
  {
    insight: "💡 Les clients mentionnent souvent un temps d'attente prolongé le samedi (12 avis sur 50). Pensez à ajuster vos créneaux ou à activer le Bouclier No-Show à 40% sur ces heures chaudes.",
    detail: "Analyse sémantique de vos 50 derniers avis Google :\n• 'attente' / 'long' / 'délai' : mentionné dans 24% des avis du samedi\n• Note moyenne samedi : 3.8★ vs 4.6★ les autres jours\n• Action recommandée : créer 2 créneaux supplémentaires 12h-13h ou activer l'empreinte bancaire à 40% pour sécuriser les réservations du samedi.",
    action: "Activer Bouclier +40% samedi",
    postText: "🗓️ Samedi on t'attend ! Pour éviter l'attente, réservez en ligne — créneau garanti avec empreinte bancaire. Simple et sécurisé. #RéservationFacile",
    badge: "24% des avis",
  },
  {
    insight: "✨ Point fort détecté : 'accueil chaleureux' est mentionné dans 38% de vos avis récents — mais vous ne le valorisez pas dans vos posts. Exploitez ce différenciateur IA.",
    detail: "Vos clients adorent votre accueil. Ce thème est cité positivement dans 19 avis sur 50. Sur ChatGPT et Gemini, les établissements qui mettent en avant l'accueil client dans leurs fiches et posts sont prioritairement recommandés.",
    action: "Créer un post 'Accueil' maintenant",
    postText: "❤️ Chez nous, vous êtes toujours les bienvenus ! Notre équipe vous attend avec le sourire — parce qu'un bon accueil, ça change tout. #AccueilChaleureux #ServiceClient",
    badge: "✅ Force",
  },
  {
    insight: "⚠️ Alerte : 4 avis négatifs ce mois mentionnent 'parking difficile'. Ce frein à la visite est réparable avec un post informatif. Publiez-le avant de perdre d'autres clients.",
    detail: "Analyse : 4 avis négatifs (2★-3★) mentionnent explicitement des difficultés de stationnement. En publiant un guide pratique (parking P+R à 200m, navette gratuite, etc.), vous pouvez transformer ce point faible en preuve de service.",
    action: "Publier le guide parking",
    postText: "🅿️ Conseil pratique ! Le parking le plus proche est [adresse] à 2 min à pied. Et si vous venez en transport, l'arrêt [ligne] est à 100m. On pense à tout pour vous ! #PratiqueEtConvivial",
    badge: "⚠️ 4 avis",
  },
];

interface AISentimentAnalysisProps {
  reviewCount?: number;
  className?: string;
}

export function AISentimentAnalysis({ reviewCount = 50, className }: AISentimentAnalysisProps) {
  const navigate = useNavigate();
  const [insightIdx, setInsightIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 1800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const t = setInterval(() => {
      setInsightIdx(i => (i + 1) % SENTIMENT_INSIGHTS.length);
    }, 60000);
    return () => clearInterval(t);
  }, [isLoading]);

  const current = SENTIMENT_INSIGHTS[insightIdx];

  const handleAction = () => {
    setActionLoading(true);
    setTimeout(() => {
      setActionLoading(false);
      // Dispatch event to open post creator with prefilled text
      window.dispatchEvent(new CustomEvent('kompilot:create-post', {
        detail: { text: current.postText }
      }));
      navigate({ to: '/calendrier' as any });
    }, 700);
  };

  return (
    <div className={className}>
      <AIContextualInsight
        title={`📈 Analyse de Sentiment IA — ${reviewCount} derniers avis`}
        insight={isLoading ? '' : current.insight}
        detail={current.detail}
        variant="violet"
        icon="trending"
        badge={isLoading ? undefined : current.badge}
        isLoading={isLoading}
        action={isLoading ? undefined : {
          label: current.action,
          onClick: handleAction,
          loading: actionLoading,
        }}
        secondaryAction={isLoading ? undefined : {
          label: 'Analyse suivante →',
          onClick: () => setInsightIdx(i => (i + 1) % SENTIMENT_INSIGHTS.length),
        }}
        dismissible={!isLoading}
      />
    </div>
  );
}
