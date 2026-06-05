import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { LeadScoreBadge } from "@/components/lead-score-badge";
import { Notification } from "@/components/notification";
import { requireWorkspace } from "@/lib/auth/workspace";
import type { ActivityLog } from "@/types/activity-log";
import type { FollowUp } from "@/types/follow-up";
import type { Lead } from "@/types/lead";
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
  const { supabase, user, workspaceId } = await requireWorkspace();
  const [leadResult, followUpsResult, activityLogsResult] = await Promise.all([
    supabase.from("leads").select("*").eq("id", id).eq("user_id", workspaceId).single(),
    supabase
      .from("follow_ups")
      .select("*")
      .eq("lead_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("activity_logs")
      .select("*")
      .eq("lead_id", id)
      .eq("user_id", workspaceId)
      .order("created_at", { ascending: false }),
  ]);

  if (!leadResult.data) {
    notFound();
  }

  const lead = leadResult.data as Lead;
  const followUps = (followUpsResult.data ?? []) as FollowUp[];
  const activityLogs = (activityLogsResult.data ?? []) as ActivityLog[];
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

      <FollowUpGenerator followUps={followUps} lead={lead} />
    </AppShell>
  );
}
