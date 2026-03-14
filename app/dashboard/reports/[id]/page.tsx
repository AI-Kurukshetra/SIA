import { notFound } from "next/navigation";

import { StatusPill } from "@/components/status-pill";
import { getReport } from "@/lib/data";
import { formatDateTime, getRiskLabel } from "@/lib/utils";

export default async function ReportDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await getReport(id);

  if (!report) {
    notFound();
  }

  return (
    <div className="stack">
      <section className="dashboard-headline">
        <div>
          <span className="eyebrow">Report</span>
          <h1>{report.title}</h1>
          <p>{report.executiveSummary}</p>
        </div>
        <div className="pill-row">
          <StatusPill tone={report.riskScore > 79 ? "critical" : report.riskScore > 59 ? "warning" : "healthy"}>
            {getRiskLabel(report.riskScore)}
          </StatusPill>
          <StatusPill>{report.serverName}</StatusPill>
        </div>
      </section>

      <section className="summary-grid">
        <article className="summary-card">
          <span className="meta-label">Risk score</span>
          <strong>{report.riskScore}</strong>
          <p>{getRiskLabel(report.riskScore)}</p>
        </article>
        <article className="summary-card">
          <span className="meta-label">Project paths</span>
          <strong>{report.projectPaths?.length ?? 0}</strong>
          <p>Likely deployment roots or framework markers.</p>
        </article>
        <article className="summary-card">
          <span className="meta-label">Web configs</span>
          <strong>{report.webServers?.length ?? 0}</strong>
          <p>Detected web server config files.</p>
        </article>
        <article className="summary-card">
          <span className="meta-label">Open ports</span>
          <strong>{report.ports.length}</strong>
          <p>Listeners discovered during the scan.</p>
        </article>
      </section>

      <section className="stack-grid-2">
        <article className="detail-card detail-card--tall">
          <h2>Executive summary</h2>
          <p>{report.executiveSummary}</p>
          <p className="muted">
            Started {formatDateTime(report.startedAt)} · Completed {formatDateTime(report.completedAt)}
          </p>
        </article>

        <article className="detail-card detail-card--tall">
          <h2>Top recommendations</h2>
          <ul className="list-reset recommendation-list">
            {report.recommendations.map((recommendation) => (
              <li key={recommendation.title}>
                <StatusPill tone={recommendation.priority === "now" ? "critical" : recommendation.priority === "next" ? "warning" : "low"}>
                  {recommendation.priority}
                </StatusPill>
                <strong>{recommendation.title}</strong>
                <p>{recommendation.detail}</p>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="detail-card">
        <h2>Architecture notes</h2>
        <p>{report.architectureNotes}</p>
      </section>

      <section className="detail-card">
        <h2>Application and stack clues</h2>
        <div className="stack-grid-2">
          <div className="subsection">
            <h3>Project paths</h3>
            <table className="table insight-table">
              <thead>
                <tr>
                  <th>Path</th>
                  <th>Type</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {(report.projectPaths ?? []).map((project) => (
                  <tr key={project.path}>
                    <td><code>{project.path}</code></td>
                    <td>{project.type}</td>
                    <td>{project.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="subsection">
            <h3>Tech stack signals</h3>
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
          </div>
        </div>
      </section>

      <section className="detail-card">
        <h2>Ingress and network exposure</h2>
        <div className="stack-grid-2">
          <div className="subsection">
            <h3>Web server config</h3>
            <ul className="list-reset service-list">
              {(report.webServers ?? []).map((serverConfig) => (
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
              ))}
            </ul>
          </div>

          <div className="subsection">
            <h3>Open ports</h3>
            <table className="table insight-table">
              <thead>
                <tr>
                  <th>Port</th>
                  <th>Service</th>
                  <th>Exposure</th>
                </tr>
              </thead>
              <tbody>
                {report.ports.map((port) => (
                  <tr key={`${port.port}-${port.service}`}>
                    <td>{port.port}/{port.protocol}</td>
                    <td>{port.service}</td>
                    <td>{port.exposure}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="detail-card">
        <h2>Runtime inventory</h2>
        <div className="stack-grid-2">
          <div className="subsection">
            <h3>Services</h3>
            <ul className="list-reset service-list">
              {report.services.map((service) => (
                <li key={service.name}>
                  <strong>{service.name}</strong>
                  <p>{service.role}</p>
                  <p>{service.notes}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="subsection">
            <h3>Top processes</h3>
            <ul className="list-reset service-list">
              {(report.processes ?? []).map((process) => (
                <li key={`${process.pid}-${process.command}`}>
                  <strong>{process.command}</strong>
                  <p>PID {process.pid ?? "n/a"} · CPU {process.cpu}% · MEM {process.memory}%</p>
                  <p className="mono-wrap">{process.notes}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="stack-grid-2">
        <article className="detail-card">
          <h2>Service map</h2>
          <ul className="list-reset service-list">
            {report.services.map((service) => (
              <li key={service.name}>
                <strong>{service.name}</strong>
                <p>
                  {service.role}
                  {service.port ? ` · port ${service.port}` : ""}
                </p>
                <p>{service.notes}</p>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="stack-grid-2">
        <article className="detail-card">
          <h2>Software inventory</h2>
          <table className="table insight-table">
            <thead>
              <tr>
                <th>Package</th>
                <th>Version</th>
                <th>Purpose</th>
              </tr>
            </thead>
            <tbody>
              {report.software.map((pkg) => (
                <tr key={pkg.name}>
                  <td>{pkg.name}</td>
                  <td>{pkg.version}</td>
                  <td>{pkg.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="detail-card">
          <h2>Dependency edges</h2>
          <ul className="list-reset dependency-list">
            {report.dependencies.length > 0 ? report.dependencies.map((dependency) => (
              <li key={`${dependency.from}-${dependency.to}`}>
                <strong>
                  {dependency.from} → {dependency.to}
                </strong>
                <p>{dependency.protocol}</p>
                <p>{dependency.notes}</p>
              </li>
            )) : (
              <li>
                <strong>No dependency edges were inferred.</strong>
                <p>The scan did not observe stable inter-service socket relationships worth displaying.</p>
              </li>
            )}
          </ul>
        </article>
      </section>

      <section className="detail-card">
        <h2>Risk register</h2>
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
      </section>
    </div>
  );
}
