import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth/require-user";
import type { ActivityLog } from "@/types/activity-log";
import type { Lead } from "@/types/lead";
import type { Reminder } from "@/types/reminder";
import { PipelineBoard } from "./pipeline-board";

export default async function PipelinePage() {
  const { supabase, user } = await requireUser();
  const { data: leadsData, error: leadsError } = await supabase
    .from("leads")
    .select("*")
    .eq("user_id", user.id)
    .order("lead_score", { ascending: false })
    .order("created_at", { ascending: false });
  const leads = (leadsData ?? []) as Lead[];
  const leadIds = leads.map((lead) => lead.id);
  const [activityLogsResult, remindersResult] = leadIds.length
    ? await Promise.all([
        supabase
          .from("activity_logs")
          .select("*")
          .eq("user_id", user.id)
          .in("lead_id", leadIds)
          .order("created_at", { ascending: false }),
        supabase.from("reminders").select("*").eq("user_id", user.id).in("lead_id", leadIds),
      ])
    : [
        { data: [] as ActivityLog[], error: null },
        { data: [] as Reminder[], error: null },
      ];
  const activityLogs = (activityLogsResult.data ?? []) as ActivityLog[];
  const reminders = (remindersResult.data ?? []) as Reminder[];
  const reminderCounts = reminders.reduce<Record<string, number>>((result, reminder) => {
    result[reminder.lead_id] = (result[reminder.lead_id] ?? 0) + 1;
    return result;
  }, {});

  return (
    <AppShell active="pipeline" userEmail={user.email}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-400">
            Kanban Pipeline
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            CRM pipeline board
          </h1>
          <p className="mt-4 max-w-2xl leading-8 text-zinc-400">
            Drag leads between stages, inspect activity, and keep opportunities moving.
          </p>
        </div>
      </div>

      {leadsError && (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
          Unable to load pipeline: {leadsError.message}
        </div>
      )}

      <PipelineBoard
        activityLogs={activityLogs}
        leads={leads}
        reminderCounts={reminderCounts}
      />
    </AppShell>
  );
}
