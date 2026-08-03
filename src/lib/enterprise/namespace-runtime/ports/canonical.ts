/**
 * Modelos canônicos do Enterprise Namespace Runtime — TISS-10.
 *
 * Infraestrutura canônica de gerenciamento estrutural de namespaces XML futuros.
 * Sem namespace oficial. Sem namespaces ANS/TISS. Sem XML TISS/ANS.
 * Sem XSD oficial. Sem envelope de webservice. Sem operadoras/contratos/tenants.
 * Sem conhecimento de padrões TISS — apenas modelos estruturais desacoplados.
 */

/** Status estrutural de uma operação/resultado de Namespace Runtime canônico. */
export type CanonicalNamespaceStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "prepared"
  | "unknown"
  | (string & {});

/**
 * Versão canônica de um perfil/engine de namespace (estrutural — sem semântica ANS/TISS).
 */
export type CanonicalNamespaceVersion = {
  kind: "canonical-namespace-version";
  label?: string;
  major?: number;
  minor?: number;
  patch?: number;
  revision?: string;
};

/**
 * Metadata canônica de um pedido/resultado de Namespace Runtime.
 * Estrutural — sem semântica de operadora/contrato/tenant.
 */
export type CanonicalNamespaceMetadata = {
  kind: "canonical-namespace-metadata";
  sessionId?: string;
  correlationId?: string | null;
  channel?: string;
  source?: string;
  tags?: readonly string[];
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/**
 * Perfil canônico de Namespace Runtime (estrutural — sem perfil ANS/TISS oficial).
 */
export type CanonicalNamespaceProfile = {
  kind: "canonical-namespace-profile";
  profileId?: string;
  profileCode?: string;
  label?: string;
  notes?: string;
};

/**
 * Definição canônica estrutural (opaca — sem URI/namespace real / sem arquivo).
 */
export type CanonicalNamespaceDefinition = {
  kind: "canonical-namespace-definition";
  definitionId?: string;
  definitionCode?: string;
  label?: string;
  version?: CanonicalNamespaceVersion;
  notes?: string;
};

/**
 * Referência canônica a um pedido de Namespace Runtime (opaca — sem conteúdo namespace/XML).
 */
export type CanonicalNamespaceReference = {
  kind: "canonical-namespace-reference";
  namespaceId?: string;
  namespaceCode?: string;
  definitionId?: string;
  xsdResultId?: string;
  validationResultId?: string;
  schemaResultId?: string;
  serializeResultId?: string;
  generationResultId?: string;
  documentId?: string;
  uri?: string;
  digest?: string;
};

/**
 * Operação canônica do Namespace Runtime.
 */
export type CanonicalNamespaceOperation =
  | "prepare"
  | "get"
  | "list"
  | "health"
  | "capabilities"
  | (string & {});

/**
 * Pedido canônico de Namespace Runtime (TISS-10).
 * Não contém namespace oficial. Não contém payload TISS/ANS. Não conhece operadora/contrato/tenant.
 */
export type CanonicalNamespaceRuntimeRequest = {
  kind: "canonical-namespace-runtime-request";
  requestId?: string;
  namespaceId?: string;
  name?: string;
  version?: CanonicalNamespaceVersion;
  profile?: CanonicalNamespaceProfile;
  definition?: CanonicalNamespaceDefinition;
  reference?: CanonicalNamespaceReference;
  metadata?: CanonicalNamespaceMetadata;
  xsdResultId?: string;
  validationResultId?: string;
  schemaResultId?: string;
  serializeResultId?: string;
  generationResultId?: string;
  documentId?: string;
  structuralNotes?: string;
  operation?: CanonicalNamespaceOperation;
};

/**
 * Resultado canônico de operação de Namespace Runtime (TISS-10).
 * Contém apenas referência/estrutura canônica — nunca namespace oficial / XML TISS/ANS.
 * Nenhum namespace real é carregado nesta fundação.
 */
export type CanonicalNamespaceRuntimeResult = {
  kind: "canonical-namespace-runtime-result";
  ok: boolean;
  resultId: string;
  request: CanonicalNamespaceRuntimeRequest;
  profile?: CanonicalNamespaceProfile;
  definition?: CanonicalNamespaceDefinition;
  metadata?: CanonicalNamespaceMetadata;
  operation?: CanonicalNamespaceOperation;
  xsdResultId?: string;
  validationResultId?: string;
  schemaResultId?: string;
  serializeResultId?: string;
  generationResultId?: string;
  /** Sempre false — nenhum namespace oficial carregado nesta fundação. */
  officialNamespacesLoaded: false;
  /** Sempre false — nenhum namespace real carregado. */
  realNamespacesLoaded: false;
  /** Sempre false — resolução de namespace desabilitada. */
  namespaceResolutionEnabled: false;
  /** Sempre false — validação de namespace desabilitada. */
  namespaceValidationEnabled: false;
  /** Sempre false — nenhum namespace oficial ANS carregado. */
  officialAnsNamespacesLoaded: false;
  /** Sempre false — nenhum namespace oficial TISS carregado. */
  officialTissNamespacesLoaded: false;
  /** Sempre true — runtime estrutural pronto (sem namespace real). */
  runtimeReady: true;
  status: CanonicalNamespaceStatus;
  message?: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Estatísticas estruturais do Namespace Runtime (in-process).
 */
export type CanonicalNamespaceStatistics = {
  kind: "canonical-namespace-statistics";
  totalResults: number;
  completedResults: number;
  failedResults: number;
  cancelledResults: number;
  preparedResults: number;
  officialNamespacesLoadedCount: 0;
  realNamespacesLoadedCount: 0;
  namespaceResolutionEnabledCount: 0;
  namespaceValidationEnabledCount: 0;
  officialAnsNamespacesLoadedCount: 0;
  officialTissNamespacesLoadedCount: 0;
};

/**
 * Saúde canônica do provedor Namespace Runtime.
 */
export type CanonicalNamespaceHealth = {
  kind: "canonical-namespace-health";
  ok: boolean;
  provider: string;
  latencyMs?: number;
  message?: string;
  status?: string;
  storedResultCount?: number;
  runtimeReady: true;
};

/**
 * Capacidades canônicas declaradas do provedor Namespace Runtime.
 */
export type CanonicalNamespaceCapabilities = {
  kind: "canonical-namespace-capabilities";
  supportsPrepare: boolean;
  supportsGetResult: boolean;
  supportsListResults: boolean;
  supportsHealth: boolean;
  supportsCanonicalNamespace: boolean;
  runtimeReady: true;
  officialNamespacesLoaded: false;
  realNamespacesLoaded: false;
  namespaceResolutionEnabled: false;
  namespaceValidationEnabled: false;
  officialAnsNamespacesLoaded: false;
  officialTissNamespacesLoaded: false;
  implementsOfficialNamespaces: false;
  implementsNamespaceValidation: false;
  implementsRealNamespaceResolution: false;
  implementsOperatorDispatch: false;
  implementsBusinessRules: false;
  knowsOperatorOrCooperative: false;
  knowsContract: false;
  knowsTenant: false;
  knowsTissPattern: false;
};
