/**
 * Tipos vendor-agnósticos do Enterprise XML Runtime — TISS-04 / TISS-05.
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → TISS Runtime
 *     → TISSCatalogPort → RulePackEnginePort
 *     → XMLRuntimePort → XMLGenerationRuntimePort
 *     → Adapter → XML Generation Store → Canonical XML Result
 *
 * Sem geração XML real. Sem operadoras. Sem contratos. Sem tenants.
 * Conhecimento TISS exclusivamente via TISSCatalogPort + RulePackEnginePort.
 * Materialização canônica exclusivamente via XMLGenerationRuntimePort (TISS-05).
 */
import type { RulePackEnginePort } from "../../rule-pack-engine/ports/rule-pack-engine-port";
import type { TISSCatalogPort } from "../../tiss-catalog/ports/tiss-catalog-port";
import type { XMLGenerationRuntimePort } from "../../xml-generation-runtime/ports/xml-generation-runtime-port";
import type { CanonicalXMLParsingResult, XMLRuntimeContext } from "../parser/canonical";
import type {
  CanonicalXMLGeneration,
  CanonicalXMLMetadata,
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
export type {
  CanonicalXMLAttribute,
  CanonicalXMLDocument,
  CanonicalXMLHeader,
  CanonicalXMLNode,
  CanonicalXMLParserStatistics,
  CanonicalXMLParsingError,
  CanonicalXMLParsingResult,
  XMLRuntimeContext,
} from "../parser/canonical";

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
  supportsParse: boolean;
  supportsTimeout: boolean;
  supportsRetry: boolean;
  supportsCancellation: boolean;
  supportsTelemetry: boolean;
  consumesTISSCatalogPort: boolean;
  consumesRulePackEnginePort: boolean;
  consumesXMLGenerationRuntimePort: boolean;
  parserImplemented: true;
  xsdImplemented: false;
  xmlValidationImplemented: false;
  schemaImplemented: false;
  xpathImplemented: false;
  soapImplemented: false;
  tissKnowledgeImplemented: false;
  operatorKnowledgeImplemented: false;
  httpImplemented: false;
  batchImplemented: false;
  workflowImplemented: false;
  returnImplemented: false;
  reconciliationImplemented: false;
  authorizationImplemented: false;
  persistenceImplemented: false;
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

/** D-01 — entrada do parser XML funcional. */
export type ParseXMLInput = XMLRuntimeOperationalControls & {
  /** XML em string. */
  xml: string;
  metadata?: CanonicalXMLMetadata;
};

/** D-01 — resultado do parser XML funcional. */
export type ParseXMLResult = XMLRuntimeOperationEnvelope & {
  parsing?: CanonicalXMLParsingResult;
  context?: XMLRuntimeContext | null;
  document?: CanonicalXMLParsingResult["document"];
};

/** Dependências Enterprise injetadas no adapter. */
export type XMLRuntimeEnterpriseDeps = {
  /** Fonte autorizada de conhecimento TISS (catálogo). */
  getTISSCatalogPort(): TISSCatalogPort;
  /** Fonte autorizada de Rule Packs estruturais. */
  getRulePackEnginePort(): RulePackEnginePort;
  /** Fonte autorizada de materialização XML canônica (TISS-05). */
  getXMLGenerationRuntimePort(): XMLGenerationRuntimePort;
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
