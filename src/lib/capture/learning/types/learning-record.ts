/**
 * Modelo LearningRecord — Learning Loop.
 * MEDICFLOW-LEARNING-LOOP-01
 */

export const LEARNING_ACTIONS = ["accept", "edit", "reject"] as const;
export type LearningAction = (typeof LEARNING_ACTIONS)[number];

export type LearningRecord = {
  learningId: string;
  sessionId: string;
  proposalId: string;
  ruleId: string;
  field: string;
  action: LearningAction;
  originalValue: string | null;
  suggestedValue: string | null;
  finalValue: string | null;
  confidence: number;
  accepted: boolean;
  edited: boolean;
  rejected: boolean;
  /** Tempo em ms entre geração da proposta e decisão do usuário */
  timeToDecisionMs?: number;
  timestamp: string;
};

export type LearningRecordsStore = {
  version: "learning_records_v1";
  tenantId: string;
  updatedAt: string;
  engineVersion: string;
  records: LearningRecord[];
};

export type RuleMetrics = {
  ruleId: string;
  usageCount: number;
  acceptanceRate: number;
  editRate: number;
  rejectRate: number;
  averageConfidence: number;
  falsePositiveRate: number;
  averageTimeToDecisionMs: number;
};

export type FieldMetrics = {
  field: string;
  usageCount: number;
  acceptanceRate: number;
  editRate: number;
  rejectRate: number;
  averageConfidence: number;
};

export type TemporalBucket = {
  period: string;
  accepted: number;
  edited: number;
  rejected: number;
  total: number;
  averageConfidence: number;
};

export type LearningMetricsStore = {
  version: "learning_metrics_v1";
  tenantId: string;
  computedAt: string;
  engineVersion: string;
  totalRecords: number;
  globalAcceptanceRate: number;
  globalEditRate: number;
  globalRejectRate: number;
  globalAverageConfidence: number;
  globalAverageTimeToDecisionMs: number;
  byRule: RuleMetrics[];
  byField: FieldMetrics[];
  temporalEvolution: TemporalBucket[];
};

export type LearningRecommendation = {
  id: string;
  severity: "info" | "warning" | "insight";
  message: string;
  ruleId?: string;
  field?: string;
};

export type LearningDashboardView = {
  metrics: LearningMetricsStore;
  recommendations: LearningRecommendation[];
  topAcceptedRules: RuleMetrics[];
  topRejectedRules: RuleMetrics[];
  topEditedFields: FieldMetrics[];
};

export type LearningSummaryMeta = {
  status: "pending" | "completed";
  totalRecords?: number;
  lastRecordedAt?: string;
  recordsPath?: string;
  metricsPath?: string;
};
