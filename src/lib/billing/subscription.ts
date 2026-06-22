import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlanDefinition, PlanName, Subscription, SubscriptionUsage } from "@/types/subscription";

export const plans: PlanDefinition[] = [
  {
    ai_requests_limit: 50,
    aiRequestsLabel: "50 AI Requests",
    cta: "Current Free Plan",
    features: ["100 Leads", "50 AI Requests", "Single User"],
    lead_limit: 100,
    leadLimitLabel: "100 Leads",
    name: "Free",
    price: "$0",
  },
  {
    ai_requests_limit: 500,
    aiRequestsLabel: "500 AI Requests",
    cta: "Upgrade to Starter",
    features: ["1000 Leads", "500 AI Requests", "Priority Support"],
    lead_limit: 1000,
    leadLimitLabel: "1000 Leads",
    name: "Starter",
    price: "$19",
  },
  {
    ai_requests_limit: -1,
    aiRequestsLabel: "Unlimited AI Requests",
    cta: "Upgrade to Pro",
    features: ["Unlimited Leads", "Unlimited AI Requests", "Advanced Analytics", "Team Features"],
    highlighted: true,
    lead_limit: -1,
    leadLimitLabel: "Unlimited Leads",
    name: "Pro",
    price: "$49",
  },
];

export const freePlan = plans[0];

export function getPlan(name: string | null | undefined) {
  return plans.find((plan) => plan.name === name) ?? freePlan;
}

export function formatLimit(limit: number) {
  return limit < 0 ? "Unlimited" : String(limit);
}

export function usagePercent(used: number, limit: number) {
  if (limit < 0) return 0;
  return Math.min(Math.round((used / limit) * 100), 100);
}

export function isLimitReached(used: number, limit: number) {
  return limit >= 0 && used >= limit;
}

export async function getOrCreateSubscription(
  supabase: SupabaseClient,
  userId: string,
): Promise<Subscription> {
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (data) {
    return data as Subscription;
  }

  const { data: created, error } = await supabase
    .from("subscriptions")
    .insert({
      ai_requests_limit: freePlan.ai_requests_limit,
      lead_limit: freePlan.lead_limit,
      plan_name: freePlan.name,
      status: "Active",
      user_id: userId,
    })
    .select("*")
    .single();

  if (error || !created) {
    return {
      ai_requests_limit: freePlan.ai_requests_limit,
      created_at: new Date().toISOString(),
      id: "",
      lead_limit: freePlan.lead_limit,
      plan_name: freePlan.name,
      status: "Active",
      updated_at: new Date().toISOString(),
      user_id: userId,
    };
  }

  return created as Subscription;
}

export async function getSubscriptionUsage(
  supabase: SupabaseClient,
  userId: string,
): Promise<SubscriptionUsage> {
  const [leadsResult, followUpsResult] = await Promise.all([
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("follow_ups").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ]);

  return {
    aiRequestsUsed: followUpsResult.count ?? 0,
    leadCount: leadsResult.count ?? 0,
  };
}

export async function updateSubscriptionPlan(
  supabase: SupabaseClient,
  userId: string,
  planName: PlanName,
) {
  const plan = getPlan(planName);

  return supabase.from("subscriptions").upsert(
    {
      ai_requests_limit: plan.ai_requests_limit,
      lead_limit: plan.lead_limit,
      plan_name: plan.name,
      status: "Active",
      updated_at: new Date().toISOString(),
      user_id: userId,
    },
    { onConflict: "user_id" },
  );
}
