import Link from "next/link";

import { StatusPill } from "@/components/status-pill";
import { listReports } from "@/lib/data";
import { formatDateTime, getRiskLabel } from "@/lib/utils";

export default async function ReportsPage() {
  const reports = await listReports();

  return (
    <div className="stack">
      <section className="dashboard-headline">
        <div>
          <span className="eyebrow">Reports</span>
          <h1>Operator-grade explanations from every completed scan.</h1>
          <p>
            Review the architecture summary, dependency graph, exposed ports, and prioritized
            hardening actions for each host.
          </p>
        </div>
      </section>

      <section className="reports-grid">
        {reports.map((report) => (
          <article key={report.id} className="detail-card">
            <div className="pill-row">
              <StatusPill tone={report.riskScore > 79 ? "critical" : report.riskScore > 59 ? "warning" : "healthy"}>
                {getRiskLabel(report.riskScore)}
              </StatusPill>
              <StatusPill>{report.serverName}</StatusPill>
            </div>
            <h2>{report.title}</h2>
            <p>{report.executiveSummary}</p>
            <p className="muted">Completed {formatDateTime(report.completedAt)}</p>
            <Link href={`/dashboard/reports/${report.id}`} className="button button--ghost">
              Open report
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}
