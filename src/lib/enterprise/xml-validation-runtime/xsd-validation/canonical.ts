/**
 * Contratos canônicos do XSD Validation funcional — D-02 / BLOCO D.
 *
 * Validação XSD genérica sobre CanonicalXMLDocument (D-01).
 * Sem XPath. Sem Transformation. Sem SOAP. Sem TISS. Sem Operadoras.
 * Sem Auto Repair. Sem Workflow. Sem Persistência.
 */
import type { CanonicalXMLDocument } from "../../xml-runtime/parser/canonical";

/** Issue canônica de validação (D-02). */
export type CanonicalValidationIssue = {
  kind: "canonical-validation-issue";
  issueId?: string;
  code: string;
  severity: "info" | "warn" | "error";
  message: string;
  path?: string;
  line?: number;
  column?: number;
};

/** Estatísticas canônicas de uma validação XSD (D-02). */
export type CanonicalValidationStatistics = {
  kind: "canonical-validation-statistics";
  elementCount: number;
  attributeCount: number;
  schemaElementCount: number;
  schemaTypeCount: number;
  issueCount: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  durationMs: number;
};

/**
 * Resultado canônico de validação XSD (D-02).
 * Produzido exclusivamente pela capability XSD Validation.
 */
export type CanonicalXSDValidationResult = {
  kind: "canonical-xsd-validation-result";
  ok: boolean;
  /** true quando não há issues de severidade error. */
  valid: boolean;
  document?: CanonicalXMLDocument | null;
  schemaDocument?: CanonicalXMLDocument | null;
  context?: XMLValidationRuntimeContext | null;
  issues: readonly CanonicalValidationIssue[];
  statistics?: CanonicalValidationStatistics;
  code?: string;
  message?: string;
};

/**
 * Contexto expandido do XML Validation Runtime (D-02).
 * Carrega o resultado da validação XSD sem capabilities adicionais.
 */
export type XMLValidationRuntimeContext = {
  kind: "canonical-xml-validation-runtime-context";
  document?: CanonicalXMLDocument | null;
  schemaDocument?: CanonicalXMLDocument | null;
  rootElementName?: string | null;
  issues: readonly CanonicalValidationIssue[];
  statistics?: CanonicalValidationStatistics;
  validationWarnings: readonly string[];
  /** D-02 — única capability funcional habilitada. */
  xsdValidationImplemented: true;
};

/** Helper — contexto vazio pré/pós validação. */
export function createEmptyXMLValidationRuntimeContext(
  overrides: Partial<XMLValidationRuntimeContext> = {},
): XMLValidationRuntimeContext {
  return {
    kind: "canonical-xml-validation-runtime-context",
    document: overrides.document ?? null,
    schemaDocument: overrides.schemaDocument ?? null,
    rootElementName: overrides.rootElementName ?? null,
    issues: overrides.issues ?? [],
    statistics: overrides.statistics,
    validationWarnings: overrides.validationWarnings ?? [],
    xsdValidationImplemented: true,
  };
}
