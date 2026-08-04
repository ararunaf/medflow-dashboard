/**
 * Modelos canônicos estruturais do Enterprise XML TISS Runtime — C-01 / ECS-01.
 *
 * Foundation estrutural vendor-agnostic para transformação futura do
 * Modelo Canônico TISS em documentos XML compatíveis com o padrão TISS/ANS.
 *
 * Sem geração de XML. Sem serialização. Sem parser. Sem XSD. Sem SOAP.
 * Sem operadoras. Sem assinatura digital. Sem banco. Sem persistência. Sem APIs.
 *
 * Todos os contratos abaixo são exclusivamente estruturais.
 */

import type { CanonicalGuide } from "../../tiss-mapping-runtime/ports/canonical";
import type { CanonicalMappingResult } from "../../tiss-mapping-runtime/ports/canonical";
import type { AutoFillResult } from "../../auto-fill-runtime/ports/canonical";
import type { QualityAssessment } from "../../quality-runtime/ports/canonical";
import type { ValidationResult } from "../../validation-runtime/ports/canonical";
import type { AuditResult } from "../../audit-runtime/ports/canonical";
import type { AIOrchestrationContext } from "../../ai-orchestration-runtime/ports/canonical";

export type {
  CanonicalGuide,
  CanonicalMappingResult,
  AutoFillResult,
  QualityAssessment,
  ValidationResult,
  AuditResult,
  AIOrchestrationContext,
};

/** Status estrutural XML TISS (C-01). */
export type XMLStatus =
  | "pending"
  | "prepared"
  | "generated"
  | "serialized"
  | "validated"
  | "signed"
  | "processed"
  | "failed"
  | "disabled"
  | "unknown"
  | (string & {});

/** Tipos estruturais de guia TISS (somente contratos). */
export type XMLTISSGuideType =
  | "sp-sadt"
  | "consulta"
  | "internacao"
  | "honorarios"
  | "resumo-internacao"
  | "odontologica"
  | "anexo"
  | "lote"
  | "cabecalho"
  | "protocolo"
  | (string & {});

/** Identificação estrutural de versão TISS (somente contrato). */
export type XMLTISSVersionId = string & {};

/** Namespace estrutural TISS (somente contrato). */
export type XMLTISSNamespace = {
  kind: "canonical-xml-tiss-namespace";
  namespaceUri?: string;
  prefix?: string;
  versionId?: XMLTISSVersionId;
  schemaReferenceImplemented: false;
  namespaceResolutionImplemented: false;
};

/** Schema estrutural TISS (somente contrato — sem XSD funcional). */
export type XMLTISSSchemaRef = {
  kind: "canonical-xml-tiss-schema-ref";
  schemaId?: string;
  versionId?: XMLTISSVersionId;
  namespaceUri?: string;
  schemaValidationImplemented: false;
  xsdLoadingImplemented: false;
};

/** Versionamento estrutural TISS (somente contrato). */
export type XMLTISSVersion = {
  kind: "canonical-xml-tiss-version";
  versionId: XMLTISSVersionId;
  label?: string;
  namespaces?: readonly XMLTISSNamespace[];
  schemas?: readonly XMLTISSSchemaRef[];
  compatibilityNotes?: string;
  versionIdentificationImplemented: false;
  namespaceResolutionImplemented: false;
  schemaBindingImplemented: false;
  futureCompatibilityReady: true;
};

/** Metadados canônicos estruturais do documento XML TISS. */
export type XMLMetadata = {
  kind: "canonical-xml-tiss-metadata";
  metadataId: string;
  documentId?: string;
  guideType?: XMLTISSGuideType;
  tissVersion?: XMLTISSVersion;
  status: XMLStatus;
  structuralNotes?: string;
  xmlGenerationImplemented: false;
  xmlSerializationImplemented: false;
  xmlParsingImplemented: false;
  schemaValidationImplemented: false;
};

/** Cabeçalho canônico estrutural (somente contrato). */
export type XMLHeader = {
  kind: "canonical-xml-tiss-header";
  headerId: string;
  protocolRef?: string;
  tissVersion?: XMLTISSVersion;
  namespace?: XMLTISSNamespace;
  status: XMLStatus;
  xmlGenerationImplemented: false;
  xmlSerializationImplemented: false;
};

/** Corpo canônico estrutural (somente contrato). */
export type XMLBody = {
  kind: "canonical-xml-tiss-body";
  bodyId: string;
  guideType?: XMLTISSGuideType;
  status: XMLStatus;
  xmlGenerationImplemented: false;
  xmlSerializationImplemented: false;
};

/** Guia canônica estrutural XML TISS (somente contrato). */
export type XMLGuide = {
  kind: "canonical-xml-tiss-guide";
  guideId: string;
  guideType: XMLTISSGuideType;
  canonicalGuide?: CanonicalGuide;
  header?: XMLHeader;
  body?: XMLBody;
  status: XMLStatus;
  xmlGenerationImplemented: false;
  xmlSerializationImplemented: false;
  xmlParsingImplemented: false;
  schemaValidationImplemented: false;
};

/** Contratos estruturais por tipo de guia TISS (sem implementação). */
export type XMLGuideSPSADT = XMLGuide & {
  guideType: "sp-sadt";
  structuralRole: "guia-sp-sadt";
};

export type XMLGuideConsulta = XMLGuide & {
  guideType: "consulta";
  structuralRole: "guia-consulta";
};

export type XMLGuideInternacao = XMLGuide & {
  guideType: "internacao";
  structuralRole: "guia-internacao";
};

export type XMLGuideHonorarios = XMLGuide & {
  guideType: "honorarios";
  structuralRole: "guia-honorarios";
};

export type XMLGuideResumoInternacao = XMLGuide & {
  guideType: "resumo-internacao";
  structuralRole: "guia-resumo-internacao";
};

export type XMLGuideOdontologica = XMLGuide & {
  guideType: "odontologica";
  structuralRole: "guia-odontologica";
};

export type XMLGuideAnexo = XMLGuide & {
  guideType: "anexo";
  structuralRole: "guia-anexo";
};

export type XMLGuideLote = XMLGuide & {
  guideType: "lote";
  structuralRole: "guia-lote";
};

export type XMLGuideCabecalho = XMLGuide & {
  guideType: "cabecalho";
  structuralRole: "guia-cabecalho";
};

export type XMLGuideProtocolo = XMLGuide & {
  guideType: "protocolo";
  structuralRole: "guia-protocolo";
};

/** União estrutural dos contratos de guias XML TISS. */
export type FutureXMLTISSGuideContract =
  | XMLGuideSPSADT
  | XMLGuideConsulta
  | XMLGuideInternacao
  | XMLGuideHonorarios
  | XMLGuideResumoInternacao
  | XMLGuideOdontologica
  | XMLGuideAnexo
  | XMLGuideLote
  | XMLGuideCabecalho
  | XMLGuideProtocolo;

/** Lote canônico estrutural (somente contrato). */
export type XMLBatch = {
  kind: "canonical-xml-tiss-batch";
  batchId: string;
  guides?: readonly XMLGuide[];
  header?: XMLHeader;
  status: XMLStatus;
  batchXmlGenerationImplemented: false;
  xmlGenerationImplemented: false;
  xmlSerializationImplemented: false;
  soapIntegrationImplemented: false;
  operatorIntegrationImplemented: false;
};

/**
 * XMLTISSContext canônico (C-01).
 *
 * Aceita exclusivamente por contrato:
 *   CanonicalGuide + CanonicalMappingResult + AutoFillResult +
 *   QualityAssessment + ValidationResult + AuditResult +
 *   AIOrchestrationContext
 * — sem qualquer processamento.
 */
export type XMLTISSContext = {
  kind: "canonical-xml-tiss-context";
  documentId?: string;
  resultId?: string;
  canonicalGuide?: CanonicalGuide;
  mappingResult?: CanonicalMappingResult;
  autoFillResult?: AutoFillResult;
  qualityAssessment?: QualityAssessment;
  validationResult?: ValidationResult;
  auditResult?: AuditResult;
  aiOrchestrationContext?: AIOrchestrationContext;
  structuralNotes?: string;
};

/**
 * Documento canônico estrutural XML TISS.
 * Nunca gera / serializa / valida XML funcional.
 */
export type XMLDocument = {
  kind: "canonical-xml-tiss-document";
  documentId: string;
  status: XMLStatus;
  xmlContext?: XMLTISSContext;
  header?: XMLHeader;
  body?: XMLBody;
  guide?: XMLGuide;
  batch?: XMLBatch;
  metadata?: XMLMetadata;
  tissVersion?: XMLTISSVersion;
  canonicalGuide?: CanonicalGuide;
  mappingResult?: CanonicalMappingResult;
  autoFillResult?: AutoFillResult;
  qualityAssessment?: QualityAssessment;
  validationResult?: ValidationResult;
  auditResult?: AuditResult;
  aiOrchestrationContext?: AIOrchestrationContext;
  createdAt: string;
  updatedAt: string;
  xmlGenerationImplemented: false;
  xmlSerializationImplemented: false;
  xmlParsingImplemented: false;
  xmlValidationImplemented: false;
  xmlSigningImplemented: false;
  xmlCompressionImplemented: false;
  batchXmlGenerationImplemented: false;
  soapIntegrationImplemented: false;
  operatorIntegrationImplemented: false;
  schemaValidationImplemented: false;
};

/** Operação canônica do XML TISS Runtime (C-01). */
export type CanonicalXMLTISSOperation =
  | "prepareXMLDocument"
  | "getResult"
  | "stats"
  | "health"
  | "capabilities"
  | (string & {});

/**
 * Resultado canônico de execução do XML TISS Runtime (C-01).
 * Contém apenas referência/estrutura canônica — nunca XML funcional.
 */
export type XMLResult = {
  kind: "canonical-xml-tiss-result";
  ok: boolean;
  resultId: string;
  operation: CanonicalXMLTISSOperation;
  document?: XMLDocument;
  guide?: XMLGuide;
  batch?: XMLBatch;
  header?: XMLHeader;
  body?: XMLBody;
  metadata?: XMLMetadata;
  xmlContext?: XMLTISSContext;
  canonicalGuide?: CanonicalGuide;
  mappingResult?: CanonicalMappingResult;
  autoFillResult?: AutoFillResult;
  qualityAssessment?: QualityAssessment;
  validationResult?: ValidationResult;
  auditResult?: AuditResult;
  aiOrchestrationContext?: AIOrchestrationContext;
  xmlGenerationImplemented: false;
  xmlSerializationImplemented: false;
  xmlParsingImplemented: false;
  xmlValidationImplemented: false;
  xmlSigningImplemented: false;
  xmlCompressionImplemented: false;
  batchXmlGenerationImplemented: false;
  soapIntegrationImplemented: false;
  operatorIntegrationImplemented: false;
  schemaValidationImplemented: false;
  /** Sempre true — runtime estrutural pronto (sem XML real). */
  runtimeReady: true;
  status: XMLStatus;
  messageText?: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
};

/** Estatísticas estruturais do XML TISS Runtime (in-process). */
export type XMLStatistics = {
  kind: "canonical-xml-tiss-statistics";
  totalDocuments: number;
  preparedDocuments: number;
  totalResults: number;
  totalGuides: number;
  totalBatches: number;
  xmlGenerationImplementedCount: 0;
  xmlSerializationImplementedCount: 0;
  xmlParsingImplementedCount: 0;
  xmlValidationImplementedCount: 0;
  xmlSigningImplementedCount: 0;
  xmlCompressionImplementedCount: 0;
  batchXmlGenerationImplementedCount: 0;
  soapIntegrationImplementedCount: 0;
  operatorIntegrationImplementedCount: 0;
  schemaValidationImplementedCount: 0;
};

/** Saúde canônica estrutural do provedor XML TISS Runtime. */
export type XMLHealth = {
  kind: "canonical-xml-tiss-health";
  ok: boolean;
  provider: string;
  latencyMs?: number;
  message?: string;
  status?: string;
  storedDocumentCount?: number;
  storedResultCount?: number;
  qualityRuntimeOk?: boolean;
  autoFillRuntimeOk?: boolean;
  tissMappingRuntimeOk?: boolean;
  auditRuntimeOk?: boolean;
  validationRuntimeOk?: boolean;
  documentExtractionRuntimeOk?: boolean;
  documentClassificationRuntimeOk?: boolean;
  ocrRuntimeOk?: boolean;
  aiOrchestrationRuntimeOk?: boolean;
  intelligentCaptureRuntimeOk?: boolean;
  scannerRuntimeOk?: boolean;
  watchFolderRuntimeOk?: boolean;
  uploadRuntimeOk?: boolean;
  runtimeReady: true;
  xmlGenerationImplemented: false;
  xmlSerializationImplemented: false;
  xmlParsingImplemented: false;
  xmlValidationImplemented: false;
  xmlSigningImplemented: false;
  xmlCompressionImplemented: false;
  batchXmlGenerationImplemented: false;
  soapIntegrationImplemented: false;
  operatorIntegrationImplemented: false;
  schemaValidationImplemented: false;
};

/**
 * Capacidades canônicas declaradas do provedor XML TISS Runtime.
 * Todas as flags `*Implemented` permanecem literalmente `false`.
 */
export type XMLCapabilities = {
  kind: "canonical-xml-tiss-capabilities";
  supportsPrepareXMLDocument: boolean;
  supportsGetResult: boolean;
  supportsStats: boolean;
  supportsHealth: boolean;
  supportsCanonicalXMLTISS: boolean;
  runtimeReady: true;
  xmlGenerationImplemented: false;
  xmlSerializationImplemented: false;
  xmlParsingImplemented: false;
  xmlValidationImplemented: false;
  xmlSigningImplemented: false;
  xmlCompressionImplemented: false;
  batchXmlGenerationImplemented: false;
  soapIntegrationImplemented: false;
  operatorIntegrationImplemented: false;
  schemaValidationImplemented: false;
};

/** Helper estrutural — cria contrato de guia desabilitado. */
export function createDisabledXMLGuide(guideType: XMLTISSGuideType, label?: string): XMLGuide {
  return {
    kind: "canonical-xml-tiss-guide",
    guideId: `disabled-${guideType}`,
    guideType,
    status: "disabled",
    header: {
      kind: "canonical-xml-tiss-header",
      headerId: `disabled-header-${guideType}`,
      status: "disabled",
      xmlGenerationImplemented: false,
      xmlSerializationImplemented: false,
    },
    body: {
      kind: "canonical-xml-tiss-body",
      bodyId: `disabled-body-${guideType}`,
      guideType,
      status: "disabled",
      xmlGenerationImplemented: false,
      xmlSerializationImplemented: false,
    },
    xmlGenerationImplemented: false,
    xmlSerializationImplemented: false,
    xmlParsingImplemented: false,
    schemaValidationImplemented: false,
    ...(label ? {} : {}),
  };
}

/** Helper estrutural — cria contrato de versão TISS desabilitado. */
export function createDisabledXMLTISSVersion(
  versionId: XMLTISSVersionId = "disabled-tiss-version",
): XMLTISSVersion {
  return {
    kind: "canonical-xml-tiss-version",
    versionId,
    label: "Structural TISS version contract (no schema binding)",
    namespaces: [],
    schemas: [],
    versionIdentificationImplemented: false,
    namespaceResolutionImplemented: false,
    schemaBindingImplemented: false,
    futureCompatibilityReady: true,
  };
}

/** Contratos estruturais dos tipos de guia futuros (somente declaração). */
export const STRUCTURAL_XML_TISS_GUIDE_TYPES: readonly XMLTISSGuideType[] = [
  "sp-sadt",
  "consulta",
  "internacao",
  "honorarios",
  "resumo-internacao",
  "odontologica",
  "anexo",
  "lote",
  "cabecalho",
  "protocolo",
] as const;
