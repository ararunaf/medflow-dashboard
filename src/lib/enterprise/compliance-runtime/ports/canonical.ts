/**
 * Modelos canônicos estruturais do Enterprise Compliance Runtime — S3-02.
 *
 * Foundation estrutural vendor-agnostic para identidade futura de documentos
 * médicos, guias TISS e dados extraídos.
 *
 * S3-02: infraestrutura canônica estrutural apenas. Sem identidade real.
 * Sem criptografia. Sem assinatura digital. Sem cadeia de custódia.
 * Sem Key Vault. Sem HSM. Sem SIEM. Sem OpenTelemetry. Sem LGPD.
 * Sem autenticação. Sem autorização. Sem persistência. Sem banco. Sem APIs.
 *
 * Todos os contratos abaixo são exclusivamente estruturais.
 */

/** Status estrutural de identidade (S3-02). */
export type ComplianceStatus =
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
export type ComplianceTypeKind =
  | "technical"
  | "business"
  | "tiss"
  | "operator"
  | "quality"
  | "clinical"
  | "financial"
  | "compliance"
  | (string & {});

/** Contrato base estrutural de tipo de identidade (sem execução). */
export type ComplianceTypeContract = {
  kind: "canonical-compliance-type-contract";
  complianceType: ComplianceTypeKind;
  status: ComplianceStatus;
  label?: string;
  complianceEngineImplemented: false;
  lgpdImplemented: false;
  privacyImplemented: false;
  dataClassificationImplemented: false;
  consentManagementImplemented: false;
  auditComplianceImplemented: false;
  retentionImplemented: false;
  chainOfCustodyImplemented: false;
  digitalSignatureImplemented: false;
  encryptionImplemented: false;
  hsmImplemented: false;
  keyVaultImplemented: false;
  siemImplemented: false;
  openTelemetryImplemented: false;
  businessRulesImplemented: false;
  tissComplianceImplemented: false;
  operatorComplianceImplemented: false;
  automaticComplianceImplemented: false;
  complianceSuggestionsImplemented: false;
  complianceJustificationImplemented: false;
  complianceScoreImplemented: false;
  complianceImplemented: false;
  automaticCorrectionImplemented: false;
};

/** TechnicalCompliance — contrato estrutural apenas. */
export type TechnicalCompliance = ComplianceTypeContract & {
  complianceType: "technical";
  structuralRole: "technical-compliance";
};

/** BusinessCompliance — contrato estrutural apenas. */
export type BusinessCompliance = ComplianceTypeContract & {
  complianceType: "business";
  structuralRole: "business-compliance";
};

/** TISSCompliance — contrato estrutural apenas. */
export type TISSCompliance = ComplianceTypeContract & {
  complianceType: "tiss";
  structuralRole: "tiss-compliance";
};

/** OperatorCompliance — contrato estrutural apenas. */
export type OperatorCompliance = ComplianceTypeContract & {
  complianceType: "operator";
  structuralRole: "operator-compliance";
};

/** QualityCompliance — contrato estrutural apenas. */
export type QualityCompliance = ComplianceTypeContract & {
  complianceType: "quality";
  structuralRole: "quality-compliance";
};

/** ClinicalCompliance — contrato estrutural apenas. */
export type ClinicalCompliance = ComplianceTypeContract & {
  complianceType: "clinical";
  structuralRole: "clinical-compliance";
};

/** FinancialCompliance — contrato estrutural apenas. */
export type FinancialCompliance = ComplianceTypeContract & {
  complianceType: "financial";
  structuralRole: "financial-compliance";
};

/** ComplianceCompliance — contrato estrutural apenas. */
export type ComplianceCompliance = ComplianceTypeContract & {
  complianceType: "compliance";
  structuralRole: "compliance-compliance";
};

/** União estrutural dos contratos de tipos de identidade. */
export type FutureComplianceTypeContract =
  | TechnicalCompliance
  | BusinessCompliance
  | TISSCompliance
  | OperatorCompliance
  | QualityCompliance
  | ClinicalCompliance
  | FinancialCompliance
  | ComplianceCompliance;

/**
 * ComplianceContext canônico (S3-02).
 *
 * Capaz de receber futuramente metadados estruturais — sem qualquer processamento.
 */
export type ComplianceContext = {
  kind: "canonical-compliance-context";
  jobId?: string;
  requestId?: string;
  findingId?: string;
  complianceTypes?: readonly FutureComplianceTypeContract[];
  structuralNotes?: string;
};

/** Metadata canônica estrutural (S3-02). */
export type ComplianceMetadata = {
  kind: "canonical-compliance-metadata";
  jobId?: string;
  requestId?: string;
  findingId?: string;
  correlationId?: string | null;
  channel?: string;
  tags?: readonly string[];
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
  complianceContext?: ComplianceContext;
};

/** Issue canônica estrutural — nunca produzida por motor real. */
export type ComplianceIssue = {
  kind: "canonical-compliance-issue";
  issueId: string;
  code?: string;
  severity?: "info" | "warning" | "error" | "critical" | (string & {});
  message?: string;
  fieldPath?: string;
  complianceType?: ComplianceTypeKind;
  status: ComplianceStatus;
  automaticComplianceImplemented: false;
  automaticCorrectionImplemented: false;
};

/** Finding canônica estrutural — nunca produzida por motor real. */
export type ComplianceFinding = {
  kind: "canonical-compliance-finding";
  findingId: string;
  jobId?: string;
  requestId?: string;
  status: ComplianceStatus;
  complianceType?: ComplianceTypeKind;
  issues?: readonly ComplianceIssue[];
  metadata?: ComplianceMetadata;
  complianceContext?: ComplianceContext;
  createdAt: string;
  updatedAt: string;
  complianceEngineImplemented: false;
  lgpdImplemented: false;
  privacyImplemented: false;
  dataClassificationImplemented: false;
  consentManagementImplemented: false;
  auditComplianceImplemented: false;
  retentionImplemented: false;
  chainOfCustodyImplemented: false;
  digitalSignatureImplemented: false;
  encryptionImplemented: false;
  hsmImplemented: false;
  keyVaultImplemented: false;
  siemImplemented: false;
  openTelemetryImplemented: false;
  automaticComplianceImplemented: false;
  complianceSuggestionsImplemented: false;
  tissComplianceImplemented: false;
  operatorComplianceImplemented: false;
};

/** Recommendation canônica estrutural — nunca gerada automaticamente. */
export type ComplianceRecommendation = {
  kind: "canonical-compliance-recommendation";
  recommendationId: string;
  findingId?: string;
  code?: string;
  message?: string;
  status: ComplianceStatus;
  complianceSuggestionsImplemented: false;
  automaticCorrectionImplemented: false;
};

/** Justification canônica estrutural — nunca gerada automaticamente. */
export type ComplianceJustification = {
  kind: "canonical-compliance-justification";
  justificationId: string;
  findingId?: string;
  code?: string;
  message?: string;
  status: ComplianceStatus;
  complianceJustificationImplemented: false;
};

/** Score canônico estrutural — nunca calculado. */
export type ComplianceScore = {
  kind: "canonical-compliance-score";
  scoreId: string;
  value?: number | null;
  band?: "unknown" | "low" | "medium" | "high" | (string & {});
  status: ComplianceStatus;
  complianceScoreImplemented: false;
};

/** Summary canônico estrutural. */
export type ComplianceSummary = {
  kind: "canonical-compliance-summary";
  summaryId: string;
  totalFindings?: number;
  totalIssues?: number;
  totalRecommendations?: number;
  status: ComplianceStatus;
  message?: string;
  complianceEngineImplemented: false;
  lgpdImplemented: false;
  privacyImplemented: false;
  dataClassificationImplemented: false;
  consentManagementImplemented: false;
  auditComplianceImplemented: false;
  retentionImplemented: false;
  chainOfCustodyImplemented: false;
  digitalSignatureImplemented: false;
  encryptionImplemented: false;
  hsmImplemented: false;
  keyVaultImplemented: false;
  siemImplemented: false;
  openTelemetryImplemented: false;
  automaticComplianceImplemented: false;
};

/** Request canônico estrutural de identidade (ComplianceRequest). Nunca dispara identidade real. */
export type ComplianceRequest = {
  kind: "canonical-compliance-request";
  requestId: string;
  jobId?: string;
  findingId?: string;
  status: ComplianceStatus;
  metadata?: ComplianceMetadata;
  complianceContext?: ComplianceContext;
  createdAt: string;
  updatedAt: string;
  complianceEngineImplemented: false;
  lgpdImplemented: false;
  privacyImplemented: false;
  dataClassificationImplemented: false;
  consentManagementImplemented: false;
  auditComplianceImplemented: false;
  retentionImplemented: false;
  chainOfCustodyImplemented: false;
  digitalSignatureImplemented: false;
  encryptionImplemented: false;
  hsmImplemented: false;
  keyVaultImplemented: false;
  siemImplemented: false;
  openTelemetryImplemented: false;
  businessRulesImplemented: false;
  tissComplianceImplemented: false;
  operatorComplianceImplemented: false;
  automaticComplianceImplemented: false;
  complianceSuggestionsImplemented: false;
  complianceJustificationImplemented: false;
  complianceScoreImplemented: false;
  complianceImplemented: false;
  automaticCorrectionImplemented: false;
};

/** Job canônico estrutural de identidade. */
export type ComplianceJob = {
  kind: "canonical-compliance-job";
  jobId: string;
  status: ComplianceStatus;
  identity?: {
    kind: "canonical-compliance-identity";
    jobId?: string;
    correlationId?: string | null;
  };
  metadata?: ComplianceMetadata;
  complianceContext?: ComplianceContext;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  complianceEngineImplemented: false;
  lgpdImplemented: false;
  privacyImplemented: false;
  dataClassificationImplemented: false;
  consentManagementImplemented: false;
  auditComplianceImplemented: false;
  retentionImplemented: false;
  chainOfCustodyImplemented: false;
  digitalSignatureImplemented: false;
  encryptionImplemented: false;
  hsmImplemented: false;
  keyVaultImplemented: false;
  siemImplemented: false;
  openTelemetryImplemented: false;
  businessRulesImplemented: false;
  tissComplianceImplemented: false;
  operatorComplianceImplemented: false;
  automaticComplianceImplemented: false;
  complianceSuggestionsImplemented: false;
  complianceJustificationImplemented: false;
  complianceScoreImplemented: false;
  complianceImplemented: false;
  automaticCorrectionImplemented: false;
};

/** Operação canônica do Compliance Runtime (S3-02). */
export type CanonicalComplianceOperation =
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
 * Resultado canônico de execução do Compliance Runtime (S3-02).
 * Contém apenas referência/estrutura canônica — nunca identidade real.
 */
export type ComplianceResult = {
  kind: "canonical-compliance-result";
  ok: boolean;
  resultId: string;
  operation: CanonicalComplianceOperation;
  job?: ComplianceJob;
  request?: ComplianceRequest;
  finding?: ComplianceFinding;
  issues?: readonly ComplianceIssue[];
  recommendations?: readonly ComplianceRecommendation[];
  justification?: ComplianceJustification;
  score?: ComplianceScore;
  summary?: ComplianceSummary;
  metadata?: ComplianceMetadata;
  complianceContext?: ComplianceContext;
  complianceEngineImplemented: false;
  lgpdImplemented: false;
  privacyImplemented: false;
  dataClassificationImplemented: false;
  consentManagementImplemented: false;
  auditComplianceImplemented: false;
  retentionImplemented: false;
  chainOfCustodyImplemented: false;
  digitalSignatureImplemented: false;
  encryptionImplemented: false;
  hsmImplemented: false;
  keyVaultImplemented: false;
  siemImplemented: false;
  openTelemetryImplemented: false;
  businessRulesImplemented: false;
  tissComplianceImplemented: false;
  operatorComplianceImplemented: false;
  automaticComplianceImplemented: false;
  complianceSuggestionsImplemented: false;
  complianceJustificationImplemented: false;
  complianceScoreImplemented: false;
  complianceImplemented: false;
  automaticCorrectionImplemented: false;
  /** Sempre true — runtime estrutural pronto (sem identidade real). */
  runtimeReady: true;
  status: ComplianceStatus;
  messageText?: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
};

/** Estatísticas estruturais do Compliance Runtime (in-process). */
export type ComplianceStatistics = {
  kind: "canonical-compliance-statistics";
  totalJobs: number;
  openJobs: number;
  closedJobs: number;
  totalRequests: number;
  totalFindings: number;
  totalResults: number;
  complianceEngineImplementedCount: 0;
  businessRulesImplementedCount: 0;
  tissComplianceImplementedCount: 0;
  operatorComplianceImplementedCount: 0;
  automaticComplianceImplementedCount: 0;
  complianceSuggestionsImplementedCount: 0;
  complianceJustificationImplementedCount: 0;
  complianceScoreImplementedCount: 0;
  complianceImplementedCount: 0;
  automaticCorrectionImplementedCount: 0;
};

/** Saúde canônica estrutural do provedor Compliance Runtime. */
export type ComplianceHealth = {
  kind: "canonical-compliance-health";
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
  complianceEngineImplemented: false;
  lgpdImplemented: false;
  privacyImplemented: false;
  dataClassificationImplemented: false;
  consentManagementImplemented: false;
  auditComplianceImplemented: false;
  retentionImplemented: false;
  chainOfCustodyImplemented: false;
  digitalSignatureImplemented: false;
  encryptionImplemented: false;
  hsmImplemented: false;
  keyVaultImplemented: false;
  siemImplemented: false;
  openTelemetryImplemented: false;
  businessRulesImplemented: false;
  tissComplianceImplemented: false;
  operatorComplianceImplemented: false;
  automaticComplianceImplemented: false;
  complianceSuggestionsImplemented: false;
  complianceJustificationImplemented: false;
  complianceScoreImplemented: false;
  complianceImplemented: false;
  automaticCorrectionImplemented: false;
};

/**
 * Capacidades canônicas declaradas do provedor Compliance Runtime.
 * Todas as flags `*Implemented` permanecem literalmente `false`.
 */
export type ComplianceCapabilities = {
  kind: "canonical-compliance-capabilities";
  supportsOpenJob: boolean;
  supportsCloseJob: boolean;
  supportsSubmitRequest: boolean;
  supportsRegisterFinding: boolean;
  supportsGetResult: boolean;
  supportsStats: boolean;
  supportsHealth: boolean;
  supportsCanonicalCompliance: boolean;
  runtimeReady: true;
  complianceEngineImplemented: false;
  lgpdImplemented: false;
  privacyImplemented: false;
  dataClassificationImplemented: false;
  consentManagementImplemented: false;
  auditComplianceImplemented: false;
  retentionImplemented: false;
  chainOfCustodyImplemented: false;
  digitalSignatureImplemented: false;
  encryptionImplemented: false;
  hsmImplemented: false;
  keyVaultImplemented: false;
  siemImplemented: false;
  openTelemetryImplemented: false;
  businessRulesImplemented: false;
  tissComplianceImplemented: false;
  operatorComplianceImplemented: false;
  automaticComplianceImplemented: false;
  complianceSuggestionsImplemented: false;
  complianceJustificationImplemented: false;
  complianceScoreImplemented: false;
  complianceImplemented: false;
  automaticCorrectionImplemented: false;
};

/** ComplianceStrategy — contrato estrutural de estratégia de autorização (S3-02). */
export type ComplianceStrategy = {
  kind: "canonical-compliance-strategy";
  strategyId: string;
  label?: string;
  status?: ComplianceStatus;
  complianceEngineImplemented: false;
  lgpdImplemented: false;
  privacyImplemented: false;
  dataClassificationImplemented: false;
  consentManagementImplemented: false;
  auditComplianceImplemented: false;
  retentionImplemented: false;
  chainOfCustodyImplemented: false;
  digitalSignatureImplemented: false;
  encryptionImplemented: false;
  hsmImplemented: false;
  keyVaultImplemented: false;
  siemImplemented: false;
  openTelemetryImplemented: false;
};

/** CompliancePolicy — contrato estrutural de política de autorização (S3-02). */
export type CompliancePolicy = {
  kind: "canonical-compliance-policy";
  policyId: string;
  label?: string;
  status?: ComplianceStatus;
  complianceEngineImplemented: false;
  lgpdImplemented: false;
  privacyImplemented: false;
  dataClassificationImplemented: false;
  consentManagementImplemented: false;
  auditComplianceImplemented: false;
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
export function createDisabledComplianceTypeContract(
  complianceType: ComplianceTypeKind,
  label: string,
): ComplianceTypeContract {
  return {
    kind: "canonical-compliance-type-contract",
    complianceType,
    status: "disabled",
    label,
    complianceEngineImplemented: false,
    lgpdImplemented: false,
    privacyImplemented: false,
    dataClassificationImplemented: false,
    consentManagementImplemented: false,
    auditComplianceImplemented: false,
    retentionImplemented: false,
    chainOfCustodyImplemented: false,
    digitalSignatureImplemented: false,
    encryptionImplemented: false,
    hsmImplemented: false,
    keyVaultImplemented: false,
    siemImplemented: false,
    openTelemetryImplemented: false,
    businessRulesImplemented: false,
    tissComplianceImplemented: false,
    operatorComplianceImplemented: false,
    automaticComplianceImplemented: false,
    complianceSuggestionsImplemented: false,
    complianceJustificationImplemented: false,
    complianceScoreImplemented: false,
    complianceImplemented: false,
    automaticCorrectionImplemented: false,
  };
}
