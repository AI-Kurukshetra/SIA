import test from "node:test";
import assert from "node:assert/strict";

import { calculateRiskScore, parseScanIngestPayload } from "@/lib/scan-ingest";

const validPayload = {
  serverId: "11111111-2222-3333-4444-555555555555",
  source: "agent",
  startedAt: "2026-03-14T08:00:00.000Z",
  completedAt: "2026-03-14T08:02:00.000Z",
  status: "completed",
  inventorySummary: "Nginx is the main ingress service.",
  architectureNotes: "Traffic enters on 443 and forwards to an internal app.",
  services: [
    {
      name: "nginx",
      role: "reverse proxy",
      status: "running",
      port: 443,
      notes: "Primary ingress"
    }
  ],
  dependencies: [
    {
      from: "nginx",
      to: "10.0.0.10:3000",
      protocol: "tcp",
      notes: "Upstream app dependency"
    }
  ],
  ports: [
    {
      port: 22,
      protocol: "tcp",
      service: "ssh",
      exposure: "public",
      notes: "SSH reachable"
    }
  ],
  software: [
    {
      name: "nginx",
      version: "1.24.0",
      purpose: "Reverse proxy"
    }
  ],
  risks: [
    {
      severity: "high",
      title: "SSH exposed",
      detail: "Port 22 is publicly reachable.",
      recommendation: "Restrict ingress."
    }
  ]
};

test("parseScanIngestPayload accepts a valid payload", () => {
  const result = parseScanIngestPayload(validPayload);
  assert.equal(result.success, true);
});

test("parseScanIngestPayload rejects malformed services", () => {
  const invalidPayload = {
    ...validPayload,
    services: [
      {
        name: "nginx",
        role: "reverse proxy",
        status: "broken"
      }
    ]
  };

  const result = parseScanIngestPayload(invalidPayload);
  assert.equal(result.success, false);
});

test("calculateRiskScore applies severity weights and caps at 100", () => {
  const score = calculateRiskScore([
    {
      severity: "critical",
      title: "a",
      detail: "a",
      recommendation: "a"
    },
    {
      severity: "high",
      title: "b",
      detail: "b",
      recommendation: "b"
    },
    {
      severity: "medium",
      title: "c",
      detail: "c",
      recommendation: "c"
    },
    {
      severity: "low",
      title: "d",
      detail: "d",
      recommendation: "d"
    },
    {
      severity: "critical",
      title: "e",
      detail: "e",
      recommendation: "e"
    },
    {
      severity: "critical",
      title: "f",
      detail: "f",
      recommendation: "f"
    }
  ]);

  assert.equal(score, 100);
});
