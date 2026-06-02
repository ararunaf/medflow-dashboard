import type { Json, OperationalAgentType } from "@/lib/database.types";

/** Estados de coordenação multi-agente (camada colaborativa; separado da sessão de governança por agente). */
export type OperationalAgentCoordinationState =
  | "idle"
  | "collaborating"
  | "awaiting_supervision"
  | "coordinated"
  | "blocked";

export type OperationalCoordinationCrossRef = {
  fromAgent: OperationalAgentType;
  refKind: string;
  refId: string;
};

export type OperationalCoordinationSharedRec = {
  id: string;
  title: string;
};

export type OperationalCoordinationParticipant = {
  agentType: OperationalAgentType;
  coordinationState: OperationalAgentCoordinationState;
  rationaleSnippet: string;
  collaborativeRationale: string;
  delegatedReasoningTo: OperationalAgentType | null;
  sharedInsights: string[];
  sharedRisks: string[];
  sharedForecasts: string[];
  sharedRecommendations: OperationalCoordinationSharedRec[];
  crossRefs: OperationalCoordinationCrossRef[];
};

export type OperationalCoordinationConflictResolution = {
  recommendationId: string;
  title: string;
  claimants: OperationalAgentType[];
  primaryOwner: OperationalAgentType | null;
  winner: OperationalAgentType;
  policyId: string;
  rationale: string;
};

export type OperationalCoordinationSharedContext = {
  schemaVersion: 1;
  surfaceFingerprint: string;
  semanticFingerprint: string;
  asOf: string;
  healthState: string;
  consolidatedRiskScore: number;
  operationalHealthScore: number;
  narrativeHeadline: string;
  semanticTags: string[];
  priorityRecommendationIds: string[];
  orchestrationAware: boolean;
};

export type OperationalCoordinationCycleResult = {
  correlationId: string;
  surfaceFingerprint: string;
  semanticFingerprint: string;
  sharedContext: OperationalCoordinationSharedContext;
  participants: OperationalCoordinationParticipant[];
  collaborationNarrative: string;
  conflicts: OperationalCoordinationConflictResolution[];
  provenanceRefs: OperationalCoordinationCrossRef[];
  orchestrationSummary: {
    activeCount: number;
    items: { id: string; title: string; state: string }[];
  };
};

export type OperationalAgentCoordinationCycleRow = {
  id: string;
  correlation_id: string;
  surface_fingerprint: string;
  semantic_fingerprint: string;
  shared_context_json: Json;
  participants_json: Json;
  collaboration_narrative: string;
  conflicts_json: Json;
  provenance_refs_json: Json;
  orchestration_summary_json: Json;
  created_at: string;
};

export type OperationalAgentCoordinationBundle = {
  computedAt: string;
  latestCycle: OperationalCoordinationCycleResult | null;
  recentCycles: OperationalAgentCoordinationCycleRow[];
};
