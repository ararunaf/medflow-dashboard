/**
 * Modelos canônicos do Enterprise XML Serializer Runtime — TISS-06.
 *
 * Serialização XML canônica em texto apenas.
 * Sem XML TISS/ANS real. Sem namespaces ANS. Sem XSD. Sem envelope de webservice.
 * Sem lógica de operadora, contrato, tenant, cooperativa ou versão.
 * Sem conhecimento de padrões TISS — apenas estrutura canônica tipada.
 */

import type {
  CanonicalXMLNode,
  CanonicalXMLStructure,
} from "../../xml-generation-runtime/ports/canonical";

export type { CanonicalXMLNode, CanonicalXMLStructure };

/** Status estrutural de um resultado de serialização canônica. */
export type CanonicalXMLSerializationStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "unknown"
  | (string & {});

/**
 * Metadata canônica de um pedido/resultado de serialização XML.
 * Estrutural — sem semântica de operadora/contrato/tenant.
 */
export type CanonicalXMLSerializerMetadata = {
  kind: "canonical-xml-serializer-metadata";
  sessionId?: string;
  correlationId?: string | null;
  channel?: string;
  source?: string;
  tags?: readonly string[];
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/**
 * Pedido canônico de serialização XML (TISS-06).
 * Consome estrutura tipada do XML Generation Runtime.
 * Não contém payload TISS/ANS. Não conhece operadora/contrato/tenant.
 */
export type CanonicalXMLSerializeRequest = {
  kind: "canonical-xml-serialize-request";
  requestId?: string;
  serializationId?: string;
  generationId?: string;
  generationResultId?: string;
  documentId?: string;
  /** Estrutura canônica tipada produzida pelo XML Generation Runtime. */
  structure?: CanonicalXMLStructure;
  metadata?: CanonicalXMLSerializerMetadata;
  structuralNotes?: string;
};

/**
 * Resultado canônico de serialização XML (TISS-06).
 * Contém apenas XML canônico em texto — nunca XML TISS/ANS/operadora.
 */
export type CanonicalXMLSerializeResult = {
  kind: "canonical-xml-serialize-result";
  ok: boolean;
  resultId: string;
  request: CanonicalXMLSerializeRequest;
  /** Representação XML canônica em texto (não TISS/ANS). */
  canonicalXml?: string;
  structure?: CanonicalXMLStructure;
  metadata?: CanonicalXMLSerializerMetadata;
  serializationId?: string;
  generationId?: string;
  generationResultId?: string;
  /** Sempre false — nenhuma serialização TISS real nesta fundação. */
  realTissXmlGenerated: false;
  /** Sempre false — nenhuma serialização ANS real nesta fundação. */
  realAnsXmlGenerated: false;
  status: CanonicalXMLSerializationStatus;
  message?: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Estatísticas estruturais do XML Serializer Runtime (in-process).
 */
export type CanonicalXMLSerializerStatistics = {
  kind: "canonical-xml-serializer-statistics";
  totalResults: number;
  completedResults: number;
  failedResults: number;
  cancelledResults: number;
  realTissXmlGeneratedCount: 0;
  realAnsXmlGeneratedCount: 0;
};

/**
 * Saúde canônica do provedor XML Serializer Runtime.
 */
export type CanonicalXMLSerializerProviderHealth = {
  kind: "canonical-xml-serializer-provider-health";
  ok: boolean;
  provider: string;
  latencyMs?: number;
  message?: string;
  status?: string;
  storedResultCount?: number;
};

/**
 * Capacidades canônicas declaradas do provedor XML Serializer Runtime.
 */
export type CanonicalXMLSerializerProviderCapabilities = {
  kind: "canonical-xml-serializer-provider-capabilities";
  supportsSerialize: boolean;
  supportsGetResult: boolean;
  supportsListResults: boolean;
  supportsHealth: boolean;
  supportsCanonicalXmlString: boolean;
  implementsRealTissXml: false;
  implementsRealAnsXml: false;
  implementsOperatorDispatch: false;
  implementsAnsValidation: false;
  implementsXsdValidation: false;
  implementsBusinessRules: false;
  knowsOperatorOrCooperative: false;
  knowsContract: false;
  knowsTenant: false;
  knowsTissPattern: false;
};
