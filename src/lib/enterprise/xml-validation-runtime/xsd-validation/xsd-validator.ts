/**
 * XSDValidator — D-02 Enterprise XML Validation Runtime Functional Foundation.
 *
 * Capability única: validação XSD genérica sobre CanonicalXMLDocument (D-01).
 *
 * Subconjunto funcional de XSD 1.0:
 * - xs:schema / xs:element / xs:complexType / xs:simpleType
 * - xs:sequence / xs:choice / xs:all
 * - xs:attribute (use=required|optional)
 * - tipos simples: string, integer, int, long, decimal, boolean, date, dateTime, double, float
 * - minOccurs / maxOccurs (incluindo unbounded)
 * - element ref= / type=
 *
 * Sem XPath. Sem Transformation. Sem SOAP. Sem TISS. Sem Operadoras.
 * Sem Auto Repair. Sem Workflow. Sem Persistência.
 */
import { XMLParser } from "../../xml-runtime/parser/xml-parser";
import type { CanonicalXMLDocument, CanonicalXMLNode } from "../../xml-runtime/parser/canonical";
import {
  createEmptyXMLValidationRuntimeContext,
  type CanonicalValidationIssue,
  type CanonicalValidationStatistics,
  type CanonicalXSDValidationResult,
  type XMLValidationRuntimeContext,
} from "./canonical";

const XSD_NS = "http://www.w3.org/2001/XMLSchema";

export type XSDValidatorOptions = {
  /** Nome do elemento raiz esperado (localName). Default: primeiro elemento global do schema. */
  rootElementName?: string;
};

type AttributeDecl = {
  name: string;
  type?: string;
  use: "required" | "optional" | "prohibited";
};

type Particle =
  | {
      kind: "element";
      name: string;
      typeName?: string;
      inlineType?: TypeDecl;
      minOccurs: number;
      maxOccurs: number;
    }
  | {
      kind: "sequence" | "choice" | "all";
      particles: Particle[];
      minOccurs: number;
      maxOccurs: number;
    };

type TypeDecl =
  | { kind: "simple"; name?: string; base: string }
  | {
      kind: "complex";
      name?: string;
      attributes: AttributeDecl[];
      content?: Particle | null;
      mixed?: boolean;
    };

type ElementDecl = {
  name: string;
  typeName?: string;
  inlineType?: TypeDecl;
};

type CompiledSchema = {
  schemaDocument: CanonicalXMLDocument;
  elements: Map<string, ElementDecl>;
  types: Map<string, TypeDecl>;
  targetNamespace?: string | null;
};

function isXsdNode(node: CanonicalXMLNode | null | undefined): boolean {
  if (!node || node.nodeType !== "element") return false;
  if (node.namespaceUri === XSD_NS) return true;
  const prefix = node.prefix?.toLowerCase();
  const name = node.name?.toLowerCase() ?? "";
  if (prefix === "xs" || prefix === "xsd") return true;
  if (
    !prefix &&
    /^(schema|element|complexType|simpleType|sequence|choice|all|attribute|restriction|extension)$/i.test(
      node.localName ?? "",
    )
  ) {
    return true;
  }
  return /^(xs|xsd):/i.test(name);
}

function localOf(node: CanonicalXMLNode): string {
  return (node.localName ?? node.name ?? "").replace(/^(xs|xsd):/i, "");
}

function attrValue(node: CanonicalXMLNode, name: string): string | undefined {
  const found = node.attributes?.find(
    (a) => a.localName === name || a.name === name || a.name.endsWith(`:${name}`),
  );
  return found?.value;
}

function parseOccurs(raw: string | undefined, fallback: number): number {
  if (raw == null || raw === "") return fallback;
  if (raw === "unbounded") return Number.POSITIVE_INFINITY;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function elementChildren(node: CanonicalXMLNode): CanonicalXMLNode[] {
  return (node.children ?? []).filter((c) => c.nodeType === "element");
}

function textOf(node: CanonicalXMLNode): string {
  if (node.textContent) return node.textContent.trim();
  const parts: string[] = [];
  for (const child of node.children ?? []) {
    if (child.nodeType === "text" || child.nodeType === "cdata") {
      parts.push(child.textContent ?? "");
    } else if (child.nodeType === "element") {
      parts.push(textOf(child));
    }
  }
  return parts.join("").trim();
}

function countTree(node: CanonicalXMLNode | null | undefined): {
  elements: number;
  attributes: number;
} {
  if (!node) return { elements: 0, attributes: 0 };
  let elements = node.nodeType === "element" ? 1 : 0;
  let attributes = node.attributes?.length ?? 0;
  for (const child of node.children ?? []) {
    const sub = countTree(child);
    elements += sub.elements;
    attributes += sub.attributes;
  }
  return { elements, attributes };
}

function issue(
  code: string,
  message: string,
  severity: CanonicalValidationIssue["severity"] = "error",
  path?: string,
): CanonicalValidationIssue {
  return {
    kind: "canonical-validation-issue",
    code,
    message,
    severity,
    path,
  };
}

function qnameLocal(qname: string | undefined): string | undefined {
  if (!qname) return undefined;
  const idx = qname.indexOf(":");
  return idx >= 0 ? qname.slice(idx + 1) : qname;
}

function compileParticle(node: CanonicalXMLNode): Particle | null {
  const local = localOf(node);
  const minOccurs = parseOccurs(attrValue(node, "minOccurs"), 1);
  const maxOccurs = parseOccurs(attrValue(node, "maxOccurs"), 1);

  if (local === "element") {
    const name = attrValue(node, "name") ?? qnameLocal(attrValue(node, "ref"));
    if (!name) return null;
    const typeName = qnameLocal(attrValue(node, "type"));
    let inlineType: TypeDecl | undefined;
    for (const child of elementChildren(node)) {
      const cl = localOf(child);
      if (cl === "complexType" || cl === "simpleType") {
        inlineType = compileType(child, undefined);
      }
    }
    return { kind: "element", name, typeName, inlineType, minOccurs, maxOccurs };
  }

  if (local === "sequence" || local === "choice" || local === "all") {
    const particles: Particle[] = [];
    for (const child of elementChildren(node)) {
      const p = compileParticle(child);
      if (p) particles.push(p);
    }
    return { kind: local, particles, minOccurs, maxOccurs };
  }

  return null;
}

function compileType(node: CanonicalXMLNode, name: string | undefined): TypeDecl {
  const local = localOf(node);
  if (local === "simpleType") {
    let base = "string";
    for (const child of elementChildren(node)) {
      if (localOf(child) === "restriction") {
        base = qnameLocal(attrValue(child, "base")) ?? "string";
      }
    }
    return { kind: "simple", name, base };
  }

  const attributes: AttributeDecl[] = [];
  let content: Particle | null = null;

  for (const child of elementChildren(node)) {
    const cl = localOf(child);
    if (cl === "attribute") {
      const an = attrValue(child, "name") ?? qnameLocal(attrValue(child, "ref"));
      if (!an) continue;
      const useRaw = attrValue(child, "use") ?? "optional";
      const use = useRaw === "required" || useRaw === "prohibited" ? useRaw : "optional";
      attributes.push({
        name: an,
        type: qnameLocal(attrValue(child, "type")),
        use,
      });
    } else if (cl === "sequence" || cl === "choice" || cl === "all") {
      content = compileParticle(child);
    } else if (cl === "complexContent" || cl === "simpleContent") {
      for (const grand of elementChildren(child)) {
        const gl = localOf(grand);
        if (gl === "extension" || gl === "restriction") {
          const base = qnameLocal(attrValue(grand, "base"));
          for (const g2 of elementChildren(grand)) {
            const g2l = localOf(g2);
            if (g2l === "attribute") {
              const an = attrValue(g2, "name") ?? qnameLocal(attrValue(g2, "ref"));
              if (!an) continue;
              const useRaw = attrValue(g2, "use") ?? "optional";
              const use = useRaw === "required" || useRaw === "prohibited" ? useRaw : "optional";
              attributes.push({ name: an, type: qnameLocal(attrValue(g2, "type")), use });
            } else if (g2l === "sequence" || g2l === "choice" || g2l === "all") {
              content = compileParticle(g2);
            }
          }
          if (cl === "simpleContent" && base) {
            return { kind: "simple", name, base };
          }
        }
      }
    } else if (cl === "simpleType") {
      return compileType(child, name);
    }
  }

  if (!content && attributes.length === 0 && local === "complexType") {
    // empty complex type
  }

  return { kind: "complex", name, attributes, content, mixed: false };
}

function compileSchema(
  schemaDocument: CanonicalXMLDocument,
): CompiledSchema | { error: CanonicalValidationIssue } {
  const root = schemaDocument.rootNode;
  if (!root || !isXsdNode(root) || localOf(root) !== "schema") {
    return {
      error: issue(
        "XSD_SCHEMA_ROOT_INVALID",
        "XSD must have xs:schema as root element.",
        "error",
        "/",
      ),
    };
  }

  const elements = new Map<string, ElementDecl>();
  const types = new Map<string, TypeDecl>();
  const targetNamespace = attrValue(root, "targetNamespace") ?? null;

  for (const child of elementChildren(root)) {
    if (!isXsdNode(child)) continue;
    const local = localOf(child);
    if (local === "element") {
      const name = attrValue(child, "name");
      if (!name) continue;
      const typeName = qnameLocal(attrValue(child, "type"));
      let inlineType: TypeDecl | undefined;
      for (const nested of elementChildren(child)) {
        const nl = localOf(nested);
        if (nl === "complexType" || nl === "simpleType") {
          inlineType = compileType(nested, undefined);
        }
      }
      elements.set(name, { name, typeName, inlineType });
    } else if (local === "complexType" || local === "simpleType") {
      const name = attrValue(child, "name");
      if (!name) continue;
      types.set(name, compileType(child, name));
    }
  }

  if (elements.size === 0) {
    return {
      error: issue(
        "XSD_NO_GLOBAL_ELEMENTS",
        "XSD schema declares no global elements.",
        "error",
        "/schema",
      ),
    };
  }

  return { schemaDocument, elements, types, targetNamespace };
}

function resolveType(
  schema: CompiledSchema,
  decl: ElementDecl | { typeName?: string; inlineType?: TypeDecl },
): TypeDecl | null {
  if (decl.inlineType) return decl.inlineType;
  if (decl.typeName) {
    const builtin = builtinSimple(decl.typeName);
    if (builtin) return builtin;
    return schema.types.get(decl.typeName) ?? null;
  }
  return { kind: "complex", attributes: [], content: null };
}

function builtinSimple(name: string): TypeDecl | null {
  const builtins = new Set([
    "string",
    "normalizedString",
    "token",
    "integer",
    "int",
    "long",
    "short",
    "byte",
    "decimal",
    "double",
    "float",
    "boolean",
    "date",
    "dateTime",
    "time",
    "anyURI",
    "base64Binary",
    "hexBinary",
  ]);
  return builtins.has(name) ? { kind: "simple", base: name } : null;
}

function validateSimpleValue(
  value: string,
  base: string,
  path: string,
  issues: CanonicalValidationIssue[],
): void {
  const b = base.replace(/^xsd?:/i, "");
  if (
    b === "string" ||
    b === "normalizedString" ||
    b === "token" ||
    b === "anyURI" ||
    b === "base64Binary" ||
    b === "hexBinary"
  ) {
    return;
  }
  if (b === "boolean") {
    if (!/^(true|false|0|1)$/.test(value)) {
      issues.push(
        issue("XSD_TYPE_BOOLEAN", `Value "${value}" is not a valid boolean.`, "error", path),
      );
    }
    return;
  }
  if (b === "integer" || b === "int" || b === "long" || b === "short" || b === "byte") {
    if (!/^[+-]?\d+$/.test(value)) {
      issues.push(
        issue("XSD_TYPE_INTEGER", `Value "${value}" is not a valid integer.`, "error", path),
      );
    }
    return;
  }
  if (b === "decimal" || b === "double" || b === "float") {
    if (!/^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/.test(value)) {
      issues.push(
        issue("XSD_TYPE_DECIMAL", `Value "${value}" is not a valid decimal.`, "error", path),
      );
    }
    return;
  }
  if (b === "date") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      issues.push(
        issue("XSD_TYPE_DATE", `Value "${value}" is not a valid date (YYYY-MM-DD).`, "error", path),
      );
    }
    return;
  }
  if (b === "dateTime") {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/.test(value)) {
      issues.push(
        issue("XSD_TYPE_DATETIME", `Value "${value}" is not a valid dateTime.`, "error", path),
      );
    }
    return;
  }
  if (b === "time") {
    if (!/^\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/.test(value)) {
      issues.push(issue("XSD_TYPE_TIME", `Value "${value}" is not a valid time.`, "error", path));
    }
  }
}

function matchParticle(
  particle: Particle,
  children: CanonicalXMLNode[],
  start: number,
  schema: CompiledSchema,
  path: string,
  issues: CanonicalValidationIssue[],
): number {
  if (particle.kind === "element") {
    let matched = 0;
    let idx = start;
    while (matched < particle.maxOccurs && idx < children.length) {
      const child = children[idx]!;
      if ((child.localName ?? child.name) !== particle.name) break;
      const decl: ElementDecl = {
        name: particle.name,
        typeName: particle.typeName,
        inlineType: particle.inlineType,
      };
      validateElement(child, decl, schema, `${path}/${particle.name}[${matched}]`, issues);
      matched += 1;
      idx += 1;
    }
    if (matched < particle.minOccurs) {
      issues.push(
        issue(
          "XSD_ELEMENT_MIN_OCCURS",
          `Element "${particle.name}" occurs ${matched} time(s); minOccurs=${particle.minOccurs}.`,
          "error",
          path,
        ),
      );
    }
    return idx;
  }

  if (particle.kind === "sequence") {
    let matchedGroups = 0;
    let idx = start;
    while (matchedGroups < particle.maxOccurs) {
      const groupStart = idx;
      let cursor = idx;
      let ok = true;
      const snapshot = issues.length;
      for (const part of particle.particles) {
        const before = cursor;
        cursor = matchParticle(part, children, cursor, schema, path, issues);
        if (part.kind === "element" && part.minOccurs > 0 && cursor === before) {
          ok = false;
          break;
        }
      }
      if (!ok && matchedGroups >= particle.minOccurs) {
        issues.splice(snapshot);
        break;
      }
      if (!ok) {
        break;
      }
      if (cursor === groupStart && particle.particles.length > 0) {
        matchedGroups += 1;
        break;
      }
      matchedGroups += 1;
      idx = cursor;
      if (particle.particles.length === 0) break;
    }
    if (matchedGroups < particle.minOccurs) {
      issues.push(
        issue(
          "XSD_SEQUENCE_MIN_OCCURS",
          `Sequence occurs ${matchedGroups} time(s); minOccurs=${particle.minOccurs}.`,
          "error",
          path,
        ),
      );
    }
    return idx;
  }

  if (particle.kind === "choice") {
    let matchedGroups = 0;
    let idx = start;
    while (matchedGroups < particle.maxOccurs) {
      let advanced = false;
      for (const part of particle.particles) {
        const before = idx;
        const snapshot = issues.length;
        const next = matchParticle(part, children, idx, schema, path, issues);
        if (next > before) {
          // drop speculative errors from non-matching alternatives already applied —
          // only keep if this branch advanced
          idx = next;
          advanced = true;
          break;
        }
        issues.splice(snapshot);
      }
      if (!advanced) break;
      matchedGroups += 1;
    }
    if (matchedGroups < particle.minOccurs) {
      issues.push(
        issue(
          "XSD_CHOICE_MIN_OCCURS",
          `Choice occurs ${matchedGroups} time(s); minOccurs=${particle.minOccurs}.`,
          "error",
          path,
        ),
      );
    }
    return idx;
  }

  // all — treat like unordered set of required/optional elements (simplified)
  if (particle.kind === "all") {
    const remaining = children.slice(start);
    const used = new Set<number>();
    for (const part of particle.particles) {
      if (part.kind !== "element") continue;
      let count = 0;
      for (let i = 0; i < remaining.length; i += 1) {
        if (used.has(i)) continue;
        const child = remaining[i]!;
        if ((child.localName ?? child.name) === part.name) {
          used.add(i);
          validateElement(
            child,
            { name: part.name, typeName: part.typeName, inlineType: part.inlineType },
            schema,
            `${path}/${part.name}`,
            issues,
          );
          count += 1;
          if (count >= part.maxOccurs) break;
        }
      }
      if (count < part.minOccurs) {
        issues.push(
          issue(
            "XSD_ALL_MIN_OCCURS",
            `Element "${part.name}" in xs:all occurs ${count} time(s); minOccurs=${part.minOccurs}.`,
            "error",
            path,
          ),
        );
      }
    }
    for (let i = 0; i < remaining.length; i += 1) {
      if (!used.has(i)) {
        const child = remaining[i]!;
        issues.push(
          issue(
            "XSD_UNEXPECTED_ELEMENT",
            `Unexpected element "${child.localName ?? child.name}" in xs:all.`,
            "error",
            `${path}/${child.localName ?? child.name}`,
          ),
        );
      }
    }
    return children.length;
  }

  return start;
}

function validateAttributes(
  node: CanonicalXMLNode,
  type: TypeDecl,
  path: string,
  issues: CanonicalValidationIssue[],
): void {
  if (type.kind !== "complex") return;
  const present = new Map<string, string>();
  for (const attr of node.attributes ?? []) {
    if (attr.prefix === "xmlns" || attr.name === "xmlns" || attr.name.startsWith("xmlns:"))
      continue;
    present.set(attr.localName || attr.name, attr.value);
  }
  for (const decl of type.attributes) {
    const value = present.get(decl.name);
    if (decl.use === "required" && value == null) {
      issues.push(
        issue(
          "XSD_ATTRIBUTE_REQUIRED",
          `Required attribute "${decl.name}" is missing.`,
          "error",
          `${path}/@${decl.name}`,
        ),
      );
    }
    if (decl.use === "prohibited" && value != null) {
      issues.push(
        issue(
          "XSD_ATTRIBUTE_PROHIBITED",
          `Prohibited attribute "${decl.name}" is present.`,
          "error",
          `${path}/@${decl.name}`,
        ),
      );
    }
    if (value != null && decl.type) {
      const simple = builtinSimple(decl.type);
      if (simple && simple.kind === "simple") {
        validateSimpleValue(value, simple.base, `${path}/@${decl.name}`, issues);
      }
    }
    present.delete(decl.name);
  }
  for (const [name] of present) {
    issues.push(
      issue(
        "XSD_ATTRIBUTE_UNEXPECTED",
        `Unexpected attribute "${name}".`,
        "error",
        `${path}/@${name}`,
      ),
    );
  }
}

function validateElement(
  node: CanonicalXMLNode,
  decl: ElementDecl,
  schema: CompiledSchema,
  path: string,
  issues: CanonicalValidationIssue[],
): void {
  const type = resolveType(schema, decl);
  if (!type) {
    issues.push(
      issue(
        "XSD_TYPE_UNRESOLVED",
        `Type "${decl.typeName ?? "?"}" for element "${decl.name}" could not be resolved.`,
        "error",
        path,
      ),
    );
    return;
  }

  if (type.kind === "simple") {
    const value = textOf(node);
    const childElements = elementChildren(node);
    if (childElements.length > 0) {
      issues.push(
        issue(
          "XSD_SIMPLE_HAS_ELEMENTS",
          `Simple-typed element "${decl.name}" must not contain child elements.`,
          "error",
          path,
        ),
      );
    }
    validateSimpleValue(value, type.base, path, issues);
    return;
  }

  validateAttributes(node, type, path, issues);
  const children = elementChildren(node);
  if (!type.content) {
    if (children.length > 0) {
      issues.push(
        issue(
          "XSD_UNEXPECTED_ELEMENT",
          `Element "${decl.name}" must not contain child elements.`,
          "error",
          path,
        ),
      );
    }
    return;
  }

  const consumed = matchParticle(type.content, children, 0, schema, path, issues);
  for (let i = consumed; i < children.length; i += 1) {
    const child = children[i]!;
    issues.push(
      issue(
        "XSD_UNEXPECTED_ELEMENT",
        `Unexpected element "${child.localName ?? child.name}".`,
        "error",
        `${path}/${child.localName ?? child.name}`,
      ),
    );
  }
}

/**
 * Validador XSD funcional (D-02).
 * Consome CanonicalXMLDocument (D-01) + XSD (string ou documento parseado).
 */
export class XSDValidator {
  private readonly parser: XMLParser;

  constructor() {
    this.parser = new XMLParser();
  }

  validate(
    document: CanonicalXMLDocument,
    xsd: string | CanonicalXMLDocument,
    options: XSDValidatorOptions = {},
  ): CanonicalXSDValidationResult {
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const issues: CanonicalValidationIssue[] = [];
    const warnings: string[] = [];

    if (!document?.rootNode) {
      issues.push(
        issue("XSD_DOCUMENT_EMPTY", "CanonicalXMLDocument has no root node.", "error", "/"),
      );
      return this.finish(false, document, null, null, issues, warnings, started);
    }

    let schemaDocument: CanonicalXMLDocument | null = null;
    if (typeof xsd === "string") {
      const parsed = this.parser.parse(xsd);
      if (!parsed.ok || !parsed.document) {
        for (const err of parsed.errors) {
          issues.push(issue("XSD_SCHEMA_PARSE_ERROR", err.message, "error", undefined));
        }
        if (issues.length === 0) {
          issues.push(issue("XSD_SCHEMA_PARSE_ERROR", "Failed to parse XSD schema.", "error"));
        }
        return this.finish(false, document, null, null, issues, warnings, started);
      }
      schemaDocument = parsed.document;
    } else {
      schemaDocument = xsd;
    }

    const compiled = compileSchema(schemaDocument);
    if ("error" in compiled) {
      issues.push(compiled.error);
      return this.finish(false, document, schemaDocument, null, issues, warnings, started);
    }

    const rootName =
      options.rootElementName ??
      document.rootNode.localName ??
      document.rootNode.name ??
      [...compiled.elements.keys()][0];

    const rootDecl = rootName ? compiled.elements.get(rootName) : undefined;
    if (!rootDecl) {
      issues.push(
        issue(
          "XSD_ROOT_ELEMENT_UNKNOWN",
          `Root element "${rootName}" is not declared as a global element in the XSD.`,
          "error",
          `/${rootName}`,
        ),
      );
      return this.finish(false, document, schemaDocument, rootName, issues, warnings, started);
    }

    const actualRoot = document.rootNode.localName ?? document.rootNode.name;
    if (actualRoot !== rootDecl.name) {
      issues.push(
        issue(
          "XSD_ROOT_ELEMENT_MISMATCH",
          `Document root "${actualRoot}" does not match expected "${rootDecl.name}".`,
          "error",
          `/${actualRoot}`,
        ),
      );
    } else {
      validateElement(document.rootNode, rootDecl, compiled, `/${rootDecl.name}`, issues);
    }

    const valid = issues.every((i) => i.severity !== "error");
    return this.finish(
      valid,
      document,
      schemaDocument,
      rootDecl.name,
      issues,
      warnings,
      started,
      compiled,
    );
  }

  private finish(
    valid: boolean,
    document: CanonicalXMLDocument | null,
    schemaDocument: CanonicalXMLDocument | null,
    rootElementName: string | null | undefined,
    issues: CanonicalValidationIssue[],
    warnings: string[],
    started: number,
    compiled?: CompiledSchema,
  ): CanonicalXSDValidationResult {
    const ended = typeof performance !== "undefined" ? performance.now() : Date.now();
    const tree = countTree(document?.rootNode);
    const errorCount = issues.filter((i) => i.severity === "error").length;
    const warningCount = issues.filter((i) => i.severity === "warn").length;
    const infoCount = issues.filter((i) => i.severity === "info").length;
    const statistics: CanonicalValidationStatistics = {
      kind: "canonical-validation-statistics",
      elementCount: tree.elements,
      attributeCount: tree.attributes,
      schemaElementCount: compiled?.elements.size ?? 0,
      schemaTypeCount: compiled?.types.size ?? 0,
      issueCount: issues.length,
      errorCount,
      warningCount,
      infoCount,
      durationMs: Math.max(0, Math.round(ended - started)),
    };
    const context: XMLValidationRuntimeContext = createEmptyXMLValidationRuntimeContext({
      document,
      schemaDocument,
      rootElementName: rootElementName ?? null,
      issues,
      statistics,
      validationWarnings: warnings,
    });
    return {
      kind: "canonical-xsd-validation-result",
      ok: true,
      valid,
      document,
      schemaDocument,
      context,
      issues,
      statistics,
      code: valid ? "XSD_VALIDATION_OK" : "XSD_VALIDATION_FAILED",
      message: valid
        ? "XSD validation succeeded."
        : `XSD validation failed with ${errorCount} error(s).`,
    };
  }
}

export const defaultXSDValidator = new XSDValidator();

/** Helper — valida CanonicalXMLDocument contra XSD (string ou documento). */
export function validateXSD(
  document: CanonicalXMLDocument,
  xsd: string | CanonicalXMLDocument,
  options?: XSDValidatorOptions,
): CanonicalXSDValidationResult {
  return defaultXSDValidator.validate(document, xsd, options);
}
