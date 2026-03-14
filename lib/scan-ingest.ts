import { z } from "zod";

import type { RiskItem } from "@/lib/types";

export const riskSchema = z.object({
  severity: z.enum(["critical", "high", "medium", "low"]),
  title: z.string(),
  detail: z.string(),
  recommendation: z.string()
});

export const serviceSchema = z.object({
  name: z.string(),
  role: z.string(),
  status: z.enum(["running", "degraded", "stopped"]),
  port: z.number().optional(),
  notes: z.string()
});

export const dependencySchema = z.object({
  from: z.string(),
  to: z.string(),
  protocol: z.string(),
  notes: z.string()
});

export const portSchema = z.object({
  port: z.number(),
  protocol: z.string(),
  service: z.string(),
  exposure: z.enum(["public", "private"]),
  notes: z.string()
});

export const packageSchema = z.object({
  name: z.string(),
  version: z.string(),
  purpose: z.string()
});

export const projectPathSchema = z.object({
  path: z.string(),
  type: z.string(),
  notes: z.string()
});

export const webServerInsightSchema = z.object({
  name: z.string(),
  version: z.string().optional(),
  configPath: z.string(),
  summary: z.string(),
  snippets: z.array(z.string())
});

export const processInsightSchema = z.object({
  pid: z.number().nullable(),
  command: z.string(),
  cpu: z.string(),
  memory: z.string(),
  notes: z.string()
});

export const techStackSignalSchema = z.object({
  name: z.string(),
  category: z.enum(["runtime", "framework", "database", "proxy", "operations"]),
  version: z.string().optional(),
  evidence: z.string()
});

export const serverIdentitySchema = z.object({
  name: z.string().optional(),
  hostname: z.string().optional(),
  provider: z.string().optional(),
  environment: z.enum(["production", "staging", "development"]).optional(),
  region: z.string().optional(),
  osFamily: z.string().optional(),
  sshUser: z.string().optional(),
  owner: z.string().optional(),
  summary: z.string().optional(),
  tags: z.array(z.string()).optional()
});

export const scanIngestPayloadSchema = z.object({
  serverId: z.string().uuid().or(z.string().min(1)).optional(),
  source: z.enum(["agent", "demo"]).optional(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  status: z.enum(["completed", "running", "queued", "failed"]).optional(),
  serverIdentity: serverIdentitySchema.optional(),
  inventorySummary: z.string(),
  architectureNotes: z.string(),
  services: z.array(serviceSchema),
  dependencies: z.array(dependencySchema),
  ports: z.array(portSchema),
  software: z.array(packageSchema),
  projectPaths: z.array(projectPathSchema).optional(),
  webServers: z.array(webServerInsightSchema).optional(),
  processes: z.array(processInsightSchema).optional(),
  techStack: z.array(techStackSignalSchema).optional(),
  risks: z.array(riskSchema)
}).refine((payload) => Boolean(payload.serverId || payload.serverIdentity?.hostname), {
  message: "Either serverId or serverIdentity.hostname is required.",
  path: ["serverId"]
});

export type ScanIngestPayloadInput = z.infer<typeof scanIngestPayloadSchema>;

export function parseScanIngestPayload(input: unknown) {
  return scanIngestPayloadSchema.safeParse(input);
}

export function calculateRiskScore(risks: RiskItem[]) {
  return Math.min(
    100,
    risks.reduce((score, risk) => {
      const weight =
        risk.severity === "critical"
          ? 28
          : risk.severity === "high"
            ? 18
            : risk.severity === "medium"
              ? 10
              : 4;

      return score + weight;
    }, 0)
  );
}
