/**
 * operational-orchestration-service — coordenação supervisionada de workflows multi-passo.
 * Cada avanço (portão, simulação, execução, rollback) é disparado explicitamente por gestor.
 */
import type { Database, Json } from "@/lib/database.types";
import { isOperationalManager } from "@/lib/auth/rbac";
import { mapPostgresError, PermissionError, ValidationError } from "@/lib/domain/operations/errors";
import { expectUuid } from "@/lib/domain/operations/validation";
import { effectiveProposalState } from "@/lib/operations/action-proposals";
import {
  edgesFromDependsOn,
  topologicalOrdering,
  depsSatisfied,
} from "@/lib/operations/orchestration/dependency-graph";
import { appendOrchestrationNarrative } from "@/lib/operations/orchestration/narrative";
import { buildPlannedStepsFromChain } from "@/lib/operations/orchestration/planner";
import {
  assertConcurrentOrchestrationPolicy,
  mergePolicy,
  policyRefsForPlanValidation,
} from "@/lib/operations/orchestration/policy-engine";
import {
  buildOrchestrationRollbackPlan,
  reconcileRollbackAfterStep,
} from "@/lib/operations/orchestration/rollback-engine";
import type {
  CreateOperationalOrchestrationInput,
  OperationalOrchestrationDto,
  OperationalOrchestrationStepDto,
  OperationalOrchestrationState,
  OrchestrationNarrativeEntry,
  OrchestrationPolicyBundle,
  OrchestrationRollbackPlanItem,
  PlannedOrchestrationStep,
} from "@/lib/operations/orchestration/types";
import { ORCHESTRATION_SCHEMA_VERSION } from "@/lib/operations/orchestration/types";
import { getOperationalActionProposalById } from "@/lib/services/operations/operational-action-proposal-service";
import { recordOperationalEventSafe } from "@/lib/services/operations/operational-event-service";
import {
  tryRecordOrchestrationRollbackPreviewMemory,
  tryRecordOrchestrationRollbackStepMemory,
  tryRecordOrchestrationStepExecutionMemory,
  tryRecordOrchestrationTerminalMemory,
} from "@/lib/services/operations/operational-memory-service";
import { runOperationalSandboxSimulation } from "@/lib/services/operations/operational-execution-sandbox-service";
import { executeSupervisedOperationalMutations } from "@/lib/services/operations/operational-mutation-execution-service";
import { rollbackSupervisedOperationalMutationExecution } from "@/lib/services/operations/operational-mutation-execution-service";
import type { ServiceCtx } from "@/lib/services/operations/types";

type OrchRow = Database["public"]["Tables"]["operational_orchestrations"]["Row"];
type StepRow = Database["public"]["Tables"]["operational_orchestration_steps"]["Row"];

function narrativeFromOrch(orch: OperationalOrchestrationDto): OrchestrationNarrativeEntry[] {
  const raw = orch.narrativeJson;
  return Array.isArray(raw) ? (raw as OrchestrationNarrativeEntry[]) : [];
}

function policyFromOrch(orch: OperationalOrchestrationDto): OrchestrationPolicyBundle {
  return asPolicyBundle(orch.policyBundleJson);
}

function parseDepends(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is number => typeof x === "number" && Number.isFinite(x));
}

function asPolicyBundle(raw: unknown): OrchestrationPolicyBundle {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return mergePolicy(raw as Partial<OrchestrationPolicyBundle>);
  }
  return mergePolicy();
}

function explainObj(step: OperationalOrchestrationStepDto): Record<string, Json> {
  const j = step.explainabilityJson;
  return j && typeof j === "object" && !Array.isArray(j) ? (j as Record<string, Json>) : {};
}

function stepRowToDto(row: StepRow): OperationalOrchestrationStepDto {
  return {
    id: row.id,
    orchestrationId: row.orchestration_id,
    ordinal: row.ordinal,
    stepKind: row.step_kind as OperationalOrchestrationStepDto["stepKind"],
    dependsOnOrdinals: parseDepends(row.depends_on_ordinals),
    proposalId: row.proposal_id ?? "",
    stepState: row.step_state as OperationalOrchestrationStepDto["stepState"],
    sandboxRunId: row.sandbox_run_id,
    mutationExecutionId: row.mutation_execution_id,
    rationale: row.rationale,
    explainabilityJson: (row.explainability_json ?? {}) as Json,
    policyRefsJson: (Array.isArray(row.policy_refs_json) ? row.policy_refs_json : []) as Json,
    lastError: row.last_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function orchRowToDto(
  row: OrchRow,
  steps: OperationalOrchestrationStepDto[],
): OperationalOrchestrationDto {
  const rb = row.rollback_preview_json;
  const rollbackPreviewJson = (
    rb && typeof rb === "object" && !Array.isArray(rb) ? rb : { items: [] }
  ) as Json;
  const eo = row.execution_order_json;
  const executionOrderJson = Array.isArray(eo)
    ? (eo.filter((x) => typeof x === "number") as number[])
    : [];
  return {
    id: row.id,
    tenantId: row.tenant_id,
    createdByProfileId: row.created_by_profile_id,
    state: row.state as OperationalOrchestrationState,
    title: row.title,
    summary: row.summary,
    narrativeJson: (Array.isArray(row.narrative_json) ? row.narrative_json : []) as Json,
    policyBundleJson: (row.policy_bundle_json && typeof row.policy_bundle_json === "object"
      ? row.policy_bundle_json
      : {}) as Json,
    rollbackPreviewJson,
    executionOrderJson,
    approvedByProfileId: row.approved_by_profile_id,
    approvalNote: row.approval_note,
    approvedAt: row.approved_at,
    blockedReason: row.blocked_reason,
    schemaVersion: row.schema_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    steps,
  };
}

async function loadSteps(
  ctx: ServiceCtx,
  orchestrationId: string,
): Promise<OperationalOrchestrationStepDto[]> {
  const { data, error } = await ctx.client
    .from("operational_orchestration_steps")
    .select("*")
    .eq("orchestration_id", orchestrationId)
    .order("ordinal", { ascending: true });
  if (error) throw mapPostgresError(error);
  return ((data ?? []) as StepRow[]).map(stepRowToDto);
}

async function loadOrch(ctx: ServiceCtx, id: string): Promise<OperationalOrchestrationDto> {
  const { data, error } = await ctx.client
    .from("operational_orchestrations")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw mapPostgresError(error);
  if (!data) throw new ValidationError("Orquestração não encontrada.", { id });
  const steps = await loadSteps(ctx, id);
  return orchRowToDto(data as OrchRow, steps);
}

function completedOrdinals(steps: readonly OperationalOrchestrationStepDto[]): Set<number> {
  const s = new Set<number>();
  for (const st of steps) {
    if (st.stepState === "completed" || st.stepState === "skipped") s.add(st.ordinal);
  }
  return s;
}

function findNextPendingStep(
  steps: readonly OperationalOrchestrationStepDto[],
  kind: OperationalOrchestrationStepDto["stepKind"],
): OperationalOrchestrationStepDto | null {
  const done = completedOrdinals(steps);
  const candidates = steps
    .filter((x) => x.stepKind === kind && x.stepState === "pending")
    .sort((a, b) => a.ordinal - b.ordinal);
  for (const c of candidates) {
    if (depsSatisfied(c.ordinal, c.dependsOnOrdinals, done)) return c;
  }
  return null;
}

function executionTopoOrder(steps: readonly PlannedOrchestrationStep[]): number[] {
  const n = steps.length;
  const dependsMap = new Map<number, number[]>();
  for (const s of steps) dependsMap.set(s.ordinal, [...s.dependsOnOrdinals]);
  const edges = edgesFromDependsOn(n, dependsMap);
  return topologicalOrdering(n, edges);
}

function findLatestSandboxRunIdForProposal(
  steps: readonly OperationalOrchestrationStepDto[],
  proposalId: string,
  beforeOrdinal: number,
): string | null {
  let best: { ord: number; id: string } | null = null;
  for (const s of steps) {
    if (s.proposalId !== proposalId) continue;
    if (s.stepKind !== "sandbox_simulation") continue;
    if (s.ordinal >= beforeOrdinal) continue;
    if (s.stepState !== "completed" || !s.sandboxRunId) continue;
    if (!best || s.ordinal > best.ord) best = { ord: s.ordinal, id: s.sandboxRunId };
  }
  return best?.id ?? null;
}

async function patchOrch(
  ctx: ServiceCtx,
  id: string,
  patch: Database["public"]["Tables"]["operational_orchestrations"]["Update"],
): Promise<void> {
  const { error } = await ctx.client
    .from("operational_orchestrations")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", id);
  if (error) throw mapPostgresError(error);
}

async function patchStep(
  ctx: ServiceCtx,
  stepId: string,
  patch: Database["public"]["Tables"]["operational_orchestration_steps"]["Update"],
): Promise<void> {
  const { error } = await ctx.client
    .from("operational_orchestration_steps")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", stepId);
  if (error) throw mapPostgresError(error);
}

async function recomputeOrchestrationProgressState(
  ctx: ServiceCtx,
  orch: OperationalOrchestrationDto,
): Promise<void> {
  if (orch.state !== "orchestrating" && orch.state !== "partially_executed") return;
  const steps = orch.steps;
  const anyFailed = steps.some((s) => s.stepState === "failed");
  if (anyFailed) {
    await patchOrch(ctx, orch.id, {
      state: "blocked",
      blocked_reason: "Passo operacional falhou — revise o fluxo antes de continuar.",
    });
    return;
  }
  const pending = steps.filter((s) => s.stepState === "pending" || s.stepState === "running");
  if (pending.length > 0) {
    const anyExecDone = steps.some(
      (s) => s.stepKind === "supervised_execution" && s.stepState === "completed",
    );
    const moreExec = steps.some(
      (s) =>
        s.stepKind === "supervised_execution" &&
        (s.stepState === "pending" || s.stepState === "ready"),
    );
    if (anyExecDone && moreExec) {
      await patchOrch(ctx, orch.id, { state: "partially_executed" });
    }
    return;
  }
  const execSteps = steps.filter((s) => s.stepKind === "supervised_execution");
  const allExecRolled =
    execSteps.length > 0 && execSteps.every((s) => s.stepState === "rolled_back");
  const anyExecCompleted = execSteps.some((s) => s.stepState === "completed");
  if (allExecRolled && !anyExecCompleted) {
    await patchOrch(ctx, orch.id, { state: "rolled_back" });
    await recordOperationalEventSafe(ctx, {
      entity_type: "orchestration",
      entity_id: orch.id,
      event_type: "orchestration_rolled_back",
      severity: "warning",
      description: "Orquestração encerrada em rollback completo (execuções desfeitas).",
      metadata: { orchestration_id: orch.id },
    });
    void tryRecordOrchestrationTerminalMemory(ctx, {
      orchestrationId: orch.id,
      terminal: "rolled_back",
      title: orch.title,
    });
    return;
  }
  await patchOrch(ctx, orch.id, { state: "completed" });
  await recordOperationalEventSafe(ctx, {
    entity_type: "orchestration",
    entity_id: orch.id,
    event_type: "orchestration_completed",
    severity: "info",
    description: "Orquestração concluída — passos supervisionados finalizados.",
    metadata: { orchestration_id: orch.id },
  });
  void tryRecordOrchestrationTerminalMemory(ctx, {
    orchestrationId: orch.id,
    terminal: "completed",
    title: orch.title,
  });
}

export async function createOperationalOrchestration(
  ctx: ServiceCtx,
  input: CreateOperationalOrchestrationInput,
): Promise<OperationalOrchestrationDto> {
  if (!isOperationalManager(ctx.role)) {
    throw new PermissionError("Orquestração restrita a coordenação / administradores.");
  }
  const { policy, steps: planned } = buildPlannedStepsFromChain(input);
  const order = executionTopoOrder(planned);
  const policyRefs = policyRefsForPlanValidation(policy);
  const narrative = appendOrchestrationNarrative([], {
    actorProfileId: ctx.actorProfileId,
    phase: "create",
    message: `Orquestração criada com ${planned.length} passo(s) supervisionados (ordem topológica validada).`,
    policyRefs: policyRefs.map((p) => p.id),
  });

  const insertOrch: Database["public"]["Tables"]["operational_orchestrations"]["Insert"] = {
    tenant_id: ctx.tenantId,
    created_by_profile_id: ctx.actorProfileId,
    state: "planned",
    title: input.title.trim(),
    summary: (input.summary ?? "").trim(),
    narrative_json: narrative as never,
    policy_bundle_json: policy as never,
    rollback_preview_json: { items: [] } as never,
    execution_order_json: order as never,
    schema_version: ORCHESTRATION_SCHEMA_VERSION,
  };

  const { data: orch, error: oErr } = await ctx.client
    .from("operational_orchestrations")
    .insert(insertOrch)
    .select("*")
    .single();
  if (oErr) throw mapPostgresError(oErr);
  const orchId = (orch as OrchRow).id;

  const stepRows: Database["public"]["Tables"]["operational_orchestration_steps"]["Insert"][] =
    planned.map((s) => ({
      orchestration_id: orchId,
      ordinal: s.ordinal,
      step_kind: s.stepKind,
      depends_on_ordinals: s.dependsOnOrdinals as never,
      proposal_id: s.proposalId,
      step_state: "pending",
      rationale: s.rationale,
      explainability_json: {
        schemaVersion: ORCHESTRATION_SCHEMA_VERSION,
        proposalId: s.proposalId,
        dependsOnOrdinals: s.dependsOnOrdinals,
        policyRefs,
      } as Record<string, unknown> as never,
      policy_refs_json: policyRefs as never,
    }));
  const { error: sErr } = await ctx.client.from("operational_orchestration_steps").insert(stepRows);
  if (sErr) throw mapPostgresError(sErr);

  await recordOperationalEventSafe(ctx, {
    entity_type: "orchestration",
    entity_id: orchId,
    event_type: "orchestration_created",
    severity: "info",
    description: `Orquestração operacional criada: ${input.title.trim().slice(0, 160)}`,
    metadata: {
      orchestration_id: orchId,
      step_count: planned.length,
    },
  });

  return loadOrch(ctx, orchId);
}

export async function listOperationalOrchestrations(
  ctx: ServiceCtx,
): Promise<OperationalOrchestrationDto[]> {
  if (!isOperationalManager(ctx.role)) {
    throw new PermissionError("Lista de orquestrações restrita a coordenação / administradores.");
  }
  const { data, error } = await ctx.client
    .from("operational_orchestrations")
    .select("id")
    .eq("tenant_id", ctx.tenantId)
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) throw mapPostgresError(error);
  const ids = ((data ?? []) as { id: string }[]).map((r) => r.id);
  const out: OperationalOrchestrationDto[] = [];
  for (const id of ids) {
    out.push(await loadOrch(ctx, id));
  }
  return out;
}

export async function getOperationalOrchestrationById(
  ctx: ServiceCtx,
  orchestrationId: string,
): Promise<OperationalOrchestrationDto> {
  if (!isOperationalManager(ctx.role)) {
    throw new PermissionError("Detalhe de orquestração restrito a coordenação / administradores.");
  }
  const id = expectUuid(orchestrationId, "orchestrationId");
  return loadOrch(ctx, id);
}

export async function submitOperationalOrchestrationForApproval(
  ctx: ServiceCtx,
  orchestrationId: string,
): Promise<OperationalOrchestrationDto> {
  if (!isOperationalManager(ctx.role)) {
    throw new PermissionError(
      "Submissão de orquestração restrita a coordenação / administradores.",
    );
  }
  const id = expectUuid(orchestrationId, "orchestrationId");
  const orch = await loadOrch(ctx, id);
  if (orch.state !== "planned") {
    throw new ValidationError("Somente orquestrações em rascunho (planned) podem ser submetidas.", {
      state: orch.state,
    });
  }
  const narrative = appendOrchestrationNarrative(narrativeFromOrch(orch), {
    actorProfileId: ctx.actorProfileId,
    phase: "submit",
    message: "Fluxo submetido para aprovação governada (awaiting_approval).",
    policyRefs: ["orch.approval_required"],
  });
  await patchOrch(ctx, id, {
    state: "awaiting_approval",
    narrative_json: narrative as never,
  });
  await recordOperationalEventSafe(ctx, {
    entity_type: "orchestration",
    entity_id: id,
    event_type: "orchestration_submitted_for_approval",
    severity: "info",
    description: `Orquestração aguardando aprovação: ${orch.title.slice(0, 160)}`,
    metadata: { orchestration_id: id },
  });
  return loadOrch(ctx, id);
}

export async function approveOperationalOrchestration(
  ctx: ServiceCtx,
  input: { orchestrationId: string; approvalNote?: string },
): Promise<OperationalOrchestrationDto> {
  if (!isOperationalManager(ctx.role)) {
    throw new PermissionError(
      "Aprovação de orquestração restrita a coordenação / administradores.",
    );
  }
  const id = expectUuid(input.orchestrationId, "orchestrationId");
  const orch = await loadOrch(ctx, id);
  if (orch.state !== "awaiting_approval") {
    throw new ValidationError("Somente orquestrações em awaiting_approval podem ser aprovadas.", {
      state: orch.state,
    });
  }
  await assertConcurrentOrchestrationPolicy(ctx, policyFromOrch(orch), id);
  const now = new Date().toISOString();
  const narrative = appendOrchestrationNarrative(narrativeFromOrch(orch), {
    actorProfileId: ctx.actorProfileId,
    phase: "approve",
    message: "Orquestração aprovada — avanços operacionais passam a ser coordenados passo a passo.",
    policyRefs: ["orch.max_concurrent_active", "orch.dag_acyclic"],
  });
  await patchOrch(ctx, id, {
    state: "orchestrating",
    approved_by_profile_id: ctx.actorProfileId,
    approved_at: now,
    approval_note: input.approvalNote?.trim() || null,
    narrative_json: narrative as never,
  });
  await recordOperationalEventSafe(ctx, {
    entity_type: "orchestration",
    entity_id: id,
    event_type: "orchestration_approved",
    severity: "info",
    description: `Orquestração aprovada: ${orch.title.slice(0, 160)}`,
    metadata: { orchestration_id: id, approved_by: ctx.actorProfileId },
  });
  return loadOrch(ctx, id);
}

export async function advanceOperationalProposalGate(
  ctx: ServiceCtx,
  orchestrationId: string,
): Promise<OperationalOrchestrationDto> {
  if (!isOperationalManager(ctx.role)) {
    throw new PermissionError("Avanço de portão restrito a coordenação / administradores.");
  }
  const id = expectUuid(orchestrationId, "orchestrationId");
  let orch = await loadOrch(ctx, id);
  if (orch.state !== "orchestrating" && orch.state !== "partially_executed") {
    throw new ValidationError("Orquestração não está em execução supervisionada.", {
      state: orch.state,
    });
  }
  const step = findNextPendingStep(orch.steps, "proposal_gate");
  if (!step) return orch;

  const proposal = await getOperationalActionProposalById(ctx, step.proposalId);
  const eff = effectiveProposalState({
    stored: proposal.storedState,
    expiresAtIso: proposal.expiresAt,
  });
  if (policyFromOrch(orch).requireApprovedProposalForSimulation && eff !== "approved") {
    const narrative = appendOrchestrationNarrative(narrativeFromOrch(orch), {
      actorProfileId: ctx.actorProfileId,
      phase: "gate_blocked",
      message: `Portão bloqueado: proposta ${proposal.id} não está aprovada (estado efetivo ${eff}).`,
      proposalId: proposal.id,
      stepOrdinal: step.ordinal,
    });
    await patchStep(ctx, step.id, {
      step_state: "failed",
      last_error: `Proposta precisa estar aprovada para seguir o pipeline (estado ${eff}).`,
      explainability_json: {
        ...explainObj(step),
        gate: { effectiveState: eff, storedState: proposal.storedState },
      } as never,
    });
    await patchOrch(ctx, id, {
      state: "blocked",
      blocked_reason: "Portão de proposta falhou.",
      narrative_json: narrative as never,
    });
    await recordOperationalEventSafe(ctx, {
      entity_type: "orchestration",
      entity_id: id,
      event_type: "orchestration_blocked",
      severity: "warning",
      description: `Orquestração bloqueada no portão (ordinal ${step.ordinal}).`,
      metadata: { orchestration_id: id, proposal_id: proposal.id },
    });
    return loadOrch(ctx, id);
  }

  const narrative = appendOrchestrationNarrative(narrativeFromOrch(orch), {
    actorProfileId: ctx.actorProfileId,
    phase: "gate_pass",
    message: `Portão OK — proposta ${proposal.id} elegível para simulação/execução supervisionada.`,
    proposalId: proposal.id,
    stepOrdinal: step.ordinal,
    policyRefs: ["orch.require_approved_proposal"],
  });
  await patchStep(ctx, step.id, {
    step_state: "completed",
    explainability_json: {
      ...explainObj(step),
      gate: {
        effectiveState: eff,
        storedState: proposal.storedState,
        rationale: proposal.operationalRationale,
      },
    } as never,
  });
  await patchOrch(ctx, id, { narrative_json: narrative as never });
  await recordOperationalEventSafe(ctx, {
    entity_type: "orchestration",
    entity_id: id,
    event_type: "orchestration_step_advanced",
    severity: "info",
    description: `Portão concluído · passo ${step.ordinal} · proposta ${proposal.title.slice(0, 80)}`,
    metadata: { orchestration_id: id, step_ordinal: step.ordinal, proposal_id: proposal.id },
  });
  orch = await loadOrch(ctx, id);
  await recomputeOrchestrationProgressState(ctx, orch);
  return loadOrch(ctx, id);
}

export async function runNextOperationalOrchestrationSandbox(
  ctx: ServiceCtx,
  orchestrationId: string,
): Promise<OperationalOrchestrationDto> {
  if (!isOperationalManager(ctx.role)) {
    throw new PermissionError(
      "Simulação na orquestração restrita a coordenação / administradores.",
    );
  }
  const id = expectUuid(orchestrationId, "orchestrationId");
  let orch = await loadOrch(ctx, id);
  if (orch.state !== "orchestrating" && orch.state !== "partially_executed") {
    throw new ValidationError("Orquestração não está em execução supervisionada.", {
      state: orch.state,
    });
  }

  const step = findNextPendingStep(orch.steps, "sandbox_simulation");
  if (!step) return orch;

  await patchStep(ctx, step.id, { step_state: "running" });
  const sim = await runOperationalSandboxSimulation(ctx, { proposalId: step.proposalId });
  const narrative = appendOrchestrationNarrative(narrativeFromOrch(orch), {
    actorProfileId: ctx.actorProfileId,
    phase: "sandbox",
    message: `Simulação ${sim.state} — ${sim.summary.headline.slice(0, 200)}`,
    proposalId: step.proposalId,
    stepOrdinal: step.ordinal,
    policyRefs: sim.safety.policyChecks.map((p) => p.id),
  });

  if (sim.state === "blocked") {
    await patchStep(ctx, step.id, {
      step_state: "failed",
      last_error: sim.blockReason ?? "blocked",
      sandbox_run_id: sim.sandboxRunId ?? null,
      explainability_json: {
        ...explainObj(step),
        simulation: { state: sim.state, summary: sim.summary, explainability: sim.explainability },
      } as never,
    });
    await patchOrch(ctx, id, {
      state: "blocked",
      blocked_reason: "Simulação bloqueada — revise proposta ou políticas.",
      narrative_json: narrative as never,
    });
    await recordOperationalEventSafe(ctx, {
      entity_type: "orchestration",
      entity_id: id,
      event_type: "orchestration_blocked",
      severity: "warning",
      description: `Simulação bloqueada no passo ${step.ordinal}.`,
      metadata: { orchestration_id: id, sandbox_run_id: sim.sandboxRunId },
    });
    return loadOrch(ctx, id);
  }

  await patchStep(ctx, step.id, {
    step_state: "completed",
    sandbox_run_id: sim.sandboxRunId ?? null,
    explainability_json: {
      ...explainObj(step),
      simulation: {
        state: sim.state,
        summary: sim.summary,
        impact: sim.impact,
        safety: sim.safety,
        explainability: sim.explainability,
        proposal: sim.proposal,
      },
    } as never,
  });
  await patchOrch(ctx, id, { narrative_json: narrative as never });
  await recordOperationalEventSafe(ctx, {
    entity_type: "orchestration",
    entity_id: id,
    event_type: "orchestration_step_advanced",
    severity: sim.state === "risky" ? "warning" : "info",
    description: `Simulação concluída (${sim.state}) · passo ${step.ordinal}`,
    metadata: {
      orchestration_id: id,
      sandbox_run_id: sim.sandboxRunId,
      proposal_id: step.proposalId,
    },
  });
  orch = await loadOrch(ctx, id);
  await recomputeOrchestrationProgressState(ctx, orch);
  return loadOrch(ctx, id);
}

export async function executeNextOperationalOrchestrationMutation(
  ctx: ServiceCtx,
  input: {
    orchestrationId: string;
    approvalConfirmed: boolean;
    idempotencyKey: string;
  },
): Promise<OperationalOrchestrationDto> {
  if (!isOperationalManager(ctx.role)) {
    throw new PermissionError("Execução na orquestração restrita a coordenação / administradores.");
  }
  const id = expectUuid(input.orchestrationId, "orchestrationId");
  let orch = await loadOrch(ctx, id);
  if (orch.state !== "orchestrating" && orch.state !== "partially_executed") {
    throw new ValidationError("Orquestração não está em execução supervisionada.", {
      state: orch.state,
    });
  }

  const step = findNextPendingStep(orch.steps, "supervised_execution");
  if (!step) return orch;

  const sandboxRunId = findLatestSandboxRunIdForProposal(orch.steps, step.proposalId, step.ordinal);
  if (!sandboxRunId) {
    throw new ValidationError(
      "Não há simulação sandbox concluída para esta proposta antes do passo de execução.",
      {
        proposalId: step.proposalId,
      },
    );
  }

  const simRow = await ctx.client
    .from("operational_execution_sandbox_runs")
    .select("state")
    .eq("tenant_id", ctx.tenantId)
    .eq("id", sandboxRunId)
    .maybeSingle();
  if (simRow.error) throw mapPostgresError(simRow.error);
  const simState = (simRow.data as { state: string } | null)?.state;
  if (policyFromOrch(orch).requireSafeSimulationForExecution && simState !== "safe") {
    throw new ValidationError("Política: execução exige sandbox com estado safe.", {
      sandboxRunId,
      simState: simState ?? null,
    });
  }

  await patchStep(ctx, step.id, { step_state: "running" });
  const key =
    input.idempotencyKey.trim() ||
    `orch:${id}:step:${step.ordinal}:${step.proposalId}`.slice(0, 200);
  const exec = await executeSupervisedOperationalMutations(ctx, {
    proposalId: step.proposalId,
    sandboxRunId,
    approvalConfirmed: input.approvalConfirmed,
    idempotencyKey: key,
  });

  const checks = Array.isArray(exec.execution.policyChecksSnapshot)
    ? exec.execution.policyChecksSnapshot
    : [];
  const narrative = appendOrchestrationNarrative(narrativeFromOrch(orch), {
    actorProfileId: ctx.actorProfileId,
    phase: "execution",
    message: `Execução supervisionada registrada (${exec.execution.state}).`,
    proposalId: step.proposalId,
    stepOrdinal: step.ordinal,
    policyRefs: checks.map((p: { id: string }) => p.id),
  });

  await patchStep(ctx, step.id, {
    step_state: exec.execution.state === "executed" ? "completed" : "failed",
    mutation_execution_id: exec.execution.id,
    last_error: exec.execution.state === "executed" ? null : exec.execution.blockReason,
    explainability_json: {
      ...explainObj(step),
      execution: exec.execution.explainabilityJson as Json,
    } as never,
  });
  const orchPatch: Database["public"]["Tables"]["operational_orchestrations"]["Update"] = {
    narrative_json: narrative as never,
  };
  if (exec.execution.state !== "executed") {
    orchPatch.state = "blocked";
    orchPatch.blocked_reason = exec.execution.blockReason ?? "Execução supervisionada falhou.";
  }
  await patchOrch(ctx, id, orchPatch);
  await recordOperationalEventSafe(ctx, {
    entity_type: "orchestration",
    entity_id: id,
    event_type: "orchestration_step_advanced",
    severity: exec.execution.state === "executed" ? "info" : "warning",
    description: `Execução ${exec.execution.state} · passo ${step.ordinal}`,
    metadata: {
      orchestration_id: id,
      execution_id: exec.execution.id,
      proposal_id: step.proposalId,
    },
  });
  void tryRecordOrchestrationStepExecutionMemory(ctx, {
    orchestrationId: id,
    proposalId: step.proposalId,
    stepOrdinal: step.ordinal,
    executionId: exec.execution.id,
    executionState: exec.execution.state,
  });
  orch = await loadOrch(ctx, id);
  await recomputeOrchestrationProgressState(ctx, orch);
  return loadOrch(ctx, id);
}

export async function previewOperationalOrchestrationRollback(
  ctx: ServiceCtx,
  orchestrationId: string,
): Promise<OperationalOrchestrationDto> {
  if (!isOperationalManager(ctx.role)) {
    throw new PermissionError("Preview de rollback restrito a coordenação / administradores.");
  }
  const id = expectUuid(orchestrationId, "orchestrationId");
  const orch = await loadOrch(ctx, id);
  const items = buildOrchestrationRollbackPlan(orch.steps);
  const enriched: OrchestrationRollbackPlanItem[] = [];
  for (const it of items) {
    const exec = await ctx.client
      .from("operational_mutation_executions")
      .select("id, state")
      .eq("tenant_id", ctx.tenantId)
      .eq("id", it.mutationExecutionId)
      .maybeSingle();
    if (exec.error) throw mapPostgresError(exec.error);
    const st = (exec.data as { state: string } | null)?.state;
    if (st === "executed") enriched.push(it);
  }
  const preview = { items: enriched, generatedAt: new Date().toISOString() };
  const narrative = appendOrchestrationNarrative(narrativeFromOrch(orch), {
    actorProfileId: ctx.actorProfileId,
    phase: "rollback_preview",
    message: `Preview de rollback em cadeia: ${enriched.length} execução(ões) elegíveis (estado executed).`,
  });
  await patchOrch(ctx, id, {
    rollback_preview_json: preview as never,
    narrative_json: narrative as never,
  });
  await recordOperationalEventSafe(ctx, {
    entity_type: "orchestration",
    entity_id: id,
    event_type: "orchestration_rollback_previewed",
    severity: "info",
    description: `Rollback em cadeia pré-visualizado (${enriched.length} passo(s)).`,
    metadata: { orchestration_id: id, execution_ids: enriched.map((e) => e.mutationExecutionId) },
  });
  void tryRecordOrchestrationRollbackPreviewMemory(ctx, {
    orchestrationId: id,
    eligibleExecutions: enriched.length,
  });
  return loadOrch(ctx, id);
}

export async function rollbackNextOperationalOrchestrationExecution(
  ctx: ServiceCtx,
  orchestrationId: string,
): Promise<OperationalOrchestrationDto> {
  if (!isOperationalManager(ctx.role)) {
    throw new PermissionError("Rollback na orquestração restrito a coordenação / administradores.");
  }
  const id = expectUuid(orchestrationId, "orchestrationId");
  let orch = await loadOrch(ctx, id);
  let plan = buildOrchestrationRollbackPlan(orch.steps).filter((it) => {
    const step = orch.steps.find((s) => s.ordinal === it.stepOrdinal);
    return step?.stepState === "completed";
  });
  for (const it of [...plan]) {
    const { data } = await ctx.client
      .from("operational_mutation_executions")
      .select("state")
      .eq("tenant_id", ctx.tenantId)
      .eq("id", it.mutationExecutionId)
      .maybeSingle();
    const st = (data as { state: string } | null)?.state;
    if (st !== "executed") plan = reconcileRollbackAfterStep(plan, it.mutationExecutionId);
  }
  const head = plan[0];
  if (!head) {
    throw new ValidationError("Não há execuções em estado executed para rollback encadeado.");
  }

  await rollbackSupervisedOperationalMutationExecution(ctx, {
    executionId: head.mutationExecutionId,
  });

  const stepRow = orch.steps.find((s) => s.ordinal === head.stepOrdinal);
  if (stepRow) {
    await patchStep(ctx, stepRow.id, { step_state: "rolled_back" });
  }
  const narrative = appendOrchestrationNarrative(narrativeFromOrch(orch), {
    actorProfileId: ctx.actorProfileId,
    phase: "rollback_step",
    message: `Rollback aplicado à execução ${head.mutationExecutionId.slice(0, 8)}… (cadeia supervisionada).`,
    stepOrdinal: head.stepOrdinal,
  });
  await patchOrch(ctx, id, { narrative_json: narrative as never });
  await recordOperationalEventSafe(ctx, {
    entity_type: "orchestration",
    entity_id: id,
    event_type: "orchestration_rollback_step",
    severity: "warning",
    description: `Rollback encadeado · execução ${head.mutationExecutionId.slice(0, 10)}…`,
    metadata: { orchestration_id: id, execution_id: head.mutationExecutionId },
  });
  void tryRecordOrchestrationRollbackStepMemory(ctx, {
    orchestrationId: id,
    executionId: head.mutationExecutionId,
  });
  orch = await loadOrch(ctx, id);
  const remaining = buildOrchestrationRollbackPlan(orch.steps).filter((it) => {
    const st = orch.steps.find((s) => s.ordinal === it.stepOrdinal)?.stepState;
    return st === "completed";
  });
  if (remaining.length === 0) {
    await patchOrch(ctx, id, { state: "rolled_back" });
    await recordOperationalEventSafe(ctx, {
      entity_type: "orchestration",
      entity_id: id,
      event_type: "orchestration_rolled_back",
      severity: "warning",
      description: "Cadeia de rollback concluída para esta orquestração.",
      metadata: { orchestration_id: id },
    });
    void tryRecordOrchestrationTerminalMemory(ctx, {
      orchestrationId: id,
      terminal: "rolled_back",
      title: orch.title,
    });
  } else if (orch.state === "completed") {
    await patchOrch(ctx, id, { state: "partially_executed" });
  }
  return loadOrch(ctx, id);
}
