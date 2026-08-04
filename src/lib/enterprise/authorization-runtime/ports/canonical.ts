/**
 * Modelos canônicos estruturais do Enterprise Authorization Runtime — C-05 / ECS-01.
 *
 * Foundation estrutural vendor-agnostic para autorização futura exclusivamente
 * via AuthorizationStrategy + AuthorizationPolicy + OperatorCapabilityProfile.
 *
 * Sem autorização funcional. Sem elegibilidade. Sem integração com operadoras.
 * Sem SOAP funcional. Sem XML funcional. Sem REST. Sem autenticação.
 * Sem banco. Sem persistência. Sem APIs. Sem HTTP. Sem TLS. Sem certificados.
 *
 * AUTHORIZATION STRATEGY PATTERN (Regra Permanente nº 9).
 * POLICY-DRIVEN AUTHORIZATION — decisões futuras via OperatorCapabilityProfile
 * + AuthorizationPolicy (sem if/switch por operadora/versão/guia).
 */

import type { OperatorCapabilityProfile } from "../../operator-runtime/ports/canonical";
import type { XMLDocument } from "../../xml-tiss-runtime/ports/canonical";
import type { XMLValidationResult } from "../../xml-validation-runtime/ports/canonical";
import type { CanonicalGuide } from "../../tiss-mapping-runtime/ports/canonical";
import type { QualityAssessment } from "../../quality-runtime/ports/canonical";
import type { ValidationResult } from "../../validation-runtime/ports/canonical";
import type { AuditResult } from "../../audit-runtime/ports/canonical";

export type {
  OperatorCapabilityProfile,
  XMLDocument,
  XMLValidationResult,
  CanonicalGuide,
  QualityAssessment,
  ValidationResult,
  AuditResult,
};

/** Status estrutural Authorization (C-05). */
export type AuthorizationStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "prepared"
  | "disabled"
  | "unknown"
  | (string & {});

/**
 * Envelope operacional estrutural (Regra Permanente nº 4 — Observability by Design).
 * Somente contrato — sem telemetria / tracing / logging funcional.
 */
export type AuthorizationRuntimeObservabilityEnvelope = {
  operationId?: string;
  correlationId?: string | null;
  startedAt?: string;
  finishedAt?: string;
  executionStatus?: AuthorizationStatus | (string & {});
  executionDuration?: number;
  processedItems?: number;
  warnings?: readonly string[];
  errors?: readonly string[];
  traceMetadata?: Readonly<Record<string, unknown>>;
};

/**
 * Estratégias previstas (somente contrato — Regra Permanente nº 9).
 * O Runtime futuro seleciona estratégias; nunca implementa autorização inline.
 */
export type AuthorizationStrategyKind =
  | "synchronous"
  | "asynchronous"
  | "batch"
  | "eligibility"
  | "attachment"
  | "pre-authorization"
  | "hybrid"
  | (string & {});

/**
 * AuthorizationStrategy canônica (C-05 / Regra Permanente nº 9).
 * Somente contrato — sem implementação funcional.
 */
export type AuthorizationStrategy = {
  kind: "canonical-authorization-strategy";
  strategyId?: string;
  strategyKind?: AuthorizationStrategyKind;
  displayName?: string;
  notes?: string;
  strategyImplemented: false;
  authorizationImplemented: false;
};

/**
 * AuthorizationPolicy canônica (C-05 / POLICY-DRIVEN AUTHORIZATION).
 * Consulta futura: OperatorCapabilityProfile + AuthorizationPolicy.
 * Sem if/switch por operadora/versão/guia. Sem implementação funcional.
 */
export type AuthorizationPolicy = {
  kind: "canonical-authorization-policy";
  policyId?: string;
  name?: string;
  preferredStrategyKind?: AuthorizationStrategyKind;
  capabilityProfile?: OperatorCapabilityProfile;
  strategy?: AuthorizationStrategy;
  notes?: string;
  authorizationPolicyImplemented: false;
  authorizationImplemented: false;
  eligibilityImplemented: false;
  attachmentAuthorizationImplemented: false;
  batchAuthorizationImplemented: false;
  statusPollingImplemented: false;
  preAuthorizationImplemented: false;
};

/** Metadados estruturais (somente contrato). */
export type AuthorizationMetadata = {
  kind: "canonical-authorization-metadata";
  notes?: string;
  authorizationMetadataImplemented: false;
};

/**
 * AuthorizationContext canônico (C-05).
 * Aceita peers estruturais por contrato — sem qualquer processamento.
 * Prevê envelope de observabilidade (RULE_04) — sem implementação.
 */
export type AuthorizationContext = AuthorizationRuntimeObservabilityEnvelope & {
  kind: "canonical-authorization-context";
  contextId?: string;
  requestId?: string;
  responseId?: string;
  strategyId?: string;
  policyId?: string;
  strategy?: AuthorizationStrategy;
  policy?: AuthorizationPolicy;
  capabilityProfile?: OperatorCapabilityProfile;
  xmlDocument?: XMLDocument;
  xmlValidationResult?: XMLValidationResult;
  canonicalGuide?: CanonicalGuide;
  qualityAssessment?: QualityAssessment;
  validationResult?: ValidationResult;
  auditResult?: AuditResult;
  metadata?: AuthorizationMetadata;
  structuralNotes?: string;
};

/** Pedido canônico Authorization (C-05). */
export type AuthorizationRequest = {
  kind: "canonical-authorization-request";
  requestId?: string;
  name?: string;
  operation?: string;
  authorizationContext?: AuthorizationContext;
  strategy?: AuthorizationStrategy;
  policy?: AuthorizationPolicy;
  capabilityProfile?: OperatorCapabilityProfile;
  xmlDocument?: XMLDocument;
  xmlValidationResult?: XMLValidationResult;
  canonicalGuide?: CanonicalGuide;
  qualityAssessment?: QualityAssessment;
  validationResult?: ValidationResult;
  auditResult?: AuditResult;
  structuralNotes?: string;
  authorizationImplemented: false;
  eligibilityImplemented: false;
  attachmentAuthorizationImplemented: false;
  batchAuthorizationImplemented: false;
  statusPollingImplemented: false;
  preAuthorizationImplemented: false;
  soapFunctionalImplemented: false;
  xmlFunctionalImplemented: false;
  restImplemented: false;
  operatorCommunicationImplemented: false;
};

/** Resposta canônica Authorization (C-05). */
export type AuthorizationResponse = {
  kind: "canonical-authorization-response";
  ok: boolean;
  responseId: string;
  request: AuthorizationRequest;
  strategy?: AuthorizationStrategy;
  policy?: AuthorizationPolicy;
  authorizationContext?: AuthorizationContext;
  capabilityProfile?: OperatorCapabilityProfile;
  xmlDocument?: XMLDocument;
  xmlValidationResult?: XMLValidationResult;
  canonicalGuide?: CanonicalGuide;
  qualityAssessment?: QualityAssessment;
  validationResult?: ValidationResult;
  auditResult?: AuditResult;
  /** Sempre false — nenhuma autorização real executada. */
  authorizationExecuted: false;
  /** Sempre false — nenhuma elegibilidade real executada. */
  eligibilityExecuted: false;
  /** Sempre false — nenhuma comunicação com operadora executada. */
  communicationExecuted: false;
  /** Sempre true — runtime estrutural pronto (C-05). */
  runtimeReady: true;
  authorizationImplemented: false;
  eligibilityImplemented: false;
  attachmentAuthorizationImplemented: false;
  batchAuthorizationImplemented: false;
  statusPollingImplemented: false;
  preAuthorizationImplemented: false;
  soapFunctionalImplemented: false;
  xmlFunctionalImplemented: false;
  restImplemented: false;
  operatorCommunicationImplemented: false;
  status: AuthorizationStatus;
  message?: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
};

/** Estatísticas estruturais do Authorization Runtime (in-process). */
export type AuthorizationStatistics = {
  kind: "canonical-authorization-statistics";
  totalStrategies: number;
  totalPolicies: number;
  totalResponses: number;
  completedResponses: number;
  failedResponses: number;
  cancelledResponses: number;
  preparedResponses: number;
  totalRequests: number;
  totalContexts: number;
  authorizationExecutedCount: 0;
  eligibilityExecutedCount: 0;
  communicationExecutedCount: 0;
  authorizationImplementedCount: 0;
  eligibilityImplementedCount: 0;
  attachmentAuthorizationImplementedCount: 0;
  batchAuthorizationImplementedCount: 0;
  statusPollingImplementedCount: 0;
  preAuthorizationImplementedCount: 0;
  soapFunctionalImplementedCount: 0;
  xmlFunctionalImplementedCount: 0;
  restImplementedCount: 0;
  operatorCommunicationImplementedCount: 0;
};

/** Saúde canônica estrutural do provedor Authorization Runtime. */
export type AuthorizationHealth = {
  kind: "canonical-authorization-health";
  ok: boolean;
  provider: string;
  latencyMs?: number;
  message?: string;
  status?: string;
  storedStrategyCount?: number;
  storedPolicyCount?: number;
  storedResponseCount?: number;
  storedRequestCount?: number;
  storedContextCount?: number;
  operatorRuntimeOk?: boolean;
  soapRuntimeOk?: boolean;
  xmlRuntimeOk?: boolean;
  xmlValidationRuntimeOk?: boolean;
  qualityRuntimeOk?: boolean;
  autoFillRuntimeOk?: boolean;
  auditRuntimeOk?: boolean;
  validationRuntimeOk?: boolean;
  runtimeReady: true;
  authorizationImplemented: false;
  eligibilityImplemented: false;
  attachmentAuthorizationImplemented: false;
  batchAuthorizationImplemented: false;
  statusPollingImplemented: false;
  preAuthorizationImplemented: false;
  soapFunctionalImplemented: false;
  xmlFunctionalImplemented: false;
  restImplemented: false;
  operatorCommunicationImplemented: false;
};

/**
 * Capacidades canônicas declaradas do provedor Authorization Runtime.
 * Todas as flags `*Implemented` permanecem literalmente `false`.
 */
export type AuthorizationCapabilities = {
  kind: "canonical-authorization-capabilities";
  supportsPrepareAuthorization: boolean;
  supportsGetAuthorization: boolean;
  supportsListAuthorizations: boolean;
  supportsStats: boolean;
  supportsHealth: boolean;
  supportsCanonicalAuthorization: boolean;
  supportsStrategySelection: boolean;
  supportsPolicyDrivenAuthorization: boolean;
  runtimeReady: true;
  authorizationImplemented: false;
  eligibilityImplemented: false;
  attachmentAuthorizationImplemented: false;
  batchAuthorizationImplemented: false;
  statusPollingImplemented: false;
  preAuthorizationImplemented: false;
  soapFunctionalImplemented: false;
  xmlFunctionalImplemented: false;
  restImplemented: false;
  operatorCommunicationImplemented: false;
  knowsOperatorOrCooperative: false;
  knowsContract: false;
  knowsTenant: false;
};

/** Helper estrutural — cria estratégia vazia/desabilitada. */
export function createEmptyAuthorizationStrategy(
  overrides: Partial<AuthorizationStrategy> = {},
): AuthorizationStrategy {
  return {
    kind: "canonical-authorization-strategy",
    strategyId: overrides.strategyId,
    strategyKind: overrides.strategyKind ?? "synchronous",
    displayName: overrides.displayName,
    notes:
      overrides.notes ?? "Structural authorization strategy contract (no functional authorization)",
    strategyImplemented: false,
    authorizationImplemented: false,
  };
}

/** Helper estrutural — cria política vazia/desabilitada. */
export function createEmptyAuthorizationPolicy(
  overrides: Partial<AuthorizationPolicy> = {},
): AuthorizationPolicy {
  return {
    kind: "canonical-authorization-policy",
    policyId: overrides.policyId,
    name: overrides.name,
    preferredStrategyKind: overrides.preferredStrategyKind ?? "synchronous",
    capabilityProfile: overrides.capabilityProfile,
    strategy: overrides.strategy ?? createEmptyAuthorizationStrategy(),
    notes:
      overrides.notes ??
      "Structural authorization policy contract (policy-driven — no functional authorization)",
    authorizationPolicyImplemented: false,
    authorizationImplemented: false,
    eligibilityImplemented: false,
    attachmentAuthorizationImplemented: false,
    batchAuthorizationImplemented: false,
    statusPollingImplemented: false,
    preAuthorizationImplemented: false,
  };
}
