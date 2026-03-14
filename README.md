# SIA

SIA, short for Server Intelligence Agent, is a Vercel-friendly SaaS for understanding unfamiliar servers quickly. It combines a Next.js product surface, Supabase storage, and an ingest API for SSH-backed scan runners that execute inside a trusted network.

## What is included

- Marketing site and pricing page
- Authless dashboard access
- Demo-mode workspace when Supabase is not configured
- Dashboard with server inventory and scan reports
- Agent self-registration on first check-in
- Detailed report view with project paths, web server config, stack signals, services, processes, ports, software inventory, risks, and recommendations
- Scan ingest API for external agents
- SSH scan agent CLI for external discovery
- OpenAI-backed report generation with heuristic fallback
- Supabase migration with teams, profiles, servers, scans, triggers, and RLS
- Vercel cron endpoint scaffold for daily summary jobs
testt
## Architecture

- `app/`: Next.js App Router pages, API routes, and global layout
- `components/`: reusable UI for the marketing site and dashboard
- `lib/`: Supabase clients, data access, AI report generation, demo data
- `supabase/migrations/`: database schema and RLS policies
- `docs/sample-scan-payload.json`: example ingest contract for a scan runner

The important production constraint is that Vercel should host the web product and ingest endpoints, but the actual SSH discovery should run in an external worker or customer-network agent. Vercel request lifetimes are not where long-running shell discovery belongs.

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template:

```bash
cp .env.example .env.local
```

3. Create a Supabase project and apply the SQL in [supabase/migrations/0001_initial.sql](/home/bacancy/sia/supabase/migrations/0001_initial.sql).

4. Set these variables in `.env.local` and in Vercel:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5-mini
SCAN_INGEST_TOKEN=...
```

5. Start the app:

```bash
npm run dev
```

Without Supabase configuration, `/dashboard` runs in demo mode using static sample data.

The exact first-run sequence for a real workspace is documented in [docs/setup.md](/home/bacancy/sia/docs/setup.md).

## Running a live scan

1. Start the platform with `npm run dev`.
2. Run the external agent from a machine with SSH access to the target host.
3. Let the agent create the server automatically on first check-in, or pass an existing `--server-id` if you want to target a pre-created record.

```bash
npm run scan:agent -- \
  --target ubuntu@203.0.113.10 \
  --api-url http://localhost:3000/api/scan-ingest \
  --token $SCAN_INGEST_TOKEN \
  --identity ~/.ssh/id_ed25519
```

Use `--dry-run` to print the generated payload before posting it.

## Manual ingest

```bash
curl -X POST http://localhost:3000/api/scan-ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SCAN_INGEST_TOKEN" \
  --data @docs/sample-scan-payload.json
```

The route generates a report title, executive summary, architecture notes, and recommendations, then persists the normalized scan in Supabase.

More agent details are in [docs/agent.md](/home/bacancy/sia/docs/agent.md).

## Suggested next production steps

- Build the actual SSH agent as a separate worker or CLI that inventories Linux hosts safely
- Add secrets management for per-server credentials or ephemeral access brokering
- Introduce billing, workspace invitations, and audit logs
- Add queueing for long-running report generation and retry handling
- Add tests for ingest validation, automatic server resolution, and data mapping
