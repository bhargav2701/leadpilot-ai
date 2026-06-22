"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { updateSubscriptionPlan } from "@/lib/billing/subscription";
import { requireUser } from "@/lib/auth/require-user";
import type { PlanName } from "@/types/subscription";

const upgradePlans: PlanName[] = ["Starter", "Pro"];

export async function upgradeSubscription(formData: FormData) {
  const planName = formData.get("plan_name");

  if (typeof planName !== "string" || !upgradePlans.includes(planName as PlanName)) {
    redirect("/billing?error=Invalid%20plan%20selected.");
  }

  const { supabase, user } = await requireUser();
  const { error } = await updateSubscriptionPlan(supabase, user.id, planName as PlanName);

  if (error) {
    redirect(`/billing?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/billing");
  revalidatePath("/dashboard");
  revalidatePath("/settings");
  revalidatePath("/leads");
  redirect(`/billing?success=${encodeURIComponent(`Upgraded to ${planName}.`)}`);
}
