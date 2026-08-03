/**
 * Modelos canônicos do Enterprise XML Generation Runtime — TISS-05.
 *
 * Estrutura XML canônica apenas. Sem XML TISS/ANS real.
 * Sem lógica de operadora, contrato, tenant, cooperativa ou versão.
 * Sem namespaces reais, schemas externos, assinatura digital ou serializer específico.
 */

/** Status estrutural de um resultado de geração canônica. */
export type CanonicalXMLGenerationStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "unknown"
  | (string & {});

/**
 * Metadata canônica de um pedido/resultado de geração XML.
 * Estrutural — sem semântica de operadora/contrato/tenant.
 */
export type CanonicalXMLMetadata = {
  kind: "canonical-xml-metadata";
  sessionId?: string;
  correlationId?: string | null;
  channel?: string;
  source?: string;
  tags?: readonly string[];
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/**
 * Pedido canônico de geração XML (TISS-05).
 * Não contém payload TISS/ANS. Não conhece operadora/contrato/tenant.
 */
export type CanonicalXMLRequest = {
  kind: "canonical-xml-generation-request";
  requestId?: string;
  generationId?: string;
  documentId?: string;
  catalogId?: string;
  catalogConsumed?: boolean;
  rulePackExecutionId?: string;
  rulePackCode?: string;
  rulePackConsumed?: boolean;
  metadata?: CanonicalXMLMetadata;
  structuralNotes?: string;
};

/**
 * Nó estrutural da árvore XML canônica.
 * Representação tipada — NÃO é XML serializado real / TISS / ANS.
 */
export type CanonicalXMLNode = {
  kind: "canonical-xml-node";
  name: string;
  value?: string;
  children?: readonly CanonicalXMLNode[];
};

/**
 * Estrutura XML canônica produzida pelo Generation Runtime.
 * Sempre com realXmlGenerated = false nesta Sprint.
 */
export type CanonicalXMLStructure = {
  kind: "canonical-xml-structure";
  root: "CanonicalXML";
  nodes: readonly CanonicalXMLNode[];
  /** Sempre false — nenhuma geração XML real nesta fundação. */
  realXmlGenerated: false;
};

/**
 * Resultado canônico de geração XML (TISS-05).
 * Contém apenas estrutura canônica — nunca XML TISS/ANS/operadora.
 */
export type CanonicalXMLResult = {
  kind: "canonical-xml-generation-result";
  ok: boolean;
  resultId: string;
  request: CanonicalXMLRequest;
  structure?: CanonicalXMLStructure;
  metadata?: CanonicalXMLMetadata;
  generationId?: string;
  catalogId?: string;
  catalogConsumed: boolean;
  rulePackExecutionId?: string;
  rulePackCode?: string;
  rulePackConsumed: boolean;
  /** Sempre false na fundação TISS-05. */
  realXmlGenerated: false;
  status: CanonicalXMLGenerationStatus;
  message?: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Estatísticas estruturais do XML Generation Runtime (in-process).
 */
export type CanonicalXMLGenerationStatistics = {
  kind: "canonical-xml-generation-statistics";
  totalResults: number;
  completedResults: number;
  failedResults: number;
  cancelledResults: number;
  realXmlGeneratedCount: 0;
};

/**
 * Saúde canônica do provedor XML Generation Runtime.
 */
export type CanonicalXMLGenerationProviderHealth = {
  kind: "canonical-xml-generation-provider-health";
  ok: boolean;
  provider: string;
  latencyMs?: number;
  message?: string;
  status?: string;
  storedResultCount?: number;
};

/**
 * Capacidades canônicas declaradas do provedor XML Generation Runtime.
 */
export type CanonicalXMLGenerationProviderCapabilities = {
  kind: "canonical-xml-generation-provider-capabilities";
  supportsGenerate: boolean;
  supportsGetResult: boolean;
  supportsListResults: boolean;
  supportsHealth: boolean;
  supportsCanonicalStructure: boolean;
  implementsRealXml: false;
  implementsOperatorDispatch: false;
  implementsAnsValidation: false;
  implementsBusinessRules: false;
  knowsOperatorOrCooperative: false;
  knowsContract: false;
  knowsTenant: false;
};
