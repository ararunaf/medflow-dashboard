import type { OperationalCommandCenterSnapshot } from "@/lib/operations/api/queries/command-center";
import type { OperationalSemanticSnapshot } from "@/lib/operations/copilot-context/types";
import type { OperationalCoordinationSharedContext } from "@/lib/operations/agents/coordination/types";

export function buildSharedOperationalContext(input: {
  snapshot: OperationalCommandCenterSnapshot;
  semantic: OperationalSemanticSnapshot;
  surfaceFingerprint: string;
  hasOrchestrationRefs: boolean;
}): OperationalCoordinationSharedContext {
  const { snapshot, semantic, surfaceFingerprint, hasOrchestrationRefs } = input;
  return {
    schemaVersion: 1,
    surfaceFingerprint,
    semanticFingerprint: semantic.fingerprint,
    asOf: snapshot.asOf,
    healthState: semantic.healthState,
    consolidatedRiskScore: semantic.consolidatedRiskScore,
    operationalHealthScore: semantic.operationalHealthScore,
    narrativeHeadline: semantic.narrativeHeadline,
    semanticTags: semantic.semanticTags.slice(0, 32),
    priorityRecommendationIds: semantic.priorityRecommendationIds.slice(0, 16),
    orchestrationAware: hasOrchestrationRefs,
  };
}
