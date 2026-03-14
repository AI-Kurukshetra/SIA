# First Run Setup

This is the shortest path from configured environment variables to the first real live scan.

## 1. Apply the schema in Supabase

Open the Supabase SQL editor for your `sia` project and run the contents of [supabase/migrations/0001_initial.sql](/home/bacancy/sia/supabase/migrations/0001_initial.sql#L1).

## 2. Verify the schema from this repo

```bash
npm run supabase:check
```

This confirms the `teams`, `profiles`, and `servers` tables are reachable using the service-role key in `.env.local`.

## 3. Create your first user and team

```bash
npm run supabase:create-user -- \
  --email you@company.com \
  --name "Your Name" \
  --team-name "SIA Team"
```

This creates the auth user if needed and prints the `teamId` created by the trigger in the migration.

## 4. Create your first server

```bash
npm run supabase:create-server -- \
  --team-id <team-id-from-previous-step> \
  --name "Billing API" \
  --hostname billing-01.internal \
  --provider AWS \
  --environment production \
  --region ap-south-1 \
  --os "Ubuntu 22.04" \
  --ssh-user ubuntu \
  --owner Platform \
  --summary "Handles billing traffic and payment jobs." \
  --tags "node, payments, redis"
```

The script prints the `serverId` needed by the SSH agent.

## 5. Start the app

```bash
npm run dev
```

Then sign in using the email you created in step 3.

## 6. Run the first live scan

From a machine that can SSH into the target host:

```bash
npm run scan:agent -- \
  --target ubuntu@203.0.113.10 \
  --server-id <server-id> \
  --api-url http://localhost:3000/api/scan-ingest \
  --token sia-local-ingest-token-9f8c2c8f6f2d \
  --identity ~/.ssh/id_ed25519
```

If you want to inspect the payload before posting it:

```bash
npm run scan:agent -- \
  --target ubuntu@203.0.113.10 \
  --server-id <server-id> \
  --api-url http://localhost:3000/api/scan-ingest \
  --token dummy \
  --dry-run
```
