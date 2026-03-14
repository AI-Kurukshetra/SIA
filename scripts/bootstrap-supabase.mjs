#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

async function main() {
  await loadEnvFile(".env.local");

  const [command, ...argv] = process.argv.slice(2);
  const args = parseArgs(argv);

  if (!command) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const env = getRequiredEnv();
  const supabase = createClient(env.url, env.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  switch (command) {
    case "check":
      await checkSetup(supabase);
      return;
    case "create-user":
      await createUserAndShowTeam(supabase, args);
      return;
    case "create-server":
      await createServerForTeam(supabase, args);
      return;
    default:
      printUsage();
      process.exitCode = 1;
  }
}

async function loadEnvFile(filename) {
  try {
    const content = await readFile(new URL(`../${filename}`, import.meta.url), "utf8");

    for (const line of content.split("\n")) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const equalsIndex = trimmed.indexOf("=");

      if (equalsIndex === -1) {
        continue;
      }

      const key = trimmed.slice(0, equalsIndex);
      const value = trimmed.slice(equalsIndex + 1);

      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // Ignore missing env files so existing environment variables still work.
  }
}

function getRequiredEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  }

  return { url, serviceRoleKey };
}

function parseArgs(argv) {
  const parsed = {};

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];

    if (!current.startsWith("--")) {
      continue;
    }

    const key = current.slice(2);
    const next = argv[index + 1];

    if (!next || next.startsWith("--")) {
      parsed[key] = "true";
      continue;
    }

    parsed[key] = next;
    index += 1;
  }

  return parsed;
}

async function checkSetup(supabase) {
  const [{ count: teamCount, error: teamError }, { count: profileCount, error: profileError }, { count: serverCount, error: serverError }] =
    await Promise.all([
      supabase.from("teams").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("servers").select("*", { count: "exact", head: true })
    ]);

  if (teamError || profileError || serverError) {
    throw new Error(
      `Schema check failed. Apply supabase/migrations/0001_initial.sql first. Details: ${teamError?.message ?? profileError?.message ?? serverError?.message}`
    );
  }

  console.log("Supabase schema is reachable.");
  console.log(`Teams: ${teamCount ?? 0}`);
  console.log(`Profiles: ${profileCount ?? 0}`);
  console.log(`Servers: ${serverCount ?? 0}`);
}

async function createUserAndShowTeam(supabase, args) {
  const email = args.email;

  if (!email) {
    throw new Error("--email is required.");
  }

  const fullName = args.name ?? "SIA Owner";
  const teamName = args["team-name"] ?? "SIA Workspace";

  const user = await findUserByEmail(supabase, email);
  const ensuredUser =
    user ??
    (
      await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          team_name: teamName
        }
      })
    ).data.user;

  if (!ensuredUser) {
    throw new Error("Failed to create or load the auth user.");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, team_id")
    .eq("id", ensuredUser.id)
    .single();

  if (error || !profile) {
    throw new Error(`User exists but no profile/team was found. ${error?.message ?? ""}`);
  }

  console.log(`User ready: ${email}`);
  console.log(`User ID: ${ensuredUser.id}`);
  console.log(`Team ID: ${profile.team_id}`);
}

async function createServerForTeam(supabase, args) {
  const teamId = args["team-id"];

  if (!teamId) {
    throw new Error("--team-id is required.");
  }

  const insert = {
    team_id: teamId,
    name: args.name ?? "First Server",
    hostname: args.hostname ?? "server-01.internal",
    provider: args.provider ?? "AWS",
    environment: args.environment ?? "production",
    region: args.region ?? "ap-south-1",
    os_family: args.os ?? "Ubuntu 22.04",
    ssh_user: args["ssh-user"] ?? "ubuntu",
    owner: args.owner ?? "Platform",
    summary: args.summary ?? "Initial server created through the SIA bootstrap script.",
    tags: normalizeCsv(args.tags),
    status: "healthy"
  };

  const { data, error } = await supabase.from("servers").insert(insert).select("id").single();

  if (error || !data) {
    throw new Error(`Failed to create server. ${error?.message ?? ""}`);
  }

  console.log(`Server created: ${insert.name}`);
  console.log(`Server ID: ${data.id}`);
}

async function findUserByEmail(supabase, email) {
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200
    });

    if (error) {
      throw new Error(`Failed to list auth users. ${error.message}`);
    }

    const match = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());

    if (match) {
      return match;
    }

    if (data.users.length < 200) {
      return null;
    }

    page += 1;
  }
}

function normalizeCsv(value) {
  return value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

function printUsage() {
  console.log(`
Usage:
  npm run supabase:check

  npm run supabase:create-user -- \\
    --email you@company.com \\
    [--name "Your Name"] \\
    [--team-name "Your Team"]

  npm run supabase:create-server -- \\
    --team-id <team-id> \\
    [--name "Billing API"] \\
    [--hostname billing-01.internal] \\
    [--provider AWS] \\
    [--environment production] \\
    [--region ap-south-1] \\
    [--os "Ubuntu 22.04"] \\
    [--ssh-user ubuntu] \\
    [--owner Platform] \\
    [--summary "Handles payments"] \\
    [--tags "node, payments, redis"]
`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
