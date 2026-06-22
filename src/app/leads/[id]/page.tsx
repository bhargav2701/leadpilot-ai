import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { EmailSendModal } from "@/components/email-send-modal";
import { LeadScoreBadge } from "@/components/lead-score-badge";
import { Notification } from "@/components/notification";
import { WhatsAppActions } from "@/components/whatsapp-actions";
import { WhatsAppTemplatesCard } from "@/components/whatsapp-templates-card";
import { buildAILeadSummary } from "@/lib/ai/lead-summary";
import { requireUser } from "@/lib/auth/require-user";
import {
  getOrCreateSubscription,
  getSubscriptionUsage,
  isLimitReached,
} from "@/lib/billing/subscription";
import type { ActivityLog } from "@/types/activity-log";
import type { EmailLog } from "@/types/email-log";
import type { FollowUp } from "@/types/follow-up";
import type { Lead } from "@/types/lead";
import { reminderTypes, type Reminder } from "@/types/reminder";
import { createReminder, completeReminder } from "@/app/reminders/actions";
import { DeleteLeadModal } from "../delete-lead-modal";
import { FollowUpGenerator } from "./follow-up-generator";

type LeadDetailsPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function LeadDetailsPage({ params, searchParams }: LeadDetailsPageProps) {
  const { id } = await params;
  const queryParams = await searchParams;
  const { supabase, user } = await requireUser();
  const [
    leadResult,
    followUpsResult,
    activityLogsResult,
    remindersResult,
    emailLogsResult,
    subscription,
    subscriptionUsage,
  ] = await Promise.all([
    supabase.from("leads").select("*").eq("id", id).eq("user_id", user.id).single(),
    supabase
      .from("follow_ups")
      .select("*")
      .eq("lead_id", id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("activity_logs")
      .select("*")
      .eq("lead_id", id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("reminders")
      .select("*")
      .eq("lead_id", id)
      .eq("user_id", user.id)
      .order("completed", { ascending: true })
      .order("reminder_date", { ascending: true }),
    supabase
      .from("email_logs")
      .select("*")
      .eq("lead_id", id)
      .eq("user_id", user.id)
      .order("sent_at", { ascending: false }),
    getOrCreateSubscription(supabase, user.id),
    getSubscriptionUsage(supabase, user.id),
  ]);

  if (!leadResult.data) {
    notFound();
  }

  const lead = leadResult.data as Lead;
  const followUps = (followUpsResult.data ?? []) as FollowUp[];
  const activityLogs = (activityLogsResult.data ?? []) as ActivityLog[];
  const reminders = (remindersResult.data ?? []) as Reminder[];
  const emailLogs = (emailLogsResult.data ?? []) as EmailLog[];
  const aiLimitReached = isLimitReached(
    subscriptionUsage.aiRequestsUsed,
    subscription.ai_requests_limit,
  );
  const aiSummary = buildAILeadSummary({ activityLogs, followUps, lead, reminders });
  const currentTime = new Date().getTime();
  const details = [
    { label: "Email", value: lead.email || "-" },
    { label: "Phone", value: lead.phone || "-" },
    { label: "Source", value: lead.source || "-" },
    { label: "Status", value: lead.status },
    { label: "AI Score", value: String(lead.lead_score ?? 0) },
    { label: "Temperature", value: lead.lead_temperature ?? "Cold" },
    { label: "Assigned To", value: lead.assigned_to || "Unassigned" },
    { label: "Created", value: new Date(lead.created_at).toLocaleString() },
  ];

  return (
    <AppShell active="leads" userEmail={user.email}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-400">
            Lead Details
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            {lead.full_name}
          </h1>
          <div className="mt-5">
            <LeadScoreBadge score={lead.lead_score} temperature={lead.lead_temperature} />
          </div>
        </div>
        <div className="flex gap-3">
          <EmailSendModal lead={lead} />
          <a
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-black text-black transition hover:bg-orange-400"
            href="#create-reminder"
          >
            Create Reminder
          </a>
          <Link
            className="rounded-lg border border-white/10 px-4 py-2 text-sm font-bold text-zinc-300 transition hover:border-orange-500/50 hover:text-orange-300"
            href={`/leads/${lead.id}/edit`}
          >
            Edit
          </Link>
          <DeleteLeadModal id={lead.id} name={lead.full_name} />
        </div>
      </div>

      <Notification error={queryParams.error} success={queryParams.success} />

      <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-6">
          <h2 className="text-2xl font-black">Notes</h2>
          <p className="mt-5 whitespace-pre-wrap leading-8 text-zinc-300">
            {lead.notes || "No notes added."}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-6">
          <h2 className="text-2xl font-black">Information</h2>
          <div className="mt-5 space-y-4">
            {details.map((detail) => (
              <div className="rounded-lg border border-white/10 bg-black p-4" key={detail.label}>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
                  {detail.label}
                </p>
                <p className="mt-2 font-semibold text-white">{detail.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <div
          className="rounded-xl border border-white/10 bg-zinc-950 p-6"
          id="create-reminder"
        >
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-400">
            Smart Follow-Up
          </p>
          <h2 className="mt-2 text-2xl font-black">Create Reminder</h2>
          <form action={createReminder} className="mt-6 space-y-4">
            <input name="lead_id" type="hidden" value={lead.id} />
            <input name="return_path" type="hidden" value={`/leads/${lead.id}`} />
            <label className="block">
              <span className="text-sm font-semibold text-zinc-300">Title</span>
              <input
                className="mt-2 w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none transition focus:border-orange-500"
                name="title"
                placeholder="Follow up on proposal"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-zinc-300">Type</span>
              <select
                className="mt-2 w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none transition focus:border-orange-500"
                name="reminder_type"
              >
                {reminderTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-zinc-300">Date & Time</span>
              <input
                className="mt-2 w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none transition focus:border-orange-500"
                name="reminder_date"
                required
                type="datetime-local"
              />
            </label>
            <button
              className="w-full rounded-lg bg-orange-500 px-5 py-3 text-sm font-black text-black transition hover:bg-orange-400"
              type="submit"
            >
              Create Reminder
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-white/10 bg-zinc-950 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-400">
                Reminders
              </p>
              <h2 className="mt-2 text-2xl font-black">Lead reminders</h2>
            </div>
            <Link
              className="rounded-lg border border-orange-500/40 px-4 py-2 text-sm font-bold text-orange-300 transition hover:border-orange-500 hover:bg-orange-500 hover:text-black"
              href="/reminders"
            >
              View all
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {reminders.length ? (
              reminders.map((reminder) => {
                const isOverdue =
                  !reminder.completed && new Date(reminder.reminder_date).getTime() < currentTime;

                return (
                  <article
                    className="rounded-lg border border-white/10 bg-black p-4"
                    key={reminder.id}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-black text-white">{reminder.title}</p>
                          <span className="rounded-full bg-orange-500/15 px-3 py-1 text-xs font-bold text-orange-300">
                            {reminder.reminder_type}
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-zinc-500">
                          {new Date(reminder.reminder_date).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            reminder.completed
                              ? "bg-emerald-500/15 text-emerald-300"
                              : isOverdue
                                ? "bg-red-500/15 text-red-300"
                                : "bg-zinc-800 text-zinc-300"
                          }`}
                        >
                          {reminder.completed ? "Completed" : isOverdue ? "Overdue" : "Open"}
                        </span>
                        {!reminder.completed && (
                          <form action={completeReminder}>
                            <input name="id" type="hidden" value={reminder.id} />
                            <input name="return_path" type="hidden" value={`/leads/${lead.id}`} />
                            <button
                              className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-zinc-300 transition hover:border-orange-500/50 hover:text-orange-300"
                              type="submit"
                            >
                              Mark Complete
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-lg border border-dashed border-white/10 bg-black p-5 text-sm font-semibold text-zinc-500">
                No reminders created for this lead.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-6">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-400">
            AI Lead Summary
          </p>
          <h2 className="mt-2 text-2xl font-black">Business summary</h2>
          <p className="mt-5 leading-8 text-zinc-300">{aiSummary.summary}</p>
        </div>
        <div className="grid gap-5">
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/10 p-6">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-orange-300">
              Recommended Next Action
            </p>
            <p className="mt-3 text-2xl font-black text-white">
              {aiSummary.recommendedAction}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-zinc-950 p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-zinc-500">
                  Opportunity Score
                </p>
                <p className="mt-2 text-4xl font-black text-orange-500">
                  {aiSummary.opportunityScore}
                </p>
              </div>
              <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-sm font-bold text-orange-300">
                {aiSummary.health}
              </span>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-black">
              <div
                className="h-full rounded-full bg-orange-500"
                style={{ width: `${aiSummary.opportunityScore}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <WhatsAppActions lead={lead} />
      <WhatsAppTemplatesCard lead={lead} />

      <section className="mt-5 rounded-xl border border-white/10 bg-zinc-950 p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-400">
              Email History
            </p>
            <h2 className="mt-2 text-2xl font-black">Sent emails</h2>
          </div>
          <EmailSendModal lead={lead} />
        </div>

        <div className="mt-5 space-y-3">
          {emailLogs.length ? (
            emailLogs.map((email) => (
              <article className="rounded-lg border border-white/10 bg-black p-4" key={email.id}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-black text-white">{email.subject}</p>
                    <p className="mt-1 text-sm font-semibold text-zinc-500">
                      {new Date(email.sent_at).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${
                      email.status === "Sent"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-red-500/15 text-red-300"
                    }`}
                  >
                    {email.status}
                  </span>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-white/10 bg-black p-8 text-center">
              <p className="font-bold">No emails sent yet</p>
              <p className="mt-2 text-sm text-zinc-500">
                Send an email to create the first history entry.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="mt-5 rounded-xl border border-white/10 bg-zinc-950 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-400">
              Activity Timeline
            </p>
            <h2 className="mt-2 text-2xl font-black">Recent activity</h2>
          </div>
          <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-sm font-bold text-orange-300">
            {activityLogs.length}
          </div>
        </div>

        <div className="mt-6">
          {activityLogs.length ? (
            <ol className="space-y-4">
              {activityLogs.map((activity) => (
                <li className="relative pl-7" key={activity.id}>
                  <span className="absolute left-0 top-2 h-3 w-3 rounded-full bg-orange-500 shadow-[0_0_18px_rgba(249,115,22,0.65)]" />
                  <div className="rounded-lg border border-white/10 bg-black p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-black text-white">{activity.activity_type}</p>
                        <p className="mt-2 text-sm leading-6 text-zinc-300">
                          {activity.description}
                        </p>
                      </div>
                      <time
                        className="shrink-0 text-sm font-semibold text-zinc-500"
                        dateTime={activity.created_at}
                      >
                        {new Date(activity.created_at).toLocaleString()}
                      </time>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="rounded-lg border border-dashed border-white/10 bg-black p-5 text-sm font-semibold text-zinc-500">
              No activity recorded yet.
            </div>
          )}
        </div>
      </section>

      <FollowUpGenerator
        aiLimit={subscription.ai_requests_limit}
        aiRequestsUsed={subscriptionUsage.aiRequestsUsed}
        followUps={followUps}
        lead={lead}
        limitReached={aiLimitReached}
      />
    </AppShell>
  );
}
