"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createWritableClient } from "@/lib/supabase/server";

type AuthState = {
  message: string;
};

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function signUp(_state: AuthState, formData: FormData): Promise<AuthState> {
  const email = getFormValue(formData, "email");
  const password = getFormValue(formData, "password");
  const supabase = await createWritableClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${getFormValue(formData, "origin")}/auth/callback`,
    },
  });

  if (error) {
    return { message: error.message };
  }

  return { message: "Check your email to confirm your account." };
}

export async function logIn(_state: AuthState, formData: FormData): Promise<AuthState> {
  const email = getFormValue(formData, "email");
  const password = getFormValue(formData, "password");
  const supabase = await createWritableClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { message: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function forgotPassword(
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = getFormValue(formData, "email");
  const origin = getFormValue(formData, "origin");
  const supabase = await createWritableClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/dashboard`,
  });

  if (error) {
    return { message: error.message };
  }

  return { message: "Password reset instructions sent." };
}

export async function logOut() {
  const supabase = await createWritableClient();

  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/login");
}
