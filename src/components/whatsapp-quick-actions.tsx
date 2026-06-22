"use client";

import { useMemo, useState } from "react";
import {
  generateWhatsAppTemplateMessage,
  getWhatsAppTemplate,
  type WhatsAppTemplateKey,
} from "@/lib/whatsapp";
import type { Lead } from "@/types/lead";
import { WhatsAppButton } from "./whatsapp-button";

const quickTemplates: WhatsAppTemplateKey[] = ["follow-up", "schedule-demo", "send-pricing"];

type WhatsAppQuickActionsProps = {
  lead: Pick<Lead, "full_name" | "id" | "lead_temperature" | "phone" | "source" | "status">;
};

export function WhatsAppQuickActions({ lead }: WhatsAppQuickActionsProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplateKey>("follow-up");
  const template = getWhatsAppTemplate(selectedTemplate);
  const message = useMemo(
    () => generateWhatsAppTemplateMessage(selectedTemplate, lead),
    [lead, selectedTemplate],
  );

  return (
    <div className="flex flex-col gap-2">
      <select
        className="w-full rounded-lg border border-white/10 bg-black px-2.5 py-2 text-xs font-bold text-white outline-none transition focus:border-orange-500"
        onChange={(event) => setSelectedTemplate(event.target.value as WhatsAppTemplateKey)}
        onClick={(event) => event.stopPropagation()}
        value={selectedTemplate}
      >
        {quickTemplates.map((templateKey) => {
          const option = getWhatsAppTemplate(templateKey);
          return (
            <option key={option.key} value={option.key}>
              {option.shortLabel}
            </option>
          );
        })}
      </select>
      <WhatsAppButton
        className="rounded-lg bg-[#25D366] px-2.5 py-2 text-xs font-black text-black transition hover:bg-[#1ebe5d] disabled:cursor-not-allowed disabled:opacity-50"
        label="Send"
        leadId={lead.id}
        message={message}
        phone={lead.phone}
        templateName={template.label}
      />
    </div>
  );
}
