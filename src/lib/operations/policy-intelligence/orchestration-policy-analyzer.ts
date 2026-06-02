import type { OperationalMemoryInsight } from "@/lib/operations/operational-memory/types";
import type { OperationalPolicyFinding } from "./types";

export function analyzeOrchestrationPolicies(
  insights: OperationalMemoryInsight[],
): OperationalPolicyFinding | null {
  const orch = insights.filter((i) => i.memoryKind === "orchestration_effectiveness");
  if (orch.length < 2) return null;

  const blocked = orch.filter(
    (i) => i.learningSignals?.orchestrationTerminal === "blocked_step",
  ).length;
  const rolled = orch.filter(
    (i) => i.learningSignals?.orchestrationTerminal === "rolled_back",
  ).length;
  const lowEff = orch.filter((i) => (i.effectivenessScore ?? 1) < 0.45).length;

  const friction = (blocked + rolled + lowEff) / orch.length;
  if (friction < 0.34) return null;

  const severity = friction >= 0.55 ? "critical" : friction >= 0.44 ? "warning" : "info";

  return {
    code: "orchestration_bottleneck",
    severity,
    headline: "Possível gargalo em políticas de orquestração",
    narrative: [
      `${orch.length} telemetria(s) de orquestração na janela; fração problemática ≈ ${(friction * 100).toFixed(0)}% (passos bloqueados, rollbacks terminais ou effectiveness baixa).`,
      "Avalie gates sequenciais, dependências entre passos e políticas de sandbox — ajustes são sugestões supervisionadas, sem execução automática.",
    ],
    references: orch.slice(0, 8).map((r) => ({ kind: "operational_memory", id: r.id })),
  };
}
