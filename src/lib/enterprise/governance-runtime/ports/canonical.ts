/**
 * Modelos canônicos estruturais do Enterprise Governance Runtime — S6-02.
 *
 * Foundation estrutural vendor-agnostic para identidade futura de documentos
 * médicos, guias TISS e dados extraídos.
 *
 * S6-02: infraestrutura canônica estrutural apenas. Sem identidade real.
 * Sem criptografia. Sem assinatura digital. Sem cadeia de custódia.
 * Sem Key Vault. Sem HSM. Sem SIEM. Sem OpenTelemetry. Sem LGPD.
 * Sem autenticação. Sem autorização. Sem persistência. Sem banco. Sem APIs.
 *
 * Todos os contratos abaixo são exclusivamente estruturais.
 */

/** Status estrutural de identidade (S6-02). */
export type GovernanceStatus =
  | "pending"
  | "job-open"
  | "job-closed"
  | "submitted"
  | "registered"
  | "secured"
  | "processed"
  | "failed"
  | "disabled"
  | "unknown"
  | (string & {});

/** Tipos estruturais de identidade futura — somente contratos. */
export type GovernanceTypeKind =
  | "technical"
  | "business"
  | "tiss"
  | "operator"
  | "quality"
  | "clinical"
  | "financial"
  | "governance"
  | (string & {});

/** Contrato base estrutural de tipo de identidade (sem execução). */
export type GovernanceTypeContract = {
  kind: "canonical-governance-type-contract";
  governanceType: GovernanceTypeKind;
  status: GovernanceStatus;
  label?: string;
  governanceEngineImplemented: false;
  lgpdImplemented: false;
  privacyImplemented: false;
  dataClassificationImplemented: false;
  consentManagementImplemented: false;
  auditGovernanceImplemented: false;
  retentionImplemented: false;
  chainOfCustodyImplemented: false;
  digitalSignatureImplemented: false;
  encryptionImplemented: false;
  hsmImplemented: false;
  keyVaultImplemented: false;
  siemImplemented: false;
  openTelemetryImplemented: false;
  businessRulesImplemented: false;
  tissGovernanceImplemented: false;
  operatorGovernanceImplemented: false;
  automaticGovernanceImplemented: false;
  governanceSuggestionsImplemented: false;
  governanceJustificationImplemented: false;
  governanceScoreImplemented: false;
  governanceImplemented: false;
  automaticCorrectionImplemented: false;
};

/** TechnicalGovernance — contrato estrutural apenas. */
export type TechnicalGovernance = GovernanceTypeContract & {
  governanceType: "technical";
  structuralRole: "technical-governance";
};

/** BusinessGovernance — contrato estrutural apenas. */
export type BusinessGovernance = GovernanceTypeContract & {
  governanceType: "business";
  structuralRole: "business-governance";
};

/** TISSGovernance — contrato estrutural apenas. */
export type TISSGovernance = GovernanceTypeContract & {
  governanceType: "tiss";
  structuralRole: "tiss-governance";
};

/** OperatorGovernance — contrato estrutural apenas. */
export type OperatorGovernance = GovernanceTypeContract & {
  governanceType: "operator";
  structuralRole: "operator-governance";
};

/** QualityGovernance — contrato estrutural apenas. */
export type QualityGovernance = GovernanceTypeContract & {
  governanceType: "quality";
  structuralRole: "quality-governance";
};

/** ClinicalGovernance — contrato estrutural apenas. */
export type ClinicalGovernance = GovernanceTypeContract & {
  governanceType: "clinical";
  structuralRole: "clinical-governance";
};

/** FinancialGovernance — contrato estrutural apenas. */
export type FinancialGovernance = GovernanceTypeContract & {
  governanceType: "financial";
  structuralRole: "financial-governance";
};

/** GovernanceGovernance — contrato estrutural apenas. */
export type GovernanceGovernance = GovernanceTypeContract & {
  governanceType: "governance";
  structuralRole: "governance-governance";
};

/** União estrutural dos contratos de tipos de identidade. */
export type FutureGovernanceTypeContract =
  | TechnicalGovernance
  | BusinessGovernance
  | TISSGovernance
  | OperatorGovernance
  | QualityGovernance
  | ClinicalGovernance
  | FinancialGovernance
  | GovernanceGovernance;

/**
 * GovernanceContext canônico (S6-02).
 *
 * Capaz de receber futuramente metadados estruturais — sem qualquer processamento.
 */
export type GovernanceContext = {
  kind: "canonical-governance-context";
  jobId?: string;
  requestId?: string;
  findingId?: string;
  governanceTypes?: readonly FutureGovernanceTypeContract[];
  structuralNotes?: string;
};

/** Metadata canônica estrutural (S6-02). */
export type GovernanceMetadata = {
  kind: "canonical-governance-metadata";
  jobId?: string;
  requestId?: string;
  findingId?: string;
  correlationId?: string | null;
  channel?: string;
  tags?: readonly string[];
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
  governanceContext?: GovernanceContext;
};

/** Issue canônica estrutural — nunca produzida por motor real. */
export type GovernanceIssue = {
  kind: "canonical-governance-issue";
  issueId: string;
  code?: string;
  severity?: "info" | "warning" | "error" | "critical" | (string & {});
  message?: string;
  fieldPath?: string;
  governanceType?: GovernanceTypeKind;
  status: GovernanceStatus;
  automaticGovernanceImplemented: false;
  automaticCorrectionImplemented: false;
};

/** Finding canônica estrutural — nunca produzida por motor real. */
export type GovernanceFinding = {
  kind: "canonical-governance-finding";
  findingId: string;
  jobId?: string;
  requestId?: string;
  status: GovernanceStatus;
  governanceType?: GovernanceTypeKind;
  issues?: readonly GovernanceIssue[];
  metadata?: GovernanceMetadata;
  governanceContext?: GovernanceContext;
  createdAt: string;
  updatedAt: string;
  governanceEngineImplemented: false;
  lgpdImplemented: false;
  privacyImplemented: false;
  dataClassificationImplemented: false;
  consentManagementImplemented: false;
  auditGovernanceImplemented: false;
  retentionImplemented: false;
  chainOfCustodyImplemented: false;
  digitalSignatureImplemented: false;
  encryptionImplemented: false;
  hsmImplemented: false;
  keyVaultImplemented: false;
  siemImplemented: false;
  openTelemetryImplemented: false;
  automaticGovernanceImplemented: false;
  governanceSuggestionsImplemented: false;
  tissGovernanceImplemented: false;
  operatorGovernanceImplemented: false;
};

/** Recommendation canônica estrutural — nunca gerada automaticamente. */
export type GovernanceRecommendation = {
  kind: "canonical-governance-recommendation";
  recommendationId: string;
  findingId?: string;
  code?: string;
  message?: string;
  status: GovernanceStatus;
  governanceSuggestionsImplemented: false;
  automaticCorrectionImplemented: false;
};

/** Justification canônica estrutural — nunca gerada automaticamente. */
export type GovernanceJustification = {
  kind: "canonical-governance-justification";
  justificationId: string;
  findingId?: string;
  code?: string;
  message?: string;
  status: GovernanceStatus;
  governanceJustificationImplemented: false;
};

/** Score canônico estrutural — nunca calculado. */
export type GovernanceScore = {
  kind: "canonical-governance-score";
  scoreId: string;
  value?: number | null;
  band?: "unknown" | "low" | "medium" | "high" | (string & {});
  status: GovernanceStatus;
  governanceScoreImplemented: false;
};

/** Summary canônico estrutural. */
export type GovernanceSummary = {
  kind: "canonical-governance-summary";
  summaryId: string;
  totalFindings?: number;
  totalIssues?: number;
  totalRecommendations?: number;
  status: GovernanceStatus;
  message?: string;
  governanceEngineImplemented: false;
  lgpdImplemented: false;
  privacyImplemented: false;
  dataClassificationImplemented: false;
  consentManagementImplemented: false;
  auditGovernanceImplemented: false;
  retentionImplemented: false;
  chainOfCustodyImplemented: false;
  digitalSignatureImplemented: false;
  encryptionImplemented: false;
  hsmImplemented: false;
  keyVaultImplemented: false;
  siemImplemented: false;
  openTelemetryImplemented: false;
  automaticGovernanceImplemented: false;
};

/** Request canônico estrutural de identidade (GovernanceRequest). Nunca dispara identidade real. */
export type GovernanceRequest = {
  kind: "canonical-governance-request";
  requestId: string;
  jobId?: string;
  findingId?: string;
  status: GovernanceStatus;
  metadata?: GovernanceMetadata;
  governanceContext?: GovernanceContext;
  createdAt: string;
  updatedAt: string;
  governanceEngineImplemented: false;
  lgpdImplemented: false;
  privacyImplemented: false;
  dataClassificationImplemented: false;
  consentManagementImplemented: false;
  auditGovernanceImplemented: false;
  retentionImplemented: false;
  chainOfCustodyImplemented: false;
  digitalSignatureImplemented: false;
  encryptionImplemented: false;
  hsmImplemented: false;
  keyVaultImplemented: false;
  siemImplemented: false;
  openTelemetryImplemented: false;
  businessRulesImplemented: false;
  tissGovernanceImplemented: false;
  operatorGovernanceImplemented: false;
  automaticGovernanceImplemented: false;
  governanceSuggestionsImplemented: false;
  governanceJustificationImplemented: false;
  governanceScoreImplemented: false;
  governanceImplemented: false;
  automaticCorrectionImplemented: false;
};

/** Job canônico estrutural de identidade. */
export type GovernanceJob = {
  kind: "canonical-governance-job";
  jobId: string;
  status: GovernanceStatus;
  identity?: {
    kind: "canonical-governance-identity";
    jobId?: string;
    correlationId?: string | null;
  };
  metadata?: GovernanceMetadata;
  governanceContext?: GovernanceContext;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  governanceEngineImplemented: false;
  lgpdImplemented: false;
  privacyImplemented: false;
  dataClassificationImplemented: false;
  consentManagementImplemented: false;
  auditGovernanceImplemented: false;
  retentionImplemented: false;
  chainOfCustodyImplemented: false;
  digitalSignatureImplemented: false;
  encryptionImplemented: false;
  hsmImplemented: false;
  keyVaultImplemented: false;
  siemImplemented: false;
  openTelemetryImplemented: false;
  businessRulesImplemented: false;
  tissGovernanceImplemented: false;
  operatorGovernanceImplemented: false;
  automaticGovernanceImplemented: false;
  governanceSuggestionsImplemented: false;
  governanceJustificationImplemented: false;
  governanceScoreImplemented: false;
  governanceImplemented: false;
  automaticCorrectionImplemented: false;
};

/** Operação canônica do Governance Runtime (S6-02). */
export type CanonicalGovernanceOperation =
  | "openJob"
  | "closeJob"
  | "submitRequest"
  | "registerFinding"
  | "getResult"
  | "stats"
  | "health"
  | "capabilities"
  | "providerInfo"
  | (string & {});

/**
 * Resultado canônico de execução do Governance Runtime (S6-02).
 * Contém apenas referência/estrutura canônica — nunca identidade real.
 */
export type GovernanceResult = {
  kind: "canonical-governance-result";
  ok: boolean;
  resultId: string;
  operation: CanonicalGovernanceOperation;
  job?: GovernanceJob;
  request?: GovernanceRequest;
  finding?: GovernanceFinding;
  issues?: readonly GovernanceIssue[];
  recommendations?: readonly GovernanceRecommendation[];
  justification?: GovernanceJustification;
  score?: GovernanceScore;
  summary?: GovernanceSummary;
  metadata?: GovernanceMetadata;
  governanceContext?: GovernanceContext;
  governanceEngineImplemented: false;
  lgpdImplemented: false;
  privacyImplemented: false;
  dataClassificationImplemented: false;
  consentManagementImplemented: false;
  auditGovernanceImplemented: false;
  retentionImplemented: false;
  chainOfCustodyImplemented: false;
  digitalSignatureImplemented: false;
  encryptionImplemented: false;
  hsmImplemented: false;
  keyVaultImplemented: false;
  siemImplemented: false;
  openTelemetryImplemented: false;
  businessRulesImplemented: false;
  tissGovernanceImplemented: false;
  operatorGovernanceImplemented: false;
  automaticGovernanceImplemented: false;
  governanceSuggestionsImplemented: false;
  governanceJustificationImplemented: false;
  governanceScoreImplemented: false;
  governanceImplemented: false;
  automaticCorrectionImplemented: false;
  /** Sempre true — runtime estrutural pronto (sem identidade real). */
  runtimeReady: true;
  status: GovernanceStatus;
  messageText?: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
};

/** Estatísticas estruturais do Governance Runtime (in-process). */
export type GovernanceStatistics = {
  kind: "canonical-governance-statistics";
  totalJobs: number;
  openJobs: number;
  closedJobs: number;
  totalRequests: number;
  totalFindings: number;
  totalResults: number;
  governanceEngineImplementedCount: 0;
  businessRulesImplementedCount: 0;
  tissGovernanceImplementedCount: 0;
  operatorGovernanceImplementedCount: 0;
  automaticGovernanceImplementedCount: 0;
  governanceSuggestionsImplementedCount: 0;
  governanceJustificationImplementedCount: 0;
  governanceScoreImplementedCount: 0;
  governanceImplementedCount: 0;
  automaticCorrectionImplementedCount: 0;
};

/** Saúde canônica estrutural do provedor Governance Runtime. */
export type GovernanceHealth = {
  kind: "canonical-governance-health";
  ok: boolean;
  provider: string;
  latencyMs?: number;
  message?: string;
  status?: string;
  storedJobCount?: number;
  storedRequestCount?: number;
  storedFindingCount?: number;
  storedResultCount?: number;
  runtimeReady: true;
  governanceEngineImplemented: false;
  lgpdImplemented: false;
  privacyImplemented: false;
  dataClassificationImplemented: false;
  consentManagementImplemented: false;
  auditGovernanceImplemented: false;
  retentionImplemented: false;
  chainOfCustodyImplemented: false;
  digitalSignatureImplemented: false;
  encryptionImplemented: false;
  hsmImplemented: false;
  keyVaultImplemented: false;
  siemImplemented: false;
  openTelemetryImplemented: false;
  businessRulesImplemented: false;
  tissGovernanceImplemented: false;
  operatorGovernanceImplemented: false;
  automaticGovernanceImplemented: false;
  governanceSuggestionsImplemented: false;
  governanceJustificationImplemented: false;
  governanceScoreImplemented: false;
  governanceImplemented: false;
  automaticCorrectionImplemented: false;
};

/**
 * Capacidades canônicas declaradas do provedor Governance Runtime.
 * Todas as flags `*Implemented` permanecem literalmente `false`.
 */
export type GovernanceCapabilities = {
  kind: "canonical-governance-capabilities";
  supportsOpenJob: boolean;
  supportsCloseJob: boolean;
  supportsSubmitRequest: boolean;
  supportsRegisterFinding: boolean;
  supportsGetResult: boolean;
  supportsStats: boolean;
  supportsHealth: boolean;
  supportsCanonicalGovernance: boolean;
  runtimeReady: true;
  governanceEngineImplemented: false;
  lgpdImplemented: false;
  privacyImplemented: false;
  dataClassificationImplemented: false;
  consentManagementImplemented: false;
  auditGovernanceImplemented: false;
  retentionImplemented: false;
  chainOfCustodyImplemented: false;
  digitalSignatureImplemented: false;
  encryptionImplemented: false;
  hsmImplemented: false;
  keyVaultImplemented: false;
  siemImplemented: false;
  openTelemetryImplemented: false;
  businessRulesImplemented: false;
  tissGovernanceImplemented: false;
  operatorGovernanceImplemented: false;
  automaticGovernanceImplemented: false;
  governanceSuggestionsImplemented: false;
  governanceJustificationImplemented: false;
  governanceScoreImplemented: false;
  governanceImplemented: false;
  automaticCorrectionImplemented: false;
};

/** GovernanceStrategy — contrato estrutural de estratégia de autorização (S6-02). */
export type GovernanceStrategy = {
  kind: "canonical-governance-strategy";
  strategyId: string;
  label?: string;
  status?: GovernanceStatus;
  governanceEngineImplemented: false;
  lgpdImplemented: false;
  privacyImplemented: false;
  dataClassificationImplemented: false;
  consentManagementImplemented: false;
  auditGovernanceImplemented: false;
  retentionImplemented: false;
  chainOfCustodyImplemented: false;
  digitalSignatureImplemented: false;
  encryptionImplemented: false;
  hsmImplemented: false;
  keyVaultImplemented: false;
  siemImplemented: false;
  openTelemetryImplemented: false;
};

/** GovernancePolicy — contrato estrutural de política de autorização (S6-02). */
export type GovernancePolicy = {
  kind: "canonical-governance-policy";
  policyId: string;
  label?: string;
  status?: GovernanceStatus;
  governanceEngineImplemented: false;
  lgpdImplemented: false;
  privacyImplemented: false;
  dataClassificationImplemented: false;
  consentManagementImplemented: false;
  auditGovernanceImplemented: false;
  retentionImplemented: false;
  chainOfCustodyImplemented: false;
  digitalSignatureImplemented: false;
  encryptionImplemented: false;
  hsmImplemented: false;
  keyVaultImplemented: false;
  siemImplemented: false;
  openTelemetryImplemented: false;
};

/** Helper estrutural — cria contrato de tipo de identidade desabilitado. */
export function createDisabledGovernanceTypeContract(
  governanceType: GovernanceTypeKind,
  label: string,
): GovernanceTypeContract {
  return {
    kind: "canonical-governance-type-contract",
    governanceType,
    status: "disabled",
    label,
    governanceEngineImplemented: false,
    lgpdImplemented: false,
    privacyImplemented: false,
    dataClassificationImplemented: false,
    consentManagementImplemented: false,
    auditGovernanceImplemented: false,
    retentionImplemented: false,
    chainOfCustodyImplemented: false,
    digitalSignatureImplemented: false,
    encryptionImplemented: false,
    hsmImplemented: false,
    keyVaultImplemented: false,
    siemImplemented: false,
    openTelemetryImplemented: false,
    businessRulesImplemented: false,
    tissGovernanceImplemented: false,
    operatorGovernanceImplemented: false,
    automaticGovernanceImplemented: false,
    governanceSuggestionsImplemented: false,
    governanceJustificationImplemented: false,
    governanceScoreImplemented: false,
    governanceImplemented: false,
    automaticCorrectionImplemented: false,
  };
}
