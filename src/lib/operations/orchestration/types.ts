/**
 * Tipos da camada de orquestração operacional supervisionada.
 * Não modela autonomia: estados refletem ações humanas e políticas explícitas.
 */
import type {
  Json,
  OperationalOrchestrationState,
  OperationalOrchestrationStepKind,
  OperationalOrchestrationStepState,
} from "@/lib/database.types";

export type {
  OperationalOrchestrationState,
  OperationalOrchestrationStepKind,
  OperationalOrchestrationStepState,
};

export const ORCHESTRATION_SCHEMA_VERSION = "1.0.0";

export type OrchestrationChainItemInput = {
  proposalId: string;
  /**
   * Índice do item da cadeia (0-based) do qual este depende.
   * Default: item anterior (execução serial entre itens).
   */
  dependsOnItemIndex?: number | null;
  includeProposalGate?: boolean;
  includeSimulation?: boolean;
  includeExecution?: boolean;
};

export type CreateOperationalOrchestrationInput = {
  title: string;
  summary?: string;
  chain: OrchestrationChainItemInput[];
};

export type OrchestrationPolicyBundle = {
  maxChainItems: number;
  maxExpandedSteps: number;
  maxConcurrentActive: number;
  requireApprovedProposalForSimulation: boolean;
  requireSafeSimulationForExecution: boolean;
  /** Previne reutilizar a mesma proposta em dois passos distintos da mesma orquestração. */
  forbidDuplicateProposalsInPlan: boolean;
};

export type OrchestrationNarrativeEntry = {
  at: string;
  actorProfileId: string;
  phase: string;
  message: string;
  policyRefs?: string[];
  proposalId?: string;
  stepOrdinal?: number;
};

export type OrchestrationRollbackPlanItem = {
  stepOrdinal: number;
  proposalId: string;
  mutationExecutionId: string;
  /** Ordem sugerida de rollback (maior = mais recente na cadeia de execução). */
  rollbackPriority: number;
};

export type OperationalOrchestrationStepDto = {
  id: string;
  orchestrationId: string;
  ordinal: number;
  stepKind: OperationalOrchestrationStepKind;
  dependsOnOrdinals: number[];
  proposalId: string;
  stepState: OperationalOrchestrationStepState;
  sandboxRunId: string | null;
  mutationExecutionId: string | null;
  rationale: string;
  explainabilityJson: Json;
  policyRefsJson: Json;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OperationalOrchestrationDto = {
  id: string;
  tenantId: string;
  createdByProfileId: string;
  state: OperationalOrchestrationState;
  title: string;
  summary: string;
  narrativeJson: Json;
  policyBundleJson: Json;
  rollbackPreviewJson: Json;
  executionOrderJson: number[];
  approvedByProfileId: string | null;
  approvalNote: string | null;
  approvedAt: string | null;
  blockedReason: string | null;
  schemaVersion: string;
  createdAt: string;
  updatedAt: string;
  steps: OperationalOrchestrationStepDto[];
};

export type PlannedOrchestrationStep = {
  ordinal: number;
  stepKind: OperationalOrchestrationStepKind;
  dependsOnOrdinals: number[];
  proposalId: string;
  rationale: string;
};
