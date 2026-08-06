/**
 * XMLRepairEngine — D-08 Enterprise XML Validation Runtime Functional Foundation.
 *
 * Capability única: reparos genéricos em CanonicalXMLDocument (D-01).
 *
 * Sem TISS. Sem ANS. Sem Operadoras. Sem Workflow. Sem correções específicas de negócio.
 */
import type {
  CanonicalXMLAttribute,
  CanonicalXMLDocument,
  CanonicalXMLNode,
} from "../../xml-runtime/parser/canonical";
import type {
  CanonicalXMLRepairContext,
  CanonicalXMLRepairResult,
  XMLRepairAction,
  XMLRepairRule,
} from "./canonical";
import { createEmptyXMLRepairContext } from "./canonical";

export type XMLRepairEngineOptions = {
  /** Regras de reparo a serem aplicadas. */
  rules: readonly XMLRepairRule[];
};

function cloneDocument(document: CanonicalXMLDocument): CanonicalXMLDocument {
  return structuredClone(document) as CanonicalXMLDocument;
}

function applyRule(
  document: CanonicalXMLDocument,
  rule: XMLRepairRule,
): { document: CanonicalXMLDocument; action: XMLRepairAction } {
  const target = rule.target === "root" ? document.rootNode : undefined;
  if (!target) {
    return {
      document,
      action: {
        kind: "xml-repair-action",
        rule,
        applied: false,
        message: `Target '${rule.target}' not found.`,
      },
    };
  }

  if (rule.kind === "add-missing-attribute") {
    const attrs = (target.attributes ?? []) as CanonicalXMLAttribute[];
    const exists = attrs.some((a) => a.localName === rule.attribute || a.name === rule.attribute);
    if (!exists) {
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
          kind: "xml-repair-action",
          rule,
          applied: true,
          message: `Added missing attribute '${rule.attribute}' = '${rule.value}'.`,
        },
      };
    }
    return {
      document,
      action: {
        kind: "xml-repair-action",
        rule,
        applied: false,
        message: `Attribute '${rule.attribute}' already exists.`,
      },
    };
  }

  if (rule.kind === "add-missing-child") {
    const children = (target.children ?? []) as CanonicalXMLNode[];
    const exists = children.some(
      (child) =>
        child.nodeType === "element" &&
        (child.localName === rule.child || child.name === rule.child),
    );
    if (!exists) {
      children.push({
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
      });
      target.children = children;
      return {
        document,
        action: {
          kind: "xml-repair-action",
          rule,
          applied: true,
          message: `Added missing child element '${rule.child}' = '${rule.value}'.`,
        },
      };
    }
    return {
      document,
      action: {
        kind: "xml-repair-action",
        rule,
        applied: false,
        message: `Child element '${rule.child}' already exists.`,
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
        kind: "xml-repair-action",
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
      kind: "xml-repair-action",
      rule,
      applied: false,
      message: "Unknown repair rule kind.",
    },
  };
}

/**
 * Aplica regras de reparo genéricas sobre o documento canônico.
 */
export function repairXML(
  document: CanonicalXMLDocument,
  options: XMLRepairEngineOptions,
): CanonicalXMLRepairResult {
  const { rules } = options;
  let working = cloneDocument(document);
  const actions: XMLRepairAction[] = [];

  for (const rule of rules) {
    const { document: nextDocument, action } = applyRule(working, rule);
    working = nextDocument;
    actions.push(action);
  }

  const repaired = actions.some((a) => a.applied);
  const context = createEmptyXMLRepairContext({
    document: working,
    rules,
    actions,
    validationWarnings: [],
  });

  return {
    kind: "canonical-xml-repair-result",
    ok: true,
    document: working,
    rules,
    actions,
    repaired,
    context,
    code: repaired ? "XML_REPAIR_RUNTIME_APPLIED" : "XML_REPAIR_RUNTIME_NO_CHANGES",
    message: repaired
      ? `XML repair applied: ${actions.filter((a) => a.applied).length} rule(s) executed.`
      : "XML repair completed with no changes.",
  };
}

/**
 * Motor de reparo XML stateless para o XML Validation Runtime.
 */
export class XMLRepairEngine {
  repair(
    document: CanonicalXMLDocument,
    options: XMLRepairEngineOptions,
  ): CanonicalXMLRepairResult {
    return repairXML(document, options);
  }
}
