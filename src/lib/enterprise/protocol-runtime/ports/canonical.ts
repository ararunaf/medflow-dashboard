/**
 * Modelos canônicos estruturais do Enterprise Protocol Runtime — C-07 / ECS-01.
 *
 * Foundation estrutural vendor-agnostic para Protocol Abstraction (RULE_12).
 *
 * Sem SOAP. Sem REST. Sem gRPC. Sem mensageria. Sem HTTP. Sem TLS.
 * Sem autenticação. Sem APIs. Sem banco. Sem envio de documentos.
 * Sem integração com operadoras. Sem resolução funcional de protocolos.
 *
 * PROTOCOL ABSTRACTION (Regra Permanente nº 12).
 * PROTOCOL RESOLUTION — contratos apenas (ProtocolResolver / ProtocolProfile /
 * ProtocolCapabilities); seleção futura via OperatorCapabilityProfile +
 * ProtocolCapabilities — sem implementação funcional.
 */

import type { OperatorCapabilityProfile } from "../../operator-runtime/ports/canonical";
import type { AuthorizationStrategy } from "../../authorization-runtime/ports/canonical";
import type { AuthorizationPolicy } from "../../authorization-runtime/ports/canonical";
import type { BatchManifest } from "../../batch-runtime/ports/canonical";
import type { XMLDocument } from "../../xml-tiss-runtime/ports/canonical";
import type { XMLValidationResult } from "../../xml-validation-runtime/ports/canonical";

export type {
  OperatorCapabilityProfile,
  AuthorizationStrategy,
  AuthorizationPolicy,
  BatchManifest,
  XMLDocument,
  XMLValidationResult,
};

/**
 * Estados canônicos do protocolo (C-07 / RULE_11 + RULE_12).
 * Somente declaração — sem transições funcionais / sem seleção de protocolo.
 */
export type ProtocolState =
  | "DECLARED"
  | "PROFILED"
  | "CAPABLE"
  | "PENDING_RESOLUTION"
  | "RESOLVED"
  | "ACTIVE"
  | "FAILED"
  | "DISABLED";

/** Lista oficial imutável dos estados canônicos. */
export const PROTOCOL_CANONICAL_STATES: readonly ProtocolState[] = [
  "DECLARED",
  "PROFILED",
  "CAPABLE",
  "PENDING_RESOLUTION",
  "RESOLVED",
  "ACTIVE",
  "FAILED",
  "DISABLED",
] as const;

/**
 * Envelope operacional estrutural (Regra Permanente nº 4 — Observability by Design).
 * Somente contrato — sem telemetria / tracing / logging funcional.
 */
export type ProtocolRuntimeObservabilityEnvelope = {
  operationId?: string;
  correlationId?: string | null;
  startedAt?: string;
  finishedAt?: string;
  executionStatus?: ProtocolState | (string & {});
  executionDuration?: number;
  processedItems?: number;
  warnings?: readonly string[];
  errors?: readonly string[];
  traceMetadata?: Readonly<Record<string, unknown>>;
};

/** Metadados estruturais do protocolo (somente contrato). */
export type ProtocolMetadata = {
  kind: "canonical-protocol-metadata";
  notes?: string;
  attributes?: Readonly<Record<string, unknown>>;
  protocolMetadataImplemented: false;
};

/**
 * Capacidades canônicas declaradas do Protocol Runtime.
 * Todas as flags `*Implemented` permanecem literalmente `false`.
 * Nenhum protocolo concreto é implementado (RULE_12).
 */
export type ProtocolCapabilities = {
  kind: "canonical-protocol-capabilities";
  supportsPrepareProfile: boolean;
  supportsGetProfile: boolean;
  supportsListProfiles: boolean;
  supportsResolveProtocol: boolean;
  supportsStats: boolean;
  supportsHealth: boolean;
  supportsCanonicalProtocolProfile: boolean;
  supportsProtocolResolver: boolean;
  runtimeReady: true;
  /** Explicitamente false — SOAP é apenas Adapter futuro (não nesta Sprint). */
  soapImplemented: false;
  /** Explicitamente false — REST é apenas Adapter futuro (não nesta Sprint). */
  restImplemented: false;
  /** Explicitamente false — gRPC é apenas Adapter futuro (não nesta Sprint). */
  grpcImplemented: false;
  /** Explicitamente false — mensageria é apenas Adapter futuro (não nesta Sprint). */
  messagingImplemented: false;
  /** Explicitamente false — resolução funcional não existe nesta Sprint. */
  protocolResolutionImplemented: false;
  httpImplemented: false;
  tlsImplemented: false;
  authenticationImplemented: false;
  knowsOperatorOrCooperative: false;
  knowsContract: false;
  knowsTenant: false;
};

/** Estatísticas estruturais do Protocol Runtime (in-process). */
export type ProtocolStatistics = {
  kind: "canonical-protocol-statistics";
  totalProfiles: number;
  totalContexts: number;
  totalResolvers: number;
  declaredCount: number;
  profiledCount: number;
  capableCount: number;
  pendingResolutionCount: number;
  resolvedCount: number;
  failedCount: number;
  disabledCount: number;
  soapImplementedCount: 0;
  restImplementedCount: 0;
  grpcImplementedCount: 0;
  messagingImplementedCount: 0;
  protocolResolutionImplementedCount: 0;
};

/** Saúde canônica estrutural do provedor Protocol Runtime. */
export type ProtocolHealth = {
  kind: "canonical-protocol-health";
  ok: boolean;
  provider: string;
  latencyMs?: number;
  message?: string;
  status?: string;
  storedProfileCount?: number;
  storedContextCount?: number;
  storedResolverCount?: number;
  batchRuntimeOk?: boolean;
  authorizationRuntimeOk?: boolean;
  operatorRuntimeOk?: boolean;
  soapRuntimeOk?: boolean;
  xmlRuntimeOk?: boolean;
  xmlValidationRuntimeOk?: boolean;
  runtimeReady: true;
  soapImplemented: false;
  restImplemented: false;
  grpcImplemented: false;
  messagingImplemented: false;
  protocolResolutionImplemented: false;
};

/**
 * ProtocolProfile canônico (C-07 / PROTOCOL RESOLUTION).
 * Contrato de perfil — sem seleção / sem protocolo concreto.
 * Runtime nunca seleciona protocolos diretamente (RULE_12).
 */
export type ProtocolProfile = {
  kind: "canonical-protocol-profile";
  profileId?: string;
  profileName?: string;
  /** Identificador opaco abstrato — nunca usado em if/switch de protocolo. */
  abstractProtocolRef?: string;
  state?: ProtocolState;
  requiredCapabilities?: ProtocolCapabilities;
  operatorCapabilityProfile?: OperatorCapabilityProfile;
  metadata?: ProtocolMetadata;
  tags?: readonly string[];
  owner?: string;
  creationTimestamp?: string;
  structuralNotes?: string;
  soapImplemented: false;
  restImplemented: false;
  grpcImplemented: false;
  messagingImplemented: false;
  protocolResolutionImplemented: false;
};

/**
 * ProtocolResolver canônico (C-07 / PROTOCOL RESOLUTION).
 * Contrato apenas — resolução futura via OperatorCapabilityProfile +
 * ProtocolCapabilities. Sem qualquer implementação funcional.
 */
export type ProtocolResolver = {
  kind: "canonical-protocol-resolver";
  resolverId?: string;
  name?: string;
  /**
   * Entrada estrutural futura (não consumida funcionalmente).
   * Resolução = OperatorCapabilityProfile + ProtocolCapabilities.
   */
  operatorCapabilityProfile?: OperatorCapabilityProfile;
  protocolCapabilities?: ProtocolCapabilities;
  resolvedProfile?: ProtocolProfile;
  notes?: string;
  /** Sempre false — nenhuma resolução funcional nesta Sprint. */
  protocolResolutionImplemented: false;
  soapImplemented: false;
  restImplemented: false;
  grpcImplemented: false;
  messagingImplemented: false;
};

/**
 * ProtocolContext canônico (C-07).
 * Aceita peers estruturais por contrato — sem qualquer processamento.
 * Prevê envelope de observabilidade (RULE_04) — sem implementação.
 */
export type ProtocolContext = ProtocolRuntimeObservabilityEnvelope & {
  kind: "canonical-protocol-context";
  contextId?: string;
  profileId?: string;
  profile?: ProtocolProfile;
  resolver?: ProtocolResolver;
  state?: ProtocolState;
  operatorCapabilityProfile?: OperatorCapabilityProfile;
  authorizationStrategy?: AuthorizationStrategy;
  authorizationPolicy?: AuthorizationPolicy;
  batchManifest?: BatchManifest;
  xmlDocument?: XMLDocument;
  xmlValidationResult?: XMLValidationResult;
  metadata?: ProtocolMetadata;
  structuralNotes?: string;
};

/** Helper estrutural — cria capacidades canônicas com flags literais false. */
export function createEmptyProtocolCapabilities(
  overrides: Partial<ProtocolCapabilities> = {},
): ProtocolCapabilities {
  return {
    kind: "canonical-protocol-capabilities",
    supportsPrepareProfile: overrides.supportsPrepareProfile ?? true,
    supportsGetProfile: overrides.supportsGetProfile ?? true,
    supportsListProfiles: overrides.supportsListProfiles ?? true,
    supportsResolveProtocol: overrides.supportsResolveProtocol ?? true,
    supportsStats: overrides.supportsStats ?? true,
    supportsHealth: overrides.supportsHealth ?? true,
    supportsCanonicalProtocolProfile: overrides.supportsCanonicalProtocolProfile ?? true,
    supportsProtocolResolver: overrides.supportsProtocolResolver ?? true,
    runtimeReady: true,
    soapImplemented: false,
    restImplemented: false,
    grpcImplemented: false,
    messagingImplemented: false,
    protocolResolutionImplemented: false,
    httpImplemented: false,
    tlsImplemented: false,
    authenticationImplemented: false,
    knowsOperatorOrCooperative: false,
    knowsContract: false,
    knowsTenant: false,
  };
}

/** Helper estrutural — cria ProtocolResolver declarativo (sem resolução). */
export function createEmptyProtocolResolver(
  overrides: Partial<ProtocolResolver> = {},
): ProtocolResolver {
  return {
    kind: "canonical-protocol-resolver",
    resolverId: overrides.resolverId,
    name: overrides.name,
    operatorCapabilityProfile: overrides.operatorCapabilityProfile,
    protocolCapabilities: overrides.protocolCapabilities,
    resolvedProfile: overrides.resolvedProfile,
    notes:
      overrides.notes ??
      "Structural ProtocolResolver contract (OperatorCapabilityProfile + ProtocolCapabilities — no functional resolution)",
    protocolResolutionImplemented: false,
    soapImplemented: false,
    restImplemented: false,
    grpcImplemented: false,
    messagingImplemented: false,
  };
}

/** Helper estrutural — cria ProtocolProfile vazio no estado DECLARED. */
export function createEmptyProtocolProfile(
  overrides: Partial<ProtocolProfile> = {},
): ProtocolProfile {
  return {
    kind: "canonical-protocol-profile",
    profileId: overrides.profileId,
    profileName: overrides.profileName,
    abstractProtocolRef: overrides.abstractProtocolRef,
    state: overrides.state ?? "DECLARED",
    requiredCapabilities: overrides.requiredCapabilities ?? createEmptyProtocolCapabilities(),
    operatorCapabilityProfile: overrides.operatorCapabilityProfile,
    metadata: overrides.metadata ?? {
      kind: "canonical-protocol-metadata",
      protocolMetadataImplemented: false,
    },
    tags: overrides.tags ?? [],
    owner: overrides.owner,
    creationTimestamp: overrides.creationTimestamp,
    structuralNotes:
      overrides.structuralNotes ??
      "Structural ProtocolProfile contract (protocol abstraction — no concrete protocol)",
    soapImplemented: false,
    restImplemented: false,
    grpcImplemented: false,
    messagingImplemented: false,
    protocolResolutionImplemented: false,
  };
}
