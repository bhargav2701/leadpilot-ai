import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { LeadScoreBadge } from "@/components/lead-score-badge";
import { Notification } from "@/components/notification";
import { WhatsAppQuickActions } from "@/components/whatsapp-quick-actions";
import { getWorkspaceMembers, requireWorkspace } from "@/lib/auth/workspace";
import {
  getOrCreateSubscription,
  getSubscriptionUsage,
  isLimitReached,
} from "@/lib/billing/subscription";
import type { Lead, LeadStatus, LeadTemperature } from "@/types/lead";
import { leadStatuses, leadTemperatures } from "@/types/lead";
import { DeleteLeadModal } from "./delete-lead-modal";

const pageSize = 8;

type LeadsPageProps = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
    temperature?: string;
    assigned?: string;
    sort?: string;
    success?: string;
    error?: string;
    upgrade?: string;
  }>;
};

function pageHref(
  page: number,
  q: string,
  status: string,
  temperature: string,
  assigned: string,
  sort: string,
) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status) params.set("status", status);
  if (temperature) params.set("temperature", temperature);
  if (assigned) params.set("assigned", assigned);
  if (sort) params.set("sort", sort);
  params.set("page", String(page));
  return `/leads?${params.toString()}`;
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const { supabase, user, workspaceId } = await requireWorkspace();
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const status = params.status?.trim() ?? "";
  const temperature = params.temperature?.trim() ?? "";
  const assigned = params.assigned?.trim() ?? "";
  const assignedFilter = assigned === "me" ? user.id : assigned;
  const sortOptions = ["newest", "oldest", "highest-score", "lowest-score"];
  const sort = sortOptions.includes(params.sort ?? "") ? (params.sort as string) : "newest";
  const currentPage = Math.max(Number(params.page ?? "1") || 1, 1);
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("leads")
    .select("*", { count: "exact" })
    .eq("user_id", workspaceId);

  if (sort === "highest-score") {
    query = query.order("lead_score", { ascending: false }).order("created_at", {
      ascending: false,
    });
  } else if (sort === "lowest-score") {
    query = query.order("lead_score", { ascending: true }).order("created_at", {
      ascending: false,
    });
  } else {
    query = query.order("created_at", { ascending: sort === "oldest" });
  }

  query = query.range(from, to);

  if (q) {
    const term = q.replaceAll("%", "").replaceAll(",", " ");
    query = query.or(
      `full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`,
    );
  }

  if (status && leadStatuses.includes(status as LeadStatus)) {
    query = query.eq("status", status);
  }

  if (temperature && leadTemperatures.includes(temperature as LeadTemperature)) {
    query = query.eq("lead_temperature", temperature);
  }

  if (assignedFilter === "unassigned") {
    query = query.is("assigned_to", null);
  } else if (assignedFilter) {
    query = query.eq("assigned_to", assignedFilter);
  }

  const { data, count } = await query;
  const leads = (data ?? []) as Lead[];
  const totalPages = Math.max(Math.ceil((count ?? 0) / pageSize), 1);
  const [members, subscription, usage] = await Promise.all([
    getWorkspaceMembers(workspaceId),
    getOrCreateSubscription(supabase, user.id),
    getSubscriptionUsage(supabase, user.id),
  ]);
  const leadLimitReached = isLimitReached(usage.leadCount, subscription.lead_limit);
  const assignees = [
    { role: "Owner", user_id: workspaceId },
    ...members.filter((member) => member.user_id !== workspaceId),
  ];

  return (
    <AppShell active="leads" userEmail={user.email}>
      <div className="w-full max-w-full min-w-0">
      <div className="flex w-full max-w-full min-w-0 flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-400">Leads</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            Lead management
          </h1>
        </div>
        {leadLimitReached ? (
          <span className="cursor-not-allowed rounded-lg bg-zinc-800 px-5 py-3 text-center text-sm font-black text-zinc-500">
            Add Lead
          </span>
        ) : (
          <Link
            className="rounded-lg bg-orange-500 px-5 py-3 text-center text-sm font-black text-black transition hover:bg-orange-400"
            href="/leads/new"
          >
            Add Lead
          </Link>
        )}
      </div>

      <Notification error={params.error} success={params.success} />

      {leadLimitReached && (
        <section className="mt-6 rounded-xl border border-orange-500/40 bg-orange-500/10 p-6">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-300">
            Upgrade Required
          </p>
          <h2 className="mt-2 text-2xl font-black">Free lead limit reached</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300">
            Your current plan has reached its lead limit. Upgrade to Starter or Pro to create
            more leads.
          </p>
          <Link
            className="mt-5 inline-flex rounded-lg bg-orange-500 px-5 py-3 text-sm font-black text-black transition hover:bg-orange-400"
            href="/billing"
          >
            View Plans
          </Link>
        </section>
      )}

      <form className="mt-8 grid w-full max-w-full min-w-0 gap-3 rounded-xl border border-white/10 bg-zinc-950 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,150px)_minmax(0,150px)_minmax(0,170px)_minmax(0,170px)_auto]">
        <input
          className="min-w-0 rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500"
          defaultValue={q}
          name="q"
          placeholder="Search by name, email, or phone"
        />
        <select
          className="min-w-0 rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none transition focus:border-orange-500"
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
          className="min-w-0 rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none transition focus:border-orange-500"
          defaultValue={assigned}
          name="assigned"
        >
          <option value="">All assignees</option>
          <option value="me">My leads</option>
          <option value="unassigned">Unassigned</option>
          {assignees.map((member) => (
            <option key={member.user_id} value={member.user_id}>
              {member.role}: {member.user_id}
            </option>
          ))}
        </select>
        <select
          className="min-w-0 rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none transition focus:border-orange-500"
          defaultValue={temperature}
          name="temperature"
        >
          <option value="">All temperatures</option>
          {leadTemperatures.map((leadTemperature) => (
            <option key={leadTemperature} value={leadTemperature}>
              {leadTemperature}
            </option>
          ))}
        </select>
        <select
          className="min-w-0 rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none transition focus:border-orange-500"
          defaultValue={sort}
          name="sort"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="highest-score">Highest Score</option>
          <option value="lowest-score">Lowest Score</option>
        </select>
        <button
          className="rounded-lg bg-orange-500 px-5 py-3 text-sm font-black text-black transition hover:bg-orange-400"
          type="submit"
        >
          Search
        </button>
      </form>

      <section className="mt-6 hidden w-full max-w-full min-w-0 overflow-visible rounded-xl border border-white/10 bg-zinc-950 md:block">
        <div className="w-full max-w-full min-w-0 overflow-x-auto">
          <table className="w-full min-w-[1460px] table-fixed text-left">
            <colgroup>
              <col style={{ width: "280px" }} />
              <col style={{ width: "140px" }} />
              <col style={{ width: "140px" }} />
              <col style={{ width: "140px" }} />
              <col style={{ width: "180px" }} />
              <col style={{ width: "180px" }} />
              <col style={{ width: "140px" }} />
              <col style={{ width: "260px" }} />
            </colgroup>
            <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-[0.16em] text-zinc-500">
              <tr>
                <th className="px-4 py-4">Lead</th>
                <th className="px-4 py-4">Phone</th>
                <th className="px-4 py-4">Source</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">AI Score</th>
                <th className="min-w-[180px] px-4 py-4">Assigned</th>
                <th className="px-4 py-4">Created</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {leads.map((lead) => (
                <tr className="transition hover:bg-white/[0.03]" key={lead.id}>
                  <td className="min-w-0 px-4 py-4">
                    <Link
                      className="block truncate font-bold text-white hover:text-orange-300"
                      href={`/leads/${lead.id}`}
                    >
                      {lead.full_name}
                    </Link>
                    <p className="mt-1 truncate text-sm text-zinc-500">{lead.email || "No email"}</p>
                  </td>
                  <td className="truncate px-4 py-4 text-zinc-300">{lead.phone || "-"}</td>
                  <td className="truncate px-4 py-4 text-zinc-300">{lead.source || "-"}</td>
                  <td className="px-4 py-4">
                    <span className="inline-block max-w-full truncate rounded-full bg-orange-500/15 px-3 py-1 text-sm font-bold text-orange-300">
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex min-w-0 items-center gap-2 whitespace-nowrap">
                      <LeadScoreBadge
                        score={lead.lead_score}
                        temperature={lead.lead_temperature}
                      />
                    </div>
                  </td>
                  <td className="min-w-[180px] px-4 py-4 text-zinc-400">
                    <span className="block truncate">
                      {lead.assigned_to
                        ? lead.assigned_to === workspaceId
                          ? "Owner"
                          : lead.assigned_to
                        : "Unassigned"}
                    </span>
                  </td>
                  <td className="truncate px-4 py-4 text-zinc-400">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex min-w-0 items-center justify-end gap-2">
                      <div className="w-[112px]">
                        <WhatsAppQuickActions lead={lead} />
                      </div>
                      <Link
                        className="flex h-10 items-center justify-center rounded-[10px] border border-white/10 px-3 text-sm font-bold text-zinc-300 transition hover:border-orange-500/50 hover:text-orange-300"
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

      <section className="mt-6 space-y-4 md:hidden">
        {leads.map((lead) => (
          <article className="rounded-xl border border-white/10 bg-zinc-950 p-4" key={lead.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  className="block truncate text-lg font-black text-white hover:text-orange-300"
                  href={`/leads/${lead.id}`}
                >
                  {lead.full_name}
                </Link>
                <p className="mt-1 truncate text-sm text-zinc-500">{lead.email || "No email"}</p>
              </div>
              <span className="shrink-0 rounded-full bg-orange-500/15 px-3 py-1 text-xs font-bold text-orange-300">
                {lead.status}
              </span>
            </div>

            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold text-zinc-500">Phone</span>
                <span className="truncate text-zinc-300">{lead.phone || "-"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold text-zinc-500">Source</span>
                <span className="truncate text-zinc-300">{lead.source || "-"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold text-zinc-500">AI Score</span>
                <LeadScoreBadge score={lead.lead_score} temperature={lead.lead_temperature} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold text-zinc-500">Assigned</span>
                <span className="truncate text-zinc-300">
                  {lead.assigned_to
                    ? lead.assigned_to === workspaceId
                      ? "Owner"
                      : lead.assigned_to
                    : "Unassigned"}
                </span>
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              <WhatsAppQuickActions lead={lead} />
              <Link
                className="flex h-10 items-center justify-center rounded-[10px] border border-white/10 px-3 text-sm font-bold text-zinc-300 transition hover:border-orange-500/50 hover:text-orange-300"
                href={`/leads/${lead.id}/edit`}
              >
                Edit
              </Link>
              <DeleteLeadModal id={lead.id} name={lead.full_name} />
            </div>
          </article>
        ))}

        {!leads.length && (
          <div className="rounded-xl border border-dashed border-white/10 bg-zinc-950 p-10 text-center">
            <p className="font-bold">No leads found</p>
            <p className="mt-2 text-sm text-zinc-500">Try a different search or create a new lead.</p>
          </div>
        )}
      </section>

      <div className="mt-6 flex w-full max-w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-500">
          Page {currentPage} of {totalPages}
        </p>
        <div className="flex min-w-0 gap-2">
          <Link
            className={`rounded-lg border border-white/10 px-4 py-2 text-sm font-bold ${
              currentPage <= 1 ? "pointer-events-none opacity-40" : "hover:border-orange-500/50"
            }`}
            href={pageHref(currentPage - 1, q, status, temperature, assigned, sort)}
          >
            Previous
          </Link>
          <Link
            className={`rounded-lg border border-white/10 px-4 py-2 text-sm font-bold ${
              currentPage >= totalPages
                ? "pointer-events-none opacity-40"
                : "hover:border-orange-500/50"
            }`}
            href={pageHref(currentPage + 1, q, status, temperature, assigned, sort)}
          >
            Next
          </Link>
        </div>
      </div>
      </div>
    </AppShell>
  );
}
