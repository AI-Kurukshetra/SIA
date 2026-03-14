import Link from "next/link";

import { SiteHeader } from "@/components/site-header";

const tiers = [
  {
    name: "Starter",
    price: "$49",
    cadence: "/month",
    description: "For solo operators auditing a handful of inherited servers.",
    bullets: ["Up to 10 servers", "AI-generated reports", "7-day scan history"]
  },
  {
    name: "Scale",
    price: "$199",
    cadence: "/month",
    description: "For DevOps teams managing multiple environments and handoffs.",
    bullets: ["Unlimited servers", "Team workspaces", "90-day scan history"]
  }
];

export default function PricingPage() {
  return (
    <>
      <SiteHeader />
      <main className="page-shell section">
        <div className="section-heading">
          <span className="eyebrow">Pricing</span>
          <h2>Simple pricing for infrastructure teams moving fast.</h2>
          <p>
            Start with the hosted workspace on Vercel and plug in your own Supabase project for
            auth, storage, and scan history.
          </p>
        </div>
        <div className="pricing-grid">
          {tiers.map((tier) => (
            <article key={tier.name} className="pricing-card">
              <h3>{tier.name}</h3>
              <p>{tier.description}</p>
              <p>
                <strong>{tier.price}</strong>
                {tier.cadence}
              </p>
              <ul className="stack">
                {tier.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <Link href="/sign-in" className="button button--primary">
                Start free
              </Link>
            </article>
          ))}
        </div>
      </main>
    </>
  );
}
