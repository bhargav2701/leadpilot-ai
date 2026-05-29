import { AppShell } from "@/components/app-shell";
import { Notification } from "@/components/notification";
import { SubmitButton } from "@/components/submit-button";
import { getWorkspaceMembers, requireWorkspace } from "@/lib/auth/workspace";
import type { Lead } from "@/types/lead";
import { inviteTeamMember, removeTeamMember } from "./actions";

type TeamPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function TeamPage({ searchParams }: TeamPageProps) {
  const { supabase, user, role, workspaceId } = await requireWorkspace();
  const params = await searchParams;
  const [members, leadsResult] = await Promise.all([
    getWorkspaceMembers(workspaceId),
    supabase.from("leads").select("*").eq("user_id", workspaceId),
  ]);
  const leads = (leadsResult.data ?? []) as Lead[];
  const team = [
    { created_at: "", id: workspaceId, role: "Owner", user_id: workspaceId, workspace_id: workspaceId },
    ...members.filter((member) => member.user_id !== workspaceId),
  ];

  return (
    <AppShell active="team" userEmail={user.email}>
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-400">
        Team Dashboard
      </p>
      <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
        Team accounts
      </h1>
      <p className="mt-4 max-w-2xl leading-8 text-zinc-400">
        Manage workspace access, roles, assignments, and team lead ownership.
      </p>

      <Notification error={params.error} success={params.success} />

      <section className="mt-8 rounded-xl border border-white/10 bg-zinc-950 p-6">
        <h2 className="text-2xl font-black">Invite Team Members</h2>
        <form action={inviteTeamMember} className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]">
          <input
            className="min-w-0 rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500"
            disabled={role !== "Owner"}
            name="user_id"
            placeholder="Supabase user id"
          />
          <select
            className="rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none transition focus:border-orange-500"
            disabled={role !== "Owner"}
            name="role"
          >
            <option value="Member">Member</option>
            <option value="Owner">Owner</option>
          </select>
          <SubmitButton
            className="rounded-lg bg-orange-500 px-5 py-3 text-sm font-black text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
            pendingLabel="Inviting..."
          >
            Invite
          </SubmitButton>
        </form>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-2">
        {team.map((member) => {
          const assigned = leads.filter((lead) => lead.assigned_to === member.user_id);
          const converted = assigned.filter((lead) => lead.status === "Converted").length;

          return (
            <article className="rounded-xl border border-white/10 bg-zinc-950 p-6" key={member.user_id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-lg font-black text-white">{member.user_id}</p>
                  <p className="mt-2 w-fit rounded-full bg-orange-500/15 px-3 py-1 text-sm font-bold text-orange-300">
                    {member.role}
                  </p>
                </div>
                {role === "Owner" && member.user_id !== workspaceId && (
                  <form action={removeTeamMember}>
                    <input name="user_id" type="hidden" value={member.user_id} />
                    <SubmitButton
                      className="rounded-lg border border-red-500/40 px-3 py-2 text-sm font-bold text-red-300 transition hover:bg-red-500 hover:text-white"
                      pendingLabel="Removing..."
                    >
                      Remove
                    </SubmitButton>
                  </form>
                )}
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-white/10 bg-black p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
                    Assigned Leads
                  </p>
                  <p className="mt-2 text-3xl font-black text-orange-500">{assigned.length}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-black p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
                    Converted
                  </p>
                  <p className="mt-2 text-3xl font-black text-orange-500">{converted}</p>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </AppShell>
  );
}
