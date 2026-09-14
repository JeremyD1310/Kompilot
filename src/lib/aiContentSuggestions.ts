import { apiFetch } from '@/hooks/useSocialPublish';

export interface GeneratedContentSuggestion {
  id: string;
  title: string;
  content: string;
  tone: 'professionnel' | 'engageant' | 'promotionnel';
  platform: 'Instagram' | 'Facebook' | 'LinkedIn' | 'Google Business';
  emoji: string;
}

export interface ContentTrendContext {
  title: string;
  summary: string;
  contentAngles?: string[];
  platforms?: string[];
  sourceUrl?: string;
  sourceName?: string;
  observedAt?: string;
  signal?: string;
}

export async function generateContentSuggestions(params: {
  sector?: string;
  city?: string;
  tone: string;
  objective: string;
  language: string;
  trends?: ContentTrendContext[];
  activity?: {
    postCount: number;
    metricCount: number;
    topPlatform?: string;
    averageEngagementRate: number;
    recentThemes?: string[];
  };
}): Promise<GeneratedContentSuggestion[]> {
  const response = await apiFetch<{ ideas?: Array<{ angle: string; caption: string; hashtags?: string[]; visualHint?: string }> }>('/api/content-trends/ideas', {
    method: 'POST',
    body: JSON.stringify({
      sector: params.sector,
      city: params.city,
      tone: params.tone,
      objective: params.objective,
      language: params.language,
      trends: params.trends || [],
      activity: params.activity,
    }),
  });
  const platforms: GeneratedContentSuggestion['platform'][] = ['Instagram', 'Facebook', 'LinkedIn', 'Google Business'];
  return (response.ideas ?? []).map((idea, index) => ({
    id: `trend-idea-${index}`,
    title: idea.angle || `Angle tendance ${index + 1}`,
    content: `${idea.caption || ''}${idea.hashtags?.length ? `\n\n${idea.hashtags.join(' ')}` : ''}`,
    tone: (['professionnel', 'engageant', 'promotionnel'] as const).includes(params.tone as any) ? params.tone as GeneratedContentSuggestion['tone'] : 'professionnel',
    platform: platforms[index % platforms.length],
    emoji: idea.angle?.match(/^\S+/)?.[0] || '💡',
  }));
}
