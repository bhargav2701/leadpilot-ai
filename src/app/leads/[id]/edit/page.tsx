import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Notification } from "@/components/notification";
import { getWorkspaceMembers, requireWorkspace } from "@/lib/auth/workspace";
import type { Lead } from "@/types/lead";
import { updateLead } from "../../actions";
import { LeadForm } from "../../lead-form";

type EditLeadPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function EditLeadPage({ params, searchParams }: EditLeadPageProps) {
  const { id } = await params;
  const queryParams = await searchParams;
  const { supabase, user, workspaceId } = await requireWorkspace();
  const { data } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .eq("user_id", workspaceId)
    .single();

  if (!data) {
    notFound();
  }

  const members = await getWorkspaceMembers(workspaceId);

  return (
    <AppShell active="leads" userEmail={user.email}>
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-400">Edit Lead</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
        Update lead information
      </h1>
      <Notification error={queryParams.error} success={queryParams.success} />
      <div className="mt-8">
        <LeadForm
          action={updateLead}
          buttonLabel="Update Lead"
          lead={data as Lead}
          members={members}
          ownerId={workspaceId}
        />
      </div>
    </AppShell>
  );
}
