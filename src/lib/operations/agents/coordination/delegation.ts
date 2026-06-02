import type { OperationalAgentType } from "@/lib/database.types";
import type { OperationalAgentReasoningSurface } from "@/lib/operations/agents/contracts";

/**
 * Delegação contextual somente para síntese colaborativa: o recommendation_agent consolida
 * headlines dos demais — sem execução nem callbacks entre agentes.
 */
export function contextualDelegationTarget(
  from: OperationalAgentType,
): OperationalAgentType | null {
  if (from === "recommendation_agent") return null;
  return "recommendation_agent";
}

export function buildCollaborativeRationale(input: {
  surface: OperationalAgentReasoningSurface;
  delegatedReasoningTo: OperationalAgentType | null;
  peerHeadlines: { agent: OperationalAgentType; lines: string[] }[];
}): string {
  const base = input.surface.rationaleSummary;
  if (input.surface.agentType === "recommendation_agent") {
    const peers = input.peerHeadlines
      .filter((p) => p.agent !== "recommendation_agent")
      .flatMap((p) => p.lines.slice(0, 1).map((l) => `[${p.agent}] ${l}`));
    const tail = peers.length
      ? ` Síntese colaborativa (read-only): ${peers.slice(0, 4).join(" · ")}`
      : "";
    return `${base}${tail}`;
  }
  if (input.delegatedReasoningTo) {
    return `${base} Insights delegados contextualmente para ${input.delegatedReasoningTo} (orquestração supervisionada; sem execução automática).`;
  }
  return base;
}

export function peerHeadlineIndex(surfaces: OperationalAgentReasoningSurface[]): {
  agent: OperationalAgentType;
  lines: string[];
}[] {
  return surfaces.map((s) => ({ agent: s.agentType, lines: s.headlines.slice(0, 4) }));
}
