/**
 * Modelos canônicos estruturais do Enterprise Reconciliation Runtime — C-09 / ECS-01.
 *
 * Foundation estrutural vendor-agnostic para reconciliação corporativa futura.
 *
 * Sem reconciliação funcional. Sem matching automático. Sem resolução de conflitos.
 * Sem comparação entre documentos. Sem processamento XML/SOAP. Sem banco.
 * Sem alteração de status. Sem workflow. Sem IA. Sem APIs. Sem filas.
 *
 * RECONCILIATION IS DETERMINISTIC (Regra Permanente nº 16).
 * STATE MACHINE FIRST (Regra Permanente nº 11).
 * CORRELATION BEFORE PROCESSING (Regra Permanente nº 14).
 */

import type { OperatorCapabilityProfile } from "../../operator-runtime/ports/canonical";
import type { AuthorizationStrategy } from "../../authorization-runtime/ports/canonical";
import type { AuthorizationPolicy } from "../../authorization-runtime/ports/canonical";
import type { BatchManifest } from "../../batch-runtime/ports/canonical";
import type { ProtocolProfile } from "../../protocol-runtime/ports/canonical";
import type { ReturnManifest } from "../../return-runtime/ports/canonical";
import type { AuditResult } from "../../audit-runtime/ports/canonical";

export type {
  OperatorCapabilityProfile,
  AuthorizationStrategy,
  AuthorizationPolicy,
  BatchManifest,
  ProtocolProfile,
  ReturnManifest,
  AuditResult,
};

/**
 * Estados canônicos da reconciliação (C-09 / RULE_11 + RULE_16).
 * Somente declaração — sem transições funcionais.
 */
export type ReconciliationState =
  | "PENDING"
  | "CORRELATED"
  | "RECONCILING"
  | "RECONCILED"
  | "PARTIALLY_RECONCILED"
  | "CONFLICT"
  | "FAILED"
  | "CANCELLED";

/** Lista oficial imutável dos estados canônicos. */
export const RECONCILIATION_CANONICAL_STATES: readonly ReconciliationState[] = [
  "PENDING",
  "CORRELATED",
  "RECONCILING",
  "RECONCILED",
  "PARTIALLY_RECONCILED",
  "CONFLICT",
  "FAILED",
  "CANCELLED",
] as const;

/**
 * ReconciliationStateMachine canônica (C-09 / RULE_11).
 * Representa apenas os estados. Nenhuma transição implementada.
 */
export type ReconciliationStateMachine = {
  kind: "canonical-reconciliation-state-machine";
  states: readonly ReconciliationState[];
  /** Sempre false — nenhuma transição funcional nesta Sprint. */
  transitionsImplemented: false;
  /** Sempre false — máquina apenas declarativa. */
  stateMachineImplemented: false;
  reconciliationImplemented: false;
  conflictResolutionImplemented: false;
  automaticMatchingImplemented: false;
  workflowIntegrationImplemented: false;
};

/**
 * Envelope operacional estrutural (Regra Permanente nº 4 — Observability by Design).
 * Somente contrato — sem telemetria / tracing / logging funcional.
 *
 * ReconciliationContext prevê: operationId, transactionId, correlationId,
 * startedAt, finishedAt, executionStatus, executionDuration, warnings,
 * errors, traceMetadata.
 */
export type ReconciliationRuntimeObservabilityEnvelope = {
  operationId?: string;
  transactionId?: string | null;
  correlationId?: string | null;
  startedAt?: string;
  finishedAt?: string;
  executionStatus?: ReconciliationState | (string & {});
  executionDuration?: number;
  warnings?: readonly string[];
  errors?: readonly string[];
  traceMetadata?: Readonly<Record<string, unknown>>;
};

/** Metadados estruturais da reconciliação (somente contrato). */
export type ReconciliationMetadata = {
  kind: "canonical-reconciliation-metadata";
  notes?: string;
  attributes?: Readonly<Record<string, unknown>>;
  reconciliationMetadataImplemented: false;
};

/**
 * Capacidades canônicas declaradas do Reconciliation Runtime.
 * Todas as flags `*Implemented` permanecem literalmente `false`.
 */
export type ReconciliationCapabilities = {
  kind: "canonical-reconciliation-capabilities";
  supportsPrepareReconciliation: boolean;
  supportsGetReconciliation: boolean;
  supportsListReconciliations: boolean;
  supportsCorrelateReconciliation: boolean;
  supportsStats: boolean;
  supportsHealth: boolean;
  supportsCanonicalReconciliationManifest: boolean;
  supportsCanonicalReconciliationResult: boolean;
  supportsReconciliationCorrelation: boolean;
  supportsReconciliationStateMachine: boolean;
  runtimeReady: true;
  reconciliationImplemented: false;
  conflictResolutionImplemented: false;
  automaticMatchingImplemented: false;
  workflowIntegrationImplemented: false;
};

/**
 * ReconciliationPolicy canônica (somente contrato).
 * Sem reconciliação funcional / sem matching / sem resolução de conflitos.
 */
export type ReconciliationPolicy = {
  kind: "canonical-reconciliation-policy";
  policyId?: string;
  name?: string;
  notes?: string;
  reconciliationPolicyImplemented: false;
  reconciliationImplemented: false;
  conflictResolutionImplemented: false;
  automaticMatchingImplemented: false;
  workflowIntegrationImplemented: false;
};

/** Estatísticas estruturais do Reconciliation Runtime (in-process). */
export type ReconciliationStatistics = {
  kind: "canonical-reconciliation-statistics";
  totalManifests: number;
  totalContexts: number;
  totalCorrelations: number;
  totalResults: number;
  pendingCount: number;
  correlatedCount: number;
  reconcilingCount: number;
  reconciledCount: number;
  partiallyReconciledCount: number;
  conflictCount: number;
  failedCount: number;
  cancelledCount: number;
  reconciliationImplementedCount: 0;
  conflictResolutionImplementedCount: 0;
  automaticMatchingImplementedCount: 0;
  workflowIntegrationImplementedCount: 0;
};

/** Saúde canônica estrutural do provedor Reconciliation Runtime. */
export type ReconciliationHealth = {
  kind: "canonical-reconciliation-health";
  ok: boolean;
  provider: string;
  latencyMs?: number;
  message?: string;
  status?: string;
  storedManifestCount?: number;
  storedContextCount?: number;
  storedCorrelationCount?: number;
  storedResultCount?: number;
  returnRuntimeOk?: boolean;
  protocolRuntimeOk?: boolean;
  batchRuntimeOk?: boolean;
  authorizationRuntimeOk?: boolean;
  operatorRuntimeOk?: boolean;
  auditRuntimeOk?: boolean;
  /** Workflow Runtime futuro — shape-check apenas quando disponível. */
  workflowRuntimeOk?: boolean;
  runtimeReady: true;
  reconciliationImplemented: false;
  conflictResolutionImplemented: false;
  automaticMatchingImplemented: false;
  workflowIntegrationImplemented: false;
};

/**
 * ReconciliationCorrelation canônica (C-09 / RULE_14).
 * Mecanismo de correlação — contrato apenas. Sem lógica funcional.
 */
export type ReconciliationCorrelation = {
  kind: "canonical-reconciliation-correlation";
  correlationId?: string;
  transactionId?: string;
  batchId?: string;
  operatorId?: string;
  returnId?: string;
  documentId?: string;
  correlationStrategy?: string;
  correlationConfidence?: number;
  matchedEntities?: readonly string[];
  notes?: string;
  automaticMatchingImplemented: false;
  reconciliationImplemented: false;
  conflictResolutionImplemented: false;
  workflowIntegrationImplemented: false;
};

/**
 * ReconciliationDifference canônica (somente contrato).
 * Sem comparação funcional entre documentos.
 */
export type ReconciliationDifference = {
  kind: "canonical-reconciliation-difference";
  differenceId?: string;
  field?: string;
  expectedValue?: unknown;
  actualValue?: unknown;
  severity?: string;
  notes?: string;
  reconciliationImplemented: false;
  automaticMatchingImplemented: false;
};

/**
 * ReconciliationConflict canônica (somente contrato).
 * Sem resolução automática de conflitos.
 */
export type ReconciliationConflict = {
  kind: "canonical-reconciliation-conflict";
  conflictId?: string;
  conflictType?: string;
  documentIds?: readonly string[];
  description?: string;
  notes?: string;
  conflictResolutionImplemented: false;
  reconciliationImplemented: false;
  automaticMatchingImplemented: false;
};

/**
 * CanonicalReconciliationResult (C-09).
 * Contrato canônico exclusivo — sem qualquer implementação funcional.
 *
 * Campos obrigatórios do contrato:
 *   transactionId · batchId · operatorId · matchedDocuments ·
 *   unmatchedDocuments · conflicts · differences · pendingItems ·
 *   statistics · recommendations · auditReference · metadata
 */
export type CanonicalReconciliationResult = {
  kind: "canonical-reconciliation-result";
  transactionId?: string;
  batchId?: string;
  operatorId?: string;
  matchedDocuments?: readonly string[];
  unmatchedDocuments?: readonly string[];
  conflicts?: readonly ReconciliationConflict[];
  differences?: readonly ReconciliationDifference[];
  pendingItems?: readonly string[];
  statistics?: ReconciliationStatistics;
  recommendations?: readonly string[];
  auditReference?: string;
  metadata?: ReconciliationMetadata;
  /** Sempre false — nenhuma reconciliação funcional nesta Sprint. */
  reconciliationImplemented: false;
  conflictResolutionImplemented: false;
  automaticMatchingImplemented: false;
  workflowIntegrationImplemented: false;
};

/**
 * ReconciliationManifest canônico (C-09).
 * Contrato canônico da reconciliação corporativa.
 * Sem qualquer lógica funcional.
 */
export type ReconciliationManifest = {
  kind: "canonical-reconciliation-manifest";
  reconciliationId?: string;
  transactionId?: string;
  batchId?: string;
  operatorId?: string;
  correlationId?: string;
  returnId?: string;
  protocolId?: string;
  receivedAt?: string;
  state?: ReconciliationState;
  stateMachine?: ReconciliationStateMachine;
  metadata?: ReconciliationMetadata;
  reconciliationPolicy?: ReconciliationPolicy;
  correlation?: ReconciliationCorrelation;
  result?: CanonicalReconciliationResult;
  statistics?: ReconciliationStatistics;
  requiredCapabilities?: ReconciliationCapabilities;
  operatorProfile?: OperatorCapabilityProfile;
  authorizationStrategy?: AuthorizationStrategy;
  authorizationPolicy?: AuthorizationPolicy;
  batchManifest?: BatchManifest;
  protocolProfile?: ProtocolProfile;
  returnManifest?: ReturnManifest;
  auditResult?: AuditResult;
  tags?: readonly string[];
  owner?: string;
  structuralNotes?: string;
  reconciliationImplemented: false;
  conflictResolutionImplemented: false;
  automaticMatchingImplemented: false;
  workflowIntegrationImplemented: false;
};

/**
 * ReconciliationContext canônico (C-09).
 * Aceita peers estruturais por contrato — sem qualquer processamento.
 * Prevê envelope de observabilidade (RULE_04) — sem implementação.
 */
export type ReconciliationContext = ReconciliationRuntimeObservabilityEnvelope & {
  kind: "canonical-reconciliation-context";
  contextId?: string;
  reconciliationId?: string;
  transactionId?: string;
  manifest?: ReconciliationManifest;
  correlation?: ReconciliationCorrelation;
  result?: CanonicalReconciliationResult;
  state?: ReconciliationState;
  stateMachine?: ReconciliationStateMachine;
  operatorProfile?: OperatorCapabilityProfile;
  authorizationStrategy?: AuthorizationStrategy;
  authorizationPolicy?: AuthorizationPolicy;
  batchManifest?: BatchManifest;
  protocolProfile?: ProtocolProfile;
  returnManifest?: ReturnManifest;
  auditResult?: AuditResult;
  metadata?: ReconciliationMetadata;
  structuralNotes?: string;
};

/** Helper estrutural — cria máquina de estados declarativa (sem transições). */
export function createEmptyReconciliationStateMachine(
  overrides: Partial<ReconciliationStateMachine> = {},
): ReconciliationStateMachine {
  return {
    kind: "canonical-reconciliation-state-machine",
    states: overrides.states ?? RECONCILIATION_CANONICAL_STATES,
    transitionsImplemented: false,
    stateMachineImplemented: false,
    reconciliationImplemented: false,
    conflictResolutionImplemented: false,
    automaticMatchingImplemented: false,
    workflowIntegrationImplemented: false,
  };
}

/** Helper estrutural — cria política vazia/desabilitada. */
export function createEmptyReconciliationPolicy(
  overrides: Partial<ReconciliationPolicy> = {},
): ReconciliationPolicy {
  return {
    kind: "canonical-reconciliation-policy",
    policyId: overrides.policyId,
    name: overrides.name,
    notes:
      overrides.notes ??
      "Structural reconciliation policy contract (no functional reconciliation — RULE_16)",
    reconciliationPolicyImplemented: false,
    reconciliationImplemented: false,
    conflictResolutionImplemented: false,
    automaticMatchingImplemented: false,
    workflowIntegrationImplemented: false,
  };
}

/** Helper estrutural — cria correlação declarativa (sem matching automático). */
export function createEmptyReconciliationCorrelation(
  overrides: Partial<ReconciliationCorrelation> = {},
): ReconciliationCorrelation {
  return {
    kind: "canonical-reconciliation-correlation",
    correlationId: overrides.correlationId,
    transactionId: overrides.transactionId,
    batchId: overrides.batchId,
    operatorId: overrides.operatorId,
    returnId: overrides.returnId,
    documentId: overrides.documentId,
    correlationStrategy: overrides.correlationStrategy,
    correlationConfidence: overrides.correlationConfidence,
    matchedEntities: overrides.matchedEntities ?? [],
    notes:
      overrides.notes ??
      "Structural ReconciliationCorrelation contract (RULE_14 — no automatic matching)",
    automaticMatchingImplemented: false,
    reconciliationImplemented: false,
    conflictResolutionImplemented: false,
    workflowIntegrationImplemented: false,
  };
}

/** Helper estrutural — cria diferença declarativa (sem comparação funcional). */
export function createEmptyReconciliationDifference(
  overrides: Partial<ReconciliationDifference> = {},
): ReconciliationDifference {
  return {
    kind: "canonical-reconciliation-difference",
    differenceId: overrides.differenceId,
    field: overrides.field,
    expectedValue: overrides.expectedValue,
    actualValue: overrides.actualValue,
    severity: overrides.severity,
    notes: overrides.notes ?? "Structural ReconciliationDifference contract (no comparison)",
    reconciliationImplemented: false,
    automaticMatchingImplemented: false,
  };
}

/** Helper estrutural — cria conflito declarativo (sem resolução automática). */
export function createEmptyReconciliationConflict(
  overrides: Partial<ReconciliationConflict> = {},
): ReconciliationConflict {
  return {
    kind: "canonical-reconciliation-conflict",
    conflictId: overrides.conflictId,
    conflictType: overrides.conflictType,
    documentIds: overrides.documentIds ?? [],
    description: overrides.description,
    notes: overrides.notes ?? "Structural ReconciliationConflict contract (no resolution)",
    conflictResolutionImplemented: false,
    reconciliationImplemented: false,
    automaticMatchingImplemented: false,
  };
}

/** Helper estrutural — cria capacidades canônicas com flags literais false. */
export function createEmptyReconciliationCapabilities(
  overrides: Partial<ReconciliationCapabilities> = {},
): ReconciliationCapabilities {
  return {
    kind: "canonical-reconciliation-capabilities",
    supportsPrepareReconciliation: overrides.supportsPrepareReconciliation ?? true,
    supportsGetReconciliation: overrides.supportsGetReconciliation ?? true,
    supportsListReconciliations: overrides.supportsListReconciliations ?? true,
    supportsCorrelateReconciliation: overrides.supportsCorrelateReconciliation ?? true,
    supportsStats: overrides.supportsStats ?? true,
    supportsHealth: overrides.supportsHealth ?? true,
    supportsCanonicalReconciliationManifest:
      overrides.supportsCanonicalReconciliationManifest ?? true,
    supportsCanonicalReconciliationResult: overrides.supportsCanonicalReconciliationResult ?? true,
    supportsReconciliationCorrelation: overrides.supportsReconciliationCorrelation ?? true,
    supportsReconciliationStateMachine: overrides.supportsReconciliationStateMachine ?? true,
    runtimeReady: true,
    reconciliationImplemented: false,
    conflictResolutionImplemented: false,
    automaticMatchingImplemented: false,
    workflowIntegrationImplemented: false,
  };
}

/**
 * Helper estrutural — cria CanonicalReconciliationResult vazio.
 * Sem matchedDocuments / conflicts / differences funcionais.
 */
export function createEmptyCanonicalReconciliationResult(
  overrides: Partial<CanonicalReconciliationResult> = {},
): CanonicalReconciliationResult {
  return {
    kind: "canonical-reconciliation-result",
    transactionId: overrides.transactionId,
    batchId: overrides.batchId,
    operatorId: overrides.operatorId,
    matchedDocuments: overrides.matchedDocuments ?? [],
    unmatchedDocuments: overrides.unmatchedDocuments ?? [],
    conflicts: overrides.conflicts ?? [],
    differences: overrides.differences ?? [],
    pendingItems: overrides.pendingItems ?? [],
    statistics: overrides.statistics,
    recommendations: overrides.recommendations ?? [],
    auditReference: overrides.auditReference,
    metadata: overrides.metadata ?? {
      kind: "canonical-reconciliation-metadata",
      reconciliationMetadataImplemented: false,
    },
    reconciliationImplemented: false,
    conflictResolutionImplemented: false,
    automaticMatchingImplemented: false,
    workflowIntegrationImplemented: false,
  };
}

/** Helper estrutural — cria manifesto vazio no estado PENDING. */
export function createEmptyReconciliationManifest(
  overrides: Partial<ReconciliationManifest> = {},
): ReconciliationManifest {
  return {
    kind: "canonical-reconciliation-manifest",
    reconciliationId: overrides.reconciliationId,
    transactionId: overrides.transactionId,
    batchId: overrides.batchId,
    operatorId: overrides.operatorId,
    correlationId: overrides.correlationId,
    returnId: overrides.returnId,
    protocolId: overrides.protocolId,
    receivedAt: overrides.receivedAt,
    state: overrides.state ?? "PENDING",
    stateMachine: overrides.stateMachine ?? createEmptyReconciliationStateMachine(),
    metadata: overrides.metadata ?? {
      kind: "canonical-reconciliation-metadata",
      reconciliationMetadataImplemented: false,
    },
    reconciliationPolicy: overrides.reconciliationPolicy ?? createEmptyReconciliationPolicy(),
    correlation: overrides.correlation,
    result: overrides.result,
    statistics: overrides.statistics,
    requiredCapabilities: overrides.requiredCapabilities ?? createEmptyReconciliationCapabilities(),
    operatorProfile: overrides.operatorProfile,
    authorizationStrategy: overrides.authorizationStrategy,
    authorizationPolicy: overrides.authorizationPolicy,
    batchManifest: overrides.batchManifest,
    protocolProfile: overrides.protocolProfile,
    returnManifest: overrides.returnManifest,
    auditResult: overrides.auditResult,
    tags: overrides.tags ?? [],
    owner: overrides.owner,
    structuralNotes:
      overrides.structuralNotes ??
      "Structural ReconciliationManifest contract (RULE_16 — deterministic reconciliation foundation; no functional reconciliation)",
    reconciliationImplemented: false,
    conflictResolutionImplemented: false,
    automaticMatchingImplemented: false,
    workflowIntegrationImplemented: false,
  };
}
