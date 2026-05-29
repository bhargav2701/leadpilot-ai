export type LeadStatus = "New" | "Qualified" | "Converted" | "Lost";

export type Lead = {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: LeadStatus;
  notes: string | null;
  created_at: string;
};

export const leadStatuses: LeadStatus[] = ["New", "Qualified", "Converted", "Lost"];
