/**
 * Camada de execução supervisionada de mutações operacionais (pós-sandbox `safe`).
 *
 * - Exige proposta aprovada, simulação persistida segura, confirmação explícita e policy checks sem `fail`.
 * - Idempotência por `idempotency_key` e lock lógico (uma execução ativa por proposta).
 * - Compensação em falha via `rollbackAppliedSteps` (atribuições pendentes + marcos de timeline).
 */
import type { Database } from "@/lib/database.types";
import { isOperationalManager } from "@/lib/auth/rbac";
import {
  ConflictError,
  isDomainError,
  mapPostgresError,
  PermissionError,
  ValidationError,
} from "@/lib/domain/operations/errors";
import { expectUuid } from "@/lib/domain/operations/validation";
import type { PolicyCheckResult } from "@/lib/operations/execution-sandbox/types";
import type { OperationalSimulationResult } from "@/lib/operations/execution-sandbox/types";
import {
  applySimulationMutationsOrdered,
  assertApprovalConfirmed,
  assertProposalApprovedForExecution,
  assertSandboxRunSafeForExecution,
  buildExecutionExplainability,
  buildExecutionResultPayload,
  buildRollbackAuditPayload,
  parseSimulationResultSnapshot,
  rollbackAppliedSteps,
  snapshotPolicyChecks,
  summarizeAffectedFromSimulation,
  validateRollbackAllowed,
} from "@/lib/operations/mutation-execution";
import type {
  AppliedForwardStep,
  ExecuteSupervisedOperationalMutationsInput,
  ExecuteSupervisedOperationalMutationsResult,
  OperationalMutationExecutionDto,
  RollbackSupervisedExecutionInput,
} from "@/lib/operations/mutation-execution/types";
import { getOperationalActionProposalById } from "@/lib/services/operations/operational-action-proposal-service";
import { recordOperationalEventSafe } from "@/lib/services/operations/operational-event-service";
import {
  tryRecordExecutionOutcomeMemory,
  tryRecordRollbackSignalMemory,
} from "@/lib/services/operations/operational-memory-service";
import type { ServiceCtx } from "@/lib/services/operations/types";

type ExecutionRow = Database["public"]["Tables"]["operational_mutation_executions"]["Row"];

function asPolicyChecks(raw: unknown): PolicyCheckResult[] {
  if (!Array.isArray(raw)) return [];
  return raw as PolicyCheckResult[];
}

function rowToDto(row: ExecutionRow): OperationalMutationExecutionDto {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    proposalId: row.proposal_id,
    sandboxRunId: row.sandbox_run_id,
    actorProfileId: row.actor_profile_id,
    state: row.state,
    approvalConfirmed: row.approval_confirmed,
    idempotencyKey: row.idempotency_key,
    blockReason: row.block_reason,
    policyChecksSnapshot: asPolicyChecks(row.policy_checks_snapshot),
    explainabilityJson:
      row.explainability_json &&
      typeof row.explainability_json === "object" &&
      !Array.isArray(row.explainability_json)
        ? (row.explainability_json as Record<string, unknown>)
        : {},
    appliedStepsJson: Array.isArray(row.applied_steps_json)
      ? (row.applied_steps_json as AppliedForwardStep[])
      : [],
    resultPayload:
      row.result_payload &&
      typeof row.result_payload === "object" &&
      !Array.isArray(row.result_payload)
        ? (row.result_payload as Record<string, unknown>)
        : {},
    rollbackPayload:
      row.rollback_payload &&
      typeof row.rollback_payload === "object" &&
      !Array.isArray(row.rollback_payload)
        ? (row.rollback_payload as Record<string, unknown>)
        : {},
    affectedEntitiesJson: Array.isArray(row.affected_entities_json)
      ? row.affected_entities_json
      : [],
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function loadSandboxRunRow(
  ctx: ServiceCtx,
  sandboxRunId: string,
): Promise<{
  id: string;
  proposal_id: string;
  state: string;
  result_snapshot: Record<string, unknown>;
}> {
  const id = expectUuid(sandboxRunId, "sandboxRunId");
  const { data, error } = await ctx.client
    .from("operational_execution_sandbox_runs")
    .select("id, proposal_id, state, result_snapshot")
    .eq("tenant_id", ctx.tenantId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw mapPostgresError(error);
  if (!data) throw new ValidationError("Sandbox run não encontrado.", { sandboxRunId: id });
  const snap = data.result_snapshot;
  if (!snap || typeof snap !== "object" || Array.isArray(snap)) {
    throw new ValidationError("Sandbox run sem snapshot de resultado.");
  }
  return {
    id: data.id,
    proposal_id: data.proposal_id,
    state: data.state,
    result_snapshot: snap as Record<string, unknown>,
  };
}

async function findExecutionByIdempotency(
  ctx: ServiceCtx,
  key: string,
): Promise<ExecutionRow | null> {
  const { data, error } = await ctx.client
    .from("operational_mutation_executions")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("idempotency_key", key)
    .maybeSingle();
  if (error) throw mapPostgresError(error);
  return data as ExecutionRow | null;
}

async function assertNoActiveExecution(ctx: ServiceCtx, proposalId: string): Promise<void> {
  const { data, error } = await ctx.client
    .from("operational_mutation_executions")
    .select("id, state")
    .eq("tenant_id", ctx.tenantId)
    .eq("proposal_id", proposalId)
    .in("state", ["queued", "executing"])
    .limit(1);
  if (error) throw mapPostgresError(error);
  if (data && data.length > 0) {
    throw new ValidationError(
      "Já existe execução ativa (queued/executing) para esta proposta — aguarde conclusão ou falha.",
      { executionId: data[0]!.id },
    );
  }
}

async function updateExecutionRow(
  ctx: ServiceCtx,
  id: string,
  patch: Database["public"]["Tables"]["operational_mutation_executions"]["Update"],
): Promise<void> {
  const { error } = await ctx.client
    .from("operational_mutation_executions")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", id);
  if (error) throw mapPostgresError(error);
}

export async function listOperationalMutationExecutionsForProposal(
  ctx: ServiceCtx,
  proposalId: string,
): Promise<OperationalMutationExecutionDto[]> {
  if (!isOperationalManager(ctx.role)) {
    throw new PermissionError("Histórico de execuções restrito a coordenação / administradores.");
  }
  const id = expectUuid(proposalId, "proposalId");
  const { data, error } = await ctx.client
    .from("operational_mutation_executions")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("proposal_id", id)
    .order("created_at", { ascending: false })
    .limit(24);
  if (error) throw mapPostgresError(error);
  return (data as ExecutionRow[] | null)?.map(rowToDto) ?? [];
}

export async function executeSupervisedOperationalMutations(
  ctx: ServiceCtx,
  input: ExecuteSupervisedOperationalMutationsInput,
): Promise<ExecuteSupervisedOperationalMutationsResult> {
  if (!isOperationalManager(ctx.role)) {
    throw new PermissionError("Execução supervisionada restrita a coordenação / administradores.");
  }

  assertApprovalConfirmed(input.approvalConfirmed);
  const proposalId = expectUuid(input.proposalId, "proposalId");
  const sandboxRunId = expectUuid(input.sandboxRunId, "sandboxRunId");
  const idempotencyKey = input.idempotencyKey.trim();
  if (idempotencyKey.length < 8 || idempotencyKey.length > 200) {
    throw new ValidationError("idempotency_key inválida (8–200 caracteres).");
  }

  const existing = await findExecutionByIdempotency(ctx, idempotencyKey);
  if (existing) {
    const simRow = await loadSandboxRunRow(ctx, existing.sandbox_run_id);
    const simulation = parseSimulationResultSnapshot(simRow.result_snapshot);
    return {
      execution: rowToDto(existing),
      simulation,
      idempotentReplay: true,
    };
  }

  const proposal = await getOperationalActionProposalById(ctx, proposalId);
  assertProposalApprovedForExecution(proposal);

  const run = await loadSandboxRunRow(ctx, sandboxRunId);
  assertSandboxRunSafeForExecution({
    sandboxRowState: run.state,
    proposalId,
    runProposalId: run.proposal_id,
  });

  const simulation = parseSimulationResultSnapshot(run.result_snapshot);

  await assertNoActiveExecution(ctx, proposalId);

  const nowIso = new Date().toISOString();
  const explainability = buildExecutionExplainability({
    proposal,
    simulation,
    sandboxRunId,
  });
  const policySnap = snapshotPolicyChecks(simulation.safety.policyChecks);

  const insertBody: Database["public"]["Tables"]["operational_mutation_executions"]["Insert"] = {
    tenant_id: ctx.tenantId,
    proposal_id: proposalId,
    sandbox_run_id: sandboxRunId,
    actor_profile_id: ctx.actorProfileId,
    state: "executing",
    approval_confirmed: true,
    idempotency_key: idempotencyKey,
    policy_checks_snapshot: policySnap as never,
    explainability_json: explainability,
    applied_steps_json: [],
    result_payload: {},
    rollback_payload: {},
    affected_entities_json: summarizeAffectedFromSimulation(simulation) as never,
    started_at: nowIso,
  };

  let inserted: ExecutionRow;
  try {
    const { data, error } = await ctx.client
      .from("operational_mutation_executions")
      .insert(insertBody)
      .select("*")
      .single();
    if (error) throw mapPostgresError(error);
    if (!data) throw new ValidationError("Falha ao reservar execução.");
    inserted = data as ExecutionRow;
  } catch (e) {
    if (e instanceof ConflictError) {
      const again = await findExecutionByIdempotency(ctx, idempotencyKey);
      if (again) {
        const simRow = await loadSandboxRunRow(ctx, again.sandbox_run_id);
        const sim = parseSimulationResultSnapshot(simRow.result_snapshot);
        return { execution: rowToDto(again), simulation: sim, idempotentReplay: true };
      }
      throw new ValidationError(
        "Não foi possível iniciar execução: conflito de concorrência ou execução ativa para esta proposta.",
      );
    }
    throw e;
  }

  const executionId = inserted.id;
  let applied: AppliedForwardStep[] = [];

  try {
    applied = await applySimulationMutationsOrdered(ctx, {
      proposal,
      simulation,
      executionId,
    });

    const resultPayload = buildExecutionResultPayload({
      simulation,
      appliedSteps: applied,
      headline: `Execução supervisionada concluída (${applied.length} passo(s)).`,
    });

    await updateExecutionRow(ctx, executionId, {
      state: "executed",
      applied_steps_json: applied as never,
      result_payload: resultPayload as never,
      affected_entities_json: summarizeAffectedFromSimulation(simulation) as never,
      finished_at: new Date().toISOString(),
    });

    await recordOperationalEventSafe(ctx, {
      entity_type: "coordinator_action",
      entity_id: proposalId,
      event_type: "operational_action_triggered",
      severity: "info",
      description: `Execução supervisionada · concluída · ${applied.length} passo(s) · ${proposal.title.slice(0, 120)}`,
      metadata: {
        channel: "supervised_mutation_execution",
        execution_id: executionId,
        proposal_id: proposalId,
        sandbox_run_id: sandboxRunId,
        mutations_applied: applied.length,
      },
    });

    void tryRecordExecutionOutcomeMemory(ctx, {
      proposalId,
      executionId,
      state: "executed",
      proposalTitle: proposal.title,
      actionKind: proposal.actionKind,
      appliedSteps: applied.length,
      orchestrationId: null,
    });

    const { data: finalRow, error: frErr } = await ctx.client
      .from("operational_mutation_executions")
      .select("*")
      .eq("tenant_id", ctx.tenantId)
      .eq("id", executionId)
      .single();
    if (frErr) throw mapPostgresError(frErr);

    return {
      execution: rowToDto(finalRow as ExecutionRow),
      simulation,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    let rollbackDetail = "Sem rollback aplicável.";
    let endState: ExecutionRow["state"] = "failed";
    let reversed = 0;
    try {
      const rb = await rollbackAppliedSteps(ctx, {
        executionId,
        proposalId,
        steps: applied,
      });
      rollbackDetail = rb.detail;
      reversed = rb.reversedSteps;
      endState = rb.reversedSteps > 0 ? "rolled_back" : "failed";
    } catch (rbErr) {
      rollbackDetail = `Rollback parcial ou indisponível: ${rbErr instanceof Error ? rbErr.message : String(rbErr)}`;
      endState = "failed";
    }

    await updateExecutionRow(ctx, executionId, {
      state: endState,
      block_reason: message.slice(0, 4000),
      applied_steps_json: applied as never,
      rollback_payload: buildRollbackAuditPayload({
        executionId,
        reversedSteps: reversed,
        detail: rollbackDetail,
      }) as never,
      finished_at: new Date().toISOString(),
    });

    await recordOperationalEventSafe(ctx, {
      entity_type: "coordinator_action",
      entity_id: proposalId,
      event_type: "operational_action_triggered",
      severity: "warning",
      description: `Execução supervisionada · ${endState} · ${message.slice(0, 160)}`,
      metadata: {
        channel: "supervised_mutation_execution",
        execution_id: executionId,
        proposal_id: proposalId,
        sandbox_run_id: sandboxRunId,
        outcome: endState,
      },
    });

    void tryRecordExecutionOutcomeMemory(ctx, {
      proposalId,
      executionId,
      state: endState,
      proposalTitle: proposal.title,
      actionKind: proposal.actionKind,
      appliedSteps: applied.length,
      orchestrationId: null,
    });
    if (endState === "rolled_back" || reversed > 0) {
      void tryRecordRollbackSignalMemory(ctx, {
        proposalId,
        executionId,
        channel: "execution_failure",
        detail: rollbackDetail,
        orchestrationId: null,
      });
    }

    if (isDomainError(err)) throw err;
    throw err;
  }
}

export async function rollbackSupervisedOperationalMutationExecution(
  ctx: ServiceCtx,
  input: RollbackSupervisedExecutionInput,
): Promise<OperationalMutationExecutionDto> {
  if (!isOperationalManager(ctx.role)) {
    throw new PermissionError("Rollback supervisionado restrito a coordenação / administradores.");
  }
  const executionId = expectUuid(input.executionId, "executionId");

  const { data: row, error } = await ctx.client
    .from("operational_mutation_executions")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("id", executionId)
    .maybeSingle();
  if (error) throw mapPostgresError(error);
  if (!row) throw new ValidationError("Execução não encontrada.");

  const execRow = row as ExecutionRow;
  if (execRow.state !== "executed") {
    throw new ValidationError(
      "Rollback manual só é permitido para execuções concluídas com sucesso.",
      {
        state: execRow.state,
      },
    );
  }

  const applied = Array.isArray(execRow.applied_steps_json)
    ? (execRow.applied_steps_json as AppliedForwardStep[])
    : [];

  await validateRollbackAllowed(ctx, applied);
  const rb = await rollbackAppliedSteps(ctx, {
    executionId,
    proposalId: execRow.proposal_id,
    steps: applied,
  });

  await updateExecutionRow(ctx, executionId, {
    state: "rolled_back",
    rollback_payload: {
      ...((execRow.rollback_payload && typeof execRow.rollback_payload === "object"
        ? execRow.rollback_payload
        : {}) as Record<string, unknown>),
      manual_rollback: buildRollbackAuditPayload({
        executionId,
        reversedSteps: rb.reversedSteps,
        detail: rb.detail,
      }),
    } as ExecutionRow["rollback_payload"],
    finished_at: new Date().toISOString(),
  });

  await recordOperationalEventSafe(ctx, {
    entity_type: "coordinator_action",
    entity_id: execRow.proposal_id,
    event_type: "operational_action_triggered",
    severity: "warning",
    description: `Rollback manual supervisionado · execução ${executionId.slice(0, 8)}…`,
    metadata: {
      channel: "supervised_mutation_manual_rollback",
      execution_id: executionId,
      proposal_id: execRow.proposal_id,
    },
  });

  void tryRecordRollbackSignalMemory(ctx, {
    proposalId: execRow.proposal_id,
    executionId,
    channel: "manual_rollback",
    detail: rb.detail,
    orchestrationId: null,
  });

  const { data: out, error: outErr } = await ctx.client
    .from("operational_mutation_executions")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("id", executionId)
    .single();
  if (outErr) throw mapPostgresError(outErr);
  return rowToDto(out as ExecutionRow);
}
