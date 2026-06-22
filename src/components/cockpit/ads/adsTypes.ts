// Shared types & static data for DataDrivenAIAds feature

export type CreativeSource = 'ad_spy' | 'aio_trends' | 'top_reels' | 'competitor_hooks';
export type SubtitleStyle = 'bold_yellow' | 'minimal_white' | 'karaoke_teal' | 'none';

export interface ScriptStep {
  id: 'hook' | 'body' | 'cta';
  label: string;
  placeholder: string;
  value: string;
}

export interface Actor {
  id: string;
  name: string;
  accent: string;
  avatarBg: string;
  initials: string;
  available: boolean;
}

export const CREATIVE_SOURCES: { id: CreativeSource; label: string; badge?: string }[] = [
  { id: 'ad_spy',           label: 'Ad Spy — Top performing creatives',   badge: '🔥 Live' },
  { id: 'aio_trends',       label: 'AIO Trends — AI-detected viral hooks', badge: '⚡ New' },
  { id: 'top_reels',        label: 'Top Reels — Secteur sélectionné',     badge: '📊 Data' },
  { id: 'competitor_hooks', label: 'Competitor Hooks — Analyse concurrents' },
];

export const ACTORS: Actor[] = [
  { id: 'a1', name: 'Sophie', accent: 'Français (FR)', avatarBg: '#7C3AED', initials: 'SO', available: true },
  { id: 'a2', name: 'Marcus', accent: 'Français (BE)', avatarBg: '#0D9488', initials: 'MA', available: true },
  { id: 'a3', name: 'Elena',  accent: 'English (UK)',  avatarBg: '#DB2777', initials: 'EL', available: true },
  { id: 'a4', name: 'Noah',   accent: 'English (US)',  avatarBg: '#EA580C', initials: 'NO', available: true },
  { id: 'a5', name: 'Amara',  accent: 'Français (MC)', avatarBg: '#0369A1', initials: 'AM', available: false },
  { id: 'a6', name: 'Lucas',  accent: 'Espagnol (ES)', avatarBg: '#16A34A', initials: 'LU', available: false },
];

export const SUBTITLE_STYLES: { id: SubtitleStyle; label: string; preview: string }[] = [
  { id: 'bold_yellow',   label: 'Bold Yellow',   preview: '#FFD600' },
  { id: 'minimal_white', label: 'Minimal White', preview: '#FFFFFF' },
  { id: 'karaoke_teal',  label: 'Karaoke Teal',  preview: '#0D9488' },
  { id: 'none',          label: 'Off',           preview: 'transparent' },
];

export const DEFAULT_SCRIPT: ScriptStep[] = [
  {
    id: 'hook', label: 'Hook (0–3s)',
    placeholder: 'Commencez par une accroche percutante…',
    value: 'Saviez-vous que 78% des PME perdent des clients faute de visibilité en ligne ?',
  },
  {
    id: 'body', label: 'Body (3–12s)',
    placeholder: 'Développez votre message principal…',
    value: 'Avec Kompilot, lancez vos campagnes en 60 secondes, gérez vos avis, et pilotez votre présence digitale depuis un seul cockpit — sans agence, sans friction.',
  },
  {
    id: 'cta', label: 'CTA (12–15s)',
    placeholder: "Terminez par un appel à l'action\u2026",
    value: 'Essayez gratuitement sur kompilot.fr — lien en bio.',
  },
];
