/**
 * AppFeaturesConfig — Innovation Gate
 * Every feature must declare onboarding block. 
 * This is the single source of truth for guided tour, help videos, and FAQ injection.
 */

export interface AppFeatureTourStep {
  targetAnchor: string;
  title: string;
  content: string;
}

export interface AppFeatureOnboarding {
  tourSteps: AppFeatureTourStep[];
  helpVideoUrl: string;
  faqItems: Array<{ question: string; answer: string }>;
}

export interface AppFeature {
  id: string;
  title: string;
  route: string;
  onboarding: AppFeatureOnboarding;
}

export const APP_FEATURES: AppFeature[] = [
  {
    id: 'geo-authority',
    title: 'Score G.E.O. & Visibilité IA',
    route: '/geo-authority',
    onboarding: {
      tourSteps: [
        { targetAnchor: 'data-tour="geo-score"', title: 'Votre Score de Recommandation IA', content: 'Plus il est élevé, plus ChatGPT et les assistants vocaux vous amèneront des clients.' },
        { targetAnchor: 'data-tour="geo-llm-table"', title: 'Part de Voix Multi-LLM', content: 'Comparez votre présence sur chaque moteur d\'IA concurrent.' },
      ],
      helpVideoUrl: '',
      faqItems: [
        { question: 'Qu\'est-ce que le Score G.E.O. ?', answer: 'Le G.E.O. mesure votre capacité à être recommandé par les IA comme ChatGPT, Perplexity et Gemini.' },
      ],
    },
  },
  {
    id: 'sentiment-analysis',
    title: 'Analyse Sémantique',
    route: '/semantic',
    onboarding: {
      tourSteps: [
        { targetAnchor: 'data-tour="sentiment-strengths"', title: 'Vos Points Forts', content: 'L\'IA a extrait les thèmes les plus appréciés de vos clients.' },
        { targetAnchor: 'data-tour="sentiment-frictions"', title: 'Axes d\'Amélioration', content: 'Chaque point de friction peut être corrigé avec un post IA en 1 clic.' },
      ],
      helpVideoUrl: '',
      faqItems: [
        { question: 'Comment fonctionne l\'Analyse de Sentiment ?', answer: 'Notre intelligence locale scanne vos 100 derniers avis pour extraire forces et faiblesses réelles.' },
      ],
    },
  },
  {
    id: 'smart-qrcode',
    title: 'QR Code Intelligent Anti-Avis Négatifs',
    route: '/qrcode',
    onboarding: {
      tourSteps: [
        { targetAnchor: 'data-tour="qr-routing"', title: 'Routage Intelligent', content: 'Note ≥ 4 → Google Maps public. Note ≤ 3 → Message privé dans votre Cockpit.' },
      ],
      helpVideoUrl: '',
      faqItems: [
        { question: 'Comment fonctionne le QR Code intelligent ?', answer: 'Il filtre les avis avant qu\'ils arrivent sur Google. Seuls les clients satisfaits sont redirigés vers la page publique.' },
      ],
    },
  },
  {
    id: 'caissier',
    title: 'Validation Coupon en Caisse',
    route: '/caissier',
    onboarding: {
      tourSteps: [
        { targetAnchor: 'data-tour="caisse-input"', title: 'Validation Instantanée', content: 'Entrez ou scannez le code coupon. Le CA Copilote se met à jour en temps réel.' },
      ],
      helpVideoUrl: '',
      faqItems: [
        { question: 'Comment valider un coupon IA en caisse ?', answer: 'Entrez le code généré par Kompilot dans l\'interface /caissier. Chaque validation incrémente votre CA Copilote en direct.' },
      ],
    },
  },
];

export function getFeatureByRoute(route: string): AppFeature | undefined {
  return APP_FEATURES.find(f => f.route === route);
}
