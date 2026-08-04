/**
 * Modelos canônicos estruturais do Enterprise TISS Mapping Runtime — F3-CAP-11.
 *
 * Foundation estrutural vendor-agnostic para conversão futura de dados extraídos
 * para um Modelo Canônico TISS, desacoplando a aplicação das particularidades
 * de cada operadora e de cada versão do padrão TISS.
 *
 * Sem mapeamento funcional. Sem operadoras implementadas. Sem XML. Sem
 * preenchimento automático. Sem IA. Sem banco. Sem persistência. Sem APIs.
 *
 * Todos os contratos abaixo são exclusivamente estruturais.
 */

import type { DocumentClassificationContext } from "../../document-extraction-runtime/ports/canonical";
import type { DocumentExtractionResult } from "../../document-extraction-runtime/ports/canonical";
import type { ValidationResult } from "../../validation-runtime/ports/canonical";
import type { AIOrchestrationContext } from "../../ai-orchestration-runtime/ports/canonical";
import type { AuditResult } from "../../audit-runtime/ports/canonical";

export type {
  DocumentClassificationContext,
  DocumentExtractionResult,
  ValidationResult,
  AIOrchestrationContext,
  AuditResult,
};

/** Status estrutural de mapeamento TISS (F3-CAP-11). */
export type CanonicalMappingStatus =
  | "pending"
  | "prepared"
  | "mapped"
  | "processed"
  | "failed"
  | "disabled"
  | "unknown"
  | (string & {});

/** Versões TISS futuras — somente contratos. */
export type CanonicalTISSVersion = "TISS_4_00" | "TISS_4_01" | "FutureVersion" | (string & {});

/** Tipos de guia TISS futuros — somente contratos. */
export type CanonicalGuideType =
  | "sp-sadt"
  | "consulta"
  | "internacao"
  | "honorarios"
  | "resumo-internacao"
  | "odontologica"
  | "anexo"
  | (string & {});

/** Operadoras futuras — somente contratos estruturais (sem mapeamento). */
export type CanonicalOperatorKind =
  | "unimed"
  | "hapvida"
  | "bradesco-saude"
  | "sulamerica"
  | "amil"
  | "cassi"
  | "geap"
  | "ipm"
  | "operadora-generica"
  | (string & {});

/** Contrato estrutural de versão TISS (sem implementação). */
export type CanonicalTISSVersionContract = {
  kind: "canonical-tiss-version-contract";
  version: CanonicalTISSVersion;
  status: CanonicalMappingStatus;
  label?: string;
  tissVersionMappingImplemented: false;
};

/** Contrato estrutural de operadora (sem mapeamento). */
export type CanonicalOperator = {
  kind: "canonical-tiss-operator";
  operatorId?: string;
  operatorKind: CanonicalOperatorKind;
  status: CanonicalMappingStatus;
  label?: string;
  operatorMappingImplemented: false;
  layoutMappingImplemented: false;
};

/** Beneficiário canônico estrutural. */
export type CanonicalBeneficiary = {
  kind: "canonical-tiss-beneficiary";
  beneficiaryId?: string;
  status: CanonicalMappingStatus;
  fieldNormalizationImplemented: false;
};

/** Profissional canônico estrutural. */
export type CanonicalProfessional = {
  kind: "canonical-tiss-professional";
  professionalId?: string;
  status: CanonicalMappingStatus;
  fieldNormalizationImplemented: false;
};

/** Prestador canônico estrutural. */
export type CanonicalProvider = {
  kind: "canonical-tiss-provider";
  providerId?: string;
  status: CanonicalMappingStatus;
  fieldNormalizationImplemented: false;
};

/** Campo canônico estrutural. */
export type CanonicalField = {
  kind: "canonical-tiss-field";
  fieldId: string;
  fieldPath?: string;
  label?: string;
  status: CanonicalMappingStatus;
  fieldNormalizationImplemented: false;
  templateMappingImplemented: false;
};

/** Seção canônica estrutural. */
export type CanonicalSection = {
  kind: "canonical-tiss-section";
  sectionId: string;
  sectionCode?: string;
  label?: string;
  fields?: readonly CanonicalField[];
  status: CanonicalMappingStatus;
  templateMappingImplemented: false;
};

/** Procedimento canônico estrutural. */
export type CanonicalProcedure = {
  kind: "canonical-tiss-procedure";
  procedureId: string;
  procedureCode?: string;
  label?: string;
  status: CanonicalMappingStatus;
  fieldNormalizationImplemented: false;
};

/** Guia canônica estrutural — contratos para tipos futuros. */
export type CanonicalGuide = {
  kind: "canonical-tiss-guide";
  guideId: string;
  guideType: CanonicalGuideType;
  tissVersion?: CanonicalTISSVersion;
  operator?: CanonicalOperator;
  beneficiary?: CanonicalBeneficiary;
  professional?: CanonicalProfessional;
  provider?: CanonicalProvider;
  sections?: readonly CanonicalSection[];
  procedures?: readonly CanonicalProcedure[];
  fields?: readonly CanonicalField[];
  status: CanonicalMappingStatus;
  canonicalModelImplemented: false;
  guideTransformationImplemented: false;
  mappingEngineImplemented: false;
  operatorMappingImplemented: false;
  templateMappingImplemented: false;
  fieldNormalizationImplemented: false;
  tissVersionMappingImplemented: false;
  layoutMappingImplemented: false;
  xmlMappingImplemented: false;
  autoFillPreparationImplemented: false;
};

/** Contratos estruturais por tipo de guia (sem implementação). */
export type CanonicalGuideSPADT = CanonicalGuide & {
  guideType: "sp-sadt";
  structuralRole: "guia-sp-sadt";
};

export type CanonicalGuideConsulta = CanonicalGuide & {
  guideType: "consulta";
  structuralRole: "guia-consulta";
};

export type CanonicalGuideInternacao = CanonicalGuide & {
  guideType: "internacao";
  structuralRole: "guia-internacao";
};

export type CanonicalGuideHonorarios = CanonicalGuide & {
  guideType: "honorarios";
  structuralRole: "guia-honorarios";
};

export type CanonicalGuideResumoInternacao = CanonicalGuide & {
  guideType: "resumo-internacao";
  structuralRole: "guia-resumo-internacao";
};

export type CanonicalGuideOdontologica = CanonicalGuide & {
  guideType: "odontologica";
  structuralRole: "guia-odontologica";
};

export type CanonicalGuideAnexo = CanonicalGuide & {
  guideType: "anexo";
  structuralRole: "guia-anexo";
};

/** União estrutural dos contratos de guias. */
export type FutureCanonicalGuideContract =
  | CanonicalGuideSPADT
  | CanonicalGuideConsulta
  | CanonicalGuideInternacao
  | CanonicalGuideHonorarios
  | CanonicalGuideResumoInternacao
  | CanonicalGuideOdontologica
  | CanonicalGuideAnexo;

/**
 * TISSMappingContext canônico (F3-CAP-11).
 *
 * Capaz de receber futuramente DocumentClassificationContext +
 * DocumentExtractionResult + ValidationResult + AuditResult +
 * AIOrchestrationContext — sem qualquer processamento.
 */
export type TISSMappingContext = {
  kind: "canonical-tiss-mapping-context";
  mappingId?: string;
  resultId?: string;
  classificationContext?: DocumentClassificationContext;
  extractionResult?: DocumentExtractionResult;
  validationResult?: ValidationResult;
  auditResult?: AuditResult;
  aiOrchestrationContext?: AIOrchestrationContext;
  guideType?: CanonicalGuideType;
  tissVersion?: CanonicalTISSVersion;
  operator?: CanonicalOperator;
  structuralNotes?: string;
};

/** Issue canônica estrutural — nunca produzida por motor real de mapeamento. */
export type CanonicalMappingIssue = {
  kind: "canonical-tiss-mapping-issue";
  issueId: string;
  code?: string;
  severity?: "info" | "warning" | "error" | "critical" | (string & {});
  message?: string;
  fieldPath?: string;
  status: CanonicalMappingStatus;
  mappingEngineImplemented: false;
};

/** Mapping canônico estrutural. Nunca executa mapeamento real. */
export type CanonicalMapping = {
  kind: "canonical-tiss-mapping";
  mappingId: string;
  status: CanonicalMappingStatus;
  guide?: CanonicalGuide;
  guideType?: CanonicalGuideType;
  tissVersion?: CanonicalTISSVersion;
  operator?: CanonicalOperator;
  mappingContext?: TISSMappingContext;
  classificationContext?: DocumentClassificationContext;
  extractionResult?: DocumentExtractionResult;
  validationResult?: ValidationResult;
  auditResult?: AuditResult;
  aiOrchestrationContext?: AIOrchestrationContext;
  createdAt: string;
  updatedAt: string;
  mappingEngineImplemented: false;
  operatorMappingImplemented: false;
  templateMappingImplemented: false;
  canonicalModelImplemented: false;
  guideTransformationImplemented: false;
  fieldNormalizationImplemented: false;
  tissVersionMappingImplemented: false;
  layoutMappingImplemented: false;
  xmlMappingImplemented: false;
  autoFillPreparationImplemented: false;
};

/** Operação canônica do TISS Mapping Runtime (F3-CAP-11). */
export type CanonicalTISSMappingOperation =
  | "prepareMapping"
  | "getResult"
  | "stats"
  | "health"
  | "capabilities"
  | (string & {});

/**
 * Resultado canônico de execução do TISS Mapping Runtime (F3-CAP-11).
 * Contém apenas referência/estrutura canônica — nunca mapeamento funcional.
 */
export type CanonicalMappingResult = {
  kind: "canonical-tiss-mapping-result";
  ok: boolean;
  resultId: string;
  operation: CanonicalTISSMappingOperation;
  mapping?: CanonicalMapping;
  guide?: CanonicalGuide;
  issues?: readonly CanonicalMappingIssue[];
  mappingContext?: TISSMappingContext;
  classificationContext?: DocumentClassificationContext;
  extractionResult?: DocumentExtractionResult;
  validationResult?: ValidationResult;
  auditResult?: AuditResult;
  aiOrchestrationContext?: AIOrchestrationContext;
  mappingEngineImplemented: false;
  operatorMappingImplemented: false;
  templateMappingImplemented: false;
  canonicalModelImplemented: false;
  guideTransformationImplemented: false;
  fieldNormalizationImplemented: false;
  tissVersionMappingImplemented: false;
  layoutMappingImplemented: false;
  xmlMappingImplemented: false;
  autoFillPreparationImplemented: false;
  /** Sempre true — runtime estrutural pronto (sem mapeamento real). */
  runtimeReady: true;
  status: CanonicalMappingStatus;
  messageText?: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
};

/** Estatísticas estruturais do TISS Mapping Runtime (in-process). */
export type CanonicalMappingStatistics = {
  kind: "canonical-tiss-mapping-statistics";
  totalMappings: number;
  preparedMappings: number;
  totalResults: number;
  totalIssues: number;
  mappingEngineImplementedCount: 0;
  operatorMappingImplementedCount: 0;
  templateMappingImplementedCount: 0;
  canonicalModelImplementedCount: 0;
  guideTransformationImplementedCount: 0;
  fieldNormalizationImplementedCount: 0;
  tissVersionMappingImplementedCount: 0;
  layoutMappingImplementedCount: 0;
  xmlMappingImplementedCount: 0;
  autoFillPreparationImplementedCount: 0;
};

/** Saúde canônica estrutural do provedor TISS Mapping Runtime. */
export type CanonicalMappingHealth = {
  kind: "canonical-tiss-mapping-health";
  ok: boolean;
  provider: string;
  latencyMs?: number;
  message?: string;
  status?: string;
  storedMappingCount?: number;
  storedResultCount?: number;
  aiOrchestrationRuntimeOk?: boolean;
  auditRuntimeOk?: boolean;
  validationRuntimeOk?: boolean;
  documentExtractionRuntimeOk?: boolean;
  documentClassificationRuntimeOk?: boolean;
  ocrRuntimeOk?: boolean;
  intelligentCaptureRuntimeOk?: boolean;
  scannerRuntimeOk?: boolean;
  watchFolderRuntimeOk?: boolean;
  uploadRuntimeOk?: boolean;
  runtimeReady: true;
  mappingEngineImplemented: false;
  operatorMappingImplemented: false;
  templateMappingImplemented: false;
  canonicalModelImplemented: false;
  guideTransformationImplemented: false;
  fieldNormalizationImplemented: false;
  tissVersionMappingImplemented: false;
  layoutMappingImplemented: false;
  xmlMappingImplemented: false;
  autoFillPreparationImplemented: false;
};

/**
 * Capacidades canônicas declaradas do provedor TISS Mapping Runtime.
 * Todas as flags `*Implemented` permanecem literalmente `false`.
 */
export type CanonicalMappingCapabilities = {
  kind: "canonical-tiss-mapping-capabilities";
  supportsPrepareMapping: boolean;
  supportsGetResult: boolean;
  supportsStats: boolean;
  supportsHealth: boolean;
  supportsCanonicalMapping: boolean;
  runtimeReady: true;
  mappingEngineImplemented: false;
  operatorMappingImplemented: false;
  templateMappingImplemented: false;
  canonicalModelImplemented: false;
  guideTransformationImplemented: false;
  fieldNormalizationImplemented: false;
  tissVersionMappingImplemented: false;
  layoutMappingImplemented: false;
  xmlMappingImplemented: false;
  autoFillPreparationImplemented: false;
};

/** Helper estrutural — cria contrato de guia desabilitado. */
export function createDisabledCanonicalGuide(
  guideType: CanonicalGuideType,
  label: string,
): CanonicalGuide {
  return {
    kind: "canonical-tiss-guide",
    guideId: `disabled-${guideType}`,
    guideType,
    status: "disabled",
    canonicalModelImplemented: false,
    guideTransformationImplemented: false,
    mappingEngineImplemented: false,
    operatorMappingImplemented: false,
    templateMappingImplemented: false,
    fieldNormalizationImplemented: false,
    tissVersionMappingImplemented: false,
    layoutMappingImplemented: false,
    xmlMappingImplemented: false,
    autoFillPreparationImplemented: false,
    sections: [],
    procedures: [],
    fields: [],
  };
}

/** Helper estrutural — cria contrato de operadora desabilitado. */
export function createDisabledCanonicalOperator(
  operatorKind: CanonicalOperatorKind,
  label: string,
): CanonicalOperator {
  return {
    kind: "canonical-tiss-operator",
    operatorKind,
    status: "disabled",
    label,
    operatorMappingImplemented: false,
    layoutMappingImplemented: false,
  };
}

/** Helper estrutural — cria contrato de versão TISS desabilitado. */
export function createDisabledTISSVersionContract(
  version: CanonicalTISSVersion,
  label: string,
): CanonicalTISSVersionContract {
  return {
    kind: "canonical-tiss-version-contract",
    version,
    status: "disabled",
    label,
    tissVersionMappingImplemented: false,
  };
}
