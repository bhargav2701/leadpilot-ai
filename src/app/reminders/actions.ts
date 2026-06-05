"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireWorkspace } from "@/lib/auth/workspace";
import { reminderTypes, type ReminderType } from "@/types/reminder";

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getReminderType(formData: FormData): ReminderType {
  const reminderType = getValue(formData, "reminder_type") as ReminderType;
  return reminderTypes.includes(reminderType) ? reminderType : "Follow Up";
}

function encodedMessage(message: string) {
  return encodeURIComponent(message);
}

function getReturnPath(formData: FormData, fallback: string) {
  const returnPath = getValue(formData, "return_path");
  return returnPath.startsWith("/") ? returnPath : fallback;
}

export async function createReminder(formData: FormData) {
  const { supabase, workspaceId } = await requireWorkspace();
  const leadId = getValue(formData, "lead_id");
  const title = getValue(formData, "title");
  const reminderDate = getValue(formData, "reminder_date");
  const reminderType = getReminderType(formData);
  const returnPath = getReturnPath(formData, leadId ? `/leads/${leadId}` : "/reminders");

  if (!leadId) {
    redirect(`${returnPath}?error=${encodedMessage("Lead is required.")}`);
  }

  if (!title) {
    redirect(`${returnPath}?error=${encodedMessage("Reminder title is required.")}`);
  }

  if (!reminderDate || Number.isNaN(new Date(reminderDate).getTime())) {
    redirect(`${returnPath}?error=${encodedMessage("Valid reminder date is required.")}`);
  }

  const { data: lead } = await supabase
    .from("leads")
    .select("id, full_name")
    .eq("id", leadId)
    .eq("user_id", workspaceId)
    .single();

  if (!lead) {
    redirect(`${returnPath}?error=${encodedMessage("Lead not found.")}`);
  }

  const { data, error } = await supabase
    .from("reminders")
    .insert({
      lead_id: leadId,
      reminder_date: new Date(reminderDate).toISOString(),
      reminder_type: reminderType,
      title,
      user_id: workspaceId,
    })
    .select("id")
    .single();

  if (error) {
    redirect(`${returnPath}?error=${encodedMessage(error.message)}`);
  }

  await supabase.from("activity_logs").insert({
    activity_type: "Reminder Created",
    description: `Created ${reminderType.toLowerCase()} reminder "${title}" for ${lead.full_name}.`,
    lead_id: leadId,
    user_id: workspaceId,
  });

  revalidatePath("/dashboard");
  revalidatePath("/reminders");
  revalidatePath(`/leads/${leadId}`);
  redirect(`${returnPath}?success=${encodedMessage(data ? "Reminder created successfully." : "Reminder saved.")}`);
}

export async function completeReminder(formData: FormData) {
  const { supabase, workspaceId } = await requireWorkspace();
  const id = getValue(formData, "id");
  const returnPath = getReturnPath(formData, "/reminders");

  const { data: reminder } = await supabase
    .from("reminders")
    .select("id, lead_id, title, completed, leads(full_name)")
    .eq("id", id)
    .eq("user_id", workspaceId)
    .single();

  if (!reminder) {
    redirect(`${returnPath}?error=${encodedMessage("Reminder not found.")}`);
  }

  if (!reminder.completed) {
    const { error } = await supabase
      .from("reminders")
      .update({ completed: true })
      .eq("id", id)
      .eq("user_id", workspaceId);

    if (error) {
      redirect(`${returnPath}?error=${encodedMessage(error.message)}`);
    }

    const lead = Array.isArray(reminder.leads) ? reminder.leads[0] : reminder.leads;

    await supabase.from("activity_logs").insert({
      activity_type: "Reminder Completed",
      description: `Completed reminder "${reminder.title}"${lead?.full_name ? ` for ${lead.full_name}` : ""}.`,
      lead_id: reminder.lead_id,
      user_id: workspaceId,
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/reminders");
  revalidatePath(`/leads/${reminder.lead_id}`);
  redirect(`${returnPath}?success=${encodedMessage("Reminder marked complete.")}`);
}
