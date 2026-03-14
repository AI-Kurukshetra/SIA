import { notFound } from "next/navigation";

import { StatusPill } from "@/components/status-pill";
import { getLatestReportForServer, getServer } from "@/lib/data";
import { formatDateTime, getRiskLabel } from "@/lib/utils";

export default async function ServerDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [server, report] = await Promise.all([getServer(id), getLatestReportForServer(id)]);

  if (!server) {
    notFound();
  }

  return (
    <div className="stack">
      <section className="dashboard-headline">
        <div>
          <span className="eyebrow">Server detail</span>
          <h1>{server.name}</h1>
          <p>{server.summary}</p>
        </div>
        <div className="pill-row">
          <StatusPill tone={server.status}>{server.status}</StatusPill>
          <StatusPill>{server.provider}</StatusPill>
        </div>
      </section>

      <section className="detail-grid">
        <article className="detail-card">
          <h2>Host profile</h2>
          <p>{server.hostname}</p>
          <p>
            {server.environment} · {server.region} · {server.osFamily}
          </p>
          <p>SSH user: {server.sshUser}</p>
          <p>
            Server ID: <code>{server.id}</code>
          </p>
          <p>Last scanned: {formatDateTime(server.lastScannedAt)}</p>
        </article>

        <article className="detail-card">
          <h2>Latest intelligence</h2>
          {report ? (
            <>
              <div className="report-score">{report.riskScore}</div>
              <p>{getRiskLabel(report.riskScore)}</p>
              <p>{report.executiveSummary}</p>
            </>
          ) : (
            <p>No report available yet.</p>
          )}
        </article>
      </section>

      {report ? (
        <>
          <section className="summary-grid">
            <article className="summary-card">
              <span className="meta-label">Projects</span>
              <strong>{report.projectPaths?.length ?? 0}</strong>
              <p>Likely deployed application roots.</p>
            </article>

            <article className="summary-card">
              <span className="meta-label">Web configs</span>
              <strong>{report.webServers?.length ?? 0}</strong>
              <p>Ingress or vhost definitions detected.</p>
            </article>

            <article className="summary-card">
              <span className="meta-label">Open ports</span>
              <strong>{report.ports.length}</strong>
              <p>Listeners found during discovery.</p>
            </article>

            <article className="summary-card">
              <span className="meta-label">Processes</span>
              <strong>{report.processes?.length ?? 0}</strong>
              <p>Top runtime processes captured.</p>
            </article>
          </section>

          <section className="stack-grid-2">
            <article className="detail-card detail-card--tall">
              <h2>Project paths</h2>
              <table className="table insight-table">
                <thead>
                  <tr>
                    <th>Path</th>
                    <th>Type</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                {(report.projectPaths ?? []).length > 0 ? (
                  report.projectPaths?.map((project) => (
                    <tr key={project.path}>
                      <td><code>{project.path}</code></td>
                      <td>{project.type}</td>
                      <td>{project.notes}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3}>No likely project directories were detected.</td>
                  </tr>
                )}
                </tbody>
              </table>
            </article>

            <article className="detail-card detail-card--tall">
              <h2>Web server configuration</h2>
              <ul className="list-reset service-list">
                {(report.webServers ?? []).length > 0 ? (
                  report.webServers?.map((serverConfig) => (
                    <li key={serverConfig.configPath}>
                      <strong>{serverConfig.name}</strong>
                      <p><code>{serverConfig.configPath}</code></p>
                      <p>{serverConfig.summary}</p>
                      <div className="stack">
                        {serverConfig.snippets.slice(0, 3).map((snippet) => (
                          <code key={snippet} className="code-block-inline">{snippet}</code>
                        ))}
                      </div>
                    </li>
                  ))
                ) : (
                  <li>
                    <strong>No web server config detected.</strong>
                    <p>This host may not be serving HTTP directly, or the config was not readable during discovery.</p>
                  </li>
                )}
              </ul>
            </article>
          </section>

          <section className="stack-grid-2">
            <article className="detail-card detail-card--tall">
              <h2>Runtime services</h2>
              <ul className="list-reset service-list">
                {report.services.map((service) => (
                  <li key={service.name}>
                    <StatusPill tone={service.status === "running" ? "healthy" : "warning"}>
                      {service.status}
                    </StatusPill>
                    <strong>{service.name}</strong>
                    <p>{service.role}</p>
                    <p>{service.notes}</p>
                  </li>
                ))}
              </ul>
            </article>

            <article className="detail-card detail-card--tall">
              <h2>Detected risks</h2>
              <ul className="list-reset risk-list">
                {report.risks.map((risk) => (
                  <li key={risk.title}>
                    <StatusPill tone={risk.severity}>{risk.severity}</StatusPill>
                    <strong>{risk.title}</strong>
                    <p>{risk.detail}</p>
                    <p>{risk.recommendation}</p>
                  </li>
                ))}
              </ul>
            </article>
          </section>

          <section className="stack-grid-2">
            <article className="detail-card detail-card--tall">
              <h2>Stack signals</h2>
              <table className="table insight-table">
                <thead>
                  <tr>
                    <th>Component</th>
                    <th>Category</th>
                    <th>Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {(report.techStack ?? []).map((signal) => (
                    <tr key={`${signal.category}-${signal.name}`}>
                      <td>{signal.name}{signal.version ? ` (${signal.version})` : ""}</td>
                      <td>{signal.category}</td>
                      <td>{signal.evidence}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>

            <article className="detail-card detail-card--tall">
              <h2>Active processes</h2>
              <ul className="list-reset service-list">
                {(report.processes ?? []).slice(0, 12).map((process) => (
                  <li key={`${process.pid}-${process.command}`}>
                    <strong>{process.command}</strong>
                    <p>PID {process.pid ?? "n/a"} · CPU {process.cpu}% · MEM {process.memory}%</p>
                    <p className="mono-wrap">{process.notes}</p>
                  </li>
                ))}
              </ul>
            </article>
          </section>
        </>
      ) : null}
    </div>
  );
}
