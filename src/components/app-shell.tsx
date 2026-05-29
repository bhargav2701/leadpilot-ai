import Link from "next/link";
import { logOut } from "@/app/auth/actions";

type AppShellProps = {
  active: "dashboard" | "leads" | "import" | "analytics" | "settings";
  children: React.ReactNode;
  userEmail?: string | null;
};

const navItems = [
  { label: "Dashboard", href: "/dashboard", key: "dashboard" },
  { label: "Leads", href: "/leads", key: "leads" },
  { label: "Import Leads", href: "/import", key: "import" },
  { label: "Analytics", href: "/analytics", key: "analytics" },
  { label: "Settings", href: "/settings", key: "settings" },
] as const;

export function AppShell({ active, children, userEmail }: AppShellProps) {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="border-b border-white/10 bg-zinc-950 lg:fixed lg:inset-y-0 lg:left-0 lg:w-72 lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col px-5 py-5">
            <Link className="flex items-center gap-3" href="/dashboard">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-orange-500 text-lg font-black text-black">
                LP
              </span>
              <span>
                <span className="block text-lg font-black">LeadPilot AI</span>
                <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Control Center
                </span>
              </span>
            </Link>

            <nav className="mt-8 grid grid-cols-2 gap-2 lg:flex lg:flex-col">
              {navItems.map((item) => (
                <Link
                  className={`rounded-lg px-4 py-3 text-sm font-bold transition ${
                    active === item.key
                      ? "bg-orange-500 text-black"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  }`}
                  href={item.href}
                  key={item.key}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-6 rounded-xl border border-white/10 bg-black p-4 lg:mt-auto">
              <p className="truncate text-sm font-semibold text-white">{userEmail}</p>
              <p className="mt-1 text-xs text-zinc-500">Authenticated workspace</p>
              <form action={logOut} className="mt-4">
                <button
                  className="w-full rounded-lg border border-orange-500/40 px-4 py-2 text-sm font-bold text-orange-400 transition hover:border-orange-500 hover:bg-orange-500 hover:text-black"
                  type="submit"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </aside>

        <section className="flex-1 lg:pl-72">
          <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">{children}</div>
        </section>
      </div>
    </main>
  );
}
