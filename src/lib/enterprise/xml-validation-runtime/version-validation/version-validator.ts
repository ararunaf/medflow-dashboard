/**
 * VersionValidator — D-05 Enterprise XML Validation Runtime Functional Foundation.
 *
 * Capability única: validação de atributo/elemento de versão sobre CanonicalXMLDocument (D-01).
 *
 * Sem XPath. Sem Transformation. Sem SOAP. Sem TISS. Sem Operadoras.
 * Sem Auto Repair. Sem Workflow. Sem Persistência.
 */
import type { CanonicalXMLDocument, CanonicalXMLNode } from "../../xml-runtime/parser/canonical";
import type {
  CanonicalVersionValidationContext,
  CanonicalVersionValidationResult,
} from "./canonical";
import { createEmptyVersionValidationContext } from "./canonical";
import type {
  CanonicalValidationIssue,
  CanonicalValidationStatistics,
} from "../xsd-validation/canonical";

export type VersionValidatorOptions = {
  /** Valor de versão esperado. */
  versionId: string;
  /** Nome do atributo (default: "version"). */
  attributeName?: string;
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

function findVersionInElement(
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

function findVersionInDocument(
  document: CanonicalXMLDocument,
  attributeName: string,
): string | null | undefined {
  if (document.rootNode) {
    const found = findVersionInElement(document.rootNode, attributeName);
    if (found !== undefined) return found;
  }
  if (document.body && document.body !== document.rootNode) {
    const found = findVersionInElement(document.body, attributeName);
    if (found !== undefined) return found;
  }
  if (document.structuralHeaderNode) {
    const found = findVersionInElement(document.structuralHeaderNode, attributeName);
    if (found !== undefined) return found;
  }
  return undefined;
}

/**
 * Valida se um documento canônico declara a versão esperada.
 */
export function validateVersion(
  document: CanonicalXMLDocument,
  options: VersionValidatorOptions,
): CanonicalVersionValidationResult {
  const { versionId, attributeName = "version", rootElementName } = options;
  const issues: CanonicalValidationIssue[] = [];
  const statistics = computeStatistics();
  const root = document.rootNode;

  if (rootElementName && root?.localName !== rootElementName && root?.name !== rootElementName) {
    issues.push(
      createIssue(
        "XML_VERSION_RUNTIME_ROOT_MISMATCH",
        `Root element expected '${rootElementName}', found '${root?.localName ?? root?.name ?? "(none)"}'.`,
        "/",
      ),
    );
  }

  const foundVersion = findVersionInDocument(document, attributeName);
  let matched = false;

  if (foundVersion === undefined) {
    issues.push(
      createIssue(
        "XML_VERSION_RUNTIME_VERSION_NOT_FOUND",
        `Version attribute/element '${attributeName}' was not found in the document.`,
        "/",
      ),
    );
  } else if (foundVersion !== versionId) {
    issues.push(
      createIssue(
        "XML_VERSION_RUNTIME_VERSION_MISMATCH",
        `Expected version '${versionId}', found '${foundVersion}' in '${attributeName}'.`,
        "/",
      ),
    );
  } else {
    matched = true;
  }

  statistics.issueCount = issues.length;
  statistics.errorCount = issues.length;

  const context = createEmptyVersionValidationContext({
    document,
    versionId,
    attributeName,
    foundVersion: foundVersion ?? null,
    matched,
    issues,
    statistics,
    validationWarnings: [],
  });

  const valid = issues.length === 0 && matched;

  return {
    kind: "canonical-version-validation-result",
    ok: true,
    valid,
    document,
    versionId,
    attributeName,
    foundVersion: foundVersion ?? null,
    matched,
    context,
    issues,
    statistics,
    code: valid ? "XML_VERSION_RUNTIME_OK" : "XML_VERSION_RUNTIME_VIOLATION",
    message: valid
      ? `Version '${versionId}' validated successfully.`
      : `Version '${versionId}' validation failed: ${issues.map((i) => i.message).join("; ")}`,
  };
}

/**
 * Validador de versão stateless para o XML Validation Runtime.
 */
export class VersionValidator {
  validate(
    document: CanonicalXMLDocument,
    options: VersionValidatorOptions,
  ): CanonicalVersionValidationResult {
    return validateVersion(document, options);
  }
}
