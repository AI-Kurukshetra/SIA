import type { RiskSeverity, ServerStatus } from "@/lib/types";

const relativeFormatter = new Intl.RelativeTimeFormat("en", {
  numeric: "auto"
});

export function formatDateTime(value: string | null) {
  if (!value) {
    return "Not scanned yet";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function formatRelativeTime(value: string | null) {
  if (!value) {
    return "No scan yet";
  }

  const deltaSeconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60]
  ];

  for (const [unit, secondsInUnit] of units) {
    if (Math.abs(deltaSeconds) >= secondsInUnit || unit === "minute") {
      return relativeFormatter.format(Math.round(deltaSeconds / secondsInUnit), unit);
    }
  }

  return "just now";
}

export function getStatusTone(status: ServerStatus) {
  switch (status) {
    case "healthy":
      return "emerald";
    case "warning":
      return "amber";
    case "critical":
      return "rose";
    default:
      return "slate";
  }
}

export function getSeverityTone(severity: RiskSeverity) {
  switch (severity) {
    case "critical":
      return "rose";
    case "high":
      return "orange";
    case "medium":
      return "amber";
    case "low":
      return "sky";
    default:
      return "slate";
  }
}

export function getRiskLabel(score: number) {
  if (score >= 80) {
    return "Immediate attention";
  }

  if (score >= 60) {
    return "Needs hardening";
  }

  if (score >= 40) {
    return "Manageable";
  }

  return "Stable";
}

export function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
