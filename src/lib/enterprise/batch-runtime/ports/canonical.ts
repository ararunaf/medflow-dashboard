/**
 * Modelos canônicos estruturais do Enterprise Batch Runtime — C-06 / ECS-01.
 *
 * Foundation estrutural vendor-agnostic para lote corporativo futuro.
 * Lote = unidade transacional corporativa (somente contrato nesta Sprint).
 *
 * Sem processamento em lote. Sem filas. Sem workers. Sem retry funcional.
 * Sem scheduler. Sem paralelismo. Sem SOAP/XML funcional. Sem banco.
 * Sem APIs. Sem envio para operadoras.
 *
 * STATE MACHINE FIRST (Regra Permanente nº 11).
 */

import type { OperatorCapabilityProfile } from "../../operator-runtime/ports/canonical";
import type { AuthorizationStrategy } from "../../authorization-runtime/ports/canonical";
import type { AuthorizationPolicy } from "../../authorization-runtime/ports/canonical";
import type { XMLDocument } from "../../xml-tiss-runtime/ports/canonical";
import type { QualityAssessment } from "../../quality-runtime/ports/canonical";
import type { AuditResult } from "../../audit-runtime/ports/canonical";

export type {
  OperatorCapabilityProfile,
  AuthorizationStrategy,
  AuthorizationPolicy,
  XMLDocument,
  QualityAssessment,
  AuditResult,
};

/**
 * Estados canônicos do lote (C-06 / Regra Permanente nº 11).
 * Somente declaração — sem transições funcionais.
 */
export type BatchState =
  | "CREATED"
  | "VALIDATED"
  | "QUEUED"
  | "READY_TO_SEND"
  | "SENT"
  | "ACKNOWLEDGED"
  | "PROCESSING"
  | "PARTIALLY_COMPLETED"
  | "COMPLETED"
  | "FAILED"
  | "TIMEOUT"
  | "CANCELLED";

/** Lista oficial imutável dos estados canônicos. */
export const BATCH_CANONICAL_STATES: readonly BatchState[] = [
  "CREATED",
  "VALIDATED",
  "QUEUED",
  "READY_TO_SEND",
  "SENT",
  "ACKNOWLEDGED",
  "PROCESSING",
  "PARTIALLY_COMPLETED",
  "COMPLETED",
  "FAILED",
  "TIMEOUT",
  "CANCELLED",
] as const;

/**
 * BatchStateMachine canônica (C-06 / Regra Permanente nº 11).
 * Representa apenas os estados. Nenhuma transição implementada.
 */
export type BatchStateMachine = {
  kind: "canonical-batch-state-machine";
  states: readonly BatchState[];
  /** Sempre false — nenhuma transição funcional nesta Sprint. */
  transitionsImplemented: false;
  /** Sempre false — máquina apenas declarativa. */
  stateMachineImplemented: false;
  batchProcessingImplemented: false;
};

/** Prioridade estrutural do lote (somente contrato). */
export type BatchPriority = "low" | "normal" | "high" | "critical" | (string & {});

/**
 * Envelope operacional estrutural (Regra Permanente nº 4 — Observability by Design).
 * Somente contrato — sem telemetria / tracing / logging funcional.
 */
export type BatchRuntimeObservabilityEnvelope = {
  operationId?: string;
  correlationId?: string | null;
  startedAt?: string;
  finishedAt?: string;
  executionStatus?: BatchState | (string & {});
  executionDuration?: number;
  processedItems?: number;
  warnings?: readonly string[];
  errors?: readonly string[];
  traceMetadata?: Readonly<Record<string, unknown>>;
};

/** Metadados estruturais do lote (somente contrato). */
export type BatchMetadata = {
  kind: "canonical-batch-metadata";
  notes?: string;
  attributes?: Readonly<Record<string, unknown>>;
  batchMetadataImplemented: false;
};

/** Documento estrutural pertencente ao lote (somente contrato). */
export type BatchDocument = {
  kind: "canonical-batch-document";
  documentId?: string;
  documentRef?: string;
  name?: string;
  contentType?: string;
  sizeBytes?: number;
  notes?: string;
  batchDocumentImplemented: false;
  batchProcessingImplemented: false;
};

/**
 * Capacidades canônicas declaradas do Batch Runtime.
 * Todas as flags `*Implemented` permanecem literalmente `false`.
 */
export type BatchCapabilities = {
  kind: "canonical-batch-capabilities";
  supportsPrepareBatch: boolean;
  supportsGetBatch: boolean;
  supportsListBatches: boolean;
  supportsStats: boolean;
  supportsHealth: boolean;
  supportsCanonicalBatchManifest: boolean;
  supportsBatchStateMachine: boolean;
  runtimeReady: true;
  batchProcessingImplemented: false;
  parallelExecutionImplemented: false;
  retryImplemented: false;
  schedulerImplemented: false;
  workerImplemented: false;
  queueImplemented: false;
  soapFunctionalImplemented: false;
  xmlFunctionalImplemented: false;
  operatorCommunicationImplemented: false;
  knowsOperatorOrCooperative: false;
  knowsContract: false;
  knowsTenant: false;
};

/** Dependências estruturais do lote (somente contrato). */
export type BatchDependencies = {
  kind: "canonical-batch-dependencies";
  requiredRuntimeRefs?: readonly string[];
  peerRuntimeRefs?: readonly string[];
  notes?: string;
  dependenciesImplemented: false;
  batchProcessingImplemented: false;
};

/**
 * BatchPolicy canônica (retry/submission policy estrutural).
 * Somente contrato — sem retry funcional / sem scheduler.
 */
export type BatchPolicy = {
  kind: "canonical-batch-policy";
  policyId?: string;
  name?: string;
  maxAttempts?: number;
  backoffMs?: number;
  notes?: string;
  batchPolicyImplemented: false;
  retryImplemented: false;
  batchProcessingImplemented: false;
};

/** Estatísticas estruturais do Batch Runtime (in-process). */
export type BatchStatistics = {
  kind: "canonical-batch-statistics";
  totalManifests: number;
  totalDocuments: number;
  totalContexts: number;
  createdCount: number;
  validatedCount: number;
  queuedCount: number;
  completedCount: number;
  failedCount: number;
  cancelledCount: number;
  batchProcessedCount: 0;
  batchProcessingImplementedCount: 0;
  parallelExecutionImplementedCount: 0;
  retryImplementedCount: 0;
  schedulerImplementedCount: 0;
  workerImplementedCount: 0;
  queueImplementedCount: 0;
};

/** Saúde canônica estrutural do provedor Batch Runtime. */
export type BatchHealth = {
  kind: "canonical-batch-health";
  ok: boolean;
  provider: string;
  latencyMs?: number;
  message?: string;
  status?: string;
  storedManifestCount?: number;
  storedDocumentCount?: number;
  storedContextCount?: number;
  authorizationRuntimeOk?: boolean;
  operatorRuntimeOk?: boolean;
  soapRuntimeOk?: boolean;
  xmlRuntimeOk?: boolean;
  xmlValidationRuntimeOk?: boolean;
  qualityRuntimeOk?: boolean;
  auditRuntimeOk?: boolean;
  runtimeReady: true;
  batchProcessingImplemented: false;
  parallelExecutionImplemented: false;
  retryImplemented: false;
  schedulerImplemented: false;
  workerImplemented: false;
  queueImplemented: false;
};

/**
 * BatchManifest canônico (C-06).
 * Contrato canônico do lote como unidade transacional corporativa.
 * Sem qualquer lógica funcional.
 */
export type BatchManifest = {
  kind: "canonical-batch-manifest";
  batchId?: string;
  batchName?: string;
  documents?: readonly BatchDocument[];
  operatorProfile?: OperatorCapabilityProfile;
  submissionStrategy?: string;
  priority?: BatchPriority;
  state?: BatchState;
  stateMachine?: BatchStateMachine;
  statistics?: BatchStatistics;
  requiredCapabilities?: BatchCapabilities;
  dependencies?: BatchDependencies;
  retryPolicy?: BatchPolicy;
  creationTimestamp?: string;
  requestedExecutionTime?: string;
  owner?: string;
  tags?: readonly string[];
  metadata?: BatchMetadata;
  authorizationStrategy?: AuthorizationStrategy;
  authorizationPolicy?: AuthorizationPolicy;
  xmlDocument?: XMLDocument;
  qualityAssessment?: QualityAssessment;
  auditResult?: AuditResult;
  structuralNotes?: string;
  batchProcessingImplemented: false;
  parallelExecutionImplemented: false;
  retryImplemented: false;
  schedulerImplemented: false;
  workerImplemented: false;
  queueImplemented: false;
};

/**
 * BatchContext canônico (C-06).
 * Aceita peers estruturais por contrato — sem qualquer processamento.
 * Prevê envelope de observabilidade (RULE_04) — sem implementação.
 */
export type BatchContext = BatchRuntimeObservabilityEnvelope & {
  kind: "canonical-batch-context";
  contextId?: string;
  batchId?: string;
  manifest?: BatchManifest;
  state?: BatchState;
  stateMachine?: BatchStateMachine;
  operatorProfile?: OperatorCapabilityProfile;
  authorizationStrategy?: AuthorizationStrategy;
  authorizationPolicy?: AuthorizationPolicy;
  xmlDocument?: XMLDocument;
  qualityAssessment?: QualityAssessment;
  auditResult?: AuditResult;
  metadata?: BatchMetadata;
  structuralNotes?: string;
};

/** Helper estrutural — cria máquina de estados declarativa (sem transições). */
export function createEmptyBatchStateMachine(
  overrides: Partial<BatchStateMachine> = {},
): BatchStateMachine {
  return {
    kind: "canonical-batch-state-machine",
    states: overrides.states ?? BATCH_CANONICAL_STATES,
    transitionsImplemented: false,
    stateMachineImplemented: false,
    batchProcessingImplemented: false,
  };
}

/** Helper estrutural — cria política vazia/desabilitada. */
export function createEmptyBatchPolicy(overrides: Partial<BatchPolicy> = {}): BatchPolicy {
  return {
    kind: "canonical-batch-policy",
    policyId: overrides.policyId,
    name: overrides.name,
    maxAttempts: overrides.maxAttempts,
    backoffMs: overrides.backoffMs,
    notes: overrides.notes ?? "Structural batch policy contract (no functional retry)",
    batchPolicyImplemented: false,
    retryImplemented: false,
    batchProcessingImplemented: false,
  };
}

/** Helper estrutural — cria manifesto vazio no estado CREATED. */
export function createEmptyBatchManifest(overrides: Partial<BatchManifest> = {}): BatchManifest {
  return {
    kind: "canonical-batch-manifest",
    batchId: overrides.batchId,
    batchName: overrides.batchName,
    documents: overrides.documents ?? [],
    operatorProfile: overrides.operatorProfile,
    submissionStrategy: overrides.submissionStrategy,
    priority: overrides.priority ?? "normal",
    state: overrides.state ?? "CREATED",
    stateMachine: overrides.stateMachine ?? createEmptyBatchStateMachine(),
    statistics: overrides.statistics,
    requiredCapabilities: overrides.requiredCapabilities,
    dependencies: overrides.dependencies,
    retryPolicy: overrides.retryPolicy ?? createEmptyBatchPolicy(),
    creationTimestamp: overrides.creationTimestamp,
    requestedExecutionTime: overrides.requestedExecutionTime,
    owner: overrides.owner,
    tags: overrides.tags ?? [],
    metadata: overrides.metadata ?? {
      kind: "canonical-batch-metadata",
      batchMetadataImplemented: false,
    },
    authorizationStrategy: overrides.authorizationStrategy,
    authorizationPolicy: overrides.authorizationPolicy,
    xmlDocument: overrides.xmlDocument,
    qualityAssessment: overrides.qualityAssessment,
    auditResult: overrides.auditResult,
    structuralNotes:
      overrides.structuralNotes ??
      "Structural BatchManifest contract (corporate transactional unit — no batch processing)",
    batchProcessingImplemented: false,
    parallelExecutionImplemented: false,
    retryImplemented: false,
    schedulerImplemented: false,
    workerImplemented: false,
    queueImplemented: false,
  };
}
