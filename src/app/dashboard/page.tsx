import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { LeadScoreBadge } from "@/components/lead-score-badge";
import { buildAILeadSummary } from "@/lib/ai/lead-summary";
import { requireUser } from "@/lib/auth/require-user";
import type { ActivityLog } from "@/types/activity-log";
import type { FollowUp } from "@/types/follow-up";
import type { Lead } from "@/types/lead";
import type { Reminder } from "@/types/reminder";

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

async function getTemperatureCount(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
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
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  userId: string,
) {
  const { count } = await supabase
    .from("follow_ups")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  return count ?? 0;
}

async function getReminderCount(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
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
  const { supabase, user } = await requireUser();

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
    aiLeadsResult,
    aiActivityLogsResult,
    aiFollowUpsResult,
    aiRemindersResult,
  ] =
    await Promise.all([
      getLeadCount(supabase, user.id),
      getLeadCount(supabase, user.id, "New"),
      getLeadCount(supabase, user.id, "Qualified"),
      getLeadCount(supabase, user.id, "Won"),
      getTemperatureCount(supabase, user.id, "Hot"),
      getTemperatureCount(supabase, user.id, "Warm"),
      getTemperatureCount(supabase, user.id, "Cold"),
      getFollowUpCount(supabase, user.id),
      getReminderCount(supabase, user.id, "overdue"),
      getReminderCount(supabase, user.id, "today"),
      getReminderCount(supabase, user.id, "upcoming"),
      supabase
        .from("leads")
        .select("*")
        .eq("user_id", user.id)
        .order("lead_score", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("follow_ups")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase.from("leads").select("*").eq("user_id", user.id),
      supabase
        .from("activity_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.from("follow_ups").select("*").eq("user_id", user.id),
      supabase.from("reminders").select("*").eq("user_id", user.id),
    ]);

  const recentLeads = (recentResult.data ?? []) as Lead[];
  const recentFollowUps = (recentFollowUpsResult.data ?? []) as FollowUp[];
  const aiLeads = (aiLeadsResult.data ?? []) as Lead[];
  const aiActivityLogs = (aiActivityLogsResult.data ?? []) as ActivityLog[];
  const aiFollowUps = (aiFollowUpsResult.data ?? []) as FollowUp[];
  const aiReminders = (aiRemindersResult.data ?? []) as Reminder[];
  const aiLeadSummaries = aiLeads.map((lead) => {
    const leadActivity = aiActivityLogs.filter((activity) => activity.lead_id === lead.id);
    const summary = buildAILeadSummary({
      activityLogs: leadActivity,
      followUps: aiFollowUps.filter((followUp) => followUp.lead_id === lead.id),
      lead,
      reminders: aiReminders.filter((reminder) => reminder.lead_id === lead.id),
    });

    return {
      activityCount: leadActivity.length,
      lead,
      summary,
    };
  });
  const topOpportunity = [...aiLeadSummaries].sort(
    (a, b) => b.summary.opportunityScore - a.summary.opportunityScore,
  )[0];
  const mostActiveLead = [...aiLeadSummaries].sort(
    (a, b) => b.activityCount - a.activityCount,
  )[0];
  const attentionLead = [...aiLeadSummaries].sort((a, b) => {
    const aRisk = a.summary.health === "At Risk" ? 1 : 0;
    const bRisk = b.summary.health === "At Risk" ? 1 : 0;
    return bRisk - aRisk || a.summary.opportunityScore - b.summary.opportunityScore;
  })[0];
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

      <section className="mt-5 rounded-xl border border-white/10 bg-zinc-950 p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-orange-400">
              AI Lead Insights
            </p>
            <h2 className="mt-2 text-2xl font-black">Summary signals</h2>
          </div>
          <Link className="text-sm font-bold text-orange-400 hover:text-orange-300" href="/ai-insights">
            View AI insights
          </Link>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {[
            {
              detail: topOpportunity
                ? `${topOpportunity.summary.opportunityScore} opportunity score`
                : "No lead data yet",
              label: "Top Opportunity Lead",
              lead: topOpportunity?.lead,
            },
            {
              detail: mostActiveLead
                ? `${mostActiveLead.activityCount} activity item${mostActiveLead.activityCount === 1 ? "" : "s"}`
                : "No activity yet",
              label: "Most Active Lead",
              lead: mostActiveLead?.lead,
            },
            {
              detail: attentionLead
                ? `${attentionLead.summary.health} health`
                : "No attention signal yet",
              label: "Lead Requiring Attention",
              lead: attentionLead?.lead,
            },
          ].map((item) => (
            <Link
              className={`rounded-lg border border-white/10 bg-black p-5 transition ${
                item.lead ? "hover:border-orange-500/50" : "pointer-events-none opacity-60"
              }`}
              href={item.lead ? `/leads/${item.lead.id}` : "/dashboard"}
              key={item.label}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">
                {item.label}
              </p>
              <p className="mt-3 truncate text-xl font-black text-white">
                {item.lead?.full_name ?? "No leads yet"}
              </p>
              <p className="mt-2 text-sm font-semibold text-orange-300">{item.detail}</p>
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
