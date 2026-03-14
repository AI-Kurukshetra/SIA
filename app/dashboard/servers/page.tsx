import Link from "next/link";

import { StatusPill } from "@/components/status-pill";
import { listServers } from "@/lib/data";
import { formatDateTime } from "@/lib/utils";

export default async function ServersPage() {
  const servers = await listServers();

  return (
    <div className="stack">
      <section className="dashboard-headline">
        <div>
          <span className="eyebrow">Servers</span>
          <h1>Inventory and ownership cues for every host.</h1>
          <p>
            Each server record stores environment, runtime summary, operator hints, and the latest
            scan timestamp so you can prioritize where to look next.
          </p>
        </div>
        <div className="pill-row">
          <Link href="/dashboard/servers/new" className="button button--primary">
            Add server
          </Link>
        </div>
      </section>

      <section className="dashboard-card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Provider</th>
              <th>Owner</th>
              <th>Last scan</th>
            </tr>
          </thead>
          <tbody>
            {servers.map((server) => (
              <tr key={server.id}>
                <td>
                  <Link href={`/dashboard/servers/${server.id}`}>{server.name}</Link>
                  <div className="muted">{server.hostname}</div>
                  <div className="tag-row">
                    {server.tags.map((tag) => (
                      <StatusPill key={tag}>{tag}</StatusPill>
                    ))}
                  </div>
                </td>
                <td>
                  {server.provider}
                  <div className="muted">
                    {server.region} · {server.environment}
                  </div>
                </td>
                <td>
                  {server.owner}
                  <div className="muted">{server.sshUser}</div>
                </td>
                <td>
                  <StatusPill tone={server.status}>{server.status}</StatusPill>
                  <div className="muted">{formatDateTime(server.lastScannedAt)}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
