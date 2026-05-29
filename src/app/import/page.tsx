import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth/require-user";
import { ImportLeadsClient } from "./import-leads-client";

export default async function ImportPage() {
  const { user } = await requireUser();

  return (
    <AppShell active="import" userEmail={user.email}>
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-400">
          Import Leads
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
          CSV lead import
        </h1>
        <p className="mt-4 max-w-2xl leading-8 text-zinc-400">
          Upload up to 10,000 leads with validation, preview, batch import, and automatic AI scoring.
        </p>
      </div>

      <ImportLeadsClient />
    </AppShell>
  );
}
