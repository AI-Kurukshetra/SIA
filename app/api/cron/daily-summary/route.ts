import { NextResponse } from "next/server";

import { isServiceRoleConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  if (!isServiceRoleConfigured) {
    return NextResponse.json({ ok: true, mode: "noop" });
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const [{ count: serverCount }, { count: recentScanCount }] = await Promise.all([
    supabase.from("servers").select("*", { count: "exact", head: true }),
    supabase
      .from("scans")
      .select("*", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
  ]);

  return NextResponse.json({
    ok: true,
    serverCount: serverCount ?? 0,
    recentScanCount: recentScanCount ?? 0
  });
}
