import { requireUser } from "./require-user";
import type { TeamMember, WorkspaceContext } from "@/types/team";

export async function requireWorkspace(): Promise<
  WorkspaceContext & Awaited<ReturnType<typeof requireUser>>
> {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("team_members")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1);

  const membership = data?.[0] as TeamMember | undefined;

  return {
    role: membership?.role ?? "Owner",
    supabase,
    user,
    userId: user.id,
    workspaceId: membership?.workspace_id ?? user.id,
  };
}

export async function getWorkspaceMembers(workspaceId: string) {
  const { supabase } = await requireUser();
  const { data } = await supabase
    .from("team_members")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  return (data ?? []) as TeamMember[];
}
