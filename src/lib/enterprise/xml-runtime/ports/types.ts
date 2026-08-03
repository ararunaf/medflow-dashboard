/**
 * Tipos vendor-agnósticos do Enterprise XML Runtime — TISS-04.
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → TISS Runtime
 *     → TISSCatalogPort → RulePackEnginePort
 *     → XMLRuntimePort → Adapter → XML Store
 *
 * Sem geração XML real. Sem operadoras. Sem contratos. Sem tenants.
 * Conhecimento TISS exclusivamente via TISSCatalogPort + RulePackEnginePort.
 */
import type { RulePackEnginePort } from "../../rule-pack-engine/ports/rule-pack-engine-port";
import type { TISSCatalogPort } from "../../tiss-catalog/ports/tiss-catalog-port";
import type {
  CanonicalXMLGeneration,
  CanonicalXMLProviderCapabilities,
  CanonicalXMLProviderHealth,
  CanonicalXMLRequest,
  CanonicalXMLResult,
  CanonicalXMLRuntimeConfiguration,
  CanonicalXMLStatistics,
} from "./canonical";
import type { XMLRuntimeCapabilities } from "./capabilities";

export type {
  CanonicalXMLGeneration,
  CanonicalXMLGenerationStatus,
  CanonicalXMLMetadata,
  CanonicalXMLProviderCapabilities,
  CanonicalXMLProviderHealth,
  CanonicalXMLRequest,
  CanonicalXMLResult,
  CanonicalXMLRuntimeConfiguration,
  CanonicalXMLStatistics,
} from "./canonical";
export type { XMLRuntimeCapabilities };

/** Provedores / mecanismos do XML Runtime. */
export type XMLRuntimeProviderId = "mock" | "test" | "default" | "enterprise";

/** Status operacional declarado no registry. */
export type XMLRuntimeStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Telemetria estrutural embutida no resultado. */
export type XMLRuntimeTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: string;
};

/** Logging estrutural embutido. */
export type XMLRuntimeStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: XMLRuntimeProviderId;
  attempt?: number;
  operation?: string;
};

/** Resultado de health check (espelha CanonicalXMLProviderHealth). */
export type XMLRuntimeHealth = CanonicalXMLProviderHealth & {
  provider: XMLRuntimeProviderId;
  status?: XMLRuntimeStatus;
};

/** Capacidades do adapter no nível do Port. */
export type XMLRuntimePortCapabilities = {
  provider: XMLRuntimeProviderId;
  adapterId: string;
  engine: XMLRuntimeCapabilities;
  canonical: CanonicalXMLProviderCapabilities;
  supportsCanonicalResult: boolean;
  supportsTimeout: boolean;
  supportsRetry: boolean;
  supportsCancellation: boolean;
  supportsTelemetry: boolean;
  consumesTISSCatalogPort: boolean;
  consumesRulePackEnginePort: boolean;
  implementsRealXml: false;
  implementsOperatorDispatch: false;
  implementsAnsValidation: false;
  implementsBusinessRules: false;
  knowsOperatorOrCooperative: false;
  knowsContract: false;
  knowsTenant: false;
};

/** Metadados estáveis do provedor. */
export type XMLRuntimeProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
};

/** Info agregada retornada por providerInfo(). */
export type XMLRuntimeInfo = {
  providerId: XMLRuntimeProviderId;
  metadata: XMLRuntimeProviderMetadata;
  status: XMLRuntimeStatus;
  providerType: "XML_RUNTIME";
  capabilities: XMLRuntimeCapabilities;
  configuration?: CanonicalXMLRuntimeConfiguration;
};

/** Controles operacionais comuns (timeout / retry / cancel). */
export type XMLRuntimeOperationalControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Envelope comum de resultado operacional. */
export type XMLRuntimeOperationEnvelope = {
  ok: boolean;
  requestId?: string;
  message?: string;
  code?: string;
  provider: XMLRuntimeProviderId;
  telemetry: XMLRuntimeTelemetry;
  logs?: readonly XMLRuntimeStructuredLog[];
  simulated?: boolean;
};

export type GenerateXMLInput = XMLRuntimeOperationalControls & {
  request?: CanonicalXMLRequest;
  documentId?: string;
  catalogProfileCode?: string;
  rulePackCode?: string;
};

export type GenerateXMLResult = XMLRuntimeOperationEnvelope & {
  generation?: CanonicalXMLGeneration;
  result?: CanonicalXMLResult;
};

export type ValidateXMLInput = XMLRuntimeOperationalControls & {
  request?: CanonicalXMLRequest;
  generationId?: string;
};

export type ValidateXMLResult = XMLRuntimeOperationEnvelope & {
  generation?: CanonicalXMLGeneration;
  result?: CanonicalXMLResult;
  valid: boolean;
};

export type CancelXMLInput = XMLRuntimeOperationalControls & {
  generationId: string;
};

export type CancelXMLResult = XMLRuntimeOperationEnvelope & {
  generation?: CanonicalXMLGeneration;
};

export type GetXMLGenerationInput = XMLRuntimeOperationalControls & {
  generationId: string;
};

export type GetXMLGenerationResult = XMLRuntimeOperationEnvelope & {
  generation?: CanonicalXMLGeneration;
};

export type ListXMLGenerationsInput = XMLRuntimeOperationalControls & {
  status?: string;
};

export type ListXMLGenerationsResult = XMLRuntimeOperationEnvelope & {
  generations: readonly CanonicalXMLGeneration[];
  statistics?: CanonicalXMLStatistics;
};

/** Dependências Enterprise injetadas no adapter. */
export type XMLRuntimeEnterpriseDeps = {
  /** Fonte autorizada de conhecimento TISS (catálogo). */
  getTISSCatalogPort(): TISSCatalogPort;
  /** Fonte autorizada de Rule Packs estruturais. */
  getRulePackEnginePort(): RulePackEnginePort;
};

/** Opções de resolução do XMLRuntimePort. */
export type XMLRuntimeOptions = {
  /**
   * Provedor desejado. Default da fundação: `enterprise` (TISS-04).
   */
  provider?: XMLRuntimeProviderId;
  enterpriseDeps?: XMLRuntimeEnterpriseDeps;
};

/** Entrada de registro no XMLRuntimeRegistry. */
export type XMLRuntimeRegistration = {
  providerId: XMLRuntimeProviderId;
  name: string;
  version: string;
  status: XMLRuntimeStatus;
  adapterId: string;
  vendor: string;
  capabilities: XMLRuntimeCapabilities;
  description?: string;
};
