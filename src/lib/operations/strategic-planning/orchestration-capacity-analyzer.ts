import type { OrchestrationPreparednessIndicator, StrategicStressLevel } from "./types";

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.min(1, Math.max(0, x));
}

function levelFromScore(score: number): StrategicStressLevel {
  if (score >= 0.72) return "high";
  if (score >= 0.42) return "moderate";
  return "low";
}

/**
 * Estima saturação de orquestração supervisionada a partir de contagens ativas
 * e pressão de coordenação — sem varrer histórico completo.
 */
export function analyzeOrchestrationCapacity(input: {
  orchestrationActiveCount: number;
  pendingSwaps: number;
  openShifts: number;
  coordinationUrgency: "normal" | "elevada" | "critica";
}): {
  saturationScore: number;
  level: StrategicStressLevel;
  rationale: string[];
  references: { kind: string; ref: string }[];
} {
  const base = clamp01(input.orchestrationActiveCount / 8);
  const queue = clamp01((input.pendingSwaps + input.openShifts) / 40);
  const urg =
    input.coordinationUrgency === "critica"
      ? 0.35
      : input.coordinationUrgency === "elevada"
        ? 0.2
        : 0.05;
  const saturationScore = clamp01(base * 0.55 + queue * 0.35 + urg);
  const level = levelFromScore(saturationScore);
  const rationale: string[] = [];
  if (input.orchestrationActiveCount > 0) {
    rationale.push(
      `${input.orchestrationActiveCount} orquestração(ões) ativa(s) — capacidade cognitiva do time de coordenação ocupada.`,
    );
  } else {
    rationale.push(
      "Sem orquestrações ativas no recorte — fila de governança livre para novos planos supervisionados.",
    );
  }
  if (input.pendingSwaps >= 5)
    rationale.push("Fila de swaps relevante aumenta risco de conflito com passos de orquestração.");
  if (input.coordinationUrgency !== "normal")
    rationale.push(
      `Urgência ${input.coordinationUrgency} — priorizar revisão humana antes de novas cadeias.`,
    );

  const references: { kind: string; ref: string }[] = [
    { kind: "orchestration_active_count", ref: String(input.orchestrationActiveCount) },
    { kind: "coordination_urgency", ref: input.coordinationUrgency },
  ];

  return { saturationScore, level, rationale: rationale.slice(0, 4), references };
}

export function buildOrchestrationPreparednessIndicator(input: {
  orchestrationActiveCount: number;
  pendingSwaps: number;
  openShifts: number;
  coordinationUrgency: "normal" | "elevada" | "critica";
}): OrchestrationPreparednessIndicator {
  const cap = analyzeOrchestrationCapacity(input);
  const checklist: string[] = [];
  if (cap.level !== "low")
    checklist.push(
      "Revisar políticas de concorrência e `maxConcurrentActive` antes de novas orquestrações.",
    );
  checklist.push("Garantir sandbox + aprovação explícita para cada passo de execução.");
  if (input.orchestrationActiveCount >= 4)
    checklist.push("Escalonar revisão entre dois gestores para evitar gargalo único.");
  return {
    activeOrchestrations: input.orchestrationActiveCount,
    saturationLevel: cap.level,
    saturationScore: cap.saturationScore,
    checklist: checklist.slice(0, 5),
  };
}
