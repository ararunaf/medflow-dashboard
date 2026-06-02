import type {
  Json,
  OperationalAgentGovernanceSessionState,
  OperationalAgentType,
} from "@/lib/database.types";
import { isOperationalManager } from "@/lib/auth/rbac";
import { mapPostgresError, PermissionError, ValidationError } from "@/lib/domain/operations/errors";
import { loadOperationalCommandCenterSnapshot } from "@/lib/operations/api/queries/command-center";
import type {
  OperationalAgentGovernanceBundle,
  OperationalAgentGovernanceView,
  OperationalAgentReasoningSurface,
} from "@/lib/operations/agents/contracts";
import { loadOrchestrationAgentAdapterContext } from "@/lib/operations/agents/orchestration-adapter";
import {
  buildOperationalAgentReasoningSurfaces,
  buildOperationalAgentSurfaceFingerprint,
} from "@/lib/operations/agents/scoped-reasoning-engine";
import { recordOperationalEventSafe } from "@/lib/services/operations/operational-event-service";
import type { ServiceCtx } from "@/lib/services/operations/types";

type SessionRow = {
  id: string;
  agent_type: OperationalAgentType;
  state: OperationalAgentGovernanceSessionState;
  correlation_id: string;
  surface_fingerprint: string;
  rationale_summary: string;
  updated_at: string;
};

function mergeEffectiveState(input: {
  surface: OperationalAgentReasoningSurface;
  row: SessionRow | null;
  fingerprint: string;
}): OperationalAgentGovernanceSessionState {
  const { surface, row, fingerprint } = input;
  if (!row) {
    return surface.needsHumanReview ? "awaiting_human_review" : "idle";
  }
  if (row.state === "blocked") return "blocked";
  if (row.surface_fingerprint !== fingerprint) {
    return surface.needsHumanReview ? "awaiting_human_review" : "idle";
  }
  if (row.state === "approved") return "approved";
  if (row.state === "awaiting_human_review" || row.state === "idle") {
    return surface.needsHumanReview ? "awaiting_human_review" : "idle";
  }
  return row.state;
}

function toView(
  surface: OperationalAgentReasoningSurface,
  row: SessionRow | null,
  fingerprint: string,
): OperationalAgentGovernanceView {
  return {
    ...surface,
    sessionId: row?.id ?? null,
    persistedState: row?.state ?? null,
    effectiveState: mergeEffectiveState({ surface, row, fingerprint }),
    correlationId: row?.correlation_id ?? null,
    surfaceFingerprint: row?.surface_fingerprint ?? null,
    updatedAt: row?.updated_at ?? null,
  };
}

async function loadSessions(ctx: ServiceCtx): Promise<Map<OperationalAgentType, SessionRow>> {
  const { data, error } = await ctx.client
    .from("operational_agent_governance_sessions")
    .select("id,agent_type,state,correlation_id,surface_fingerprint,rationale_summary,updated_at")
    .eq("tenant_id", ctx.tenantId);
  if (error) throw mapPostgresError(error);
  const m = new Map<OperationalAgentType, SessionRow>();
  for (const r of (data ?? []) as SessionRow[]) {
    m.set(r.agent_type, r);
  }
  return m;
}

export async function loadOperationalAgentGovernanceBundle(
  ctx: ServiceCtx,
): Promise<OperationalAgentGovernanceBundle> {
  if (!isOperationalManager(ctx.role)) {
    throw new PermissionError(
      "Painel de agentes operacionais restrito a coordenação / administradores.",
    );
  }
  const snapshot = await loadOperationalCommandCenterSnapshot(ctx);
  const orchCtx = await loadOrchestrationAgentAdapterContext(ctx);
  const fingerprint = buildOperationalAgentSurfaceFingerprint(snapshot);
  const surfaces = buildOperationalAgentReasoningSurfaces({
    snapshot,
    orchestrationContext: orchCtx,
  });
  const rows = await loadSessions(ctx);
  const agents = surfaces.map((s) => toView(s, rows.get(s.agentType) ?? null, fingerprint));
  return {
    computedAt: snapshot.asOf,
    surfaceFingerprint: fingerprint,
    agents,
  };
}

export async function runOperationalAgentReasoningCycles(
  ctx: ServiceCtx,
): Promise<OperationalAgentGovernanceBundle> {
  if (!isOperationalManager(ctx.role)) {
    throw new PermissionError(
      "Ciclo de raciocínio de agentes restrito a coordenação / administradores.",
    );
  }
  const snapshot = await loadOperationalCommandCenterSnapshot(ctx);
  const orchCtx = await loadOrchestrationAgentAdapterContext(ctx);
  const fingerprint = buildOperationalAgentSurfaceFingerprint(snapshot);
  const surfaces = buildOperationalAgentReasoningSurfaces({
    snapshot,
    orchestrationContext: orchCtx,
  });
  const existing = await loadSessions(ctx);

  for (const surface of surfaces) {
    const prev = existing.get(surface.agentType);
    const nextState: OperationalAgentGovernanceSessionState =
      prev?.state === "blocked"
        ? "blocked"
        : surface.needsHumanReview
          ? "awaiting_human_review"
          : "idle";

    const correlationId = crypto.randomUUID();
    const payload = {
      tenant_id: ctx.tenantId,
      agent_type: surface.agentType,
      state: nextState,
      correlation_id: correlationId,
      surface_fingerprint: fingerprint,
      rationale_summary: surface.rationaleSummary,
      reasoning_headlines_json: surface.headlines as unknown as Json,
      explainability_refs_json: surface.refs as unknown as Json,
      updated_by_profile_id: ctx.actorProfileId,
      updated_at: new Date().toISOString(),
    };

    const { error } = await ctx.client
      .from("operational_agent_governance_sessions")
      .upsert(payload, {
        onConflict: "tenant_id,agent_type",
      });
    if (error) throw mapPostgresError(error);

    await recordOperationalEventSafe(ctx, {
      entity_type: "operational_agent",
      entity_id: surface.agentType,
      event_type: "operational_agent_reasoning_cycle",
      severity: surface.needsHumanReview ? "warning" : "info",
      description: `Ciclo de raciocínio supervisionado (${surface.domainLabel}) — fingerprint atualizado.`,
      metadata: {
        agent_type: surface.agentType,
        correlation_id: correlationId,
        surface_fingerprint: fingerprint,
        needs_human_review: surface.needsHumanReview,
        policy_ids: [...surface.policyIds],
        refs_truncated: surface.refs.slice(0, 12),
      },
    });
  }

  const rows = await loadSessions(ctx);
  const agents = surfaces.map((s) => toView(s, rows.get(s.agentType) ?? null, fingerprint));
  return {
    computedAt: snapshot.asOf,
    surfaceFingerprint: fingerprint,
    agents,
  };
}

export async function approveOperationalAgentSession(
  ctx: ServiceCtx,
  input: { agentType: OperationalAgentType; note?: string },
): Promise<OperationalAgentGovernanceBundle> {
  if (!isOperationalManager(ctx.role)) {
    throw new PermissionError("Aprovação de agente restrita a coordenação / administradores.");
  }
  const agentType = assertOperationalAgentType(input.agentType);

  const bundle = await loadOperationalAgentGovernanceBundle(ctx);
  const agent = bundle.agents.find((a) => a.agentType === agentType);
  if (!agent?.sessionId) {
    throw new ValidationError("Execute um ciclo de raciocínio antes de aprovar este agente.", {
      agentType,
    });
  }

  const { error } = await ctx.client
    .from("operational_agent_governance_sessions")
    .update({
      state: "approved",
      updated_by_profile_id: ctx.actorProfileId,
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", agent.sessionId);
  if (error) throw mapPostgresError(error);

  await recordOperationalEventSafe(ctx, {
    entity_type: "operational_agent",
    entity_id: agentType,
    event_type: "operational_agent_human_approved",
    severity: "info",
    description: `Supervisão: agente ${agentType} aprovado para o snapshot corrente.`,
    metadata: {
      agent_type: agentType,
      session_id: agent.sessionId,
      note: (input.note ?? "").trim() || null,
      surface_fingerprint: bundle.surfaceFingerprint,
    },
  });

  return loadOperationalAgentGovernanceBundle(ctx);
}

export async function blockOperationalAgentSession(
  ctx: ServiceCtx,
  input: { agentType: OperationalAgentType; reason: string },
): Promise<OperationalAgentGovernanceBundle> {
  if (!isOperationalManager(ctx.role)) {
    throw new PermissionError("Bloqueio de agente restrito a coordenação / administradores.");
  }
  const agentType = assertOperationalAgentType(input.agentType);
  const reason = (input.reason ?? "").trim();
  if (!reason) throw new ValidationError("Informe o motivo do bloqueio.", { field: "reason" });

  const bundle = await loadOperationalAgentGovernanceBundle(ctx);
  const agent = bundle.agents.find((a) => a.agentType === agentType);
  if (!agent?.sessionId) {
    throw new ValidationError("Execute um ciclo de raciocínio antes de bloquear este agente.", {
      agentType,
    });
  }

  const { error } = await ctx.client
    .from("operational_agent_governance_sessions")
    .update({
      state: "blocked",
      updated_by_profile_id: ctx.actorProfileId,
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", agent.sessionId);
  if (error) throw mapPostgresError(error);

  await recordOperationalEventSafe(ctx, {
    entity_type: "operational_agent",
    entity_id: agentType,
    event_type: "operational_agent_human_blocked",
    severity: "warning",
    description: `Supervisão: agente ${agentType} bloqueado — ${reason.slice(0, 400)}`,
    metadata: {
      agent_type: agentType,
      session_id: agent.sessionId,
      reason,
      surface_fingerprint: bundle.surfaceFingerprint,
    },
  });

  return loadOperationalAgentGovernanceBundle(ctx);
}

export async function unblockOperationalAgentSession(
  ctx: ServiceCtx,
  input: { agentType: OperationalAgentType },
): Promise<OperationalAgentGovernanceBundle> {
  if (!isOperationalManager(ctx.role)) {
    throw new PermissionError("Desbloqueio de agente restrito a coordenação / administradores.");
  }
  const agentType = assertOperationalAgentType(input.agentType);

  const bundle = await loadOperationalAgentGovernanceBundle(ctx);
  const agent = bundle.agents.find((a) => a.agentType === agentType);
  if (!agent?.sessionId) {
    throw new ValidationError("Sessão de agente não encontrada.", { agentType });
  }

  const { error } = await ctx.client
    .from("operational_agent_governance_sessions")
    .update({
      state: "idle",
      updated_by_profile_id: ctx.actorProfileId,
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", agent.sessionId);
  if (error) throw mapPostgresError(error);

  await recordOperationalEventSafe(ctx, {
    entity_type: "operational_agent",
    entity_id: agentType,
    event_type: "operational_agent_unblocked",
    severity: "info",
    description: `Supervisão: agente ${agentType} desbloqueado — pronto para novo ciclo.`,
    metadata: {
      agent_type: agentType,
      session_id: agent.sessionId,
      surface_fingerprint: bundle.surfaceFingerprint,
    },
  });

  return loadOperationalAgentGovernanceBundle(ctx);
}

export function assertOperationalAgentType(value: string): OperationalAgentType {
  const allowed: OperationalAgentType[] = [
    "coverage_agent",
    "coordination_agent",
    "risk_agent",
    "recommendation_agent",
  ];
  if (!allowed.includes(value as OperationalAgentType)) {
    throw new ValidationError("Tipo de agente inválido.", { agentType: value });
  }
  return value as OperationalAgentType;
}
