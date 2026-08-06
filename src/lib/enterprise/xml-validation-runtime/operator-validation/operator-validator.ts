/**
 * OperatorValidator — D-07 Enterprise XML Validation Runtime Functional Foundation.
 *
 * Capability única: validação de identificador de operador em CanonicalXMLDocument (D-01).
 *
 * Sem TISS. Sem ANS. Sem Operadoras. Sem Workflow. Sem Auto Repair.
 */
import type { CanonicalXMLDocument, CanonicalXMLNode } from "../../xml-runtime/parser/canonical";
import type {
  CanonicalOperatorValidationContext,
  CanonicalOperatorValidationResult,
} from "./canonical";
import { createEmptyOperatorValidationContext } from "./canonical";
import type {
  CanonicalValidationIssue,
  CanonicalValidationStatistics,
} from "../xsd-validation/canonical";

export type OperatorValidatorOptions = {
  /** Identificador de operador esperado. */
  operatorId: string;
  /** Nome do atributo/elemento onde o operador é declarado (padrão: "operator"). */
  fieldName?: string;
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

function findOperatorInElement(
  node: CanonicalXMLNode,
  attributeName: string,
): string | null | undefined {
  const attr = node.attributes?.find(
    (a) => a.localName === attributeName || a.name === attributeName,
  );
  if (attr) return attr.value;

  for (const child of node.children ?? []) {
    if (
      child.nodeType === "element" &&
      (child.localName === attributeName || child.name === attributeName)
    ) {
      const value = getTextContent(child);
      return value === "" ? undefined : value;
    }
  }

  return undefined;
}

/**
 * Valida identificador de operador no documento canônico.
 */
export function validateOperator(
  document: CanonicalXMLDocument,
  options: OperatorValidatorOptions,
): CanonicalOperatorValidationResult {
  const { operatorId, rootElementName, fieldName = "operator" } = options;
  const statistics = computeStatistics();
  const issues: CanonicalValidationIssue[] = [];
  const root = document.rootNode;

  if (rootElementName && root?.localName !== rootElementName && root?.name !== rootElementName) {
    issues.push(
      createIssue(
        "XML_OPERATOR_RUNTIME_ROOT_MISMATCH",
        `Root element expected '${rootElementName}', found '${root?.localName ?? root?.name ?? "(none)"}'.`,
        "/",
      ),
    );
  }

  if (!root) {
    issues.push(createIssue("XML_OPERATOR_RUNTIME_NO_ROOT", "Document has no root element.", "/"));
  } else {
    const found = findOperatorInElement(root, fieldName);
    if (found === undefined) {
      issues.push(
        createIssue(
          "XML_OPERATOR_RUNTIME_FIELD_MISSING",
          `Operator field '${fieldName}' not found in root element.`,
          `/${fieldName}`,
        ),
      );
    } else if (found !== operatorId) {
      issues.push(
        createIssue(
          "XML_OPERATOR_RUNTIME_MISMATCH",
          `Operator id mismatch: expected '${operatorId}', found '${found}'.`,
          `/${fieldName}`,
        ),
      );
    }
  }

  statistics.issueCount = issues.length;
  statistics.errorCount = issues.length;

  const context = createEmptyOperatorValidationContext({
    document,
    operatorId,
    fieldName,
    issues,
    statistics,
    validationWarnings: [],
  });

  const valid = issues.length === 0;

  return {
    kind: "canonical-operator-validation-result",
    ok: true,
    valid,
    document,
    operatorId,
    fieldName,
    context,
    issues,
    statistics,
    code: valid ? "XML_OPERATOR_RUNTIME_OK" : "XML_OPERATOR_RUNTIME_MISMATCH",
    message: valid
      ? "Operator identifier validated successfully."
      : `Operator validation failed: ${issues.map((i) => i.message).join("; ")}`,
  };
}

/**
 * Validador de operador stateless para o XML Validation Runtime.
 */
export class OperatorValidator {
  validate(
    document: CanonicalXMLDocument,
    options: OperatorValidatorOptions,
  ): CanonicalOperatorValidationResult {
    return validateOperator(document, options);
  }
}
