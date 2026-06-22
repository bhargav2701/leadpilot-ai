export type PlanName = "Free" | "Starter" | "Pro";

export type Subscription = {
  ai_requests_limit: number;
  created_at: string;
  id: string;
  lead_limit: number;
  plan_name: PlanName;
  status: string;
  updated_at: string;
  user_id: string;
};

export type SubscriptionUsage = {
  aiRequestsUsed: number;
  leadCount: number;
};

export type PlanDefinition = {
  aiRequestsLabel: string;
  ai_requests_limit: number;
  cta: string;
  features: string[];
  highlighted?: boolean;
  leadLimitLabel: string;
  lead_limit: number;
  name: PlanName;
  price: string;
};
