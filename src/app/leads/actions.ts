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

export async function createLead(formData: FormData) {
  const { supabase, user } = await requireUser();

  const { error } = await supabase.from("leads").insert({
    user_id: user.id,
    full_name: getValue(formData, "full_name"),
    email: getValue(formData, "email") || null,
    phone: getValue(formData, "phone") || null,
    source: getValue(formData, "source") || null,
    status: getStatus(formData),
    notes: getValue(formData, "notes") || null,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/leads");
  redirect("/leads");
}

export async function updateLead(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = getValue(formData, "id");

  const { error } = await supabase
    .from("leads")
    .update({
      full_name: getValue(formData, "full_name"),
      email: getValue(formData, "email") || null,
      phone: getValue(formData, "phone") || null,
      source: getValue(formData, "source") || null,
      status: getStatus(formData),
      notes: getValue(formData, "notes") || null,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  redirect(`/leads/${id}`);
}

export async function deleteLead(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = getValue(formData, "id");

  const { error } = await supabase.from("leads").delete().eq("id", id).eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/leads");
  redirect("/leads");
}
