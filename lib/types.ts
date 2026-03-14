export type ServerStatus = "healthy" | "warning" | "critical";
export type Environment = "production" | "staging" | "development";
export type ScanStatus = "completed" | "running" | "queued" | "failed";
export type RiskSeverity = "critical" | "high" | "medium" | "low";

export interface ServiceNode {
  name: string;
  role: string;
  status: "running" | "degraded" | "stopped";
  port?: number;
  notes: string;
}

export interface DependencyEdge {
  from: string;
  to: string;
  protocol: string;
  notes: string;
}

export interface RiskItem {
  severity: RiskSeverity;
  title: string;
  detail: string;
  recommendation: string;
}

export interface Recommendation {
  title: string;
  detail: string;
  priority: "now" | "next" | "later";
}

export interface PortExposure {
  port: number;
  protocol: string;
  service: string;
  exposure: "public" | "private";
  notes: string;
}

export interface SoftwarePackage {
  name: string;
  version: string;
  purpose: string;
}

export interface ProjectPath {
  path: string;
  type: string;
  notes: string;
}

export interface WebServerInsight {
  name: string;
  version?: string;
  configPath: string;
  summary: string;
  snippets: string[];
}

export interface ProcessInsight {
  pid: number | null;
  command: string;
  cpu: string;
  memory: string;
  notes: string;
}

export interface TechStackSignal {
  name: string;
  category: "runtime" | "framework" | "database" | "proxy" | "operations";
  version?: string;
  evidence: string;
}

export interface ServerRecord {
  id: string;
  name: string;
  hostname: string;
  provider: string;
  environment: Environment;
  region: string;
  osFamily: string;
  sshUser: string;
  status: ServerStatus;
  owner: string;
  summary: string;
  tags: string[];
  lastScannedAt: string | null;
}

export interface ScanRecord {
  id: string;
  serverId: string;
  serverName: string;
  status: ScanStatus;
  source: "agent" | "demo";
  riskScore: number;
  title: string;
  executiveSummary: string;
  architectureNotes: string;
  startedAt: string;
  completedAt: string | null;
  services: ServiceNode[];
  dependencies: DependencyEdge[];
  ports: PortExposure[];
  software: SoftwarePackage[];
  projectPaths?: ProjectPath[];
  webServers?: WebServerInsight[];
  processes?: ProcessInsight[];
  techStack?: TechStackSignal[];
  risks: RiskItem[];
  recommendations: Recommendation[];
  rawPayload?: Record<string, unknown>;
}

export interface DashboardSnapshot {
  totalServers: number;
  healthyServers: number;
  attentionServers: number;
  completedScans: number;
  avgRiskScore: number;
  avgTimeToExplain: string;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  teamName: string;
  teamId?: string;
  isDemo: boolean;
}

export interface CreateServerInput {
  name: string;
  hostname: string;
  provider: string;
  environment: Environment;
  region: string;
  osFamily: string;
  sshUser: string;
  owner: string;
  summary: string;
  tags: string[];
}

export interface ScanIngestPayload {
  serverId?: string;
  source?: "agent" | "demo";
  startedAt?: string;
  completedAt?: string;
  status?: ScanStatus;
  serverIdentity?: Partial<CreateServerInput> & {
    hostname?: string;
    name?: string;
  };
  inventorySummary: string;
  architectureNotes: string;
  services: ServiceNode[];
  dependencies: DependencyEdge[];
  ports: PortExposure[];
  software: SoftwarePackage[];
  projectPaths?: ProjectPath[];
  webServers?: WebServerInsight[];
  processes?: ProcessInsight[];
  techStack?: TechStackSignal[];
  risks: RiskItem[];
}
