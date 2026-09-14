export type AdvisoryPillarId = 'social' | 'seo' | 'geo' | 'sea' | 'gea';
export type AdvisoryStatus = 'critical' | 'attention' | 'opportunity' | 'healthy';
export type AdvisoryImpact = 'high' | 'medium' | 'low';
export type AdvisoryEffort = 'low' | 'medium' | 'high';

export interface AdvisoryAction {
  id: string;
  title: string;
  detail: string;
  impact: AdvisoryImpact;
  effort: AdvisoryEffort;
  href?: string;
}

export interface AdvisoryPillar {
  id: AdvisoryPillarId;
  label: string;
  score: number;
  status: AdvisoryStatus;
  summary: string;
  signals: string[];
  actions: AdvisoryAction[];
}

export interface AdvisoryBusinessContext {
  name: string;
  sector: string;
  city: string;
  siret?: string;
  maturity: 'emerging' | 'developing' | 'established';
  profileVerified: boolean;
  verificationSource?: 'pappers' | 'luhn' | 'unknown' | string;
}

export interface AdvisoryReport {
  id?: string;
  generatedAt: string;
  overallScore: number;
  criticalCount: number;
  business: AdvisoryBusinessContext;
  sources: string[];
  pillars: AdvisoryPillar[];
}

export interface AdvisoryMetricSnapshot {
  posts: number;
  impressions: number;
  reach: number;
  clicks: number;
  engagementRate: number;
}

export interface AdvisoryImpact {
  recommendationAt: string;
  before: AdvisoryMetricSnapshot;
  after: AdvisoryMetricSnapshot;
  hasAfterData: boolean;
}
