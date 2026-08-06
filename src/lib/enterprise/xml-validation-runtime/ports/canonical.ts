/**
 * Modelos canônicos estruturais do Enterprise XML Validation Runtime — C-02 / ECS-01.
 *
 * Foundation estrutural vendor-agnostic para validação futura de documentos XML
 * TISS/ANS (estrutura / schema / namespace / versão / integridade / consistência /
 * compatibilidade / relatório).
 *
 * Sem validação XML real. Sem XSD. Sem parser. Sem SOAP. Sem operadoras.
 * Sem correção automática. Sem banco. Sem persistência. Sem APIs. Sem IA.
 *
 * Todos os contratos abaixo são exclusivamente estruturais.
 */

import type { XMLDocument } from "../../xml-tiss-runtime/ports/canonical";
import type { CanonicalGuide } from "../../tiss-mapping-runtime/ports/canonical";
import type { CanonicalMappingResult } from "../../tiss-mapping-runtime/ports/canonical";
import type { AutoFillResult } from "../../auto-fill-runtime/ports/canonical";
import type { QualityAssessment } from "../../quality-runtime/ports/canonical";
import type { ValidationResult } from "../../validation-runtime/ports/canonical";
import type { AuditResult } from "../../audit-runtime/ports/canonical";

export type {
  XMLDocument,
  CanonicalGuide,
  CanonicalMappingResult,
  AutoFillResult,
  QualityAssessment,
  ValidationResult,
  AuditResult,
};

/** Status estrutural XML Validation (C-02). */
export type XMLValidationStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "validated"
  | "prepared"
  | "disabled"
  | "unknown"
  | (string & {});

/** Alias TISS-08 → C-02. */
export type CanonicalXMLValidationStatus = XMLValidationStatus;

/**
 * XMLValidationContext canônico (C-02).
 *
 * Aceita exclusivamente por contrato:
 *   XMLDocument + CanonicalGuide + CanonicalMappingResult +
 *   QualityAssessment + ValidationResult + AuditResult + AutoFillResult
 * — sem qualquer processamento.
 */
export type XMLValidationContext = {
  kind: "canonical-xml-validation-context";
  documentId?: string;
  resultId?: string;
  xmlDocument?: XMLDocument;
  canonicalGuide?: CanonicalGuide;
  mappingResult?: CanonicalMappingResult;
  qualityAssessment?: QualityAssessment;
  validationResult?: ValidationResult;
  auditResult?: AuditResult;
  autoFillResult?: AutoFillResult;
  structuralNotes?: string;
};

/** Versão canônica de um perfil/engine de validação (estrutural). */
export type XMLValidationVersion = {
  kind: "canonical-xml-validation-version";
  label?: string;
  major?: number;
  minor?: number;
  patch?: number;
  revision?: string;
  versionValidationImplemented: false;
};

/** Alias TISS-08 → C-02. */
export type CanonicalXMLValidationVersion = XMLValidationVersion;

/** Metadata canônica de um pedido/resultado de XML Validation. */
export type XMLValidationMetadata = {
  kind: "canonical-xml-validation-metadata";
  sessionId?: string;
  correlationId?: string | null;
  channel?: string;
  source?: string;
  tags?: readonly string[];
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/** Alias TISS-08 → C-02. */
export type CanonicalXMLValidationMetadata = XMLValidationMetadata;

/** Perfil canônico de XML Validation (estrutural). */
export type XMLValidationProfile = {
  kind: "canonical-xml-validation-profile";
  profileId?: string;
  profileCode?: string;
  label?: string;
  notes?: string;
};

/** Alias TISS-08 → C-02. */
export type CanonicalXMLValidationProfile = XMLValidationProfile;

/** Issue canônica de validação (estrutural — sempre vazia nesta fundação). */
export type XMLValidationIssue = {
  kind: "canonical-xml-validation-issue";
  issueId?: string;
  code?: string;
  severity?: "info" | "warn" | "error" | (string & {});
  message?: string;
  path?: string;
};

/** Alias TISS-08 → C-02. */
export type CanonicalXMLValidationIssue = XMLValidationIssue;

/** Sumário canônico de uma operação de validação (estrutural). */
export type XMLValidationSummary = {
  kind: "canonical-xml-validation-summary";
  issueCount: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  notes?: string;
};

/** Alias TISS-08 → C-02. */
export type CanonicalXMLValidationSummary = XMLValidationSummary;

/** Referência canônica a um pedido de XML Validation (opaca). */
export type XMLValidationReference = {
  kind: "canonical-xml-validation-reference";
  validationId?: string;
  validationCode?: string;
  schemaResultId?: string;
  serializeResultId?: string;
  generationResultId?: string;
  documentId?: string;
  uri?: string;
  digest?: string;
};

/** Alias TISS-08 → C-02. */
export type CanonicalXMLValidationReference = XMLValidationReference;

/** Operação canônica do XML Validation Runtime. */
export type XMLValidationOperation =
  | "validate"
  | "get"
  | "list"
  | "stats"
  | "health"
  | "capabilities"
  | (string & {});

/** Alias TISS-08 → C-02. */
export type CanonicalXMLValidationOperation = XMLValidationOperation;

// ---------------------------------------------------------------------------
// Contratos estruturais futuros (somente tipos — *Implemented: false)
// ---------------------------------------------------------------------------

/** Estrutura XML (somente contrato). */
export type XMLValidationStructureContract = {
  kind: "canonical-xml-validation-structure";
  structureId?: string;
  notes?: string;
  structureValidationImplemented: false;
  xmlValidationImplemented: false;
};

/** Schema XML (somente contrato — sem XSD funcional). */
export type XMLValidationSchemaContract = {
  kind: "canonical-xml-validation-schema";
  schemaId?: string;
  schemaUri?: string;
  notes?: string;
  schemaSelectionImplemented: false;
  xsdValidationImplemented: false;
  xmlValidationImplemented: false;
};

/** Namespace XML (somente contrato). */
export type XMLValidationNamespaceContract = {
  kind: "canonical-xml-validation-namespace";
  namespaceUri?: string;
  prefix?: string;
  notes?: string;
  namespaceValidationImplemented: false;
  xmlValidationImplemented: false;
};

/** Versionamento estrutural (somente contrato). */
export type XMLValidationVersionContract = {
  kind: "canonical-xml-validation-version-contract";
  versionId?: string;
  label?: string;
  notes?: string;
  versionValidationImplemented: false;
  xmlValidationImplemented: false;
};

/** Integridade estrutural (somente contrato). */
export type XMLValidationIntegrityContract = {
  kind: "canonical-xml-validation-integrity";
  integrityId?: string;
  notes?: string;
  integrityValidationImplemented: false;
  xmlValidationImplemented: false;
};

/** Consistência estrutural (somente contrato). */
export type XMLValidationConsistencyContract = {
  kind: "canonical-xml-validation-consistency";
  consistencyId?: string;
  notes?: string;
  consistencyValidationImplemented: false;
  xmlValidationImplemented: false;
};

/** Compatibilidade estrutural (somente contrato). */
export type XMLValidationCompatibilityContract = {
  kind: "canonical-xml-validation-compatibility";
  compatibilityId?: string;
  notes?: string;
  compatibilityValidationImplemented: false;
  xmlValidationImplemented: false;
};

/** Relatório de validação estrutural (somente contrato). */
export type XMLValidationReportContract = {
  kind: "canonical-xml-validation-report";
  reportId?: string;
  notes?: string;
  validationReportImplemented: boolean;
  xmlValidationImplemented: false;
  automaticCorrectionImplemented: boolean;
  xmlRepairImplemented: boolean;
};

/**
 * Pedido canônico de validação XML (C-02).
 * Não contém XSD. Não contém payload TISS/ANS. Não conhece operadora/contrato/tenant.
 */
export type XMLValidationRequest = {
  kind: "canonical-xml-validation-request";
  requestId?: string;
  validationId?: string;
  name?: string;
  version?: XMLValidationVersion;
  profile?: XMLValidationProfile;
  reference?: XMLValidationReference;
  metadata?: XMLValidationMetadata;
  schemaResultId?: string;
  serializeResultId?: string;
  generationResultId?: string;
  documentId?: string;
  structuralNotes?: string;
  operation?: XMLValidationOperation;
  xmlContext?: XMLValidationContext;
  xmlDocument?: XMLDocument;
  canonicalGuide?: CanonicalGuide;
  mappingResult?: CanonicalMappingResult;
  qualityAssessment?: QualityAssessment;
  validationResult?: ValidationResult;
  auditResult?: AuditResult;
  autoFillResult?: AutoFillResult;
  structure?: XMLValidationStructureContract;
  schema?: XMLValidationSchemaContract;
  namespace?: XMLValidationNamespaceContract;
  versionContract?: XMLValidationVersionContract;
  integrity?: XMLValidationIntegrityContract;
  consistency?: XMLValidationConsistencyContract;
  compatibility?: XMLValidationCompatibilityContract;
  report?: XMLValidationReportContract;
};

/** Alias TISS-08 → C-02. */
export type CanonicalXMLValidationRequest = XMLValidationRequest;

/**
 * Resultado canônico de operação de XML Validation (C-02).
 * Contém apenas referência/estrutura canônica — nunca XSD oficial / XML TISS/ANS.
 * Nenhuma validação real é executada nesta fundação.
 */
export type XMLValidationResult = {
  kind: "canonical-xml-validation-result";
  ok: boolean;
  resultId: string;
  request: XMLValidationRequest;
  profile?: XMLValidationProfile;
  metadata?: XMLValidationMetadata;
  operation?: XMLValidationOperation;
  issues: readonly XMLValidationIssue[];
  summary?: XMLValidationSummary;
  schemaResultId?: string;
  serializeResultId?: string;
  generationResultId?: string;
  xmlContext?: XMLValidationContext;
  xmlDocument?: XMLDocument;
  canonicalGuide?: CanonicalGuide;
  mappingResult?: CanonicalMappingResult;
  qualityAssessment?: QualityAssessment;
  validationResult?: ValidationResult;
  auditResult?: AuditResult;
  autoFillResult?: AutoFillResult;
  structure?: XMLValidationStructureContract;
  schema?: XMLValidationSchemaContract;
  namespace?: XMLValidationNamespaceContract;
  versionContract?: XMLValidationVersionContract;
  integrity?: XMLValidationIntegrityContract;
  consistency?: XMLValidationConsistencyContract;
  compatibility?: XMLValidationCompatibilityContract;
  report?: XMLValidationReportContract;
  /** Sempre false — nenhuma validação executada nesta fundação. */
  validationExecuted: false;
  /** Sempre false — nenhuma validação real realizada. */
  realValidationPerformed: false;
  /** Sempre false — nenhum XSD oficial carregado. */
  officialXsdLoaded: false;
  /** Sempre false — nenhuma validação ANS oficial. */
  officialAnsValidation: false;
  /** Sempre false — nenhuma validação TISS oficial. */
  officialTissValidation: false;
  /** Sempre false — nenhuma regra de validação carregada. */
  validationRulesLoaded: false;
  /** Sempre true — engine estrutural pronto (C-02) + XSD Validation (D-02). */
  validationEngineReady: true;
  /** Sempre true — runtime pronto (C-02 / D-02). */
  runtimeReady: true;
  xmlValidationImplemented: false;
  /** D-02 — XSD Validation funcional. */
  xsdValidationImplemented: true;
  namespaceValidationImplemented: boolean;
  schemaSelectionImplemented: false;
  versionValidationImplemented: boolean;
  businessValidationImplemented: boolean;
  operatorValidationImplemented: boolean;
  xmlRepairImplemented: boolean;
  automaticCorrectionImplemented: boolean;
  validationReportImplemented: boolean;
  status: XMLValidationStatus;
  message?: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
};

/** Alias TISS-08 → C-02. */
export type CanonicalXMLValidationResult = XMLValidationResult;

/** Estatísticas estruturais do XML Validation Runtime (in-process). */
export type XMLValidationStatistics = {
  kind: "canonical-xml-validation-statistics";
  totalResults: number;
  completedResults: number;
  failedResults: number;
  cancelledResults: number;
  validatedResults: number;
  totalRequests: number;
  totalContexts: number;
  validationExecutedCount: 0;
  realValidationPerformedCount: 0;
  officialXsdLoadedCount: 0;
  officialAnsValidationCount: 0;
  officialTissValidationCount: 0;
  validationRulesLoadedCount: 0;
  xmlValidationImplementedCount: 0;
  xsdValidationImplementedCount: 0;
  namespaceValidationImplementedCount: 0;
  schemaSelectionImplementedCount: 0;
  versionValidationImplementedCount: 0;
  businessValidationImplementedCount: 0;
  operatorValidationImplementedCount: 0;
  xmlRepairImplementedCount: 0;
  automaticCorrectionImplementedCount: 0;
  validationReportImplementedCount: 0;
};

/** Alias TISS-08 → C-02. */
export type CanonicalXMLValidationStatistics = XMLValidationStatistics;

/** Saúde canônica estrutural do provedor XML Validation Runtime. */
export type XMLValidationHealth = {
  kind: "canonical-xml-validation-health";
  ok: boolean;
  provider: string;
  latencyMs?: number;
  message?: string;
  status?: string;
  storedResultCount?: number;
  storedRequestCount?: number;
  storedContextCount?: number;
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
  validationEngineReady: true;
  runtimeReady: true;
  xmlValidationImplemented: false;
  /** D-02 — XSD Validation funcional. */
  xsdValidationImplemented: true;
  namespaceValidationImplemented: boolean;
  schemaSelectionImplemented: false;
  versionValidationImplemented: boolean;
  businessValidationImplemented: boolean;
  operatorValidationImplemented: boolean;
  xmlRepairImplemented: boolean;
  automaticCorrectionImplemented: boolean;
  validationReportImplemented: boolean;
};

/** Alias TISS-08 → C-02. */
export type CanonicalXMLValidationHealth = XMLValidationHealth;

/**
 * Capacidades canônicas declaradas do provedor XML Validation Runtime.
 * D-02: xsdValidationImplemented = true; demais capacidades funcionais = false.
 */
export type XMLValidationCapabilities = {
  kind: "canonical-xml-validation-capabilities";
  supportsValidate: boolean;
  supportsGetResult: boolean;
  supportsListResults: boolean;
  supportsStats: boolean;
  supportsHealth: boolean;
  supportsCanonicalValidation: boolean;
  validationEngineReady: true;
  runtimeReady: true;
  xmlValidationImplemented: false;
  /** D-02 — XSD Validation funcional. */
  xsdValidationImplemented: true;
  namespaceValidationImplemented: boolean;
  schemaSelectionImplemented: false;
  versionValidationImplemented: boolean;
  businessValidationImplemented: boolean;
  operatorValidationImplemented: boolean;
  xmlRepairImplemented: boolean;
  automaticCorrectionImplemented: boolean;
  validationReportImplemented: boolean;
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
};

/** Alias TISS-08 → C-02. */
export type CanonicalXMLValidationCapabilities = XMLValidationCapabilities;

/** Helper estrutural — cria contrato de estrutura desabilitado. */
export function createDisabledXMLValidationStructure(): XMLValidationStructureContract {
  return {
    kind: "canonical-xml-validation-structure",
    structureId: "disabled-structure",
    notes: "Structural structure contract (no XML validation)",
    structureValidationImplemented: false,
    xmlValidationImplemented: false,
  };
}

/** Helper estrutural — cria contrato de schema desabilitado. */
export function createDisabledXMLValidationSchema(): XMLValidationSchemaContract {
  return {
    kind: "canonical-xml-validation-schema",
    schemaId: "disabled-schema",
    notes: "Structural schema contract (no XSD)",
    schemaSelectionImplemented: false,
    xsdValidationImplemented: false,
    xmlValidationImplemented: false,
  };
}

/** Helper estrutural — cria contrato de relatório desabilitado. */
export function createDisabledXMLValidationReport(): XMLValidationReportContract {
  return {
    kind: "canonical-xml-validation-report",
    reportId: "disabled-report",
    notes: "Structural validation report contract (no real report)",
    validationReportImplemented: false,
    xmlValidationImplemented: false,
    automaticCorrectionImplemented: false,
    xmlRepairImplemented: false,
  };
}
