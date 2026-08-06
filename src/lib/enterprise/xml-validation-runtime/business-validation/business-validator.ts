/**
 * BusinessValidator — D-06 Enterprise XML Validation Runtime Functional Foundation.
 *
 * Capability única: validação de regras de negócio genéricas sobre CanonicalXMLDocument (D-01).
 *
 * Sem TISS. Sem ANS. Sem Operadoras. Sem Workflow. Sem Auto Repair.
 */
import type { CanonicalXMLDocument, CanonicalXMLNode } from "../../xml-runtime/parser/canonical";
import type {
  BusinessValidationRule,
  CanonicalBusinessValidationContext,
  CanonicalBusinessValidationResult,
} from "./canonical";
import { createEmptyBusinessValidationContext } from "./canonical";
import type {
  CanonicalValidationIssue,
  CanonicalValidationStatistics,
} from "../xsd-validation/canonical";

export type BusinessValidatorOptions = {
  /** Regras de negócio a serem avaliadas. */
  rules: readonly BusinessValidationRule[];
  /** Nome do elemento raiz esperado (localName). */
  rootElementName?: string;
};

function createIssue(code: string, message: string, path?: string): CanonicalValidationIssue {
  return {
    kind: "canonical-validation-issue",
    code,
    severity: "error",
    message,
    path,
  };
}

function computeStatistics(): CanonicalValidationStatistics {
  return {
    kind: "canonical-validation-statistics",
    elementCount: 0,
    attributeCount: 0,
    schemaElementCount: 0,
    schemaTypeCount: 0,
    issueCount: 0,
    errorCount: 0,
    warningCount: 0,
    infoCount: 0,
    durationMs: 0,
  };
}

function getTextContent(node: CanonicalXMLNode): string {
  if (node.textContent) return node.textContent;
  const parts: string[] = [];
  for (const child of node.children ?? []) {
    if (child.nodeType === "text" && child.textContent) parts.push(child.textContent);
  }
  return parts.join("").trim();
}

function findChildByLocalName(
  node: CanonicalXMLNode,
  localName: string,
): CanonicalXMLNode | undefined {
  return (node.children ?? []).find(
    (child) =>
      child.nodeType === "element" && (child.localName === localName || child.name === localName),
  );
}

function applyRule(
  document: CanonicalXMLDocument,
  rule: BusinessValidationRule,
): CanonicalValidationIssue | undefined {
  const root = document.rootNode;
  if (!root)
    return createIssue("XML_BUSINESS_RUNTIME_NO_ROOT", "Document has no root element.", "/");

  if (rule.kind === "required-field") {
    const field = findChildByLocalName(root, rule.field);
    if (!field) {
      return createIssue(
        "XML_BUSINESS_RUNTIME_REQUIRED_FIELD_MISSING",
        rule.message ?? `Required field '${rule.field}' is missing.`,
        rule.path ?? `/${rule.field}`,
      );
    }
    return undefined;
  }

  if (rule.kind === "allowed-values") {
    const field = findChildByLocalName(root, rule.field);
    if (!field) {
      return createIssue(
        "XML_BUSINESS_RUNTIME_FIELD_NOT_FOUND",
        `Field '${rule.field}' not found for allowed-values check.`,
        rule.path ?? `/${rule.field}`,
      );
    }
    const value = getTextContent(field);
    if (!rule.values.includes(value)) {
      return createIssue(
        "XML_BUSINESS_RUNTIME_VALUE_NOT_ALLOWED",
        rule.message ??
          `Value '${value}' for field '${rule.field}' is not in [${rule.values.join(", ")}].`,
        rule.path ?? `/${rule.field}`,
      );
    }
    return undefined;
  }

  if (rule.kind === "numeric-range") {
    const field = findChildByLocalName(root, rule.field);
    if (!field) {
      return createIssue(
        "XML_BUSINESS_RUNTIME_FIELD_NOT_FOUND",
        `Field '${rule.field}' not found for numeric-range check.`,
        rule.path ?? `/${rule.field}`,
      );
    }
    const value = Number(getTextContent(field));
    if (Number.isNaN(value)) {
      return createIssue(
        "XML_BUSINESS_RUNTIME_FIELD_NOT_NUMERIC",
        `Field '${rule.field}' does not contain a numeric value.`,
        rule.path ?? `/${rule.field}`,
      );
    }
    if (
      (rule.min !== undefined && value < rule.min) ||
      (rule.max !== undefined && value > rule.max)
    ) {
      return createIssue(
        "XML_BUSINESS_RUNTIME_NUMERIC_RANGE_VIOLATION",
        rule.message ?? `Value ${value} for field '${rule.field}' is outside the allowed range.`,
        rule.path ?? `/${rule.field}`,
      );
    }
    return undefined;
  }

  return undefined;
}

/**
 * Valida regras de negócio genéricas sobre o documento canônico.
 */
export function validateBusiness(
  document: CanonicalXMLDocument,
  options: BusinessValidatorOptions,
): CanonicalBusinessValidationResult {
  const { rules, rootElementName } = options;
  const issues: CanonicalValidationIssue[] = [];
  const statistics = computeStatistics();
  const root = document.rootNode;

  if (rootElementName && root?.localName !== rootElementName && root?.name !== rootElementName) {
    issues.push(
      createIssue(
        "XML_BUSINESS_RUNTIME_ROOT_MISMATCH",
        `Root element expected '${rootElementName}', found '${root?.localName ?? root?.name ?? "(none)"}'.`,
        "/",
      ),
    );
  }

  for (const rule of rules) {
    const issue = applyRule(document, rule);
    if (issue) issues.push(issue);
  }

  statistics.issueCount = issues.length;
  statistics.errorCount = issues.length;

  const context = createEmptyBusinessValidationContext({
    document,
    rules,
    issues,
    statistics,
    validationWarnings: [],
  });

  const valid = issues.length === 0;

  return {
    kind: "canonical-business-validation-result",
    ok: true,
    valid,
    document,
    rules,
    context,
    issues,
    statistics,
    code: valid ? "XML_BUSINESS_RUNTIME_OK" : "XML_BUSINESS_RUNTIME_VIOLATION",
    message: valid
      ? "Business rules validated successfully."
      : `Business validation failed: ${issues.map((i) => i.message).join("; ")}`,
  };
}

/**
 * Validador de regras de negócio stateless para o XML Validation Runtime.
 */
export class BusinessValidator {
  validate(
    document: CanonicalXMLDocument,
    options: BusinessValidatorOptions,
  ): CanonicalBusinessValidationResult {
    return validateBusiness(document, options);
  }
}
