import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Notification } from "@/components/notification";
import { requireWorkspace } from "@/lib/auth/workspace";
import { reminderTypes, type ReminderWithLead } from "@/types/reminder";
import { completeReminder } from "./actions";

type RemindersPageProps = {
  searchParams: Promise<{
    error?: string;
    filter?: string;
    success?: string;
    type?: string;
  }>;
};

type ReminderGroup = "overdue" | "today" | "upcoming" | "completed";
type ReminderFilter = ReminderGroup | "all";

const groupLabels: Record<ReminderGroup, string> = {
  completed: "Completed",
  overdue: "Overdue",
  today: "Due Today",
  upcoming: "Upcoming",
};

function getLeadName(reminder: ReminderWithLead) {
  const lead = Array.isArray(reminder.leads) ? reminder.leads[0] : reminder.leads;
  return lead?.full_name ?? "Lead";
}

function getReminderGroup(reminder: ReminderWithLead, now: Date): ReminderGroup {
  if (reminder.completed) {
    return "completed";
  }

  const reminderDate = new Date(reminder.reminder_date);
  const startOfTomorrow = new Date(now);
  startOfTomorrow.setHours(0, 0, 0, 0);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  if (reminderDate.getTime() < now.getTime()) {
    return "overdue";
  }

  if (reminderDate.getTime() < startOfTomorrow.getTime()) {
    return "today";
  }

  return "upcoming";
}

function filterHref(filter: string, type?: string) {
  const params = new URLSearchParams();

  if (filter !== "all") {
    params.set("filter", filter);
  }

  if (type && type !== "all") {
    params.set("type", type);
  }

  const query = params.toString();
  return query ? `/reminders?${query}` : "/reminders";
}

function ReminderCard({ reminder }: { reminder: ReminderWithLead }) {
  const group = getReminderGroup(reminder, new Date());

  return (
    <article className="rounded-lg border border-white/10 bg-black p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              className="text-lg font-black text-white transition hover:text-orange-300"
              href={`/leads/${reminder.lead_id}`}
            >
              {reminder.title}
            </Link>
            <span className="rounded-full bg-orange-500/15 px-3 py-1 text-xs font-bold text-orange-300">
              {reminder.reminder_type}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                group === "completed"
                  ? "bg-emerald-500/15 text-emerald-300"
                  : group === "overdue"
                    ? "bg-red-500/15 text-red-300"
                    : group === "today"
                      ? "bg-orange-500/15 text-orange-300"
                      : "bg-zinc-800 text-zinc-300"
              }`}
            >
              {groupLabels[group]}
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold text-zinc-500">
            {getLeadName(reminder)} • {new Date(reminder.reminder_date).toLocaleString()}
          </p>
        </div>
        {!reminder.completed && (
          <form action={completeReminder}>
            <input name="id" type="hidden" value={reminder.id} />
            <input name="return_path" type="hidden" value="/reminders" />
            <button
              className="rounded-lg border border-white/10 px-4 py-2 text-sm font-bold text-zinc-300 transition hover:border-orange-500/50 hover:text-orange-300"
              type="submit"
            >
              Mark Complete
            </button>
          </form>
        )}
      </div>
    </article>
  );
}

export default async function RemindersPage({ searchParams }: RemindersPageProps) {
  const queryParams = await searchParams;
  const { supabase, user, workspaceId } = await requireWorkspace();
  const activeFilter: ReminderFilter = ["overdue", "today", "upcoming", "completed"].includes(
    queryParams.filter ?? "",
  )
    ? (queryParams.filter as ReminderGroup)
    : "all";
  const activeType = reminderTypes.includes(queryParams.type as (typeof reminderTypes)[number])
    ? queryParams.type
    : "all";
  const { data } = await supabase
    .from("reminders")
    .select("*, leads(full_name)")
    .eq("user_id", workspaceId)
    .order("completed", { ascending: true })
    .order("reminder_date", { ascending: true });

  const now = new Date();
  const reminders = ((data ?? []) as ReminderWithLead[]).filter((reminder) =>
    activeType === "all" ? true : reminder.reminder_type === activeType,
  );
  const groups = reminders.reduce<Record<ReminderGroup, ReminderWithLead[]>>(
    (result, reminder) => {
      result[getReminderGroup(reminder, now)].push(reminder);
      return result;
    },
    { completed: [], overdue: [], today: [], upcoming: [] },
  );
  const visibleGroups: ReminderGroup[] =
    activeFilter === "all"
      ? ["overdue", "today", "upcoming", "completed"]
      : [activeFilter as ReminderGroup];
  const filterItems = [
    { key: "all", label: "All", value: reminders.length },
    { key: "overdue", label: "Overdue", value: groups.overdue.length },
    { key: "today", label: "Due Today", value: groups.today.length },
    { key: "upcoming", label: "Upcoming", value: groups.upcoming.length },
    { key: "completed", label: "Completed", value: groups.completed.length },
  ];
  const typeFilterItems = ["all", ...reminderTypes];

  return (
    <AppShell active="reminders" userEmail={user.email}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-400">
            Reminders
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            Follow-up command queue
          </h1>
          <p className="mt-4 max-w-2xl leading-8 text-zinc-400">
            Track overdue, due today, upcoming, and completed lead reminders.
          </p>
        </div>
        <Link
          className="rounded-lg bg-orange-500 px-5 py-3 text-center text-sm font-black text-black transition hover:bg-orange-400"
          href="/leads"
        >
          Choose Lead
        </Link>
      </div>

      <Notification error={queryParams.error} success={queryParams.success} />

      <section className="mt-8 rounded-xl border border-white/10 bg-zinc-950 p-5">
        <div className="flex flex-wrap gap-2">
          {filterItems.map((item) => (
            <Link
              className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                activeFilter === item.key
                  ? "bg-orange-500 text-black"
                  : "border border-white/10 text-zinc-300 hover:border-orange-500/50 hover:text-orange-300"
              }`}
              href={filterHref(item.key, activeType)}
              key={item.key}
            >
              {item.label} {item.value}
            </Link>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {typeFilterItems.map((type) => (
            <Link
              className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                activeType === type
                  ? "bg-orange-500/20 text-orange-300"
                  : "border border-white/10 text-zinc-500 hover:border-orange-500/50 hover:text-orange-300"
              }`}
              href={filterHref(activeFilter, type)}
              key={type}
            >
              {type === "all" ? "All Types" : type}
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-6 space-y-6">
        {visibleGroups.map((group) => (
          <section className="rounded-xl border border-white/10 bg-zinc-950 p-6" key={group}>
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-black">{groupLabels[group]}</h2>
              <span className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-sm font-bold text-orange-300">
                {groups[group].length}
              </span>
            </div>
            <div className="mt-5 space-y-3">
              {groups[group].length ? (
                groups[group].map((reminder) => (
                  <ReminderCard key={reminder.id} reminder={reminder} />
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-white/10 bg-black p-8 text-center">
                  <p className="font-bold">No {groupLabels[group].toLowerCase()} reminders</p>
                  <p className="mt-2 text-sm text-zinc-500">
                    Create reminders from a lead details page.
                  </p>
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
