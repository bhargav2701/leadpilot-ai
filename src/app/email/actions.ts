"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { generateEmailTemplate, type EmailTemplateKey } from "@/lib/email/templates";
import { sendLeadEmail } from "@/lib/email/send";
import type { Lead } from "@/types/lead";

export async function sendLeadEmailAction({
  body,
  leadId,
  subject,
  templateKey = "follow-up",
}: {
  body?: string;
  leadId: string;
  subject?: string;
  templateKey?: EmailTemplateKey;
}) {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) {
    return { error: "Lead not found." };
  }

  const lead = data as Lead;
  const fallback = generateEmailTemplate(templateKey, lead);
  const result = await sendLeadEmail({
    body: body?.trim() || fallback.body,
    lead,
    subject: subject?.trim() || fallback.subject,
    supabase,
    userId: user.id,
  });

  revalidatePath("/dashboard");
  revalidatePath("/reminders");
  revalidatePath(`/leads/${lead.id}`);

  return result;
}
