import type { OperationalMemoryInsight } from "@/lib/operations/operational-memory/types";
import type { OperationalPolicyFinding } from "./types";

export function analyzeRollbackPatterns(
  insights: OperationalMemoryInsight[],
): OperationalPolicyFinding | null {
  const rollbackRows = insights.filter((i) => i.memoryKind === "rollback_signal");
  const executionRollbacks = insights.filter(
    (i) =>
      i.memoryKind === "execution_outcome" && i.learningSignals?.rollbackCorrelation === "strong",
  );
  const orchRollbackish = insights.filter(
    (i) =>
      i.memoryKind === "orchestration_effectiveness" &&
      i.learningSignals?.orchestrationTerminal === "rolled_back",
  );

  const totalSignals = rollbackRows.length + executionRollbacks.length + orchRollbackish.length;
  if (totalSignals < 2) return null;

  const refs = [
    ...rollbackRows.slice(0, 6).map((r) => ({ kind: "operational_memory", id: r.id })),
    ...orchRollbackish.slice(0, 4).map((r) => ({ kind: "operational_memory", id: r.id })),
  ];

  const severity = totalSignals >= 6 ? "critical" : totalSignals >= 4 ? "warning" : "info";

  return {
    code: "rollback_recurrence",
    severity,
    headline: "Recorrência elevada de sinais de rollback",
    narrative: [
      `Foram observadas ${totalSignals} ocorrências correlacionadas a rollback na amostra recente (rollback explícito, execuções com correlação forte e orquestrações finalizadas em rollback).`,
      "Isso sugere que políticas de confirmação, gates de orquestração ou thresholds de risco podem estar desalinhados com a realidade operacional — revisão supervisionada recomendada.",
    ],
    references: refs,
  };
}
