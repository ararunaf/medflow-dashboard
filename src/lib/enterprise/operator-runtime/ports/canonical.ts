/**
 * Modelos canônicos estruturais do Enterprise Operator Runtime — C-04 / ECS-01.
 *
 * Foundation estrutural vendor-agnostic para representação futura de
 * operadoras exclusivamente via OperatorCapabilityProfile.
 *
 * Sem operadoras reais. Sem lógica condicional por operadora.
 * Sem autenticação. Sem SOAP funcional. Sem XML funcional. Sem REST.
 * Sem banco. Sem persistência. Sem APIs. Sem HTTP. Sem TLS. Sem certificados.
 *
 * OPERATOR CAPABILITY MODEL (Regra Permanente nº 7): nenhuma operadora
 * é conhecida; especialização futura ocorre apenas por Adapters + Profiles.
 */

import type { XMLDocument } from "../../xml-tiss-runtime/ports/canonical";
import type { XMLValidationResult } from "../../xml-validation-runtime/ports/canonical";
import type { CanonicalGuide } from "../../tiss-mapping-runtime/ports/canonical";
import type { QualityAssessment } from "../../quality-runtime/ports/canonical";
import type { ValidationResult } from "../../validation-runtime/ports/canonical";
import type { AuditResult } from "../../audit-runtime/ports/canonical";

export type {
  XMLDocument,
  XMLValidationResult,
  CanonicalGuide,
  QualityAssessment,
  ValidationResult,
  AuditResult,
};

/** Status estrutural Operator (C-04). */
export type OperatorStatus =
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
export type OperatorRuntimeObservabilityEnvelope = {
  operationId?: string;
  correlationId?: string | null;
  startedAt?: string;
  finishedAt?: string;
  executionStatus?: OperatorStatus | (string & {});
  executionDuration?: number;
  processedItems?: number;
  warnings?: readonly string[];
  errors?: readonly string[];
  traceMetadata?: Readonly<Record<string, unknown>>;
};

/** Features estruturais do perfil (somente contrato). */
export type OperatorFeatures = {
  kind: "canonical-operator-features";
  supportsAuthorization?: boolean;
  supportsCancellation?: boolean;
  supportsBatch?: boolean;
  supportsAttachments?: boolean;
  supportsAsyncProcessing?: boolean;
  supportsProtocolQuery?: boolean;
  supportsEligibility?: boolean;
  supportsStatusPolling?: boolean;
  operatorFeaturesImplemented: false;
};

/** Restrições estruturais do perfil (somente contrato). */
export type OperatorRestrictions = {
  kind: "canonical-operator-restrictions";
  notes?: string;
  operatorRestrictionsImplemented: false;
};

/** Metadados estruturais do perfil (somente contrato). */
export type OperatorMetadata = {
  kind: "canonical-operator-metadata";
  notes?: string;
  operatorMetadataImplemented: false;
};

/**
 * OperatorCapabilityProfile canônico (C-04 / Regra Permanente nº 7).
 *
 * Representa capacidades declaradas de uma operadora futura.
 * `operatorId` / `displayName` são opacos — NUNCA usar em lógica condicional.
 * Sem implementação funcional.
 */
export type OperatorCapabilityProfile = {
  kind: "canonical-operator-capability-profile";
  profileId?: string;
  operatorId?: string;
  displayName?: string;
  supportedTissVersions?: readonly string[];
  supportedGuideTypes?: readonly string[];
  supportsAuthorization?: boolean;
  supportsCancellation?: boolean;
  supportsBatch?: boolean;
  supportsAttachments?: boolean;
  supportsAsyncProcessing?: boolean;
  supportsProtocolQuery?: boolean;
  supportsEligibility?: boolean;
  supportsStatusPolling?: boolean;
  supportedAuthenticationMethods?: readonly string[];
  supportedTransportProtocols?: readonly string[];
  maxBatchSize?: number;
  maxAttachmentSize?: number;
  supportedFileFormats?: readonly string[];
  supportedCharacterEncoding?: readonly string[];
  supportedCompression?: readonly string[];
  customCapabilities?: Readonly<Record<string, unknown>>;
  features?: OperatorFeatures;
  restrictions?: OperatorRestrictions;
  metadata?: OperatorMetadata;
  operatorCapabilityProfileImplemented: false;
  operatorImplemented: false;
  operatorAuthenticationImplemented: false;
  operatorCommunicationImplemented: false;
  soapFunctionalImplemented: false;
  xmlFunctionalImplemented: false;
  restImplemented: false;
  authorizationImplemented: false;
};

/**
 * OperatorContext canônico (C-04).
 * Aceita peers estruturais por contrato — sem qualquer processamento.
 * Prevê envelope de observabilidade (RULE_04) — sem implementação.
 */
export type OperatorContext = OperatorRuntimeObservabilityEnvelope & {
  kind: "canonical-operator-context";
  contextId?: string;
  profileId?: string;
  requestId?: string;
  responseId?: string;
  capabilityProfile?: OperatorCapabilityProfile;
  xmlDocument?: XMLDocument;
  xmlValidationResult?: XMLValidationResult;
  canonicalGuide?: CanonicalGuide;
  qualityAssessment?: QualityAssessment;
  validationResult?: ValidationResult;
  auditResult?: AuditResult;
  structuralNotes?: string;
};

/** Pedido canônico Operator (C-04). */
export type OperatorRequest = {
  kind: "canonical-operator-request";
  requestId?: string;
  name?: string;
  operation?: string;
  operatorContext?: OperatorContext;
  capabilityProfile?: OperatorCapabilityProfile;
  xmlDocument?: XMLDocument;
  xmlValidationResult?: XMLValidationResult;
  canonicalGuide?: CanonicalGuide;
  qualityAssessment?: QualityAssessment;
  validationResult?: ValidationResult;
  auditResult?: AuditResult;
  structuralNotes?: string;
  operatorImplemented: false;
  operatorCapabilityProfileImplemented: false;
  operatorAuthenticationImplemented: false;
  operatorCommunicationImplemented: false;
  soapFunctionalImplemented: false;
  xmlFunctionalImplemented: false;
  restImplemented: false;
  authorizationImplemented: false;
};

/** Resposta canônica Operator (C-04). */
export type OperatorResponse = {
  kind: "canonical-operator-response";
  ok: boolean;
  responseId: string;
  request: OperatorRequest;
  profile?: OperatorCapabilityProfile;
  operatorContext?: OperatorContext;
  xmlDocument?: XMLDocument;
  xmlValidationResult?: XMLValidationResult;
  canonicalGuide?: CanonicalGuide;
  qualityAssessment?: QualityAssessment;
  validationResult?: ValidationResult;
  auditResult?: AuditResult;
  /** Sempre false — nenhuma operadora real resolvida. */
  realOperatorResolved: false;
  /** Sempre false — nenhuma comunicação com operadora executada. */
  communicationExecuted: false;
  /** Sempre true — runtime estrutural pronto (C-04). */
  runtimeReady: true;
  operatorImplemented: false;
  operatorCapabilityProfileImplemented: false;
  operatorAuthenticationImplemented: false;
  operatorCommunicationImplemented: false;
  soapFunctionalImplemented: false;
  xmlFunctionalImplemented: false;
  restImplemented: false;
  authorizationImplemented: false;
  status: OperatorStatus;
  message?: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
};

/** Estatísticas estruturais do Operator Runtime (in-process). */
export type OperatorStatistics = {
  kind: "canonical-operator-statistics";
  totalProfiles: number;
  totalResponses: number;
  completedResponses: number;
  failedResponses: number;
  cancelledResponses: number;
  preparedResponses: number;
  totalRequests: number;
  totalContexts: number;
  realOperatorResolvedCount: 0;
  communicationExecutedCount: 0;
  operatorImplementedCount: 0;
  operatorCapabilityProfileImplementedCount: 0;
  operatorAuthenticationImplementedCount: 0;
  operatorCommunicationImplementedCount: 0;
  soapFunctionalImplementedCount: 0;
  xmlFunctionalImplementedCount: 0;
  restImplementedCount: 0;
  authorizationImplementedCount: 0;
};

/** Saúde canônica estrutural do provedor Operator Runtime. */
export type OperatorHealth = {
  kind: "canonical-operator-health";
  ok: boolean;
  provider: string;
  latencyMs?: number;
  message?: string;
  status?: string;
  storedProfileCount?: number;
  storedResponseCount?: number;
  storedRequestCount?: number;
  storedContextCount?: number;
  soapRuntimeOk?: boolean;
  xmlRuntimeOk?: boolean;
  xmlValidationRuntimeOk?: boolean;
  qualityRuntimeOk?: boolean;
  autoFillRuntimeOk?: boolean;
  tissMappingRuntimeOk?: boolean;
  auditRuntimeOk?: boolean;
  validationRuntimeOk?: boolean;
  runtimeReady: true;
  operatorImplemented: false;
  operatorCapabilityProfileImplemented: false;
  operatorAuthenticationImplemented: false;
  operatorCommunicationImplemented: false;
  soapFunctionalImplemented: false;
  xmlFunctionalImplemented: false;
  restImplemented: false;
  authorizationImplemented: false;
};

/**
 * Capacidades canônicas declaradas do provedor Operator Runtime.
 * Todas as flags `*Implemented` permanecem literalmente `false`.
 */
export type OperatorCapabilities = {
  kind: "canonical-operator-capabilities";
  supportsPrepareProfile: boolean;
  supportsGetProfile: boolean;
  supportsListProfiles: boolean;
  supportsStats: boolean;
  supportsHealth: boolean;
  supportsCanonicalOperator: boolean;
  runtimeReady: true;
  operatorImplemented: false;
  operatorCapabilityProfileImplemented: false;
  operatorAuthenticationImplemented: false;
  operatorCommunicationImplemented: false;
  soapFunctionalImplemented: false;
  xmlFunctionalImplemented: false;
  restImplemented: false;
  authorizationImplemented: false;
  knowsOperatorOrCooperative: false;
  knowsContract: false;
  knowsTenant: false;
};

/** Helper estrutural — cria perfil de capacidade vazio/desabilitado. */
export function createEmptyOperatorCapabilityProfile(
  overrides: Partial<OperatorCapabilityProfile> = {},
): OperatorCapabilityProfile {
  return {
    kind: "canonical-operator-capability-profile",
    profileId: overrides.profileId,
    operatorId: overrides.operatorId,
    displayName: overrides.displayName,
    supportedTissVersions: overrides.supportedTissVersions ?? [],
    supportedGuideTypes: overrides.supportedGuideTypes ?? [],
    supportsAuthorization: overrides.supportsAuthorization ?? false,
    supportsCancellation: overrides.supportsCancellation ?? false,
    supportsBatch: overrides.supportsBatch ?? false,
    supportsAttachments: overrides.supportsAttachments ?? false,
    supportsAsyncProcessing: overrides.supportsAsyncProcessing ?? false,
    supportsProtocolQuery: overrides.supportsProtocolQuery ?? false,
    supportsEligibility: overrides.supportsEligibility ?? false,
    supportsStatusPolling: overrides.supportsStatusPolling ?? false,
    supportedAuthenticationMethods: overrides.supportedAuthenticationMethods ?? [],
    supportedTransportProtocols: overrides.supportedTransportProtocols ?? [],
    maxBatchSize: overrides.maxBatchSize,
    maxAttachmentSize: overrides.maxAttachmentSize,
    supportedFileFormats: overrides.supportedFileFormats ?? [],
    supportedCharacterEncoding: overrides.supportedCharacterEncoding ?? [],
    supportedCompression: overrides.supportedCompression ?? [],
    customCapabilities: overrides.customCapabilities ?? {},
    features: overrides.features ?? {
      kind: "canonical-operator-features",
      operatorFeaturesImplemented: false,
    },
    restrictions: overrides.restrictions ?? {
      kind: "canonical-operator-restrictions",
      notes: "Structural operator restrictions contract (no real operator)",
      operatorRestrictionsImplemented: false,
    },
    metadata: overrides.metadata ?? {
      kind: "canonical-operator-metadata",
      notes: "Structural operator metadata contract (no real operator)",
      operatorMetadataImplemented: false,
    },
    operatorCapabilityProfileImplemented: false,
    operatorImplemented: false,
    operatorAuthenticationImplemented: false,
    operatorCommunicationImplemented: false,
    soapFunctionalImplemented: false,
    xmlFunctionalImplemented: false,
    restImplemented: false,
    authorizationImplemented: false,
  };
}
