/**
 * NamespaceValidator — D-04 Enterprise XML Validation Runtime Functional Foundation.
 *
 * Capability única: validação de namespace XML sobre CanonicalXMLDocument (D-01).
 *
 * Sem XPath. Sem Transformation. Sem SOAP. Sem TISS. Sem Operadoras.
 * Sem Auto Repair. Sem Workflow. Sem Persistência.
 */
import type { CanonicalXMLDocument, CanonicalXMLNode } from "../../xml-runtime/parser/canonical";
import type {
  CanonicalNamespaceValidationContext,
  CanonicalNamespaceValidationResult,
} from "./canonical";
import { createEmptyNamespaceValidationContext } from "./canonical";
import type {
  CanonicalValidationIssue,
  CanonicalValidationStatistics,
} from "../xsd-validation/canonical";

export type NamespaceValidatorOptions = {
  /** URI do namespace esperada. */
  namespaceUri: string;
  /** Prefixo esperado. Se omitido, qualquer prefixo que mapeie para a URI é aceito. */
  prefix?: string;
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

function namespaceDeclarations(document: CanonicalXMLDocument): Readonly<Record<string, string>> {
  return document.namespaces ?? {};
}

function collectAllNodes(node: CanonicalXMLNode): CanonicalXMLNode[] {
  const out: CanonicalXMLNode[] = [node];
  for (const child of node.children ?? []) {
    if (child.nodeType === "element") {
      out.push(...collectAllNodes(child));
    } else {
      out.push(child);
    }
  }
  return out;
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

/**
 * Valida se um documento canônico declara e utiliza o namespace requisitado.
 */
export function validateNamespace(
  document: CanonicalXMLDocument,
  options: NamespaceValidatorOptions,
): CanonicalNamespaceValidationResult {
  const { namespaceUri, prefix, rootElementName } = options;
  const issues: CanonicalValidationIssue[] = [];
  const declarations = namespaceDeclarations(document);
  let matched = false;
  let matchedPrefix: string | null = null;
  const statistics = computeStatistics();

  const root = document.rootNode;

  if (rootElementName && root?.localName !== rootElementName && root?.name !== rootElementName) {
    issues.push(
      createIssue(
        "XML_NAMESPACE_RUNTIME_ROOT_MISMATCH",
        `Root element expected '${rootElementName}', found '${root?.localName ?? root?.name ?? "(none)"}'.`,
        "/",
      ),
    );
  }

  if (prefix != null) {
    const declaredUri = declarations[prefix];
    if (declaredUri == null) {
      issues.push(
        createIssue(
          "XML_NAMESPACE_RUNTIME_PREFIX_NOT_DECLARED",
          `Namespace prefix '${prefix}' is not declared in the document.`,
          "/",
        ),
      );
    } else if (declaredUri !== namespaceUri) {
      issues.push(
        createIssue(
          "XML_NAMESPACE_RUNTIME_PREFIX_URI_MISMATCH",
          `Prefix '${prefix}' maps to '${declaredUri}', expected '${namespaceUri}'.`,
          "/",
        ),
      );
    } else {
      matched = true;
      matchedPrefix = prefix;
    }
  } else {
    for (const [declaredPrefix, declaredUri] of Object.entries(declarations)) {
      if (declaredUri === namespaceUri) {
        matched = true;
        matchedPrefix = declaredPrefix === "" ? null : declaredPrefix;
        break;
      }
    }

    if (!matched && root) {
      const allNodes = collectAllNodes(root);
      if (allNodes.some((node) => node.namespaceUri === namespaceUri)) {
        matched = true;
      }
    }

    if (!matched) {
      issues.push(
        createIssue(
          "XML_NAMESPACE_RUNTIME_URI_NOT_FOUND",
          `Namespace URI '${namespaceUri}' was not found in any declaration or element.`,
          "/",
        ),
      );
    }
  }

  statistics.issueCount = issues.length;
  statistics.errorCount = issues.length;

  const context = createEmptyNamespaceValidationContext({
    document,
    namespaceUri,
    prefix: prefix ?? null,
    matched,
    matchedPrefix,
    issues,
    statistics,
    validationWarnings: [],
  });

  const valid = issues.length === 0 && matched;

  return {
    kind: "canonical-namespace-validation-result",
    ok: true,
    valid,
    document,
    namespaceUri,
    prefix: prefix ?? null,
    matched,
    matchedPrefix,
    context,
    issues,
    statistics,
    code: valid ? "XML_NAMESPACE_RUNTIME_OK" : "XML_NAMESPACE_RUNTIME_VIOLATION",
    message: valid
      ? `Namespace '${namespaceUri}' validated successfully.`
      : `Namespace '${namespaceUri}' validation failed: ${issues.map((i) => i.message).join("; ")}`,
  };
}

/**
 * Validador de namespace stateless para o XML Validation Runtime.
 */
export class NamespaceValidator {
  validate(
    document: CanonicalXMLDocument,
    options: NamespaceValidatorOptions,
  ): CanonicalNamespaceValidationResult {
    return validateNamespace(document, options);
  }
}
