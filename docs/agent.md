# SSH Agent

SIA's web app is designed for Vercel, but SSH discovery should run outside Vercel on a machine that already has network access to the target hosts. This repo now includes a lightweight external runner in [agent/sia-agent.mjs](/home/bacancy/sia/agent/sia-agent.mjs).

## Flow

1. Run the agent from a trusted machine that can SSH into the host.
2. The agent collects inventory data and posts it to `/api/scan-ingest`.
3. If the host is unknown, the platform creates the server record automatically from hostname and agent metadata.
4. Open `/dashboard` to inspect the resulting report.

## Example

```bash
npm run scan:agent -- \
  --target ubuntu@203.0.113.10 \
  --api-url https://your-app.vercel.app/api/scan-ingest \
  --token $SCAN_INGEST_TOKEN \
  --identity ~/.ssh/id_ed25519
```

## Dry run

Use `--dry-run` to print the generated payload without posting it:

```bash
npm run scan:agent -- \
  --target ubuntu@203.0.113.10 \
  --server-id 11111111-2222-3333-4444-555555555555 \
  --api-url https://your-app.vercel.app/api/scan-ingest \
  --token dummy \
  --dry-run
```

## What it collects

- Hostname and OS release
- Listening ports
- Established socket peers for dependency hints
- Systemd services
- Top processes
- Package and runtime hints
- Likely application/project paths
- Web server configuration snippets
- Stack signals inferred from packages, configs, and markers
- SSH, Docker, and cron configuration clues

The heuristics are intentionally conservative. This is a production-minded baseline agent, not a full replacement for a more advanced inventory collector or CMDB sync.
