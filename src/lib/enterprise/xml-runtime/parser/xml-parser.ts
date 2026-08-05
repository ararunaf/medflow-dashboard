/**
 * XMLParser — D-01 Enterprise XML Functional Parser Foundation.
 *
 * Parser XML genérico:
 * - recebe XML em string
 * - valida sintaxe XML
 * - constrói árvore DOM canônica
 * - identifica Header (prolog), Body, Nodes, Attributes, Namespace, Encoding, Version
 *
 * Sem TISS. Sem Operadoras. Sem XSD. Sem SOAP. Sem XPath. Sem Schema.
 */
import type { CanonicalXMLMetadata } from "../ports/canonical";
import {
  createEmptyXMLRuntimeContext,
  type CanonicalXMLAttribute,
  type CanonicalXMLDocument,
  type CanonicalXMLHeader,
  type CanonicalXMLNode,
  type CanonicalXMLParserStatistics,
  type CanonicalXMLParsingError,
  type CanonicalXMLParsingResult,
  type XMLRuntimeContext,
} from "./canonical";

export type XMLParserOptions = {
  /** Metadata de correlação (CanonicalXMLMetadata + campos D-01). */
  metadata?: CanonicalXMLMetadata;
  /** Se true, rejeita documentos sem elemento raiz. Default: true. */
  requireRoot?: boolean;
};

type MutableNode = {
  kind: "canonical-xml-node";
  nodeType: CanonicalXMLNode["nodeType"];
  name?: string;
  localName?: string;
  prefix?: string | null;
  namespaceUri?: string | null;
  attributes: CanonicalXMLAttribute[];
  children: MutableNode[];
  textContent?: string | null;
  role?: CanonicalXMLNode["role"];
};

function lineColumnAt(source: string, offset: number): { line: number; column: number } {
  let line = 1;
  let column = 1;
  const end = Math.min(offset, source.length);
  for (let i = 0; i < end; i += 1) {
    if (source[i] === "\n") {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }
  return { line, column };
}

function makeError(
  source: string,
  offset: number,
  code: string,
  message: string,
): CanonicalXMLParsingError {
  const { line, column } = lineColumnAt(source, offset);
  return {
    kind: "canonical-xml-parsing-error",
    code,
    message,
    line,
    column,
    offset,
  };
}

function decodeEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function splitName(name: string): { prefix: string | null; localName: string } {
  const idx = name.indexOf(":");
  if (idx <= 0) return { prefix: null, localName: name };
  return { prefix: name.slice(0, idx), localName: name.slice(idx + 1) };
}

function roleFromLocalName(localName: string | undefined): CanonicalXMLNode["role"] {
  if (!localName) return "node";
  const lower = localName.toLowerCase();
  if (lower === "header" || lower === "cabecalho" || lower === "cabeçalho") return "header";
  if (lower === "body" || lower === "corpo") return "body";
  return "node";
}

function freezeNode(node: MutableNode): CanonicalXMLNode {
  return {
    kind: "canonical-xml-node",
    nodeType: node.nodeType,
    name: node.name,
    localName: node.localName,
    prefix: node.prefix ?? null,
    namespaceUri: node.namespaceUri ?? null,
    attributes: node.attributes.length > 0 ? node.attributes.map((a) => ({ ...a })) : undefined,
    children: node.children.length > 0 ? node.children.map((c) => freezeNode(c)) : undefined,
    textContent: node.textContent ?? null,
    role: node.role ?? null,
  };
}

function countNodes(node: CanonicalXMLNode | null | undefined): {
  nodeCount: number;
  elementCount: number;
  attributeCount: number;
  textNodeCount: number;
  commentCount: number;
} {
  if (!node) {
    return {
      nodeCount: 0,
      elementCount: 0,
      attributeCount: 0,
      textNodeCount: 0,
      commentCount: 0,
    };
  }
  let nodeCount = 1;
  let elementCount = node.nodeType === "element" ? 1 : 0;
  let attributeCount = node.attributes?.length ?? 0;
  let textNodeCount = node.nodeType === "text" || node.nodeType === "cdata" ? 1 : 0;
  let commentCount = node.nodeType === "comment" ? 1 : 0;
  for (const child of node.children ?? []) {
    const sub = countNodes(child);
    nodeCount += sub.nodeCount;
    elementCount += sub.elementCount;
    attributeCount += sub.attributeCount;
    textNodeCount += sub.textNodeCount;
    commentCount += sub.commentCount;
  }
  return { nodeCount, elementCount, attributeCount, textNodeCount, commentCount };
}

function findRoleNode(
  root: CanonicalXMLNode | null | undefined,
  role: "header" | "body",
): CanonicalXMLNode | null {
  if (!root) return null;
  if (root.role === role) return root;
  for (const child of root.children ?? []) {
    if (child.nodeType === "element" && child.role === role) return child;
  }
  return null;
}

function resolveNamespacesOnElement(
  attrs: readonly CanonicalXMLAttribute[],
  parentMap: Readonly<Record<string, string>>,
): { namespaces: Record<string, string>; attributes: CanonicalXMLAttribute[] } {
  const namespaces: Record<string, string> = { ...parentMap };
  const attributes: CanonicalXMLAttribute[] = [];

  for (const attr of attrs) {
    if (attr.name === "xmlns") {
      namespaces[""] = attr.value;
      attributes.push({ ...attr, namespaceUri: "http://www.w3.org/2000/xmlns/" });
      continue;
    }
    if (attr.prefix === "xmlns" || attr.name.startsWith("xmlns:")) {
      const prefix = attr.localName || attr.name.slice("xmlns:".length);
      namespaces[prefix] = attr.value;
      attributes.push({ ...attr, namespaceUri: "http://www.w3.org/2000/xmlns/" });
      continue;
    }
    attributes.push(attr);
  }

  const resolved = attributes.map((attr) => {
    if (attr.namespaceUri) return attr;
    if (attr.prefix && namespaces[attr.prefix]) {
      return { ...attr, namespaceUri: namespaces[attr.prefix] };
    }
    return attr;
  });

  return { namespaces, attributes: resolved };
}

/**
 * Parser XML genérico enterprise (D-01).
 * Sem dependências de DOM nativo — compatível com Node e Cloudflare Workers.
 */
export class XMLParser {
  private readonly requireRoot: boolean;

  constructor(options: XMLParserOptions = {}) {
    this.requireRoot = options.requireRoot !== false;
  }

  /**
   * Parseia XML a partir de string.
   * Valida sintaxe, constrói DOM canônico e preenche XMLRuntimeContext.
   */
  parse(xml: string, options: XMLParserOptions = {}): CanonicalXMLParsingResult {
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const source = typeof xml === "string" ? xml : String(xml ?? "");
    const errors: CanonicalXMLParsingError[] = [];
    const warnings: string[] = [];

    if (source.trim() === "") {
      const err = makeError(source, 0, "XML_PARSER_EMPTY", "XML source is empty.");
      errors.push(err);
      return this.fail(
        errors,
        warnings,
        started,
        source.length,
        options.metadata,
        "XML_PARSER_EMPTY",
      );
    }

    try {
      const parsed = this.parseDocument(source, warnings);
      if (!parsed.root && this.requireRoot) {
        errors.push(
          makeError(
            source,
            source.length,
            "XML_PARSER_NO_ROOT",
            "XML document has no root element.",
          ),
        );
        return this.fail(
          errors,
          warnings,
          started,
          source.length,
          options.metadata,
          "XML_PARSER_NO_ROOT",
        );
      }

      if (parsed.root) {
        parsed.root.role = "root";
      }
      const rootNode = parsed.root ? freezeNode(parsed.root) : null;

      const structuralHeaderNode = findRoleNode(rootNode, "header");
      const structuralBodyNode = findRoleNode(rootNode, "body");
      const body = structuralBodyNode ?? rootNode;

      const header: CanonicalXMLHeader | null = parsed.header;
      const encoding = header?.encoding ?? null;
      const version = header?.version ?? null;
      const standalone = header?.standalone ?? null;

      const metadata: CanonicalXMLMetadata = {
        kind: "canonical-xml-metadata",
        ...(options.metadata ?? {}),
        source: options.metadata?.source ?? "xml-parser",
        tags: ["d-01", "xml-parser", ...(options.metadata?.tags ?? [])],
        encoding,
        version,
        standalone,
      };

      const document: CanonicalXMLDocument = {
        kind: "canonical-xml-document",
        header,
        rootNode,
        body,
        structuralHeaderNode,
        namespaces: parsed.namespaces,
        metadata,
        encoding,
        version,
        standalone,
      };

      const counts = countNodes(rootNode);
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      const statistics: CanonicalXMLParserStatistics = {
        kind: "canonical-xml-parser-statistics",
        sourceLength: source.length,
        nodeCount: counts.nodeCount,
        elementCount: counts.elementCount,
        attributeCount: counts.attributeCount,
        namespaceCount: Object.keys(parsed.namespaces).length,
        textNodeCount: counts.textNodeCount,
        commentCount: counts.commentCount,
        durationMs: Math.max(0, Math.round(end - started)),
      };

      const context: XMLRuntimeContext = createEmptyXMLRuntimeContext({
        document,
        metadata,
        rootNode,
        namespaces: parsed.namespaces,
        parserStatistics: statistics,
        parsingWarnings: warnings,
        parsingErrors: [],
      });

      return {
        kind: "canonical-xml-parsing-result",
        ok: true,
        document,
        context,
        errors: [],
        warnings,
        statistics,
        code: "XML_PARSER_OK",
        message: "XML parsed successfully (generic parser — no TISS / no operators).",
      };
    } catch (err) {
      if (isParserThrow(err)) {
        errors.push(err.error);
      } else {
        errors.push({
          kind: "canonical-xml-parsing-error",
          code: "XML_PARSER_FAILED",
          message: err instanceof Error ? err.message : String(err),
        });
      }
      return this.fail(
        errors,
        warnings,
        started,
        source.length,
        options.metadata,
        errors[0]?.code ?? "XML_PARSER_FAILED",
      );
    }
  }

  private fail(
    errors: CanonicalXMLParsingError[],
    warnings: string[],
    started: number,
    sourceLength: number,
    metadata: CanonicalXMLMetadata | undefined,
    code: string,
  ): CanonicalXMLParsingResult {
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    const statistics: CanonicalXMLParserStatistics = {
      kind: "canonical-xml-parser-statistics",
      sourceLength,
      nodeCount: 0,
      elementCount: 0,
      attributeCount: 0,
      namespaceCount: 0,
      textNodeCount: 0,
      commentCount: 0,
      durationMs: Math.max(0, Math.round(end - started)),
    };
    const meta: CanonicalXMLMetadata | undefined = metadata
      ? { ...metadata, kind: "canonical-xml-metadata", source: metadata.source ?? "xml-parser" }
      : { kind: "canonical-xml-metadata", source: "xml-parser", tags: ["d-01", "xml-parser"] };
    const context = createEmptyXMLRuntimeContext({
      metadata: meta,
      parserStatistics: statistics,
      parsingWarnings: warnings,
      parsingErrors: errors,
    });
    return {
      kind: "canonical-xml-parsing-result",
      ok: false,
      document: null,
      context,
      errors,
      warnings,
      statistics,
      code,
      message: errors[0]?.message ?? "XML parsing failed.",
    };
  }

  private parseDocument(
    source: string,
    warnings: string[],
  ): {
    header: CanonicalXMLHeader | null;
    root: MutableNode | null;
    namespaces: Record<string, string>;
  } {
    let i = 0;
    let header: CanonicalXMLHeader | null = null;
    let root: MutableNode | null = null;
    const stack: MutableNode[] = [];
    const nsStack: Record<string, string>[] = [{}];
    let namespaces: Record<string, string> = {};

    const skipWs = () => {
      while (i < source.length && /\s/.test(source[i]!)) i += 1;
    };

    const peek = (n = 0) => source[i + n];

    const currentNs = () => nsStack[nsStack.length - 1] ?? {};

    while (i < source.length) {
      skipWs();
      if (i >= source.length) break;

      if (source.startsWith("<?xml", i)) {
        if (header || root) {
          throwParser(makeError(source, i, "XML_PARSER_PROLOG", "XML declaration must be first."));
        }
        const end = source.indexOf("?>", i);
        if (end < 0) {
          throwParser(makeError(source, i, "XML_PARSER_PROLOG", "Unterminated XML declaration."));
        }
        const raw = source.slice(i, end + 2);
        header = parseXmlDeclaration(raw, source, i);
        i = end + 2;
        continue;
      }

      if (source.startsWith("<?", i)) {
        const end = source.indexOf("?>", i);
        if (end < 0) {
          throwParser(
            makeError(source, i, "XML_PARSER_PI", "Unterminated processing instruction."),
          );
        }
        i = end + 2;
        continue;
      }

      if (source.startsWith("<!--", i)) {
        const end = source.indexOf("-->", i + 4);
        if (end < 0) {
          throwParser(makeError(source, i, "XML_PARSER_COMMENT", "Unterminated comment."));
        }
        if (source.slice(i + 4, end).includes("--")) {
          throwParser(makeError(source, i, "XML_PARSER_COMMENT", "Comment must not contain '--'."));
        }
        const commentText = source.slice(i + 4, end);
        const commentNode: MutableNode = {
          kind: "canonical-xml-node",
          nodeType: "comment",
          textContent: commentText,
          attributes: [],
          children: [],
          role: "node",
        };
        if (stack.length > 0) {
          stack[stack.length - 1]!.children.push(commentNode);
        }
        i = end + 3;
        continue;
      }

      if (source.startsWith("<![CDATA[", i)) {
        const end = source.indexOf("]]>", i + 9);
        if (end < 0) {
          throwParser(makeError(source, i, "XML_PARSER_CDATA", "Unterminated CDATA section."));
        }
        if (stack.length === 0) {
          throwParser(makeError(source, i, "XML_PARSER_CDATA", "CDATA outside of root element."));
        }
        stack[stack.length - 1]!.children.push({
          kind: "canonical-xml-node",
          nodeType: "cdata",
          textContent: source.slice(i + 9, end),
          attributes: [],
          children: [],
          role: "node",
        });
        i = end + 3;
        continue;
      }

      if (source.startsWith("<!DOCTYPE", i) || source.startsWith("<!doctype", i)) {
        const end = findDoctypeEnd(source, i);
        if (end < 0) {
          throwParser(makeError(source, i, "XML_PARSER_DOCTYPE", "Unterminated DOCTYPE."));
        }
        warnings.push("DOCTYPE declared — ignored by generic parser (no DTD validation).");
        i = end;
        continue;
      }

      if (source.startsWith("</", i)) {
        const closeStart = i;
        i += 2;
        skipWs();
        const nameStart = i;
        while (i < source.length && /[:A-Za-z0-9_.-]/.test(source[i]!)) i += 1;
        const name = source.slice(nameStart, i);
        skipWs();
        if (peek() !== ">") {
          throwParser(
            makeError(source, i, "XML_PARSER_END_TAG", `Malformed end tag for '${name}'.`),
          );
        }
        i += 1;
        if (stack.length === 0) {
          throwParser(
            makeError(source, closeStart, "XML_PARSER_END_TAG", `Unexpected end tag </${name}>.`),
          );
        }
        const open = stack.pop()!;
        if (open.name !== name) {
          throwParser(
            makeError(
              source,
              closeStart,
              "XML_PARSER_MISMATCH",
              `Mismatched end tag: expected </${open.name}>, found </${name}>.`,
            ),
          );
        }
        nsStack.pop();
        if (stack.length === 0) {
          root = open;
        } else {
          stack[stack.length - 1]!.children.push(open);
        }
        continue;
      }

      if (peek() === "<") {
        if (root && stack.length === 0) {
          throwParser(
            makeError(
              source,
              i,
              "XML_PARSER_MULTI_ROOT",
              "Multiple root elements are not allowed.",
            ),
          );
        }
        i += 1;
        skipWs();
        const nameStart = i;
        if (!/[A-Za-z_:]/.test(peek() ?? "")) {
          throwParser(makeError(source, i, "XML_PARSER_TAG", "Invalid element name."));
        }
        while (i < source.length && /[:A-Za-z0-9_.-]/.test(source[i]!)) i += 1;
        const name = source.slice(nameStart, i);
        if (!name) {
          throwParser(makeError(source, nameStart, "XML_PARSER_TAG", "Empty element name."));
        }

        const rawAttrs: CanonicalXMLAttribute[] = [];
        while (true) {
          skipWs();
          if (peek() === "/" || peek() === ">" || peek() === undefined) break;
          const attrNameStart = i;
          if (!/[A-Za-z_:]/.test(peek() ?? "")) {
            throwParser(makeError(source, i, "XML_PARSER_ATTR", "Invalid attribute name."));
          }
          while (i < source.length && /[:A-Za-z0-9_.-]/.test(source[i]!)) i += 1;
          const attrName = source.slice(attrNameStart, i);
          skipWs();
          if (peek() !== "=") {
            throwParser(
              makeError(source, i, "XML_PARSER_ATTR", `Attribute '${attrName}' missing '='.`),
            );
          }
          i += 1;
          skipWs();
          const quote = peek();
          if (quote !== '"' && quote !== "'") {
            throwParser(
              makeError(
                source,
                i,
                "XML_PARSER_ATTR",
                `Attribute '${attrName}' value must be quoted.`,
              ),
            );
          }
          i += 1;
          const valueStart = i;
          while (i < source.length && source[i] !== quote) {
            if (source[i] === "<") {
              throwParser(
                makeError(
                  source,
                  i,
                  "XML_PARSER_ATTR",
                  `Attribute '${attrName}' value contains raw '<'.`,
                ),
              );
            }
            i += 1;
          }
          if (peek() !== quote) {
            throwParser(
              makeError(
                source,
                valueStart,
                "XML_PARSER_ATTR",
                `Unterminated attribute value for '${attrName}'.`,
              ),
            );
          }
          const rawValue = source.slice(valueStart, i);
          i += 1;
          const { prefix, localName } = splitName(attrName);
          rawAttrs.push({
            kind: "canonical-xml-attribute",
            name: attrName,
            localName,
            prefix,
            value: decodeEntities(rawValue),
          });
        }

        const { namespaces: elNs, attributes } = resolveNamespacesOnElement(rawAttrs, currentNs());
        namespaces = { ...namespaces, ...elNs };

        const { prefix, localName } = splitName(name);
        const nsUri = (prefix && elNs[prefix]) || (!prefix && elNs[""]) || null;

        const element: MutableNode = {
          kind: "canonical-xml-node",
          nodeType: "element",
          name,
          localName,
          prefix,
          namespaceUri: nsUri,
          attributes,
          children: [],
          role: roleFromLocalName(localName),
        };

        skipWs();
        const selfClosing = peek() === "/";
        if (selfClosing) {
          i += 1;
          skipWs();
        }
        if (peek() !== ">") {
          throwParser(makeError(source, i, "XML_PARSER_TAG", `Malformed start tag <${name}>.`));
        }
        i += 1;

        if (selfClosing) {
          if (stack.length === 0) {
            if (root) {
              throwParser(
                makeError(
                  source,
                  nameStart,
                  "XML_PARSER_MULTI_ROOT",
                  "Multiple root elements are not allowed.",
                ),
              );
            }
            root = element;
          } else {
            stack[stack.length - 1]!.children.push(element);
          }
        } else {
          nsStack.push(elNs);
          stack.push(element);
        }
        continue;
      }

      // Text content
      if (stack.length === 0) {
        if (/\S/.test(peek() ?? "")) {
          throwParser(
            makeError(source, i, "XML_PARSER_TEXT", "Unexpected text outside root element."),
          );
        }
        i += 1;
        continue;
      }

      const textStart = i;
      while (i < source.length && source[i] !== "<") i += 1;
      const rawText = source.slice(textStart, i);
      if (rawText.length > 0) {
        stack[stack.length - 1]!.children.push({
          kind: "canonical-xml-node",
          nodeType: "text",
          textContent: decodeEntities(rawText),
          attributes: [],
          children: [],
          role: "node",
        });
      }
    }

    if (stack.length > 0) {
      throwParser(
        makeError(
          source,
          source.length,
          "XML_PARSER_UNCLOSED",
          `Unclosed element <${stack[stack.length - 1]!.name}>.`,
        ),
      );
    }

    return { header, root, namespaces };
  }
}

type ParserThrow = { __xmlParserThrow: true; error: CanonicalXMLParsingError };

function throwParser(error: CanonicalXMLParsingError): never {
  const e: ParserThrow = { __xmlParserThrow: true, error };
  throw e;
}

function isParserThrow(err: unknown): err is ParserThrow {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as ParserThrow).__xmlParserThrow === true &&
    typeof (err as ParserThrow).error === "object"
  );
}

function parseXmlDeclaration(raw: string, source: string, offset: number): CanonicalXMLHeader {
  const body = raw
    .replace(/^<\?xml/i, "")
    .replace(/\?>$/, "")
    .trim();
  const versionMatch = /\bversion\s*=\s*(["'])([^"']*)\1/i.exec(body);
  const encodingMatch = /\bencoding\s*=\s*(["'])([^"']*)\1/i.exec(body);
  const standaloneMatch = /\bstandalone\s*=\s*(["'])(yes|no)\1/i.exec(body);

  if (!versionMatch) {
    throwParser(
      makeError(source, offset, "XML_PARSER_PROLOG", "XML declaration requires version."),
    );
  }

  return {
    kind: "canonical-xml-header",
    version: versionMatch[2] ?? null,
    encoding: encodingMatch?.[2] ?? null,
    standalone:
      standaloneMatch?.[2] === "yes" ? true : standaloneMatch?.[2] === "no" ? false : null,
    rawDeclaration: raw,
  };
}

function findDoctypeEnd(source: string, start: number): number {
  let i = start;
  let depth = 0;
  let inQuote: string | null = null;
  while (i < source.length) {
    const ch = source[i]!;
    if (inQuote) {
      if (ch === inQuote) inQuote = null;
      i += 1;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inQuote = ch;
      i += 1;
      continue;
    }
    if (ch === "[") {
      depth += 1;
      i += 1;
      continue;
    }
    if (ch === "]") {
      depth = Math.max(0, depth - 1);
      i += 1;
      continue;
    }
    if (ch === ">" && depth === 0) return i + 1;
    i += 1;
  }
  return -1;
}

/** Instância default do parser (D-01). */
export const defaultXMLParser = new XMLParser();

/** Helper funcional. */
export function parseXML(xml: string, options?: XMLParserOptions): CanonicalXMLParsingResult {
  return defaultXMLParser.parse(xml, options);
}
