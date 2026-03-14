import { redirect } from "next/navigation";

import { demoUser } from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SessionUser } from "@/lib/types";

export async function getSessionUser(): Promise<SessionUser | null> {
  if (!isSupabaseConfigured) {
    return demoUser;
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("team_id, full_name, teams(name)")
    .eq("id", user.id)
    .single();

  const joinedTeam = Array.isArray(profile?.teams) ? profile?.teams[0] : profile?.teams;

  return {
    id: user.id,
    email: user.email ?? "unknown@sia.io",
    name:
      profile?.full_name ??
      user.user_metadata.full_name ??
      user.email?.split("@")[0]?.replace(/[._-]/g, " ") ??
      "Operator",
    teamName: joinedTeam?.name ?? user.user_metadata.team_name ?? "SIA Workspace",
    teamId: profile?.team_id,
    isDemo: false
  };
}

export async function requireSessionUser() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/sign-in");
  }

  return user;
}
