/**
 * Serviço de execução SANDBOX (dry-run) para propostas operacionais.
 *
 * - Não executa mutações reais em shifts / assignments / swaps.
 * - Apenas simula efeitos, projeta impacto e prepara a base de auditoria para
 *   a futura camada de mutation execution (e agentes autônomos).
 *
 * Saída padrão: `OperationalSimulationResult` (estável + serializável).
 */
import { isOperationalManager } from "@/lib/auth/rbac";
import { mapPostgresError, PermissionError, ValidationError } from "@/lib/domain/operations/errors";
import { expectUuid } from "@/lib/domain/operations/validation";
import type { OperationalActionKind, OperationalActionProposalState } from "@/lib/database.types";
import { loadOperationalCommandCenterSnapshot } from "@/lib/operations/api/queries/command-center";
import type { OperationalCommandCenterSnapshot } from "@/lib/operations/api/queries/command-center";
import { effectiveProposalState } from "@/lib/operations/action-proposals";
import type {
  OperationalActionProposalDto,
  OperationalActionProposalSource,
  OperationalProposalReference,
} from "@/lib/operations/action-proposals";
import {
  buildImpactAnalysis,
  buildRollbackPreview,
  clampAffectedEntitiesLimit,
  evaluateExecutionSafety,
  evaluateProposalSimulability,
  extractEntityIdsFromProposal,
  OPERATIONAL_EXECUTION_SANDBOX_SCHEMA_VERSION,
  runDryRunForActionKind,
  type ExecutionSummary,
  type OperationalSimulationResult,
  type RunSimulationInput,
  type SimulationExplainability,
  type SimulatedProposalSnapshot,
} from "@/lib/operations/execution-sandbox";
import type { ServiceCtx } from "@/lib/services/operations/types";
import { recordOperationalEventSafe } from "@/lib/services/operations/operational-event-service";

type ProposalRow = {
  id: string;
  tenant_id: string;
  created_by_profile_id: string;
  state: OperationalActionProposalState;
  action_kind: OperationalActionKind;
  title: string;
  summary: string;
  operational_rationale: string;
  references_json: unknown;
  payload_json: unknown;
  source: string;
  gpt_correlation_id: string | null;
  context_fingerprint: string | null;
  expires_at: string;
  approved_by_profile_id: string | null;
  rejected_by_profile_id: string | null;
  approval_note: string | null;
  rejection_justification: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
};

function adaptReferences(raw: unknown): OperationalProposalReference[] {
  if (!Array.isArray(raw)) return [];
  const out: OperationalProposalReference[] = [];
  for (const x of raw) {
    if (!x || typeof x !== "object") continue;
    const o = x as Record<string, unknown>;
    if (typeof o.kind !== "string" || typeof o.ref !== "string") continue;
    out.push({
      kind: o.kind as OperationalProposalReference["kind"],
      ref: o.ref,
      note: typeof o.note === "string" ? o.note : undefined,
    });
  }
  return out;
}

function rowToDto(row: ProposalRow): OperationalActionProposalDto {
  const effective = effectiveProposalState({
    stored: row.state,
    expiresAtIso: row.expires_at,
  });
  return {
    id: row.id,
    tenantId: row.tenant_id,
    createdByProfileId: row.created_by_profile_id,
    effectiveState: effective,
    storedState: row.state,
    actionKind: row.action_kind,
    title: row.title,
    summary: row.summary,
    operationalRationale: row.operational_rationale,
    references: adaptReferences(row.references_json),
    payload:
      row.payload_json && typeof row.payload_json === "object" && !Array.isArray(row.payload_json)
        ? (row.payload_json as Record<string, unknown>)
        : {},
    source: (row.source === "gpt_tool" ? "gpt_tool" : "manual") as OperationalActionProposalSource,
    gptCorrelationId: row.gpt_correlation_id,
    contextFingerprint: row.context_fingerprint,
    expiresAt: row.expires_at,
    approvedByProfileId: row.approved_by_profile_id,
    rejectedByProfileId: row.rejected_by_profile_id,
    approvalNote: row.approval_note,
    rejectionJustification: row.rejection_justification,
    decidedAt: row.decided_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function loadProposal(
  ctx: ServiceCtx,
  proposalId: string,
): Promise<OperationalActionProposalDto> {
  const { data, error } = await ctx.client
    .from("operational_action_proposals")
    .select(
      "id, tenant_id, created_by_profile_id, state, action_kind, title, summary, operational_rationale, references_json, payload_json, source, gpt_correlation_id, context_fingerprint, expires_at, approved_by_profile_id, rejected_by_profile_id, approval_note, rejection_justification, decided_at, created_at, updated_at",
    )
    .eq("tenant_id", ctx.tenantId)
    .eq("id", proposalId)
    .maybeSingle();
  if (error) throw mapPostgresError(error);
  if (!data) throw new ValidationError("Proposta não encontrada.", { proposalId });
  return rowToDto(data as ProposalRow);
}

function buildExplainability(
  proposal: OperationalActionProposalDto,
  narrativeBullets: string[],
): SimulationExplainability {
  const scoreReferences = proposal.references
    .filter((r) => r.kind === "score")
    .map((r) => r.ref.replace(/^score:/, ""))
    .filter((id) => /^[a-z_]+$/.test(id)) as SimulationExplainability["scoreReferences"];

  return {
    schemaVersion: OPERATIONAL_EXECUTION_SANDBOX_SCHEMA_VERSION,
    deterministic: true,
    references: proposal.references,
    scoreReferences,
    narrative: narrativeBullets,
  };
}

function buildExecutionSummary(input: {
  proposal: OperationalActionProposalDto;
  snapshot: OperationalCommandCenterSnapshot;
  bullets: string[];
  semanticTags: string[];
  state: OperationalSimulationResult["state"];
}): ExecutionSummary {
  const head = (() => {
    if (input.state === "blocked") return `Simulação bloqueada: ${input.proposal.title}`;
    if (input.state === "risky") return `Simulação com ressalvas: ${input.proposal.title}`;
    if (input.state === "safe") return `Simulação segura: ${input.proposal.title}`;
    return `Simulação executada: ${input.proposal.title}`;
  })();
  const bullets = input.bullets.slice(0, 6);
  bullets.push(
    `Snapshot de referência: cobertura ${input.snapshot.widgets.operationalCoveragePercent}% · urgência ${input.snapshot.coordination.urgency}.`,
  );
  return {
    headline: head.slice(0, 240),
    bullets,
    semanticTags: input.semanticTags.slice(0, 8),
  };
}

function buildProposalSnapshot(p: OperationalActionProposalDto): SimulatedProposalSnapshot {
  return {
    id: p.id,
    actionKind: p.actionKind,
    state: p.effectiveState,
    title: p.title.slice(0, 200),
    contextFingerprint: p.contextFingerprint,
  };
}

async function persistSimulationRun(
  ctx: ServiceCtx,
  result: OperationalSimulationResult,
): Promise<string | null> {
  // Persistência leve para auditoria. Falha não propaga (sandbox é informativo).
  try {
    const { data, error } = await ctx.client
      .from("operational_execution_sandbox_runs")
      .insert({
        tenant_id: ctx.tenantId,
        proposal_id: result.proposal.id,
        actor_profile_id: ctx.actorProfileId,
        state: result.state,
        block_reason: result.blockReason ?? null,
        overall_severity: result.impact.overallSeverity,
        affected_entity_count: result.impact.affectedEntityCount,
        mutations_count: result.mutations.length,
        context_fingerprint: result.proposal.contextFingerprint,
        schema_version: result.schemaVersion,
        result_snapshot: serializeForJsonb(result),
        metadata: {
          forecast_before: result.impact.projectedForecast.before,
          forecast_after: result.impact.projectedForecast.after,
          health_state_after: result.impact.projectedHealthStateAfter,
          block_reason: result.blockReason ?? null,
        },
      })
      .select("id")
      .maybeSingle();
    if (error) {
      console.warn("[execution_sandbox] insert run failed", error.message);
      return null;
    }
    const runId = data?.id ?? null;

    // Mirror leve na timeline (não bloqueante).
    try {
      await recordOperationalEventSafe(ctx, {
        entity_type: "coordinator_action",
        entity_id: result.proposal.id,
        event_type: "operational_action_triggered",
        severity: result.state === "blocked" ? "warning" : "info",
        description: `Sandbox dry-run · ${result.state} · ${result.proposal.title.slice(0, 160)}`,
        metadata: {
          channel: "operational_execution_sandbox",
          proposal_id: result.proposal.id,
          simulation_id: result.simulationId,
          sandbox_run_id: runId,
          state: result.state,
          action_kind: result.proposal.actionKind,
          mutations_count: result.mutations.length,
        },
      });
    } catch (e) {
      console.warn("[execution_sandbox] timeline mirror skipped", e);
    }

    return runId;
  } catch (e) {
    console.warn("[execution_sandbox] insert run threw", e);
    return null;
  }
}

/**
 * `result_snapshot` precisa ser JSON-serializável (sem `Date`, `Map`, etc.).
 * O sandbox já produz objetos simples; clonamos via JSON para garantir.
 */
function serializeForJsonb(value: unknown): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

/**
 * Entrada principal: executa o sandbox em uma proposta e retorna o resultado
 * estruturado. RBAC: apenas operational managers.
 */
export async function runOperationalSandboxSimulation(
  ctx: ServiceCtx,
  input: RunSimulationInput,
): Promise<OperationalSimulationResult> {
  if (!isOperationalManager(ctx.role)) {
    throw new PermissionError("Sandbox restrito a coordenação / administradores.");
  }

  const proposalId = expectUuid(input.proposalId, "proposalId");
  const proposal = await loadProposal(ctx, proposalId);
  const snapshot = await loadOperationalCommandCenterSnapshot(ctx);

  const preflight = evaluateProposalSimulability(proposal);
  const maxAffected = clampAffectedEntitiesLimit(input.maxAffectedEntities);
  const ids = extractEntityIdsFromProposal(proposal);
  const simulationId = generateSimulationId();

  if (!preflight.ok) {
    const blockResult = buildBlockedResult({
      proposal,
      snapshot,
      simulationId,
      blockReason: preflight.blockReason!,
      detail: preflight.detail ?? "Pré-condição da simulação falhou.",
    });
    const sid = await persistSimulationRun(ctx, blockResult);
    if (sid) blockResult.sandboxRunId = sid;
    return blockResult;
  }

  const dry = runDryRunForActionKind({
    proposal,
    snapshot,
    ids,
    maxAffectedEntities: maxAffected,
  });

  const mutations = dry.mutations.slice(0, 24);
  const rollbackPreview = buildRollbackPreview(mutations);

  const impact = buildImpactAnalysis({
    scoring: snapshot.scoring,
    forecast: snapshot.recommendations.forecast,
    affectedEntities: dry.affectedEntities.slice(0, maxAffected),
    projectedScoreChanges: dry.projectedScoreChanges,
    projectedConflicts: dry.projectedConflicts,
  });

  const safety = evaluateExecutionSafety({
    proposal,
    snapshot,
    impact,
    mutations,
  });

  const summary = buildExecutionSummary({
    proposal,
    snapshot,
    bullets: dry.summaryBullets,
    semanticTags: dry.semanticTags,
    state: safety.state,
  });

  const explainabilityNarrative = [
    `Simulação ${safety.state} para ${proposal.actionKind}.`,
    `Mutações projetadas: ${mutations.length}; entidades afetadas: ${impact.affectedEntityCount}.`,
    `Forecast: ${impact.projectedForecast.before} → ${impact.projectedForecast.after}.`,
  ];

  const result: OperationalSimulationResult = {
    schemaVersion: OPERATIONAL_EXECUTION_SANDBOX_SCHEMA_VERSION,
    simulationId,
    simulatedAt: new Date().toISOString(),
    proposal: buildProposalSnapshot(proposal),
    state: safety.state,
    blockReason: safety.blockReason,
    summary,
    mutations,
    rollbackPreview,
    impact,
    safety,
    explainability: buildExplainability(proposal, explainabilityNarrative),
    recommendationContext: {
      forecast: snapshot.recommendations.forecast,
      headline: snapshot.recommendations.summary.headline,
    },
  };

  const sid = await persistSimulationRun(ctx, result);
  if (sid) result.sandboxRunId = sid;
  return result;
}

function buildBlockedResult(input: {
  proposal: OperationalActionProposalDto;
  snapshot: OperationalCommandCenterSnapshot;
  simulationId: string;
  blockReason: NonNullable<OperationalSimulationResult["blockReason"]>;
  detail: string;
}): OperationalSimulationResult {
  const safety = evaluateExecutionSafety({
    proposal: input.proposal,
    snapshot: input.snapshot,
    impact: {
      overallSeverity: "none",
      affectedEntityCount: 0,
      affectedEntities: [],
      projectedScoreChanges: [],
      projectedForecast: {
        before: input.snapshot.recommendations.forecast.projection,
        after: input.snapshot.recommendations.forecast.projection,
        rationale: "Simulação bloqueada antes do dry-run.",
      },
      projectedConflicts: [],
      projectedHealthStateAfter: input.snapshot.scoring.healthState,
    },
    mutations: [],
    preBlock: { reason: input.blockReason, detail: input.detail },
  });

  return {
    schemaVersion: OPERATIONAL_EXECUTION_SANDBOX_SCHEMA_VERSION,
    simulationId: input.simulationId,
    simulatedAt: new Date().toISOString(),
    proposal: buildProposalSnapshot(input.proposal),
    state: "blocked",
    blockReason: input.blockReason,
    summary: {
      headline: `Simulação bloqueada: ${input.proposal.title}`.slice(0, 240),
      bullets: [input.detail],
      semanticTags: ["sandbox_blocked"],
    },
    mutations: [],
    rollbackPreview: [],
    impact: {
      overallSeverity: "none",
      affectedEntityCount: 0,
      affectedEntities: [],
      projectedScoreChanges: [],
      projectedForecast: {
        before: input.snapshot.recommendations.forecast.projection,
        after: input.snapshot.recommendations.forecast.projection,
        rationale: "Simulação bloqueada antes do dry-run.",
      },
      projectedConflicts: [],
      projectedHealthStateAfter: input.snapshot.scoring.healthState,
    },
    safety,
    explainability: buildExplainability(input.proposal, [
      "Sandbox bloqueou a simulação por política de pré-execução.",
      input.detail,
    ]),
    recommendationContext: {
      forecast: input.snapshot.recommendations.forecast,
      headline: input.snapshot.recommendations.summary.headline,
    },
  };
}

function generateSimulationId(): string {
  // Identificador hipotético para correlacionar mutations simuladas — sem UUID server-side aqui.
  const rand = Math.random().toString(16).slice(2, 10);
  return `sim-${Date.now().toString(36)}-${rand}`;
}
