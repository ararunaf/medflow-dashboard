/**
 * Modelos canônicos estruturais do Enterprise Return Runtime — C-08 / ECS-01.
 *
 * Foundation estrutural vendor-agnostic para retornos corporativos futuros.
 *
 * Sem processamento de retorno. Sem parser XML. Sem SOAP. Sem operadoras.
 * Sem atualização de banco. Sem alteração de status. Sem workflow.
 * Sem reconciliação. Sem correlação automática. Sem APIs. Sem filas.
 *
 * CORRELATION BEFORE PROCESSING (Regra Permanente nº 14).
 * STATE MACHINE FIRST (Regra Permanente nº 11).
 */

import type { OperatorCapabilityProfile } from "../../operator-runtime/ports/canonical";
import type { AuthorizationStrategy } from "../../authorization-runtime/ports/canonical";
import type { AuthorizationPolicy } from "../../authorization-runtime/ports/canonical";
import type { BatchManifest } from "../../batch-runtime/ports/canonical";
import type { ProtocolProfile } from "../../protocol-runtime/ports/canonical";
import type { XMLDocument } from "../../xml-tiss-runtime/ports/canonical";
import type { AuditResult } from "../../audit-runtime/ports/canonical";

export type {
  OperatorCapabilityProfile,
  AuthorizationStrategy,
  AuthorizationPolicy,
  BatchManifest,
  ProtocolProfile,
  XMLDocument,
  AuditResult,
};

/**
 * Estados canônicos do retorno (C-08 / RULE_11 + RULE_14).
 * Somente declaração — sem transições funcionais.
 */
export type ReturnState =
  | "RECEIVED"
  | "CORRELATED"
  | "VALIDATED"
  | "READY_FOR_PROCESSING"
  | "PROCESSED"
  | "PARTIALLY_PROCESSED"
  | "REJECTED"
  | "FAILED"
  | "TIMEOUT"
  | "DUPLICATED"
  | "IGNORED";

/** Lista oficial imutável dos estados canônicos. */
export const RETURN_CANONICAL_STATES: readonly ReturnState[] = [
  "RECEIVED",
  "CORRELATED",
  "VALIDATED",
  "READY_FOR_PROCESSING",
  "PROCESSED",
  "PARTIALLY_PROCESSED",
  "REJECTED",
  "FAILED",
  "TIMEOUT",
  "DUPLICATED",
  "IGNORED",
] as const;

/**
 * ReturnStateMachine canônica (C-08 / RULE_11).
 * Representa apenas os estados. Nenhuma transição implementada.
 */
export type ReturnStateMachine = {
  kind: "canonical-return-state-machine";
  states: readonly ReturnState[];
  /** Sempre false — nenhuma transição funcional nesta Sprint. */
  transitionsImplemented: false;
  /** Sempre false — máquina apenas declarativa. */
  stateMachineImplemented: false;
  returnProcessingImplemented: false;
  automaticCorrelationImplemented: false;
};

/**
 * Status operacional canônico do retorno (somente contrato).
 * Distinto de ReturnState (máquina de estados).
 */
export type ReturnStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "CLOSED"
  | "ARCHIVED"
  | "UNKNOWN"
  | (string & {});

/**
 * Origem estrutural do retorno (somente contrato).
 */
export type ReturnOrigin =
  | "OPERATOR"
  | "SOAP"
  | "XML"
  | "BATCH"
  | "MANUAL"
  | "UNKNOWN"
  | (string & {});

/**
 * Envelope operacional estrutural (Regra Permanente nº 4 — Observability by Design).
 * Somente contrato — sem telemetria / tracing / logging funcional.
 *
 * ReturnContext prevê: operationId, correlationId, transactionId, startedAt,
 * finishedAt, executionStatus, processingTime, warnings, errors, traceMetadata.
 */
export type ReturnRuntimeObservabilityEnvelope = {
  operationId?: string;
  correlationId?: string | null;
  transactionId?: string | null;
  startedAt?: string;
  finishedAt?: string;
  executionStatus?: ReturnState | (string & {});
  processingTime?: number;
  warnings?: readonly string[];
  errors?: readonly string[];
  traceMetadata?: Readonly<Record<string, unknown>>;
};

/** Metadados estruturais do retorno (somente contrato). */
export type ReturnMetadata = {
  kind: "canonical-return-metadata";
  notes?: string;
  attributes?: Readonly<Record<string, unknown>>;
  returnMetadataImplemented: false;
};

/**
 * Envelope canônico de payload de retorno (somente contrato).
 * Sem leitura de XML / sem parser / sem conteúdo funcional.
 */
export type ReturnEnvelope = {
  kind: "canonical-return-envelope";
  envelopeId?: string;
  payloadReference?: string;
  contentType?: string;
  sizeBytes?: number;
  notes?: string;
  returnEnvelopeImplemented: false;
  returnProcessingImplemented: false;
};

/**
 * Capacidades canônicas declaradas do Return Runtime.
 * Todas as flags `*Implemented` permanecem literalmente `false`.
 */
export type ReturnCapabilities = {
  kind: "canonical-return-capabilities";
  supportsPrepareReturn: boolean;
  supportsGetReturn: boolean;
  supportsListReturns: boolean;
  supportsCorrelateReturn: boolean;
  supportsStats: boolean;
  supportsHealth: boolean;
  supportsCanonicalReturnManifest: boolean;
  supportsReturnCorrelation: boolean;
  supportsReturnStateMachine: boolean;
  runtimeReady: true;
  returnProcessingImplemented: false;
  automaticCorrelationImplemented: false;
  statusUpdateImplemented: false;
  reconciliationImplemented: false;
  workflowIntegrationImplemented: false;
  xmlParserImplemented: false;
  soapImplemented: false;
  operatorCommunicationImplemented: false;
  knowsOperatorOrCooperative: false;
  knowsContract: false;
  knowsTenant: false;
};

/**
 * ReturnPolicy canônica (processingPolicy estrutural).
 * Somente contrato — sem processamento funcional.
 */
export type ReturnPolicy = {
  kind: "canonical-return-policy";
  policyId?: string;
  name?: string;
  notes?: string;
  returnPolicyImplemented: false;
  returnProcessingImplemented: false;
  automaticCorrelationImplemented: false;
  statusUpdateImplemented: false;
  reconciliationImplemented: false;
  workflowIntegrationImplemented: false;
};

/** Estatísticas estruturais do Return Runtime (in-process). */
export type ReturnStatistics = {
  kind: "canonical-return-statistics";
  totalManifests: number;
  totalContexts: number;
  totalCorrelations: number;
  receivedCount: number;
  correlatedCount: number;
  validatedCount: number;
  readyForProcessingCount: number;
  processedCount: number;
  rejectedCount: number;
  failedCount: number;
  duplicatedCount: number;
  ignoredCount: number;
  returnProcessedCount: 0;
  returnProcessingImplementedCount: 0;
  automaticCorrelationImplementedCount: 0;
  statusUpdateImplementedCount: 0;
  reconciliationImplementedCount: 0;
  workflowIntegrationImplementedCount: 0;
};

/** Saúde canônica estrutural do provedor Return Runtime. */
export type ReturnHealth = {
  kind: "canonical-return-health";
  ok: boolean;
  provider: string;
  latencyMs?: number;
  message?: string;
  status?: string;
  storedManifestCount?: number;
  storedContextCount?: number;
  storedCorrelationCount?: number;
  protocolRuntimeOk?: boolean;
  batchRuntimeOk?: boolean;
  authorizationRuntimeOk?: boolean;
  operatorRuntimeOk?: boolean;
  soapRuntimeOk?: boolean;
  xmlRuntimeOk?: boolean;
  xmlValidationRuntimeOk?: boolean;
  auditRuntimeOk?: boolean;
  runtimeReady: true;
  returnProcessingImplemented: false;
  automaticCorrelationImplemented: false;
  statusUpdateImplemented: false;
  reconciliationImplemented: false;
  workflowIntegrationImplemented: false;
};

/**
 * ReturnCorrelation canônica (C-08 / RULE_14).
 * Mecanismo de correlação — contrato apenas. Sem lógica funcional.
 * Nenhum retorno poderá ser processado antes de ser correlacionado.
 */
export type ReturnCorrelation = {
  kind: "canonical-return-correlation";
  correlationId?: string;
  transactionId?: string;
  authorizationId?: string;
  batchId?: string;
  documentId?: string;
  operatorId?: string;
  correlationStrategy?: string;
  correlationConfidence?: number;
  matchedEntities?: readonly string[];
  notes?: string;
  /** Sempre false — nenhuma correlação automática nesta Sprint. */
  automaticCorrelationImplemented: false;
  returnProcessingImplemented: false;
  reconciliationImplemented: false;
};

/**
 * ReturnManifest canônico (C-08).
 * Contrato canônico do retorno corporativo.
 * Sem qualquer lógica funcional.
 */
export type ReturnManifest = {
  kind: "canonical-return-manifest";
  returnId?: string;
  transactionId?: string;
  batchId?: string;
  operatorId?: string;
  protocolId?: string;
  correlationId?: string;
  receivedAt?: string;
  origin?: ReturnOrigin;
  status?: ReturnStatus;
  state?: ReturnState;
  stateMachine?: ReturnStateMachine;
  metadata?: ReturnMetadata;
  payloadReference?: string;
  processingPolicy?: ReturnPolicy;
  envelope?: ReturnEnvelope;
  correlation?: ReturnCorrelation;
  statistics?: ReturnStatistics;
  requiredCapabilities?: ReturnCapabilities;
  operatorProfile?: OperatorCapabilityProfile;
  authorizationStrategy?: AuthorizationStrategy;
  authorizationPolicy?: AuthorizationPolicy;
  batchManifest?: BatchManifest;
  protocolProfile?: ProtocolProfile;
  xmlDocument?: XMLDocument;
  auditResult?: AuditResult;
  tags?: readonly string[];
  owner?: string;
  structuralNotes?: string;
  returnProcessingImplemented: false;
  automaticCorrelationImplemented: false;
  statusUpdateImplemented: false;
  reconciliationImplemented: false;
  workflowIntegrationImplemented: false;
};

/**
 * ReturnContext canônico (C-08).
 * Aceita peers estruturais por contrato — sem qualquer processamento.
 * Prevê envelope de observabilidade (RULE_04) — sem implementação.
 */
export type ReturnContext = ReturnRuntimeObservabilityEnvelope & {
  kind: "canonical-return-context";
  contextId?: string;
  returnId?: string;
  transactionId?: string;
  manifest?: ReturnManifest;
  correlation?: ReturnCorrelation;
  state?: ReturnState;
  status?: ReturnStatus;
  stateMachine?: ReturnStateMachine;
  origin?: ReturnOrigin;
  operatorProfile?: OperatorCapabilityProfile;
  authorizationStrategy?: AuthorizationStrategy;
  authorizationPolicy?: AuthorizationPolicy;
  batchManifest?: BatchManifest;
  protocolProfile?: ProtocolProfile;
  xmlDocument?: XMLDocument;
  auditResult?: AuditResult;
  metadata?: ReturnMetadata;
  envelope?: ReturnEnvelope;
  structuralNotes?: string;
};

/** Helper estrutural — cria máquina de estados declarativa (sem transições). */
export function createEmptyReturnStateMachine(
  overrides: Partial<ReturnStateMachine> = {},
): ReturnStateMachine {
  return {
    kind: "canonical-return-state-machine",
    states: overrides.states ?? RETURN_CANONICAL_STATES,
    transitionsImplemented: false,
    stateMachineImplemented: false,
    returnProcessingImplemented: false,
    automaticCorrelationImplemented: false,
  };
}

/** Helper estrutural — cria política vazia/desabilitada. */
export function createEmptyReturnPolicy(overrides: Partial<ReturnPolicy> = {}): ReturnPolicy {
  return {
    kind: "canonical-return-policy",
    policyId: overrides.policyId,
    name: overrides.name,
    notes:
      overrides.notes ??
      "Structural return processingPolicy contract (no functional return processing)",
    returnPolicyImplemented: false,
    returnProcessingImplemented: false,
    automaticCorrelationImplemented: false,
    statusUpdateImplemented: false,
    reconciliationImplemented: false,
    workflowIntegrationImplemented: false,
  };
}

/** Helper estrutural — cria correlação declarativa (sem correlação automática). */
export function createEmptyReturnCorrelation(
  overrides: Partial<ReturnCorrelation> = {},
): ReturnCorrelation {
  return {
    kind: "canonical-return-correlation",
    correlationId: overrides.correlationId,
    transactionId: overrides.transactionId,
    authorizationId: overrides.authorizationId,
    batchId: overrides.batchId,
    documentId: overrides.documentId,
    operatorId: overrides.operatorId,
    correlationStrategy: overrides.correlationStrategy,
    correlationConfidence: overrides.correlationConfidence,
    matchedEntities: overrides.matchedEntities ?? [],
    notes:
      overrides.notes ??
      "Structural ReturnCorrelation contract (RULE_14 — no automatic correlation)",
    automaticCorrelationImplemented: false,
    returnProcessingImplemented: false,
    reconciliationImplemented: false,
  };
}

/** Helper estrutural — cria envelope de payload vazio. */
export function createEmptyReturnEnvelope(overrides: Partial<ReturnEnvelope> = {}): ReturnEnvelope {
  return {
    kind: "canonical-return-envelope",
    envelopeId: overrides.envelopeId,
    payloadReference: overrides.payloadReference,
    contentType: overrides.contentType,
    sizeBytes: overrides.sizeBytes,
    notes: overrides.notes ?? "Structural ReturnEnvelope contract (no payload processing)",
    returnEnvelopeImplemented: false,
    returnProcessingImplemented: false,
  };
}

/** Helper estrutural — cria capacidades canônicas com flags literais false. */
export function createEmptyReturnCapabilities(
  overrides: Partial<ReturnCapabilities> = {},
): ReturnCapabilities {
  return {
    kind: "canonical-return-capabilities",
    supportsPrepareReturn: overrides.supportsPrepareReturn ?? true,
    supportsGetReturn: overrides.supportsGetReturn ?? true,
    supportsListReturns: overrides.supportsListReturns ?? true,
    supportsCorrelateReturn: overrides.supportsCorrelateReturn ?? true,
    supportsStats: overrides.supportsStats ?? true,
    supportsHealth: overrides.supportsHealth ?? true,
    supportsCanonicalReturnManifest: overrides.supportsCanonicalReturnManifest ?? true,
    supportsReturnCorrelation: overrides.supportsReturnCorrelation ?? true,
    supportsReturnStateMachine: overrides.supportsReturnStateMachine ?? true,
    runtimeReady: true,
    returnProcessingImplemented: false,
    automaticCorrelationImplemented: false,
    statusUpdateImplemented: false,
    reconciliationImplemented: false,
    workflowIntegrationImplemented: false,
    xmlParserImplemented: false,
    soapImplemented: false,
    operatorCommunicationImplemented: false,
    knowsOperatorOrCooperative: false,
    knowsContract: false,
    knowsTenant: false,
  };
}

/** Helper estrutural — cria manifesto vazio no estado RECEIVED. */
export function createEmptyReturnManifest(overrides: Partial<ReturnManifest> = {}): ReturnManifest {
  return {
    kind: "canonical-return-manifest",
    returnId: overrides.returnId,
    transactionId: overrides.transactionId,
    batchId: overrides.batchId,
    operatorId: overrides.operatorId,
    protocolId: overrides.protocolId,
    correlationId: overrides.correlationId,
    receivedAt: overrides.receivedAt,
    origin: overrides.origin ?? "UNKNOWN",
    status: overrides.status ?? "OPEN",
    state: overrides.state ?? "RECEIVED",
    stateMachine: overrides.stateMachine ?? createEmptyReturnStateMachine(),
    metadata: overrides.metadata ?? {
      kind: "canonical-return-metadata",
      returnMetadataImplemented: false,
    },
    payloadReference: overrides.payloadReference,
    processingPolicy: overrides.processingPolicy ?? createEmptyReturnPolicy(),
    envelope: overrides.envelope,
    correlation: overrides.correlation,
    statistics: overrides.statistics,
    requiredCapabilities: overrides.requiredCapabilities ?? createEmptyReturnCapabilities(),
    operatorProfile: overrides.operatorProfile,
    authorizationStrategy: overrides.authorizationStrategy,
    authorizationPolicy: overrides.authorizationPolicy,
    batchManifest: overrides.batchManifest,
    protocolProfile: overrides.protocolProfile,
    xmlDocument: overrides.xmlDocument,
    auditResult: overrides.auditResult,
    tags: overrides.tags ?? [],
    owner: overrides.owner,
    structuralNotes:
      overrides.structuralNotes ??
      "Structural ReturnManifest contract (RULE_14 — correlation before processing; no functional return processing)",
    returnProcessingImplemented: false,
    automaticCorrelationImplemented: false,
    statusUpdateImplemented: false,
    reconciliationImplemented: false,
    workflowIntegrationImplemented: false,
  };
}
