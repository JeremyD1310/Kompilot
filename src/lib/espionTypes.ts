export type EspionScanStatus = 'queued' | 'running' | 'completed' | 'partial' | 'failed' | 'retryable_failed';
export type EspionAxisKey = 'benefits' | 'proof' | 'problem' | 'usp' | 'pricingOffer' | 'productFunctioning' | 'arguments' | 'brand';
export type CreativeType = 'ugc' | 'motion_design' | 'product_demo' | 'before_after' | 'testimonial' | 'carousel' | 'image' | 'video' | 'unknown';
export type AdActivityStatus = 'active_ads' | 'no_active_ads' | 'scan_inconclusive';
export interface EspionAxisResult { key: EspionAxisKey; label: string; score: number; confidence: number; summary: string; evidence: string[]; recommendations: string[] }
export interface EspionAsset { type: string; url: string; label: string; downloadable?: boolean }
export interface EspionAnalysisPayload {
  axes: EspionAxisResult[]; overallScore: number; creativeType: CreativeType; copyFramework: string;
  hook: string; hookMechanism?: string; offer: string; audience: string; cta: string; description: string; audioType: string;
  evergreen: boolean; maturityScore: number; strengths: string[]; risks: string[]; recommendations: string[];
  iterations: string[]; landingPage?: string; landingPagePromise?: string; checkoutType?: string; upsell?: string; funnelFriction?: string[]; scalingSignal?: string;
  saturationSignal?: string; transcript?: string; threeSecondHook?: string; proofMoments?: string[]; winningFormat?: string; iterationSignals?: string[];
  assets?: EspionAsset[]; adActivityStatus?: AdActivityStatus; sourceConfidence?: number; falsePositiveRisk?: string; falsePositiveReason?: string; generatedAt?: string; provider?: string; usedFallback?: boolean;
}
export interface EspionScan {
  id: string; userId: string; platform: string; targetUrl: string; advertiserName: string; adName: string;
  countryCode: string; locale: string; status: EspionScanStatus; progress: number; attemptCount: number;
  maxAttempts: number; retryable: boolean; errorCode?: string; errorMessage?: string; sourceStatuses?: Record<string, string>;
  createdAt: string; updatedAt: string; completedAt?: string;
}
export interface EspionAnalysis {
  id: string; scanId: string; platform: string; advertiserName: string; adName: string; sourceUrl: string;
  creativeType: string; description: string; overallScore: number; maturityScore: number;
  analysis: EspionAnalysisPayload; createdAt: string;
}
export interface EspionSwipe { id: string; analysisId: string; folderId?: string; title: string; notes: string; tags: string[]; isFavorite: boolean; createdAt: string }
export interface EspionComment { id: string; analysisId: string; userId: string; authorUserId: string; authorEmail: string; body: string; mentions: string[] | string; createdAt: string }
export interface EspionShare { id: string; userId: string; analysisId: string; sharedWithUserId: string; sharedWithEmail: string; permission: string; createdAt: string }
export interface EspionFolder { id: string; name: string; description: string; color: string; createdAt?: string }
export interface EspionBenchmark { currentScore: number; comparisonCount: number; percentile: number | null; peersAverage: number | null; peerSource: string; platform: string }
