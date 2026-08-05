/**
 * Contratos canônicos do XML Parser funcional — D-01 / BLOCO D.
 *
 * Parser XML genérico. Sem TISS. Sem Operadoras. Sem XSD. Sem SOAP. Sem XPath.
 */
import type { CanonicalXMLMetadata } from "../ports/canonical";

/** Atributo XML canônico. */
export type CanonicalXMLAttribute = {
  kind: "canonical-xml-attribute";
  name: string;
  localName: string;
  prefix?: string | null;
  namespaceUri?: string | null;
  value: string;
};

/** Nó da árvore DOM canônica. */
export type CanonicalXMLNode = {
  kind: "canonical-xml-node";
  nodeType: "element" | "text" | "cdata" | "comment" | "document";
  name?: string;
  localName?: string;
  prefix?: string | null;
  namespaceUri?: string | null;
  attributes?: readonly CanonicalXMLAttribute[];
  children?: readonly CanonicalXMLNode[];
  textContent?: string | null;
  /** Papel estrutural genérico (nome do elemento), sem semântica SOAP/TISS. */
  role?: "header" | "body" | "root" | "node" | null;
};

/**
 * Declaração / prolog XML (versão, encoding, standalone).
 * É o Header estrutural do documento — não é SOAP Header.
 */
export type CanonicalXMLHeader = {
  kind: "canonical-xml-header";
  version?: string | null;
  encoding?: string | null;
  standalone?: boolean | null;
  rawDeclaration?: string | null;
};

/** Estatísticas do parse. */
export type CanonicalXMLParserStatistics = {
  kind: "canonical-xml-parser-statistics";
  sourceLength: number;
  nodeCount: number;
  elementCount: number;
  attributeCount: number;
  namespaceCount: number;
  textNodeCount: number;
  commentCount: number;
  durationMs: number;
};

/** Erro de parsing XML (sintaxe). */
export type CanonicalXMLParsingError = {
  kind: "canonical-xml-parsing-error";
  code: string;
  message: string;
  line?: number;
  column?: number;
  offset?: number;
};

/**
 * Documento XML canônico produzido pelo parser.
 * Sem conhecimento de TISS / Operadoras / Schema.
 */
export type CanonicalXMLDocument = {
  kind: "canonical-xml-document";
  header?: CanonicalXMLHeader | null;
  /** Elemento raiz do documento. */
  rootNode?: CanonicalXMLNode | null;
  /**
   * Corpo estrutural do documento (= raiz, ou filho genérico de papel "body").
   * Identificação por nome genérico — sem protocolo SOAP.
   */
  body?: CanonicalXMLNode | null;
  /**
   * Filho genérico de papel "header" (ex.: elemento localName Header), se existir.
   * Sem semântica SOAP.
   */
  structuralHeaderNode?: CanonicalXMLNode | null;
  namespaces: Readonly<Record<string, string>>;
  metadata?: CanonicalXMLMetadata;
  encoding?: string | null;
  version?: string | null;
  standalone?: boolean | null;
};

/** Resultado canônico de um parse. */
export type CanonicalXMLParsingResult = {
  kind: "canonical-xml-parsing-result";
  ok: boolean;
  document?: CanonicalXMLDocument | null;
  context?: XMLRuntimeContext | null;
  errors: readonly CanonicalXMLParsingError[];
  warnings: readonly string[];
  statistics?: CanonicalXMLParserStatistics;
  code?: string;
  message?: string;
};

/**
 * Contexto expandido do XML Runtime (D-01).
 * Carrega o resultado do parser sem capabilities adicionais.
 */
export type XMLRuntimeContext = {
  kind: "canonical-xml-runtime-context";
  document?: CanonicalXMLDocument | null;
  metadata?: CanonicalXMLMetadata;
  rootNode?: CanonicalXMLNode | null;
  namespaces: Readonly<Record<string, string>>;
  parserStatistics?: CanonicalXMLParserStatistics;
  parsingWarnings: readonly string[];
  parsingErrors: readonly CanonicalXMLParsingError[];
};

/** Helper — contexto vazio pós-parse (ou pré-parse). */
export function createEmptyXMLRuntimeContext(
  overrides: Partial<XMLRuntimeContext> = {},
): XMLRuntimeContext {
  return {
    kind: "canonical-xml-runtime-context",
    document: overrides.document ?? null,
    metadata: overrides.metadata,
    rootNode: overrides.rootNode ?? null,
    namespaces: overrides.namespaces ?? {},
    parserStatistics: overrides.parserStatistics,
    parsingWarnings: overrides.parsingWarnings ?? [],
    parsingErrors: overrides.parsingErrors ?? [],
  };
}
