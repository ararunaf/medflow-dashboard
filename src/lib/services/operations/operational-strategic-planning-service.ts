/**
 * strategic-operational-planning-service — persistência supervisionada de ciclos
 * de planejamento estratégico (sem auto-execução).
 */
import type { Json } from "@/lib/database.types";
import type { OperationalStrategicPlanningLifecycleState } from "@/lib/database.types";
import { isOperationalManager } from "@/lib/auth/rbac";
import { mapPostgresError, PermissionError, ValidationError } from "@/lib/domain/operations/errors";
import { expectUuid } from "@/lib/domain/operations/validation";
import { loadOperationalCommandCenterSnapshot } from "@/lib/operations/api/queries/command-center";
import { composeStrategicOperationalPlanningBundle } from "@/lib/operations/strategic-planning/strategic-operational-planning-engine";
import { assertStrategicPlanningHumanLifecycleTransition } from "@/lib/operations/strategic-planning/supervised-strategic-review-layer";
import type { StrategicOperationalPlanningBundle } from "@/lib/operations/strategic-planning/types";
import { recordOperationalEventSafe } from "@/lib/services/operations/operational-event-service";
import type { ServiceCtx } from "@/lib/services/operations/types";

export {
  loadStrategicOperationalPlanningLayerSummary,
  type StrategicPlanningContext,
} from "@/lib/operations/strategic-planning/strategic-planning-loader";

const CACHE_MS = 10 * 60 * 1000;

const ORCH_ACTIVE_STATES = [
  "planned",
  "awaiting_approval",
  "orchestrating",
  "partially_executed",
  "blocked",
] as const;

function fnv1aHex(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

function deterministicFingerprint(input: string): string {
  const a = fnv1aHex(input);
  const b = fnv1aHex(`${input}::mirror`);
  return `${a}${b}${input.length.toString(16)}`;
}

function fingerprintForBundle(bundle: StrategicOperationalPlanningBundle): string {
  return deterministicFingerprint(
    JSON.stringify({
      stress: bundle.stressProjections.map((s) => [s.code, s.score.toFixed(3), s.level]),
      readiness: bundle.readiness.overallScore.toFixed(3),
      forecast: bundle.explainability.forecastRefs[0]?.projection,
      orch: bundle.orchestrationPreparedness.activeOrchestrations,
    }),
  );
}

function stressDigestFromBundle(
  bundle: StrategicOperationalPlanningBundle,
): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  for (const s of bundle.stressProjections) {
    o[s.code] = { level: s.level, score: Math.round(s.score * 1000) / 1000 };
  }
  o.readiness = Math.round(bundle.readiness.overallScore * 1000) / 1000;
  return o;
}

async function appendAudit(
  ctx: ServiceCtx,
  input: { action: string; cycleId?: string | null; payload: Record<string, unknown> },
): Promise<void> {
  const { error } = await ctx.client.from("operational_strategic_planning_audit").insert({
    tenant_id: ctx.tenantId,
    actor_profile_id: ctx.actorProfileId,
    cycle_id: input.cycleId ?? null,
    action: input.action,
    payload_json: input.payload as unknown as Json,
  });
  if (error) console.warn("[strategic_planning] audit insert", error.message);
}

export type RunStrategicOperationalPlanningCycleResult = {
  cycleId: string;
  skippedDuplicate?: boolean;
};

async function loadOrchestrationActiveCount(ctx: ServiceCtx): Promise<number> {
  const { count, error } = await ctx.client
    .from("operational_orchestrations")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", ctx.tenantId)
    .in("state", [...ORCH_ACTIVE_STATES]);
  if (error) {
    console.warn("[strategic_planning] orch count", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function runStrategicOperationalPlanningCycle(
  ctx: ServiceCtx,
): Promise<RunStrategicOperationalPlanningCycleResult> {
  if (!isOperationalManager(ctx.role)) {
    throw new PermissionError("Planejamento estratégico restrito a gestores operacionais.");
  }

  const snapshot = await loadOperationalCommandCenterSnapshot(ctx, { omitStrategicPlanning: true });
  const orchestrationActiveCount = await loadOrchestrationActiveCount(ctx);

  const bundle = composeStrategicOperationalPlanningBundle({
    core: snapshot,
    scoring: snapshot.scoring,
    recommendations: snapshot.recommendations,
    operationalMemory: snapshot.operationalMemory,
    adaptivePrioritization: snapshot.adaptivePrioritization,
    policyIntelligence: snapshot.policyIntelligence,
    orchestrationActiveCount,
  });

  const fingerprint = fingerprintForBundle(bundle);
  const asOf = new Date().toISOString();

  const { data: latest, error: latestErr } = await ctx.client
    .from("operational_strategic_planning_cycles")
    .select("id,fingerprint,computed_at")
    .eq("tenant_id", ctx.tenantId)
    .order("computed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latestErr) throw mapPostgresError(latestErr);
  if (latest && latest.fingerprint === fingerprint) {
    const age = Date.now() - new Date(latest.computed_at).getTime();
    if (age >= 0 && age < CACHE_MS) {
      await appendAudit(ctx, {
        action: "planning_skipped_duplicate_fingerprint",
        cycleId: latest.id,
        payload: { fingerprint, cacheMs: CACHE_MS },
      });
      return { cycleId: latest.id, skippedDuplicate: true };
    }
  }

  const narrative = bundle.explainability.strategicNarrative.join(" ").slice(0, 5800);

  const { data: inserted, error: insErr } = await ctx.client
    .from("operational_strategic_planning_cycles")
    .insert({
      tenant_id: ctx.tenantId,
      actor_profile_id: ctx.actorProfileId,
      fingerprint,
      stress_digest_json: stressDigestFromBundle(bundle) as unknown as Json,
      planning_bundle_json: bundle as unknown as Json,
      strategic_narrative: narrative,
      lifecycle_state: "planned",
      computed_at: asOf,
    })
    .select("id")
    .single();
  if (insErr) throw mapPostgresError(insErr);
  const cycleId = inserted?.id;
  if (!cycleId) throw new ValidationError("Falha ao persistir ciclo de planejamento estratégico.");

  await appendAudit(ctx, {
    action: "planning_cycle_recorded",
    cycleId,
    payload: { fingerprint, readiness: bundle.readiness.overallScore },
  });

  await recordOperationalEventSafe(ctx, {
    entity_type: "strategic_operational_planning",
    entity_id: cycleId,
    event_type: "strategic_planning_cycle_recorded",
    severity: bundle.readiness.overallScore < 0.45 ? "warning" : "info",
    description: `Planejamento estratégico supervisionado · readiness ${(bundle.readiness.overallScore * 100).toFixed(0)}%`,
    metadata: { cycle_id: cycleId, fingerprint },
  });

  return { cycleId };
}

export type PatchStrategicPlanningCycleLifecycleInput = {
  cycleId: string;
  nextLifecycleState: Extract<
    OperationalStrategicPlanningLifecycleState,
    "supervised_review" | "validated"
  >;
};

export async function patchStrategicPlanningCycleLifecycle(
  ctx: ServiceCtx,
  input: PatchStrategicPlanningCycleLifecycleInput,
): Promise<void> {
  if (!isOperationalManager(ctx.role)) {
    throw new PermissionError(
      "Somente gestores operacionais atualizam ciclos de planejamento estratégico.",
    );
  }
  const cycleId = expectUuid(input.cycleId, "cycleId");
  const next = input.nextLifecycleState;
  if (next !== "supervised_review" && next !== "validated") {
    throw new ValidationError(
      "Somente revisão supervisionada ou validação são suportadas para o ciclo.",
      {
        next,
      },
    );
  }

  const { data: row, error: selErr } = await ctx.client
    .from("operational_strategic_planning_cycles")
    .select("id,lifecycle_state")
    .eq("tenant_id", ctx.tenantId)
    .eq("id", cycleId)
    .maybeSingle();
  if (selErr) throw mapPostgresError(selErr);
  if (!row) throw new ValidationError("Ciclo não encontrado.");

  const from = row.lifecycle_state as OperationalStrategicPlanningLifecycleState;
  assertStrategicPlanningHumanLifecycleTransition(from, next);

  const now = new Date().toISOString();
  const { error: upErr } = await ctx.client
    .from("operational_strategic_planning_cycles")
    .update({ lifecycle_state: next, updated_at: now })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", cycleId);
  if (upErr) throw mapPostgresError(upErr);

  await appendAudit(ctx, {
    action: "planning_cycle_lifecycle_updated",
    cycleId,
    payload: { from, to: next },
  });

  await recordOperationalEventSafe(ctx, {
    entity_type: "strategic_operational_planning",
    entity_id: cycleId,
    event_type: "strategic_planning_cycle_state_updated",
    severity: "info",
    description: `Planejamento estratégico · ${from} → ${next}`,
    metadata: { cycle_id: cycleId, next_state: next },
  });
}
