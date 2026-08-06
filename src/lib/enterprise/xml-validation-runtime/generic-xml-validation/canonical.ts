/**
 * Contratos canônicos da Generic XML Validation — D-11 / BLOCO D.
 *
 * Orquestra as capabilities D-01 a D-10 sem TISS/ANS/Operadoras.
 */
import type { CanonicalXMLDocument } from "../../xml-runtime/parser/canonical";
import type { XMLAutomaticCorrectionRule } from "../automatic-correction/canonical";
import type {
  BusinessValidationRule,
  CanonicalBusinessValidationResult,
} from "../business-validation/canonical";
import type { CanonicalNamespaceValidationResult } from "../namespace-validation/canonical";
import type { CanonicalOperatorValidationResult } from "../operator-validation/canonical";
import type { CanonicalVersionValidationResult } from "../version-validation/canonical";
import type { XMLRepairRule } from "../xml-repair/canonical";
import type { CanonicalXSDValidationResult } from "../xsd-validation/canonical";

/** Flags de orquestração das validações disponíveis. */
export type XMLGenericValidationOptions = {
  /** Habilita XSD Validation (D-02). */
  xsd?: boolean;
  /** Habilita Namespace Validation (D-04). */
  namespace?: boolean;
  /** Habilita Version Validation (D-05). */
  version?: boolean;
  /** Habilita Business Validation (D-06). */
  business?: boolean;
  /** Habilita Operator Validation (D-07). */
  operator?: boolean;
  /** Habilita XML Repair (D-08). */
  repair?: boolean;
  /** Habilita Automatic Correction (D-09). */
  correction?: boolean;
  /** Habilita Validation Report (D-10). */
  report?: boolean;
};

/** Regras para validações específicas (sem semântica de negócio). */
export type XMLGenericValidationRules = {
  /** Esquema XSD (D-02). */
  xsdSchema?: string;
  /** Regras de negócio (D-06). */
  businessRules?: readonly BusinessValidationRule[];
  /** Operador esperado (D-07). */
  operatorExpected?: string;
  /** Versão esperada (D-05). */
  versionExpected?: string;
  /** Namespace esperado (D-04). */
  namespaceExpected?: string;
  /** Reparos (D-08). */
  repairRules?: readonly XMLRepairRule[];
  /** Correções automáticas (D-09). */
  correctionRules?: readonly XMLAutomaticCorrectionRule[];
};

/** Item de relatório D-10 simplificado. */
export type CanonicalGenericXMLValidationReportItem = {
  kind: "canonical-generic-xml-validation-report-item";
  operation: string;
  ok: boolean;
  code?: string | null;
  message?: string | null;
};

/** Relatório consolidado D-10. */
export type CanonicalGenericXMLValidationReport = {
  kind: "canonical-generic-xml-validation-report";
  ok: boolean;
  items: readonly CanonicalGenericXMLValidationReportItem[];
};

/**
 * Resultado canônico da Generic XML Validation (D-11).
 */
export type CanonicalGenericXMLValidationResult = {
  kind: "canonical-generic-xml-validation-result";
  ok: boolean;
  /** Documento processado (após repair/correction se ativados). */
  document: CanonicalXMLDocument;
  xsd?: CanonicalXSDValidationResult | null;
  namespace?: CanonicalNamespaceValidationResult | null;
  version?: CanonicalVersionValidationResult | null;
  business?: CanonicalBusinessValidationResult | null;
  operator?: CanonicalOperatorValidationResult | null;
  repair?: import("../xml-repair/canonical").CanonicalXMLRepairResult | null;
  correction?:
    | import("../automatic-correction/canonical").CanonicalXMLAutomaticCorrectionResult
    | null;
  /** Relatório consolidado (D-10), se ativado. */
  report?: CanonicalGenericXMLValidationReport | null;
  context?: CanonicalGenericXMLValidationContext | null;
  code?: string;
  message?: string;
};

/**
 * Contexto expandido da Generic XML Validation (D-11).
 */
export type CanonicalGenericXMLValidationContext = {
  kind: "canonical-generic-xml-validation-context";
  document: CanonicalXMLDocument;
  options: XMLGenericValidationOptions;
  /** D-11 — única capability funcional habilitada neste contexto. */
  xmlValidationImplemented: true;
};

/** Helper — contexto vazio. */
export function createEmptyGenericXMLValidationContext(
  overrides: Partial<CanonicalGenericXMLValidationContext> = {},
): CanonicalGenericXMLValidationContext {
  return {
    kind: "canonical-generic-xml-validation-context",
    document: overrides.document ?? ({} as CanonicalXMLDocument),
    options: overrides.options ?? {},
    xmlValidationImplemented: true,
  };
}
