import type { ReactNode } from "react";
import Link from "next/link";
import { Activity, Network, Server, TerminalSquare } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";

const navigation = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: Activity
  },
  {
    href: "/dashboard/servers",
    label: "Servers",
    icon: Server
  },
  {
    href: "/dashboard/reports",
    label: "Reports",
    icon: Network
  },
  {
    href: "/sign-in",
    label: "Install Agent",
    icon: TerminalSquare
  }
];

export function DashboardShell({
  children
}: {
  children: ReactNode;
}) {
  return (
    <div className="dashboard-shell">
      <aside className="dashboard-shell__sidebar">
        <Link href="/" className="dashboard-shell__brand">
          <BrandMark />
        </Link>

        <nav className="dashboard-shell__nav">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="dashboard-shell__nav-item">
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="dashboard-shell__notice">
          <TerminalSquare size={16} />
          <div>
            <strong>Agent-first mode</strong>
            <p>Install the agent on any server, let it self-register, and inspect the resulting runtime inventory here.</p>
          </div>
        </div>
      </aside>
      <main className="dashboard-shell__content">{children}</main>
    </div>
  );
}
