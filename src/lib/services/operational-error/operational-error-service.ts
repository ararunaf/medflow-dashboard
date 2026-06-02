import type { ServiceCtx } from "@/lib/services/operations/types";
import { assertCan } from "@/lib/auth/rbac";
import {
  clampJsonMetadata,
  clampMessage,
  clampStackSnippet,
} from "@/lib/services/resilience/resilience-service";

export type OperationalErrorSource =
  | "export"
  | "reconciliation"
  | "closing"
  | "session"
  | "upload"
  | "client"
  | "server"
  | "supabase"
  | "unknown";

export type InsertOperationalErrorInput = {
  severity: "operational" | "critical";
  source: OperationalErrorSource;
  errorCode?: string | null;
  message: string;
  detail?: string | null;
  stackSnippet?: string | null;
  metadata?: Record<string, unknown>;
};

export type InsertOperationalLogInput = {
  level: "info" | "warning" | "error";
  category: string;
  message: string;
  metadata?: Record<string, unknown>;
};

export async function insertOperationalError(
  ctx: ServiceCtx,
  input: InsertOperationalErrorInput,
): Promise<{ id: string } | null> {
  assertCan(ctx.role, "tenant_settings:read");
  const meta = clampJsonMetadata(input.metadata ?? {});
  const row = {
    tenant_id: ctx.tenantId,
    actor_profile_id: ctx.actorProfileId,
    severity: input.severity,
    source: input.source,
    error_code: input.errorCode ?? null,
    message: clampMessage(input.message),
    detail: input.detail ? clampMessage(input.detail, 4000) : null,
    stack_snippet: clampStackSnippet(input.stackSnippet ?? undefined),
    metadata: meta,
  };
  const { data, error } = await ctx.client
    .from("operational_errors")
    .insert(row)
    .select("id")
    .maybeSingle();
  if (error) {
    console.warn("[operational_errors]", error.message);
    return null;
  }
  return data?.id ? { id: data.id } : null;
}

export async function insertOperationalLog(
  ctx: ServiceCtx,
  input: InsertOperationalLogInput,
): Promise<{ id: string } | null> {
  assertCan(ctx.role, "tenant_settings:read");
  const meta = clampJsonMetadata(input.metadata ?? {});
  const row = {
    tenant_id: ctx.tenantId,
    actor_profile_id: ctx.actorProfileId,
    level: input.level,
    category: input.category.slice(0, 64),
    message: clampMessage(input.message),
    metadata: meta,
  };
  const { data, error } = await ctx.client
    .from("operational_logs")
    .insert(row)
    .select("id")
    .maybeSingle();
  if (error) {
    console.warn("[operational_logs]", error.message);
    return null;
  }
  return data?.id ? { id: data.id } : null;
}
