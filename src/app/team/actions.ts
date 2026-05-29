"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireWorkspace } from "@/lib/auth/workspace";
import type { TeamRole } from "@/types/team";

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function encodedMessage(message: string) {
  return encodeURIComponent(message);
}

export async function inviteTeamMember(formData: FormData) {
  const { supabase, role, workspaceId } = await requireWorkspace();
  const userId = getValue(formData, "user_id");
  const memberRole = (getValue(formData, "role") || "Member") as TeamRole;

  if (role !== "Owner") {
    redirect(`/team?error=${encodedMessage("Only owners can invite team members.")}`);
  }

  if (!userId) {
    redirect(`/team?error=${encodedMessage("User ID is required.")}`);
  }

  const { error } = await supabase.from("team_members").upsert({
    role: memberRole === "Owner" ? "Owner" : "Member",
    user_id: userId,
    workspace_id: workspaceId,
  });

  if (error) {
    redirect(`/team?error=${encodedMessage(error.message)}`);
  }

  revalidatePath("/team");
  revalidatePath("/leads");
  redirect(`/team?success=${encodedMessage("Team member invited.")}`);
}

export async function removeTeamMember(formData: FormData) {
  const { supabase, role, workspaceId } = await requireWorkspace();
  const userId = getValue(formData, "user_id");

  if (role !== "Owner") {
    redirect(`/team?error=${encodedMessage("Only owners can remove team members.")}`);
  }

  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId);

  if (error) {
    redirect(`/team?error=${encodedMessage(error.message)}`);
  }

  revalidatePath("/team");
  revalidatePath("/leads");
  redirect(`/team?success=${encodedMessage("Team member removed.")}`);
}
