/**
 * Modelos canônicos do Enterprise XML Schema Runtime — TISS-07.
 *
 * Infraestrutura canônica de gerenciamento de XML Schemas.
 * Sem XSD oficial. Sem validação XSD. Sem XML TISS/ANS.
 * Sem namespaces oficiais. Sem envelope de webservice. Sem operadoras/contratos/tenants.
 * Sem conhecimento de padrões TISS — apenas modelos estruturais desacoplados.
 */

/** Status estrutural de uma operação/resultado de schema canônico. */
export type CanonicalXMLSchemaStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "registered"
  | "unknown"
  | (string & {});

/**
 * Versão canônica de um XML Schema (estrutural — sem semântica ANS/TISS).
 */
export type CanonicalXMLSchemaVersion = {
  kind: "canonical-xml-schema-version";
  label?: string;
  major?: number;
  minor?: number;
  patch?: number;
  revision?: string;
};

/**
 * Metadata canônica de um pedido/resultado de XML Schema.
 * Estrutural — sem semântica de operadora/contrato/tenant.
 */
export type CanonicalXMLSchemaMetadata = {
  kind: "canonical-xml-schema-metadata";
  sessionId?: string;
  correlationId?: string | null;
  channel?: string;
  source?: string;
  tags?: readonly string[];
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/**
 * Perfil canônico de XML Schema (estrutural — sem perfil ANS/TISS oficial).
 */
export type CanonicalXMLSchemaProfile = {
  kind: "canonical-xml-schema-profile";
  profileId?: string;
  profileCode?: string;
  label?: string;
  notes?: string;
};

/**
 * Referência canônica a um XML Schema (opaca — sem conteúdo XSD).
 */
export type CanonicalXMLSchemaReference = {
  kind: "canonical-xml-schema-reference";
  schemaId?: string;
  schemaCode?: string;
  serializeResultId?: string;
  generationResultId?: string;
  documentId?: string;
  uri?: string;
  digest?: string;
};

/**
 * Schema XML canônico (TISS-07).
 * NÃO contém XSD oficial. NÃO valida XML. NÃO conhece ANS/TISS/operadora.
 */
export type CanonicalXMLSchema = {
  kind: "canonical-xml-schema";
  schemaId: string;
  name?: string;
  version?: CanonicalXMLSchemaVersion;
  profile?: CanonicalXMLSchemaProfile;
  reference?: CanonicalXMLSchemaReference;
  metadata?: CanonicalXMLSchemaMetadata;
  structuralNotes?: string;
  /** Sempre false — nenhum XSD oficial nesta fundação. */
  implementsOfficialXsd: false;
  /** Sempre false — nenhum schema ANS nesta fundação. */
  implementsAnsSchema: false;
  /** Sempre false — nenhum schema TISS nesta fundação. */
  implementsTissSchema: false;
};

/**
 * Operação canônica do XML Schema Runtime.
 */
export type CanonicalXMLSchemaOperation =
  | "register"
  | "select"
  | "get"
  | "list"
  | "health"
  | "capabilities"
  | (string & {});

/**
 * Pedido canônico de registro/gerenciamento de XML Schema (TISS-07).
 * Não contém XSD. Não contém payload TISS/ANS. Não conhece operadora/contrato/tenant.
 */
export type CanonicalXMLSchemaRequest = {
  kind: "canonical-xml-schema-request";
  requestId?: string;
  schemaId?: string;
  name?: string;
  version?: CanonicalXMLSchemaVersion;
  profile?: CanonicalXMLSchemaProfile;
  reference?: CanonicalXMLSchemaReference;
  metadata?: CanonicalXMLSchemaMetadata;
  serializeResultId?: string;
  generationResultId?: string;
  documentId?: string;
  structuralNotes?: string;
  operation?: CanonicalXMLSchemaOperation;
};

/**
 * Resultado canônico de operação de XML Schema (TISS-07).
 * Contém apenas referência/estrutura canônica — nunca XSD oficial / XML TISS/ANS.
 */
export type CanonicalXMLSchemaResult = {
  kind: "canonical-xml-schema-result";
  ok: boolean;
  resultId: string;
  request: CanonicalXMLSchemaRequest;
  schema?: CanonicalXMLSchema;
  metadata?: CanonicalXMLSchemaMetadata;
  operation?: CanonicalXMLSchemaOperation;
  serializeResultId?: string;
  generationResultId?: string;
  /** Sempre false — nenhum XSD oficial carregado/validado. */
  officialXsdLoaded: false;
  /** Sempre false — nenhuma validação XSD executada. */
  xsdValidationPerformed: false;
  /** Sempre false — nenhum XML TISS produzido/validado. */
  realTissXmlValidated: false;
  /** Sempre false — nenhum XML ANS produzido/validado. */
  realAnsXmlValidated: false;
  status: CanonicalXMLSchemaStatus;
  message?: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Estatísticas estruturais do XML Schema Runtime (in-process).
 */
export type CanonicalXMLSchemaStatistics = {
  kind: "canonical-xml-schema-statistics";
  totalResults: number;
  completedResults: number;
  failedResults: number;
  cancelledResults: number;
  registeredSchemas: number;
  officialXsdLoadedCount: 0;
  xsdValidationPerformedCount: 0;
  realTissXmlValidatedCount: 0;
  realAnsXmlValidatedCount: 0;
};

/**
 * Saúde canônica do provedor XML Schema Runtime.
 */
export type CanonicalXMLSchemaHealth = {
  kind: "canonical-xml-schema-health";
  ok: boolean;
  provider: string;
  latencyMs?: number;
  message?: string;
  status?: string;
  storedResultCount?: number;
  /** D-03 — Schema Selection funcional. */
  schemaSelectionOk?: boolean;
};

/**
 * Capacidades canônicas declaradas do provedor XML Schema Runtime.
 */
export type CanonicalXMLSchemaCapabilities = {
  kind: "canonical-xml-schema-capabilities";
  supportsRegister: boolean;
  supportsSelect: boolean;
  supportsGetResult: boolean;
  supportsListResults: boolean;
  supportsHealth: boolean;
  supportsCanonicalSchema: boolean;
  /** D-03 — Schema Selection funcional. */
  schemaSelectionImplemented: boolean;
  implementsOfficialXsd: false;
  implementsXsdValidation: false;
  implementsRealTissXml: false;
  implementsRealAnsXml: false;
  implementsOperatorDispatch: false;
  implementsAnsValidation: false;
  implementsBusinessRules: false;
  knowsOperatorOrCooperative: false;
  knowsContract: false;
  knowsTenant: false;
  knowsTissPattern: false;
};
