import Link from "next/link";

import { NewServerForm } from "@/app/dashboard/servers/new/form";

export default async function NewServerPage() {
  return (
    <div className="stack">
      <section className="dashboard-headline">
        <div>
          <span className="eyebrow">New server</span>
          <h1>Register a host before the first scan lands.</h1>
          <p>
            Add the basic ownership and environment metadata first. The external agent will use the
            resulting server ID when it posts a live scan.
          </p>
        </div>
        <div className="pill-row">
          <Link href="/dashboard/servers" className="button button--ghost">
            Back to servers
          </Link>
        </div>
      </section>

      <div className="notice">
        You can register a server manually here, or skip this step and let the installed agent
        create the server record automatically on first check-in.
      </div>

      <section className="dashboard-card">
        <NewServerForm />
      </section>
    </div>
  );
}
