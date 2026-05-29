import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Notification } from "@/components/notification";
import { requireUser } from "@/lib/auth/require-user";
import type { Lead } from "@/types/lead";
import { leadStatuses } from "@/types/lead";
import { DeleteLeadModal } from "./delete-lead-modal";

const pageSize = 8;

type LeadsPageProps = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
    sort?: string;
    success?: string;
    error?: string;
  }>;
};

function pageHref(page: number, q: string, status: string, sort: string) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status) params.set("status", status);
  if (sort) params.set("sort", sort);
  params.set("page", String(page));
  return `/leads?${params.toString()}`;
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const { supabase, user } = await requireUser();
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const status = params.status?.trim() ?? "";
  const sort = params.sort === "oldest" ? "oldest" : "newest";
  const currentPage = Math.max(Number(params.page ?? "1") || 1, 1);
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("leads")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: sort === "oldest" })
    .range(from, to);

  if (q) {
    const term = q.replaceAll("%", "").replaceAll(",", " ");
    query = query.or(
      `full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`,
    );
  }

  if (status && leadStatuses.includes(status as never)) {
    query = query.eq("status", status);
  }

  const { data, count } = await query;
  const leads = (data ?? []) as Lead[];
  const totalPages = Math.max(Math.ceil((count ?? 0) / pageSize), 1);

  return (
    <AppShell active="leads" userEmail={user.email}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-400">Leads</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            Lead management
          </h1>
        </div>
        <Link
          className="rounded-lg bg-orange-500 px-5 py-3 text-center text-sm font-black text-black transition hover:bg-orange-400"
          href="/leads/new"
        >
          Add Lead
        </Link>
      </div>

      <Notification error={params.error} success={params.success} />

      <form className="mt-8 grid gap-3 rounded-xl border border-white/10 bg-zinc-950 p-4 md:grid-cols-[1fr_190px_170px_auto]">
        <input
          className="rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500"
          defaultValue={q}
          name="q"
          placeholder="Search by name, email, or phone"
        />
        <select
          className="rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none transition focus:border-orange-500"
          defaultValue={status}
          name="status"
        >
          <option value="">All statuses</option>
          {leadStatuses.map((leadStatus) => (
            <option key={leadStatus} value={leadStatus}>
              {leadStatus}
            </option>
          ))}
        </select>
        <select
          className="rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none transition focus:border-orange-500"
          defaultValue={sort}
          name="sort"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
        <button
          className="rounded-lg bg-orange-500 px-5 py-3 text-sm font-black text-black transition hover:bg-orange-400"
          type="submit"
        >
          Search
        </button>
      </form>

      <section className="mt-6 overflow-hidden rounded-xl border border-white/10 bg-zinc-950">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-[0.16em] text-zinc-500">
              <tr>
                <th className="px-5 py-4">Lead</th>
                <th className="px-5 py-4">Phone</th>
                <th className="px-5 py-4">Source</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Created</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {leads.map((lead) => (
                <tr className="transition hover:bg-white/[0.03]" key={lead.id}>
                  <td className="px-5 py-4">
                    <Link
                      className="font-bold text-white hover:text-orange-300"
                      href={`/leads/${lead.id}`}
                    >
                      {lead.full_name}
                    </Link>
                    <p className="mt-1 text-sm text-zinc-500">{lead.email || "No email"}</p>
                  </td>
                  <td className="px-5 py-4 text-zinc-300">{lead.phone || "-"}</td>
                  <td className="px-5 py-4 text-zinc-300">{lead.source || "-"}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-orange-500/15 px-3 py-1 text-sm font-bold text-orange-300">
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-zinc-400">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Link
                        className="rounded-lg border border-white/10 px-3 py-2 text-sm font-bold text-zinc-300 transition hover:border-orange-500/50 hover:text-orange-300"
                        href={`/leads/${lead.id}/edit`}
                      >
                        Edit
                      </Link>
                      <DeleteLeadModal id={lead.id} name={lead.full_name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!leads.length && (
          <div className="p-10 text-center">
            <p className="font-bold">No leads found</p>
            <p className="mt-2 text-sm text-zinc-500">Try a different search or create a new lead.</p>
          </div>
        )}
      </section>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          Page {currentPage} of {totalPages}
        </p>
        <div className="flex gap-2">
          <Link
            className={`rounded-lg border border-white/10 px-4 py-2 text-sm font-bold ${
              currentPage <= 1 ? "pointer-events-none opacity-40" : "hover:border-orange-500/50"
            }`}
            href={pageHref(currentPage - 1, q, status, sort)}
          >
            Previous
          </Link>
          <Link
            className={`rounded-lg border border-white/10 px-4 py-2 text-sm font-bold ${
              currentPage >= totalPages
                ? "pointer-events-none opacity-40"
                : "hover:border-orange-500/50"
            }`}
            href={pageHref(currentPage + 1, q, status, sort)}
          >
            Next
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
