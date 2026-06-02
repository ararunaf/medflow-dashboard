import { assertCan } from "@/lib/auth/rbac";
import { mapPostgresError } from "@/lib/domain/operations/errors";
import type { ServiceCtx } from "@/lib/services/operations/types";
import type { TussProcedureRow } from "./types";

export async function listTussProcedures(ctx: ServiceCtx): Promise<TussProcedureRow[]> {
  assertCan(ctx.role, "tiss:read");
  const { data, error } = await ctx.client
    .from("tuss_procedures")
    .select("*")
    .eq("active", true)
    .order("code", { ascending: true });
  if (error) throw mapPostgresError(error);
  return data ?? [];
}

export async function createTussProcedure(
  ctx: ServiceCtx,
  input: {
    code: string;
    description: string;
    specialty?: string;
    operational_group?: string;
    default_value?: number;
  },
): Promise<TussProcedureRow> {
  assertCan(ctx.role, "tuss:catalog:write");
  const { data, error } = await ctx.client
    .from("tuss_procedures")
    .insert({
      code: input.code.trim(),
      description: input.description.trim(),
      specialty: (input.specialty ?? "").trim(),
      operational_group: (input.operational_group ?? "").trim(),
      default_value: input.default_value ?? 0,
      active: true,
    })
    .select("*")
    .single();
  if (error) throw mapPostgresError(error);
  return data;
}
