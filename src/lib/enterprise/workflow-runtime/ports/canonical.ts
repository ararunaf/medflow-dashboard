/**
 * Modelos canônicos estruturais do Enterprise Corporate Workflow Runtime — C-10 / ECS-01.
 *
 * Foundation estrutural vendor-agnostic para orquestração corporativa futura.
 *
 * WORKFLOW IS PURE ORCHESTRATION — o Workflow Runtime exclusivamente orquestra;
 * nunca valida XML, nunca reconcilia, nunca autoriza, nunca gera SOAP,
 * nunca fala com operadoras, nunca processa lotes (batch), nunca roda IA,
 * e nunca implementa regras de domínio (Regra Permanente nº 18).
 *
 * Sem workflow funcional. Sem BPM. Sem decisão automática. Sem execução de runtime.
 * Sem filas. Sem workers. Sem scheduler. Sem banco. Sem IA.
 */

import type { OperatorCapabilityProfile } from "../../operator-runtime/ports/canonical";
import type { AuthorizationStrategy } from "../../authorization-runtime/ports/canonical";
import type { AuthorizationPolicy } from "../../authorization-runtime/ports/canonical";
import type { BatchManifest } from "../../batch-runtime/ports/canonical";
import type { ProtocolProfile } from "../../protocol-runtime/ports/canonical";
import type { ReturnManifest } from "../../return-runtime/ports/canonical";
import type { CanonicalReconciliationResult } from "../../reconciliation-runtime/ports/canonical";
import type { AuditResult } from "../../audit-runtime/ports/canonical";

export type {
  OperatorCapabilityProfile,
  AuthorizationStrategy,
  AuthorizationPolicy,
  BatchManifest,
  ProtocolProfile,
  ReturnManifest,
  CanonicalReconciliationResult,
  AuditResult,
};

/**
 * Referência estrutural leve ao SOAP Runtime (sem processamento SOAP — RULE_18).
 * Definida localmente pois o contrato canônico do SOAP Runtime é pesado
 * demais para embutir apenas como peer estrutural.
 */
export type WorkflowSoapEnvelopeRef = {
  kind: "structural-soap-envelope-ref";
  notes?: string;
  soapImplemented: false;
};

/**
 * Referência estrutural leve ao XML Runtime (sem processamento XML — RULE_18).
 */
export type WorkflowXmlDocumentRef = {
  kind: "structural-xml-document-ref";
  notes?: string;
  xmlImplemented: false;
};

/**
 * Referência estrutural leve ao XML Validation Runtime (sem validação XML — RULE_18).
 */
export type WorkflowXmlValidationRef = {
  kind: "structural-xml-validation-ref";
  notes?: string;
  xmlValidationImplemented: false;
};

/**
 * Estados canônicos do workflow (C-10 / RULE_11 + RULE_18).
 * Somente declaração — sem transições funcionais.
 */
export type WorkflowState =
  | "CREATED"
  | "READY"
  | "WAITING"
  | "RUNNING"
  | "PAUSED"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

/** Lista oficial imutável dos estados canônicos. */
export const WORKFLOW_CANONICAL_STATES: readonly WorkflowState[] = [
  "CREATED",
  "READY",
  "WAITING",
  "RUNNING",
  "PAUSED",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
] as const;

/** Flags estruturais comuns — sempre `false` nesta Sprint (RULE_18). */
type WorkflowStructuralFlags = {
  workflowImplemented: false;
  workflowExecutionImplemented: false;
  automaticDecisionImplemented: false;
  runtimeExecutionImplemented: false;
};

/**
 * WorkflowStateMachine canônica (C-10 / RULE_11).
 * Representa apenas os estados. Nenhuma transição implementada.
 */
export type WorkflowStateMachine = {
  kind: "canonical-workflow-state-machine";
  states: readonly WorkflowState[];
  /** Sempre false — nenhuma transição funcional nesta Sprint. */
  transitionsImplemented: false;
  /** Sempre false — máquina apenas declarativa. */
  stateMachineImplemented: false;
} & WorkflowStructuralFlags;

/**
 * Envelope operacional estrutural (Regra Permanente nº 4 — Observability by Design).
 * Somente contrato — sem telemetria / tracing / logging funcional.
 *
 * WorkflowContext prevê obrigatoriamente: transactionId, workflowExecutionId,
 * correlationId, operationId, executionStartedAt, executionFinishedAt,
 * executionDuration, executionStatus, warnings, errors, traceMetadata.
 */
export type WorkflowRuntimeObservabilityEnvelope = {
  transactionId?: string | null;
  /** Identifica UMA execução específica de workflow — NUNCA reaproveitado. */
  workflowExecutionId?: string;
  correlationId?: string | null;
  operationId?: string;
  executionStartedAt?: string;
  executionFinishedAt?: string;
  executionDuration?: number;
  executionStatus?: WorkflowState | (string & {});
  warnings?: readonly string[];
  errors?: readonly string[];
  traceMetadata?: Readonly<Record<string, unknown>>;
};

/** Metadados estruturais da execução de workflow (somente contrato). */
export type WorkflowExecutionMetadata = {
  kind: "canonical-workflow-execution-metadata";
  notes?: string;
  attributes?: Readonly<Record<string, unknown>>;
  workflowMetadataImplemented: false;
};

/**
 * Capacidades canônicas declaradas do Workflow Runtime.
 * Todas as flags `*Implemented` permanecem literalmente `false`.
 */
export type WorkflowCapabilities = {
  kind: "canonical-workflow-capabilities";
  supportsPrepareWorkflowExecution: boolean;
  supportsGetWorkflowExecution: boolean;
  supportsListWorkflowExecutions: boolean;
  supportsStats: boolean;
  supportsHealth: boolean;
  supportsCanonicalWorkflowManifest: boolean;
  supportsCanonicalWorkflowExecutionResult: boolean;
  supportsWorkflowStateMachine: boolean;
  runtimeReady: true;
} & WorkflowStructuralFlags;

/**
 * WorkflowExecutionPolicy canônica (somente contrato).
 * Sem workflow funcional / sem BPM / sem decisão automática.
 */
export type WorkflowExecutionPolicy = {
  kind: "canonical-workflow-execution-policy";
  policyId?: string;
  name?: string;
  notes?: string;
  workflowExecutionPolicyImplemented: false;
} & WorkflowStructuralFlags;

/** Estatísticas estruturais do Workflow Runtime (in-process). */
export type WorkflowExecutionStatistics = {
  kind: "canonical-workflow-execution-statistics";
  totalManifests: number;
  totalContexts: number;
  totalExecutions: number;
  totalResults: number;
  createdCount: number;
  readyCount: number;
  waitingCount: number;
  runningCount: number;
  pausedCount: number;
  completedCount: number;
  failedCount: number;
  cancelledCount: number;
  workflowImplementedCount: 0;
  workflowExecutionImplementedCount: 0;
  automaticDecisionImplementedCount: 0;
  runtimeExecutionImplementedCount: 0;
};

/** Saúde canônica estrutural do provedor Workflow Runtime. */
export type WorkflowHealth = {
  kind: "canonical-workflow-health";
  ok: boolean;
  provider: string;
  latencyMs?: number;
  message?: string;
  status?: string;
  storedManifestCount?: number;
  storedContextCount?: number;
  storedExecutionCount?: number;
  storedResultCount?: number;
  reconciliationRuntimeOk?: boolean;
  returnRuntimeOk?: boolean;
  authorizationRuntimeOk?: boolean;
  operatorRuntimeOk?: boolean;
  protocolRuntimeOk?: boolean;
  batchRuntimeOk?: boolean;
  soapRuntimeOk?: boolean;
  xmlRuntimeOk?: boolean;
  xmlValidationRuntimeOk?: boolean;
  auditRuntimeOk?: boolean;
  runtimeReady: true;
} & WorkflowStructuralFlags;

/**
 * WorkflowExecutionResult (C-10).
 * Contrato canônico exclusivo — sem qualquer implementação funcional.
 */
export type WorkflowExecutionResult = {
  kind: "canonical-workflow-execution-result";
  workflowExecutionId?: string;
  transactionId?: string;
  status?: WorkflowState | (string & {});
  statistics?: WorkflowExecutionStatistics;
  recommendations?: readonly string[];
  auditReference?: string;
  metadata?: WorkflowExecutionMetadata;
  /** Sempre false — nenhuma execução funcional de workflow nesta Sprint. */
  executed: false;
} & WorkflowStructuralFlags;

/**
 * WorkflowExecution canônica (C-10).
 * Representa a preparação estrutural de UMA execução específica.
 * Sem qualquer lógica funcional / sem BPM / sem scheduler.
 */
export type WorkflowExecution = {
  kind: "canonical-workflow-execution";
  workflowExecutionId?: string;
  transactionId?: string;
  correlationId?: string;
  state?: WorkflowState;
  startedAt?: string;
  finishedAt?: string;
  duration?: number;
  nextRuntimeHint?: string;
  consumedResults?: readonly string[];
  notes?: string;
} & WorkflowStructuralFlags;

/**
 * WorkflowManifest canônico (C-10).
 * Contrato canônico da orquestração corporativa.
 * Sem qualquer lógica funcional.
 */
export type WorkflowManifest = {
  kind: "canonical-workflow-manifest";
  workflowId?: string;
  workflowExecutionId?: string;
  transactionId?: string;
  correlationId?: string;
  state?: WorkflowState;
  stateMachine?: WorkflowStateMachine;
  metadata?: WorkflowExecutionMetadata;
  executionPolicy?: WorkflowExecutionPolicy;
  execution?: WorkflowExecution;
  result?: WorkflowExecutionResult;
  statistics?: WorkflowExecutionStatistics;
  requiredCapabilities?: WorkflowCapabilities;
  reconciliationResult?: CanonicalReconciliationResult;
  returnManifest?: ReturnManifest;
  authorizationStrategy?: AuthorizationStrategy;
  authorizationPolicy?: AuthorizationPolicy;
  operatorProfile?: OperatorCapabilityProfile;
  batchManifest?: BatchManifest;
  protocolProfile?: ProtocolProfile;
  soapEnvelope?: WorkflowSoapEnvelopeRef;
  xmlDocument?: WorkflowXmlDocumentRef;
  xmlValidationResult?: WorkflowXmlValidationRef;
  auditResult?: AuditResult;
  tags?: readonly string[];
  owner?: string;
  structuralNotes?: string;
} & WorkflowStructuralFlags;

/**
 * WorkflowContext canônico (C-10).
 * Aceita peers estruturais por contrato — sem qualquer processamento.
 * Prevê envelope de observabilidade (RULE_04) — sem implementação.
 *
 * Campos obrigatórios do contrato (via WorkflowRuntimeObservabilityEnvelope):
 *   transactionId · workflowExecutionId · correlationId · operationId ·
 *   executionStartedAt · executionFinishedAt · executionDuration ·
 *   executionStatus · warnings · errors · traceMetadata
 */
export type WorkflowContext = WorkflowRuntimeObservabilityEnvelope & {
  kind: "canonical-workflow-context";
  contextId?: string;
  manifest?: WorkflowManifest;
  execution?: WorkflowExecution;
  result?: WorkflowExecutionResult;
  state?: WorkflowState;
  stateMachine?: WorkflowStateMachine;
  metadata?: WorkflowExecutionMetadata;
  structuralNotes?: string;
  reconciliationResult?: CanonicalReconciliationResult;
  returnManifest?: ReturnManifest;
  authorizationStrategy?: AuthorizationStrategy;
  authorizationPolicy?: AuthorizationPolicy;
  operatorProfile?: OperatorCapabilityProfile;
  batchManifest?: BatchManifest;
  protocolProfile?: ProtocolProfile;
  soapEnvelope?: WorkflowSoapEnvelopeRef;
  xmlDocument?: WorkflowXmlDocumentRef;
  xmlValidationResult?: WorkflowXmlValidationRef;
  auditResult?: AuditResult;
};

const STRUCTURAL_FLAGS: WorkflowStructuralFlags = {
  workflowImplemented: false,
  workflowExecutionImplemented: false,
  automaticDecisionImplemented: false,
  runtimeExecutionImplemented: false,
};

/** Helper estrutural — cria máquina de estados declarativa (sem transições). */
export function createEmptyWorkflowStateMachine(
  overrides: Partial<WorkflowStateMachine> = {},
): WorkflowStateMachine {
  return {
    kind: "canonical-workflow-state-machine",
    states: overrides.states ?? WORKFLOW_CANONICAL_STATES,
    transitionsImplemented: false,
    stateMachineImplemented: false,
    ...STRUCTURAL_FLAGS,
  };
}

/** Helper estrutural — cria política de execução vazia/desabilitada. */
export function createEmptyWorkflowExecutionPolicy(
  overrides: Partial<WorkflowExecutionPolicy> = {},
): WorkflowExecutionPolicy {
  return {
    kind: "canonical-workflow-execution-policy",
    policyId: overrides.policyId,
    name: overrides.name,
    notes:
      overrides.notes ??
      "Structural workflow execution policy contract (no functional workflow — RULE_18)",
    workflowExecutionPolicyImplemented: false,
    ...STRUCTURAL_FLAGS,
  };
}

/** Helper estrutural — cria capacidades canônicas com flags literais false. */
export function createEmptyWorkflowCapabilities(
  overrides: Partial<WorkflowCapabilities> = {},
): WorkflowCapabilities {
  return {
    kind: "canonical-workflow-capabilities",
    supportsPrepareWorkflowExecution: overrides.supportsPrepareWorkflowExecution ?? true,
    supportsGetWorkflowExecution: overrides.supportsGetWorkflowExecution ?? true,
    supportsListWorkflowExecutions: overrides.supportsListWorkflowExecutions ?? true,
    supportsStats: overrides.supportsStats ?? true,
    supportsHealth: overrides.supportsHealth ?? true,
    supportsCanonicalWorkflowManifest: overrides.supportsCanonicalWorkflowManifest ?? true,
    supportsCanonicalWorkflowExecutionResult:
      overrides.supportsCanonicalWorkflowExecutionResult ?? true,
    supportsWorkflowStateMachine: overrides.supportsWorkflowStateMachine ?? true,
    runtimeReady: true,
    ...STRUCTURAL_FLAGS,
  };
}

/** Helper estrutural — cria WorkflowExecution vazia no estado CREATED. */
export function createEmptyWorkflowExecution(
  overrides: Partial<WorkflowExecution> = {},
): WorkflowExecution {
  return {
    kind: "canonical-workflow-execution",
    workflowExecutionId: overrides.workflowExecutionId,
    transactionId: overrides.transactionId,
    correlationId: overrides.correlationId,
    state: overrides.state ?? "CREATED",
    startedAt: overrides.startedAt,
    finishedAt: overrides.finishedAt,
    duration: overrides.duration,
    nextRuntimeHint: overrides.nextRuntimeHint,
    consumedResults: overrides.consumedResults ?? [],
    notes:
      overrides.notes ??
      "Structural WorkflowExecution contract (RULE_18 — pure orchestration; no functional execution)",
    ...STRUCTURAL_FLAGS,
  };
}

/**
 * Helper estrutural — cria WorkflowExecutionResult vazio.
 * Sem estatísticas / recomendações funcionais.
 */
export function createEmptyWorkflowExecutionResult(
  overrides: Partial<WorkflowExecutionResult> = {},
): WorkflowExecutionResult {
  return {
    kind: "canonical-workflow-execution-result",
    workflowExecutionId: overrides.workflowExecutionId,
    transactionId: overrides.transactionId,
    status: overrides.status,
    statistics: overrides.statistics,
    recommendations: overrides.recommendations ?? [],
    auditReference: overrides.auditReference,
    metadata: overrides.metadata ?? {
      kind: "canonical-workflow-execution-metadata",
      workflowMetadataImplemented: false,
    },
    executed: false,
    ...STRUCTURAL_FLAGS,
  };
}

/** Helper estrutural — cria manifesto vazio no estado CREATED. */
export function createEmptyWorkflowManifest(
  overrides: Partial<WorkflowManifest> = {},
): WorkflowManifest {
  return {
    kind: "canonical-workflow-manifest",
    workflowId: overrides.workflowId,
    workflowExecutionId: overrides.workflowExecutionId,
    transactionId: overrides.transactionId,
    correlationId: overrides.correlationId,
    state: overrides.state ?? "CREATED",
    stateMachine: overrides.stateMachine ?? createEmptyWorkflowStateMachine(),
    metadata: overrides.metadata ?? {
      kind: "canonical-workflow-execution-metadata",
      workflowMetadataImplemented: false,
    },
    executionPolicy: overrides.executionPolicy ?? createEmptyWorkflowExecutionPolicy(),
    execution: overrides.execution,
    result: overrides.result,
    statistics: overrides.statistics,
    requiredCapabilities: overrides.requiredCapabilities ?? createEmptyWorkflowCapabilities(),
    reconciliationResult: overrides.reconciliationResult,
    returnManifest: overrides.returnManifest,
    authorizationStrategy: overrides.authorizationStrategy,
    authorizationPolicy: overrides.authorizationPolicy,
    operatorProfile: overrides.operatorProfile,
    batchManifest: overrides.batchManifest,
    protocolProfile: overrides.protocolProfile,
    soapEnvelope: overrides.soapEnvelope,
    xmlDocument: overrides.xmlDocument,
    xmlValidationResult: overrides.xmlValidationResult,
    auditResult: overrides.auditResult,
    tags: overrides.tags ?? [],
    owner: overrides.owner,
    structuralNotes:
      overrides.structuralNotes ??
      "Structural WorkflowManifest contract (RULE_18 — pure orchestration foundation; no functional workflow, no BPM, no automatic decision)",
    ...STRUCTURAL_FLAGS,
  };
}
