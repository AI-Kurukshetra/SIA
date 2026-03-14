import { z } from "zod";

import type { CreateServerInput } from "@/lib/types";

export const createServerSchema = z.object({
  name: z.string().min(2, "Name is required."),
  hostname: z.string().min(2, "Hostname is required."),
  provider: z.string().min(2, "Provider is required."),
  environment: z.enum(["production", "staging", "development"]),
  region: z.string().min(2, "Region is required."),
  osFamily: z.string().min(2, "OS family is required."),
  sshUser: z.string().min(1, "SSH user is required."),
  owner: z.string().min(2, "Owner is required."),
  summary: z.string().min(12, "Summary should be at least 12 characters."),
  tags: z.string().optional()
});

export function parseCreateServerInput(input: Record<string, FormDataEntryValue | null>) {
  const parsed = createServerSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid server details."
    };
  }

  const normalized: CreateServerInput = {
    ...parsed.data,
    tags: normalizeTagInput(parsed.data.tags)
  };

  return {
    success: true as const,
    data: normalized
  };
}

export function normalizeTagInput(tags: string | undefined) {
  return (
    tags
      ?.split(",")
      .map((tag) => tag.trim())
      .filter(Boolean) ?? []
  );
}
