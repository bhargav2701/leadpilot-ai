"use client";

import Link from "next/link";
import { useActionState } from "react";

type AuthFormProps = {
  action: (state: { message: string }, formData: FormData) => Promise<{ message: string }>;
  buttonLabel: string;
  description: string;
  footer: React.ReactNode;
  mode: "login" | "signup" | "forgot";
  title: string;
};

const initialState = {
  message: "",
};

export function AuthForm({
  action,
  buttonLabel,
  description,
  footer,
  mode,
  title,
}: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.24),_transparent_32%),#050505] px-6 py-12 text-white">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950/90 p-8 shadow-2xl shadow-black/40">
        <Link href="/" className="mb-8 inline-flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 text-lg font-black text-black">
            LP
          </span>
          <span className="text-lg font-bold">LeadPilot AI</span>
        </Link>

        <h1 className="text-3xl font-black tracking-tight">{title}</h1>
        <p className="mt-3 leading-7 text-zinc-400">{description}</p>

        <form action={formAction} className="mt-8 space-y-5">
          <input
            name="origin"
            type="hidden"
            value={typeof window === "undefined" ? "" : window.location.origin}
          />
          <div>
            <label className="text-sm font-semibold text-zinc-200" htmlFor="email">
              Email
            </label>
            <input
              autoComplete="email"
              className="mt-2 w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500"
              id="email"
              name="email"
              placeholder="you@company.com"
              required
              type="email"
            />
          </div>

          {mode !== "forgot" && (
            <div>
              <label className="text-sm font-semibold text-zinc-200" htmlFor="password">
                Password
              </label>
              <input
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="mt-2 w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500"
                id="password"
                minLength={6}
                name="password"
                placeholder="••••••••"
                required
                type="password"
              />
            </div>
          )}

          {state.message && (
            <p className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-sm text-orange-200">
              {state.message}
            </p>
          )}

          <button
            className="w-full rounded-lg bg-orange-500 px-5 py-3 text-sm font-black text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pending}
            type="submit"
          >
            {pending ? "Please wait..." : buttonLabel}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-zinc-400">{footer}</div>
      </section>
    </main>
  );
}
