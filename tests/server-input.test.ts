import test from "node:test";
import assert from "node:assert/strict";

import { normalizeTagInput, parseCreateServerInput } from "@/lib/server-input";

test("normalizeTagInput trims and deduplicates empties", () => {
  assert.deepEqual(normalizeTagInput(" node, payments , ,redis , "), ["node", "payments", "redis"]);
  assert.deepEqual(normalizeTagInput(undefined), []);
});

test("parseCreateServerInput returns normalized data for valid input", () => {
  const result = parseCreateServerInput({
    name: "Billing API",
    hostname: "billing-01.internal",
    provider: "AWS",
    environment: "production",
    region: "ap-south-1",
    osFamily: "Ubuntu 22.04",
    sshUser: "ubuntu",
    owner: "Platform",
    summary: "Handles billing traffic and background payment jobs.",
    tags: "node, payments, redis"
  });

  assert.equal(result.success, true);

  if (result.success) {
    assert.equal(result.data.environment, "production");
    assert.deepEqual(result.data.tags, ["node", "payments", "redis"]);
  }
});

test("parseCreateServerInput rejects too-short summaries", () => {
  const result = parseCreateServerInput({
    name: "ERP",
    hostname: "erp-01",
    provider: "On-prem",
    environment: "staging",
    region: "dc-west",
    osFamily: "CentOS 7",
    sshUser: "root",
    owner: "IT",
    summary: "too short",
    tags: ""
  });

  assert.equal(result.success, false);

  if (!result.success) {
    assert.match(result.error, /Summary/);
  }
});
