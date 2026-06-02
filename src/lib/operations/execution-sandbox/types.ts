/**
 * Tipos da camada de **execução sandbox** operacional (dry-run only).
 *
 * Nada nesta camada altera dados reais. Apenas:
 *  - simula mutações operacionais (assignments, staffing, escalation, etc.);
 *  - prevê o impacto projetado (scores, forecast, entidades afetadas);
 *  - gera um rollback preview (passo a passo reverso, ainda hipotético);
 *  - avalia segurança (`safe`/`risky`/`blocked`) com rationale auditável.
 *
 * Toda saída é determinística, derivada do snapshot operacional já materializado
 * (command center + scoring + recomendações). Não consulta analytics extras.
 */
import type { OperationalActionKind, OperationalActionProposalState } from "@/lib/database.types";
import type {
  OperationalForecastProjection,
  OperationalRecommendationBundle,
} from "@/lib/operations/recommendations/types";
import type { OperationalHealthState, OperationalScoreId } from "@/lib/operations/scoring/types";
import type { OperationalProposalReference } from "@/lib/operations/action-proposals";

/** Versão estável do schema do sandbox (telemetria + persistência audit). */
export const OPERATIONAL_EXECUTION_SANDBOX_SCHEMA_VERSION = "1.0.0";

/** Estados de execução simulada (camada fria — sem mutation real). */
export const OPERATIONAL_SIMULATION_STATES = ["simulated", "safe", "risky", "blocked"] as const;
export type OperationalSimulationState = (typeof OPERATIONAL_SIMULATION_STATES)[number];

/** Categoria do bloqueio quando o sandbox rejeita a simulação. */
export const OPERATIONAL_SIMULATION_BLOCK_REASONS = [
  "missing_payload",
  "invalid_proposal_state",
  "expired_proposal",
  "rbac_denied",
  "unsupported_action_kind",
  "policy_rejected",
] as const;

export type OperationalSimulationBlockReason =
  (typeof OPERATIONAL_SIMULATION_BLOCK_REASONS)[number];

/** Nível semântico do impacto projetado. */
export type OperationalImpactSeverity = "none" | "low" | "moderate" | "high" | "critical";

/** Tipo de entidade afetada (mesmo vocabulário da timeline). */
export type AffectedEntityKind =
  | "shift"
  | "shift_assignment"
  | "shift_swap_request"
  | "professional"
  | "schedule"
  | "department";

/** Direção da mutação prevista — útil para rollback preview reverso. */
export type SimulatedMutationDirection = "create" | "update" | "soft_cancel" | "notify";

/** Valor serializável simples para `projectedPatch` (sem `unknown`). */
export type SimulatedPatchValue = string | number | boolean | null;

/** Mutação simulada (sem efeito colateral, apenas descritor). */
export type SimulatedMutation = {
  /** ID estável para correlacionar com o rollback preview. */
  id: string;
  direction: SimulatedMutationDirection;
  /** Tabela alvo planejada (informativa — não é gravada). */
  targetTable: "shift_assignments" | "shifts" | "shift_swap_requests" | "operational_events";
  /** Descrição curta e legível por humanos. */
  describe: string;
  /** Patch projetado (campos lógicos; pode estar parcialmente vazio em simulações coarse). */
  projectedPatch?: Record<string, SimulatedPatchValue>;
  /** Entidades referenciadas pela mutação. */
  referencesEntityIds: string[];
};

/** Item de rollback preview — passo reverso hipotético. */
export type RollbackPreviewStep = {
  /** Correlaciona com `SimulatedMutation.id`. */
  mutationId: string;
  /** Descrição reversa (ex.: "Cancelar atribuição criada"). */
  describe: string;
  /** Direção reversa correspondente. */
  inverseDirection: SimulatedMutationDirection;
  /** Marca se é seguramente reversível por uma operação simples. */
  trivialReverse: boolean;
};

/** Entidade afetada na simulação (granular para UI). */
export type AffectedEntity = {
  kind: AffectedEntityKind;
  id: string;
  /** Rótulo curto para UI (ex.: "Plantão 09/06 07:00 · UTI"). */
  label: string;
  impactSeverity: OperationalImpactSeverity;
  /** Tags semânticas (ex.: "coverage_uplift", "conflict_resolution"). */
  tags: string[];
};

/** Projeção de mudança nos scores operacionais (delta hipotético, conservador). */
export type ProjectedScoreChange = {
  scoreId: OperationalScoreId;
  /** Direção esperada (positiva = score sobe; interpretação fica com a UI). */
  projectedDeltaPoints: number;
  /** Confiança qualitativa do delta — sempre baixa/moderada no sandbox heurístico. */
  confidence: "low" | "moderate";
  rationale: string;
};

/** Projeção sobre forecast (sem reexecutar o motor). */
export type ProjectedForecastChange = {
  /** Projeção antes da simulação. */
  before: OperationalForecastProjection;
  /** Projeção projetada após o dry-run. */
  after: OperationalForecastProjection;
  rationale: string;
};

/** Conflitos potenciais identificados durante a simulação. */
export type ProjectedConflict = {
  kind:
    | "double_booking"
    | "tenant_mismatch"
    | "terminal_shift_state"
    | "missing_target"
    | "duplicate_pending"
    | "policy_violation";
  severity: OperationalImpactSeverity;
  description: string;
  affectedEntityId?: string;
};

/** Sumário executivo da simulação (UI / auditoria). */
export type ExecutionSummary = {
  headline: string;
  bullets: string[];
  /** Frases curtas tags (ex.: "no_assignment_mutation", "safe_to_review"). */
  semanticTags: string[];
};

/** Análise de impacto consolidada (estável para UI). */
export type ImpactAnalysis = {
  overallSeverity: OperationalImpactSeverity;
  /** Quantidade aproximada de entidades afetadas. */
  affectedEntityCount: number;
  affectedEntities: AffectedEntity[];
  projectedScoreChanges: ProjectedScoreChange[];
  projectedForecast: ProjectedForecastChange;
  projectedConflicts: ProjectedConflict[];
  /** Indicador agregado: piora/melhora estimada na saúde operacional. */
  projectedHealthStateAfter: OperationalHealthState;
};

/** Avaliação de segurança da execução (camada de safety). */
export type ExecutionSafetyEvaluation = {
  state: OperationalSimulationState;
  /** Quando `state = blocked`, contém a razão estruturada. */
  blockReason?: OperationalSimulationBlockReason;
  /** Frases curtas explicando porque está safe/risky/blocked. */
  rationale: string[];
  /** Lista de checks executados e seus resultados (auditável). */
  policyChecks: PolicyCheckResult[];
};

/** Resultado individual de policy/safety check. */
export type PolicyCheckResult = {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
};

/** Rationale completo de explicabilidade da simulação. */
export type SimulationExplainability = {
  schemaVersion: typeof OPERATIONAL_EXECUTION_SANDBOX_SCHEMA_VERSION;
  /** Sempre verdadeiro: sandbox é puramente determinístico. */
  deterministic: true;
  /** IDs/refs canônicos usados (espelha provenance do bundle de contexto). */
  references: OperationalProposalReference[];
  scoreReferences: OperationalScoreId[];
  /** Frases curtas em pt-BR para a UI. */
  narrative: string[];
};

/** Snapshot da proposta no momento da simulação (para auditoria). */
export type SimulatedProposalSnapshot = {
  id: string;
  actionKind: OperationalActionKind;
  state: OperationalActionProposalState;
  title: string;
  contextFingerprint: string | null;
};

/**
 * Resultado completo da simulação (cliente recebe esta estrutura por server fn).
 */
export type OperationalSimulationResult = {
  schemaVersion: typeof OPERATIONAL_EXECUTION_SANDBOX_SCHEMA_VERSION;
  /** ID simulado da execução (não persistido como mutation real). */
  simulationId: string;
  /**
   * ID da linha `operational_execution_sandbox_runs` após persistência (quando disponível).
   * Obrigatório para correlacionar execução supervisionada real ao dry-run auditado.
   */
  sandboxRunId?: string | null;
  simulatedAt: string;
  proposal: SimulatedProposalSnapshot;
  state: OperationalSimulationState;
  blockReason?: OperationalSimulationBlockReason;
  summary: ExecutionSummary;
  mutations: SimulatedMutation[];
  rollbackPreview: RollbackPreviewStep[];
  impact: ImpactAnalysis;
  safety: ExecutionSafetyEvaluation;
  explainability: SimulationExplainability;
  /** Resumo das recomendações que motivaram a proposta (para UI). */
  recommendationContext: {
    forecast: OperationalRecommendationBundle["forecast"];
    headline: string;
  };
};

/** Entrada principal para o sandbox (server-side). */
export type RunSimulationInput = {
  proposalId: string;
  /** Para evitar simulações gigantes — limita entidades afetadas listadas. */
  maxAffectedEntities?: number;
};
