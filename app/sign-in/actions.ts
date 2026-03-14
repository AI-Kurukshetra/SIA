"use server";

import { redirect } from "next/navigation";

import { appUrl, isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface AuthActionState {
  error?: string;
  success?: string;
}

export async function requestMagicLink(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { error: "Email is required." };
  }

  if (!isSupabaseConfigured) {
    return {
      success:
        "Supabase is not configured yet. Dashboard routes will open in demo mode until you add the environment variables."
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { error: "Supabase client is unavailable." };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback?next=/dashboard`
    }
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Check your email for the sign-in link." };
}

export async function continueToDemo() {
  redirect("/dashboard");
}
