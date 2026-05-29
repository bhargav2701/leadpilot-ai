import Link from "next/link";
import { SubmitButton } from "@/components/submit-button";
import type { Lead } from "@/types/lead";
import { leadStatuses } from "@/types/lead";

type LeadFormProps = {
  action: (formData: FormData) => Promise<void>;
  buttonLabel: string;
  lead?: Lead;
};

export function LeadForm({ action, buttonLabel, lead }: LeadFormProps) {
  return (
    <form action={action} className="rounded-xl border border-white/10 bg-zinc-950 p-6">
      {lead && <input name="id" type="hidden" value={lead.id} />}

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-zinc-300">Full Name</span>
          <input
            className="mt-2 w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none transition focus:border-orange-500"
            defaultValue={lead?.full_name ?? ""}
            name="full_name"
            required
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-zinc-300">Email</span>
          <input
            className="mt-2 w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none transition focus:border-orange-500"
            defaultValue={lead?.email ?? ""}
            name="email"
            type="email"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-zinc-300">Phone</span>
          <input
            className="mt-2 w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none transition focus:border-orange-500"
            defaultValue={lead?.phone ?? ""}
            name="phone"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-zinc-300">Source</span>
          <input
            className="mt-2 w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none transition focus:border-orange-500"
            defaultValue={lead?.source ?? ""}
            name="source"
            placeholder="Website, WhatsApp, Referral"
          />
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-zinc-300">Status</span>
          <select
            className="mt-2 w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none transition focus:border-orange-500"
            defaultValue={lead?.status ?? "New"}
            name="status"
          >
            {leadStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-zinc-300">Notes</span>
          <textarea
            className="mt-2 min-h-36 w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none transition focus:border-orange-500"
            defaultValue={lead?.notes ?? ""}
            name="notes"
          />
        </label>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Link
          className="rounded-lg border border-white/10 px-5 py-3 text-center text-sm font-bold text-zinc-300 transition hover:border-white/20 hover:text-white"
          href={lead ? `/leads/${lead.id}` : "/leads"}
        >
          Cancel
        </Link>
        <SubmitButton
          className="rounded-lg bg-orange-500 px-5 py-3 text-sm font-black text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
          pendingLabel="Saving lead..."
        >
          {buttonLabel}
        </SubmitButton>
      </div>
    </form>
  );
}
