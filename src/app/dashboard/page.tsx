import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { LeadScoreBadge } from "@/components/lead-score-badge";
import { requireWorkspace } from "@/lib/auth/workspace";
import type { FollowUp } from "@/types/follow-up";
import type { Lead } from "@/types/lead";

async function getLeadCount(
  supabase: Awaited<ReturnType<typeof requireWorkspace>>["supabase"],
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

async function getTemperatureCount(
  supabase: Awaited<ReturnType<typeof requireWorkspace>>["supabase"],
  userId: string,
  temperature: string,
) {
  const { count } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("lead_temperature", temperature);

  return count ?? 0;
}

async function getFollowUpCount(
  supabase: Awaited<ReturnType<typeof requireWorkspace>>["supabase"],
  userId: string,
) {
  const { count } = await supabase
    .from("follow_ups")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  return count ?? 0;
}

async function getReminderCount(
  supabase: Awaited<ReturnType<typeof requireWorkspace>>["supabase"],
  userId: string,
  filter: "overdue" | "today" | "upcoming",
) {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  let query = supabase
    .from("reminders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("completed", false);

  if (filter === "overdue") {
    query = query.lt("reminder_date", now.toISOString());
  }

  if (filter === "today") {
    query = query
      .gte("reminder_date", startOfToday.toISOString())
      .lt("reminder_date", startOfTomorrow.toISOString());
  }

  if (filter === "upcoming") {
    query = query.gte("reminder_date", startOfTomorrow.toISOString());
  }

  const { count } = await query;
  return count ?? 0;
}

export default async function DashboardPage() {
  const { supabase, user, workspaceId } = await requireWorkspace();

  const [
    totalLeads,
    newLeads,
    qualifiedLeads,
    wonLeads,
    hotLeads,
    warmLeads,
    coldLeads,
    totalFollowUps,
    overdueReminders,
    dueTodayReminders,
    upcomingReminders,
    recentResult,
    recentFollowUpsResult,
  ] =
    await Promise.all([
      getLeadCount(supabase, workspaceId),
      getLeadCount(supabase, workspaceId, "New"),
      getLeadCount(supabase, workspaceId, "Qualified"),
      getLeadCount(supabase, workspaceId, "Won"),
      getTemperatureCount(supabase, workspaceId, "Hot"),
      getTemperatureCount(supabase, workspaceId, "Warm"),
      getTemperatureCount(supabase, workspaceId, "Cold"),
      getFollowUpCount(supabase, user.id),
      getReminderCount(supabase, workspaceId, "overdue"),
      getReminderCount(supabase, workspaceId, "today"),
      getReminderCount(supabase, workspaceId, "upcoming"),
      supabase
        .from("leads")
        .select("*")
        .eq("user_id", workspaceId)
        .order("lead_score", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("follow_ups")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const recentLeads = (recentResult.data ?? []) as Lead[];
  const recentFollowUps = (recentFollowUpsResult.data ?? []) as FollowUp[];
  const stats = [
    { label: "Total Leads", value: totalLeads },
    { label: "New Leads", value: newLeads },
    { label: "Qualified Leads", value: qualifiedLeads },
    { label: "Won Leads", value: wonLeads },
  ];
  const temperatureStats = [
    { href: "/leads?temperature=Hot&sort=highest-score", label: "Hot Leads", value: hotLeads },
    { href: "/leads?temperature=Warm&sort=highest-score", label: "Warm Leads", value: warmLeads },
    { href: "/leads?temperature=Cold&sort=highest-score", label: "Cold Leads", value: coldLeads },
  ];
  const reminderStats = [
    { href: "/reminders?filter=overdue", label: "Overdue", value: overdueReminders },
    { href: "/reminders?filter=today", label: "Due Today", value: dueTodayReminders },
    { href: "/reminders?filter=upcoming", label: "Upcoming", value: upcomingReminders },
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

      {overdueReminders > 0 && (
        <Link
          className="mt-8 block rounded-xl border border-red-500/30 bg-red-500/10 p-5 transition hover:border-red-400/60 hover:bg-red-500/15"
          href="/reminders?filter=overdue"
        >
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-red-300">
            Reminder Alert
          </p>
          <p className="mt-2 text-2xl font-black text-white">
            {overdueReminders} overdue reminder{overdueReminders === 1 ? "" : "s"} need attention
          </p>
        </Link>
      )}

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

      <section className="mt-5 rounded-xl border border-white/10 bg-zinc-950 p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-orange-400">
              Reminder Summary
            </p>
            <h2 className="mt-2 text-2xl font-black">Smart follow-up reminders</h2>
          </div>
          <Link className="text-sm font-bold text-orange-400 hover:text-orange-300" href="/reminders">
            View reminders
          </Link>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {reminderStats.map((stat) => (
            <Link
              className="rounded-lg border border-white/10 bg-black p-5 transition hover:border-orange-500/50"
              href={stat.href}
              key={stat.label}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">
                {stat.label}
              </p>
              <p className="mt-3 text-4xl font-black text-orange-500">{stat.value}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-5 grid gap-5 md:grid-cols-3">
        {temperatureStats.map((stat) => (
          <Link
            className="rounded-xl border border-white/10 bg-zinc-950 p-6 transition hover:border-orange-500/50 hover:bg-zinc-900"
            href={stat.href}
            key={stat.label}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">
              {stat.label}
            </p>
            <p className="mt-4 text-4xl font-black text-orange-500">{stat.value}</p>
          </Link>
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
                <LeadScoreBadge score={lead.lead_score} temperature={lead.lead_temperature} />
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

      <section className="mt-8 rounded-xl border border-white/10 bg-zinc-950 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black">AI Follow-Ups</h2>
            <p className="mt-2 text-sm text-zinc-500">Generated email and WhatsApp follow-ups.</p>
          </div>
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/10 px-5 py-4 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-orange-300">
              Total Generated
            </p>
            <p className="mt-2 text-4xl font-black text-orange-500">{totalFollowUps}</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {recentFollowUps.length ? (
            recentFollowUps.map((followUp) => (
              <article className="rounded-lg border border-white/10 bg-black p-4" key={followUp.id}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-bold text-orange-300">{followUp.tone}</p>
                  <p className="text-sm text-zinc-500">
                    {new Date(followUp.created_at).toLocaleString()}
                  </p>
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-400">
                  {followUp.generated_message}
                </p>
              </article>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-white/10 bg-black p-8 text-center">
              <p className="font-bold">No follow-ups generated yet</p>
              <p className="mt-2 text-sm text-zinc-500">
                Open a lead details page to generate an AI follow-up.
              </p>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
