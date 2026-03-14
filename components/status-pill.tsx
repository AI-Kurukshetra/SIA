import type { ReactNode } from "react";

import type { RiskSeverity, ServerStatus } from "@/lib/types";
import { getSeverityTone, getStatusTone } from "@/lib/utils";

interface StatusPillProps {
  children: ReactNode;
  tone?: ServerStatus | RiskSeverity | "slate";
}

export function StatusPill({ children, tone = "slate" }: StatusPillProps) {
  const resolvedTone =
    tone === "healthy" || tone === "warning" || tone === "critical"
      ? getStatusTone(tone)
      : tone === "low" || tone === "medium" || tone === "high"
        ? getSeverityTone(tone)
        : tone;

  return <span className={`pill pill--${resolvedTone}`}>{children}</span>;
}
