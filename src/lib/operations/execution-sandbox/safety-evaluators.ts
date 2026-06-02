/**
 * Avaliadores de segurança operacional do sandbox.
 *
 * Combinam policy checks determinísticos para decidir entre:
 *   simulated → safe → risky → blocked.
 *
 * Importante: o resultado NÃO autoriza execução real — apenas indica que a
 * simulação atende às políticas mínimas para ser apresentada ao coordenador.
 */
import type { OperationalActionProposalDto } from "@/lib/operations/action-proposals";
import type { OperationalCommandCenterSnapshot } from "@/lib/operations/api/queries/command-center";
import { severityRank } from "@/lib/operations/execution-sandbox/impact-analyzers";
import {
  policyCheck,
  summarizeProposalReferences,
} from "@/lib/operations/execution-sandbox/simulation-validators";
import type {
  ExecutionSafetyEvaluation,
  ImpactAnalysis,
  OperationalSimulationBlockReason,
  PolicyCheckResult,
  ProjectedConflict,
  SimulatedMutation,
} from "@/lib/operations/execution-sandbox/types";

const MIN_REFERENCES_FOR_SAFE = 2;
const MAX_MUTATIONS_FOR_SAFE = 6;

/** Avalia segurança final consolidando checks individuais + análise de impacto. */
export function evaluateExecutionSafety(input: {
  proposal: OperationalActionProposalDto;
  snapshot: OperationalCommandCenterSnapshot;
  impact: ImpactAnalysis;
  mutations: readonly SimulatedMutation[];
  preBlock?: { reason: OperationalSimulationBlockReason; detail: string } | null;
}): ExecutionSafetyEvaluation {
  const checks: PolicyCheckResult[] = [];

  if (input.preBlock) {
    checks.push(
      policyCheck("preflight_block", "Pré-condições de simulação", "fail", input.preBlock.detail),
    );
    return {
      state: "blocked",
      blockReason: input.preBlock.reason,
      rationale: [input.preBlock.detail],
      policyChecks: checks,
    };
  }

  const refSummary = summarizeProposalReferences(input.proposal);
  checks.push(
    refSummary.total >= MIN_REFERENCES_FOR_SAFE
      ? policyCheck(
          "explainability_refs",
          "Proveniência mínima",
          "pass",
          `${refSummary.total} referência(s) (${Object.keys(refSummary.byKind).join(", ")}).`,
        )
      : policyCheck(
          "explainability_refs",
          "Proveniência mínima",
          "warn",
          "Menos de 2 referências explicáveis vinculadas à proposta.",
        ),
  );

  checks.push(
    input.mutations.length <= MAX_MUTATIONS_FOR_SAFE
      ? policyCheck(
          "mutation_budget",
          "Orçamento de mutações simuladas",
          "pass",
          `${input.mutations.length} mutações projetadas (limite ${MAX_MUTATIONS_FOR_SAFE}).`,
        )
      : policyCheck(
          "mutation_budget",
          "Orçamento de mutações simuladas",
          "warn",
          `Proposta projeta ${input.mutations.length} mutações — revisar granularidade.`,
        ),
  );

  const hardConflicts = input.impact.projectedConflicts.filter(
    (c: ProjectedConflict) => c.kind === "tenant_mismatch" || c.kind === "policy_violation",
  );
  checks.push(
    hardConflicts.length === 0
      ? policyCheck(
          "hard_conflicts",
          "Conflitos bloqueantes",
          "pass",
          "Nenhum conflito de RBAC, tenant ou política identificado.",
        )
      : policyCheck(
          "hard_conflicts",
          "Conflitos bloqueantes",
          "fail",
          hardConflicts
            .map((c) => c.description)
            .join(" · ")
            .slice(0, 400),
        ),
  );

  const softConflictsSeverity = input.impact.projectedConflicts
    .map((c) => severityRank(c.severity))
    .reduce((max, r) => (r > max ? r : max), -1);
  checks.push(
    softConflictsSeverity < 3 /* < high */
      ? policyCheck(
          "soft_conflicts",
          "Conflitos operacionais leves",
          "pass",
          "Sem conflitos operacionais de alto impacto previstos.",
        )
      : policyCheck(
          "soft_conflicts",
          "Conflitos operacionais leves",
          "warn",
          "Conflitos de alto impacto projetados — coordenador deve revisar.",
        ),
  );

  checks.push(
    isFreshSnapshot(input.snapshot.asOf)
      ? policyCheck(
          "fresh_snapshot",
          "Snapshot recente",
          "pass",
          "Snapshot do command center utilizado é recente.",
        )
      : policyCheck(
          "fresh_snapshot",
          "Snapshot recente",
          "warn",
          "Snapshot pode estar defasado (>10 minutos).",
        ),
  );

  const failCount = checks.filter((c) => c.status === "fail").length;
  const warnCount = checks.filter((c) => c.status === "warn").length;

  if (failCount > 0) {
    return {
      state: "blocked",
      blockReason: "policy_rejected",
      rationale: checks.filter((c) => c.status === "fail").map((c) => `${c.label}: ${c.detail}`),
      policyChecks: checks,
    };
  }

  // Risco crítico no impacto bloqueia, mesmo sem fail puro.
  if (input.impact.overallSeverity === "critical") {
    return {
      state: "risky",
      rationale: ["Severidade geral projetada é crítica — manter como rascunho até nova checagem."],
      policyChecks: checks,
    };
  }

  if (warnCount === 0 && input.impact.overallSeverity !== "high") {
    return {
      state: "safe",
      rationale: ["Todos os checks passaram e impacto previsto está dentro de margens razoáveis."],
      policyChecks: checks,
    };
  }

  if (warnCount > 0 || input.impact.overallSeverity === "high") {
    return {
      state: "risky",
      rationale: [
        warnCount > 0
          ? `${warnCount} aviso(s) de policy — revisar antes de aprovar.`
          : "Impacto projetado classificado como alto — recomenda revisão humana extra.",
      ],
      policyChecks: checks,
    };
  }

  return {
    state: "simulated",
    rationale: ["Simulação concluída — pendente classificação de segurança final."],
    policyChecks: checks,
  };
}

function isFreshSnapshot(asOfIso: string, maxAgeMs = 10 * 60 * 1000): boolean {
  const t = Date.parse(asOfIso);
  if (!Number.isFinite(t)) return false;
  return Date.now() - t <= maxAgeMs;
}
