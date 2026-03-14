import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";

export default function SignInPage() {
  return (
    <main className="auth-layout">
      <section className="auth-card">
        <BrandMark />
        <h1>Install the agent on a server and let it report home.</h1>
        <p>
          This platform does not require user authentication. Install the agent on a Linux host,
          point it at the ingest endpoint, and the dashboard will show the host&apos;s web server,
          project paths, stack signals, services, processes, and risks.
        </p>
        <div className="notice">
          <p>
            `npm run scan:agent -- --target ubuntu@server --api-url http://localhost:3000/api/scan-ingest --token $SCAN_INGEST_TOKEN`
          </p>
        </div>
        <p className="muted">Run discovery only against infrastructure you are authorized to inspect. <Link href="/">Back to home</Link></p>
      </section>
    </main>
  );
}
