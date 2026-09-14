export type DemoPersona = 'merchant' | 'artisan' | 'agency' | 'multi_location';

export interface DemoCompany {
  id: string;
  name: string;
  sector: string;
  city: string;
  description: string;
}

export interface DemoEstablishment {
  id: string;
  name: string;
  city: string;
  status: 'active' | 'attention';
}

export interface DemoClient {
  id: string;
  name: string;
  city: string;
  score: number;
}

export interface DemoPublication {
  id: string;
  title: string;
  channel: 'Instagram' | 'Facebook' | 'LinkedIn';
  status: 'draft' | 'scheduled' | 'published';
  scheduledAt: string;
}

export interface DemoReview {
  id: string;
  author: string;
  rating: number;
  text: string;
  replied: boolean;
}

export interface DemoMessage {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  read: boolean;
}

export interface DemoValidation {
  id: string;
  title: string;
  status: 'pending' | 'approved';
}

export interface DemoCalendarEvent {
  id: string;
  title: string;
  date: string;
  channel: string;
}

export interface DemoStatistics {
  reach: number;
  engagementRate: number;
  postsPublished: number;
  leads: number;
}

export interface DemoData {
  isFictional: true;
  persona: DemoPersona;
  company: DemoCompany;
  establishments: DemoEstablishment[];
  clients: DemoClient[];
  publications: DemoPublication[];
  reviews: DemoReview[];
  messages: DemoMessage[];
  validations: DemoValidation[];
  calendar: DemoCalendarEvent[];
  statistics: DemoStatistics;
  seoScore: number;
  geoScore: number;
  recentActivity: string[];
}

const profileCopy: Record<DemoPersona, { company: DemoCompany; establishments: DemoEstablishment[]; clients: DemoClient[] }> = {
  merchant: {
    company: { id: 'demo-company-merchant', name: 'Le Café du Marché', sector: 'Commerce local', city: 'La Rochelle', description: 'Entreprise fictive utilisée uniquement pour explorer Kompilot.' },
    establishments: [{ id: 'demo-est-merchant', name: 'Le Café du Marché', city: 'La Rochelle', status: 'active' }],
    clients: [{ id: 'demo-client-merchant', name: 'Le Café du Marché', city: 'La Rochelle', score: 84 }],
  },
  artisan: {
    company: { id: 'demo-company-artisan', name: 'Atelier Durand & Fils', sector: 'Artisanat', city: 'Nantes', description: 'PME fictive pour simuler un suivi de chantiers et de visibilité locale.' },
    establishments: [{ id: 'demo-est-artisan', name: 'Atelier Durand & Fils', city: 'Nantes', status: 'active' }],
    clients: [{ id: 'demo-client-artisan', name: 'Atelier Durand & Fils', city: 'Nantes', score: 76 }],
  },
  agency: {
    company: { id: 'demo-company-agency', name: 'Agence Réseaux Pro', sector: 'Agence marketing', city: 'Bordeaux', description: 'Agence fictive avec un portefeuille de marques de démonstration.' },
    establishments: [{ id: 'demo-est-agency', name: 'Agence Réseaux Pro', city: 'Bordeaux', status: 'active' }],
    clients: [
      { id: 'demo-client-agency-1', name: 'Bistrot des Halles', city: 'Bordeaux', score: 91 },
      { id: 'demo-client-agency-2', name: 'Studio Beauté Léa', city: 'Bordeaux', score: 73 },
    ],
  },
  multi_location: {
    company: { id: 'demo-company-network', name: 'Maison & Marché', sector: 'Réseau multi-sites', city: 'France', description: 'Réseau fictif pour tester une vue consolidée multi-établissements.' },
    establishments: [
      { id: 'demo-est-network-1', name: 'Maison & Marché — La Rochelle', city: 'La Rochelle', status: 'active' },
      { id: 'demo-est-network-2', name: 'Maison & Marché — Bordeaux', city: 'Bordeaux', status: 'attention' },
      { id: 'demo-est-network-3', name: 'Maison & Marché — Nantes', city: 'Nantes', status: 'active' },
    ],
    clients: [{ id: 'demo-client-network', name: 'Maison & Marché', city: 'France', score: 79 }],
  },
};

export const DEMO_PERSONAS: DemoPersona[] = ['merchant', 'artisan', 'agency', 'multi_location'];

export function createDemoData(persona: DemoPersona): DemoData {
  const copy = profileCopy[persona];
  return {
    isFictional: true,
    persona,
    company: { ...copy.company },
    establishments: copy.establishments.map(item => ({ ...item })),
    clients: copy.clients.map(item => ({ ...item })),
    publications: [
      { id: `demo-publication-${persona}-1`, title: 'Idée locale de saison', channel: 'Instagram', status: 'published', scheduledAt: '2026-09-18T09:00:00.000Z' },
      { id: `demo-publication-${persona}-2`, title: 'Conseil utile pour nos clients', channel: 'LinkedIn', status: 'scheduled', scheduledAt: '2026-09-21T11:30:00.000Z' },
    ],
    reviews: [{ id: `demo-review-${persona}-1`, author: 'Camille B.', rating: 5, text: 'Une expérience fictive, claire et agréable.', replied: false }],
    messages: [{ id: `demo-message-${persona}-1`, sender: 'Sophie Martin', subject: 'Question sur votre activité', preview: 'Message de démonstration sans destinataire réel.', read: false }],
    validations: [{ id: `demo-validation-${persona}-1`, title: 'Réponse locale à relire', status: 'pending' }],
    calendar: [{ id: `demo-event-${persona}-1`, title: 'Publication simulée', date: '2026-09-21', channel: 'Instagram' }],
    statistics: { reach: persona === 'agency' ? 12800 : 4350, engagementRate: persona === 'agency' ? 7.4 : 6.8, postsPublished: 7, leads: persona === 'multi_location' ? 38 : 12 },
    seoScore: persona === 'agency' ? 82 : 78,
    geoScore: persona === 'multi_location' ? 79 : 81,
    recentActivity: ['Donnée fictive chargée localement', 'Publication simulée préparée', 'Aucun service externe contacté'],
  };
}
