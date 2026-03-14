import type { DashboardSnapshot, ScanRecord, ServerRecord, SessionUser } from "@/lib/types";

export const demoUser: SessionUser = {
  id: "demo-user",
  email: "ops@sia-demo.io",
  name: "Alex Mercer",
  teamName: "Northstar Platform",
  teamId: "demo-team",
  isDemo: true
};

export const demoServers: ServerRecord[] = [
  {
    id: "srv-edge-01",
    name: "Edge Proxy",
    hostname: "edge-01.northstar.internal",
    provider: "AWS",
    environment: "production",
    region: "ap-south-1",
    osFamily: "Ubuntu 22.04",
    sshUser: "ubuntu",
    status: "warning",
    owner: "Platform",
    summary: "Ingress host terminating TLS, forwarding traffic to app and auth clusters.",
    tags: ["nginx", "gateway", "public"],
    lastScannedAt: "2026-03-14T07:20:00.000Z"
  },
  {
    id: "srv-billing-01",
    name: "Billing API",
    hostname: "billing-01.northstar.internal",
    provider: "Hetzner",
    environment: "production",
    region: "hel1",
    osFamily: "Debian 12",
    sshUser: "deployer",
    status: "healthy",
    owner: "Backend",
    summary: "Node.js API with PostgreSQL and Redis dependencies for billing workflows.",
    tags: ["node", "payments", "redis"],
    lastScannedAt: "2026-03-14T05:40:00.000Z"
  },
  {
    id: "srv-legacy-01",
    name: "Legacy ERP Bridge",
    hostname: "erp-bridge-01.dc.local",
    provider: "On-prem",
    environment: "staging",
    region: "dc-west",
    osFamily: "CentOS 7",
    sshUser: "root",
    status: "critical",
    owner: "IT Ops",
    summary: "Aging Java bridge syncing ERP data into modern APIs through cron-driven jobs.",
    tags: ["legacy", "java", "cron"],
    lastScannedAt: "2026-03-13T23:10:00.000Z"
  }
];

export const demoScans: ScanRecord[] = [
  {
    id: "scan-edge-20260314",
    serverId: "srv-edge-01",
    serverName: "Edge Proxy",
    status: "completed",
    source: "demo",
    riskScore: 71,
    title: "Public ingress proxy with weak admin exposure",
    executiveSummary:
      "This host is the primary internet-facing ingress. Nginx terminates TLS and forwards requests to the app cluster. The scan detected a stale admin upstream and permissive SSH access from more networks than expected.",
    architectureNotes:
      "Traffic flows from port 443 into Nginx, then to an internal app service on 3000 and an auth service on 4000. Certbot renewals are scheduled locally through systemd timers.",
    startedAt: "2026-03-14T07:18:00.000Z",
    completedAt: "2026-03-14T07:20:00.000Z",
    services: [
      {
        name: "nginx",
        role: "TLS termination and reverse proxy",
        status: "running",
        port: 443,
        notes: "Primary ingress for customer traffic."
      },
      {
        name: "fail2ban",
        role: "Brute-force protection",
        status: "running",
        notes: "Monitoring SSH and nginx auth logs."
      },
      {
        name: "certbot-renew.timer",
        role: "Certificate renewal",
        status: "running",
        notes: "Systemd timer renewing wildcard certificate."
      }
    ],
    dependencies: [
      {
        from: "nginx",
        to: "app-api",
        protocol: "http://10.0.14.9:3000",
        notes: "Routes core API and dashboard traffic."
      },
      {
        from: "nginx",
        to: "auth-api",
        protocol: "http://10.0.14.10:4000",
        notes: "Routes `/auth/*` traffic."
      }
    ],
    ports: [
      {
        port: 22,
        protocol: "tcp",
        service: "ssh",
        exposure: "public",
        notes: "Publicly reachable from multiple office CIDRs."
      },
      {
        port: 80,
        protocol: "tcp",
        service: "http",
        exposure: "public",
        notes: "Redirects to HTTPS."
      },
      {
        port: 443,
        protocol: "tcp",
        service: "https",
        exposure: "public",
        notes: "Primary customer ingress."
      }
    ],
    software: [
      {
        name: "nginx",
        version: "1.24.0",
        purpose: "Reverse proxy"
      },
      {
        name: "certbot",
        version: "2.11.0",
        purpose: "TLS certificate lifecycle"
      },
      {
        name: "fail2ban",
        version: "1.0.2",
        purpose: "Intrusion prevention"
      }
    ],
    projectPaths: [
      {
        path: "/var/www/customer-portal/package.json",
        type: "Node.js",
        notes: "Likely frontend or API application root."
      },
      {
        path: "/etc/nginx/sites-enabled/customer-portal.conf",
        type: "Web configuration",
        notes: "Ingress configuration discovered in nginx site definitions."
      }
    ],
    webServers: [
      {
        name: "nginx",
        version: "1.24.0",
        configPath: "/etc/nginx/sites-enabled/customer-portal.conf",
        summary: "TLS terminates here and proxies traffic to internal upstreams.",
        snippets: [
          "listen 443 ssl http2;",
          "server_name portal.example.com;",
          "proxy_pass http://10.0.14.9:3000;"
        ]
      }
    ],
    processes: [
      {
        pid: 1180,
        command: "nginx",
        cpu: "0.3",
        memory: "1.2",
        notes: "master process /usr/sbin/nginx -g daemon on; master_process on;"
      },
      {
        pid: 2249,
        command: "node",
        cpu: "1.8",
        memory: "4.9",
        notes: "/var/www/customer-portal/server.js"
      }
    ],
    techStack: [
      {
        name: "nginx",
        category: "proxy",
        version: "1.24.0",
        evidence: "/etc/nginx/sites-enabled/customer-portal.conf"
      },
      {
        name: "Node.js",
        category: "runtime",
        version: "22.x",
        evidence: "/var/www/customer-portal/package.json"
      },
      {
        name: "systemd",
        category: "operations",
        evidence: "service supervision"
      }
    ],
    risks: [
      {
        severity: "high",
        title: "SSH exposed to public internet",
        detail: "Port 22 is reachable publicly and not limited to a bastion host.",
        recommendation: "Restrict SSH ingress to a fixed management CIDR or private access path."
      },
      {
        severity: "medium",
        title: "Stale admin upstream remains configured",
        detail: "Nginx contains an upstream target for `legacy-admin` that no longer responds.",
        recommendation: "Remove unused upstreams to reduce confusion during incidents."
      }
    ],
    recommendations: [
      {
        title: "Move SSH behind a bastion",
        detail: "Reduce the public attack surface by forcing operator access through a hardened management path.",
        priority: "now"
      },
      {
        title: "Version-control nginx configuration",
        detail: "Treat ingress config as code to make future server handoffs faster and safer.",
        priority: "next"
      }
    ]
  },
  {
    id: "scan-billing-20260314",
    serverId: "srv-billing-01",
    serverName: "Billing API",
    status: "completed",
    source: "demo",
    riskScore: 38,
    title: "Healthy billing API with clear service boundaries",
    executiveSummary:
      "This server runs a PM2-managed Node.js billing service backed by PostgreSQL and Redis. Service ownership is clear and the host shows no major exposure issues, though package update cadence should improve.",
    architectureNotes:
      "The service listens on port 3000 privately, depends on a managed Postgres instance and a Redis cache, and emits logs to journald plus an external collector.",
    startedAt: "2026-03-14T05:37:00.000Z",
    completedAt: "2026-03-14T05:40:00.000Z",
    services: [
      {
        name: "pm2-billing",
        role: "Node.js process manager",
        status: "running",
        port: 3000,
        notes: "Runs the billing API in cluster mode."
      },
      {
        name: "vector",
        role: "Log forwarding",
        status: "running",
        notes: "Ships journald and application logs."
      }
    ],
    dependencies: [
      {
        from: "billing-api",
        to: "managed-postgres",
        protocol: "postgresql://billing-db",
        notes: "Primary transactional store."
      },
      {
        from: "billing-api",
        to: "redis-cache",
        protocol: "redis://billing-cache",
        notes: "Idempotency and rate limit state."
      }
    ],
    ports: [
      {
        port: 22,
        protocol: "tcp",
        service: "ssh",
        exposure: "private",
        notes: "Reachable only from the WireGuard management subnet."
      },
      {
        port: 3000,
        protocol: "tcp",
        service: "billing-api",
        exposure: "private",
        notes: "Private VPC listener."
      }
    ],
    software: [
      {
        name: "node",
        version: "22.10.0",
        purpose: "Runtime"
      },
      {
        name: "pm2",
        version: "5.4.2",
        purpose: "Process manager"
      },
      {
        name: "vector",
        version: "0.40.0",
        purpose: "Observability"
      }
    ],
    risks: [
      {
        severity: "low",
        title: "Base OS patch lag",
        detail: "Security updates are 18 days behind the preferred patch window.",
        recommendation: "Roll a maintenance window and standardize monthly patch automation."
      }
    ],
    recommendations: [
      {
        title: "Automate dependency freshness checks",
        detail: "Track base-image and OS patch drift before the next ownership transition.",
        priority: "next"
      }
    ]
  },
  {
    id: "scan-legacy-20260313",
    serverId: "srv-legacy-01",
    serverName: "Legacy ERP Bridge",
    status: "completed",
    source: "demo",
    riskScore: 89,
    title: "Legacy bridge with root SSH and unsupported OS",
    executiveSummary:
      "This host is a fragile bridge between the ERP system and downstream APIs. It relies on root SSH, cron-triggered shell scripts, and an unsupported operating system. Operational knowledge appears to live primarily in the filesystem rather than code or runbooks.",
    architectureNotes:
      "A Java process pulls ERP files every fifteen minutes, stages them in `/opt/erp-sync`, transforms them through shell scripts, and pushes payloads to downstream HTTP endpoints. Failures are logged locally and not centrally aggregated.",
    startedAt: "2026-03-13T23:05:00.000Z",
    completedAt: "2026-03-13T23:10:00.000Z",
    services: [
      {
        name: "erp-sync",
        role: "Java sync worker",
        status: "degraded",
        port: 8081,
        notes: "Restarts intermittently under cron supervision."
      },
      {
        name: "crond",
        role: "Job scheduler",
        status: "running",
        notes: "Kicks shell wrappers and archive rotation."
      }
    ],
    dependencies: [
      {
        from: "erp-sync",
        to: "erp-share",
        protocol: "smb://erp-share",
        notes: "Reads flat files from a Windows file share."
      },
      {
        from: "erp-sync",
        to: "internal-api",
        protocol: "https://api.internal.local",
        notes: "Pushes transformed ERP payloads downstream."
      }
    ],
    ports: [
      {
        port: 22,
        protocol: "tcp",
        service: "ssh",
        exposure: "public",
        notes: "Root login permitted."
      },
      {
        port: 8081,
        protocol: "tcp",
        service: "erp-sync",
        exposure: "private",
        notes: "Service health endpoint."
      }
    ],
    software: [
      {
        name: "java",
        version: "1.8.0_232",
        purpose: "ERP bridge runtime"
      },
      {
        name: "rsync",
        version: "3.1.2",
        purpose: "Archive shipping"
      },
      {
        name: "samba-client",
        version: "4.10.16",
        purpose: "ERP share access"
      }
    ],
    risks: [
      {
        severity: "critical",
        title: "Unsupported operating system",
        detail: "CentOS 7 is beyond its normal support window and lacks current hardening defaults.",
        recommendation: "Prioritize migration to a supported distribution before broader modernization work."
      },
      {
        severity: "critical",
        title: "Root SSH login enabled",
        detail: "Operators connect directly as root, leaving poor auditability and high blast radius.",
        recommendation: "Disable root SSH login and move to named users with sudo plus MFA-backed access."
      }
    ],
    recommendations: [
      {
        title: "Inventory and codify the cron workflow",
        detail: "Capture the shell wrappers, environment variables, and retry behavior before migration work begins.",
        priority: "now"
      },
      {
        title: "Add central log shipping",
        detail: "Incidents are currently hard to investigate because failure signals remain local to the host.",
        priority: "next"
      }
    ]
  }
];

export const demoDashboard: DashboardSnapshot = {
  totalServers: demoServers.length,
  healthyServers: demoServers.filter((server) => server.status === "healthy").length,
  attentionServers: demoServers.filter((server) => server.status !== "healthy").length,
  completedScans: demoScans.length,
  avgRiskScore: Math.round(
    demoScans.reduce((total, scan) => total + scan.riskScore, 0) / demoScans.length
  ),
  avgTimeToExplain: "6 min"
};
