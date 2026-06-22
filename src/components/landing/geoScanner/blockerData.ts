/**
 * Shared data: blocking issues detected by the GEO scanner.
 * Each item has a fix action and simulated "AI code" lines for the writing animation.
 */

export interface BlockerItem {
  id: string;
  label: string;
  detail: string;
  impact: string; // e.g. "−18 pts"
  severity: 'critical' | 'high' | 'medium';
  fixLines: string[]; // fake code lines shown during "AI writing" animation
}

export const BLOCKER_ITEMS: BlockerItem[] = [
  {
    id: 'gbp',
    label: 'Fiche Google Business Profile incomplète',
    detail: 'Description, catégories et attributs manquants',
    impact: '−18 pts',
    severity: 'critical',
    fixLines: [
      '> Génération description sémantique GBP...',
      '  ✦ Catégories: "Restaurant", "Cuisine locale"',
      '  ✦ Attributs: horaires, parking, wifi',
      '  ✦ Description: 750 chars optimisés IA',
      '> Injection via Google Business API... ✓',
    ],
  },
  {
    id: 'reviews',
    label: 'Aucune réponse IA aux avis récents',
    detail: '12 avis Google sans réponse depuis 30 jours',
    impact: '−12 pts',
    severity: 'critical',
    fixLines: [
      '> Analyse des 12 avis non répondus...',
      '  ✦ Avis positifs (9) → templates empathiques',
      '  ✦ Avis négatifs (3) → réponses de désescalade',
      '> Génération réponses IA personnalisées...',
      '> Mise en file d\'attente publication... ✓',
    ],
  },
  {
    id: 'schema',
    label: 'Schema.org LocalBusiness absent ou invalide',
    detail: 'Les LLMs ne peuvent pas extraire vos données structurées',
    impact: '−10 pts',
    severity: 'high',
    fixLines: [
      '> Génération JSON-LD LocalBusiness...',
      '  "@type": "LocalBusiness",',
      '  "name": "[votre établissement]",',
      '  "openingHours": "Mo-Fr 09:00-18:00",',
      '> Injection dans <head> du site... ✓',
    ],
  },
  {
    id: 'ugc',
    label: 'Citations UGC Reddit/LinkedIn : 0 mention',
    detail: 'Absent des sources que lisent ChatGPT et Perplexity',
    impact: '−9 pts',
    severity: 'high',
    fixLines: [
      '> Génération post LinkedIn expert...',
      '  ✦ Secteur: expertise locale validée',
      '> Génération réponse Reddit r/local...',
      '  ✦ Ton: authentique, non promotionnel',
      '> Planification publication × 2... ✓',
    ],
  },
  {
    id: 'faq',
    label: 'Balises FAQ manquantes',
    detail: 'ChatGPT ne peut pas vous citer dans ses réponses',
    impact: '−8 pts',
    severity: 'high',
    fixLines: [
      '> Analyse requêtes locales top-10...',
      '  ✦ "Meilleur [activité] à [ville] ?"',
      '  ✦ "Où trouver [activité] recommandé ?"',
      '> Génération 5 fragments Q&A sémantiques...',
      '> Injection Schema FAQPage... ✓',
    ],
  },
  {
    id: 'perplexity',
    label: 'Contenu local insuffisant pour Perplexity',
    detail: 'Moins de 3 pages indexées avec mots-clés locaux',
    impact: '−7 pts',
    severity: 'medium',
    fixLines: [
      '> Analyse mots-clés locaux manquants...',
      '  ✦ "[activité] [ville]" density: 0.2%',
      '> Génération 2 posts géo-ciblés...',
      '  ✦ Inclut: quartier, landmarks, contexte',
      '> Publication planifiée × 2... ✓',
    ],
  },
  {
    id: 'hours',
    label: 'Données structurées horaires absentes',
    detail: 'Siri et Apple Intelligence ignorent vos horaires',
    impact: '−5 pts',
    severity: 'medium',
    fixLines: [
      '> Extraction horaires depuis GBP...',
      '  "openingHoursSpecification": [',
      '    { "dayOfWeek": "Monday", "opens": "09:00" }',
      '  ],',
      '> Synchronisation multi-sources... ✓',
    ],
  },
  {
    id: 'gemini',
    label: 'Profil Gemini non optimisé',
    detail: 'Google AI Overview ne vous cite pas',
    impact: '−4 pts',
    severity: 'medium',
    fixLines: [
      '> Audit Knowledge Graph Google...',
      '  ✦ Entity: non confirmée',
      '> Génération contenu E-E-A-T...',
      '  ✦ Auteur expert + sources locales',
      '> Publication optimisation Gemini... ✓',
    ],
  },
];

export const SCAN_STEPS = [
  { id: 'gpt',      bot: '🤖', label: 'Interrogation de GPTBOT (OpenAI)',                   duration: 4000  },
  { id: 'gemini',   bot: '✨', label: 'Analyse de GEMINIBOT (Google)',                       duration: 8000  },
  { id: 'perp',     bot: '🔍', label: 'Analyse de PERPLEXITYBOT',                           duration: 12000 },
  { id: 'claude',   bot: '🧠', label: 'Vérification CLAUDEBOT (Anthropic)',                 duration: 16000 },
  { id: 'ugc',      bot: '💬', label: 'Vérification des citations UGC (Reddit/LinkedIn)',   duration: 21000 },
  { id: 'schema',   bot: '📦', label: 'Analyse des données structurées Schema.org',          duration: 27000 },
  { id: 'citation', bot: '🗂️', label: 'Calcul de l\'indice de citation sémantique',          duration: 32000 },
  { id: 'build',    bot: '🏗️', label: 'Construction de votre espace personnalisé',           duration: 35000 },
];

export const TOTAL_SCAN_MS = 35000;
