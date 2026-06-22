import type { Lead } from "@/types/lead";

export const whatsappTemplates = [
  "Hello {name}, thank you for your interest. When would you be available for a quick call?",
  "Hello {name}, just following up regarding your inquiry. Let me know if you have any questions.",
  "Hello {name}, we have prepared pricing information for you. Please let us know if you'd like a demo.",
  "Hello {name}, we would love to schedule a meeting to discuss your requirements.",
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

export function applyWhatsAppTemplate(template: string, lead: Pick<Lead, "full_name">) {
  return template.replaceAll("{name}", lead.full_name);
}
