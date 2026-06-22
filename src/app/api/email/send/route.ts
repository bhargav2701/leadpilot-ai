import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { generateEmailTemplate, type EmailTemplateKey } from "@/lib/email/templates";
import { sendLeadEmail } from "@/lib/email/send";
import { createClient } from "@/lib/supabase/server";
import type { Lead } from "@/types/lead";

type SendEmailPayload = {
  body?: string;
  leadId?: string;
  subject?: string;
  templateKey?: EmailTemplateKey;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as SendEmailPayload;

  if (!payload.leadId) {
    return NextResponse.json({ error: "Lead is required." }, { status: 400 });
  }

  const { data: leadData } = await supabase
    .from("leads")
    .select("*")
    .eq("id", payload.leadId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!leadData) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  const lead = leadData as Lead;
  const fallback = generateEmailTemplate(payload.templateKey ?? "follow-up", lead);
  const subject = payload.subject?.trim() || fallback.subject;
  const body = payload.body?.trim() || fallback.body;

  const result = await sendLeadEmail({
    body,
    lead,
    subject,
    supabase,
    userId: user.id,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  revalidatePath("/dashboard");
  revalidatePath("/reminders");
  revalidatePath(`/leads/${lead.id}`);

  return NextResponse.json({ ok: true });
}
