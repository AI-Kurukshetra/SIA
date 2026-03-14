import Link from "next/link";

import { StatusPill } from "@/components/status-pill";
import { getDashboardSnapshot, listReports, listServers } from "@/lib/data";
import { formatRelativeTime, getRiskLabel } from "@/lib/utils";

export default async function DashboardPage() {
  const [snapshot, servers, reports] = await Promise.all([
    getDashboardSnapshot(),
    listServers(),
    listReports()
  ]);

  return (
    <div className="stack">
      <section className="dashboard-headline">
        <div>
          <span className="eyebrow">Overview</span>
          <h1>Install the agent, then read the server like a system map.</h1>
          <p>
            Every server that checks in can expose likely project paths, web server configuration,
            tech stack signals, services, processes, ports, and risks without a sign-in wall.
          </p>
        </div>
        <div className="pill-row">
          <Link href="/sign-in" className="button button--ghost">
            Install agent
          </Link>
          <Link href="/dashboard/reports" className="button button--primary">
            Open reports
          </Link>
        </div>
      </section>

      <section className="stat-grid">
        <article className="metric-card">
          <span className="meta-label">Tracked servers</span>
          <strong>{snapshot.totalServers}</strong>
          <p>{snapshot.healthyServers} healthy right now.</p>
        </article>
        <article className="metric-card">
          <span className="meta-label">Need attention</span>
          <strong>{snapshot.attentionServers}</strong>
          <p>Hosts with warning or critical posture.</p>
        </article>
        <article className="metric-card">
          <span className="meta-label">Completed scans</span>
          <strong>{snapshot.completedScans}</strong>
          <p>Latest intelligence reports available.</p>
        </article>
        <article className="metric-card">
          <span className="meta-label">Average risk</span>
          <strong>{snapshot.avgRiskScore}</strong>
          <p>{getRiskLabel(snapshot.avgRiskScore)}.</p>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-card dashboard-card--wide">
          <h2>Server inventory</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Server</th>
                <th>Environment</th>
                <th>Status</th>
                <th>Last scan</th>
              </tr>
            </thead>
            <tbody>
              {servers.map((server) => (
                <tr key={server.id}>
                  <td>
                    <Link href={`/dashboard/servers/${server.id}`}>{server.name}</Link>
                    <div className="muted">{server.hostname}</div>
                  </td>
                  <td>{server.environment}</td>
                  <td>
                    <StatusPill tone={server.status}>{server.status}</StatusPill>
                  </td>
                  <td>{formatRelativeTime(server.lastScannedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="dashboard-card dashboard-card--narrow">
          <h2>Latest reports</h2>
          <ul className="list-reset recommendation-list">
            {reports.slice(0, 3).map((report) => (
              <li key={report.id}>
                <StatusPill tone={report.riskScore > 79 ? "critical" : report.riskScore > 59 ? "warning" : "healthy"}>
                  Risk {report.riskScore}
                </StatusPill>
                <strong>{report.serverName}</strong>
                <p>{report.title}</p>
                <Link href={`/dashboard/reports/${report.id}`}>Open report</Link>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="dashboard-card">
        <h2>Agent install command</h2>
        <p>Run this from a machine that can SSH into the target host. The agent can create the server record automatically on first check-in.</p>
        <pre className="hero-card__terminal">
{`npm run scan:agent -- \\
  --target ubuntu@203.0.113.10 \\
  --api-url http://localhost:3000/api/scan-ingest \\
  --token $SCAN_INGEST_TOKEN \\
  --identity ~/.ssh/id_ed25519`}
        </pre>
      </section>
    </div>
  );
}
