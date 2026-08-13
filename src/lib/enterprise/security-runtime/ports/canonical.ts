/**
 * Modelos canônicos estruturais do Enterprise Security Runtime — S1-02.
 *
 * Foundation estrutural vendor-agnostic para segurança futura de documentos
 * médicos, guias TISS e dados extraídos.
 *
 * S1-02: infraestrutura canônica estrutural apenas. Sem segurança real.
 * Sem criptografia. Sem assinatura digital. Sem cadeia de custódia.
 * Sem Key Vault. Sem HSM. Sem SIEM. Sem OpenTelemetry. Sem LGPD.
 * Sem autenticação. Sem autorização. Sem persistência. Sem banco. Sem APIs.
 *
 * Todos os contratos abaixo são exclusivamente estruturais.
 */

/** Status estrutural de segurança (S1-02). */
export type SecurityStatus =
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

/** Tipos estruturais de segurança futura — somente contratos. */
export type SecurityTypeKind =
  | "technical"
  | "business"
  | "tiss"
  | "operator"
  | "quality"
  | "clinical"
  | "financial"
  | "compliance"
  | (string & {});

/** Contrato base estrutural de tipo de segurança (sem execução). */
export type SecurityTypeContract = {
  kind: "canonical-security-type-contract";
  securityType: SecurityTypeKind;
  status: SecurityStatus;
  label?: string;
  securityEngineImplemented: false;
  businessRulesImplemented: false;
  tissSecurityImplemented: false;
  operatorSecurityImplemented: false;
  automaticSecurityImplemented: false;
  securitySuggestionsImplemented: false;
  securityJustificationImplemented: false;
  securityScoreImplemented: false;
  complianceImplemented: false;
  automaticCorrectionImplemented: false;
};

/** TechnicalSecurity — contrato estrutural apenas. */
export type TechnicalSecurity = SecurityTypeContract & {
  securityType: "technical";
  structuralRole: "technical-security";
};

/** BusinessSecurity — contrato estrutural apenas. */
export type BusinessSecurity = SecurityTypeContract & {
  securityType: "business";
  structuralRole: "business-security";
};

/** TISSSecurity — contrato estrutural apenas. */
export type TISSSecurity = SecurityTypeContract & {
  securityType: "tiss";
  structuralRole: "tiss-security";
};

/** OperatorSecurity — contrato estrutural apenas. */
export type OperatorSecurity = SecurityTypeContract & {
  securityType: "operator";
  structuralRole: "operator-security";
};

/** QualitySecurity — contrato estrutural apenas. */
export type QualitySecurity = SecurityTypeContract & {
  securityType: "quality";
  structuralRole: "quality-security";
};

/** ClinicalSecurity — contrato estrutural apenas. */
export type ClinicalSecurity = SecurityTypeContract & {
  securityType: "clinical";
  structuralRole: "clinical-security";
};

/** FinancialSecurity — contrato estrutural apenas. */
export type FinancialSecurity = SecurityTypeContract & {
  securityType: "financial";
  structuralRole: "financial-security";
};

/** ComplianceSecurity — contrato estrutural apenas. */
export type ComplianceSecurity = SecurityTypeContract & {
  securityType: "compliance";
  structuralRole: "compliance-security";
};

/** União estrutural dos contratos de tipos de segurança. */
export type FutureSecurityTypeContract =
  | TechnicalSecurity
  | BusinessSecurity
  | TISSSecurity
  | OperatorSecurity
  | QualitySecurity
  | ClinicalSecurity
  | FinancialSecurity
  | ComplianceSecurity;

/**
 * SecurityContext canônico (S1-02).
 *
 * Capaz de receber futuramente metadados estruturais — sem qualquer processamento.
 */
export type SecurityContext = {
  kind: "canonical-security-context";
  jobId?: string;
  requestId?: string;
  findingId?: string;
  securityTypes?: readonly FutureSecurityTypeContract[];
  structuralNotes?: string;
};

/** Metadata canônica estrutural (S1-02). */
export type SecurityMetadata = {
  kind: "canonical-security-metadata";
  jobId?: string;
  requestId?: string;
  findingId?: string;
  correlationId?: string | null;
  channel?: string;
  tags?: readonly string[];
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
  securityContext?: SecurityContext;
};

/** Issue canônica estrutural — nunca produzida por motor real. */
export type SecurityIssue = {
  kind: "canonical-security-issue";
  issueId: string;
  code?: string;
  severity?: "info" | "warning" | "error" | "critical" | (string & {});
  message?: string;
  fieldPath?: string;
  securityType?: SecurityTypeKind;
  status: SecurityStatus;
  automaticSecurityImplemented: false;
  automaticCorrectionImplemented: false;
};

/** Finding canônica estrutural — nunca produzida por motor real. */
export type SecurityFinding = {
  kind: "canonical-security-finding";
  findingId: string;
  jobId?: string;
  requestId?: string;
  status: SecurityStatus;
  securityType?: SecurityTypeKind;
  issues?: readonly SecurityIssue[];
  metadata?: SecurityMetadata;
  securityContext?: SecurityContext;
  createdAt: string;
  updatedAt: string;
  securityEngineImplemented: false;
  automaticSecurityImplemented: false;
  securitySuggestionsImplemented: false;
  tissSecurityImplemented: false;
  operatorSecurityImplemented: false;
};

/** Recommendation canônica estrutural — nunca gerada automaticamente. */
export type SecurityRecommendation = {
  kind: "canonical-security-recommendation";
  recommendationId: string;
  findingId?: string;
  code?: string;
  message?: string;
  status: SecurityStatus;
  securitySuggestionsImplemented: false;
  automaticCorrectionImplemented: false;
};

/** Justification canônica estrutural — nunca gerada automaticamente. */
export type SecurityJustification = {
  kind: "canonical-security-justification";
  justificationId: string;
  findingId?: string;
  code?: string;
  message?: string;
  status: SecurityStatus;
  securityJustificationImplemented: false;
};

/** Score canônico estrutural — nunca calculado. */
export type SecurityScore = {
  kind: "canonical-security-score";
  scoreId: string;
  value?: number | null;
  band?: "unknown" | "low" | "medium" | "high" | (string & {});
  status: SecurityStatus;
  securityScoreImplemented: false;
};

/** Summary canônico estrutural. */
export type SecuritySummary = {
  kind: "canonical-security-summary";
  summaryId: string;
  totalFindings?: number;
  totalIssues?: number;
  totalRecommendations?: number;
  status: SecurityStatus;
  message?: string;
  securityEngineImplemented: false;
  automaticSecurityImplemented: false;
};

/** Request canônico estrutural de segurança (SecurityRequest). Nunca dispara segurança real. */
export type SecurityRequest = {
  kind: "canonical-security-request";
  requestId: string;
  jobId?: string;
  findingId?: string;
  status: SecurityStatus;
  metadata?: SecurityMetadata;
  securityContext?: SecurityContext;
  createdAt: string;
  updatedAt: string;
  securityEngineImplemented: false;
  businessRulesImplemented: false;
  tissSecurityImplemented: false;
  operatorSecurityImplemented: false;
  automaticSecurityImplemented: false;
  securitySuggestionsImplemented: false;
  securityJustificationImplemented: false;
  securityScoreImplemented: false;
  complianceImplemented: false;
  automaticCorrectionImplemented: false;
};

/** Job canônico estrutural de segurança. */
export type SecurityJob = {
  kind: "canonical-security-job";
  jobId: string;
  status: SecurityStatus;
  identity?: {
    kind: "canonical-security-identity";
    jobId?: string;
    correlationId?: string | null;
  };
  metadata?: SecurityMetadata;
  securityContext?: SecurityContext;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  securityEngineImplemented: false;
  businessRulesImplemented: false;
  tissSecurityImplemented: false;
  operatorSecurityImplemented: false;
  automaticSecurityImplemented: false;
  securitySuggestionsImplemented: false;
  securityJustificationImplemented: false;
  securityScoreImplemented: false;
  complianceImplemented: false;
  automaticCorrectionImplemented: false;
};

/** Operação canônica do Security Runtime (S1-02). */
export type CanonicalSecurityOperation =
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
 * Resultado canônico de execução do Security Runtime (S1-02).
 * Contém apenas referência/estrutura canônica — nunca segurança real.
 */
export type SecurityResult = {
  kind: "canonical-security-result";
  ok: boolean;
  resultId: string;
  operation: CanonicalSecurityOperation;
  job?: SecurityJob;
  request?: SecurityRequest;
  finding?: SecurityFinding;
  issues?: readonly SecurityIssue[];
  recommendations?: readonly SecurityRecommendation[];
  justification?: SecurityJustification;
  score?: SecurityScore;
  summary?: SecuritySummary;
  metadata?: SecurityMetadata;
  securityContext?: SecurityContext;
  securityEngineImplemented: false;
  businessRulesImplemented: false;
  tissSecurityImplemented: false;
  operatorSecurityImplemented: false;
  automaticSecurityImplemented: false;
  securitySuggestionsImplemented: false;
  securityJustificationImplemented: false;
  securityScoreImplemented: false;
  complianceImplemented: false;
  automaticCorrectionImplemented: false;
  /** Sempre true — runtime estrutural pronto (sem segurança real). */
  runtimeReady: true;
  status: SecurityStatus;
  messageText?: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
};

/** Estatísticas estruturais do Security Runtime (in-process). */
export type SecurityStatistics = {
  kind: "canonical-security-statistics";
  totalJobs: number;
  openJobs: number;
  closedJobs: number;
  totalRequests: number;
  totalFindings: number;
  totalResults: number;
  securityEngineImplementedCount: 0;
  businessRulesImplementedCount: 0;
  tissSecurityImplementedCount: 0;
  operatorSecurityImplementedCount: 0;
  automaticSecurityImplementedCount: 0;
  securitySuggestionsImplementedCount: 0;
  securityJustificationImplementedCount: 0;
  securityScoreImplementedCount: 0;
  complianceImplementedCount: 0;
  automaticCorrectionImplementedCount: 0;
};

/** Saúde canônica estrutural do provedor Security Runtime. */
export type SecurityHealth = {
  kind: "canonical-security-health";
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
  securityEngineImplemented: false;
  businessRulesImplemented: false;
  tissSecurityImplemented: false;
  operatorSecurityImplemented: false;
  automaticSecurityImplemented: false;
  securitySuggestionsImplemented: false;
  securityJustificationImplemented: false;
  securityScoreImplemented: false;
  complianceImplemented: false;
  automaticCorrectionImplemented: false;
};

/**
 * Capacidades canônicas declaradas do provedor Security Runtime.
 * Todas as flags `*Implemented` permanecem literalmente `false`.
 */
export type SecurityCapabilities = {
  kind: "canonical-security-capabilities";
  supportsOpenJob: boolean;
  supportsCloseJob: boolean;
  supportsSubmitRequest: boolean;
  supportsRegisterFinding: boolean;
  supportsGetResult: boolean;
  supportsStats: boolean;
  supportsHealth: boolean;
  supportsCanonicalSecurity: boolean;
  runtimeReady: true;
  securityEngineImplemented: false;
  businessRulesImplemented: false;
  tissSecurityImplemented: false;
  operatorSecurityImplemented: false;
  automaticSecurityImplemented: false;
  securitySuggestionsImplemented: false;
  securityJustificationImplemented: false;
  securityScoreImplemented: false;
  complianceImplemented: false;
  automaticCorrectionImplemented: false;
};

/** Helper estrutural — cria contrato de tipo de segurança desabilitado. */
export function createDisabledSecurityTypeContract(
  securityType: SecurityTypeKind,
  label: string,
): SecurityTypeContract {
  return {
    kind: "canonical-security-type-contract",
    securityType,
    status: "disabled",
    label,
    securityEngineImplemented: false,
    businessRulesImplemented: false,
    tissSecurityImplemented: false,
    operatorSecurityImplemented: false,
    automaticSecurityImplemented: false,
    securitySuggestionsImplemented: false,
    securityJustificationImplemented: false,
    securityScoreImplemented: false,
    complianceImplemented: false,
    automaticCorrectionImplemented: false,
  };
}
