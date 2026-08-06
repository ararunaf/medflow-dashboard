/**
 * Contratos canônicos do Operator Validation funcional — D-07 / BLOCO D.
 *
 * Validação de operador/identificador específico sobre CanonicalXMLDocument (D-01).
 * Sem TISS. Sem ANS. Sem Operadoras. Sem Workflow. Sem Auto Repair.
 */
import type { CanonicalXMLDocument } from "../../xml-runtime/parser/canonical";
import type {
  CanonicalValidationIssue,
  CanonicalValidationStatistics,
} from "../xsd-validation/canonical";

/**
 * Resultado canônico de validação de operador (D-07).
 */
export type CanonicalOperatorValidationResult = {
  kind: "canonical-operator-validation-result";
  ok: boolean;
  /** true quando o operador declarado confere com o esperado. */
  valid: boolean;
  document?: CanonicalXMLDocument | null;
  /** Identificador de operador esperado. */
  operatorId: string;
  /** Nome do campo/elemento onde o operador é declarado. */
  fieldName: string;
  context?: CanonicalOperatorValidationContext | null;
  issues: readonly CanonicalValidationIssue[];
  statistics?: CanonicalValidationStatistics;
  code?: string;
  message?: string;
};

/**
 * Contexto expandido do Operator Validation (D-07).
 */
export type CanonicalOperatorValidationContext = {
  kind: "canonical-operator-validation-context";
  document?: CanonicalXMLDocument | null;
  operatorId: string;
  fieldName: string;
  issues: readonly CanonicalValidationIssue[];
  statistics?: CanonicalValidationStatistics;
  validationWarnings: readonly string[];
  /** D-07 — única capability funcional habilitada neste contexto. */
  operatorValidationImplemented: true;
};

/** Helper — contexto vazio pós-validação de operador. */
export function createEmptyOperatorValidationContext(
  overrides: Partial<CanonicalOperatorValidationContext> = {},
): CanonicalOperatorValidationContext {
  return {
    kind: "canonical-operator-validation-context",
    document: overrides.document ?? null,
    operatorId: overrides.operatorId ?? "",
    fieldName: overrides.fieldName ?? "operator",
    issues: overrides.issues ?? [],
    statistics: overrides.statistics,
    validationWarnings: overrides.validationWarnings ?? [],
    operatorValidationImplemented: true,
  };
}
