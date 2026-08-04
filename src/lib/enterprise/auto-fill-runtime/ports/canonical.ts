/**
 * Modelos canônicos estruturais do Enterprise Auto-Fill Runtime — F3-CAP-12.
 *
 * Foundation estrutural vendor-agnostic para transformação futura do Modelo
 * Canônico TISS em uma guia completamente preenchida.
 *
 * Sem preenchimento automático. Sem geração de XML. Sem escrita em guias.
 * Sem integração com operadoras. Sem IA. Sem banco. Sem persistência. Sem APIs.
 *
 * Todos os contratos abaixo são exclusivamente estruturais.
 */

import type {
  CanonicalGuide,
  CanonicalGuideAnexo,
  CanonicalGuideConsulta,
  CanonicalGuideHonorarios,
  CanonicalGuideInternacao,
  CanonicalGuideOdontologica,
  CanonicalGuideResumoInternacao,
  CanonicalGuideSPADT,
  CanonicalGuideType,
  CanonicalMappingResult,
  CanonicalOperator,
  CanonicalOperatorKind,
} from "../../tiss-mapping-runtime/ports/canonical";
import type { ValidationResult } from "../../validation-runtime/ports/canonical";
import type { AuditResult } from "../../audit-runtime/ports/canonical";
import type { AIOrchestrationContext } from "../../ai-orchestration-runtime/ports/canonical";

export type {
  CanonicalGuide,
  CanonicalGuideAnexo,
  CanonicalGuideConsulta,
  CanonicalGuideHonorarios,
  CanonicalGuideInternacao,
  CanonicalGuideOdontologica,
  CanonicalGuideResumoInternacao,
  CanonicalGuideSPADT,
  CanonicalGuideType,
  CanonicalMappingResult,
  CanonicalOperator,
  CanonicalOperatorKind,
  ValidationResult,
  AuditResult,
  AIOrchestrationContext,
};

/** Status estrutural de auto-fill (F3-CAP-12). */
export type AutoFillStatus =
  | "pending"
  | "prepared"
  | "populated"
  | "processed"
  | "failed"
  | "disabled"
  | "unknown"
  | (string & {});

/** Tipos de guia TISS futuros — somente contratos (espelho estrutural). */
export type AutoFillGuideType = CanonicalGuideType;

/** Operadoras futuras — somente contratos estruturais (sem população). */
export type AutoFillOperatorKind = CanonicalOperatorKind;

/** Campo estrutural de auto-fill — nunca preenchido. */
export type AutoFillField = {
  kind: "canonical-auto-fill-field";
  fieldId: string;
  fieldPath?: string;
  label?: string;
  status: AutoFillStatus;
  fieldPopulationImplemented: false;
  templatePopulationImplemented: false;
};

/** Seção estrutural de auto-fill — nunca preenchida. */
export type AutoFillSection = {
  kind: "canonical-auto-fill-section";
  sectionId: string;
  sectionCode?: string;
  label?: string;
  fields?: readonly AutoFillField[];
  status: AutoFillStatus;
  templatePopulationImplemented: false;
  fieldPopulationImplemented: false;
};

/** Guia estrutural de auto-fill — contratos para tipos futuros. */
export type AutoFillGuide = {
  kind: "canonical-auto-fill-guide";
  guideId: string;
  guideType: AutoFillGuideType;
  operator?: CanonicalOperator;
  sections?: readonly AutoFillSection[];
  fields?: readonly AutoFillField[];
  canonicalGuide?: CanonicalGuide;
  status: AutoFillStatus;
  autoFillEngineImplemented: false;
  guideGenerationImplemented: false;
  fieldPopulationImplemented: false;
  templatePopulationImplemented: false;
  operatorPopulationImplemented: false;
  xmlPopulationImplemented: false;
  validationIntegrationImplemented: false;
  auditIntegrationImplemented: false;
  qualityIntegrationImplemented: false;
  automaticCompletionImplemented: false;
};

/** Contratos estruturais por tipo de guia (sem preenchimento). */
export type AutoFillGuideSPADT = AutoFillGuide & {
  guideType: "sp-sadt";
  structuralRole: "guia-sp-sadt";
};

export type AutoFillGuideConsulta = AutoFillGuide & {
  guideType: "consulta";
  structuralRole: "guia-consulta";
};

export type AutoFillGuideInternacao = AutoFillGuide & {
  guideType: "internacao";
  structuralRole: "guia-internacao";
};

export type AutoFillGuideHonorarios = AutoFillGuide & {
  guideType: "honorarios";
  structuralRole: "guia-honorarios";
};

export type AutoFillGuideResumoInternacao = AutoFillGuide & {
  guideType: "resumo-internacao";
  structuralRole: "guia-resumo-internacao";
};

export type AutoFillGuideOdontologica = AutoFillGuide & {
  guideType: "odontologica";
  structuralRole: "guia-odontologica";
};

export type AutoFillGuideAnexo = AutoFillGuide & {
  guideType: "anexo";
  structuralRole: "guia-anexo";
};

/** União estrutural dos contratos de guias. */
export type FutureAutoFillGuideContract =
  | AutoFillGuideSPADT
  | AutoFillGuideConsulta
  | AutoFillGuideInternacao
  | AutoFillGuideHonorarios
  | AutoFillGuideResumoInternacao
  | AutoFillGuideOdontologica
  | AutoFillGuideAnexo;

/** Contrato estrutural de operadora para auto-fill (sem população). */
export type AutoFillOperator = {
  kind: "canonical-auto-fill-operator";
  operatorId?: string;
  operatorKind: AutoFillOperatorKind;
  status: AutoFillStatus;
  label?: string;
  operatorPopulationImplemented: false;
  xmlPopulationImplemented: false;
};

/**
 * AutoFillContext canônico (F3-CAP-12).
 *
 * Aceita exclusivamente por contrato:
 *   CanonicalGuide + CanonicalMappingResult + ValidationResult +
 *   AuditResult + AIOrchestrationContext
 * — sem qualquer processamento.
 */
export type AutoFillContext = {
  kind: "canonical-auto-fill-context";
  autoFillId?: string;
  resultId?: string;
  canonicalGuide?: CanonicalGuide;
  mappingResult?: CanonicalMappingResult;
  validationResult?: ValidationResult;
  auditResult?: AuditResult;
  aiOrchestrationContext?: AIOrchestrationContext;
  guideType?: AutoFillGuideType;
  operator?: AutoFillOperator | CanonicalOperator;
  structuralNotes?: string;
};

/** Issue canônica estrutural — nunca produzida por motor real de auto-fill. */
export type AutoFillIssue = {
  kind: "canonical-auto-fill-issue";
  issueId: string;
  code?: string;
  severity?: "info" | "warning" | "error" | "critical" | (string & {});
  message?: string;
  fieldPath?: string;
  status: AutoFillStatus;
  autoFillEngineImplemented: false;
};

/** Sessão canônica estrutural de auto-fill. Nunca executa preenchimento real. */
export type AutoFillSession = {
  kind: "canonical-auto-fill-session";
  autoFillId: string;
  status: AutoFillStatus;
  guide?: AutoFillGuide;
  guideType?: AutoFillGuideType;
  operator?: AutoFillOperator | CanonicalOperator;
  autoFillContext?: AutoFillContext;
  canonicalGuide?: CanonicalGuide;
  mappingResult?: CanonicalMappingResult;
  validationResult?: ValidationResult;
  auditResult?: AuditResult;
  aiOrchestrationContext?: AIOrchestrationContext;
  createdAt: string;
  updatedAt: string;
  autoFillEngineImplemented: false;
  guideGenerationImplemented: false;
  fieldPopulationImplemented: false;
  templatePopulationImplemented: false;
  operatorPopulationImplemented: false;
  xmlPopulationImplemented: false;
  validationIntegrationImplemented: false;
  auditIntegrationImplemented: false;
  qualityIntegrationImplemented: false;
  automaticCompletionImplemented: false;
};

/** Operação canônica do Auto-Fill Runtime (F3-CAP-12). */
export type CanonicalAutoFillOperation =
  | "prepareAutoFill"
  | "getResult"
  | "stats"
  | "health"
  | "capabilities"
  | (string & {});

/**
 * Resultado canônico de execução do Auto-Fill Runtime (F3-CAP-12).
 * Contém apenas referência/estrutura canônica — nunca preenchimento funcional.
 */
export type AutoFillResult = {
  kind: "canonical-auto-fill-result";
  ok: boolean;
  resultId: string;
  operation: CanonicalAutoFillOperation;
  session?: AutoFillSession;
  guide?: AutoFillGuide;
  issues?: readonly AutoFillIssue[];
  autoFillContext?: AutoFillContext;
  canonicalGuide?: CanonicalGuide;
  mappingResult?: CanonicalMappingResult;
  validationResult?: ValidationResult;
  auditResult?: AuditResult;
  aiOrchestrationContext?: AIOrchestrationContext;
  autoFillEngineImplemented: false;
  guideGenerationImplemented: false;
  fieldPopulationImplemented: false;
  templatePopulationImplemented: false;
  operatorPopulationImplemented: false;
  xmlPopulationImplemented: false;
  validationIntegrationImplemented: false;
  auditIntegrationImplemented: false;
  qualityIntegrationImplemented: false;
  automaticCompletionImplemented: false;
  /** Sempre true — runtime estrutural pronto (sem preenchimento real). */
  runtimeReady: true;
  status: AutoFillStatus;
  messageText?: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
};

/** Estatísticas estruturais do Auto-Fill Runtime (in-process). */
export type AutoFillStatistics = {
  kind: "canonical-auto-fill-statistics";
  totalSessions: number;
  preparedSessions: number;
  totalResults: number;
  totalIssues: number;
  autoFillEngineImplementedCount: 0;
  guideGenerationImplementedCount: 0;
  fieldPopulationImplementedCount: 0;
  templatePopulationImplementedCount: 0;
  operatorPopulationImplementedCount: 0;
  xmlPopulationImplementedCount: 0;
  validationIntegrationImplementedCount: 0;
  auditIntegrationImplementedCount: 0;
  qualityIntegrationImplementedCount: 0;
  automaticCompletionImplementedCount: 0;
};

/** Saúde canônica estrutural do provedor Auto-Fill Runtime. */
export type AutoFillHealth = {
  kind: "canonical-auto-fill-health";
  ok: boolean;
  provider: string;
  latencyMs?: number;
  message?: string;
  status?: string;
  storedSessionCount?: number;
  storedResultCount?: number;
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
  autoFillEngineImplemented: false;
  guideGenerationImplemented: false;
  fieldPopulationImplemented: false;
  templatePopulationImplemented: false;
  operatorPopulationImplemented: false;
  xmlPopulationImplemented: false;
  validationIntegrationImplemented: false;
  auditIntegrationImplemented: false;
  qualityIntegrationImplemented: false;
  automaticCompletionImplemented: false;
};

/**
 * Capacidades canônicas declaradas do provedor Auto-Fill Runtime.
 * Todas as flags `*Implemented` permanecem literalmente `false`.
 */
export type AutoFillCapabilities = {
  kind: "canonical-auto-fill-capabilities";
  supportsPrepareAutoFill: boolean;
  supportsGetResult: boolean;
  supportsStats: boolean;
  supportsHealth: boolean;
  supportsCanonicalAutoFill: boolean;
  runtimeReady: true;
  autoFillEngineImplemented: false;
  guideGenerationImplemented: false;
  fieldPopulationImplemented: false;
  templatePopulationImplemented: false;
  operatorPopulationImplemented: false;
  xmlPopulationImplemented: false;
  validationIntegrationImplemented: false;
  auditIntegrationImplemented: false;
  qualityIntegrationImplemented: false;
  automaticCompletionImplemented: false;
};

/** Helper estrutural — cria contrato de guia desabilitado. */
export function createDisabledAutoFillGuide(
  guideType: AutoFillGuideType,
  label: string,
): AutoFillGuide {
  return {
    kind: "canonical-auto-fill-guide",
    guideId: `disabled-${guideType}`,
    guideType,
    status: "disabled",
    autoFillEngineImplemented: false,
    guideGenerationImplemented: false,
    fieldPopulationImplemented: false,
    templatePopulationImplemented: false,
    operatorPopulationImplemented: false,
    xmlPopulationImplemented: false,
    validationIntegrationImplemented: false,
    auditIntegrationImplemented: false,
    qualityIntegrationImplemented: false,
    automaticCompletionImplemented: false,
    sections: [],
    fields: [],
  };
}

/** Helper estrutural — cria contrato de operadora desabilitado. */
export function createDisabledAutoFillOperator(
  operatorKind: AutoFillOperatorKind,
  label: string,
): AutoFillOperator {
  return {
    kind: "canonical-auto-fill-operator",
    operatorKind,
    status: "disabled",
    label,
    operatorPopulationImplemented: false,
    xmlPopulationImplemented: false,
  };
}
