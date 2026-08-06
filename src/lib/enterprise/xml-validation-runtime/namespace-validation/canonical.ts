/**
 * Contratos canônicos do Namespace Validation funcional — D-04 / BLOCO D.
 *
 * Validação de namespace XML genérica sobre CanonicalXMLDocument (D-01).
 * Sem XPath. Sem Transformation. Sem SOAP. Sem TISS. Sem Operadoras.
 * Sem Auto Repair. Sem Workflow. Sem Persistência.
 */
import type { CanonicalXMLDocument } from "../../xml-runtime/parser/canonical";
import type {
  CanonicalValidationIssue,
  CanonicalValidationStatistics,
} from "../xsd-validation/canonical";

/**
 * Resultado canônico de validação de namespace (D-04).
 * Produzido exclusivamente pela capability Namespace Validation.
 */
export type CanonicalNamespaceValidationResult = {
  kind: "canonical-namespace-validation-result";
  ok: boolean;
  /** true quando a namespace requisitada foi encontrada no documento. */
  valid: boolean;
  document?: CanonicalXMLDocument | null;
  /** URI do namespace requisitado. */
  namespaceUri?: string;
  /** Prefixo requisitado, se informado. */
  prefix?: string | null;
  /** true se a URI foi localizada no documento. */
  matched: boolean;
  /** Prefixo real que mapeia para a URI, quando encontrado. */
  matchedPrefix?: string | null;
  context?: CanonicalNamespaceValidationContext | null;
  issues: readonly CanonicalValidationIssue[];
  statistics?: CanonicalValidationStatistics;
  code?: string;
  message?: string;
};

/**
 * Contexto expandido do Namespace Validation (D-04).
 */
export type CanonicalNamespaceValidationContext = {
  kind: "canonical-namespace-validation-context";
  document?: CanonicalXMLDocument | null;
  namespaceUri?: string;
  prefix?: string | null;
  matched: boolean;
  matchedPrefix?: string | null;
  issues: readonly CanonicalValidationIssue[];
  statistics?: CanonicalValidationStatistics;
  validationWarnings: readonly string[];
  /** D-04 — única capability funcional habilitada neste contexto. */
  namespaceValidationImplemented: true;
};

/** Helper — contexto vazio pós-validação de namespace. */
export function createEmptyNamespaceValidationContext(
  overrides: Partial<CanonicalNamespaceValidationContext> = {},
): CanonicalNamespaceValidationContext {
  return {
    kind: "canonical-namespace-validation-context",
    document: overrides.document ?? null,
    namespaceUri: overrides.namespaceUri,
    prefix: overrides.prefix ?? null,
    matched: overrides.matched ?? false,
    matchedPrefix: overrides.matchedPrefix ?? null,
    issues: overrides.issues ?? [],
    statistics: overrides.statistics,
    validationWarnings: overrides.validationWarnings ?? [],
    namespaceValidationImplemented: true,
  };
}
