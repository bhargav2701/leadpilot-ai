import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth/require-user";

export default async function SettingsPage() {
  const { user } = await requireUser();

  return (
    <AppShell active="settings" userEmail={user.email}>
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-400">Settings</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Workspace settings</h1>
      <section className="mt-8 rounded-xl border border-white/10 bg-zinc-950 p-6">
        <h2 className="text-2xl font-black">Account</h2>
        <div className="mt-5 rounded-lg border border-white/10 bg-black p-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Email</p>
          <p className="mt-2 font-semibold text-white">{user.email}</p>
        </div>
      </section>
    </AppShell>
  );
}
