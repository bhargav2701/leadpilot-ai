import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth/require-user";
import { leadStatuses } from "@/types/lead";

export default async function AnalyticsPage() {
  const { supabase, user } = await requireUser();
  const statusCounts = await Promise.all(
    leadStatuses.map(async (status) => {
      const { count } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", status);

      return { status, count: count ?? 0 };
    }),
  );

  return (
    <AppShell active="analytics" userEmail={user.email}>
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-400">Analytics</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Lead analytics</h1>
      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {statusCounts.map((item) => (
          <article className="rounded-xl border border-white/10 bg-zinc-950 p-6" key={item.status}>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">
              {item.status}
            </p>
            <p className="mt-4 text-4xl font-black text-orange-500">{item.count}</p>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
