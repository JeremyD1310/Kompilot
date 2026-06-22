/**
 * Competitor analysis — shared types, constants, data generators.
 */

export type PlatformId = 'instagram' | 'facebook' | 'tiktok' | 'linkedin' | 'google';

export interface PlatformConfig {
  label: string;
  emoji: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
}

export const PLATFORM_CONFIG: Record<PlatformId, PlatformConfig> = {
  instagram: { label: 'Instagram',    emoji: '📸', textClass: 'text-pink-700',  bgClass: 'bg-pink-50',   borderClass: 'border-pink-200' },
  facebook:  { label: 'Facebook',     emoji: '👥', textClass: 'text-blue-700',  bgClass: 'bg-blue-50',   borderClass: 'border-blue-200' },
  tiktok:    { label: 'TikTok',       emoji: '🎵', textClass: 'text-slate-800', bgClass: 'bg-slate-100', borderClass: 'border-slate-200' },
  linkedin:  { label: 'LinkedIn',     emoji: '💼', textClass: 'text-sky-700',   bgClass: 'bg-sky-50',    borderClass: 'border-sky-200' },
  google:    { label: 'Google Maps',  emoji: '📍', textClass: 'text-red-700',   bgClass: 'bg-red-50',    borderClass: 'border-red-200' },
};

export interface CompetitorMetrics {
  followers: Partial<Record<PlatformId, number>>;
  postsPerWeek: number;
  engagement: number;   // %
  lastPostDays: number;
  reviewScore: number;  // /5
  reviewCount: number;
  radar: {
    portée: number;      // 0-100
    engagement: number;
    régularité: number;
    réputation: number;
    contenu: number;
  };
}

export interface Competitor {
  id: string;
  name: string;
  handle?: string;
  platforms: PlatformId[];
  metrics: CompetitorMetrics;
  trend: 'up' | 'stable' | 'down';
  addedAt: string;
}

export interface RadarPoint {
  axis: string;
  vous: number;
  concurrent: number;
}

// ── My own metrics (the logged-in user's baseline) ────────────────────────────

export const MY_METRICS: CompetitorMetrics = {
  followers: { instagram: 1247, facebook: 892 },
  postsPerWeek: 3.2,
  engagement: 4.8,
  lastPostDays: 2,
  reviewScore: 4.6,
  reviewCount: 84,
  radar: { portée: 72, engagement: 85, régularité: 68, réputation: 90, contenu: 65 },
};

export const RADAR_AXES: (keyof CompetitorMetrics['radar'])[] = [
  'portée', 'engagement', 'régularité', 'réputation', 'contenu',
];

export const RADAR_LABELS: Record<string, string> = {
  portée: 'Portée', engagement: 'Engagement', régularité: 'Régularité',
  réputation: 'Réputation', contenu: 'Contenu',
};

// ── Growth intelligence ───────────────────────────────────────────────────────

export const AXIS_TIPS: Record<string, string> = {
  portée:     'Ajoutez 5–10 hashtags locaux et collaborez avec des créateurs de votre ville pour étendre votre portée.',
  engagement: 'Posez une question en fin de caption et répondez à chaque commentaire sous 2h pour booster l\'interaction.',
  régularité: 'Planifiez 4–5 posts/semaine à l\'avance avec Kompilot — la régularité est le facteur n°1 des algorithmes.',
  réputation: 'Répondez à chaque avis Google sous 24h avec des mots-clés locaux pour booster votre classement Maps.',
  contenu:    'Variez vos formats : Reels (×2/sem), carrousels éducatifs, stories quotidiennes — l\'IA Kompilot génère tout.',
};

export const AXIS_STRENGTHS: Record<string, string> = {
  portée:     'portée organique supérieure',
  engagement: "taux d'engagement excellent",
  régularité: 'publication plus régulière',
  réputation: 'meilleure réputation Google',
  contenu:    'contenu plus diversifié',
};

// ── Initial hardcoded competitors ─────────────────────────────────────────────

export const INITIAL_COMPETITORS: Competitor[] = [
  {
    id: 'comp-default-1',
    name: 'Boulangerie Martin',
    handle: '@boulangerie.martin',
    platforms: ['instagram', 'facebook'],
    metrics: {
      followers: { instagram: 2400, facebook: 1850 },
      postsPerWeek: 4.0,
      engagement: 3.8,
      lastPostDays: 3,
      reviewScore: 4.5,
      reviewCount: 127,
      radar: { portée: 78, engagement: 62, régularité: 82, réputation: 85, contenu: 71 },
    },
    trend: 'up',
    addedAt: '2026-05-01T00:00:00Z',
  },
  {
    id: 'comp-default-2',
    name: 'Pâtisserie Dubois',
    handle: '@patisserie_dubois',
    platforms: ['instagram', 'tiktok'],
    metrics: {
      followers: { instagram: 1800, tiktok: 3200 },
      postsPerWeek: 2.5,
      engagement: 6.2,
      lastPostDays: 1,
      reviewScore: 4.8,
      reviewCount: 89,
      radar: { portée: 65, engagement: 91, régularité: 58, réputation: 94, contenu: 88 },
    },
    trend: 'up',
    addedAt: '2026-05-02T00:00:00Z',
  },
  {
    id: 'comp-default-3',
    name: 'Café du Commerce',
    handle: '@cafe_du_commerce',
    platforms: ['facebook', 'google'],
    metrics: {
      followers: { facebook: 3100 },
      postsPerWeek: 5.0,
      engagement: 5.7,
      lastPostDays: 0,
      reviewScore: 4.3,
      reviewCount: 203,
      radar: { portée: 85, engagement: 79, régularité: 95, réputation: 80, contenu: 74 },
    },
    trend: 'down',
    addedAt: '2026-05-03T00:00:00Z',
  },
];

// ── Seeded metric generator ───────────────────────────────────────────────────

export function generateMetrics(name: string, platforms: PlatformId[]): CompetitorMetrics {
  let seed = 0;
  for (let i = 0; i < name.length; i++) seed = ((seed << 5) - seed + name.charCodeAt(i)) | 0;
  seed = Math.abs(seed) || 42;

  // LCG: seed sequence for deterministic values per name
  const seq: number[] = [];
  let s = seed;
  for (let i = 0; i < 14; i++) { s = (s * 1664525 + 1013904223) & 0x7fffffff; seq.push(s); }

  const r = (idx: number, lo: number, hi: number) => lo + (seq[idx % seq.length] % (hi - lo + 1));

  const followers: Partial<Record<PlatformId, number>> = {};
  platforms.forEach((p, i) => { followers[p] = r(i, 350, 9500); });

  const lastPostDays = r(5, 0, 20);
  const reviewScore = Math.round((r(6, 30, 49) / 10) * 10) / 10;

  return {
    followers,
    postsPerWeek: Math.round((r(3, 8, 60) / 10) * 10) / 10,
    engagement:   Math.round((r(4, 10, 82) / 10) * 10) / 10,
    lastPostDays,
    reviewScore,
    reviewCount: r(7, 12, 380),
    radar: {
      portée:     Math.max(20, Math.min(100, r(8,  38, 96))),
      engagement: Math.max(20, Math.min(100, r(9,  30, 95))),
      régularité: Math.max(15, Math.min(100, 100 - lastPostDays * 3 + r(10, 0, 12))),
      réputation: Math.max(30, Math.min(100, Math.round((reviewScore / 5) * 100) + r(11, -5, 8))),
      contenu:    Math.max(20, Math.min(100, r(12, 40, 93))),
    },
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function totalFollowers(c: Competitor): number {
  return Object.values(c.metrics.followers).reduce((s, v) => s + (v ?? 0), 0);
}

export function buildRadarData(competitor: Competitor): RadarPoint[] {
  return RADAR_AXES.map(ax => ({
    axis: RADAR_LABELS[ax],
    vous: MY_METRICS.radar[ax],
    concurrent: competitor.metrics.radar[ax],
  }));
}

export function generateTips(competitor: Competitor) {
  return RADAR_AXES
    .map(ax => ({ ax, gap: competitor.metrics.radar[ax] - MY_METRICS.radar[ax], tip: AXIS_TIPS[ax] }))
    .filter(t => t.gap > 5)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 3);
}

export function getStrengths(competitor: Competitor): string[] {
  return RADAR_AXES
    .filter(ax => MY_METRICS.radar[ax] - competitor.metrics.radar[ax] > 8)
    .map(ax => AXIS_STRENGTHS[ax]);
}

export function avatarGradient(name: string): string {
  const gradients = [
    'from-violet-500 to-purple-600', 'from-teal-500 to-emerald-600',
    'from-amber-500 to-orange-600', 'from-blue-500 to-sky-600',
    'from-pink-500 to-rose-600', 'from-indigo-500 to-violet-600',
  ];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) | 0;
  return gradients[Math.abs(h) % gradients.length];
}

export function trendFromSeed(name: string): 'up' | 'stable' | 'down' {
  const trends = ['up', 'stable', 'down'] as const;
  let h = 0;
  for (const c of name) h = (h * 17 + c.charCodeAt(0)) | 0;
  return trends[Math.abs(h) % 3];
}
