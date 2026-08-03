/**
 * Modelos canônicos do Enterprise XSD Runtime — TISS-09.
 *
 * Infraestrutura canônica de gerenciamento estrutural de XSDs futuros.
 * Sem XSD oficial. Sem validação XSD real. Sem XML TISS/ANS.
 * Sem namespaces oficiais. Sem envelope de webservice. Sem operadoras/contratos/tenants.
 * Sem conhecimento de padrões TISS — apenas modelos estruturais desacoplados.
 */

/** Status estrutural de uma operação/resultado de XSD Runtime canônico. */
export type CanonicalXSDStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "prepared"
  | "unknown"
  | (string & {});

/**
 * Versão canônica de um perfil/engine de XSD (estrutural — sem semântica ANS/TISS).
 */
export type CanonicalXSDVersion = {
  kind: "canonical-xsd-version";
  label?: string;
  major?: number;
  minor?: number;
  patch?: number;
  revision?: string;
};

/**
 * Metadata canônica de um pedido/resultado de XSD Runtime.
 * Estrutural — sem semântica de operadora/contrato/tenant.
 */
export type CanonicalXSDMetadata = {
  kind: "canonical-xsd-metadata";
  sessionId?: string;
  correlationId?: string | null;
  channel?: string;
  source?: string;
  tags?: readonly string[];
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/**
 * Perfil canônico de XSD Runtime (estrutural — sem perfil ANS/TISS oficial).
 */
export type CanonicalXSDProfile = {
  kind: "canonical-xsd-profile";
  profileId?: string;
  profileCode?: string;
  label?: string;
  notes?: string;
};

/**
 * Schema canônico estrutural (opaco — sem conteúdo XSD real / sem arquivo .xsd).
 */
export type CanonicalXSDSchema = {
  kind: "canonical-xsd-schema";
  schemaId?: string;
  schemaCode?: string;
  label?: string;
  version?: CanonicalXSDVersion;
  notes?: string;
};

/**
 * Referência canônica a um pedido de XSD Runtime (opaca — sem conteúdo XSD/XML).
 */
export type CanonicalXSDReference = {
  kind: "canonical-xsd-reference";
  xsdId?: string;
  xsdCode?: string;
  schemaId?: string;
  validationResultId?: string;
  schemaResultId?: string;
  serializeResultId?: string;
  generationResultId?: string;
  documentId?: string;
  uri?: string;
  digest?: string;
};

/**
 * Operação canônica do XSD Runtime.
 */
export type CanonicalXSDOperation =
  | "prepare"
  | "get"
  | "list"
  | "health"
  | "capabilities"
  | (string & {});

/**
 * Pedido canônico de XSD Runtime (TISS-09).
 * Não contém XSD oficial. Não contém payload TISS/ANS. Não conhece operadora/contrato/tenant.
 */
export type CanonicalXSDRuntimeRequest = {
  kind: "canonical-xsd-runtime-request";
  requestId?: string;
  xsdId?: string;
  name?: string;
  version?: CanonicalXSDVersion;
  profile?: CanonicalXSDProfile;
  schema?: CanonicalXSDSchema;
  reference?: CanonicalXSDReference;
  metadata?: CanonicalXSDMetadata;
  validationResultId?: string;
  schemaResultId?: string;
  serializeResultId?: string;
  generationResultId?: string;
  documentId?: string;
  structuralNotes?: string;
  operation?: CanonicalXSDOperation;
};

/**
 * Resultado canônico de operação de XSD Runtime (TISS-09).
 * Contém apenas referência/estrutura canônica — nunca XSD oficial / XML TISS/ANS.
 * Nenhum XSD real é carregado nesta fundação.
 */
export type CanonicalXSDRuntimeResult = {
  kind: "canonical-xsd-runtime-result";
  ok: boolean;
  resultId: string;
  request: CanonicalXSDRuntimeRequest;
  profile?: CanonicalXSDProfile;
  schema?: CanonicalXSDSchema;
  metadata?: CanonicalXSDMetadata;
  operation?: CanonicalXSDOperation;
  validationResultId?: string;
  schemaResultId?: string;
  serializeResultId?: string;
  generationResultId?: string;
  /** Sempre false — nenhum XSD oficial carregado nesta fundação. */
  officialXsdLoaded: false;
  /** Sempre false — nenhum XSD real carregado. */
  realXsdLoaded: false;
  /** Sempre false — nenhuma validação real disponível. */
  realValidationAvailable: false;
  /** Sempre false — nenhum namespace oficial carregado. */
  officialNamespacesLoaded: false;
  /** Sempre false — nenhum schema oficial carregado. */
  officialSchemasLoaded: false;
  /** Sempre false — parsing de schema desabilitado. */
  schemaParsingEnabled: false;
  /** Sempre false — validação de schema desabilitada. */
  schemaValidationEnabled: false;
  /** Sempre true — runtime estrutural pronto (sem XSD real). */
  runtimeReady: true;
  status: CanonicalXSDStatus;
  message?: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Estatísticas estruturais do XSD Runtime (in-process).
 */
export type CanonicalXSDStatistics = {
  kind: "canonical-xsd-statistics";
  totalResults: number;
  completedResults: number;
  failedResults: number;
  cancelledResults: number;
  preparedResults: number;
  officialXsdLoadedCount: 0;
  realXsdLoadedCount: 0;
  realValidationAvailableCount: 0;
  officialNamespacesLoadedCount: 0;
  officialSchemasLoadedCount: 0;
  schemaParsingEnabledCount: 0;
  schemaValidationEnabledCount: 0;
};

/**
 * Saúde canônica do provedor XSD Runtime.
 */
export type CanonicalXSDHealth = {
  kind: "canonical-xsd-health";
  ok: boolean;
  provider: string;
  latencyMs?: number;
  message?: string;
  status?: string;
  storedResultCount?: number;
  runtimeReady: true;
};

/**
 * Capacidades canônicas declaradas do provedor XSD Runtime.
 */
export type CanonicalXSDCapabilities = {
  kind: "canonical-xsd-capabilities";
  supportsPrepare: boolean;
  supportsGetResult: boolean;
  supportsListResults: boolean;
  supportsHealth: boolean;
  supportsCanonicalXsd: boolean;
  runtimeReady: true;
  officialXsdLoaded: false;
  realXsdLoaded: false;
  realValidationAvailable: false;
  officialNamespacesLoaded: false;
  officialSchemasLoaded: false;
  schemaParsingEnabled: false;
  schemaValidationEnabled: false;
  implementsOfficialXsd: false;
  implementsXsdValidation: false;
  implementsRealXmlValidation: false;
  implementsOperatorDispatch: false;
  implementsBusinessRules: false;
  knowsOperatorOrCooperative: false;
  knowsContract: false;
  knowsTenant: false;
  knowsTissPattern: false;
};
