/**
 * Tipos vendor-agnósticos do Enterprise XML Validation Runtime — C-02 / ECS-01.
 *
 * Fluxo estrutural (C-02):
 *   Produto → Enterprise Runtime → XMLValidationRuntimePort
 *     → Adapter → XML Validation Runtime Store → XMLValidationResult
 *
 * C-02: infraestrutura canônica estrutural apenas — sem validação XML /
 * sem XSD / sem parser / sem correção automática / sem SOAP / sem operadoras /
 * sem banco / sem persistência / sem APIs / sem IA.
 */
import type { DocumentClassificationRuntimePort } from "../../document-classification-runtime/ports/document-classification-runtime-port";
import type { DocumentExtractionRuntimePort } from "../../document-extraction-runtime/ports/document-extraction-runtime-port";
import type { OCRRuntimePort } from "../../ocr-runtime/ports/ocr-runtime-port";
import type { AIOrchestrationRuntimePort } from "../../ai-orchestration-runtime/ports/ai-orchestration-runtime-port";
import type { AuditRuntimePort } from "../../audit-runtime/ports/audit-runtime-port";
import type { TISSMappingRuntimePort } from "../../tiss-mapping-runtime/ports/tiss-mapping-runtime-port";
import type { AutoFillRuntimePort } from "../../auto-fill-runtime/ports/auto-fill-runtime-port";
import type { QualityRuntimePort } from "../../quality-runtime/ports/quality-runtime-port";
import type { ValidationRuntimePort } from "../../validation-runtime/ports/validation-runtime-port";
import type { XMLTISSRuntimePort } from "../../xml-tiss-runtime/ports/xml-tiss-runtime-port";
import type { CanonicalXMLDocument } from "../../xml-runtime/parser/canonical";
import type {
  CanonicalValidationIssue,
  CanonicalValidationStatistics,
  CanonicalXSDValidationResult,
  XMLValidationRuntimeContext,
} from "../xsd-validation/canonical";
import type {
  CanonicalNamespaceValidationContext,
  CanonicalNamespaceValidationResult,
} from "../namespace-validation/canonical";
import type {
  CanonicalVersionValidationContext,
  CanonicalVersionValidationResult,
} from "../version-validation/canonical";
import type {
  CanonicalBusinessValidationContext,
  CanonicalBusinessValidationResult,
} from "../business-validation/canonical";
import type {
  CanonicalOperatorValidationContext,
  CanonicalOperatorValidationResult,
} from "../operator-validation/canonical";
import type { CanonicalXMLRepairContext, CanonicalXMLRepairResult } from "../xml-repair/canonical";
import type {
  AuditResult,
  AutoFillResult,
  CanonicalGuide,
  CanonicalMappingResult,
  QualityAssessment,
  ValidationResult,
  XMLDocument,
  XMLValidationContext,
  XMLValidationRequest,
  XMLValidationStatistics,
} from "./canonical";
import type { XMLValidationRuntimeEngineCapabilities } from "./capabilities";

export type {
  CanonicalValidationIssue,
  CanonicalValidationStatistics,
  CanonicalXSDValidationResult,
  XMLValidationRuntimeContext,
};

export type {
  CanonicalNamespaceValidationContext,
  CanonicalNamespaceValidationResult,
} from "../namespace-validation/canonical";

export type {
  CanonicalVersionValidationContext,
  CanonicalVersionValidationResult,
} from "../version-validation/canonical";

export type {
  CanonicalBusinessValidationContext,
  CanonicalBusinessValidationResult,
} from "../business-validation/canonical";

export type {
  CanonicalOperatorValidationContext,
  CanonicalOperatorValidationResult,
} from "../operator-validation/canonical";

export type { CanonicalXMLRepairContext, CanonicalXMLRepairResult } from "../xml-repair/canonical";

export type {
  AuditResult,
  AutoFillResult,
  CanonicalGuide,
  CanonicalMappingResult,
  CanonicalXMLValidationCapabilities,
  CanonicalXMLValidationHealth,
  CanonicalXMLValidationIssue,
  CanonicalXMLValidationMetadata,
  CanonicalXMLValidationOperation,
  CanonicalXMLValidationProfile,
  CanonicalXMLValidationReference,
  CanonicalXMLValidationRequest,
  CanonicalXMLValidationResult,
  CanonicalXMLValidationStatistics,
  CanonicalXMLValidationStatus,
  CanonicalXMLValidationSummary,
  CanonicalXMLValidationVersion,
  QualityAssessment,
  ValidationResult,
  XMLDocument,
  XMLValidationCapabilities,
  XMLValidationCompatibilityContract,
  XMLValidationConsistencyContract,
  XMLValidationContext,
  XMLValidationHealth,
  XMLValidationIntegrityContract,
  XMLValidationIssue,
  XMLValidationMetadata,
  XMLValidationNamespaceContract,
  XMLValidationOperation,
  XMLValidationProfile,
  XMLValidationReference,
  XMLValidationReportContract,
  XMLValidationRequest,
  XMLValidationResult,
  XMLValidationSchemaContract,
  XMLValidationStatistics,
  XMLValidationStatus,
  XMLValidationStructureContract,
  XMLValidationSummary,
  XMLValidationVersion,
  XMLValidationVersionContract,
} from "./canonical";
export type { XMLValidationRuntimeEngineCapabilities };

/** Provedores / mecanismos do XML Validation Runtime (adapters do Port). */
export type XMLValidationRuntimeProviderId = "mock" | "test" | "default" | "enterprise";

/** Status operacional declarado no registry (C-02). */
export type XMLValidationRuntimeStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Telemetria estrutural embutida no resultado (C-02). */
export type XMLValidationRuntimeTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: string;
};

/** Logging estrutural embutido (C-02). */
export type XMLValidationRuntimeStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: XMLValidationRuntimeProviderId;
  attempt?: number;
  operation?: string;
};

/**
 * Resultado de health check do XML Validation Runtime.
 * Peers estruturais: shape-check apenas (sem consumo funcional).
 * D-02: xsdValidationOk / xsdValidationImplemented = true.
 */
export type XMLValidationRuntimeHealth = {
  ok: boolean;
  provider: XMLValidationRuntimeProviderId;
  latencyMs?: number;
  message?: string;
  status?: XMLValidationRuntimeStatus;
  kind?: "canonical-xml-validation-health";
  xmlTissRuntimeOk?: boolean;
  qualityRuntimeOk?: boolean;
  autoFillRuntimeOk?: boolean;
  tissMappingRuntimeOk?: boolean;
  auditRuntimeOk?: boolean;
  validationRuntimeOk?: boolean;
  documentExtractionRuntimeOk?: boolean;
  documentClassificationRuntimeOk?: boolean;
  ocrRuntimeOk?: boolean;
  aiOrchestrationRuntimeOk?: boolean;
  storedResultCount?: number;
  storedRequestCount?: number;
  storedContextCount?: number;
  validationEngineReady: true;
  runtimeReady: true;
  xmlValidationImplemented: false;
  /** D-02 — XSD Validation funcional. */
  xsdValidationImplemented: true;
  /** D-02 — health da capability XSD Validation. */
  xsdValidationOk?: boolean;
  /** D-04 — health da capability Namespace Validation. */
  namespaceValidationOk?: boolean;
  namespaceValidationImplemented: boolean;
  schemaSelectionImplemented: false;
  /** D-05 — health da capability Version Validation. */
  versionValidationOk?: boolean;
  /** D-05 — Version Validation funcional. */
  versionValidationImplemented: boolean;
  /** D-06 — health da capability Business Validation. */
  businessValidationOk?: boolean;
  /** D-06 — Business Validation funcional. */
  businessValidationImplemented: boolean;
  /** D-07 — health da capability Operator Validation. */
  operatorValidationOk?: boolean;
  /** D-07 — Operator Validation funcional. */
  operatorValidationImplemented: boolean;
  /** D-08 — health da capability XML Repair. */
  xmlRepairOk?: boolean;
  /** D-08 — XML Repair funcional. */
  xmlRepairImplemented: boolean;
  automaticCorrectionImplemented: false;
  validationReportImplemented: false;
};

/**
 * Capacidades declaradas pelo adapter (Port level).
 * D-02: xsdValidationImplemented = true; demais capacidades funcionais = false.
 */
export type XMLValidationRuntimeCapabilities = {
  provider: XMLValidationRuntimeProviderId;
  adapterId: string;
  supportsHealth: boolean;
  supportsCapabilities: boolean;
  supportsValidate: boolean;
  supportsGetResult: boolean;
  supportsListResults: boolean;
  supportsStats: boolean;
  supportsCanonicalValidation: boolean;
  supportsTimeout: boolean;
  supportsRetry: boolean;
  supportsCancellation: boolean;
  supportsTelemetry: boolean;
  usesXMLTISSRuntimePort: boolean;
  usesQualityRuntimePort: boolean;
  usesAutoFillRuntimePort: boolean;
  usesTISSMappingRuntimePort: boolean;
  usesAuditRuntimePort: boolean;
  usesValidationRuntimePort: boolean;
  usesDocumentExtractionRuntimePort: boolean;
  usesDocumentClassificationRuntimePort: boolean;
  usesOCRRuntimePort: boolean;
  usesAIOrchestrationRuntimePort: boolean;
  validationEngineReady: true;
  runtimeReady: true;
  xmlValidationImplemented: false;
  /** D-02 — XSD Validation funcional. */
  xsdValidationImplemented: true;
  /** D-04 — Namespace Validation funcional. */
  namespaceValidationImplemented: boolean;
  schemaSelectionImplemented: false;
  /** D-05 — Version Validation funcional. */
  versionValidationImplemented: boolean;
  /** D-06 — Business Validation funcional. */
  businessValidationImplemented: boolean;
  /** D-07 — Operator Validation funcional. */
  operatorValidationImplemented: boolean;
  /** D-08 — XML Repair funcional. */
  xmlRepairImplemented: boolean;
  automaticCorrectionImplemented: false;
  validationReportImplemented: false;
  /** Compat TISS-08. */
  implementsOfficialXsd: false;
  implementsXsdValidation: true;
  implementsRealXmlValidation: false;
  implementsOfficialTissValidation: false;
  implementsOfficialAnsValidation: false;
  implementsOperatorDispatch: false;
  implementsBusinessRules: false;
  knowsOperatorOrCooperative: false;
  knowsContract: false;
  knowsTenant: false;
  knowsTissPattern: false;
  /** Espelho declarativo (engine) e canônico (C-02) — informativo. */
  engine?: XMLValidationRuntimeEngineCapabilities;
  canonical?: import("./canonical").XMLValidationCapabilities;
};

/**
 * Alias TISS-08 — Port-level capabilities (agora = XMLValidationRuntimeCapabilities).
 * Nota: o tipo engine legado também usava este nome; use EngineCapabilities para o engine.
 */
export type XMLValidationRuntimePortCapabilities = XMLValidationRuntimeCapabilities;

/** Metadados estáveis do provedor (C-02). */
export type XMLValidationRuntimeProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
  layer?: string;
  vendorAgnostic?: boolean;
};

/** Info agregada retornada por providerInfo() (C-02). */
export type XMLValidationRuntimeInfo = {
  providerId: XMLValidationRuntimeProviderId;
  metadata: XMLValidationRuntimeProviderMetadata;
  status: XMLValidationRuntimeStatus;
  providerType: "XML_VALIDATION_RUNTIME";
  capabilities: XMLValidationRuntimeEngineCapabilities;
};

/** Controles operacionais comuns (timeout / retry / cancel) — C-02. */
export type XMLValidationRuntimeOperationalControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Envelope comum de resultado operacional — C-02. */
export type XMLValidationRuntimeOperationEnvelope = {
  ok: boolean;
  requestId?: string;
  message?: string;
  code?: string;
  provider: XMLValidationRuntimeProviderId;
  telemetry: XMLValidationRuntimeTelemetry;
  logs?: readonly XMLValidationRuntimeStructuredLog[];
  simulated?: boolean;
};

/**
 * Dependências Enterprise injetadas no adapter default/enterprise.
 * C-02: peers estruturais (shape-check apenas em health() — sem consumo funcional).
 */
export type XMLValidationRuntimeEnterpriseDeps = {
  getXMLTISSRuntimePort?: () => XMLTISSRuntimePort;
  getQualityRuntimePort?: () => QualityRuntimePort;
  getAutoFillRuntimePort?: () => AutoFillRuntimePort;
  getTISSMappingRuntimePort?: () => TISSMappingRuntimePort;
  getAuditRuntimePort?: () => AuditRuntimePort;
  getValidationRuntimePort?: () => ValidationRuntimePort;
  getDocumentExtractionRuntimePort?: () => DocumentExtractionRuntimePort;
  getDocumentClassificationRuntimePort?: () => DocumentClassificationRuntimePort;
  getOCRRuntimePort?: () => OCRRuntimePort;
  getAIOrchestrationRuntimePort?: () => AIOrchestrationRuntimePort;
};

/** Opções de resolução do XMLValidationRuntimePort. */
export type XMLValidationRuntimeProviderOptions = {
  provider?: XMLValidationRuntimeProviderId;
  enterpriseDeps?: XMLValidationRuntimeEnterpriseDeps;
};

/** Alias C-02 — resolução do XMLValidationRuntimePort (default: `enterprise`). */
export type XMLValidationRuntimeOptions = XMLValidationRuntimeProviderOptions;

/** Entrada de registro no XMLValidationRuntimeRegistry (C-02). */
export type XMLValidationRuntimeRegistration = {
  providerId: XMLValidationRuntimeProviderId;
  name: string;
  version: string;
  status: XMLValidationRuntimeStatus;
  adapterId: string;
  vendor: string;
  capabilities: XMLValidationRuntimeEngineCapabilities;
  description?: string;
};

// ---------------------------------------------------------------------------
// C-02 — operações estruturais (validate / getResult / listResults / stats).
// Nunca executam validação XML / XSD / parser / correção.
// ---------------------------------------------------------------------------

export type ValidateXMLInput = XMLValidationRuntimeOperationalControls & {
  request?: XMLValidationRequest;
  validationId?: string;
  name?: string;
  schemaResultId?: string;
  serializeResultId?: string;
  generationResultId?: string;
  documentId?: string;
  xmlContext?: XMLValidationContext;
  xmlDocument?: XMLDocument;
  canonicalGuide?: CanonicalGuide;
  mappingResult?: CanonicalMappingResult;
  qualityAssessment?: QualityAssessment;
  validationResult?: ValidationResult;
  auditResult?: AuditResult;
  autoFillResult?: AutoFillResult;
};

/** Alias TISS-08. */
export type ValidateCanonicalXMLInput = ValidateXMLInput;

export type ValidateXMLResult = XMLValidationRuntimeOperationEnvelope & {
  result?: import("./canonical").XMLValidationResult;
};

/** Alias TISS-08. */
export type ValidateCanonicalXMLResult = ValidateXMLResult;

export type GetXMLValidationResultInput = XMLValidationRuntimeOperationalControls & {
  resultId: string;
};

/** Alias TISS-08. */
export type GetCanonicalXMLValidationResultInput = GetXMLValidationResultInput;

export type GetXMLValidationResultResult = XMLValidationRuntimeOperationEnvelope & {
  result?: import("./canonical").XMLValidationResult;
};

/** Alias TISS-08. */
export type GetCanonicalXMLValidationResultResult = GetXMLValidationResultResult;

export type ListXMLValidationResultsInput = XMLValidationRuntimeOperationalControls & {
  status?: string;
};

/** Alias TISS-08. */
export type ListCanonicalXMLValidationResultsInput = ListXMLValidationResultsInput;

export type ListXMLValidationResultsResult = XMLValidationRuntimeOperationEnvelope & {
  results: readonly import("./canonical").XMLValidationResult[];
  statistics?: XMLValidationStatistics;
};

/** Alias TISS-08. */
export type ListCanonicalXMLValidationResultsResult = ListXMLValidationResultsResult;

export type XMLValidationStatsInput = XMLValidationRuntimeOperationalControls & {
  documentId?: string;
};

export type XMLValidationStatsResult = XMLValidationRuntimeOperationEnvelope & {
  statistics?: XMLValidationStatistics;
  result?: import("./canonical").XMLValidationResult;
};

// ---------------------------------------------------------------------------
// D-02 — XSD Validation funcional sobre CanonicalXMLDocument.
// ---------------------------------------------------------------------------

export type ValidateXSDInput = XMLValidationRuntimeOperationalControls & {
  /** Documento canônico produzido pelo XML Parser (D-01). */
  document: CanonicalXMLDocument;
  /** Schema XSD em string, ou CanonicalXMLDocument já parseado. */
  xsd: string | CanonicalXMLDocument;
  /** Nome do elemento raiz esperado (localName). */
  rootElementName?: string;
};

export type ValidateXSDResult = XMLValidationRuntimeOperationEnvelope & {
  validation?: CanonicalXSDValidationResult;
  context?: XMLValidationRuntimeContext | null;
  valid?: boolean;
};

// ---------------------------------------------------------------------------
// D-04 — Namespace Validation funcional sobre CanonicalXMLDocument.
// ---------------------------------------------------------------------------

export type ValidateNamespaceInput = XMLValidationRuntimeOperationalControls & {
  /** Documento canônico produzido pelo XML Parser (D-01). */
  document: CanonicalXMLDocument;
  /** URI do namespace esperada. */
  namespaceUri: string;
  /** Prefixo esperado. Se omitido, qualquer prefixo que mapeie para a URI é aceito. */
  prefix?: string;
  /** Nome do elemento raiz esperado (localName). */
  rootElementName?: string;
};

export type ValidateNamespaceResult = XMLValidationRuntimeOperationEnvelope & {
  validation?: CanonicalNamespaceValidationResult;
  context?: CanonicalNamespaceValidationContext | null;
  valid?: boolean;
};

// ---------------------------------------------------------------------------
// D-05 — Version Validation funcional sobre CanonicalXMLDocument.
// ---------------------------------------------------------------------------

export type ValidateVersionInput = XMLValidationRuntimeOperationalControls & {
  /** Documento canônico produzido pelo XML Parser (D-01). */
  document: CanonicalXMLDocument;
  /** Valor de versão esperado. */
  versionId: string;
  /** Nome do atributo/elemento onde a versão é declarada (padrão: "version"). */
  attributeName?: string;
  /** Nome do elemento raiz esperado (localName). */
  rootElementName?: string;
};

export type ValidateVersionResult = XMLValidationRuntimeOperationEnvelope & {
  validation?: CanonicalVersionValidationResult;
  context?: CanonicalVersionValidationContext | null;
  valid?: boolean;
};

// ---------------------------------------------------------------------------
// D-06 — Business Validation funcional sobre CanonicalXMLDocument.
// ---------------------------------------------------------------------------

export type ValidateBusinessInput = XMLValidationRuntimeOperationalControls & {
  /** Documento canônico produzido pelo XML Parser (D-01). */
  document: CanonicalXMLDocument;
  /** Regras de negócio a serem validadas. */
  rules: import("../business-validation/canonical").BusinessValidationRule[];
  /** Nome do elemento raiz esperado (localName). */
  rootElementName?: string;
};

export type ValidateBusinessResult = XMLValidationRuntimeOperationEnvelope & {
  validation?: CanonicalBusinessValidationResult;
  context?: CanonicalBusinessValidationContext | null;
  valid?: boolean;
};

// ---------------------------------------------------------------------------
// D-07 — Operator Validation funcional sobre CanonicalXMLDocument.
// ---------------------------------------------------------------------------

export type ValidateOperatorInput = XMLValidationRuntimeOperationalControls & {
  /** Documento canônico produzido pelo XML Parser (D-01). */
  document: CanonicalXMLDocument;
  /** Identificador de operador esperado. */
  operatorId: string;
  /** Nome do atributo/elemento onde o operador é declarado (padrão: "operator"). */
  fieldName?: string;
  /** Nome do elemento raiz esperado (localName). */
  rootElementName?: string;
};

export type ValidateOperatorResult = XMLValidationRuntimeOperationEnvelope & {
  validation?: CanonicalOperatorValidationResult;
  context?: CanonicalOperatorValidationContext | null;
  valid?: boolean;
};

// ---------------------------------------------------------------------------
// D-08 — XML Repair funcional sobre CanonicalXMLDocument.
// ---------------------------------------------------------------------------

export type RepairXMLInput = XMLValidationRuntimeOperationalControls & {
  /** Documento canônico produzido pelo XML Parser (D-01). */
  document: CanonicalXMLDocument;
  /** Regras de reparo a serem aplicadas. */
  rules: import("../xml-repair/canonical").XMLRepairRule[];
};

export type RepairXMLResult = XMLValidationRuntimeOperationEnvelope & {
  repair?: CanonicalXMLRepairResult;
  context?: CanonicalXMLRepairContext | null;
  repaired?: boolean;
};
