import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth/require-user";
import type { Lead } from "@/types/lead";

async function getLeadCount(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  userId: string,
  status?: string,
) {
  let query = supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (status) {
    query = query.eq("status", status);
  }

  const { count } = await query;
  return count ?? 0;
}

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();

  const [totalLeads, newLeads, qualifiedLeads, convertedLeads, recentResult] =
    await Promise.all([
      getLeadCount(supabase, user.id),
      getLeadCount(supabase, user.id, "New"),
      getLeadCount(supabase, user.id, "Qualified"),
      getLeadCount(supabase, user.id, "Converted"),
      supabase
        .from("leads")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const recentLeads = (recentResult.data ?? []) as Lead[];
  const stats = [
    { label: "Total Leads", value: totalLeads },
    { label: "New Leads", value: newLeads },
    { label: "Qualified Leads", value: qualifiedLeads },
    { label: "Converted Leads", value: convertedLeads },
  ];

  return (
    <AppShell active="dashboard" userEmail={user.email}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-400">
            Dashboard
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            Lead command center
          </h1>
          <p className="mt-4 max-w-2xl leading-8 text-zinc-400">
            Track your pipeline health with live Supabase lead data.
          </p>
        </div>
        <Link
          className="rounded-lg bg-orange-500 px-5 py-3 text-center text-sm font-black text-black transition hover:bg-orange-400"
          href="/leads/new"
        >
          Add Lead
        </Link>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article className="rounded-xl border border-white/10 bg-zinc-950 p-6" key={stat.label}>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">
              {stat.label}
            </p>
            <p className="mt-4 text-4xl font-black text-orange-500">{stat.value}</p>
          </article>
        ))}
      </div>

      <section className="mt-8 rounded-xl border border-white/10 bg-zinc-950 p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-black">Recent Leads</h2>
          <Link className="text-sm font-bold text-orange-400 hover:text-orange-300" href="/leads">
            View all
          </Link>
        </div>

        <div className="mt-6 space-y-3">
          {recentLeads.length ? (
            recentLeads.map((lead) => (
              <Link
                className="flex flex-col gap-3 rounded-lg border border-white/10 bg-black p-4 transition hover:border-orange-500/50 sm:flex-row sm:items-center sm:justify-between"
                href={`/leads/${lead.id}`}
                key={lead.id}
              >
                <div>
                  <p className="font-bold">{lead.full_name}</p>
                  <p className="text-sm text-zinc-500">{lead.email || lead.phone || "No contact"}</p>
                </div>
                <span className="w-fit rounded-full bg-orange-500/15 px-3 py-1 text-sm font-bold text-orange-300">
                  {lead.status}
                </span>
              </Link>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-white/10 bg-black p-8 text-center">
              <p className="font-bold">No leads yet</p>
              <p className="mt-2 text-sm text-zinc-500">Create your first lead to populate the dashboard.</p>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
