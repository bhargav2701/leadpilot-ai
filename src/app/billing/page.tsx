import { AppShell } from "@/components/app-shell";
import { Notification } from "@/components/notification";
import { UsageProgress } from "@/components/usage-progress";
import {
  formatLimit,
  getOrCreateSubscription,
  getSubscriptionUsage,
  plans,
} from "@/lib/billing/subscription";
import { requireUser } from "@/lib/auth/require-user";
import { upgradeSubscription } from "./actions";

type BillingPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const { supabase, user } = await requireUser();
  const params = await searchParams;
  const [subscription, usage] = await Promise.all([
    getOrCreateSubscription(supabase, user.id),
    getSubscriptionUsage(supabase, user.id),
  ]);

  return (
    <AppShell active="billing" userEmail={user.email}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-400">Billing</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            Subscription Billing
          </h1>
          <p className="mt-4 max-w-2xl leading-8 text-zinc-400">
            Manage your LeadPilot AI plan, limits, and usage.
          </p>
        </div>
      </div>

      <Notification error={params.error} success={params.success} />

      <section className="mt-8 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <article className="rounded-xl border border-orange-500/30 bg-zinc-950 p-6 shadow-[0_0_45px_rgba(249,115,22,0.12)]">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-400">
            Current Plan
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-4xl font-black">{subscription.plan_name}</h2>
            <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-sm font-bold text-orange-300">
              {subscription.status}
            </span>
          </div>
          <div className="mt-6 space-y-6">
            <UsageProgress label="Lead Usage" limit={subscription.lead_limit} used={usage.leadCount} />
            <UsageProgress
              label="AI Usage"
              limit={subscription.ai_requests_limit}
              used={usage.aiRequestsUsed}
            />
          </div>
        </article>

        <article className="rounded-xl border border-white/10 bg-zinc-950 p-6">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-zinc-500">
            Plan Status
          </p>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              ["Current Plan", subscription.plan_name],
              ["Plan Status", subscription.status],
              ["Lead Usage", `${usage.leadCount} / ${formatLimit(subscription.lead_limit)}`],
              [
                "AI Usage",
                `${usage.aiRequestsUsed} / ${formatLimit(subscription.ai_requests_limit)}`,
              ],
            ].map(([label, value]) => (
              <div className="rounded-lg border border-white/10 bg-black p-4" key={label}>
                <dt className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
                  {label}
                </dt>
                <dd className="mt-2 text-xl font-black text-white">{value}</dd>
              </div>
            ))}
          </dl>
        </article>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = subscription.plan_name === plan.name;
          const canUpgrade = plan.name !== "Free" && !isCurrent;

          return (
            <article
              className={`relative rounded-xl border p-6 ${
                plan.highlighted
                  ? "border-orange-500 bg-orange-500/10 shadow-[0_0_55px_rgba(249,115,22,0.18)]"
                  : "border-white/10 bg-zinc-950"
              }`}
              key={plan.name}
            >
              {plan.highlighted && (
                <span className="absolute right-5 top-5 rounded-full bg-orange-500 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-black">
                  Best Value
                </span>
              )}
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-400">
                {plan.name}
              </p>
              <div className="mt-4 flex items-end gap-1">
                <p className="text-5xl font-black">{plan.price}</p>
                <p className="pb-2 text-sm font-semibold text-zinc-500">/month</p>
              </div>
              <ul className="mt-6 space-y-3 text-sm font-semibold text-zinc-300">
                {plan.features.map((feature) => (
                  <li className="flex gap-3" key={feature}>
                    <span className="text-orange-400">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              {canUpgrade ? (
                <form action={upgradeSubscription} className="mt-8">
                  <input name="plan_name" type="hidden" value={plan.name} />
                  <button
                    className={`w-full rounded-lg px-5 py-3 text-sm font-black transition ${
                      plan.highlighted
                        ? "bg-orange-500 text-black hover:bg-orange-400"
                        : "border border-orange-500/40 text-orange-300 hover:border-orange-500 hover:bg-orange-500 hover:text-black"
                    }`}
                    type="submit"
                  >
                    {plan.cta}
                  </button>
                </form>
              ) : (
                <div className="mt-8 rounded-lg border border-white/10 px-5 py-3 text-center text-sm font-black text-zinc-500">
                  {isCurrent ? "Current Plan" : plan.cta}
                </div>
              )}
            </article>
          );
        })}
      </section>
    </AppShell>
  );
}
