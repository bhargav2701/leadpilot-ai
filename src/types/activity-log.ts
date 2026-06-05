export type ActivityType =
  | "Lead Created"
  | "Lead Updated"
  | "Lead Deleted"
  | "Lead Assigned"
  | "Status Changed"
  | "Follow-Up Generated"
  | "CSV Import"
  | "Reminder Created"
  | "Reminder Completed";

export type ActivityLog = {
  id: string;
  user_id: string;
  lead_id: string | null;
  activity_type: ActivityType;
  description: string;
  created_at: string;
};
