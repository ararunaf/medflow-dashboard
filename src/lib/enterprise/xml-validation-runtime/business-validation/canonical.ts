/**
 * Contratos canônicos do Business Validation funcional — D-06 / BLOCO D.
 *
 * Validação de regras de negócio genéricas sobre CanonicalXMLDocument (D-01).
 * Sem TISS. Sem ANS. Sem Operadoras. Sem Workflow. Sem Auto Repair.
 */
import type { CanonicalXMLDocument } from "../../xml-runtime/parser/canonical";
import type {
  CanonicalValidationIssue,
  CanonicalValidationStatistics,
} from "../xsd-validation/canonical";

/** Regra de negócio genérica aplicada sobre o documento canônico. */
export type BusinessValidationRule =
  | {
      kind: "required-field";
      field: string;
      path?: string;
      message?: string;
    }
  | {
      kind: "allowed-values";
      field: string;
      values: readonly string[];
      path?: string;
      message?: string;
    }
  | {
      kind: "numeric-range";
      field: string;
      min?: number;
      max?: number;
      path?: string;
      message?: string;
    };

/**
 * Resultado canônico de validação de regras de negócio (D-06).
 */
export type CanonicalBusinessValidationResult = {
  kind: "canonical-business-validation-result";
  ok: boolean;
  /** true quando nenhuma regra de negócio foi violada. */
  valid: boolean;
  document?: CanonicalXMLDocument | null;
  /** Regras requisitadas. */
  rules: readonly BusinessValidationRule[];
  context?: CanonicalBusinessValidationContext | null;
  issues: readonly CanonicalValidationIssue[];
  statistics?: CanonicalValidationStatistics;
  code?: string;
  message?: string;
};

/**
 * Contexto expandido do Business Validation (D-06).
 */
export type CanonicalBusinessValidationContext = {
  kind: "canonical-business-validation-context";
  document?: CanonicalXMLDocument | null;
  rules: readonly BusinessValidationRule[];
  issues: readonly CanonicalValidationIssue[];
  statistics?: CanonicalValidationStatistics;
  validationWarnings: readonly string[];
  /** D-06 — única capability funcional habilitada neste contexto. */
  businessValidationImplemented: true;
};

/** Helper — contexto vazio pós-validação de regras de negócio. */
export function createEmptyBusinessValidationContext(
  overrides: Partial<CanonicalBusinessValidationContext> = {},
): CanonicalBusinessValidationContext {
  return {
    kind: "canonical-business-validation-context",
    document: overrides.document ?? null,
    rules: overrides.rules ?? [],
    issues: overrides.issues ?? [],
    statistics: overrides.statistics,
    validationWarnings: overrides.validationWarnings ?? [],
    businessValidationImplemented: true,
  };
}
