/**
 * Mock fixtures for Creative Studio — ultra-realistic demo data.
 *
 * Injected when SandboxToggle is in "Demo Mode" or when APIs are unavailable.
 * All data is French-locale, visually rich, and sector-agnostic.
 */
import type { IntegrationId } from '../../context/IntegrationStatusContext';

// ── Luma AI Video Generations ─────────────────────────────────────────────────

export interface MockLumaVideo {
  id: string;
  prompt: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: string;
  aspectRatio: string;
  status: 'completed' | 'processing' | 'queued';
  createdAt: string;
}

export const MOCK_LUMA_VIDEOS: MockLumaVideo[] = [
  {
    id: 'luma_demo_1',
    prompt: 'Vue aérienne d\'un restaurant méditerranéen en terrasse au coucher du soleil, ambiance chaleureuse',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=225&fit=crop',
    videoUrl: '',
    duration: '5s',
    aspectRatio: '9:16',
    status: 'completed',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'luma_demo_2',
    prompt: 'Close-up d\'un artisan boulanger pétrissant la pâte, farine qui vole, lumière dorée matinale',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=225&fit=crop',
    videoUrl: '',
    duration: '5s',
    aspectRatio: '16:9',
    status: 'processing',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'luma_demo_3',
    prompt: 'Salon de coiffure moderne, miroirs lumineux, stylistes au travail, ambiance tendance',
    thumbnailUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=225&fit=crop',
    videoUrl: '',
    duration: '5s',
    aspectRatio: '1:1',
    status: 'queued',
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
];

// ── UGC Scripts ───────────────────────────────────────────────────────────────

export interface MockUGCScript {
  id: string;
  topic: string;
  tone: 'expert' | 'energetic' | 'seducer';
  hook: { text: string; type: string };
  bodyPoints: Array<{ text: string; duration: string }>;
  cta: { text: string; type: string };
  estimatedDuration: string;
  createdAt: string;
}

export const MOCK_UGC_SCRIPTS: MockUGCScript[] = [
  {
    id: 'ugc_demo_1',
    topic: 'Pourquoi votre restaurant a besoin d\'une présence Google',
    tone: 'energetic',
    hook: { text: 'Vous saviez que 78% des clients cherchent un restaurant sur Google AVANT d\'y aller ?', type: 'statistic' },
    bodyPoints: [
      { text: 'Votre fiche Google, c\'est votre vitrine digitale — ouverte 24h/24', duration: '5s' },
      { text: 'Les avis positifs boostent votre référencement local de manière exponentielle', duration: '5s' },
      { text: 'Avec Kompilot, vous gérez tout depuis un seul tableau de bord', duration: '5s' },
    ],
    cta: { text: 'Testez Kompilot gratuitement pendant 14 jours — le lien est dans la bio !', type: 'website' },
    estimatedDuration: '28s',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ugc_demo_2',
    topic: 'Comment automatiser vos réponses aux avis Google',
    tone: 'expert',
    hook: { text: 'Chaque avis sans réponse, c\'est un client potentiel que vous perdez.', type: 'provocation' },
    bodyPoints: [
      { text: 'L\'IA de Kompilot analyse le ton de l\'avis et propose une réponse personnalisée', duration: '6s' },
      { text: 'Vous validez en un clic — ou l\'IA publie automatiquement en mode pilote', duration: '5s' },
      { text: 'Résultat : +40% de taux de réponse, zéro effort supplémentaire', duration: '5s' },
    ],
    cta: { text: 'Réservez votre démo gratuite sur kompilot.fr', type: 'booking' },
    estimatedDuration: '30s',
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
];

// ── AIO Sync Reports ──────────────────────────────────────────────────────────

export interface MockAIOSyncReport {
  id: string;
  domain: string;
  score: number;
  previousScore: number;
  visibility: number;
  aiReadiness: number;
  topRecommendation: string;
  generatedAt: string;
}

export const MOCK_AIO_REPORTS: MockAIOSyncReport[] = [
  {
    id: 'aio_demo_1',
    domain: 'restaurant-lepetitnice.fr',
    score: 78,
    previousScore: 62,
    visibility: 84,
    aiReadiness: 71,
    topRecommendation: 'Ajouter le balisage Schema.org LocalBusiness pour améliorer la visibilité IA de 23%',
    generatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'aio_demo_2',
    domain: 'salon-elegance-paris.fr',
    score: 65,
    previousScore: 58,
    visibility: 72,
    aiReadiness: 58,
    topRecommendation: 'Structurer les FAQ en JSON-LD pour apparaître dans les réponses IA de Google',
    generatedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
];

// ── Voiceover Demo ────────────────────────────────────────────────────────────

export interface MockVoiceover {
  id: string;
  text: string;
  voice: string;
  duration: string;
  audioUrl: string;
  createdAt: string;
}

export const MOCK_VOICEOVERS: MockVoiceover[] = [
  {
    id: 'vo_demo_1',
    text: 'Bienvenue chez Le Petit Nice, votre restaurant méditerranéen au cœur de la ville. Découvrez nos plats frais, préparés avec amour chaque jour.',
    voice: 'nova',
    duration: '12s',
    audioUrl: '',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
];

// ── Integration Status Mocks ──────────────────────────────────────────────────

export interface MockIntegrationStatus {
  id: IntegrationId;
  label: string;
  state: 'connected' | 'disconnected' | 'degraded';
  latencyMs: number;
  lastSuccess: string;
}

export const MOCK_INTEGRATION_STATUSES: MockIntegrationStatus[] = [
  { id: 'meta', label: 'Meta / Facebook', state: 'connected', latencyMs: 230, lastSuccess: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
  { id: 'google_business', label: 'Google Business', state: 'connected', latencyMs: 180, lastSuccess: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
  { id: 'openai', label: 'OpenAI', state: 'connected', latencyMs: 420, lastSuccess: new Date(Date.now() - 2 * 60 * 1000).toISOString() },
  { id: 'luma', label: 'Luma AI', state: 'degraded', latencyMs: 3200, lastSuccess: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
  { id: 'stripe', label: 'Stripe', state: 'connected', latencyMs: 90, lastSuccess: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
  { id: 'tiktok', label: 'TikTok', state: 'disconnected', latencyMs: 0, lastSuccess: '' },
  { id: 'serpapi', label: 'SerpApi', state: 'connected', latencyMs: 310, lastSuccess: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
  { id: 'claude', label: 'Claude', state: 'connected', latencyMs: 280, lastSuccess: new Date(Date.now() - 3 * 60 * 1000).toISOString() },
  { id: 'sendgrid', label: 'SendGrid', state: 'connected', latencyMs: 150, lastSuccess: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
  { id: 'whatsapp', label: 'WhatsApp', state: 'disconnected', latencyMs: 0, lastSuccess: '' },
];
