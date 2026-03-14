import { demoScans, demoServers } from "@/lib/demo-data";
import type { ScanRecord, ServerRecord } from "@/lib/types";

export function buildMockScan(serverId: string): ScanRecord | null {
  const matchingDemo = demoScans.find((scan) => scan.serverId === serverId);

  if (matchingDemo) {
    return matchingDemo;
  }

  const server = demoServers.find((item) => item.id === serverId);

  if (!server) {
    return null;
  }

  return fallbackScanForServer(server);
}

function fallbackScanForServer(server: ServerRecord): ScanRecord {
  const now = new Date().toISOString();

  return {
    id: `scan-${server.id}-${Date.now()}`,
    serverId: server.id,
    serverName: server.name,
    status: "completed",
    source: "demo",
    riskScore: server.status === "healthy" ? 32 : server.status === "warning" ? 58 : 82,
    title: `${server.name} topology and runtime inventory`,
    executiveSummary: `${server.name} was scanned in demo mode. Connect a scan agent to replace this sample report with a live SSH-backed inventory.`,
    architectureNotes:
      "SIA can accept externally collected scan payloads from an agent running inside your network perimeter, then generate a human-readable report in the Vercel-hosted app.",
    startedAt: now,
    completedAt: now,
    services: [
      {
        name: "systemd",
        role: "Service supervisor",
        status: "running",
        notes: "Core unit manager detected."
      }
    ],
    dependencies: [],
    ports: [],
    software: [],
    risks: [],
    recommendations: [
      {
        title: "Install a real scan agent",
        detail: "Use the ingest API to push live server inventories into this workspace.",
        priority: "now"
      }
    ]
  };
}
