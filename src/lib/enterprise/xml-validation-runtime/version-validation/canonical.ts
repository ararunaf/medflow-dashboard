/**
 * Contratos canônicos do Version Validation funcional — D-05 / BLOCO D.
 *
 * Validação de versão XML genérica sobre CanonicalXMLDocument (D-01).
 * Sem XPath. Sem Transformation. Sem SOAP. Sem TISS. Sem Operadoras.
 * Sem Auto Repair. Sem Workflow. Sem Persistência.
 */
import type { CanonicalXMLDocument } from "../../xml-runtime/parser/canonical";
import type {
  CanonicalValidationIssue,
  CanonicalValidationStatistics,
} from "../xsd-validation/canonical";

/**
 * Resultado canônico de validação de versão (D-05).
 * Produzido exclusivamente pela capability Version Validation.
 */
export type CanonicalVersionValidationResult = {
  kind: "canonical-version-validation-result";
  ok: boolean;
  /** true quando a versão requisitada foi encontrada e corresponde. */
  valid: boolean;
  document?: CanonicalXMLDocument | null;
  /** Versão esperada. */
  versionId?: string;
  /** Nome do atributo verificado. */
  attributeName?: string;
  /** Valor encontrado no documento. */
  foundVersion?: string | null;
  /** true se a versão foi localizada no documento. */
  matched: boolean;
  context?: CanonicalVersionValidationContext | null;
  issues: readonly CanonicalValidationIssue[];
  statistics?: CanonicalValidationStatistics;
  code?: string;
  message?: string;
};

/**
 * Contexto expandido do Version Validation (D-05).
 */
export type CanonicalVersionValidationContext = {
  kind: "canonical-version-validation-context";
  document?: CanonicalXMLDocument | null;
  versionId?: string;
  attributeName?: string;
  foundVersion?: string | null;
  matched: boolean;
  issues: readonly CanonicalValidationIssue[];
  statistics?: CanonicalValidationStatistics;
  validationWarnings: readonly string[];
  /** D-05 — única capability funcional habilitada neste contexto. */
  versionValidationImplemented: true;
};

/** Helper — contexto vazio pós-validação de versão. */
export function createEmptyVersionValidationContext(
  overrides: Partial<CanonicalVersionValidationContext> = {},
): CanonicalVersionValidationContext {
  return {
    kind: "canonical-version-validation-context",
    document: overrides.document ?? null,
    versionId: overrides.versionId,
    attributeName: overrides.attributeName,
    foundVersion: overrides.foundVersion ?? null,
    matched: overrides.matched ?? false,
    issues: overrides.issues ?? [],
    statistics: overrides.statistics,
    validationWarnings: overrides.validationWarnings ?? [],
    versionValidationImplemented: true,
  };
}
