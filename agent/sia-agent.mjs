#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import process from "node:process";

const requiredArgs = [
  "target",
  "api-url",
  "token"
];

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const missing = requiredArgs.filter((key) => !args[key]);

  if (missing.length > 0) {
    printUsage(`Missing required arguments: ${missing.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  const startedAt = new Date().toISOString();
  const discoveryScript = await readFile(new URL("./remote-discovery.sh", import.meta.url), "utf8");
  const isLocalTarget = args.target === "local" || args.target === "localhost";

  console.log(`Running discovery against ${args.target}...`);
  const rawOutput = isLocalTarget
    ? await runCommand("bash", ["-s"], discoveryScript)
    : await runCommand("ssh", buildSshArgs(args), discoveryScript);
  const sections = parseSections(rawOutput);
  const payload = buildPayload(args, sections, startedAt, new Date().toISOString());

  if (args["dry-run"] === "true") {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  console.log(`Posting scan to ${args["api-url"]}...`);
  const response = await fetch(args["api-url"], {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${args.token}`
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`Ingest failed with ${response.status}: ${JSON.stringify(result)}`);
  }

  console.log(`Scan stored successfully. Scan ID: ${result.scanId}`);
}

function parseArgs(argv) {
  const parsed = {};

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];

    if (!current.startsWith("--")) {
      continue;
    }

    const key = current.slice(2);
    const next = argv[index + 1];

    if (!next || next.startsWith("--")) {
      parsed[key] = "true";
      continue;
    }

    parsed[key] = next;
    index += 1;
  }

  return parsed;
}

function printUsage(errorMessage) {
  if (errorMessage) {
    console.error(errorMessage);
  }

  console.error(`
Usage:
  npm run scan:agent -- \\
    --target ubuntu@203.0.113.10 \\
    --api-url https://your-app.vercel.app/api/scan-ingest \\
    --token <scan-ingest-token> \\
    [--server-id <existing-server-id>] \\
    [--name "Billing API"] \\
    [--provider "AWS"] \\
    [--environment production] \\
    [--region ap-south-1] \\
    [--identity ~/.ssh/id_ed25519] \\
    [--port 22] \\
    [--dry-run]

Local machine:
  npm run scan:agent -- \\
    --target local \\
    --api-url http://localhost:3000/api/scan-ingest \\
    --token <scan-ingest-token>
`);
}

function buildSshArgs(args) {
  const sshArgs = [];

  if (args.identity) {
    sshArgs.push("-i", args.identity, "-o", "IdentitiesOnly=yes");
  }

  if (args.port) {
    sshArgs.push("-p", args.port);
  }

  sshArgs.push(
    "-o",
    "BatchMode=yes",
    "-o",
    "StrictHostKeyChecking=accept-new",
    args.target,
    "bash -s"
  );

  return sshArgs;
}

function runCommand(command, args, stdinText = "") {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["pipe", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);

    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
        return;
      }

      reject(new Error(`${command} exited with code ${code}\n${stderr}`));
    });

    if (stdinText) {
      child.stdin.write(stdinText);
    }

    child.stdin.end();
  });
}

function parseSections(rawOutput) {
  const sectionPattern = /===SIA:([A-Z_]+):BEGIN===\n?([\s\S]*?)===SIA:\1:END===/g;
  const sections = {};

  for (const match of rawOutput.matchAll(sectionPattern)) {
    sections[match[1]] = match[2].trim();
  }

  return sections;
}

function buildPayload(args, sections, startedAt, completedAt) {
  const hostname = firstLine(sections.HOSTNAME) || "unknown-host";
  const osRelease = parseOsRelease(sections.OS_RELEASE || "");
  const services = parseServices(sections.SYSTEMD_SERVICES || "");
  const ports = parsePorts(sections.LISTENING_PORTS || "");
  const dependencies = parseDependencies(sections.ESTABLISHED_CONNECTIONS || "");
  const software = parseSoftware(sections.PACKAGE_HINTS || "", sections.PACKAGES || "");
  const projectPaths = parseProjectPaths(sections.PROJECT_MARKERS || "");
  const webServers = parseWebServers(sections.WEBSERVER_CONFIGS || "", software);
  const processes = parseProcesses(sections.TOP_PROCESSES || "");
  const techStack = parseTechStack(software, projectPaths, webServers, services);
  const risks = buildRisks(sections, ports, osRelease);
  const sshUser = extractSshUser(args.target);
  const identityTags = dedupeByKey(
    [...techStack.map((item) => item.name.toLowerCase()), ...projectPaths.map((item) => item.type.toLowerCase())],
    (item) => item
  ).slice(0, 8);

  return {
    serverId: args["server-id"],
    source: "agent",
    startedAt,
    completedAt,
    status: "completed",
    serverIdentity: {
      name: args.name ?? hostname,
      hostname,
      provider: args.provider ?? "Unknown",
      environment: normalizeEnvironment(args.environment),
      region: args.region ?? "unknown",
      osFamily: osRelease.prettyName,
      sshUser,
      owner: args.owner ?? "Unassigned",
      summary: `${hostname} discovered by the SIA agent.`,
      tags: identityTags
    },
    inventorySummary: summarizeInventory(hostname, osRelease.prettyName, services, ports, risks),
    architectureNotes: summarizeArchitecture(hostname, services, ports, dependencies),
    services,
    dependencies,
    ports,
    software,
    projectPaths,
    webServers,
    processes,
    techStack,
    risks
  };
}

function firstLine(value) {
  return value.split("\n").find(Boolean)?.trim() ?? "";
}

function parseOsRelease(raw) {
  const entries = Object.fromEntries(
    raw
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [key, ...rest] = line.split("=");
        return [key, rest.join("=").replace(/^"/, "").replace(/"$/, "")];
      })
  );

  return {
    id: entries.ID ?? "linux",
    version: entries.VERSION_ID ?? "unknown",
    prettyName: entries.PRETTY_NAME ?? "Linux"
  };
}

function parseServices(raw) {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 15)
    .map((line) => {
      const [name = "unknown", load = "", active = "", sub = "", ...descriptionParts] = line.split(/\s+/);
      const description = descriptionParts.join(" ");

      return {
        name,
        role: description || "System service",
        status: active === "active" && sub === "running" ? "running" : active === "failed" ? "degraded" : "stopped",
        notes: `Load=${load || "unknown"}, active=${active || "unknown"}, sub=${sub || "unknown"}`
      };
    });
}

function parsePorts(raw) {
  const lines = raw.split("\n").filter(Boolean);
  const ports = [];

  for (const line of lines) {
    if (!/\bLISTEN\b/.test(line)) {
      continue;
    }

    const match = line.match(/(?:\*|[\d.:a-fA-F]+):(\d+)\s+/);

    if (!match) {
      continue;
    }

    const port = Number(match[1]);
    const serviceMatch = line.match(/users:\(\("([^"]+)"/) || line.match(/"([^"]+)"/);
    const service = serviceMatch?.[1] ?? inferServiceName(port);
    const listensOnAllInterfaces = line.includes("0.0.0.0:") || line.includes("[::]:") || line.includes("*:");

    ports.push({
      port,
      protocol: /\budp\b/i.test(line) ? "udp" : "tcp",
      service,
      exposure: listensOnAllInterfaces ? "public" : "private",
      notes: listensOnAllInterfaces ? "Listening on all interfaces." : "Bound to a specific interface."
    });
  }

  return dedupeByKey(ports, (item) => `${item.port}-${item.protocol}-${item.service}`).slice(0, 20);
}

function parseDependencies(raw) {
  const dependencies = [];

  for (const line of raw.split("\n")) {
    if (!line.includes("ESTAB")) {
      continue;
    }

    const processMatch = line.match(/users:\(\("([^"]+)"/);
    const remoteMatch = line.match(/(\d+\.\d+\.\d+\.\d+|\[[a-fA-F0-9:]+\]):(\d+)\s*users:/);

    if (!processMatch || !remoteMatch) {
      continue;
    }

    const remoteHost = `${remoteMatch[1]}:${remoteMatch[2]}`;

    if (remoteHost.includes("127.0.0.1") || remoteHost.includes("[::1]")) {
      continue;
    }

    dependencies.push({
      from: processMatch[1],
      to: remoteHost,
      protocol: "tcp",
      notes: "Observed established outbound or peer connection."
    });
  }

  return dedupeByKey(dependencies, (item) => `${item.from}-${item.to}`).slice(0, 15);
}

function parseSoftware(hintsRaw, packagesRaw) {
  const packages = [];

  for (const line of hintsRaw.split("\n")) {
    const [name, version] = line.split("\t");

    if (!name || !version) {
      continue;
    }

    packages.push({
      name,
      version: version.trim(),
      purpose: inferPackagePurpose(name)
    });
  }

  if (packages.length === 0) {
    for (const line of packagesRaw.split("\n").slice(0, 20)) {
      const [name, version] = line.split("\t");

      if (!name || !version) {
        continue;
      }

      packages.push({
        name,
        version: version.trim(),
        purpose: "Installed package"
      });
    }
  }

  return dedupeByKey(packages, (item) => item.name).slice(0, 20);
}

function parseProjectPaths(raw) {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((path) => ({
      path,
      type: inferProjectType(path),
      notes: `Detected marker file ${path.split("/").pop()}`
    }))
    .slice(0, 20);
}

function parseWebServers(raw, software) {
  const entries = [];
  const chunks = raw.split("FILE ").map((chunk) => chunk.trim()).filter(Boolean);

  for (const chunk of chunks) {
    const [filePath = "", ...rest] = chunk.split("\n");
    const snippetLines = rest.filter(Boolean).slice(0, 10);
    const name = /nginx/.test(filePath)
      ? "nginx"
      : /apache2|httpd/.test(filePath)
        ? "apache"
        : "webserver";
    const version = software.find((item) => item.name.includes(name))?.version;

    entries.push({
      name,
      version,
      configPath: filePath,
      summary: snippetLines.find((line) => /(server_name|listen|proxy_pass|DocumentRoot|VirtualHost)/.test(line)) ?? "Configuration file discovered.",
      snippets: snippetLines
    });
  }

  return entries.slice(0, 10);
}

function parseProcesses(raw) {
  return raw
    .split("\n")
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [pid, command, cpu, memory, ...rest] = line.split(/\s+/);
      return {
        pid: Number.isNaN(Number(pid)) ? null : Number(pid),
        command: command ?? "unknown",
        cpu: cpu ?? "0",
        memory: memory ?? "0",
        notes: rest.join(" ").slice(0, 220)
      };
    })
    .slice(0, 20);
}

function parseTechStack(software, projectPaths, webServers, services) {
  const signals = [];

  for (const item of software) {
    signals.push({
      name: item.name,
      category: categorizeStackItem(item.name),
      version: item.version,
      evidence: item.purpose
    });
  }

  for (const project of projectPaths) {
    signals.push({
      name: project.type,
      category: "framework",
      evidence: project.path
    });
  }

  for (const webServer of webServers) {
    signals.push({
      name: webServer.name,
      category: "proxy",
      version: webServer.version,
      evidence: webServer.configPath
    });
  }

  for (const service of services.slice(0, 10)) {
    signals.push({
      name: service.name,
      category: "operations",
      evidence: service.role
    });
  }

  return dedupeByKey(signals, (item) => `${item.category}-${item.name}`).slice(0, 20);
}

function buildRisks(sections, ports, osRelease) {
  const risks = [];
  const sshConfig = sections.CONFIG_HINTS || "";
  const processes = sections.TOP_PROCESSES || "";
  const cron = sections.CRON || "";

  if (osRelease.id === "centos" && osRelease.version.startsWith("7")) {
    risks.push({
      severity: "critical",
      title: "Unsupported operating system lineage detected",
      detail: `${osRelease.prettyName} appears to be an aging platform that may be outside current support expectations.`,
      recommendation: "Plan a migration to a supported base OS before deeper modernization work."
    });
  }

  if (/^PermitRootLogin\s+yes$/m.test(sshConfig)) {
    risks.push({
      severity: "critical",
      title: "Root SSH login is enabled",
      detail: "The SSH daemon configuration explicitly allows direct root logins.",
      recommendation: "Disable root SSH login and require named users with sudo."
    });
  }

  if (ports.some((port) => port.port === 22 && port.exposure === "public")) {
    risks.push({
      severity: "high",
      title: "SSH listens on all interfaces",
      detail: "Port 22 appears to be reachable on all interfaces, which broadens the attack surface.",
      recommendation: "Restrict SSH exposure to a bastion, VPN, or fixed management CIDR."
    });
  }

  if (/docker/i.test(processes) && !/FILE \/etc\/docker\/daemon\.json/.test(sshConfig)) {
    risks.push({
      severity: "medium",
      title: "Docker detected without captured daemon configuration",
      detail: "Container runtime activity is present, but the discovery pass did not capture a daemon config file.",
      recommendation: "Review Docker runtime settings, logging, and socket exposure explicitly."
    });
  }

  if (cron && cron !== "no crontab for root") {
    risks.push({
      severity: "low",
      title: "Cron-driven automation present",
      detail: "Scheduled jobs were detected and may hold undocumented operational logic.",
      recommendation: "Inventory cron jobs and move critical automation into version-controlled runbooks or code."
    });
  }

  return risks;
}

function summarizeInventory(hostname, osName, services, ports, risks) {
  const serviceNames = services.slice(0, 4).map((service) => service.name).join(", ") || "no major services";
  const listeningPorts = ports.slice(0, 5).map((port) => `${port.port}/${port.protocol}`).join(", ") || "no exposed listeners";

  return `${hostname} is running ${osName}. Primary detected services include ${serviceNames}. Listening ports include ${listeningPorts}. ${risks.length > 0 ? `The scan surfaced ${risks.length} risk signal${risks.length > 1 ? "s" : ""}.` : "No immediate risk signals were derived from the heuristic checks."}`;
}

function summarizeArchitecture(hostname, services, ports, dependencies) {
  const listenerSummary =
    ports.length > 0
      ? `The host exposes ${ports
          .slice(0, 5)
          .map((port) => `${port.service} on ${port.port}/${port.protocol}`)
          .join(", ")}.`
      : "No listening ports were captured from the discovery pass.";
  const dependencySummary =
    dependencies.length > 0
      ? `Observed live peer connections include ${dependencies
          .slice(0, 4)
          .map((dependency) => `${dependency.from} -> ${dependency.to}`)
          .join(", ")}.`
      : "No clear inter-service dependency edges were inferred from established sockets.";

  return `${hostname} appears to be running ${services.length} notable services. ${listenerSummary} ${dependencySummary}`;
}

function normalizeEnvironment(value) {
  return value === "staging" || value === "development" ? value : "production";
}

function extractSshUser(target) {
  if (target === "local" || target === "localhost") {
    return process.env.USER ?? "local-user";
  }

  return target.includes("@") ? target.split("@")[0] : "root";
}

function inferProjectType(path) {
  if (path.endsWith("package.json")) return "Node.js";
  if (path.endsWith("pyproject.toml") || path.endsWith("requirements.txt") || path.endsWith("manage.py")) return "Python";
  if (path.endsWith("pom.xml")) return "Java";
  if (path.endsWith("composer.json")) return "PHP";
  if (path.endsWith("Gemfile")) return "Ruby";
  if (path.endsWith("Dockerfile") || path.endsWith("docker-compose.yml")) return "Containerized";
  return "Application";
}

function categorizeStackItem(name) {
  if (/nginx|apache|httpd/.test(name)) return "proxy";
  if (/node|python|java|php|ruby/.test(name)) return "runtime";
  if (/postgres|mysql|redis/.test(name)) return "database";
  return "operations";
}

function inferServiceName(port) {
  const known = {
    22: "ssh",
    80: "http",
    443: "https",
    5432: "postgresql",
    6379: "redis",
    3306: "mysql",
    3000: "app",
    8080: "http-alt"
  };

  return known[port] ?? "unknown";
}

function inferPackagePurpose(name) {
  if (/nginx|apache|httpd/.test(name)) return "Web serving";
  if (/docker/.test(name)) return "Container runtime";
  if (/node|npm|pm2/.test(name)) return "JavaScript application runtime";
  if (/python/.test(name)) return "Python runtime";
  if (/java/.test(name)) return "Java runtime";
  if (/postgres|psql/.test(name)) return "PostgreSQL tooling";
  if (/redis/.test(name)) return "Redis tooling";
  if (/mysql/.test(name)) return "MySQL tooling";
  if (/fail2ban/.test(name)) return "Intrusion prevention";
  return "Installed software";
}

function dedupeByKey(items, getKey) {
  const seen = new Set();
  return items.filter((item) => {
    const key = getKey(item);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
