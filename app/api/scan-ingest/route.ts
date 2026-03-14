import { NextResponse } from "next/server";

import { generateReport } from "@/lib/ai/generate-report";
import { env, isServiceRoleConfigured } from "@/lib/env";
import {
  calculateRiskScore,
  parseScanIngestPayload,
  type ScanIngestPayloadInput
} from "@/lib/scan-ingest";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensurePlatformTeam } from "@/lib/data";

export async function POST(request: Request) {
  if (!env.SCAN_INGEST_TOKEN) {
    return NextResponse.json(
      { error: "SCAN_INGEST_TOKEN is not configured." },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${env.SCAN_INGEST_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isServiceRoleConfigured) {
    return NextResponse.json(
      { error: "Supabase service role is required for ingestion." },
      { status: 500 }
    );
  }

  const body = await request.json();
  const parsed = parseScanIngestPayload(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const report = await generateReport(parsed.data);
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ error: "Admin client is unavailable." }, { status: 500 });
  }

  const resolvedServer = parsed.data.serverId
    ? await supabase.from("servers").select("id, team_id").eq("id", parsed.data.serverId).single()
    : await resolveOrCreateServerFromIdentity(supabase, parsed.data);

  if (resolvedServer.error || !resolvedServer.data) {
    return NextResponse.json(
      { error: resolvedServer.error?.message ?? "Server could not be resolved for this scan payload." },
      { status: 404 }
    );
  }

  const server = resolvedServer.data;

  const now = new Date().toISOString();
  const completedAt = parsed.data.completedAt ?? now;

  const { data, error } = await supabase
    .from("scans")
    .insert({
      team_id: server.team_id,
      server_id: server.id,
      source: parsed.data.source ?? "agent",
      status: parsed.data.status ?? "completed",
      started_at: parsed.data.startedAt ?? now,
      completed_at: completedAt,
      risk_score: calculateRiskScore(parsed.data.risks),
      report_title: report.title,
      executive_summary: report.executiveSummary,
      architecture_notes: report.architectureNotes,
      services: parsed.data.services,
      dependencies: parsed.data.dependencies,
      ports: parsed.data.ports,
      software: parsed.data.software,
      risks: parsed.data.risks,
      recommendations: report.recommendations,
      raw_payload: parsed.data
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase
    .from("servers")
    .update({
      last_scanned_at: completedAt
    })
    .eq("id", server.id);

  return NextResponse.json({
    ok: true,
    scanId: data.id,
    serverId: server.id
  });
}

async function resolveOrCreateServerFromIdentity(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  payload: ScanIngestPayloadInput
) {
  const hostname = payload.serverIdentity?.hostname?.trim();

  if (!hostname) {
    return {
      data: null,
      error: new Error("serverIdentity.hostname is required when serverId is omitted.")
    };
  }

  const { data: existing } = await supabase
    .from("servers")
    .select("id, team_id")
    .eq("hostname", hostname)
    .limit(1)
    .maybeSingle();

  if (existing) {
    return { data: existing, error: null };
  }

  const teamId = await ensurePlatformTeam(supabase);
  const { data, error } = await supabase
    .from("servers")
    .insert({
      team_id: teamId,
      name: payload.serverIdentity?.name ?? hostname,
      hostname,
      provider: payload.serverIdentity?.provider ?? "Unknown",
      environment: payload.serverIdentity?.environment ?? "production",
      region: payload.serverIdentity?.region ?? "unknown",
      os_family: payload.serverIdentity?.osFamily ?? "Linux",
      ssh_user: payload.serverIdentity?.sshUser ?? "unknown",
      owner: payload.serverIdentity?.owner ?? "Unassigned",
      summary: payload.serverIdentity?.summary ?? payload.inventorySummary,
      tags: payload.serverIdentity?.tags ?? []
    })
    .select("id, team_id")
    .single();

  return { data, error };
}
