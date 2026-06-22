"use client";

import { useMemo, useState } from "react";
import {
  generateWhatsAppTemplateMessage,
  getRecommendedWhatsAppTemplate,
  getWhatsAppTemplate,
  whatsappTemplates,
  type WhatsAppTemplateKey,
} from "@/lib/whatsapp";
import type { Lead } from "@/types/lead";
import { WhatsAppButton } from "./whatsapp-button";

type WhatsAppTemplatesCardProps = {
  lead: Pick<Lead, "full_name" | "id" | "lead_temperature" | "phone" | "source" | "status">;
};

export function WhatsAppTemplatesCard({ lead }: WhatsAppTemplatesCardProps) {
  const recommendedTemplate = getRecommendedWhatsAppTemplate(lead);
  const [selectedTemplate, setSelectedTemplate] =
    useState<WhatsAppTemplateKey>(recommendedTemplate);
  const [copied, setCopied] = useState(false);
  const template = getWhatsAppTemplate(selectedTemplate);
  const message = useMemo(
    () => generateWhatsAppTemplateMessage(selectedTemplate, lead),
    [lead, selectedTemplate],
  );

  async function copyMessage() {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  }

  return (
    <section className="mt-5 rounded-xl border border-white/10 bg-zinc-950 p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-400">
            WhatsApp Templates
          </p>
          <h2 className="mt-2 text-2xl font-black">AI-powered quick sends</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-lg border border-white/10 px-4 py-2 text-sm font-bold text-zinc-300 transition hover:border-orange-500/50 hover:text-orange-300"
            onClick={copyMessage}
            type="button"
          >
            Copy Message
          </button>
          <WhatsAppButton
            className="rounded-lg bg-[#25D366] px-4 py-2 text-sm font-black text-black transition hover:bg-[#1ebe5d]"
            label={`Send ${template.shortLabel}`}
            leadId={lead.id}
            message={message}
            phone={lead.phone}
            templateName={template.label}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {whatsappTemplates.map((templateOption) => {
          const isSelected = selectedTemplate === templateOption.key;
          const isRecommended = recommendedTemplate === templateOption.key;

          return (
            <button
              className={`rounded-lg border p-4 text-left transition ${
                isSelected
                  ? "border-orange-500 bg-orange-500/10"
                  : "border-white/10 bg-black hover:border-orange-500/50"
              }`}
              key={templateOption.key}
              onClick={() => setSelectedTemplate(templateOption.key)}
              type="button"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-black text-white">{templateOption.label}</span>
                {isRecommended && (
                  <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-black">
                    Recommended
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-5 rounded-lg border border-white/10 bg-black p-4">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
          Generated Message
        </p>
        <pre className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-300">{message}</pre>
      </div>

      {copied && (
        <div
          className="fixed bottom-5 right-5 z-[80] rounded-lg border border-[#25D366]/40 bg-[#25D366] px-4 py-3 text-sm font-black text-black shadow-2xl"
          role="status"
        >
          Message copied.
        </div>
      )}
    </section>
  );
}
