export interface User {
  id: string; // UUID do Supabase Auth
  name: string;
  email: string;
  role: 'LIDERANCA' | 'MENTORADO' | 'PRESTADOR';
  has_seen_tinder_do_fluxo_tutorial?: boolean;
  created_at: string;
}

export type SafeUser = User;

export interface Audit {
  id: number;
  user_id: number;
  product_price: number;
  product_type: string;
  has_pre_checkout: number;
  filename: string;
  created_at: string;
}

export interface Campaign {
  id: number;
  audit_id: number;
  campaign_name: string;
  spend: number;
  ctr_link: number;
  link_clicks: number;
  lp_views: number;
  lp_rate: number;
  checkouts: number;
  purchases: number;
  cpa: number;
  cpc: number;
  impressions: number;
  reach: number;
  scenario: number;
  hook_rate: number;
  created_at: string;
}

export interface Recommendation {
  id: number;
  campaign_id: number;
  title: string;
  message: string;
  steps_json: string;
  created_at: string;
}

export interface Creative {
  id: number;
  user_id: number;
  audit_id: number;
  campaign_id: number;
  copy_text: string;
  video_link: string;
  analysis_result: string;
  created_at: string;
}

export interface AnalysisResult {
  scenario: number;
  title: string;
  message: string;
  steps: string[];
}

export interface AnalyzedCampaign {
  campaign_name: string;
  spend: number;
  ctr_link: number;
  link_clicks: number;
  lp_views: number;
  lp_rate: number;
  checkouts: number;
  purchases: number;
  cpa: number;
  cpc: number;
  impressions: number;
  reach: number;
  hook_rate: number;
  scenario: number;
  recommendation: AnalysisResult;
}

export interface ParsedCampaign {
  campaign_name: string;
  budget_structure?: 'CBO' | 'ABO';
  spend: number;
  ctr_link: number;
  link_clicks: number;
  lp_views: number;
  lp_rate: number;
  checkouts: number;
  purchases: number;
  cpc: number;
  impressions: number;
  reach: number;
  hook_rate: number;
  cpa?: number;
  _ctr_sum?: number;
  _cpc_sum?: number;
  _lp_rate_sum?: number;
  _hook_sum?: number;
  _count?: number;
}

export interface ParseResult {
  campaigns?: ParsedCampaign[];
  hasPurchases?: boolean;
  error?: string;
}

export interface JwtPayload {
  id: string; // UUID
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: SafeUser;
    }
  }
}
