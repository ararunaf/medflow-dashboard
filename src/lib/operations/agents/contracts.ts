import type {
  OperationalAgentGovernanceSessionState,
  OperationalAgentType,
} from "@/lib/database.types";
import type { OperationalOrchestrationState } from "@/lib/operations/orchestration/types";
import type { OperationalScoreId } from "@/lib/operations/scoring/types";

export type OperationalAgentExplainabilityRef =
  | { kind: "score"; scoreId: OperationalScoreId; value: number; label: string }
  | {
      kind: "forecast";
      projection: string;
      basis: string;
      computedAt: string;
    }
  | {
      kind: "orchestration";
      orchestrationId: string;
      title: string;
      state: OperationalOrchestrationState;
    }
  | { kind: "recommendation"; recommendationId: string; title: string; state: string }
  | {
      kind: "simulation";
      sandboxRunId: string;
      proposalId: string;
      orchestrationId: string;
      stepOrdinal: number;
      stepState: string;
    }
  | { kind: "proposal"; proposalId: string; orchestrationId: string; stepOrdinal: number };

export type OperationalAgentReasoningSurface = {
  agentType: OperationalAgentType;
  domainLabel: string;
  capabilityLabels: readonly string[];
  policyIds: readonly string[];
  rationaleSummary: string;
  headlines: string[];
  refs: OperationalAgentExplainabilityRef[];
  needsHumanReview: boolean;
};

export type OperationalAgentGovernanceView = OperationalAgentReasoningSurface & {
  sessionId: string | null;
  persistedState: OperationalAgentGovernanceSessionState | null;
  effectiveState: OperationalAgentGovernanceSessionState;
  correlationId: string | null;
  surfaceFingerprint: string | null;
  updatedAt: string | null;
};

export type OperationalAgentGovernanceBundle = {
  computedAt: string;
  surfaceFingerprint: string;
  agents: OperationalAgentGovernanceView[];
};
