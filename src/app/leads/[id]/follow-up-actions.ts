"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireWorkspace } from "@/lib/auth/workspace";
import { followUpTones, type FollowUpTone } from "@/types/follow-up";
import type { Lead } from "@/types/lead";

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getTone(formData: FormData): FollowUpTone {
  const tone = getValue(formData, "tone") as FollowUpTone;
  return followUpTones.includes(tone) ? tone : "Professional";
}

function encodedMessage(message: string) {
  return encodeURIComponent(message);
}

function fallbackMessage(lead: Lead, tone: FollowUpTone) {
  const firstName = lead.full_name.split(" ")[0] || lead.full_name;
  const context = lead.notes ? `I was reviewing your notes: ${lead.notes}` : "I wanted to follow up";

  return `Email Follow-Up
Subject: Quick follow-up, ${firstName}

Hi ${firstName},

${context}. Based on your interest from ${lead.source || "our previous conversation"}, I wanted to see if now is a good time to continue the discussion.

LeadPilot AI can help you respond faster, prioritize high-intent opportunities, and recover leads before they go cold.

Would you be open to a quick next step this week?

Best,
LeadPilot AI

WhatsApp Follow-Up
Hi ${firstName}, quick follow-up from LeadPilot AI. I noticed your lead status is ${lead.status}. Would you like help moving this forward today?

Tone: ${tone}`;
}

async function generateWithOpenAI(lead: Lead, tone: FollowUpTone) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return fallbackMessage(lead, tone);
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    body: JSON.stringify({
      input: [
        {
          content:
            "Generate two concise follow-up messages for a SaaS sales team. Return plain text only with exactly two sections: Email Follow-Up and WhatsApp Follow-Up.",
          role: "system",
        },
        {
          content: `Lead Name: ${lead.full_name}
Lead Source: ${lead.source || "Unknown"}
Lead Status: ${lead.status}
Notes: ${lead.notes || "No notes"}
Tone: ${tone}`,
          role: "user",
        },
      ],
      max_output_tokens: 550,
      model: process.env.OPENAI_MODEL || "gpt-5.4-mini",
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    return fallbackMessage(lead, tone);
  }

  const payload = (await response.json()) as { output_text?: string };
  return payload.output_text?.trim() || fallbackMessage(lead, tone);
}

export async function generateFollowUp(formData: FormData) {
  const leadId = getValue(formData, "lead_id");
  const tone = getTone(formData);
  const { supabase, user, workspaceId } = await requireWorkspace();

  const { data: leadData } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .eq("user_id", workspaceId)
    .single();

  if (!leadData) {
    redirect(`/leads/${leadId}?error=${encodedMessage("Lead not found.")}`);
  }

  const lead = leadData as Lead;
  const generatedMessage = await generateWithOpenAI(lead, tone);
  const { error } = await supabase.from("follow_ups").insert({
    generated_message: generatedMessage,
    lead_id: lead.id,
    tone,
    user_id: user.id,
  });

  if (error) {
    redirect(`/leads/${leadId}?error=${encodedMessage(error.message)}`);
  }

  await supabase.from("activity_logs").insert({
    activity_type: "Follow-Up Generated",
    description: `Generated a ${tone.toLowerCase()} follow-up for ${lead.full_name}.`,
    lead_id: lead.id,
    user_id: workspaceId,
  });

  revalidatePath("/dashboard");
  revalidatePath("/analytics");
  revalidatePath(`/leads/${leadId}`);
  redirect(`/leads/${leadId}?success=${encodedMessage("Follow-up generated successfully.")}`);
}
