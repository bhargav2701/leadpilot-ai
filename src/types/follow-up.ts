export type FollowUpTone = "Professional" | "Friendly" | "Urgent" | "Sales";

export type FollowUp = {
  id: string;
  lead_id: string;
  user_id: string;
  generated_message: string;
  tone: FollowUpTone;
  created_at: string;
};

export const followUpTones: FollowUpTone[] = ["Professional", "Friendly", "Urgent", "Sales"];
