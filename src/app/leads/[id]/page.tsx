import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth/require-user";
import type { Lead } from "@/types/lead";
import { DeleteLeadModal } from "../delete-lead-modal";

type LeadDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function LeadDetailsPage({ params }: LeadDetailsPageProps) {
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

  const lead = data as Lead;
  const details = [
    { label: "Email", value: lead.email || "-" },
    { label: "Phone", value: lead.phone || "-" },
    { label: "Source", value: lead.source || "-" },
    { label: "Status", value: lead.status },
    { label: "Created", value: new Date(lead.created_at).toLocaleString() },
  ];

  return (
    <AppShell active="leads" userEmail={user.email}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-400">
            Lead Details
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            {lead.full_name}
          </h1>
        </div>
        <div className="flex gap-3">
          <Link
            className="rounded-lg border border-white/10 px-4 py-2 text-sm font-bold text-zinc-300 transition hover:border-orange-500/50 hover:text-orange-300"
            href={`/leads/${lead.id}/edit`}
          >
            Edit
          </Link>
          <DeleteLeadModal id={lead.id} name={lead.full_name} />
        </div>
      </div>

      <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-6">
          <h2 className="text-2xl font-black">Notes</h2>
          <p className="mt-5 whitespace-pre-wrap leading-8 text-zinc-300">
            {lead.notes || "No notes added."}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-6">
          <h2 className="text-2xl font-black">Information</h2>
          <div className="mt-5 space-y-4">
            {details.map((detail) => (
              <div className="rounded-lg border border-white/10 bg-black p-4" key={detail.label}>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
                  {detail.label}
                </p>
                <p className="mt-2 font-semibold text-white">{detail.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
