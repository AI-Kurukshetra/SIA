import { demoDashboard, demoScans, demoServers } from "@/lib/demo-data";
import { isServiceRoleConfigured } from "@/lib/env";
import { buildMockScan } from "@/lib/scans/mock-scan";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { CreateServerInput, DashboardSnapshot, ScanRecord, ServerRecord } from "@/lib/types";

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const servers = await listServers();
  const reports = await listReports();

  if (!isServiceRoleConfigured) {
    return demoDashboard;
  }

  if (reports.length === 0) {
    return {
      totalServers: servers.length,
      healthyServers: servers.filter((server) => server.status === "healthy").length,
      attentionServers: servers.filter((server) => server.status !== "healthy").length,
      completedScans: 0,
      avgRiskScore: 0,
      avgTimeToExplain: "n/a"
    };
  }

  return {
    totalServers: servers.length,
    healthyServers: servers.filter((server) => server.status === "healthy").length,
    attentionServers: servers.filter((server) => server.status !== "healthy").length,
    completedScans: reports.length,
    avgRiskScore: Math.round(
      reports.reduce((total, report) => total + report.riskScore, 0) / reports.length
    ),
    avgTimeToExplain: "4 min"
  };
}

export async function listServers(): Promise<ServerRecord[]> {
  if (!isServiceRoleConfigured) {
    return demoServers;
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return demoServers;
  }

  const { data, error } = await supabase
    .from("servers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to list servers", error);
    return demoServers;
  }

  return (data ?? []).map((server) => ({
    id: server.id,
    name: server.name,
    hostname: server.hostname,
    provider: server.provider,
    environment: server.environment,
    region: server.region,
    osFamily: server.os_family,
    sshUser: server.ssh_user,
    status: server.status,
    owner: server.owner,
    summary: server.summary,
    tags: server.tags ?? [],
    lastScannedAt: server.last_scanned_at
  }));
}

export async function getServer(serverId: string): Promise<ServerRecord | null> {
  const servers = await listServers();
  return servers.find((server) => server.id === serverId) ?? null;
}

export async function listReports(): Promise<ScanRecord[]> {
  if (!isServiceRoleConfigured) {
    return demoScans;
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return demoScans;
  }

  const [{ data: scans, error: scansError }, { data: servers, error: serversError }] = await Promise.all([
    supabase.from("scans").select("*").eq("status", "completed").order("completed_at", { ascending: false }),
    supabase.from("servers").select("id,name")
  ]);

  if (scansError || serversError) {
    console.error("Failed to list reports", scansError ?? serversError);
    return demoScans;
  }

  const serverMap = new Map((servers ?? []).map((server) => [server.id, server.name]));

  return (scans ?? []).map((scan) => ({
    id: scan.id,
    serverId: scan.server_id,
    serverName: serverMap.get(scan.server_id) ?? "Unknown server",
    status: scan.status,
    source: scan.source,
    riskScore: scan.risk_score,
    title: scan.report_title,
    executiveSummary: scan.executive_summary,
    architectureNotes: scan.architecture_notes,
    startedAt: scan.started_at,
    completedAt: scan.completed_at,
    services: scan.services ?? [],
    dependencies: scan.dependencies ?? [],
    ports: scan.ports ?? [],
    software: scan.software ?? [],
    projectPaths: scan.raw_payload?.projectPaths ?? [],
    webServers: scan.raw_payload?.webServers ?? [],
    processes: scan.raw_payload?.processes ?? [],
    techStack: scan.raw_payload?.techStack ?? [],
    risks: scan.risks ?? [],
    recommendations: scan.recommendations ?? [],
    rawPayload: scan.raw_payload ?? {}
  }));
}

export async function getReport(reportId: string): Promise<ScanRecord | null> {
  const reports = await listReports();
  return reports.find((report) => report.id === reportId) ?? null;
}

export async function getLatestReportForServer(serverId: string): Promise<ScanRecord | null> {
  const reports = await listReports();
  return reports.find((report) => report.serverId === serverId) ?? buildMockScan(serverId);
}

export async function createServer(input: CreateServerInput, teamId?: string) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Supabase client is unavailable.");
  }

  const resolvedTeamId = teamId ?? (await ensurePlatformTeam(supabase));

  const { data, error } = await supabase
    .from("servers")
    .insert({
      team_id: resolvedTeamId,
      name: input.name,
      hostname: input.hostname,
      provider: input.provider,
      environment: input.environment,
      region: input.region,
      os_family: input.osFamily,
      ssh_user: input.sshUser,
      owner: input.owner,
      summary: input.summary,
      tags: input.tags,
      status: "healthy"
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create server.");
  }

  return data.id as string;
}

export async function ensurePlatformTeam(
  supabase = createSupabaseAdminClient()
): Promise<string> {
  if (!supabase) {
    throw new Error("Supabase admin client is unavailable.");
  }

  const { data: existing } = await supabase.from("teams").select("id").limit(1).maybeSingle();

  if (existing?.id) {
    return existing.id;
  }

  const { data, error } = await supabase
    .from("teams")
    .insert({
      name: "SIA Workspace",
      slug: `sia-workspace-${Date.now()}`
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create platform team.");
  }

  return data.id as string;
}
