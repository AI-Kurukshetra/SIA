"use server";

import { redirect } from "next/navigation";

import { createServer } from "@/lib/data";
import { parseCreateServerInput } from "@/lib/server-input";

export interface CreateServerState {
  error?: string;
}

export async function createServerAction(
  _: CreateServerState,
  formData: FormData
): Promise<CreateServerState> {
  const parsed = parseCreateServerInput({
    name: formData.get("name"),
    hostname: formData.get("hostname"),
    provider: formData.get("provider"),
    environment: formData.get("environment"),
    region: formData.get("region"),
    osFamily: formData.get("osFamily"),
    sshUser: formData.get("sshUser"),
    owner: formData.get("owner"),
    summary: formData.get("summary"),
    tags: formData.get("tags")
  });

  if (!parsed.success) {
    return {
      error: parsed.error
    };
  }

  try {
    const serverId = await createServer(parsed.data);

    redirect(`/dashboard/servers/${serverId}`);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to create server."
    };
  }
}
