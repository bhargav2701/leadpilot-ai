import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth/require-user";
import type { Lead } from "@/types/lead";
import { updateLead } from "../../actions";
import { LeadForm } from "../../lead-form";

type EditLeadPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditLeadPage({ params }: EditLeadPageProps) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!data) {
    notFound();
  }

  return (
    <AppShell active="leads" userEmail={user.email}>
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-400">Edit Lead</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
        Update lead information
      </h1>
      <div className="mt-8">
        <LeadForm action={updateLead} buttonLabel="Update Lead" lead={data as Lead} />
      </div>
    </AppShell>
  );
}
