import type { Lead } from "@/types/lead";

export type EmailTemplateKey =
  | "follow-up"
  | "schedule-demo"
  | "send-pricing"
  | "meeting-request"
  | "re-engage-lead";

export type EmailTemplate = {
  description: string;
  key: EmailTemplateKey;
  label: string;
};

export type EmailLeadContext = Pick<Lead, "email" | "full_name" | "source" | "status">;

export const emailTemplates: EmailTemplate[] = [
  {
    description: "Send a friendly follow-up for an existing inquiry.",
    key: "follow-up",
    label: "Follow Up",
  },
  {
    description: "Invite the lead to a quick demo.",
    key: "schedule-demo",
    label: "Schedule Demo",
  },
  {
    description: "Share pricing context and offer help.",
    key: "send-pricing",
    label: "Send Pricing",
  },
  {
    description: "Ask for a suitable meeting time.",
    key: "meeting-request",
    label: "Meeting Request",
  },
  {
    description: "Restart a quiet conversation.",
    key: "re-engage-lead",
    label: "Re-engage Lead",
  },
];

export function getEmailTemplate(key: EmailTemplateKey) {
  return emailTemplates.find((template) => template.key === key) ?? emailTemplates[0];
}

export function generateEmailTemplate(key: EmailTemplateKey, lead: EmailLeadContext) {
  const source = lead.source?.trim() || "your inquiry";
  const context = `\n\nLead context: ${lead.status} lead from ${source}.`;

  if (key === "schedule-demo") {
    return {
      body: `Hello ${lead.full_name},

Thank you for your interest.

Would you be available for a quick demo this week?

Regards,
LeadPilot AI${context}`,
      subject: "Quick demo for LeadPilot AI",
    };
  }

  if (key === "send-pricing") {
    return {
      body: `Hello ${lead.full_name},

Thank you for your interest.

I am sharing pricing information and would be happy to answer any questions.

Regards,
LeadPilot AI${context}`,
      subject: "LeadPilot AI pricing information",
    };
  }

  if (key === "meeting-request") {
    return {
      body: `Hello ${lead.full_name},

We would love to schedule a short meeting to discuss your requirements.

Please let us know a suitable time.

Regards,
LeadPilot AI${context}`,
      subject: "Meeting request from LeadPilot AI",
    };
  }

  if (key === "re-engage-lead") {
    return {
      body: `Hello ${lead.full_name},

We noticed we have not connected recently.

If you are still interested, we would be happy to continue the discussion.

Regards,
LeadPilot AI${context}`,
      subject: "Still interested in LeadPilot AI?",
    };
  }

  return {
    body: `Hello ${lead.full_name},

Just following up regarding your inquiry.

Please let me know if you have any questions.

Regards,
LeadPilot AI${context}`,
    subject: "Following up on your inquiry",
  };
}
