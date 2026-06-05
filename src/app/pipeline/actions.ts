"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import type { LeadStatus } from "@/types/lead";

const pipelineStages = ["New", "Qualified", "Proposal", "Won", "Lost"] satisfies LeadStatus[];
type PipelineStage = (typeof pipelineStages)[number];

export async function moveLeadStage(leadId: string, nextStatus: LeadStatus) {
  if (!pipelineStages.includes(nextStatus as PipelineStage)) {
    throw new Error("Invalid pipeline stage.");
  }

  const { supabase, user } = await requireUser();
  const { data: lead } = await supabase
    .from("leads")
    .select("id, full_name, status")
    .eq("id", leadId)
    .eq("user_id", user.id)
    .single();

  if (!lead) {
    throw new Error("Lead not found.");
  }

  if (lead.status === nextStatus) {
    return;
  }

  const { error } = await supabase
    .from("leads")
    .update({ status: nextStatus })
    .eq("id", leadId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  await supabase.from("activity_logs").insert({
    activity_type: "Status Changed",
    description: `Moved lead ${lead.full_name} from ${lead.status} to ${nextStatus}.`,
    lead_id: lead.id,
    user_id: user.id,
  });

  revalidatePath("/pipeline");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
}
