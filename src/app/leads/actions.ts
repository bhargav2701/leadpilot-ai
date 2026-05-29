"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { leadStatuses, type LeadStatus } from "@/types/lead";

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getStatus(formData: FormData): LeadStatus {
  const status = getValue(formData, "status") as LeadStatus;
  return leadStatuses.includes(status) ? status : "New";
}

function encodedMessage(message: string) {
  return encodeURIComponent(message);
}

export async function createLead(formData: FormData) {
  const { supabase, user } = await requireUser();
  const fullName = getValue(formData, "full_name");

  if (!fullName) {
    redirect(`/leads/new?error=${encodedMessage("Full name is required.")}`);
  }

  const { error } = await supabase.from("leads").insert({
    user_id: user.id,
    full_name: fullName,
    email: getValue(formData, "email") || null,
    phone: getValue(formData, "phone") || null,
    source: getValue(formData, "source") || null,
    status: getStatus(formData),
    notes: getValue(formData, "notes") || null,
  });

  if (error) {
    redirect(`/leads/new?error=${encodedMessage(error.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/leads");
  redirect(`/leads?success=${encodedMessage("Lead created successfully.")}`);
}

export async function updateLead(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = getValue(formData, "id");
  const fullName = getValue(formData, "full_name");

  if (!fullName) {
    redirect(`/leads/${id}/edit?error=${encodedMessage("Full name is required.")}`);
  }

  const { error } = await supabase
    .from("leads")
    .update({
      full_name: fullName,
      email: getValue(formData, "email") || null,
      phone: getValue(formData, "phone") || null,
      source: getValue(formData, "source") || null,
      status: getStatus(formData),
      notes: getValue(formData, "notes") || null,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    redirect(`/leads/${id}/edit?error=${encodedMessage(error.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  redirect(`/leads/${id}?success=${encodedMessage("Lead updated successfully.")}`);
}

export async function deleteLead(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = getValue(formData, "id");

  const { error } = await supabase.from("leads").delete().eq("id", id).eq("user_id", user.id);

  if (error) {
    redirect(`/leads?error=${encodedMessage(error.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/leads");
  redirect(`/leads?success=${encodedMessage("Lead deleted successfully.")}`);
}
