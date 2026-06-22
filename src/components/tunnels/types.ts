import type { FunnelNodeData } from './FunnelNode';

export interface TechStackTool {
  name: string;
  category: 'payment' | 'crm' | 'email' | 'analytics' | 'builder' | 'ads' | 'support' | 'other';
  confidence: number; // 0–100
}

export interface WatchAlert {
  type: 'price_change' | 'url_change' | 'new_ad' | 'ad_removed';
  message: string;
  detected_at: string;
  old_value?: string;
  new_value?: string;
}

export interface FunnelData {
  id: string;
  user_id?: string;
  creator_name: string;
  domain_url: string;
  estimated_spend: number;
  performance_score: number;
  platform: 'meta' | 'google' | 'linkedin';
  is_sample?: boolean;
  is_watched?: boolean;
  created_at?: string;
  nodes: FunnelNodeData[];
  tech_stack?: TechStackTool[];
  watch_alerts?: WatchAlert[];
}
