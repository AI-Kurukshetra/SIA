import Link from "next/link";
import { ArrowRight, Bot, Cable, ShieldCheck, Sparkles } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { demoDashboard } from "@/lib/demo-data";

const features = [
  {
    title: "SSH-powered discovery",
    body: "Collect processes, systemd units, ports, packages, configs, and dependency clues from any Linux host through a controlled scan agent."
  },
  {
    title: "Human-readable explanations",
    body: "Translate raw runtime state into an operator-ready report that explains what the server does, how traffic moves, and what is risky."
  },
  {
    title: "Operational handoff speed",
    body: "Replace days of archaeology with a single workspace that shows server inventory, ownership cues, and recommended next actions."
  }
];

const workflow = [
  "Connect an internal scan runner using SSH credentials or ephemeral access.",
  "Push the collected inventory into SIA through the ingest API.",
  "Generate a structured explanation, risk summary, and service dependency map.",
  "Review the report with your team and turn it into hardening or migration work."
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero">
          <div className="page-shell hero__grid">
            <div>
              <span className="eyebrow">
                <Sparkles size={14} />
                Understand any server in minutes, not days
              </span>
              <h1>SIA turns an unfamiliar server into an explained system.</h1>
              <p>
                Server Intelligence Agent discovers what is running, how services connect, what
                looks risky, and what your next move should be. It is designed for inherited
                infrastructure, legacy fleets, and infrastructure reviews under time pressure.
              </p>
              <div className="hero__actions">
                <Link href="/dashboard" className="button button--primary">
                  Open platform
                  <ArrowRight size={16} />
                </Link>
                <Link href="/sign-in" className="button button--ghost">
                  Install agent
                </Link>
              </div>
            </div>
            <div className="hero-card">
              <div className="hero-card__terminal">
                <div>$ sia scan edge-01 --profile production</div>
                <div>&gt; discovering services, ports, configs, packages, and timers</div>
                <div>&gt; nginx terminates TLS and forwards to 2 upstream services</div>
                <div>&gt; fail2ban active, certbot timer present, SSH exposed publicly</div>
                <div>&gt; generated report: ingress host with weak admin exposure</div>
              </div>
              <div className="hero-card__footer">
                <div className="mini-stat">
                  <span>Servers mapped</span>
                  <strong>{demoDashboard.totalServers}</strong>
                </div>
                <div className="mini-stat">
                  <span>Avg. explain time</span>
                  <strong>{demoDashboard.avgTimeToExplain}</strong>
                </div>
                <div className="mini-stat">
                  <span>Reports ready</span>
                  <strong>{demoDashboard.completedScans}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="section">
          <div className="page-shell">
            <div className="section-heading">
              <span className="eyebrow">
                <Bot size={14} />
                Key features
              </span>
              <h2>Built for the first hour after you inherit a black-box server.</h2>
              <p>
                SIA is opinionated around the real job: identify what matters, explain it cleanly,
                and surface risk before you break something important.
              </p>
            </div>
            <div className="feature-grid">
              {features.map((feature) => (
                <article key={feature.title} className="feature-card">
                  <h3>{feature.title}</h3>
                  <p>{feature.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className="section">
          <div className="page-shell">
            <div className="section-heading">
              <span className="eyebrow">
                <Cable size={14} />
                Workflow
              </span>
              <h2>Vercel-hosted product surface, agent-executed server discovery.</h2>
              <p>
                The app stays clean and SaaS-friendly while SSH execution remains in a runner that
                can live inside your private network or customer environment.
              </p>
            </div>
            <div className="dashboard-card">
              <ol className="stack">
                {workflow.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="page-shell">
            <div className="section-heading">
              <span className="eyebrow">
                <ShieldCheck size={14} />
                Shipping posture
              </span>
              <h2>Structured like a real SaaS, not a design-only mockup.</h2>
              <p>
                The project includes authless dashboard access, self-registering agents, Supabase
                persistence, scan ingestion, AI report generation hooks, and deployment
                documentation built around server discovery.
              </p>
            </div>
          </div>
        </section>
      </main>
      <footer className="footer">
        <div className="page-shell">SIA by Bacancy Labs. DevOps / AI infrastructure tooling.</div>
      </footer>
    </>
  );
}
