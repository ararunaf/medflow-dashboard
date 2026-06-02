import type { ServiceCtx } from "@/lib/services/operations/types";
import { clampJsonMetadata, clampMessage } from "@/lib/services/resilience/resilience-service";
import type {
  PilotContext,
  SubmitPilotFeedbackInput,
  SubmitPilotSuggestionInput,
} from "./pilot-execution-types";

function contextFields(ctx?: PilotContext) {
  return {
    context_route: ctx?.route?.slice(0, 256) ?? null,
    context_module: ctx?.module?.slice(0, 64) ?? null,
  };
}

export async function submitPilotFeedback(
  ctx: ServiceCtx,
  input: SubmitPilotFeedbackInput,
): Promise<{ id: string }> {
  const row = {
    tenant_id: ctx.tenantId,
    actor_profile_id: ctx.actorProfileId,
    category: input.category.slice(0, 64),
    severity: input.severity,
    description: clampMessage(input.description, 4096),
    metadata: clampJsonMetadata({ role: ctx.role }),
    ...contextFields(input.context),
  };
  const { data, error } = await ctx.client.from("pilot_feedback").insert(row).select("id").single();
  if (error) throw error;
  return { id: data.id };
}

export async function submitPilotSuggestion(
  ctx: ServiceCtx,
  input: SubmitPilotSuggestionInput,
): Promise<{ id: string }> {
  const row = {
    tenant_id: ctx.tenantId,
    actor_profile_id: ctx.actorProfileId,
    category: input.category.slice(0, 64),
    severity: input.severity,
    description: clampMessage(input.description, 4096),
    metadata: clampJsonMetadata({ role: ctx.role }),
    ...contextFields(input.context),
  };
  const { data, error } = await ctx.client
    .from("pilot_suggestions")
    .insert(row)
    .select("id")
    .single();
  if (error) throw error;
  return { id: data.id };
}

export async function listRecentPilotFeedback(ctx: ServiceCtx, limit = 30) {
  const { data, error } = await ctx.client
    .from("pilot_feedback")
    .select(
      "id, category, severity, description, context_route, context_module, created_at, actor_profile_id",
    )
    .eq("tenant_id", ctx.tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function listRecentPilotSuggestions(ctx: ServiceCtx, limit = 30) {
  const { data, error } = await ctx.client
    .from("pilot_suggestions")
    .select(
      "id, category, severity, description, suggestion_status, context_route, context_module, created_at, actor_profile_id",
    )
    .eq("tenant_id", ctx.tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
