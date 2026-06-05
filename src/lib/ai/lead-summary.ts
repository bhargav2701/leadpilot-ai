import type { ActivityLog } from "@/types/activity-log";
import type { FollowUp } from "@/types/follow-up";
import type { Lead } from "@/types/lead";
import type { Reminder } from "@/types/reminder";

export type LeadHealth = "Excellent" | "Good" | "Moderate" | "At Risk";

export type AILeadSummary = {
  health: LeadHealth;
  opportunityScore: number;
  recommendedAction:
    | "Schedule Demo"
    | "Send Pricing"
    | "Follow Up Within 24 Hours"
    | "Move To Proposal Stage"
    | "Mark As Lost";
  summary: string;
};

type LeadSummaryInput = {
  activityLogs: ActivityLog[];
  followUps: FollowUp[];
  lead: Lead;
  reminders: Reminder[];
};

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function getTemperatureBoost(temperature: string | null) {
  if (temperature === "Hot") return 18;
  if (temperature === "Warm") return 10;
  return 4;
}

function getRecentActivityScore(activityLogs: ActivityLog[]) {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentCount = activityLogs.filter(
    (activity) => new Date(activity.created_at).getTime() >= sevenDaysAgo,
  ).length;

  return Math.min(recentCount * 4, 16);
}

function getReminderCompletionScore(reminders: Reminder[]) {
  if (!reminders.length) return 6;

  const completed = reminders.filter((reminder) => reminder.completed).length;
  return Math.round((completed / reminders.length) * 12);
}

export function buildAILeadSummary({
  activityLogs,
  followUps,
  lead,
  reminders,
}: LeadSummaryInput): AILeadSummary {
  const baseScore = Math.round(((lead.lead_score ?? 0) / 100) * 64);
  const opportunityScore = Math.min(
    100,
    Math.max(
      0,
      baseScore +
        getTemperatureBoost(lead.lead_temperature) +
        getRecentActivityScore(activityLogs) +
        getReminderCompletionScore(reminders),
    ),
  );
  const completedReminders = reminders.filter((reminder) => reminder.completed).length;
  const openReminders = reminders.length - completedReminders;
  const latestActivity = activityLogs[0];
  const source = lead.source || "unknown";
  const notesSignal = lead.notes ? ` Notes indicate: ${lead.notes}` : "";
  const latestActivitySignal = latestActivity
    ? ` Most recent activity: ${latestActivity.description}`
    : " No activity has been recorded yet.";
  const summary = `${lead.full_name} is a ${lead.lead_temperature?.toLowerCase() ?? "cold"} lead from ${source} source with a lead score of ${lead.lead_score ?? 0}. The lead has ${pluralize(followUps.length, "follow-up")} and ${pluralize(reminders.length, "reminder")}, with ${completedReminders} completed and ${openReminders} open.${latestActivitySignal}${notesSignal}`;
  let recommendedAction: AILeadSummary["recommendedAction"] = "Follow Up Within 24 Hours";

  if (lead.status === "Lost" || opportunityScore < 30) {
    recommendedAction = "Mark As Lost";
  } else if (lead.status === "Proposal" || opportunityScore >= 82) {
    recommendedAction = "Send Pricing";
  } else if (lead.status === "Qualified" && opportunityScore >= 64) {
    recommendedAction = "Move To Proposal Stage";
  } else if (lead.lead_temperature === "Hot" || opportunityScore >= 72) {
    recommendedAction = "Schedule Demo";
  }

  const hasRecentActivity = getRecentActivityScore(activityLogs) > 0;
  const followUpCompletion = reminders.length ? completedReminders / reminders.length : 1;
  let health: LeadHealth = "At Risk";

  if (opportunityScore >= 82 && hasRecentActivity && followUpCompletion >= 0.5) {
    health = "Excellent";
  } else if (opportunityScore >= 65) {
    health = "Good";
  } else if (opportunityScore >= 42 || hasRecentActivity) {
    health = "Moderate";
  }

  return {
    health,
    opportunityScore,
    recommendedAction,
    summary,
  };
}
