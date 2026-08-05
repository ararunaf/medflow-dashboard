/**
 * XML Parser funcional — D-01 / BLOCO D.
 *
 * Exporta contratos canônicos + XMLParser genérico.
 * Sem TISS. Sem Operadoras. Sem XSD. Sem SOAP. Sem XPath.
 */
export type {
  CanonicalXMLAttribute,
  CanonicalXMLDocument,
  CanonicalXMLHeader,
  CanonicalXMLNode,
  CanonicalXMLParserStatistics,
  CanonicalXMLParsingError,
  CanonicalXMLParsingResult,
  XMLRuntimeContext,
} from "./canonical";

export { createEmptyXMLRuntimeContext } from "./canonical";

export { XMLParser, defaultXMLParser, parseXML, type XMLParserOptions } from "./xml-parser";
