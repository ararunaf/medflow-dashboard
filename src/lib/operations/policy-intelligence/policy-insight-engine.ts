import type { OperationalMemoryInsight } from "@/lib/operations/operational-memory/types";
import type { AdaptiveSignalSnapshot } from "@/lib/operations/adaptive-prioritization/types";
import {
  evaluateAdaptiveGovernanceStress,
  evaluateIneffectiveThresholds,
} from "./adaptive-governance-evaluator";
import { buildGovernanceNarrative } from "./governance-analysis-engine";
import { analyzeOrchestrationPolicies } from "./orchestration-policy-analyzer";
import { analyzeRollbackPatterns } from "./rollback-pattern-analyzer";
import type {
  OperationalPolicyFinding,
  OperationalPolicyGovernanceRecommendationDraft,
  OperationalPolicyIntelligenceEngineResult,
} from "./types";

export type PolicyIntelligenceEngineInput = {
  computedAt: string;
  insights: OperationalMemoryInsight[];
  adaptiveSignals: AdaptiveSignalSnapshot;
  /** 0..1 — dismissões sobre respostas humanas recentes (overlay). */
  feedbackDismissedRatio: number | null;
};

function analyzeCoordinationOverload(
  insights: OperationalMemoryInsight[],
): OperationalPolicyFinding | null {
  const rows = insights.filter((i) => i.memoryKind === "coordination_effectiveness");
  if (rows.length < 2) return null;
  const hiFriction = rows.filter(
    (i) => (i.learningSignals?.coordinationFriction ?? 0) > 0.42,
  ).length;
  const ratio = hiFriction / rows.length;
  if (ratio < 0.3 && rows.length < 4) return null;
  const severity = ratio >= 0.45 || rows.length >= 6 ? "warning" : "info";
  return {
    code: "coordination_overload",
    severity,
    headline: "Sobrecarga ou atrito em coordenação multi-agente",
    narrative: [
      `${rows.length} ciclos de coordenação na amostra; ${hiFriction} com atrito elevado (friction > 0,42).`,
      "Governança sugerida: reduzir fan-out de delegações simultâneas e documentar decisões em trilhas já existentes — sem execução automática.",
    ],
    references: rows.slice(0, 6).map((r) => ({ kind: "operational_memory", id: r.id })),
  };
}

function analyzeIneffectiveEscalations(
  insights: OperationalMemoryInsight[],
  dismissedRatio: number | null,
): OperationalPolicyFinding | null {
  const recOut = insights.filter((i) => i.memoryKind === "recommendation_outcome");
  const low = recOut.filter((i) => (i.effectivenessScore ?? 0.55) < 0.35).length;
  const ratioBad = recOut.length ? low / recOut.length : 0;
  const dr = dismissedRatio ?? 0;
  if (dr < 0.28 && ratioBad < 0.22) return null;
  const severity = dr >= 0.42 || ratioBad >= 0.35 ? "warning" : "info";
  return {
    code: "ineffective_escalations",
    severity,
    headline: "Escalonamentos / recomendações pouco efetivos",
    narrative: [
      dismissedRatio != null
        ? `Taxa de dismiss no overlay humano ≈ ${(dismissedRatio * 100).toFixed(0)}%.`
        : "Overlay de feedback não forneceu taxa de dismiss — usando apenas memória de outcomes.",
      recOut.length
        ? `${recOut.length} outcome(s) de recomendação; ${low} com effectiveness muito baixa na amostra.`
        : "Sem outcomes de recomendação recentes na memória — sinal fraco, útil como label futuro.",
    ],
    references: recOut.slice(0, 6).map((r) => ({ kind: "operational_memory", id: r.id })),
  };
}

function findingToRecommendation(
  f: OperationalPolicyFinding,
): OperationalPolicyGovernanceRecommendationDraft | null {
  const memIds = f.references.filter((r) => r.kind === "operational_memory").map((r) => r.id);
  const orchIds = f.references
    .filter((r) => r.kind === "operational_memory")
    .map((r) => r.id)
    .slice(0, 4);
  const baseExplain = (
    title: string,
    detail: string,
    kind: OperationalPolicyGovernanceRecommendationDraft["recommendationKind"],
  ) => {
    const fp = `${kind}::${f.code}::${title}`;
    return {
      recommendationKind: kind,
      title,
      detail,
      explainability: {
        policyRationale: [
          ...f.narrative,
          "Todas as alterações exigem aprovação humana explícita fora deste motor.",
        ],
        historicalRefs: {
          memoryEntryIds: memIds.slice(0, 12),
          note: "Amostra limitada à janela recente de memória operacional.",
        },
        rollbackRefs: {
          subjectIds: f.code === "rollback_recurrence" ? memIds.slice(0, 8) : [],
          note:
            f.code === "rollback_recurrence"
              ? "Referências apontam entradas de memória ligadas a rollback."
              : "Sem foco específico em rollback para esta sugestão.",
        },
        orchestrationRefs: {
          subjectIds: f.code === "orchestration_bottleneck" ? orchIds : [],
          note:
            f.code === "orchestration_bottleneck"
              ? "Telemetria de orquestração vinculada às entradas de memória listadas."
              : "Impacto orquestral indireto — revisar gates se aplicável ao contexto.",
        },
        governanceNarrative: [f.headline, `Severidade detectada: ${f.severity}.`],
        adjustmentExplainability: [
          "Sugestão derivada de heurísticas determinísticas sobre memória + sinais adaptativos já materializados.",
          "Não altera pesos nem políticas persistidas — apenas documenta intenção supervisionada.",
        ],
      },
      suggestionFingerprint: fp,
    } satisfies OperationalPolicyGovernanceRecommendationDraft;
  };

  switch (f.code) {
    case "rollback_recurrence":
      return baseExplain(
        "Revisar limites de rollback e confirmação",
        "Aumentar checkpoints humanos antes de passos irreversíveis e documentar critérios de rollback por tipo de fluxo.",
        "adaptive_boundary",
      );
    case "ineffective_escalations":
      return baseExplain(
        "Calibrar políticas de escalação assistida",
        "Reduzir ruído de escalações automáticas sugeridas e alinhar mensagens ao estado real de cobertura.",
        "escalation_tuning",
      );
    case "orchestration_bottleneck":
      return baseExplain(
        "Rebalancear gates do DAG supervisionado",
        "Rever ordem de proposal_gate / sandbox / execução onde há bloqueios recorrentes; manter simulação obrigatória.",
        "orchestration_policy",
      );
    case "coordination_overload":
      return baseExplain(
        "Fortalecer governança de ciclos multi-agente",
        "Limitar concorrência de superfícies ativas e exigir registro explícito de conflitos antes de novo ciclo.",
        "coordination_governance",
      );
    case "ineffective_thresholds":
      return baseExplain(
        "Ajustar thresholds de alerta e priorização",
        "Rever limites de alertas críticos e janelas de confirmação para reduzir falsos positivos sem relaxar segurança.",
        "threshold_tuning",
      );
    case "adaptation_instability":
      return baseExplain(
        "Congelar expansão adaptativa até revisão humana",
        "Manter pesos dentro dos boundaries atuais; priorizar revisão de dados de entrada antes de novos nudges.",
        "adaptive_boundary",
      );
    default:
      return null;
  }
}

export function buildOperationalPolicyIntelligenceResult(
  input: PolicyIntelligenceEngineInput,
): OperationalPolicyIntelligenceEngineResult {
  const findings: OperationalPolicyFinding[] = [];
  const push = (x: OperationalPolicyFinding | null) => {
    if (x) findings.push(x);
  };

  push(analyzeRollbackPatterns(input.insights));
  push(analyzeIneffectiveEscalations(input.insights, input.feedbackDismissedRatio));
  push(analyzeOrchestrationPolicies(input.insights));
  push(analyzeCoordinationOverload(input.insights));
  push(evaluateIneffectiveThresholds(input.adaptiveSignals));
  push(evaluateAdaptiveGovernanceStress(input.adaptiveSignals));

  const governanceNarrative = buildGovernanceNarrative(findings);

  const bySev = (a: OperationalPolicyFinding, b: OperationalPolicyFinding) => {
    const r = (s: OperationalPolicyFinding["severity"]) =>
      s === "critical" ? 0 : s === "warning" ? 1 : 2;
    return r(a.severity) - r(b.severity);
  };
  const sorted = [...findings].sort(bySev);

  const recommendations: OperationalPolicyGovernanceRecommendationDraft[] = [];
  const seen = new Set<string>();
  for (const f of sorted) {
    const draft = findingToRecommendation(f);
    if (!draft) continue;
    const key = draft.suggestionFingerprint;
    if (seen.has(key)) continue;
    seen.add(key);
    recommendations.push(draft);
    if (recommendations.length >= 6) break;
  }

  const signalDigest: Record<string, number | string | string[]> = {
    memorySampleSize: input.insights.length,
    adaptiveSampleSize: input.adaptiveSignals.sampleSize,
    rollbackFrequency: input.adaptiveSignals.rollbackFrequency,
    recommendationEffectiveness: input.adaptiveSignals.recommendationEffectiveness ?? -1,
    orchestrationOutcomes: input.adaptiveSignals.orchestrationOutcomes ?? -1,
    coordinationEffectiveness: input.adaptiveSignals.coordinationEffectiveness ?? -1,
    feedbackDismissedRatio: input.feedbackDismissedRatio ?? -1,
    adaptiveNotes: input.adaptiveSignals.sampleNotes,
  };

  return { findings, recommendations, signalDigest, governanceNarrative };
}
