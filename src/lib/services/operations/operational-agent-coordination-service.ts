import type {
  Json,
  OperationalAgentGovernanceSessionState,
  OperationalAgentType,
} from "@/lib/database.types";
import { isOperationalManager } from "@/lib/auth/rbac";
import { mapPostgresError, PermissionError } from "@/lib/domain/operations/errors";
import { loadOperationalCommandCenterSnapshot } from "@/lib/operations/api/queries/command-center";
import { runOperationalCoordinationEngine } from "@/lib/operations/agents/coordination/coordination-engine";
import { COORDINATION_POLICY_IDS } from "@/lib/operations/agents/coordination/policies";
import type {
  OperationalAgentCoordinationBundle,
  OperationalAgentCoordinationCycleRow,
  OperationalCoordinationConflictResolution,
  OperationalCoordinationCycleResult,
  OperationalCoordinationParticipant,
  OperationalCoordinationSharedContext,
} from "@/lib/operations/agents/coordination/types";
import { loadOrchestrationAgentAdapterContext } from "@/lib/operations/agents/orchestration-adapter";
import { recordOperationalEventSafe } from "@/lib/services/operations/operational-event-service";
import {
  tryRecordCoordinationCycleMemory,
  tryRecordDeteriorationPatternMemory,
  tryRecordForecastAccuracySnapshotMemory,
} from "@/lib/services/operations/operational-memory-service";
import type { ServiceCtx } from "@/lib/services/operations/types";

async function loadGovernanceStateMap(
  ctx: ServiceCtx,
): Promise<Map<OperationalAgentType, OperationalAgentGovernanceSessionState>> {
  const { data, error } = await ctx.client
    .from("operational_agent_governance_sessions")
    .select("agent_type,state")
    .eq("tenant_id", ctx.tenantId);
  if (error) throw mapPostgresError(error);
  const m = new Map<OperationalAgentType, OperationalAgentGovernanceSessionState>();
  for (const r of (data ?? []) as {
    agent_type: OperationalAgentType;
    state: OperationalAgentGovernanceSessionState;
  }[]) {
    m.set(r.agent_type, r.state);
  }
  return m;
}

function parseCycleRow(
  row: OperationalAgentCoordinationCycleRow,
): OperationalCoordinationCycleResult {
  const shared = row.shared_context_json as OperationalCoordinationSharedContext;
  const participants = row.participants_json as OperationalCoordinationParticipant[];
  const conflicts = row.conflicts_json as OperationalCoordinationConflictResolution[];
  const provenance =
    row.provenance_refs_json as OperationalCoordinationCycleResult["provenanceRefs"];
  const orch =
    row.orchestration_summary_json as OperationalCoordinationCycleResult["orchestrationSummary"];
  return {
    correlationId: row.correlation_id,
    surfaceFingerprint: row.surface_fingerprint,
    semanticFingerprint: row.semantic_fingerprint,
    sharedContext: shared,
    participants,
    collaborationNarrative: row.collaboration_narrative,
    conflicts,
    provenanceRefs: provenance,
    orchestrationSummary: orch,
  };
}

export async function loadOperationalAgentCoordinationBundle(
  ctx: ServiceCtx,
): Promise<OperationalAgentCoordinationBundle> {
  if (!isOperationalManager(ctx.role)) {
    throw new PermissionError("Coordenação colaborativa restrita a coordenação / administradores.");
  }
  const snapshot = await loadOperationalCommandCenterSnapshot(ctx);
  const { data, error } = await ctx.client
    .from("operational_agent_coordination_cycles")
    .select(
      "id,correlation_id,surface_fingerprint,semantic_fingerprint,shared_context_json,participants_json,collaboration_narrative,conflicts_json,provenance_refs_json,orchestration_summary_json,created_at",
    )
    .eq("tenant_id", ctx.tenantId)
    .order("created_at", { ascending: false })
    .limit(8);
  if (error) throw mapPostgresError(error);
  const rows = (data ?? []) as OperationalAgentCoordinationCycleRow[];
  const recentCycles = rows;
  const latestCycle = rows[0] ? parseCycleRow(rows[0]!) : null;
  return {
    computedAt: snapshot.asOf,
    latestCycle,
    recentCycles,
  };
}

export async function runOperationalAgentCoordinationCycle(
  ctx: ServiceCtx,
): Promise<OperationalAgentCoordinationBundle> {
  if (!isOperationalManager(ctx.role)) {
    throw new PermissionError(
      "Execução de ciclo de coordenação restrita a coordenação / administradores.",
    );
  }
  const governanceStates = await loadGovernanceStateMap(ctx);
  const snapshot = await loadOperationalCommandCenterSnapshot(ctx);
  const orchCtx = await loadOrchestrationAgentAdapterContext(ctx);
  const result = runOperationalCoordinationEngine({
    snapshot,
    orchestrationContext: orchCtx,
    governanceStates,
  });

  const insert = {
    tenant_id: ctx.tenantId,
    correlation_id: result.correlationId,
    surface_fingerprint: result.surfaceFingerprint,
    semantic_fingerprint: result.semanticFingerprint,
    shared_context_json: result.sharedContext as unknown as Json,
    participants_json: result.participants as unknown as Json,
    collaboration_narrative: result.collaborationNarrative,
    conflicts_json: result.conflicts as unknown as Json,
    provenance_refs_json: result.provenanceRefs as unknown as Json,
    orchestration_summary_json: result.orchestrationSummary as unknown as Json,
    created_by_profile_id: ctx.actorProfileId,
  };

  const { data: created, error } = await ctx.client
    .from("operational_agent_coordination_cycles")
    .insert(insert)
    .select("id")
    .single();
  if (error) throw mapPostgresError(error);

  const cycleId = (created as { id: string }).id;
  await recordOperationalEventSafe(ctx, {
    entity_type: "agent_coordination",
    entity_id: cycleId,
    event_type: "operational_agent_coordination_cycle",
    severity: result.conflicts.length ? "warning" : "info",
    description: `Ciclo de coordenação colaborativa (${result.participants.length} agentes) — correl. ${result.correlationId.slice(0, 8)}…`,
    metadata: {
      coordination_cycle_id: cycleId,
      correlation_id: result.correlationId,
      surface_fingerprint: result.surfaceFingerprint,
      semantic_fingerprint: result.semanticFingerprint,
      participating_agents: result.participants.map((p) => p.agentType),
      coordination_states: result.participants.map((p) => ({
        agent: p.agentType,
        state: p.coordinationState,
      })),
      conflicts_resolved: result.conflicts.length,
      delegated_edges: result.participants
        .filter((p) => p.delegatedReasoningTo)
        .map((p) => ({ from: p.agentType, to: p.delegatedReasoningTo })),
      policy_ids: Object.values(COORDINATION_POLICY_IDS),
      orchestration_active: result.orchestrationSummary.activeCount,
      approvals_required: result.participants.filter(
        (p) => p.coordinationState === "awaiting_supervision",
      ).length,
    },
  });

  void tryRecordCoordinationCycleMemory(ctx, {
    cycleId,
    correlationId: result.correlationId,
    conflictCount: result.conflicts.length,
    participantCount: result.participants.length,
    orchestrationActiveCount: result.orchestrationSummary.activeCount,
  });
  void tryRecordDeteriorationPatternMemory(ctx, {
    projection: snapshot.recommendations.forecast.projection,
    healthState: snapshot.scoring.healthState,
    asOf: snapshot.asOf,
  });
  void tryRecordForecastAccuracySnapshotMemory(ctx, {
    projection: snapshot.recommendations.forecast.projection,
    healthState: snapshot.scoring.healthState,
    asOf: snapshot.asOf,
  });

  return loadOperationalAgentCoordinationBundle(ctx);
}
