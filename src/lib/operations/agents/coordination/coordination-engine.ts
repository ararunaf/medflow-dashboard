import type { OperationalAgentGovernanceSessionState } from "@/lib/database.types";
import type { OperationalAgentType } from "@/lib/database.types";
import type { OperationalCommandCenterSnapshot } from "@/lib/operations/api/queries/command-center";
import { evaluateOperationalAlerts } from "@/lib/operations/alerts/engine";
import type { OperationalAgentReasoningSurface } from "@/lib/operations/agents/contracts";
import { resolveCrossAgentRecommendationConflicts } from "@/lib/operations/agents/coordination/conflict-resolution";
import {
  buildCollaborativeRationale,
  contextualDelegationTarget,
  peerHeadlineIndex,
} from "@/lib/operations/agents/coordination/delegation";
import { COORDINATION_POLICY_IDS } from "@/lib/operations/agents/coordination/policies";
import type {
  OperationalCoordinationConflictResolution,
  OperationalCoordinationCrossRef,
  OperationalCoordinationCycleResult,
  OperationalCoordinationParticipant,
  OperationalCoordinationSharedContext,
} from "@/lib/operations/agents/coordination/types";
import { buildSharedOperationalContext } from "@/lib/operations/agents/coordination/shared-context-bus";
import type { OrchestrationAgentAdapterContext } from "@/lib/operations/agents/orchestration-adapter";
import {
  buildOperationalAgentReasoningSurfaces,
  buildOperationalAgentSurfaceFingerprint,
} from "@/lib/operations/agents/scoped-reasoning-engine";
import {
  buildOperationalCopilotContextBundle,
  buildOperationalSemanticSnapshot,
} from "@/lib/operations/copilot-context/operational-copilot-context-service";
import type { OperationalSemanticSnapshot } from "@/lib/operations/copilot-context/types";

function deriveCoordinationState(input: {
  governance: OperationalAgentGovernanceSessionState | null | undefined;
  needsHumanReview: boolean;
  hadConflictAsClaimant: boolean;
  conflictWinner: boolean;
}): OperationalCoordinationParticipant["coordinationState"] {
  if (input.governance === "blocked") return "blocked";
  if (input.needsHumanReview) return "awaiting_supervision";
  if (input.hadConflictAsClaimant && !input.conflictWinner) return "collaborating";
  if (input.hadConflictAsClaimant && input.conflictWinner) return "coordinated";
  return "idle";
}

function collectProvenanceRefs(
  surfaces: OperationalAgentReasoningSurface[],
): OperationalCoordinationCrossRef[] {
  const out: OperationalCoordinationCrossRef[] = [];
  for (const s of surfaces) {
    for (const r of s.refs) {
      if (r.kind === "score") {
        out.push({ fromAgent: s.agentType, refKind: "score", refId: r.scoreId });
      } else if (r.kind === "recommendation") {
        out.push({ fromAgent: s.agentType, refKind: "recommendation", refId: r.recommendationId });
      } else if (r.kind === "orchestration") {
        out.push({ fromAgent: s.agentType, refKind: "orchestration", refId: r.orchestrationId });
      } else if (r.kind === "forecast") {
        out.push({ fromAgent: s.agentType, refKind: "forecast", refId: r.computedAt });
      }
    }
  }
  const seen = new Set<string>();
  return out
    .filter((x) => {
      const k = `${x.fromAgent}:${x.refKind}:${x.refId}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, 64);
}

function narrativeFrom(input: {
  semantic: OperationalSemanticSnapshot;
  conflicts: OperationalCoordinationConflictResolution[];
  surfaces: OperationalAgentReasoningSurface[];
}): string {
  const parts = [
    `Coordenação supervisionada em passagem única (${COORDINATION_POLICY_IDS.singlePassNoAgentLoops}).`,
    `Narrativa semântica: ${input.semantic.narrativeHeadline}`,
  ];
  if (input.conflicts.length) {
    parts.push(
      `Conflitos de sobreposição resolvidos: ${input.conflicts.length} (arbitragem por domínio / trigger primário).`,
    );
  } else {
    parts.push("Sem conflitos de sobreposição entre agentes para o snapshot corrente.");
  }
  const urgent = input.surfaces.filter((s) => s.needsHumanReview).map((s) => s.domainLabel);
  if (urgent.length) {
    parts.push(`Revisão humana sugerida em: ${urgent.join(", ")}.`);
  }
  return parts.join(" ");
}

function forecastLines(snapshot: OperationalCommandCenterSnapshot): string[] {
  const f = snapshot.recommendations.forecast;
  return [`${f.projection} (${f.basis})`];
}

function riskLines(
  snapshot: OperationalCommandCenterSnapshot,
  agent: OperationalAgentType,
): string[] {
  if (agent === "risk_agent") return snapshot.scoring.riskNotes.slice(0, 4);
  return snapshot.scoring.riskNotes.slice(0, 1);
}

export function runOperationalCoordinationEngine(input: {
  snapshot: OperationalCommandCenterSnapshot;
  orchestrationContext: OrchestrationAgentAdapterContext;
  governanceStates: Map<OperationalAgentType, OperationalAgentGovernanceSessionState>;
}): OperationalCoordinationCycleResult {
  const fingerprint = buildOperationalAgentSurfaceFingerprint(input.snapshot);
  const surfaces = buildOperationalAgentReasoningSurfaces({
    snapshot: input.snapshot,
    orchestrationContext: input.orchestrationContext,
  });

  const core = {
    asOf: input.snapshot.asOf,
    window: input.snapshot.window,
    widgets: input.snapshot.widgets,
    indicators: input.snapshot.indicators,
    coordination: input.snapshot.coordination,
    meta: input.snapshot.meta,
  };
  const alerts = evaluateOperationalAlerts(core);
  const bundle = buildOperationalCopilotContextBundle({
    snapshot: input.snapshot,
    alerts,
    analytics: null,
    timeline: null,
  });
  const semantic = buildOperationalSemanticSnapshot(bundle);
  const hasOrch = input.orchestrationContext.refs.some((r) => r.kind === "orchestration");
  const sharedContext: OperationalCoordinationSharedContext = buildSharedOperationalContext({
    snapshot: input.snapshot,
    semantic,
    surfaceFingerprint: fingerprint,
    hasOrchestrationRefs: hasOrch,
  });

  const conflicts = resolveCrossAgentRecommendationConflicts({
    surfaces,
    recommendations: input.snapshot.recommendations.items,
  });
  const claimantConflict = (agent: OperationalAgentType): { had: boolean; winner: boolean } => {
    let had = false;
    let allWins = true;
    for (const c of conflicts) {
      if (!c.claimants.includes(agent)) continue;
      had = true;
      if (c.winner !== agent) allWins = false;
    }
    return { had, winner: allWins };
  };

  const peers = peerHeadlineIndex(surfaces);
  const participants: OperationalCoordinationParticipant[] = surfaces.map((s) => {
    const delegTo = contextualDelegationTarget(s.agentType);
    const cc = claimantConflict(s.agentType);
    const gov = input.governanceStates.get(s.agentType);
    const recs = s.refs
      .filter((r) => r.kind === "recommendation")
      .map((r) => ({ id: r.recommendationId, title: r.title }))
      .slice(0, 8);

    const crossRefs: OperationalCoordinationCrossRef[] = [
      ...s.refs
        .filter((r) => r.kind === "recommendation")
        .map((r) => ({
          fromAgent: s.agentType,
          refKind: "recommendation",
          refId: r.recommendationId,
        })),
      ...s.refs
        .filter((r) => r.kind === "score")
        .map((r) => ({ fromAgent: s.agentType, refKind: "score", refId: r.scoreId })),
    ].slice(0, 16);

    return {
      agentType: s.agentType,
      coordinationState: deriveCoordinationState({
        governance: gov,
        needsHumanReview: s.needsHumanReview,
        hadConflictAsClaimant: cc.had,
        conflictWinner: cc.winner,
      }),
      rationaleSnippet: s.rationaleSummary,
      collaborativeRationale: buildCollaborativeRationale({
        surface: s,
        delegatedReasoningTo: delegTo,
        peerHeadlines: peers,
      }),
      delegatedReasoningTo: delegTo,
      sharedInsights: s.headlines.slice(0, 4),
      sharedRisks: riskLines(input.snapshot, s.agentType),
      sharedForecasts: forecastLines(input.snapshot),
      sharedRecommendations: recs,
      crossRefs,
    };
  });

  const collaborationNarrative = narrativeFrom({ semantic, conflicts, surfaces });
  const provenanceRefs = collectProvenanceRefs(surfaces);
  const activeOrch = input.orchestrationContext.orchestrationSummaries.filter((o) =>
    ["planned", "awaiting_approval", "orchestrating", "partially_executed"].includes(o.state),
  );

  return {
    correlationId: crypto.randomUUID(),
    surfaceFingerprint: fingerprint,
    semanticFingerprint: semantic.fingerprint,
    sharedContext,
    participants,
    collaborationNarrative,
    conflicts,
    provenanceRefs,
    orchestrationSummary: {
      activeCount: activeOrch.length,
      items: activeOrch.slice(0, 8).map((o) => ({ id: o.id, title: o.title, state: o.state })),
    },
  };
}
