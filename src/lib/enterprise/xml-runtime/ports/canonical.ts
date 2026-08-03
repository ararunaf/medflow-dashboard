/**
 * Modelos canônicos do Enterprise XML Runtime — TISS-04.
 *
 * Fundação estrutural apenas. Sem geração XML real. Sem ANS.
 * Sem lógica de operadora, contrato, tenant, cooperativa ou versão.
 * Conhecimento TISS exclusivamente via TISSCatalogPort + RulePackEnginePort.
 */

/** Status estrutural de uma geração canônica. */
export type CanonicalXMLGenerationStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "validated"
  | "unknown"
  | (string & {});

/**
 * Metadata canônica de um pedido/resultado XML.
 * Estrutural — sem semântica de operadora/contrato/tenant.
 */
export type CanonicalXMLMetadata = {
  kind: "canonical-xml-metadata";
  sessionId?: string;
  correlationId?: string | null;
  channel?: string;
  source?: string;
  tags?: readonly string[];
  /** Códigos opacos de perfil/catálogo — resolvidos via TISSCatalogPort. */
  catalogProfileCodes?: readonly string[];
  /** Códigos opacos de Rule Pack — resolvidos via RulePackEnginePort. */
  rulePackCodes?: readonly string[];
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/**
 * Configuração estrutural do XML Runtime (TISS-04).
 * Sem versão TISS hardcoded — apenas flags/atributos opacos.
 */
export type CanonicalXMLRuntimeConfiguration = {
  kind: "canonical-xml-runtime-configuration";
  mode?: "structural" | "foundation" | (string & {});
  priority?: "LOW" | "NORMAL" | "HIGH" | (string & {});
  notes?: string;
  /** Códigos opacos de versão TISS (via Catalog) — sem if/switch por versão. */
  catalogVersionCodes?: readonly string[];
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/**
 * Pedido canônico de geração/validação XML.
 * Não contém payload XML. Não conhece ANS/operadora.
 */
export type CanonicalXMLRequest = {
  kind: "canonical-xml-request";
  requestId?: string;
  documentId?: string;
  metadata?: CanonicalXMLMetadata;
  configuration?: CanonicalXMLRuntimeConfiguration;
  /** Código opaco de perfil do catálogo (via TISSCatalogPort). */
  catalogProfileCode?: string;
  /** Código opaco de Rule Pack (via RulePackEnginePort). */
  rulePackCode?: string;
  structuralNotes?: string;
};

/**
 * Resultado canônico — sem conteúdo XML real na fundação TISS-04.
 */
export type CanonicalXMLResult = {
  kind: "canonical-xml-result";
  ok: boolean;
  request?: CanonicalXMLRequest;
  metadata?: CanonicalXMLMetadata;
  generationId?: string;
  catalogId?: string;
  catalogConsumed: boolean;
  rulePackExecutionId?: string;
  rulePackCode?: string;
  rulePackConsumed: boolean;
  /** Sempre false na fundação TISS-04. */
  realXmlGenerated: false;
  status: CanonicalXMLGenerationStatus;
  message?: string;
  code?: string;
};

/**
 * Registro estrutural de uma geração XML canônica.
 */
export type CanonicalXMLGeneration = {
  kind: "canonical-xml-generation";
  generationId: string;
  status: CanonicalXMLGenerationStatus;
  request: CanonicalXMLRequest;
  result?: CanonicalXMLResult;
  catalogId?: string;
  catalogConsumed: boolean;
  rulePackExecutionId?: string;
  rulePackCode?: string;
  rulePackConsumed: boolean;
  realXmlGenerated: false;
  createdAt: string;
  updatedAt: string;
  message?: string;
  code?: string;
};

/**
 * Estatísticas estruturais do XML Runtime (in-process).
 */
export type CanonicalXMLStatistics = {
  kind: "canonical-xml-statistics";
  totalGenerations: number;
  completedGenerations: number;
  failedGenerations: number;
  cancelledGenerations: number;
  validatedGenerations: number;
  catalogConsumptions: number;
  rulePackConsumptions: number;
  realXmlGeneratedCount: 0;
};

/**
 * Saúde canônica do provedor XML Runtime.
 */
export type CanonicalXMLProviderHealth = {
  kind: "canonical-xml-provider-health";
  ok: boolean;
  provider: string;
  latencyMs?: number;
  message?: string;
  status?: string;
  storedGenerationCount?: number;
  tissCatalogOk?: boolean;
  rulePackEngineOk?: boolean;
};

/**
 * Capacidades canônicas declaradas do provedor XML Runtime.
 */
export type CanonicalXMLProviderCapabilities = {
  kind: "canonical-xml-provider-capabilities";
  supportsGenerate: boolean;
  supportsValidate: boolean;
  supportsCancel: boolean;
  supportsHealth: boolean;
  supportsCanonicalResult: boolean;
  consumesTISSCatalogPort: boolean;
  consumesRulePackEnginePort: boolean;
  implementsRealXml: false;
  implementsOperatorDispatch: false;
  implementsAnsValidation: false;
  implementsBusinessRules: false;
  knowsOperatorOrCooperative: false;
  knowsContract: false;
  knowsTenant: false;
};
