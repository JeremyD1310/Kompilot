// Academy shared types and channel catalogue

export type AcademyChannel =
  | 'all'
  | 'google-maps'
  | 'tiktok-reels'
  | 'whatsapp'
  | 'seo'
  | 'email'
  | 'instagram'
  | 'facebook'
  | 'sea';

export type AcademyFormat = 'video' | 'article' | 'checklist';
export type AcademyTier = 'free' | 'premium';

export interface AcademyModule {
  id: string;
  title: string;
  subtitle: string;
  channel: AcademyChannel;
  format: AcademyFormat;
  tier: AcademyTier;
  duration: string;
  emoji: string;
  content: string;
  tags: string[];
  createdAt: string;
  /** Contextual trigger: if the user does this action, show a notif linking here */
  contextTrigger?: string;
  /** Métier tag — used for sector-specific "Cas pratiques" filtering */
  metier?: string; // e.g. 'restaurant' | 'salon'
}

export const ACADEMY_CHANNELS: {
  id: AcademyChannel;
  label: string;
  emoji: string;
  color: string;
}[] = [
  { id: 'all',          label: 'Tous les sujets',      emoji: '🎓', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { id: 'sea',          label: 'Publicité Payante',     emoji: '💰', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { id: 'google-maps',  label: 'Google Maps',            emoji: '📍', color: 'bg-red-50 text-red-700 border-red-200' },
  { id: 'tiktok-reels', label: 'TikTok & Reels',        emoji: '🎬', color: 'bg-pink-50 text-pink-700 border-pink-200' },
  { id: 'instagram',    label: 'Instagram',              emoji: '📸', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'facebook',     label: 'Facebook',               emoji: '👥', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'whatsapp',     label: 'WhatsApp',               emoji: '💬', color: 'bg-green-50 text-green-700 border-green-200' },
  { id: 'seo',          label: 'SEO Local',              emoji: '🌐', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { id: 'email',        label: 'Email Marketing',        emoji: '📧', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
];
