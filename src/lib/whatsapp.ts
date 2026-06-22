import type { Lead } from "@/types/lead";

export type WhatsAppTemplateKey =
  | "follow-up"
  | "schedule-demo"
  | "send-pricing"
  | "meeting-request"
  | "re-engage-lead";

export type WhatsAppTemplate = {
  description: string;
  icon: string;
  key: WhatsAppTemplateKey;
  label: string;
  shortLabel: string;
};

export type WhatsAppLeadContext = Pick<
  Lead,
  "full_name" | "lead_temperature" | "source" | "status"
>;

export const whatsappTemplates: WhatsAppTemplate[] = [
  {
    description: "Send a polite follow-up for an active inquiry.",
    icon: "->",
    key: "follow-up",
    label: "Follow Up",
    shortLabel: "Follow Up",
  },
  {
    description: "Invite a high-intent lead to a quick product demo.",
    icon: ">",
    key: "schedule-demo",
    label: "Schedule Demo",
    shortLabel: "Demo",
  },
  {
    description: "Share pricing context and offer to answer questions.",
    icon: "$",
    key: "send-pricing",
    label: "Send Pricing",
    shortLabel: "Pricing",
  },
  {
    description: "Ask for a suitable time to discuss requirements.",
    icon: "T",
    key: "meeting-request",
    label: "Meeting Request",
    shortLabel: "Meeting",
  },
  {
    description: "Restart the conversation with a cold or quiet lead.",
    icon: "R",
    key: "re-engage-lead",
    label: "Re-engage Lead",
    shortLabel: "Re-engage",
  },
];

export function formatWhatsAppPhone(phone: string | null | undefined) {
  const digits = phone?.replace(/\D/g, "") ?? "";

  if (digits.length === 10) {
    return `91${digits}`;
  }

  return digits;
}

export function hasValidWhatsAppPhone(phone: string | null | undefined) {
  return formatWhatsAppPhone(phone).length >= 10;
}

export function buildWhatsAppUrl(phone: string | null | undefined, message?: string) {
  const formattedPhone = formatWhatsAppPhone(phone);
  const params = message ? `?text=${encodeURIComponent(message)}` : "";

  return `https://wa.me/${formattedPhone}${params}`;
}

export function getWhatsAppTemplate(key: WhatsAppTemplateKey) {
  return whatsappTemplates.find((template) => template.key === key) ?? whatsappTemplates[0];
}

export function getRecommendedWhatsAppTemplate(lead: Pick<Lead, "lead_temperature">) {
  if (lead.lead_temperature === "Hot") return "schedule-demo";
  if (lead.lead_temperature === "Cold") return "re-engage-lead";
  return "follow-up";
}

export function generateWhatsAppTemplateMessage(
  templateKey: WhatsAppTemplateKey,
  lead: WhatsAppLeadContext,
) {
  const source = lead.source?.trim() || "your inquiry";
  const context = `\n\nContext: ${lead.status} lead from ${source}. Temperature: ${lead.lead_temperature}.`;

  if (templateKey === "schedule-demo") {
    return `Hello ${lead.full_name},

Thank you for your interest.

Would you be available for a quick demo this week?

Regards,
LeadPilot AI${context}`;
  }

  if (templateKey === "send-pricing") {
    return `Hello ${lead.full_name},

Thank you for your interest.

I am sharing pricing information and would be happy to answer any questions.

Regards,
LeadPilot AI${context}`;
  }

  if (templateKey === "meeting-request") {
    return `Hello ${lead.full_name},

We would love to schedule a short meeting to discuss your requirements.

Please let us know a suitable time.

Regards,
LeadPilot AI${context}`;
  }

  if (templateKey === "re-engage-lead") {
    return `Hello ${lead.full_name},

We noticed we have not connected recently.

If you are still interested, we would be happy to continue the discussion.

Regards,
LeadPilot AI${context}`;
  }

  return `Hello ${lead.full_name},

Just following up regarding your inquiry.

Please let me know if you have any questions.

Regards,
LeadPilot AI${context}`;
}
