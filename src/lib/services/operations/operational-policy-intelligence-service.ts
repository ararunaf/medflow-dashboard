import type { Database, Json } from "@/lib/database.types";
import { isOperationalManager } from "@/lib/auth/rbac";
import { mapPostgresError, PermissionError, ValidationError } from "@/lib/domain/operations/errors";
import { expectUuid } from "@/lib/domain/operations/validation";
import { buildAdaptiveSignalSnapshot } from "@/lib/operations/adaptive-prioritization/adaptive-signals";
import { buildOperationalMemoryLayerSummary } from "@/lib/operations/operational-memory/effectiveness-engine";
import type { OperationalRecommendationFeedbackOverlay } from "@/lib/operations/feedback/types";
import type {
  OperationalMemoryExplainability,
  OperationalMemoryInsight,
} from "@/lib/operations/operational-memory/types";
import {
  buildOperationalPolicyIntelligenceResult,
  registryEntriesForFindings,
  type OperationalPolicyFinding,
} from "@/lib/operations/policy-intelligence";
import { assertSupervisedPolicyLifecycleTransition } from "@/lib/operations/policy-intelligence/supervised-policy-review-layer";
import type {
  OperationalPolicyGovernanceRecommendationKind,
  SupervisedPolicyLifecycleState,
} from "@/lib/database.types";
import type { PolicyGovernanceExplainability } from "@/lib/operations/policy-intelligence/types";
import { recordOperationalEventSafe } from "@/lib/services/operations/operational-event-service";
import { loadOperationalRecommendationFeedbackOverlay } from "@/lib/services/operations/operational-feedback-service";
import type { ServiceCtx } from "@/lib/services/operations/types";

type MemoryRow = Database["public"]["Tables"]["operational_memory_entries"]["Row"];
type CycleRow = Database["public"]["Tables"]["operational_policy_intelligence_cycles"]["Row"];
type RecRow = Database["public"]["Tables"]["operational_policy_governance_recommendations"]["Row"];

const MEMORY_LIMIT = 120;
const CACHE_MS = 10 * 60 * 1000;
const RECOMMENDATION_LOAD_LIMIT = 24;

/** FNV-1a 32-bit — determinístico sem `node:crypto` (bundle seguro no client graph). */
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

function asExplain(v: unknown): OperationalMemoryExplainability {
  if (!v || typeof v !== "object" || Array.isArray(v)) {
    return { provenance: [], historicalReasoning: [], effectivenessRationale: [], references: [] };
  }
  const o = v as Record<string, unknown>;
  return {
    provenance: Array.isArray(o.provenance)
      ? (o.provenance as OperationalMemoryExplainability["provenance"])
      : [],
    historicalReasoning: Array.isArray(o.historicalReasoning)
      ? (o.historicalReasoning as string[])
      : [],
    effectivenessRationale: Array.isArray(o.effectivenessRationale)
      ? (o.effectivenessRationale as string[])
      : [],
    references: Array.isArray(o.references)
      ? (o.references as OperationalMemoryExplainability["references"])
      : [],
  };
}

function asLearningSignals(v: unknown): OperationalMemoryInsight["learningSignals"] {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  return v as OperationalMemoryInsight["learningSignals"];
}

function asRefs(v: unknown): import("@/lib/database.types").JsonObject {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  return v as import("@/lib/database.types").JsonObject;
}

function rowToInsight(row: MemoryRow): OperationalMemoryInsight {
  const eff = row.effectiveness_score;
  const effectivenessScore =
    eff == null || eff === "" ? null : Math.min(1, Math.max(0, Number.parseFloat(String(eff))));
  return {
    id: row.id,
    memoryKind: row.memory_kind as OperationalMemoryInsight["memoryKind"],
    memoryState: row.memory_state as OperationalMemoryInsight["memoryState"],
    subjectKind: row.subject_kind as OperationalMemoryInsight["subjectKind"],
    subjectId: row.subject_id,
    outcomeNarrative: row.outcome_narrative,
    effectivenessScore: Number.isFinite(effectivenessScore ?? NaN) ? effectivenessScore : null,
    learningSignals: asLearningSignals(row.learning_signals_json),
    explainability: asExplain(row.explainability_json),
    references: asRefs(row.references_json),
    createdAt: row.created_at,
  };
}

function fingerprintForEngine(
  engine: ReturnType<typeof buildOperationalPolicyIntelligenceResult>,
): string {
  return deterministicFingerprint(
    JSON.stringify({
      digest: engine.signalDigest,
      codes: engine.findings.map((f) => f.code).sort(),
    }),
  );
}

function hashSuggestionFingerprint(raw: string): string {
  return deterministicFingerprint(raw);
}

function feedbackDismissedRatio(overlay: OperationalRecommendationFeedbackOverlay): number | null {
  const e = overlay.effectiveness;
  const denom = e.accepted + e.dismissed + e.ignored + e.executed;
  if (denom <= 0) return null;
  return e.dismissed / denom;
}

async function fetchMemoryInsights(
  ctx: ServiceCtx,
  asOf: string,
): Promise<OperationalMemoryInsight[]> {
  const from = new Date(asOf);
  from.setUTCDate(from.getUTCDate() - 14);
  const fromISO = from.toISOString();
  const { data, error } = await ctx.client
    .from("operational_memory_entries")
    .select(
      "id,memory_kind,memory_state,subject_kind,subject_id,outcome_narrative,effectiveness_score,learning_signals_json,explainability_json,references_json,created_at",
    )
    .eq("tenant_id", ctx.tenantId)
    .gte("created_at", fromISO)
    .order("created_at", { ascending: false })
    .limit(MEMORY_LIMIT);
  if (error) throw mapPostgresError(error);
  return ((data ?? []) as MemoryRow[]).map(rowToInsight);
}

async function appendAudit(
  ctx: ServiceCtx,
  input: {
    action: string;
    cycleId?: string | null;
    recommendationId?: string | null;
    payload: Record<string, unknown>;
  },
): Promise<void> {
  const { error } = await ctx.client.from("operational_policy_intelligence_audit").insert({
    tenant_id: ctx.tenantId,
    actor_profile_id: ctx.actorProfileId,
    cycle_id: input.cycleId ?? null,
    recommendation_id: input.recommendationId ?? null,
    action: input.action,
    payload_json: input.payload as unknown as Json,
  });
  if (error) console.warn("[policy_intelligence] audit insert", error.message);
}

function parseFindings(raw: unknown): OperationalPolicyFinding[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(Boolean) as OperationalPolicyFinding[];
}

export type PolicyGovernanceRecommendationDto = {
  id: string;
  cycleId: string;
  recommendationKind: OperationalPolicyGovernanceRecommendationKind;
  title: string;
  detail: string;
  explainability: PolicyGovernanceExplainability;
  lifecycleState: SupervisedPolicyLifecycleState;
  createdAt: string;
};

export type PolicyIntelligenceCycleDto = {
  id: string;
  fingerprint: string;
  lifecycleState: SupervisedPolicyLifecycleState;
  governanceNarrative: string;
  findings: OperationalPolicyFinding[];
  signalDigest: import("@/lib/database.types").JsonObject;
  computedAt: string;
};

export type OperationalPolicyIntelligenceLayerSummary = {
  asOf: string;
  enabled: boolean;
  cycle: PolicyIntelligenceCycleDto | null;
  recommendations: PolicyGovernanceRecommendationDto[];
  adaptiveGovernanceHighlights: ReturnType<typeof registryEntriesForFindings>;
  effectivenessSummary: {
    criticalFindings: number;
    warningFindings: number;
    infoFindings: number;
  };
};

function asExplainability(v: unknown): PolicyGovernanceExplainability {
  if (!v || typeof v !== "object" || Array.isArray(v)) {
    return {
      policyRationale: [],
      historicalRefs: { memoryEntryIds: [], note: "" },
      rollbackRefs: { subjectIds: [], note: "" },
      orchestrationRefs: { subjectIds: [], note: "" },
      governanceNarrative: [],
      adjustmentExplainability: [],
    };
  }
  return v as PolicyGovernanceExplainability;
}

export async function loadOperationalPolicyIntelligenceLayerSummary(
  ctx: ServiceCtx,
  input: { asOf: string },
): Promise<OperationalPolicyIntelligenceLayerSummary> {
  const empty: OperationalPolicyIntelligenceLayerSummary = {
    asOf: input.asOf,
    enabled: false,
    cycle: null,
    recommendations: [],
    adaptiveGovernanceHighlights: [],
    effectivenessSummary: { criticalFindings: 0, warningFindings: 0, infoFindings: 0 },
  };
  if (!isOperationalManager(ctx.role)) return empty;

  try {
    const { data: cycleData, error: cErr } = await ctx.client
      .from("operational_policy_intelligence_cycles")
      .select("*")
      .eq("tenant_id", ctx.tenantId)
      .order("computed_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (cErr) throw mapPostgresError(cErr);
    if (!cycleData) {
      return { ...empty, enabled: true };
    }
    const cycleRow = cycleData as CycleRow;
    const findings = parseFindings(cycleRow.findings_json);

    const { data: recData, error: rErr } = await ctx.client
      .from("operational_policy_governance_recommendations")
      .select("*")
      .eq("tenant_id", ctx.tenantId)
      .eq("cycle_id", cycleRow.id)
      .order("created_at", { ascending: true })
      .limit(RECOMMENDATION_LOAD_LIMIT);
    if (rErr) throw mapPostgresError(rErr);

    const recommendations: PolicyGovernanceRecommendationDto[] = (recData ?? []).map((r) => {
      const row = r as RecRow;
      return {
        id: row.id,
        cycleId: row.cycle_id,
        recommendationKind:
          row.recommendation_kind as OperationalPolicyGovernanceRecommendationKind,
        title: row.title,
        detail: row.detail,
        explainability: asExplainability(row.explainability_json),
        lifecycleState: row.lifecycle_state as SupervisedPolicyLifecycleState,
        createdAt: row.created_at,
      };
    });

    let criticalFindings = 0;
    let warningFindings = 0;
    let infoFindings = 0;
    for (const f of findings) {
      if (f.severity === "critical") criticalFindings += 1;
      else if (f.severity === "warning") warningFindings += 1;
      else infoFindings += 1;
    }

    return {
      asOf: input.asOf,
      enabled: true,
      cycle: {
        id: cycleRow.id,
        fingerprint: cycleRow.fingerprint,
        lifecycleState: cycleRow.lifecycle_state as SupervisedPolicyLifecycleState,
        governanceNarrative: cycleRow.governance_narrative,
        findings,
        signalDigest: (cycleRow.signal_digest_json ??
          {}) as import("@/lib/database.types").JsonObject,
        computedAt: cycleRow.computed_at,
      },
      recommendations,
      adaptiveGovernanceHighlights: registryEntriesForFindings(findings.map((f) => f.code)),
      effectivenessSummary: { criticalFindings, warningFindings, infoFindings },
    };
  } catch (e) {
    console.warn("[policy_intelligence] load summary", e);
    return { ...empty, enabled: true };
  }
}

export type RunOperationalPolicyIntelligenceAnalysisResult = {
  cycleId: string;
  skippedDuplicate?: boolean;
};

export async function runOperationalPolicyIntelligenceAnalysis(
  ctx: ServiceCtx,
): Promise<RunOperationalPolicyIntelligenceAnalysisResult> {
  if (!isOperationalManager(ctx.role)) {
    throw new PermissionError("Análise de policy intelligence restrita a gestores operacionais.");
  }

  const asOf = new Date().toISOString();
  const insights = await fetchMemoryInsights(ctx, asOf);
  const overlay = await loadOperationalRecommendationFeedbackOverlay(ctx, []);
  const memoryLayer = buildOperationalMemoryLayerSummary({
    computedAt: asOf,
    windowFromISO: new Date(new Date(asOf).getTime() - 14 * 86400000).toISOString(),
    recentInsights: insights,
    recommendationFeedback: overlay,
  });
  const adaptiveSignals = buildAdaptiveSignalSnapshot({
    computedAt: asOf,
    memory: memoryLayer,
    recommendationFeedback: overlay,
  });

  const engine = buildOperationalPolicyIntelligenceResult({
    computedAt: asOf,
    insights,
    adaptiveSignals,
    feedbackDismissedRatio: feedbackDismissedRatio(overlay),
  });

  const fingerprint = fingerprintForEngine(engine);

  const { data: latest, error: latestErr } = await ctx.client
    .from("operational_policy_intelligence_cycles")
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
        action: "analysis_skipped_duplicate_fingerprint",
        cycleId: latest.id,
        payload: { fingerprint, cacheMs: CACHE_MS },
      });
      return { cycleId: latest.id, skippedDuplicate: true };
    }
  }

  const { data: inserted, error: insErr } = await ctx.client
    .from("operational_policy_intelligence_cycles")
    .insert({
      tenant_id: ctx.tenantId,
      actor_profile_id: ctx.actorProfileId,
      fingerprint,
      signal_digest_json: engine.signalDigest as unknown as Json,
      findings_json: engine.findings as unknown as Json,
      governance_narrative: engine.governanceNarrative,
      lifecycle_state: "recommended",
      computed_at: asOf,
    })
    .select("id")
    .single();
  if (insErr) throw mapPostgresError(insErr);
  const cycleId = inserted?.id;
  if (!cycleId) throw new ValidationError("Falha ao persistir ciclo de policy intelligence.");

  const recRows = engine.recommendations.map((r) => ({
    tenant_id: ctx.tenantId,
    cycle_id: cycleId,
    recommendation_kind: r.recommendationKind,
    title: r.title,
    detail: r.detail,
    explainability_json: r.explainability as unknown as Json,
    suggestion_fingerprint: hashSuggestionFingerprint(r.suggestionFingerprint),
    lifecycle_state: "recommended" as const,
  }));

  if (recRows.length > 0) {
    const { error: recErr } = await ctx.client
      .from("operational_policy_governance_recommendations")
      .insert(recRows);
    if (recErr) throw mapPostgresError(recErr);
  }

  await appendAudit(ctx, {
    action: "policy_analysis_run",
    cycleId,
    payload: {
      fingerprint,
      findingCount: engine.findings.length,
      recommendationCount: engine.recommendations.length,
    },
  });

  await recordOperationalEventSafe(ctx, {
    entity_type: "policy_intelligence",
    entity_id: cycleId,
    event_type: "policy_intelligence_analysis_recorded",
    severity: engine.findings.some((f) => f.severity === "critical")
      ? "critical"
      : engine.findings.some((f) => f.severity === "warning")
        ? "warning"
        : "info",
    description: `Policy intelligence · ${engine.findings.length} achado(s) · ${engine.recommendations.length} recomendações supervisionadas.`,
    metadata: {
      cycle_id: cycleId,
      fingerprint,
      finding_codes: engine.findings.map((f) => f.code),
    },
  });

  for (const r of engine.recommendations) {
    await recordOperationalEventSafe(ctx, {
      entity_type: "policy_intelligence",
      entity_id: cycleId,
      event_type: "policy_governance_recommendation_recorded",
      severity: "info",
      description: `Recomendação · ${r.recommendationKind} · ${r.title.slice(0, 120)}`,
      metadata: {
        cycle_id: cycleId,
        suggestion_fingerprint: hashSuggestionFingerprint(r.suggestionFingerprint),
        kind: r.recommendationKind,
      },
    });
  }

  return { cycleId };
}

export type PatchPolicyGovernanceRecommendationLifecycleInput = {
  recommendationId: string;
  nextLifecycleState: SupervisedPolicyLifecycleState;
};

export async function patchPolicyGovernanceRecommendationLifecycle(
  ctx: ServiceCtx,
  input: PatchPolicyGovernanceRecommendationLifecycleInput,
): Promise<void> {
  if (!isOperationalManager(ctx.role)) {
    throw new PermissionError(
      "Somente gestores operacionais atualizam recomendações de governança.",
    );
  }
  const id = expectUuid(input.recommendationId, "recommendationId");
  const next = input.nextLifecycleState;
  if (next !== "supervised_review" && next !== "validated") {
    throw new ValidationError(
      "Somente transições para revisão supervisionada ou validação são suportadas.",
      {
        next,
      },
    );
  }

  const { data: row, error: selErr } = await ctx.client
    .from("operational_policy_governance_recommendations")
    .select("id,cycle_id,lifecycle_state")
    .eq("tenant_id", ctx.tenantId)
    .eq("id", id)
    .maybeSingle();
  if (selErr) throw mapPostgresError(selErr);
  if (!row) throw new ValidationError("Recomendação não encontrada.");

  const from = row.lifecycle_state as SupervisedPolicyLifecycleState;
  assertSupervisedPolicyLifecycleTransition(from, next);

  const now = new Date().toISOString();
  const { error: upErr } = await ctx.client
    .from("operational_policy_governance_recommendations")
    .update({ lifecycle_state: next, updated_at: now })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", id);
  if (upErr) throw mapPostgresError(upErr);

  await appendAudit(ctx, {
    action: "recommendation_lifecycle_updated",
    cycleId: row.cycle_id,
    recommendationId: id,
    payload: { from, to: next },
  });

  await recordOperationalEventSafe(ctx, {
    entity_type: "policy_intelligence",
    entity_id: id,
    event_type: "policy_governance_recommendation_state_updated",
    severity: "info",
    description: `Recomendação de governança · ${from} → ${next}`,
    metadata: { recommendation_id: id, cycle_id: row.cycle_id, next_state: next },
  });

  if (next === "supervised_review" || next === "validated") {
    const { data: cycle, error: cycErr } = await ctx.client
      .from("operational_policy_intelligence_cycles")
      .select("id,lifecycle_state")
      .eq("tenant_id", ctx.tenantId)
      .eq("id", row.cycle_id)
      .maybeSingle();
    if (!cycErr && cycle) {
      const cState = cycle.lifecycle_state as SupervisedPolicyLifecycleState;
      if (cState === "recommended" && next === "supervised_review") {
        await ctx.client
          .from("operational_policy_intelligence_cycles")
          .update({ lifecycle_state: "supervised_review", updated_at: now })
          .eq("tenant_id", ctx.tenantId)
          .eq("id", row.cycle_id);
        await recordOperationalEventSafe(ctx, {
          entity_type: "policy_intelligence",
          entity_id: row.cycle_id,
          event_type: "policy_intelligence_cycle_state_updated",
          severity: "info",
          description: "Ciclo de policy intelligence promovido a revisão supervisionada.",
          metadata: { cycle_id: row.cycle_id, next_state: "supervised_review" },
        });
      }
    }
  }
}

export type PatchPolicyIntelligenceCycleLifecycleInput = {
  cycleId: string;
  nextLifecycleState: SupervisedPolicyLifecycleState;
};

export async function patchPolicyIntelligenceCycleLifecycle(
  ctx: ServiceCtx,
  input: PatchPolicyIntelligenceCycleLifecycleInput,
): Promise<void> {
  if (!isOperationalManager(ctx.role)) {
    throw new PermissionError(
      "Somente gestores operacionais atualizam ciclos de policy intelligence.",
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
    .from("operational_policy_intelligence_cycles")
    .select("id,lifecycle_state")
    .eq("tenant_id", ctx.tenantId)
    .eq("id", cycleId)
    .maybeSingle();
  if (selErr) throw mapPostgresError(selErr);
  if (!row) throw new ValidationError("Ciclo não encontrado.");

  const from = row.lifecycle_state as SupervisedPolicyLifecycleState;
  assertSupervisedPolicyLifecycleTransition(from, next);

  const now = new Date().toISOString();
  const { error: upErr } = await ctx.client
    .from("operational_policy_intelligence_cycles")
    .update({ lifecycle_state: next, updated_at: now })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", cycleId);
  if (upErr) throw mapPostgresError(upErr);

  await appendAudit(ctx, {
    action: "cycle_lifecycle_updated",
    cycleId,
    payload: { from, to: next },
  });

  await recordOperationalEventSafe(ctx, {
    entity_type: "policy_intelligence",
    entity_id: cycleId,
    event_type: "policy_intelligence_cycle_state_updated",
    severity: "info",
    description: `Ciclo policy intelligence · ${from} → ${next}`,
    metadata: { cycle_id: cycleId, next_state: next },
  });
}
