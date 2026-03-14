import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="site-header__brand">
          <BrandMark />
        </Link>
        <nav className="site-header__nav">
          <Link href="/pricing">Pricing</Link>
          <Link href="/#features">Features</Link>
          <Link href="/#workflow">Workflow</Link>
          <Link href="/dashboard" className="button button--ghost">
            Open platform
          </Link>
          <Link href="/sign-in" className="button button--primary">
            Install agent
          </Link>
        </nav>
      </div>
    </header>
  );
}
