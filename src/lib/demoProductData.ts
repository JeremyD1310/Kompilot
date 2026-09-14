export type DemoProfile = 'commerce' | 'artisan' | 'agency' | 'network';
export type DemoItemKind = 'post' | 'review' | 'email' | 'message' | 'campaign' | 'invitation';
export type DemoWorkflowStatus = 'Brouillon' | 'À valider' | 'Validé' | 'Planifié' | 'Publié';

export interface DemoApprovalItem {
  id: string;
  kind: DemoItemKind;
  title: string;
  detail: string;
  status: DemoWorkflowStatus;
}

export interface DemoClient {
  id: string;
  name: string;
  city: string;
  score: number;
  alert: string;
}

export interface DemoRecord {
  profile: DemoProfile;
  establishment: string;
  city: string;
  rating: number;
  reviewsToAnswer: number;
  geoScore: number;
  localVisibility: number;
  reach: number;
  engagement: number;
  leads: number;
  conversions: number;
  approvals: DemoApprovalItem[];
  clients: DemoClient[];
  notifications: string[];
}

export const PROFILE_META: Record<DemoProfile, { label: string; description: string; establishment: string }> = {
  commerce: { label: 'Commerce local', description: 'Avis, fiche Google et contenu local.', establishment: 'Le Café du Marché' },
  artisan: { label: 'Artisan ou PME', description: 'De la réalisation au post, sans promesse automatique.', establishment: 'Atelier Durand' },
  agency: { label: 'Agence', description: 'Portefeuille clients, alertes et validation marque blanche.', establishment: 'Agence Réseaux Pro' },
  network: { label: 'Multi-établissements', description: 'Cohérence, actions groupées et rapport consolidé.', establishment: 'Réseau Maison & Marché' },
};

const baseApprovals: DemoApprovalItem[] = [
  { id: 'post-1', kind: 'post', title: 'Post local — menu de saison', detail: 'Instagram · aujourd’hui', status: 'À valider' },
  { id: 'review-1', kind: 'review', title: 'Réponse à Thomas R.', detail: 'Avis Google · 5 étoiles', status: 'À valider' },
  { id: 'message-1', kind: 'message', title: 'Demande de devis locale', detail: 'Sophie Martin · site web', status: 'Brouillon' },
  { id: 'campaign-1', kind: 'campaign', title: 'Campagne printemps', detail: 'Email fictif · 240 contacts', status: 'Planifié' },
];

export function createDemoRecord(profile: DemoProfile): DemoRecord {
  const common = {
    profile,
    establishment: PROFILE_META[profile].establishment,
    city: profile === 'network' ? 'France' : profile === 'agency' ? 'Bordeaux' : 'La Rochelle',
    rating: profile === 'artisan' ? 4.7 : 4.6,
    reviewsToAnswer: profile === 'agency' ? 6 : profile === 'network' ? 9 : 3,
    geoScore: profile === 'agency' ? 82 : profile === 'network' ? 79 : 78,
    localVisibility: profile === 'network' ? 74 : 81,
    reach: profile === 'agency' ? 12800 : 4350,
    engagement: profile === 'agency' ? 7.4 : 6.8,
    leads: profile === 'network' ? 38 : profile === 'agency' ? 26 : 12,
    conversions: profile === 'network' ? 8 : profile === 'agency' ? 6 : 3,
    approvals: baseApprovals.map(item => ({ ...item })),
    clients: [
      { id: 'client-1', name: 'Le Petit Bistro', city: 'La Rochelle', score: 84, alert: '3 avis à traiter' },
      { id: 'client-2', name: 'Studio Beauté Léa', city: 'Bordeaux', score: 71, alert: 'Fiche à compléter' },
      { id: 'client-3', name: 'Garage Martin', city: 'Nantes', score: 58, alert: 'Visibilité en baisse' },
    ],
    notifications: ['Données simulées · aucune connexion externe', 'Une validation attend votre action', 'Le rapport de visibilité est prêt'],
  };

  if (profile === 'artisan') {
    common.approvals[0] = { id: 'post-1', kind: 'post', title: 'Réalisation — rénovation de cuisine', detail: 'Brouillon IA · à relire', status: 'À valider' };
    common.approvals[2] = { id: 'message-1', kind: 'message', title: 'Prospect secteur La Rochelle', detail: 'Demande locale · réponse à préparer', status: 'Brouillon' };
  }
  return common;
}
