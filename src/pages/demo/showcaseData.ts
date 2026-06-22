/**
 * Shared data and types for the Kompilot Showcase page.
 */

export type Sector = 'beauty' | 'restaurant' | 'wellness';
export type Role = 'pro' | 'agency';
export type ActiveTab = 'creative' | 'calendar' | 'dashboard' | 'leads' | 'cowork' | 'settings';
export type PreviewPlatform = 'maps' | 'instagram' | 'instagram-story' | 'facebook-story';
export type ImageStyle = 'flatlay' | 'studio' | 'modern' | 'vintage';

export interface SectorConfig {
  name: string;
  location: string;
  hook: string;
  mamanPromo: string;
  cardTitle: string;
  cardSub: string;
  imageTheme: string;
  defaultImage: string;
  localPost: string;
}

export const SECTOR_DATA: Record<Sector, SectorConfig> = {
  beauty: {
    name: '💇 Coiffure & Beauté',
    location: 'Paris 11e, France',
    hook: 'Sublimez votre éclat naturel.',
    mamanPromo: 'Offrez à votre maman un moment de pure détente. Notre forfait Signature Balayage & Soin Profond à prix doux. Réservations limitées.',
    cardTitle: 'Un Éclat Unique',
    cardSub: 'Forfait Signature Balayage',
    imageTheme: 'linear-gradient(135deg, #1e1b4b 0%, #311042 50%, #581c87 100%)',
    defaultImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80',
    localPost: 'Nouvelle technique de lissage bio disponible au salon ! Réservation en ligne sécurisée contre le No-Show.',
  },
  restaurant: {
    name: '🍽️ Restauration & Bistro',
    location: 'Lyon 2e, France',
    hook: 'Une table d\'exception pour elle.',
    mamanPromo: 'Célébrez la Fête des Mères autour de notre menu gastronomique éphémère. Réservez votre table avant épuisement.',
    cardTitle: 'Menu d\'Exception',
    cardSub: 'Fête des Mères Gastronomique',
    imageTheme: 'linear-gradient(135deg, #0f172a 0%, #1c1917 50%, #44403c 100%)',
    defaultImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
    localPost: 'Arrivage frais de saison ce midi ! Notre chef vous propose sa célèbre truite fumée maison. Tables limitées.',
  },
  wellness: {
    name: '🩺 Spa & Massage Bien-être',
    location: 'Bordeaux, France',
    hook: 'Le rituel de relaxation ultime.',
    mamanPromo: 'Un massage signature de 75 min aux huiles essentielles pour décharger toutes les tensions. Le cadeau parfait.',
    cardTitle: 'Rituel de Sérénité',
    cardSub: 'Massage d\'Éveil Sensoriel',
    imageTheme: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #115e59 100%)',
    defaultImage: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
    localPost: 'Besoin de déconnecter ? Nos cabines de massage sont désinfectées et chauffées pour votre confort optimal.',
  },
};

export interface CalendarEvent {
  id: string;
  day: number;
  title: string;
  type: 'blue' | 'purple' | 'green';
  status: 'confirmed' | 'pending';
  budget?: number;
  chat?: { sender: 'user' | 'claude'; text: string }[];
}

export const DEFAULT_CALENDAR_EVENTS: CalendarEvent[] = [
  { id: 'post-local-1', day: 4, title: 'Post Local : Promotion de Saison', type: 'blue', status: 'confirmed' },
  { id: 'aio-sync-1', day: 9, title: 'AIO Sync : Indexation sémantique ChatGPT', type: 'purple', status: 'confirmed' },
  { id: 'maman', day: 14, title: 'Campagne Fête des Mères', type: 'blue', status: 'pending' },
  { id: 'boost-pub-1', day: 18, title: 'Boost Pub : Lancement Google/Meta Ads', type: 'green', status: 'pending' },
  { id: 'aio-sync-2', day: 25, title: 'AIO Sync : Push Mots-Clés Perplexity', type: 'purple', status: 'confirmed' },
];

export interface ChecklistItem {
  id: number;
  category: string;
  label: string;
  completed: boolean;
}

export const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: 1, category: 'Acquisition & G.E.O.', label: 'Fiche Google connectée • Sync ChatGPT active', completed: true },
  { id: 2, category: 'Paid Media & ROAS', label: 'Audit Meta Ads effectué • ROAS Detector actif', completed: true },
  { id: 3, category: 'Data & Analytics', label: 'Tableau de bord connecté • Comparateur G.E.O. actif', completed: true },
  { id: 4, category: 'Content & Social (Calendrier)', label: 'Valider une campagne planifiée par l\'IA', completed: false },
  { id: 5, category: 'IA & Creative Factory', label: 'Générer un visuel Imagen 4.0 et un post par IA', completed: false },
  { id: 6, category: '🎬 Stories Instagram & Facebook', label: 'Publier une Story 9:16 sur Instagram ou Facebook', completed: false },
  { id: 7, category: '🌐 AIO Sync', label: 'Configurer les 12 mots-clés Perplexity & ChatGPT', completed: false },
];
