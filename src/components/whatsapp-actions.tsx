"use client";

import { useMemo, useState } from "react";
import { applyWhatsAppTemplate, whatsappTemplates } from "@/lib/whatsapp";
import type { Lead } from "@/types/lead";
import { WhatsAppButton } from "./whatsapp-button";

type WhatsAppActionsProps = {
  lead: Pick<Lead, "full_name" | "id" | "phone">;
};

export function WhatsAppActions({ lead }: WhatsAppActionsProps) {
  const [selectedTemplate, setSelectedTemplate] = useState(whatsappTemplates[0]);
  const message = useMemo(
    () => applyWhatsAppTemplate(selectedTemplate, lead),
    [lead, selectedTemplate],
  );

  return (
    <section className="mt-5 rounded-xl border border-white/10 bg-zinc-950 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-400">
            WhatsApp Actions
          </p>
          <h2 className="mt-2 text-2xl font-black">Message lead</h2>
          <p className="mt-2 text-sm font-semibold text-zinc-500">
            Quick chat and message templates for WhatsApp follow-up.
          </p>
        </div>
        <WhatsAppButton leadId={lead.id} phone={lead.phone} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
        <label className="block">
          <span className="text-sm font-semibold text-zinc-300">Quick Message Templates</span>
          <select
            className="mt-2 w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none transition focus:border-orange-500"
            onChange={(event) => setSelectedTemplate(event.target.value)}
            value={selectedTemplate}
          >
            {whatsappTemplates.map((template, index) => (
              <option key={template} value={template}>
                Template {index + 1}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <WhatsAppButton
            className="w-full rounded-lg bg-[#25D366] px-5 py-3 text-sm font-black text-black transition hover:bg-[#1ebe5d] disabled:cursor-not-allowed disabled:opacity-50 lg:w-auto"
            label="Send Template"
            leadId={lead.id}
            message={message}
            phone={lead.phone}
          />
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-white/10 bg-black p-4">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
          Selected Message
        </p>
        <p className="mt-2 leading-7 text-zinc-300">{message}</p>
      </div>
    </section>
  );
}
