export type ReviewPlatform = 'google' | 'tripadvisor' | 'facebook';

export interface PlatformReview {
  id: string;
  platform: ReviewPlatform;
  authorName: string;
  authorInitials: string;
  rating: number; // 1-5
  date: string;
  text: string;
  aiReply?: string;
  replied?: boolean;
}

export const PLATFORM_REVIEWS: PlatformReview[] = [
  // ── Google (5 reviews) ──────────────────────────────────────────────────────
  {
    id: 'g1',
    platform: 'google',
    authorName: 'Michel Lavigne',
    authorInitials: 'ML',
    rating: 5,
    date: 'Il y a 2 jours',
    text: 'Excellente expérience ! L\'équipe est très professionnelle, réactive et le résultat final a dépassé mes attentes. Je recommande vivement ce service à toutes les PME.',
  },
  {
    id: 'g2',
    platform: 'google',
    authorName: 'Sandrine Morel',
    authorInitials: 'SM',
    rating: 4,
    date: 'Il y a 5 jours',
    text: 'Très bonne prestation dans l\'ensemble. Le suivi est sérieux et les délais sont respectés. Un petit bémol sur la communication en fin de projet, mais rien de bloquant.',
  },
  {
    id: 'g3',
    platform: 'google',
    authorName: 'Julien Tissot',
    authorInitials: 'JT',
    rating: 2,
    date: 'Il y a 1 semaine',
    text: 'Service décevant. J\'ai eu du mal à joindre quelqu\'un et le résultat ne correspondait pas à ce qui avait été convenu. Espérons que les prochains clients seront mieux accompagnés.',
  },
  {
    id: 'g4',
    platform: 'google',
    authorName: 'Amandine Roux',
    authorInitials: 'AR',
    rating: 5,
    date: 'Il y a 2 semaines',
    text: 'Je suis bluffée par la qualité du travail fourni. Interface intuitive, support disponible, vraiment top. On continue avec eux pour toute notre stratégie digitale !',
  },
  {
    id: 'g5',
    platform: 'google',
    authorName: 'Isabelle Faure',
    authorInitials: 'IF',
    rating: 1,
    date: 'Il y a 1 mois',
    text: 'Très déçue. Aucun suivi après la signature, promesses non tenues, et impossible d\'obtenir un remboursement. Je ne recommande pas du tout.',
  },

  // ── TripAdvisor (5 reviews) ─────────────────────────────────────────────────
  {
    id: 't1',
    platform: 'tripadvisor',
    authorName: 'Élodie Marchand',
    authorInitials: 'EM',
    rating: 5,
    date: 'Il y a 3 jours',
    text: 'Un dîner absolument mémorable ! La cuisine est raffinée, le service aux petits soins et l\'ambiance feutrée invite à prendre le temps. La carte des vins est impressionnante. Incontournable lors de votre passage en ville.',
  },
  {
    id: 't2',
    platform: 'tripadvisor',
    authorName: 'Bernard Duchamp',
    authorInitials: 'BD',
    rating: 4,
    date: 'Il y a 1 semaine',
    text: 'Très bon séjour à l\'hôtel. La chambre était spacieuse et propre, le petit-déjeuner copieux et varié. La piscine est un vrai plus. Seul bémol : le parking manque de places aux heures de pointe.',
  },
  {
    id: 't3',
    platform: 'tripadvisor',
    authorName: 'Claire Dupont',
    authorInitials: 'CD',
    rating: 2,
    date: 'Il y a 2 semaines',
    text: 'Déçue par la qualité du service en salle. Attente interminable, plats tièdes et personnel peu attentionné. Le cadre est pourtant magnifique, dommage que l\'expérience en cuisine ne suive pas.',
  },
  {
    id: 't4',
    platform: 'tripadvisor',
    authorName: 'Thomas Renaud',
    authorInitials: 'TR',
    rating: 5,
    date: 'Il y a 3 semaines',
    text: 'Coup de cœur total ! Chef talentueux, produits locaux de saison, présentation soignée. Le menu dégustation en 6 services était une véritable aventure gustative. Réservation vivement conseillée.',
  },
  {
    id: 't5',
    platform: 'tripadvisor',
    authorName: 'Nathalie Girard',
    authorInitials: 'NG',
    rating: 3,
    date: 'Il y a 1 mois',
    text: 'Expérience correcte sans être exceptionnelle. Les plats principaux étaient bons mais les entrées manquaient de saveur. Le service était agréable mais un peu lent pour un soir en semaine.',
  },

  // ── Facebook (5 reviews) ────────────────────────────────────────────────────
  {
    id: 'f1',
    platform: 'facebook',
    authorName: 'Lucie Bonnet',
    authorInitials: 'LB',
    rating: 5,
    date: 'Il y a 1 jour',
    text: 'Super équipe, super résultat ! 🙌 Vraiment au top, je recommande à 100%.',
  },
  {
    id: 'f2',
    platform: 'facebook',
    authorName: 'Kévin Aubert',
    authorInitials: 'KA',
    rating: 3,
    date: 'Il y a 4 jours',
    text: 'Pas mal dans l\'ensemble mais quelques bugs au départ. Le support a été réactif pour les corriger, ça joue.',
  },
  {
    id: 'f3',
    platform: 'facebook',
    authorName: 'Sophie Lambert',
    authorInitials: 'SL',
    rating: 1,
    date: 'Il y a 1 semaine',
    text: 'Vraiment déçue 😞 J\'attendais bien mieux pour ce prix-là. Service client inexistant. À éviter.',
  },
  {
    id: 'f4',
    platform: 'facebook',
    authorName: 'Marc Lefevre',
    authorInitials: 'ML',
    rating: 4,
    date: 'Il y a 10 jours',
    text: 'Très bonne expérience globale ! Petit délai de livraison mais la qualité était là. Je reviendrai c\'est sûr 👌',
  },
  {
    id: 'f5',
    platform: 'facebook',
    authorName: 'Anaïs Petit',
    authorInitials: 'AP',
    rating: 5,
    date: 'Il y a 2 semaines',
    text: 'Waouh, trop content du résultat !! L\'équipe a vraiment écouté ce qu\'on voulait et livré en temps et en heure. Franchement bravo 🔥',
  },
];

export const PLATFORM_META: Record<ReviewPlatform, { label: string; color: string; dot: string; textColor: string; borderColor: string; bgColor: string }> = {
  google: {
    label: 'Google',
    color: '#EA4335',
    dot: '🔴',
    textColor: 'text-red-600',
    borderColor: 'border-red-200',
    bgColor: 'bg-red-50',
  },
  tripadvisor: {
    label: 'TripAdvisor',
    color: '#34AF56',
    dot: '🟢',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    bgColor: 'bg-emerald-50',
  },
  facebook: {
    label: 'Facebook',
    color: '#1877F2',
    dot: '🔵',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-200',
    bgColor: 'bg-blue-50',
  },
};
