import OpenAI from "openai";

import { env, isOpenAiConfigured } from "@/lib/env";
import type { Recommendation, ScanIngestPayload } from "@/lib/types";

interface GeneratedReport {
  title: string;
  executiveSummary: string;
  architectureNotes: string;
  recommendations: Recommendation[];
}

export async function generateReport(payload: ScanIngestPayload): Promise<GeneratedReport> {
  if (!isOpenAiConfigured) {
    return heuristicReport(payload);
  }

  const client = new OpenAI({
    apiKey: env.OPENAI_API_KEY
  });

  const prompt = [
    "You are generating a concise but highly useful server audit summary for a DevOps engineer.",
    "Return strict JSON with keys: title, executiveSummary, architectureNotes, recommendations.",
    "Recommendations must be an array of objects with keys: title, detail, priority.",
    "Use priority values now, next, or later.",
    `Inventory summary: ${payload.inventorySummary}`,
    `Architecture notes: ${payload.architectureNotes}`,
    `Services: ${JSON.stringify(payload.services)}`,
    `Dependencies: ${JSON.stringify(payload.dependencies)}`,
    `Ports: ${JSON.stringify(payload.ports)}`,
    `Software: ${JSON.stringify(payload.software)}`,
    `Risks: ${JSON.stringify(payload.risks)}`
  ].join("\n");

  try {
    const response = await client.responses.create({
      model: env.OPENAI_MODEL,
      input: prompt
    });

    const parsed = JSON.parse(response.output_text) as GeneratedReport;

    return {
      title: parsed.title,
      executiveSummary: parsed.executiveSummary,
      architectureNotes: parsed.architectureNotes,
      recommendations: parsed.recommendations
    };
  } catch (error) {
    console.error("OpenAI report generation failed, falling back to heuristics.", error);
    return heuristicReport(payload);
  }
}

function heuristicReport(payload: ScanIngestPayload): GeneratedReport {
  const highPriorityCount = payload.risks.filter(
    (risk) => risk.severity === "critical" || risk.severity === "high"
  ).length;

  return {
    title:
      highPriorityCount > 0
        ? `Server scan found ${highPriorityCount} urgent risk${highPriorityCount > 1 ? "s" : ""}`
        : "Server scan completed with manageable risk",
    executiveSummary: payload.inventorySummary,
    architectureNotes: payload.architectureNotes,
    recommendations: payload.risks.slice(0, 3).map((risk, index) => ({
      title: risk.title,
      detail: risk.recommendation,
      priority: index === 0 ? "now" : "next"
    }))
  };
}
