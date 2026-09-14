/**
 * UGCVideoAdGenerator — Shared types, constants, and mock data.
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export type Step = 'upload' | 'analyzing' | 'scripts_ready' | 'generating' | 'completed';

export interface UGCVideoScript {
  angle: string;
  hook: { text: string; type: string };
  body: { points: Array<{ text: string; duration: string }>; transition: string };
  cta: { text: string; type: string };
  fullScript: string;
  estimatedDuration: string;
  visualDescription: string;
}

export interface VideoVariant {
  index: number;
  status: string;
  generationId: string;
  videoUrl: string;
  aspectRatio: string;
  visualPrompt: string;
  errorMessage: string;
  /** P1: Luma progress 0-100, estimated from poll count */
  progress?: number;
  /** P1: Seconds elapsed since generation started */
  elapsedSeconds?: number;
}

export interface AnalyzeResponse {
  projectId: string;
  scripts: UGCVideoScript[];
}

export interface StatusResponse {
  project: {
    id: string;
    userId: string;
    productImageUrl: string;
    productDescription: string;
    productName: string;
    status: string;
    creditsCost: number;
    createdAt: string;
    updatedAt: string;
  };
  scripts: UGCVideoScript[];
  videoVariants: VideoVariant[];
}

// ── Constants ──────────────────────────────────────────────────────────────────

export const ANGLE_EMOJI: Record<string, string> = {
  'Témoignage': '🎤',
  'Avant/Après': '🔄',
  'Problème/Solution': '🎯',
  'Déballage': '📦',
  'Storytelling': '📖',
  'Comparaison': '⚖️',
  'Tutoriel': '📚',
  'Transformation': '✨',
};

import { Smartphone, Video, Image as ImageIcon } from 'lucide-react';

export const ASPECT_RATIOS = [
  { id: '9:16', label: '9:16 Reels', icon: Smartphone },
  { id: '1:1', label: '1:1 Feed', icon: ImageIcon },
  { id: '16:9', label: '16:9 Paysage', icon: Video },
] as const;

// ── Demo mock data ────────────────────────────────────────────────────────────

export const MOCK_SCRIPTS: UGCVideoScript[] = [
  {
    angle: 'Témoignage',
    hook: { text: 'J\'ai testé ce produit pendant 7 jours… et voici ce qui s\'est passé.', type: 'curiosity' },
    body: {
      points: [
        { text: 'Première impression : packaging premium, texture agréable', duration: '4s' },
        { text: 'Jour 3 : premiers résultats visibles, ma peau est plus lumineuse', duration: '5s' },
        { text: 'Jour 7 : transformation complète, je ne peux plus m\'en passer', duration: '5s' },
      ],
      transition: 'Voici les résultats jour par jour.',
    },
    cta: { text: 'Commandez maintenant avec le code PROMO10 — lien dans la bio !', type: 'promo' },
    fullScript: 'J\'ai testé ce produit pendant 7 jours… et voici ce qui s\'est passé.\n\nPremière impression : packaging premium, texture agréable\nJour 3 : premiers résultats visibles, ma peau est plus lumineuse\nJour 7 : transformation complète, je ne peux plus m\'en passer\n\nCommandez maintenant avec le code PROMO10 — lien dans la bio !',
    estimatedDuration: '22s',
    visualDescription: 'Plan rapproché produit, split screen avant/après, lumière naturelle douce',
  },
  {
    angle: 'Avant/Après',
    hook: { text: 'Regardez la différence en seulement 3 applications !', type: 'transformation' },
    body: {
      points: [
        { text: 'AVANT : imperfections visibles, teint terne', duration: '3s' },
        { text: 'Application : texture soyeuse, absorption rapide', duration: '3s' },
        { text: 'APRÈS : peau éclatante, unifiée, résultat visible', duration: '4s' },
      ],
      transition: 'La transformation parle d\'elle-même.',
    },
    cta: { text: 'Essayez-le sans risque — satisfait ou remboursé !', type: 'guarantee' },
    fullScript: 'Regardez la différence en seulement 3 applications !\n\nAVANT : imperfections visibles, teint terne\nApplication : texture soyeuse, absorption rapide\nAPRÈS : peau éclatante, unifiée, résultat visible\n\nEssayez-le sans risque — satisfait ou remboursé !',
    estimatedDuration: '18s',
    visualDescription: 'Split screen avant/après, plan macro texture, lumière studio',
  },
  {
    angle: 'Problème/Solution',
    hook: { text: 'Vous en avez marre des produits qui promettent tout et ne font rien ?', type: 'pain_point' },
    body: {
      points: [
        { text: 'Le problème : 90% des crèmes ne pénètrent pas la barrière cutanée', duration: '4s' },
        { text: 'Notre solution : technologie Liposome Delivery, 3x plus efficace', duration: '5s' },
        { text: 'Le résultat : actifs délivrés en profondeur, résultats cliniquement prouvés', duration: '5s' },
      ],
      transition: 'On passe à la solution.',
    },
    cta: { text: 'Passez à l\'action — commande express disponible sur notre site !', type: 'urgency' },
    fullScript: 'Vous en avez marre des produits qui promettent tout et ne font rien ?\n\nLe problème : 90% des crèmes ne pénètrent pas la barrière cutanée\nNotre solution : technologie Liposome Delivery, 3x plus efficace\nLe résultat : actifs délivrés en profondeur, résultats cliniquement prouvés\n\nPassez à l\'action — commande express disponible sur notre site !',
    estimatedDuration: '24s',
    visualDescription: 'Animation graphique coupe de peau, gros plan texture, infographie résultats',
  },
  {
    angle: 'Déballage',
    hook: { text: 'Je viens de recevoir LE colis que j\'attendais… ouvrons-le ensemble !', type: 'unboxing' },
    body: {
      points: [
        { text: 'Première ouverture : packaging éco-responsable, attention au détail', duration: '4s' },
        { text: 'Découverte produit : flacon en verre dépoli, pipette précise', duration: '4s' },
        { text: 'Premier test : une seule goutte suffit, parfum subtil et naturel', duration: '5s' },
      ],
      transition: 'Regardons ça de plus près.',
    },
    cta: { text: 'Disponible maintenant — cliquez pour découvrir la gamme complète !', type: 'discover' },
    fullScript: 'Je viens de recevoir LE colis que j\'attendais… ouvrons-le ensemble !\n\nPremière ouverture : packaging éco-responsable, attention au détail\nDécouverte produit : flacon en verre dépoli, pipette précise\nPremier test : une seule goutte suffit, parfum subtil et naturel\n\nDisponible maintenant — cliquez pour découvrir la gamme complète !',
    estimatedDuration: '20s',
    visualDescription: 'Plan subjectif déballage, macro produit, ambiance cosy',
  },
];

export const MOCK_VIDEOS: VideoVariant[] = [
  {
    index: 0, status: 'completed', generationId: 'demo_gen_1',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    aspectRatio: '9:16', visualPrompt: 'Témoignage beauty product', errorMessage: '',
  },
  {
    index: 1, status: 'completed', generationId: 'demo_gen_2',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    aspectRatio: '1:1', visualPrompt: 'Avant/Après transformation', errorMessage: '',
  },
  {
    index: 2, status: 'processing', generationId: 'demo_gen_3',
    videoUrl: '', aspectRatio: '9:16',
    visualPrompt: 'Problème/Solution skincare', errorMessage: '',
  },
  {
    index: 3, status: 'processing', generationId: 'demo_gen_4',
    videoUrl: '', aspectRatio: '16:9',
    visualPrompt: 'Déballage premium product', errorMessage: '',
  },
];
