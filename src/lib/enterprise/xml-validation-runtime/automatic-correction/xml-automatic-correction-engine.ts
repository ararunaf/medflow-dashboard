/**
 * XMLAutomaticCorrector — D-09 Enterprise XML Validation Runtime Functional Foundation.
 *
 * Capability única: correções automáticas genéricas em CanonicalXMLDocument (D-01).
 *
 * Sem TISS. Sem ANS. Sem Operadoras. Sem Workflow. Sem correções específicas de negócio.
 */
import type {
  CanonicalXMLAttribute,
  CanonicalXMLDocument,
  CanonicalXMLNode,
} from "../../xml-runtime/parser/canonical";
import type {
  CanonicalXMLAutomaticCorrectionContext,
  CanonicalXMLAutomaticCorrectionResult,
  XMLAutomaticCorrectionAction,
  XMLAutomaticCorrectionRule,
} from "./canonical";
import { createEmptyXMLAutomaticCorrectionContext } from "./canonical";

export type XMLAutomaticCorrectorOptions = {
  /** Regras de correção a serem aplicadas. */
  rules: readonly XMLAutomaticCorrectionRule[];
};

function cloneDocument(document: CanonicalXMLDocument): CanonicalXMLDocument {
  return structuredClone(document) as CanonicalXMLDocument;
}

function applyRule(
  document: CanonicalXMLDocument,
  rule: XMLAutomaticCorrectionRule,
): { document: CanonicalXMLDocument; action: XMLAutomaticCorrectionAction } {
  const target = rule.target === "root" ? document.rootNode : undefined;
  if (!target) {
    return {
      document,
      action: {
        kind: "xml-automatic-correction-action",
        rule,
        applied: false,
        message: `Target '${rule.target}' not found.`,
      },
    };
  }

  if (rule.kind === "set-attribute") {
    const attrs = (target.attributes ?? []) as CanonicalXMLAttribute[];
    const existingIndex = attrs.findIndex(
      (a) => a.localName === rule.attribute || a.name === rule.attribute,
    );
    if (existingIndex >= 0) {
      attrs[existingIndex] = {
        kind: "canonical-xml-attribute",
        name: rule.attribute,
        localName: rule.attribute,
        value: rule.value,
      };
      target.attributes = attrs;
      return {
        document,
        action: {
          kind: "xml-automatic-correction-action",
          rule,
          applied: true,
          message: `Updated attribute '${rule.attribute}' to '${rule.value}'.`,
        },
      };
    }
    attrs.push({
      kind: "canonical-xml-attribute",
      name: rule.attribute,
      localName: rule.attribute,
      value: rule.value,
    });
    target.attributes = attrs;
    return {
      document,
      action: {
        kind: "xml-automatic-correction-action",
        rule,
        applied: true,
        message: `Added attribute '${rule.attribute}' = '${rule.value}'.`,
      },
    };
  }

  if (rule.kind === "set-child") {
    const children = (target.children ?? []) as CanonicalXMLNode[];
    const existingIndex = children.findIndex(
      (child) =>
        child.nodeType === "element" &&
        (child.localName === rule.child || child.name === rule.child),
    );
    const node: CanonicalXMLNode = {
      kind: "canonical-xml-node",
      name: rule.child,
      localName: rule.child,
      nodeType: "element",
      textContent: rule.value,
      children: [
        {
          kind: "canonical-xml-node",
          name: "#text",
          localName: "#text",
          nodeType: "text",
          textContent: rule.value,
        },
      ] as CanonicalXMLNode[],
    };
    if (existingIndex >= 0) {
      children[existingIndex] = node;
    } else {
      children.push(node);
    }
    target.children = children;
    return {
      document,
      action: {
        kind: "xml-automatic-correction-action",
        rule,
        applied: true,
        message:
          existingIndex >= 0
            ? `Updated child element '${rule.child}' to '${rule.value}'.`
            : `Added child element '${rule.child}' = '${rule.value}'.`,
      },
    };
  }

  if (rule.kind === "remove-attribute") {
    const before = (target.attributes ?? []).length;
    const next = ((target.attributes ?? []) as CanonicalXMLAttribute[]).filter(
      (a) => a.localName !== rule.attribute && a.name !== rule.attribute,
    );
    target.attributes = next;
    const removed = before !== next.length;
    return {
      document,
      action: {
        kind: "xml-automatic-correction-action",
        rule,
        applied: removed,
        message: removed
          ? `Removed attribute '${rule.attribute}'.`
          : `Attribute '${rule.attribute}' not found.`,
      },
    };
  }

  return {
    document,
    action: {
      kind: "xml-automatic-correction-action",
      rule,
      applied: false,
      message: "Unknown correction rule kind.",
    },
  };
}

/**
 * Aplica regras de correção automática genéricas sobre o documento canônico.
 */
export function correctXML(
  document: CanonicalXMLDocument,
  options: XMLAutomaticCorrectorOptions,
): CanonicalXMLAutomaticCorrectionResult {
  const { rules } = options;
  let working = cloneDocument(document);
  const actions: XMLAutomaticCorrectionAction[] = [];

  for (const rule of rules) {
    const { document: nextDocument, action } = applyRule(working, rule);
    working = nextDocument;
    actions.push(action);
  }

  const corrected = actions.some((a) => a.applied);
  const context = createEmptyXMLAutomaticCorrectionContext({
    document: working,
    rules,
    actions,
    validationWarnings: [],
  });

  return {
    kind: "canonical-xml-automatic-correction-result",
    ok: true,
    document: working,
    rules,
    actions,
    corrected,
    context,
    code: corrected
      ? "XML_AUTOMATIC_CORRECTION_RUNTIME_APPLIED"
      : "XML_AUTOMATIC_CORRECTION_RUNTIME_NO_CHANGES",
    message: corrected
      ? `Automatic correction applied: ${actions.filter((a) => a.applied).length} rule(s) executed.`
      : "Automatic correction completed with no changes.",
  };
}

/**
 * Corretor automático stateless para o XML Validation Runtime.
 */
export class XMLAutomaticCorrector {
  correct(
    document: CanonicalXMLDocument,
    options: XMLAutomaticCorrectorOptions,
  ): CanonicalXMLAutomaticCorrectionResult {
    return correctXML(document, options);
  }
}
