import { AppShell } from "@/components/app-shell";
import { Notification } from "@/components/notification";
import { getWorkspaceMembers, requireWorkspace } from "@/lib/auth/workspace";
import {
  getOrCreateSubscription,
  getSubscriptionUsage,
  isLimitReached,
} from "@/lib/billing/subscription";
import { createLead } from "../actions";
import { LeadForm } from "../lead-form";

type NewLeadPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function NewLeadPage({ searchParams }: NewLeadPageProps) {
  const { supabase, user, workspaceId } = await requireWorkspace();
  const params = await searchParams;
  const [members, subscription, usage] = await Promise.all([
    getWorkspaceMembers(workspaceId),
    getOrCreateSubscription(supabase, user.id),
    getSubscriptionUsage(supabase, user.id),
  ]);
  const leadLimitReached = isLimitReached(usage.leadCount, subscription.lead_limit);

  return (
    <AppShell active="leads" userEmail={user.email}>
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-400">New Lead</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Add lead</h1>
      <Notification error={params.error} success={params.success} />
      <div className="mt-8">
        {leadLimitReached ? (
          <section className="rounded-xl border border-orange-500/40 bg-orange-500/10 p-6">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-300">
              Upgrade Required
            </p>
            <h2 className="mt-2 text-2xl font-black">Lead limit reached</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-300">
              Upgrade your plan to create more leads.
            </p>
          </section>
        ) : (
          <LeadForm
            action={createLead}
            buttonLabel="Save Lead"
            members={members}
            ownerId={workspaceId}
          />
        )}
      </div>
    </AppShell>
  );
}
