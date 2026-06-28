/**
 * Mock fixtures for Campaign Calendar — realistic scheduled posts and metrics.
 */
// ── Scheduled Posts ───────────────────────────────────────────────────────────

export interface MockScheduledPost {
  id: string;
  title: string;
  content: string;
  platform: 'instagram' | 'facebook' | 'linkedin' | 'google' | 'tiktok';
  status: 'published' | 'scheduled' | 'draft';
  scheduledAt: string;
  imageUrl?: string;
  engagement?: { likes: number; comments: number; shares: number; reach: number };
}

const now = Date.now();
const h = (hours: number) => new Date(now + hours * 60 * 60 * 1000).toISOString();
const ago = (hours: number) => new Date(now - hours * 60 * 60 * 1000).toISOString();

export const MOCK_SCHEDULED_POSTS: MockScheduledPost[] = [
  {
    id: 'post_demo_1',
    title: '🌟 Nouveau menu de saison',
    content: 'Découvrez notre nouveau menu de printemps ! Des saveurs fraîches et locales pour éveiller vos papilles. Réservation conseillée 📞',
    platform: 'instagram',
    status: 'published',
    scheduledAt: ago(4),
    imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=400&fit=crop',
    engagement: { likes: 124, comments: 18, shares: 7, reach: 2340 },
  },
  {
    id: 'post_demo_2',
    title: '💡 3 astuces SEO local',
    content: 'Votre fiche Google Business est votre meilleure alliée. Voici 3 conseils pour apparaître dans le top 3 des résultats locaux...',
    platform: 'linkedin',
    status: 'published',
    scheduledAt: ago(28),
    engagement: { likes: 89, comments: 12, shares: 23, reach: 4100 },
  },
  {
    id: 'post_demo_3',
    title: '🎉 Offre spéciale -20%',
    content: 'Ce week-end seulement : -20% sur tous nos soins ! Offre valable sur réservation en ligne uniquement.',
    platform: 'facebook',
    status: 'scheduled',
    scheduledAt: h(6),
    imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=400&fit=crop',
  },
  {
    id: 'post_demo_4',
    title: '📍 Top 5 des plages à Nice',
    content: 'Planning your trip to Nice? Here are our top 5 beach recommendations from a local! 🏖️ #NiceFrance #TravelTips',
    platform: 'google',
    status: 'scheduled',
    scheduledAt: h(18),
  },
  {
    id: 'post_demo_5',
    title: '🎬 Behind the scenes',
    content: '🎬 Regardez notre équipe préparer votre plat favori en coulisses ! #behindthescenes #restaurant #foodie',
    platform: 'tiktok',
    status: 'draft',
    scheduledAt: h(48),
  },
  {
    id: 'post_demo_6',
    title: '☀️ Terrasse ouverte !',
    content: 'Le soleil est de retour et notre terrasse est prête à vous accueillir ! Profitez de -15% sur les brunchs ce dimanche 🥐',
    platform: 'instagram',
    status: 'scheduled',
    scheduledAt: h(30),
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=400&fit=crop',
  },
];

// ── Calendar Analytics (for charts) ───────────────────────────────────────────

export interface MockCalendarMetric {
  date: string;
  posts: number;
  reach: number;
  engagement: number;
}

export const MOCK_CALENDAR_METRICS: MockCalendarMetric[] = [
  { date: 'Lun', posts: 2, reach: 3200, engagement: 5.2 },
  { date: 'Mar', posts: 1, reach: 2800, engagement: 4.8 },
  { date: 'Mer', posts: 3, reach: 5100, engagement: 6.1 },
  { date: 'Jeu', posts: 2, reach: 4300, engagement: 5.5 },
  { date: 'Ven', posts: 4, reach: 7800, engagement: 7.2 },
  { date: 'Sam', posts: 1, reach: 2100, engagement: 3.9 },
  { date: 'Dim', posts: 0, reach: 0, engagement: 0 },
];

// ── Best Time Slots ───────────────────────────────────────────────────────────

export const MOCK_BEST_TIMES = [
  { day: 'Lundi', slot: '12h00 - 13h00', score: 92 },
  { day: 'Mercredi', slot: '18h00 - 19h00', score: 88 },
  { day: 'Vendredi', slot: '11h00 - 12h00', score: 85 },
  { day: 'Samedi', slot: '10h00 - 11h00', score: 81 },
];
