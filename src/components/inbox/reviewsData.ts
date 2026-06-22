export interface GoogleReview {
  id: string;
  authorName: string;
  authorInitials: string;
  rating: number; // 1–5
  date: string;
  text: string;
  aiReply?: string;
}

export const MOCK_REVIEWS: GoogleReview[] = [
  {
    id: 'r1',
    authorName: 'Michel Lavigne',
    authorInitials: 'ML',
    rating: 5,
    date: 'Il y a 2 jours',
    text: 'Excellente expérience ! L\'équipe est très professionnelle, réactive et le résultat final a dépassé mes attentes. Je recommande vivement ce service à toutes les PME.',
  },
  {
    id: 'r2',
    authorName: 'Sandrine Morel',
    authorInitials: 'SM',
    rating: 4,
    date: 'Il y a 5 jours',
    text: 'Très bonne prestation dans l\'ensemble. Le suivi est sérieux et les délais sont respectés. Un petit bémol sur la communication en fin de projet, mais rien de bloquant.',
  },
  {
    id: 'r3',
    authorName: 'Julien Tissot',
    authorInitials: 'JT',
    rating: 2,
    date: 'Il y a 1 semaine',
    text: 'Service décevant. J\'ai eu du mal à joindre quelqu\'un et le résultat ne correspondait pas à ce qui avait été convenu. Espérons que les prochains clients seront mieux accompagnés.',
  },
  {
    id: 'r4',
    authorName: 'Amandine Rous',
    authorInitials: 'AR',
    rating: 5,
    date: 'Il y a 2 semaines',
    text: 'Je suis bluffée par la qualité du travail fourni. Interface intuitive, support disponible, vraiment top. On continue avec eux pour toute notre stratégie digitale !',
  },
  {
    id: 'r5',
    authorName: 'Paul Berger',
    authorInitials: 'PB',
    rating: 3,
    date: 'Il y a 3 semaines',
    text: 'Prestation correcte mais sans plus. Les fonctionnalités de base sont là, mais certaines options avancées manquent encore. J\'espère voir des améliorations dans les prochaines mises à jour.',
  },
  {
    id: 'r6',
    authorName: 'Isabelle Faure',
    authorInitials: 'IF',
    rating: 1,
    date: 'Il y a 1 mois',
    text: 'Très déçue. Aucun suivi après la signature, promesses non tenues, et impossible d\'obtenir un remboursement. Je ne recommande pas.',
  },
];
