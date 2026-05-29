import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth/require-user";
import type { Lead, LeadStatus } from "@/types/lead";
import { leadStatuses } from "@/types/lead";
import { AnalyticsCharts } from "./analytics-charts";

function formatDay(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
    new Date(value),
  );
}

function buildTrendData(leads: Lead[]) {
  const days = new Map<string, number>();
  const now = new Date();

  for (let index = 13; index >= 0; index -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - index);
    const key = date.toISOString().slice(0, 10);
    days.set(key, 0);
  }

  leads.forEach((lead) => {
    const key = new Date(lead.created_at).toISOString().slice(0, 10);
    if (days.has(key)) {
      days.set(key, (days.get(key) ?? 0) + 1);
    }
  });

  return Array.from(days.entries()).map(([date, count]) => ({
    date: formatDay(date),
    leads: count,
  }));
}

function getSourceName(source: string | null) {
  return source?.trim() || "Unknown";
}

export default async function AnalyticsPage() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const leads = (data ?? []) as Lead[];
  const totalLeads = leads.length;
  const statusCounts = leadStatuses.reduce<Record<LeadStatus, number>>(
    (accumulator, status) => {
      accumulator[status] = leads.filter((lead) => lead.status === status).length;
      return accumulator;
    },
    { New: 0, Qualified: 0, Converted: 0, Lost: 0 },
  );
  const conversionRate = totalLeads
    ? Math.round((statusCounts.Converted / totalLeads) * 1000) / 10
    : 0;

  const sourceCounts = leads.reduce<Record<string, { converted: number; leads: number }>>(
    (accumulator, lead) => {
      const source = getSourceName(lead.source);
      accumulator[source] = accumulator[source] ?? { converted: 0, leads: 0 };
      accumulator[source].leads += 1;
      if (lead.status === "Converted") {
        accumulator[source].converted += 1;
      }
      return accumulator;
    },
    {},
  );

  const sourceData = Object.entries(sourceCounts)
    .map(([source, values]) => ({ source, leads: values.leads }))
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 8);

  const sortedSources = Object.entries(sourceCounts).sort((a, b) => b[1].converted - a[1].converted);
  const bestSource = sortedSources[0]?.[0] ?? "No source yet";
  const worstSource =
    Object.entries(sourceCounts)
      .filter(([, values]) => values.leads > 0)
      .sort((a, b) => a[1].converted / a[1].leads - b[1].converted / b[1].leads)[0]?.[0] ??
    "No source yet";

  const kpis = [
    { label: "Total Leads", value: totalLeads },
    { label: "New Leads", value: statusCounts.New },
    { label: "Qualified Leads", value: statusCounts.Qualified },
    { label: "Converted Leads", value: statusCounts.Converted },
    { label: "Conversion Rate", value: `${conversionRate}%` },
  ];

  const statusData = leadStatuses.map((status) => ({
    name: status,
    value: statusCounts[status],
  }));
  const trendData = buildTrendData(leads);
  const recentCreated = leads.slice(0, 5);
  const recentUpdated = leads
    .filter((lead) => lead.status === "Qualified" || lead.status === "Converted")
    .slice(0, 5);

  return (
    <AppShell active="analytics" userEmail={user.email}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-400">
            Analytics
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            Revenue intelligence
          </h1>
          <p className="mt-4 max-w-2xl leading-8 text-zinc-400">
            Analyze lead flow, source performance, and conversion momentum from Supabase data.
          </p>
        </div>
        <Link
          className="rounded-lg bg-orange-500 px-5 py-3 text-center text-sm font-black text-black transition hover:bg-orange-400"
          href="/leads/new"
        >
          Add Lead
        </Link>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
          Unable to load analytics: {error.message}
        </div>
      )}

      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map((kpi) => (
          <article className="rounded-xl border border-white/10 bg-zinc-950 p-6" key={kpi.label}>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">
              {kpi.label}
            </p>
            <p className="mt-4 text-4xl font-black text-orange-500">{kpi.value}</p>
          </article>
        ))}
      </div>

      {totalLeads === 0 ? (
        <section className="mt-8 rounded-xl border border-dashed border-white/10 bg-zinc-950 p-10 text-center">
          <h2 className="text-2xl font-black">No analytics yet</h2>
          <p className="mt-3 text-zinc-500">Create leads to unlock charts, trends, and insights.</p>
          <Link
            className="mt-6 inline-flex rounded-lg bg-orange-500 px-5 py-3 text-sm font-black text-black transition hover:bg-orange-400"
            href="/leads/new"
          >
            Add Lead
          </Link>
        </section>
      ) : (
        <>
          <AnalyticsCharts sourceData={sourceData} statusData={statusData} trendData={trendData} />

          <div className="mt-8 grid gap-5 xl:grid-cols-[1fr_0.9fr]">
            <section className="rounded-xl border border-white/10 bg-zinc-950 p-6">
              <h2 className="text-2xl font-black">Recent Activity</h2>
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-zinc-500">
                    Latest leads created
                  </p>
                  <div className="mt-4 space-y-3">
                    {recentCreated.map((lead) => (
                      <Link
                        className="block rounded-lg border border-white/10 bg-black p-4 transition hover:border-orange-500/50"
                        href={`/leads/${lead.id}`}
                        key={lead.id}
                      >
                        <p className="font-bold text-white">{lead.full_name}</p>
                        <p className="mt-1 text-sm text-zinc-500">
                          {new Date(lead.created_at).toLocaleString()}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-zinc-500">
                    Latest lead updates
                  </p>
                  <div className="mt-4 space-y-3">
                    {recentUpdated.length ? (
                      recentUpdated.map((lead) => (
                        <Link
                          className="block rounded-lg border border-white/10 bg-black p-4 transition hover:border-orange-500/50"
                          href={`/leads/${lead.id}`}
                          key={lead.id}
                        >
                          <p className="font-bold text-white">{lead.full_name}</p>
                          <p className="mt-1 text-sm text-orange-300">{lead.status}</p>
                        </Link>
                      ))
                    ) : (
                      <div className="rounded-lg border border-dashed border-white/10 bg-black p-4 text-sm font-semibold text-zinc-500">
                        No qualified or converted lead activity yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-white/10 bg-zinc-950 p-6">
              <h2 className="text-2xl font-black">Performance Insights</h2>
              <div className="mt-6 space-y-4">
                <div className="rounded-lg border border-white/10 bg-black p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
                    Best performing source
                  </p>
                  <p className="mt-2 text-xl font-black text-orange-400">{bestSource}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-black p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
                    Worst performing source
                  </p>
                  <p className="mt-2 text-xl font-black text-white">{worstSource}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-black p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
                    Conversion summary
                  </p>
                  <p className="mt-2 leading-7 text-zinc-300">
                    {statusCounts.Converted} of {totalLeads} leads converted, producing a{" "}
                    <span className="font-bold text-orange-300">{conversionRate}%</span>{" "}
                    conversion rate.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </>
      )}
    </AppShell>
  );
}
