/**
 * Modelos can?nicos do Enterprise XML Validation Runtime ? TISS-08.
 *
 * Infraestrutura can?nica de valida??o XML estrutural.
 * Sem XSD oficial. Sem valida??o XSD real. Sem XML TISS/ANS.
 * Sem namespaces oficiais. Sem envelope de webservice. Sem operadoras/contratos/tenants.
 * Sem conhecimento de padr?es TISS ? apenas modelos estruturais desacoplados.
 */

/** Status estrutural de uma opera??o/resultado de valida??o can?nica. */
export type CanonicalXMLValidationStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "validated"
  | "unknown"
  | (string & {});

/**
 * Vers?o can?nica de um perfil/engine de valida??o (estrutural ? sem sem?ntica ANS/TISS).
 */
export type CanonicalXMLValidationVersion = {
  kind: "canonical-xml-validation-version";
  label?: string;
  major?: number;
  minor?: number;
  patch?: number;
  revision?: string;
};

/**
 * Metadata can?nica de um pedido/resultado de XML Validation.
 * Estrutural ? sem sem?ntica de operadora/contrato/tenant.
 */
export type CanonicalXMLValidationMetadata = {
  kind: "canonical-xml-validation-metadata";
  sessionId?: string;
  correlationId?: string | null;
  channel?: string;
  source?: string;
  tags?: readonly string[];
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/**
 * Perfil can?nico de XML Validation (estrutural ? sem perfil ANS/TISS oficial).
 */
export type CanonicalXMLValidationProfile = {
  kind: "canonical-xml-validation-profile";
  profileId?: string;
  profileCode?: string;
  label?: string;
  notes?: string;
};

/**
 * Issue can?nica de valida??o (estrutural ? sempre vazia nesta funda??o).
 */
export type CanonicalXMLValidationIssue = {
  kind: "canonical-xml-validation-issue";
  issueId?: string;
  code?: string;
  severity?: "info" | "warn" | "error" | (string & {});
  message?: string;
  path?: string;
};

/**
 * Sum?rio can?nico de uma opera??o de valida??o (estrutural).
 */
export type CanonicalXMLValidationSummary = {
  kind: "canonical-xml-validation-summary";
  issueCount: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  notes?: string;
};

/**
 * Refer?ncia can?nica a um pedido de XML Validation (opaca ? sem conte?do XSD/XML).
 */
export type CanonicalXMLValidationReference = {
  kind: "canonical-xml-validation-reference";
  validationId?: string;
  validationCode?: string;
  schemaResultId?: string;
  serializeResultId?: string;
  generationResultId?: string;
  documentId?: string;
  uri?: string;
  digest?: string;
};

/**
 * Opera??o can?nica do XML Validation Runtime.
 */
export type CanonicalXMLValidationOperation =
  | "validate"
  | "get"
  | "list"
  | "health"
  | "capabilities"
  | (string & {});

/**
 * Pedido can?nico de valida??o XML (TISS-08).
 * N?o cont?m XSD. N?o cont?m payload TISS/ANS. N?o conhece operadora/contrato/tenant.
 */
export type CanonicalXMLValidationRequest = {
  kind: "canonical-xml-validation-request";
  requestId?: string;
  validationId?: string;
  name?: string;
  version?: CanonicalXMLValidationVersion;
  profile?: CanonicalXMLValidationProfile;
  reference?: CanonicalXMLValidationReference;
  metadata?: CanonicalXMLValidationMetadata;
  schemaResultId?: string;
  serializeResultId?: string;
  generationResultId?: string;
  documentId?: string;
  structuralNotes?: string;
  operation?: CanonicalXMLValidationOperation;
};

/**
 * Resultado can?nico de opera??o de XML Validation (TISS-08).
 * Cont?m apenas refer?ncia/estrutura can?nica ? nunca XSD oficial / XML TISS/ANS.
 * Nenhuma valida??o real ? executada nesta funda??o.
 */
export type CanonicalXMLValidationResult = {
  kind: "canonical-xml-validation-result";
  ok: boolean;
  resultId: string;
  request: CanonicalXMLValidationRequest;
  profile?: CanonicalXMLValidationProfile;
  metadata?: CanonicalXMLValidationMetadata;
  operation?: CanonicalXMLValidationOperation;
  issues: readonly CanonicalXMLValidationIssue[];
  summary?: CanonicalXMLValidationSummary;
  schemaResultId?: string;
  serializeResultId?: string;
  generationResultId?: string;
  /** Sempre false ? nenhuma valida??o executada nesta funda??o. */
  validationExecuted: false;
  /** Sempre false ? nenhuma valida??o real realizada. */
  realValidationPerformed: false;
  /** Sempre false ? nenhum XSD oficial carregado. */
  officialXsdLoaded: false;
  /** Sempre false ? nenhuma valida??o ANS oficial. */
  officialAnsValidation: false;
  /** Sempre false ? nenhuma valida??o TISS oficial. */
  officialTissValidation: false;
  /** Sempre false ? nenhuma regra de valida??o carregada. */
  validationRulesLoaded: false;
  /** Sempre true ? engine estrutural pronto (sem valida??o real). */
  validationEngineReady: true;
  status: CanonicalXMLValidationStatus;
  message?: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Estat?sticas estruturais do XML Validation Runtime (in-process).
 */
export type CanonicalXMLValidationStatistics = {
  kind: "canonical-xml-validation-statistics";
  totalResults: number;
  completedResults: number;
  failedResults: number;
  cancelledResults: number;
  validatedResults: number;
  validationExecutedCount: 0;
  realValidationPerformedCount: 0;
  officialXsdLoadedCount: 0;
  officialAnsValidationCount: 0;
  officialTissValidationCount: 0;
  validationRulesLoadedCount: 0;
};

/**
 * Sa?de can?nica do provedor XML Validation Runtime.
 */
export type CanonicalXMLValidationHealth = {
  kind: "canonical-xml-validation-health";
  ok: boolean;
  provider: string;
  latencyMs?: number;
  message?: string;
  status?: string;
  storedResultCount?: number;
  validationEngineReady: true;
};

/**
 * Capacidades can?nicas declaradas do provedor XML Validation Runtime.
 */
export type CanonicalXMLValidationCapabilities = {
  kind: "canonical-xml-validation-capabilities";
  supportsValidate: boolean;
  supportsGetResult: boolean;
  supportsListResults: boolean;
  supportsHealth: boolean;
  supportsCanonicalValidation: boolean;
  validationEngineReady: true;
  implementsOfficialXsd: false;
  implementsXsdValidation: false;
  implementsRealXmlValidation: false;
  implementsOfficialTissValidation: false;
  implementsOfficialAnsValidation: false;
  implementsOperatorDispatch: false;
  implementsBusinessRules: false;
  knowsOperatorOrCooperative: false;
  knowsContract: false;
  knowsTenant: false;
  knowsTissPattern: false;
};
