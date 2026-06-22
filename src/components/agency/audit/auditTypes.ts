/**
 * auditTypes.ts — Shared types + mock report generator for AuditFlashGenerator
 */

export interface AuditReport {
  businessName: string;
  city: string;
  sector: string;
  globalScore: number;
  googleScore: number;
  geoScore: number;
  socialScore: number;
  reputationScore: number;
  topKeywords: { keyword: string; position: number | null; volume: number; opportunity: boolean }[];
  competitors: { name: string; score: number; dominates: string }[];
  criticalGaps: { issue: string; impact: string; priority: 'high' | 'medium' | 'low' }[];
  opportunities: string[];
  estimatedLoss: number;
  recommendation: string;
  cta: string;
}

export function generateMockReport(name: string, city: string, sector: string): AuditReport {
  const geo = Math.floor(50 + Math.random() * 40);
  const goog = Math.floor(45 + Math.random() * 45);
  const soc = Math.floor(30 + Math.random() * 50);
  const rep = Math.floor(55 + Math.random() * 40);
  const global_ = Math.round((geo + goog + soc + rep) / 4);
  return {
    businessName: name, city, sector,
    globalScore: global_, googleScore: goog, geoScore: geo, socialScore: soc, reputationScore: rep,
    topKeywords: [
      { keyword: `${sector} ${city}`, position: Math.random() > 0.4 ? Math.floor(3 + Math.random() * 12) : null, volume: 1200 + Math.floor(Math.random() * 3000), opportunity: Math.random() > 0.5 },
      { keyword: `meilleur ${sector} ${city}`, position: null, volume: 800 + Math.floor(Math.random() * 1500), opportunity: true },
      { keyword: `${sector} pas cher ${city}`, position: Math.random() > 0.6 ? Math.floor(8 + Math.random() * 15) : null, volume: 400 + Math.floor(Math.random() * 800), opportunity: true },
      { keyword: `avis ${sector} ${city}`, position: Math.random() > 0.5 ? Math.floor(1 + Math.random() * 8) : null, volume: 600 + Math.floor(Math.random() * 1000), opportunity: false },
      { keyword: `${sector} ouvert dimanche ${city}`, position: null, volume: 200 + Math.floor(Math.random() * 400), opportunity: true },
    ],
    competitors: [
      { name: `${sector} Premium ${city}`, score: 80 + Math.floor(Math.random() * 15), dominates: 'ChatGPT & Google Maps' },
      { name: `Le ${sector} de ${city} Centre`, score: 70 + Math.floor(Math.random() * 20), dominates: 'Avis Google (4.8★)' },
      { name: `${sector} Express ${city}`, score: 60 + Math.floor(Math.random() * 15), dominates: 'Réseaux sociaux' },
    ],
    criticalGaps: [
      { issue: 'Fiche Google Maps incomplète (photos, horaires, description)', impact: 'Invisible sur 60% des recherches locales', priority: 'high' as const },
      { issue: 'Absent des réponses ChatGPT et Gemini', impact: `Perd ${Math.floor(300 + Math.random() * 800)}€/mois en clients IA`, priority: 'high' as const },
      { issue: 'Aucun post réseau social ce mois', impact: 'Engagement en chute de 45%', priority: 'medium' as const },
      { issue: 'Note Google < 4★ sans réponses aux avis négatifs', impact: 'Frein à la conversion de -28%', priority: 'medium' as const },
      { issue: `Requête clé "${sector} ${city}" — concurrent #1 devant`, impact: 'Volume mensuel perdu : 1200+ recherches', priority: 'low' as const },
    ],
    opportunities: [
      `Optimiser la fiche Google Maps → +35% de visibilité locale estimée`,
      `Publier 3 posts/semaine ciblés G.E.O. → Apparaître dans ChatGPT en 30 jours`,
      `Répondre aux avis Google (objectif 4.5★) → +22% de conversion`,
      `Activer la page "Meilleur ${sector} ${city}" sur le site → +180 visites/mois`,
    ],
    estimatedLoss: Math.floor(1500 + Math.random() * 3500),
    recommendation: `"${name}" perd en visibilité face à ses 3 concurrents directs. Les points critiques (fiche Google incomplète + absence IA) représentent une opportunité immédiate avec un ROI estimé à 3-6 mois.`,
    cta: `Activez Kompilot pour "${name}" → Premier mois offert`,
  };
}

export function exportReportAsText(report: AuditReport): string {
  const lines = [
    `AUDIT FLASH — ${report.businessName} (${report.city})`,
    `Généré par Kompilot Agency | ${new Date().toLocaleDateString('fr-FR')}`,
    ``, `SCORE GLOBAL : ${report.globalScore}/100`,
    `  Google Maps : ${report.googleScore}/100`, `  G.E.O. (IA) : ${report.geoScore}/100`,
    `  Réseaux Soc. : ${report.socialScore}/100`, `  Réputation   : ${report.reputationScore}/100`,
    ``, `MANQUE À GAGNER ESTIMÉ : ${report.estimatedLoss.toLocaleString('fr-FR')}€/mois`,
    ``, `PROBLÈMES CRITIQUES :`,
    ...report.criticalGaps.filter(g => g.priority === 'high').map(g => `  ❌ ${g.issue}\n     Impact : ${g.impact}`),
    ``, `OPPORTUNITÉS :`, ...report.opportunities.map(o => `  ✅ ${o}`),
    ``, `RECOMMANDATION :`, report.recommendation,
    ``, `PROCHAINE ÉTAPE :`, report.cta,
  ];
  return lines.join('\n');
}
