import type { Database } from "@/lib/database.types";
import type { OperationalStrategicPlanningLifecycleState } from "@/lib/database.types";
import { isOperationalManager } from "@/lib/auth/rbac";
import { mapPostgresError } from "@/lib/domain/operations/errors";
import { composeStrategicOperationalPlanningBundle } from "@/lib/operations/strategic-planning/strategic-operational-planning-engine";
import type {
  StrategicOperationalPlanningLayerSummary,
  StrategicPlanningCycleDto,
} from "@/lib/operations/strategic-planning/types";
import type { ServiceCtx } from "@/lib/services/operations/types";

type CycleRow = Database["public"]["Tables"]["operational_strategic_planning_cycles"]["Row"];

export type StrategicPlanningContext = Parameters<
  typeof composeStrategicOperationalPlanningBundle
>[0];

function rowToDto(row: CycleRow): StrategicPlanningCycleDto {
  return {
    id: row.id,
    fingerprint: row.fingerprint,
    lifecycleState: row.lifecycle_state as OperationalStrategicPlanningLifecycleState,
    strategicNarrative: row.strategic_narrative,
    stressDigest: (row.stress_digest_json ?? {}) as Record<string, unknown>,
    computedAt: row.computed_at,
  };
}

export async function loadStrategicOperationalPlanningLayerSummary(
  ctx: ServiceCtx,
  input: StrategicPlanningContext & { asOf: string },
): Promise<StrategicOperationalPlanningLayerSummary> {
  const empty: StrategicOperationalPlanningLayerSummary = {
    asOf: input.asOf,
    enabled: false,
    liveBundle: null,
    persistedCycle: null,
  };
  if (!isOperationalManager(ctx.role)) return empty;

  try {
    const liveBundle = composeStrategicOperationalPlanningBundle(input);
    const { data: cycleData, error: cErr } = await ctx.client
      .from("operational_strategic_planning_cycles")
      .select("id,fingerprint,lifecycle_state,strategic_narrative,stress_digest_json,computed_at")
      .eq("tenant_id", ctx.tenantId)
      .order("computed_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (cErr) throw mapPostgresError(cErr);

    return {
      asOf: input.asOf,
      enabled: true,
      liveBundle,
      persistedCycle: cycleData ? rowToDto(cycleData as CycleRow) : null,
    };
  } catch (e) {
    console.warn("[strategic_planning] load summary", e);
    return { ...empty, enabled: true };
  }
}
