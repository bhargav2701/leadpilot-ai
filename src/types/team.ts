export type TeamRole = "Owner" | "Member";

export type TeamMember = {
  id: string;
  user_id: string;
  workspace_id: string;
  role: TeamRole;
  created_at: string;
};

export type WorkspaceContext = {
  role: TeamRole;
  userId: string;
  workspaceId: string;
};
