"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";

export async function logWhatsAppInitiated(leadId: string, templateName?: string) {
  const { supabase, user } = await requireUser();
  const { data: lead } = await supabase
    .from("leads")
    .select("id, full_name")
    .eq("id", leadId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!lead) {
    return { error: "Lead not found." };
  }

  const { error } = await supabase.from("activity_logs").insert({
    activity_type: "WhatsApp Sent",
    description: templateName
      ? `WhatsApp template "${templateName}" initiated for ${lead.full_name}`
      : `WhatsApp message initiated to ${lead.full_name}`,
    lead_id: lead.id,
    user_id: user.id,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/pipeline");
  revalidatePath("/leads");
  revalidatePath(`/leads/${lead.id}`);

  return { ok: true };
}
