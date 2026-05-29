import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth/require-user";
import { createLead } from "../actions";
import { LeadForm } from "../lead-form";

export default async function NewLeadPage() {
  const { user } = await requireUser();

  return (
    <AppShell active="leads" userEmail={user.email}>
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-400">New Lead</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Add lead</h1>
      <div className="mt-8">
        <LeadForm action={createLead} buttonLabel="Save Lead" />
      </div>
    </AppShell>
  );
}
