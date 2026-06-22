import { NextResponse } from "next/server";
import { processDueEmailReminders } from "@/lib/email/send";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await processDueEmailReminders(supabase, user.id);

  return NextResponse.json(result);
}
