"use client";

import type { Lead } from "@/types/lead";
import { WhatsAppButton } from "./whatsapp-button";

type WhatsAppActionsProps = {
  lead: Pick<Lead, "full_name" | "id" | "lead_temperature" | "phone" | "source" | "status">;
};

export function WhatsAppActions({ lead }: WhatsAppActionsProps) {
  return (
    <section className="mt-5 rounded-xl border border-white/10 bg-zinc-950 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-400">
            WhatsApp Actions
          </p>
          <h2 className="mt-2 text-2xl font-black">Message lead</h2>
          <p className="mt-2 text-sm font-semibold text-zinc-500">
            Open a direct WhatsApp chat with this lead.
          </p>
        </div>
        <WhatsAppButton leadId={lead.id} phone={lead.phone} />
      </div>
    </section>
  );
}
