import { Resend } from "resend";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Lead } from "@/types/lead";
import { generateEmailTemplate, type EmailTemplateKey } from "./templates";

type SendLeadEmailInput = {
  body: string;
  lead: Pick<Lead, "email" | "full_name" | "id">;
  subject: string;
  supabase: SupabaseClient;
  userId: string;
};

type DueReminder = {
  id: string;
  lead_id: string;
  title: string;
  leads: Lead | Lead[] | null;
};

const fromEmail = process.env.RESEND_FROM_EMAIL || "LeadPilot AI <onboarding@resend.dev>";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  return new Resend(apiKey);
}

async function logEmail({
  body,
  errorMessage,
  lead,
  status,
  subject,
  supabase,
  userId,
}: SendLeadEmailInput & { errorMessage?: string; status: "Failed" | "Sent" }) {
  await supabase.from("email_logs").insert({
    body,
    error_message: errorMessage ?? null,
    lead_id: lead.id,
    recipient_email: lead.email,
    status,
    subject,
    user_id: userId,
  });
}

export async function sendLeadEmail(input: SendLeadEmailInput) {
  const { body, lead, subject, supabase, userId } = input;

  if (!lead.email) {
    await logEmail({
      ...input,
      errorMessage: "Lead email is missing.",
      status: "Failed",
    });
    return { error: "Lead email is missing." };
  }

  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from: fromEmail,
      subject,
      text: body,
      to: [lead.email],
    });

    if (error) {
      await logEmail({ ...input, errorMessage: error.message, status: "Failed" });
      await supabase.from("activity_logs").insert({
        activity_type: "Email Failed",
        description: `Email failed to ${lead.full_name}: ${error.message}`,
        lead_id: lead.id,
        user_id: userId,
      });
      return { error: error.message };
    }

    await logEmail({ ...input, status: "Sent" });
    await supabase.from("activity_logs").insert({
      activity_type: "Email Sent",
      description: `Email sent to ${lead.full_name}`,
      lead_id: lead.id,
      user_id: userId,
    });

    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email failed to send.";
    await logEmail({ ...input, errorMessage: message, status: "Failed" });
    await supabase.from("activity_logs").insert({
      activity_type: "Email Failed",
      description: `Email failed to ${lead.full_name}: ${message}`,
      lead_id: lead.id,
      user_id: userId,
    });
    return { error: message };
  }
}

export async function processDueEmailReminders(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("reminders")
    .select("id, lead_id, title, leads(*)")
    .eq("user_id", userId)
    .eq("reminder_type", "Email")
    .eq("completed", false)
    .lte("reminder_date", new Date().toISOString())
    .limit(10);

  const reminders = (data ?? []) as DueReminder[];
  let sent = 0;
  let failed = 0;

  for (const reminder of reminders) {
    const lead = Array.isArray(reminder.leads) ? reminder.leads[0] : reminder.leads;

    if (!lead) {
      failed += 1;
      continue;
    }

    const template = generateEmailTemplate("follow-up" satisfies EmailTemplateKey, lead);
    const result = await sendLeadEmail({
      body: template.body,
      lead,
      subject: reminder.title || template.subject,
      supabase,
      userId,
    });

    if (result.error) {
      failed += 1;
      continue;
    }

    await supabase
      .from("reminders")
      .update({ completed: true })
      .eq("id", reminder.id)
      .eq("user_id", userId);

    await supabase.from("activity_logs").insert({
      activity_type: "Reminder Completed",
      description: `Completed email reminder "${reminder.title}" for ${lead.full_name}.`,
      lead_id: lead.id,
      user_id: userId,
    });

    sent += 1;
  }

  return { failed, sent };
}
