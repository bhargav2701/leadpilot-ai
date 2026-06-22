"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireWorkspace } from "@/lib/auth/workspace";
import {
  getOrCreateSubscription,
  getSubscriptionUsage,
  isLimitReached,
} from "@/lib/billing/subscription";
import type { ActivityType } from "@/types/activity-log";
import type { Lead } from "@/types/lead";
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

async function logActivity({
  activityType,
  description,
  leadId,
  supabase,
  workspaceId,
}: {
  activityType: ActivityType;
  description: string;
  leadId: string | null;
  supabase: Awaited<ReturnType<typeof requireWorkspace>>["supabase"];
  workspaceId: string;
}) {
  await supabase.from("activity_logs").insert({
    activity_type: activityType,
    description,
    lead_id: leadId,
    user_id: workspaceId,
  });
}

export async function createLead(formData: FormData) {
  const { supabase, user, workspaceId } = await requireWorkspace();
  const fullName = getValue(formData, "full_name");
  const assignedTo = getValue(formData, "assigned_to");

  if (!fullName) {
    redirect(`/leads/new?error=${encodedMessage("Full name is required.")}`);
  }

  const [subscription, usage] = await Promise.all([
    getOrCreateSubscription(supabase, user.id),
    getSubscriptionUsage(supabase, user.id),
  ]);

  if (isLimitReached(usage.leadCount, subscription.lead_limit)) {
    redirect(
      `/leads?upgrade=lead-limit&error=${encodedMessage("Lead limit reached. Upgrade to create more leads.")}`,
    );
  }

  const { data, error } = await supabase
    .from("leads")
    .insert({
      user_id: workspaceId,
      assigned_to: assignedTo || null,
      full_name: fullName,
      email: getValue(formData, "email") || null,
      phone: getValue(formData, "phone") || null,
      source: getValue(formData, "source") || null,
      status: getStatus(formData),
      notes: getValue(formData, "notes") || null,
    })
    .select("id, full_name, assigned_to")
    .single();

  if (error) {
    redirect(`/leads/new?error=${encodedMessage(error.message)}`);
  }

  if (data) {
    await logActivity({
      activityType: "Lead Created",
      description: `Created lead ${data.full_name}.`,
      leadId: data.id,
      supabase,
      workspaceId,
    });

    if (data.assigned_to) {
      await logActivity({
        activityType: "Lead Assigned",
        description: `Assigned ${data.full_name}.`,
        leadId: data.id,
        supabase,
        workspaceId,
      });
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/billing");
  revalidatePath("/leads");
  revalidatePath("/my-leads");
  revalidatePath("/team");
  redirect(`/leads?success=${encodedMessage("Lead created successfully.")}`);
}

export async function updateLead(formData: FormData) {
  const { supabase, workspaceId } = await requireWorkspace();
  const id = getValue(formData, "id");
  const fullName = getValue(formData, "full_name");
  const assignedTo = getValue(formData, "assigned_to");
  const status = getStatus(formData);

  if (!fullName) {
    redirect(`/leads/${id}/edit?error=${encodedMessage("Full name is required.")}`);
  }

  const { data: existingLead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .eq("user_id", workspaceId)
    .maybeSingle();

  const { error } = await supabase
    .from("leads")
    .update({
      full_name: fullName,
      assigned_to: assignedTo || null,
      email: getValue(formData, "email") || null,
      phone: getValue(formData, "phone") || null,
      source: getValue(formData, "source") || null,
      status,
      notes: getValue(formData, "notes") || null,
    })
    .eq("id", id)
    .eq("user_id", workspaceId);

  if (error) {
    redirect(`/leads/${id}/edit?error=${encodedMessage(error.message)}`);
  }

  const previousLead = existingLead as Lead | null;

  await logActivity({
    activityType: "Lead Updated",
    description: `Updated lead ${fullName}.`,
    leadId: id,
    supabase,
    workspaceId,
  });

  if (previousLead && previousLead.status !== status) {
    await logActivity({
      activityType: "Status Changed",
      description: `Changed status from ${previousLead.status} to ${status}.`,
      leadId: id,
      supabase,
      workspaceId,
    });
  }

  if (previousLead && (previousLead.assigned_to ?? "") !== assignedTo) {
    await logActivity({
      activityType: "Lead Assigned",
      description: assignedTo ? `Assigned ${fullName}.` : `Unassigned ${fullName}.`,
      leadId: id,
      supabase,
      workspaceId,
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/leads");
  revalidatePath("/my-leads");
  revalidatePath("/team");
  revalidatePath(`/leads/${id}`);
  redirect(`/leads/${id}?success=${encodedMessage("Lead updated successfully.")}`);
}

export async function deleteLead(formData: FormData) {
  const { supabase, workspaceId, role } = await requireWorkspace();
  const id = getValue(formData, "id");

  if (role !== "Owner") {
    redirect(`/leads?error=${encodedMessage("Only owners can delete leads.")}`);
  }

  const { data: existingLead } = await supabase
    .from("leads")
    .select("full_name")
    .eq("id", id)
    .eq("user_id", workspaceId)
    .maybeSingle();

  await logActivity({
    activityType: "Lead Deleted",
    description: `Deleted lead ${existingLead?.full_name ?? id}.`,
    leadId: id,
    supabase,
    workspaceId,
  });

  const { error } = await supabase.from("leads").delete().eq("id", id).eq("user_id", workspaceId);

  if (error) {
    redirect(`/leads?error=${encodedMessage(error.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/leads");
  revalidatePath("/my-leads");
  revalidatePath("/team");
  redirect(`/leads?success=${encodedMessage("Lead deleted successfully.")}`);
}
