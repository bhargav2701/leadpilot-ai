import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { leadStatuses, type LeadStatus } from "@/types/lead";

type ImportLeadPayload = {
  email: string | null;
  full_name: string;
  notes: string | null;
  phone: string | null;
  source: string | null;
  status: LeadStatus;
};

const batchSize = 500;

function isImportLeadPayload(value: unknown): value is ImportLeadPayload {
  const lead = value as ImportLeadPayload;

  return (
    typeof lead?.full_name === "string" &&
    lead.full_name.trim().length > 0 &&
    leadStatuses.includes(lead.status)
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as { leads?: unknown[] };
  const { data: membershipData } = await supabase
    .from("team_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1);
  const workspaceId = membershipData?.[0]?.workspace_id ?? user.id;
  const validLeads = Array.isArray(payload.leads)
    ? payload.leads.filter(isImportLeadPayload).slice(0, 10000)
    : [];

  if (!validLeads.length) {
    return NextResponse.json({ error: "No valid leads to import." }, { status: 400 });
  }

  let imported = 0;
  let failed = 0;
  const createdAt = new Date().toISOString();

  for (let index = 0; index < validLeads.length; index += batchSize) {
    const batch = validLeads.slice(index, index + batchSize).map((lead) => ({
      created_at: createdAt,
      email: lead.email || null,
      full_name: lead.full_name.trim(),
      notes: lead.notes || null,
      phone: lead.phone || null,
      source: lead.source || null,
      status: lead.status,
      user_id: workspaceId,
    }));

    const { error } = await supabase.from("leads").insert(batch);

    if (error) {
      failed += batch.length;
    } else {
      imported += batch.length;
    }
  }

  if (imported > 0) {
    await supabase.from("activity_logs").insert({
      activity_type: "CSV Import",
      description: `Imported ${imported} lead${imported === 1 ? "" : "s"} from CSV.`,
      lead_id: null,
      user_id: workspaceId,
    });
  }

  return NextResponse.json({ failed, imported });
}
