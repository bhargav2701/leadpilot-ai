import { AppShell } from "@/components/app-shell";
import { formatLimit, getOrCreateSubscription } from "@/lib/billing/subscription";
import { requireUser } from "@/lib/auth/require-user";

export default async function SettingsPage() {
  const { supabase, user } = await requireUser();
  const subscription = await getOrCreateSubscription(supabase, user.id);

  return (
    <AppShell active="settings" userEmail={user.email}>
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-400">Settings</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Workspace settings</h1>
      <section className="mt-8 rounded-xl border border-white/10 bg-zinc-950 p-6">
        <h2 className="text-2xl font-black">Account</h2>
        <div className="mt-5 rounded-lg border border-white/10 bg-black p-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Email</p>
          <p className="mt-2 font-semibold text-white">{user.email}</p>
        </div>
      </section>
      <section className="mt-8 rounded-xl border border-white/10 bg-zinc-950 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-400">
              Subscription Settings
            </p>
            <h2 className="mt-2 text-2xl font-black">Billing plan</h2>
          </div>
          <a
            className="rounded-lg border border-orange-500/40 px-4 py-2 text-sm font-bold text-orange-300 transition hover:border-orange-500 hover:bg-orange-500 hover:text-black"
            href="/billing"
          >
            Manage Billing
          </a>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-black p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Plan</p>
            <p className="mt-2 font-semibold text-white">{subscription.plan_name}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Status</p>
            <p className="mt-2 font-semibold text-white">{subscription.status}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
              Renewal Information
            </p>
            <p className="mt-2 font-semibold text-white">
              Local plan. No payment renewal configured.
            </p>
          </div>
        </div>
        <div className="mt-4 rounded-lg border border-orange-500/20 bg-orange-500/10 p-4 text-sm font-semibold text-orange-200">
          Limits: {formatLimit(subscription.lead_limit)} leads and{" "}
          {formatLimit(subscription.ai_requests_limit)} AI requests.
        </div>
      </section>
    </AppShell>
  );
}
