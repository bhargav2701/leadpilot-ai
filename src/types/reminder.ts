export type ReminderType = "Call" | "Email" | "WhatsApp" | "Meeting" | "Follow Up";

export type Reminder = {
  id: string;
  user_id: string;
  lead_id: string;
  title: string;
  reminder_date: string;
  reminder_type: ReminderType;
  completed: boolean;
  created_at: string;
};

export type ReminderWithLead = Reminder & {
  leads?: {
    full_name: string;
  } | null;
};

export const reminderTypes: ReminderType[] = ["Call", "Email", "WhatsApp", "Meeting", "Follow Up"];
