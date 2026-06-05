export type LeadStatus = "New" | "Qualified" | "Proposal" | "Won" | "Lost" | "Converted";
export type LeadTemperature = "Hot" | "Warm" | "Cold";

export type Lead = {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: LeadStatus;
  notes: string | null;
  assigned_to: string | null;
  lead_score: number;
  lead_temperature: LeadTemperature;
  created_at: string;
};

export const leadStatuses: LeadStatus[] = ["New", "Qualified", "Proposal", "Won", "Lost"];
export const leadTemperatures: LeadTemperature[] = ["Hot", "Warm", "Cold"];
