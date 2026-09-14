/**
 * Social-to-SEO Mock Data
 *
 * Comprehensive mock data for the Social-to-SEO dashboard.
 * These types and data simulate real Google Search Console + social platform APIs.
 *
 * Terminology guide (for non-technical users):
 * - Impressions: Number of times your content appeared in Google search results
 * - CTR (Click-Through Rate): % of people who clicked after seeing your content in search
 * - Engagement Rate: % of people who interacted (liked, shared, commented) with your post
 * - Organic Traffic: Visitors who found you via unpaid search results (not ads)
 * - Cross-Network: Analysis comparing your performance across different social platforms
 * - SERP: Search Engine Results Page (the page Google shows after a search)
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type Platform = 'all' | 'instagram' | 'tiktok' | 'linkedin' | 'youtube'

export interface QueryData {
  query: string        // The search term people typed into Google
  impressions: number  // How many times your content appeared for this query
  clicks: number       // How many times users clicked on your content
  ctr: number          // Click-Through Rate: clicks ÷ impressions × 100
  position: number     // Average position in Google search results (1 = top)
}

export interface PlatformTopPost {
  id: string
  title: string
  url: string
  thumbnailUrl?: string
  publishedAt: string
  engagementRate: number  // % of people who interacted with this post
}

export interface PlatformMetrics {
  platform: Platform
  impressions: number       // Total Google impressions from this platform's content
  clicks: number            // Total organic clicks from this platform's content
  ctr: number               // Average Click-Through Rate for this platform
  weeklyTrend: number       // % change compared to last week (+ = improvement)
  queries: QueryData[]      // Top search queries driving traffic to this platform's content
  topPost?: PlatformTopPost // Best performing post from this platform
  connectedAt: string       // When this platform was connected
  postCount: number         // Number of posts analyzed
  avgEngagement: number     // Average engagement rate across all posts
}

export interface GoogleBusinessProfileMetrics {
  reviewsCount: number      // Total number of Google reviews
  averageRating: number     // Average star rating (1-5)
  newReviewsThisWeek: number
  profileViews: number      // Times your Google Business profile was viewed
  websiteClicks: number     // Clicks from your profile to your website
  directionRequests: number // People who asked for directions
  callClicks: number        // People who clicked to call you
}

export interface CrossNetworkInsight {
  id: string
  type: 'keyword_opportunity' | 'content_repurpose' | 'trend_alert' | 'gap_detected'
  severity: 'high' | 'medium' | 'low'
  sourcePlatform: string    // Platform where the opportunity was detected
  targetPlatform: string    // Platform where you should act
  title: string
  description: string
  actionableRecommendation: string  // Concrete next step for the user
  estimatedImpact: string           // Expected result if you follow the recommendation
  detectedAt: string
  relatedQuery?: string     // The search query related to this insight
  relatedPostId?: string    // The post related to this insight
}

export interface TopPost {
  id: string
  platform: Platform
  title: string
  url: string
  thumbnailUrl?: string
  publishedAt: string
  impressions: number       // Google impressions for this post
  clicks: number            // Organic clicks to this post
  ctr: number               // Click-Through Rate
  engagementRate: number    // Social engagement rate (likes, shares, comments)
  associatedQueries: string[] // Search terms that lead to this post
}

export interface WeeklySnapshot {
  weekStart: string
  weekEnd: string
  totalImpressions: number
  totalClicks: number
  globalCtr: number
  impressionsEvolution: number  // % change vs previous week
}

export interface QueryTrend {
  query: string
  dataPoints: { date: string; impressions: number; clicks: number }[]
  trend: 'rising' | 'stable' | 'declining'
  weeklyGrowth: number  // % growth this week
}

export interface SocialSeoDashboardData {
  connectedPlatforms: string[]
  overallMetrics: {
    totalImpressions: number
    totalClicks: number
    globalCtr: number
    impressionsEvolution: number
  }
  platformMetrics: PlatformMetrics[]
  googleBusinessProfile: GoogleBusinessProfileMetrics
  crossNetworkInsights: CrossNetworkInsight[]
  topPosts: TopPost[]
  weeklySnapshots: WeeklySnapshot[]
  queryTrends: QueryTrend[]
  lastSyncAt: string
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

export const mockPlatformMetrics: PlatformMetrics[] = [
  {
    platform: 'instagram',
    impressions: 45_200,
    clicks: 3_180,
    ctr: 7.04,
    weeklyTrend: 18.5,
    postCount: 42,
    avgEngagement: 8.3,
    connectedAt: '2026-04-15T10:00:00Z',
    queries: [
      { query: 'restaurant bio paris', impressions: 12_400, clicks: 1_120, ctr: 9.03, position: 3.2 },
      { query: 'brunch vegan paris 11e', impressions: 8_700, clicks: 680, ctr: 7.82, position: 4.1 },
      { query: 'menu déjeuner healthy', impressions: 6_200, clicks: 410, ctr: 6.61, position: 5.8 },
      { query: 'salade bowl bio livraison', impressions: 4_500, clicks: 290, ctr: 6.44, position: 7.2 },
      { query: 'restaurant terrasse paris', impressions: 3_800, clicks: 220, ctr: 5.79, position: 8.5 },
    ],
    topPost: {
      id: 'ig-001',
      title: 'Notre nouveau Bowl Signature 🥑',
      url: 'https://instagram.com/p/abc123',
      thumbnailUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=80&h=80&fit=crop',
      publishedAt: '2026-07-06T12:00:00Z',
      engagementRate: 12.4,
    },
  },
  {
    platform: 'tiktok',
    impressions: 38_600,
    clicks: 2_410,
    ctr: 6.24,
    weeklyTrend: 24.3,
    postCount: 28,
    avgEngagement: 15.7,
    connectedAt: '2026-05-01T10:00:00Z',
    queries: [
      { query: 'recette healthy facile', impressions: 15_200, clicks: 1_050, ctr: 6.91, position: 2.8 },
      { query: 'asmr cooking sounds', impressions: 9_400, clicks: 520, ctr: 5.53, position: 6.1 },
      { query: 'meal prep débutant', impressions: 5_800, clicks: 380, ctr: 6.55, position: 4.9 },
      { query: 'trend food 2026', impressions: 4_100, clicks: 260, ctr: 6.34, position: 7.3 },
    ],
    topPost: {
      id: 'tt-001',
      title: 'POV: tu découvres le meilleur bowl de Paris 🤯',
      url: 'https://tiktok.com/@restaurantbio/video/xyz789',
      publishedAt: '2026-07-04T18:30:00Z',
      engagementRate: 18.2,
    },
  },
  {
    platform: 'linkedin',
    impressions: 9_600,
    clicks: 480,
    ctr: 5.0,
    weeklyTrend: 6.3,
    postCount: 32,
    avgEngagement: 4.1,
    connectedAt: '2026-03-20T10:00:00Z',
    queries: [
      { query: 'restaurant durable paris', impressions: 3_200, clicks: 160, ctr: 5.0, position: 6.4 },
      { query: 'food tech startup france', impressions: 2_400, clicks: 120, ctr: 5.0, position: 5.9 },
      { query: 'alimentation locale avis', impressions: 2_100, clicks: 105, ctr: 5.0, position: 7.1 },
    ],
    topPost: {
      id: 'li-001',
      title: 'Notre engagement 100% local — une vision pour l\'avenir',
      url: 'https://linkedin.com/company/restaurantbio/posts/123',
      publishedAt: '2026-07-03T09:00:00Z',
      engagementRate: 5.2,
    },
  },
  {
    platform: 'youtube',
    impressions: 22_500,
    clicks: 1_580,
    ctr: 7.02,
    weeklyTrend: 12.7,
    postCount: 12,
    avgEngagement: 6.1,
    connectedAt: '2026-06-01T10:00:00Z',
    queries: [
      { query: 'visite cuisine restaurant bio', impressions: 7_800, clicks: 580, ctr: 7.44, position: 3.5 },
      { query: 'comment manger sainement', impressions: 5_600, clicks: 420, ctr: 7.5, position: 4.2 },
      { query: 'vlog food paris', impressions: 4_900, clicks: 310, ctr: 6.33, position: 5.7 },
      { query: 'recette bowl maison', impressions: 3_200, clicks: 190, ctr: 5.94, position: 6.8 },
    ],
    topPost: {
      id: 'yt-001',
      title: 'Visite complète de notre cuisine — Du champ à l\'assiette 🌱',
      url: 'https://youtube.com/watch?v=example123',
      thumbnailUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=120&h=80&fit=crop',
      publishedAt: '2026-06-28T14:00:00Z',
      engagementRate: 8.9,
    },
  },
]

export const mockGoogleBusinessProfile: GoogleBusinessProfileMetrics = {
  reviewsCount: 247,
  averageRating: 4.7,
  newReviewsThisWeek: 12,
  profileViews: 18_400,
  websiteClicks: 2_850,
  directionRequests: 1_230,
  callClicks: 340,
}

export const mockCrossNetworkInsights: CrossNetworkInsight[] = [
  {
    id: 'cni-001',
    type: 'keyword_opportunity',
    severity: 'high',
    sourcePlatform: 'tiktok',
    targetPlatform: 'youtube',
    title: '"recette healthy facile" explose sur TikTok — absent de YouTube',
    description: 'Le terme "recette healthy facile" génère 15 200 impressions sur TikTok avec un CTR de 6,9%. Aucun contenu YouTube ne cible ce mot-clé. YouTube favorise les tutoriels de 5-10 min — parfait pour des recettes filmées.',
    actionableRecommendation: 'Créez une vidéo YouTube "5 recettes healthy en 10 minutes" en réutilisant les ingrédients de vos posts TikTok les plus vus.',
    estimatedImpact: '+2 500 impressions estimées / semaine',
    detectedAt: '2026-07-10T08:00:00Z',
    relatedQuery: 'recette healthy facile',
    relatedPostId: 'tt-001',
  },
  {
    id: 'cni-002',
    type: 'content_repurpose',
    severity: 'high',
    sourcePlatform: 'instagram',
    targetPlatform: 'tiktok',
    title: 'Votre post Instagram (engagement 12,4%) mérite d\'être décliné sur TikTok',
    description: '"Notre nouveau Bowl Signature 🥑" a un taux d\'engagement exceptionnel de 12,4% sur Instagram. Ce format visuel fonctionne aussi sur TikTok avec un angle ASMR ou "satisfying".',
    actionableRecommendation: 'Filmez la préparation du Bowl Signature en ASMR pour TikTok. Ajoutez le texte "POV: ton nouveau plat préféré" pour coller aux tendances.',
    estimatedImpact: 'Engagement potentiel similaire (15%+) sur TikTok',
    detectedAt: '2026-07-10T08:00:00Z',
    relatedPostId: 'ig-001',
  },
  {
    id: 'cni-003',
    type: 'trend_alert',
    severity: 'medium',
    sourcePlatform: 'tiktok',
    targetPlatform: 'instagram',
    title: '"alimentation locale" en hausse sur TikTok — Opportunité Stories Instagram',
    description: 'Les conversations sur l\'alimentation locale augmentent de 32% sur TikTok cette semaine. Votre audience Instagram adhère déjà au "100% local" — c\'est le moment de créer des Stories engageantes.',
    actionableRecommendation: 'Publiez 3 Stories Instagram montrant vos producteurs locaux avec des sondages "Devinez d\'où vient ce légume ?".',
    estimatedImpact: '+15% d\'engagement Stories cette semaine',
    detectedAt: '2026-07-09T12:00:00Z',
    relatedQuery: 'alimentation locale avis',
  },
  {
    id: 'cni-004',
    type: 'gap_detected',
    severity: 'medium',
    sourcePlatform: 'youtube',
    targetPlatform: 'instagram',
    title: 'Vos vidéos YouTube performent sur "visite cuisine" — Pas de Reels équivalent',
    description: '"Visite cuisine restaurant bio" génère 7 800 impressions sur YouTube. Aucun Reels Instagram ne couvre ce sujet. Les Reels de coulisses performent 3x mieux que les posts classiques.',
    actionableRecommendation: 'Créez un Reels de 30s montrant les coulisses de votre cuisine avec le texte "Ce qu\'on ne vous montre jamais".',
    estimatedImpact: '+5 000 vues estimées sur le Reels',
    detectedAt: '2026-07-08T10:00:00Z',
    relatedQuery: 'visite cuisine restaurant bio',
  },
  {
    id: 'cni-005',
    type: 'keyword_opportunity',
    severity: 'low',
    sourcePlatform: 'instagram',
    targetPlatform: 'linkedin',
    title: '"restaurant terrasse paris" — Opportunité LinkedIn pour l\'été',
    description: 'Ce terme génère 3 800 impressions sur Instagram. Sur LinkedIn, les recommandations de restaurants durables sont très appréciées par les professionnels.',
    actionableRecommendation: 'Publiez un article LinkedIn "Top 5 terrasses bio à Paris" en mettant en avant votre engagement local.',
    estimatedImpact: '+600 impressions / semaine auprès d\'une audience qualifiée',
    detectedAt: '2026-07-07T09:00:00Z',
    relatedQuery: 'restaurant terrasse paris',
  },
]

export const mockTopPosts: TopPost[] = [
  {
    id: 'post-001',
    platform: 'instagram',
    title: 'Notre nouveau Bowl Signature 🥑',
    url: 'https://instagram.com/p/abc123',
    thumbnailUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=80&h=80&fit=crop',
    publishedAt: '2026-07-06T12:00:00Z',
    impressions: 12_400,
    clicks: 1_120,
    ctr: 9.03,
    engagementRate: 12.4,
    associatedQueries: ['restaurant bio paris', 'bowl signature', 'salade healthy paris'],
  },
  {
    id: 'post-002',
    platform: 'tiktok',
    title: 'POV: tu découvres le meilleur bowl de Paris 🤯',
    url: 'https://tiktok.com/@restaurantbio/video/xyz789',
    publishedAt: '2026-07-04T18:30:00Z',
    impressions: 15_200,
    clicks: 1_050,
    ctr: 6.91,
    engagementRate: 18.2,
    associatedQueries: ['recette healthy facile', 'bowl paris tiktok', 'trend food 2026'],
  },
  {
    id: 'post-003',
    platform: 'youtube',
    title: 'Visite complète de notre cuisine — Du champ à l\'assiette 🌱',
    url: 'https://youtube.com/watch?v=example123',
    thumbnailUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=120&h=80&fit=crop',
    publishedAt: '2026-06-28T14:00:00Z',
    impressions: 7_800,
    clicks: 580,
    ctr: 7.44,
    engagementRate: 8.9,
    associatedQueries: ['visite cuisine restaurant bio', 'coulisses cuisine', 'du champ à l\'assiette'],
  },
  {
    id: 'post-004',
    platform: 'instagram',
    title: 'Story Behind : Nos producteurs locaux 🧑‍🌾',
    url: 'https://instagram.com/stories/abc456',
    thumbnailUrl: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=80&h=80&fit=crop',
    publishedAt: '2026-07-02T09:00:00Z',
    impressions: 8_700,
    clicks: 680,
    ctr: 7.82,
    engagementRate: 9.1,
    associatedQueries: ['brunch vegan paris 11e', 'producteur local bio'],
  },
  {
    id: 'post-005',
    platform: 'tiktok',
    title: 'ASMR : Préparation du Granola Maison 🎧',
    url: 'https://tiktok.com/@restaurantbio/video/abc456',
    publishedAt: '2026-07-01T16:00:00Z',
    impressions: 9_400,
    clicks: 520,
    ctr: 5.53,
    engagementRate: 15.7,
    associatedQueries: ['asmr cooking sounds', 'granola maison recette', 'meal prep débutant'],
  },
  {
    id: 'post-006',
    platform: 'facebook',
    title: 'Post : Pourquoi nous avons choisi le 100% local',
    url: 'https://facebook.com/restaurantbio/posts/123',
    publishedAt: '2026-07-03T09:00:00Z',
    impressions: 4_200,
    clicks: 210,
    ctr: 5.0,
    engagementRate: 4.8,
    associatedQueries: ['restaurant durable paris', 'alimentation locale avis'],
  },
  {
    id: 'post-007',
    platform: 'youtube',
    title: 'Comment manger sainement au restaurant — Guide complet',
    url: 'https://youtube.com/watch?v=example456',
    thumbnailUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=120&h=80&fit=crop',
    publishedAt: '2026-06-25T10:00:00Z',
    impressions: 5_600,
    clicks: 420,
    ctr: 7.5,
    engagementRate: 6.1,
    associatedQueries: ['comment manger sainement', 'restaurant healthy guide'],
  },
]

export const mockWeeklySnapshots: WeeklySnapshot[] = [
  { weekStart: '2026-06-16', weekEnd: '2026-06-22', totalImpressions: 85_400, totalClicks: 5_620, globalCtr: 6.58, impressionsEvolution: 0 },
  { weekStart: '2026-06-23', weekEnd: '2026-06-29', totalImpressions: 92_100, totalClicks: 6_180, globalCtr: 6.71, impressionsEvolution: 7.8 },
  { weekStart: '2026-06-30', weekEnd: '2026-07-06', totalImpressions: 105_300, totalClicks: 7_240, globalCtr: 6.87, impressionsEvolution: 14.3 },
  { weekStart: '2026-07-07', weekEnd: '2026-07-11', totalImpressions: 119_100, totalClicks: 7_810, globalCtr: 6.56, impressionsEvolution: 13.1 },
]

export const mockQueryTrends: QueryTrend[] = [
  {
    query: 'recette healthy facile',
    trend: 'rising',
    weeklyGrowth: 32.5,
    dataPoints: [
      { date: '2026-06-16', impressions: 8_200, clicks: 510 },
      { date: '2026-06-23', impressions: 10_400, clicks: 680 },
      { date: '2026-06-30', impressions: 12_800, clicks: 890 },
      { date: '2026-07-07', impressions: 15_200, clicks: 1_050 },
    ],
  },
  {
    query: 'restaurant bio paris',
    trend: 'rising',
    weeklyGrowth: 18.2,
    dataPoints: [
      { date: '2026-06-16', impressions: 9_100, clicks: 780 },
      { date: '2026-06-23', impressions: 10_200, clicks: 890 },
      { date: '2026-06-30', impressions: 11_500, clicks: 980 },
      { date: '2026-07-07', impressions: 12_400, clicks: 1_120 },
    ],
  },
  {
    query: 'brunch vegan paris 11e',
    trend: 'stable',
    weeklyGrowth: 3.1,
    dataPoints: [
      { date: '2026-06-16', impressions: 8_100, clicks: 620 },
      { date: '2026-06-23', impressions: 8_400, clicks: 650 },
      { date: '2026-06-30', impressions: 8_500, clicks: 660 },
      { date: '2026-07-07', impressions: 8_700, clicks: 680 },
    ],
  },
  {
    query: 'visite cuisine restaurant bio',
    trend: 'rising',
    weeklyGrowth: 22.8,
    dataPoints: [
      { date: '2026-06-16', impressions: 4_800, clicks: 320 },
      { date: '2026-06-23', impressions: 5_600, clicks: 390 },
      { date: '2026-06-30', impressions: 6_900, clicks: 510 },
      { date: '2026-07-07', impressions: 7_800, clicks: 580 },
    ],
  },
]
