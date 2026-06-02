import type {
  OperationalPolicyGovernanceRecommendationKind,
  SupervisedPolicyLifecycleState,
} from "@/lib/database.types";

export type { OperationalPolicyGovernanceRecommendationKind, SupervisedPolicyLifecycleState };

export type OperationalPolicyFindingCode =
  | "rollback_recurrence"
  | "ineffective_escalations"
  | "orchestration_bottleneck"
  | "coordination_overload"
  | "ineffective_thresholds"
  | "adaptation_instability";

export type OperationalPolicyFindingSeverity = "info" | "warning" | "critical";

export type OperationalPolicyFinding = {
  code: OperationalPolicyFindingCode;
  severity: OperationalPolicyFindingSeverity;
  headline: string;
  narrative: string[];
  references: Array<{ kind: string; id: string }>;
};

export type PolicyGovernanceExplainability = {
  policyRationale: string[];
  historicalRefs: { memoryEntryIds: string[]; note: string };
  rollbackRefs: { subjectIds: string[]; note: string };
  orchestrationRefs: { subjectIds: string[]; note: string };
  governanceNarrative: string[];
  adjustmentExplainability: string[];
};

export type OperationalPolicyGovernanceRecommendationDraft = {
  recommendationKind: OperationalPolicyGovernanceRecommendationKind;
  title: string;
  detail: string;
  explainability: PolicyGovernanceExplainability;
  suggestionFingerprint: string;
};

export type OperationalPolicyIntelligenceEngineResult = {
  findings: OperationalPolicyFinding[];
  recommendations: OperationalPolicyGovernanceRecommendationDraft[];
  signalDigest: Record<string, number | string | string[]>;
  governanceNarrative: string;
};
