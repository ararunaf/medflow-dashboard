import { assertCan } from "@/lib/auth/rbac";
import { mapPostgresError } from "@/lib/domain/operations/errors";
import type { ServiceCtx } from "@/lib/services/operations/types";
import type { InsuranceContractRow, InsuranceProviderRow, InsuranceRuleRow } from "./types";

export async function listInsuranceProviders(ctx: ServiceCtx): Promise<InsuranceProviderRow[]> {
  assertCan(ctx.role, "tiss:read");
  const { data, error } = await ctx.client
    .from("insurance_providers")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .order("name", { ascending: true });
  if (error) throw mapPostgresError(error);
  return data ?? [];
}

export async function createInsuranceProvider(
  ctx: ServiceCtx,
  input: { name: string; ans_code?: string; active?: boolean },
): Promise<InsuranceProviderRow> {
  assertCan(ctx.role, "tiss:write");
  const { data, error } = await ctx.client
    .from("insurance_providers")
    .insert({
      tenant_id: ctx.tenantId,
      name: input.name.trim(),
      ans_code: (input.ans_code ?? "").trim(),
      active: input.active ?? true,
    })
    .select("*")
    .single();
  if (error) throw mapPostgresError(error);
  return data;
}

export async function updateInsuranceProvider(
  ctx: ServiceCtx,
  id: string,
  patch: Partial<Pick<InsuranceProviderRow, "name" | "ans_code" | "active">>,
): Promise<InsuranceProviderRow> {
  assertCan(ctx.role, "tiss:write");
  const { data, error } = await ctx.client
    .from("insurance_providers")
    .update({
      ...patch,
      name: patch.name?.trim(),
      ans_code: patch.ans_code?.trim(),
    })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw mapPostgresError(error);
  return data;
}

export async function listInsuranceContracts(
  ctx: ServiceCtx,
  providerId: string,
): Promise<InsuranceContractRow[]> {
  assertCan(ctx.role, "tiss:read");
  const { data, error } = await ctx.client
    .from("insurance_contracts")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("insurance_provider_id", providerId)
    .order("contract_number", { ascending: true });
  if (error) throw mapPostgresError(error);
  return data ?? [];
}

export async function createInsuranceContract(
  ctx: ServiceCtx,
  input: {
    insurance_provider_id: string;
    contract_number: string;
    name?: string;
    active?: boolean;
  },
): Promise<InsuranceContractRow> {
  assertCan(ctx.role, "tiss:write");
  const { data, error } = await ctx.client
    .from("insurance_contracts")
    .insert({
      tenant_id: ctx.tenantId,
      insurance_provider_id: input.insurance_provider_id,
      contract_number: input.contract_number.trim(),
      name: (input.name ?? "").trim(),
      active: input.active ?? true,
    })
    .select("*")
    .single();
  if (error) throw mapPostgresError(error);
  return data;
}

export async function listInsuranceRules(
  ctx: ServiceCtx,
  contractId: string,
): Promise<InsuranceRuleRow[]> {
  assertCan(ctx.role, "tiss:read");
  const { data, error } = await ctx.client
    .from("insurance_rules")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("insurance_contract_id", contractId)
    .order("name", { ascending: true });
  if (error) throw mapPostgresError(error);
  return data ?? [];
}

export async function createInsuranceRule(
  ctx: ServiceCtx,
  input: { insurance_contract_id: string; name: string; parameters?: Record<string, unknown> },
): Promise<InsuranceRuleRow> {
  assertCan(ctx.role, "tiss:write");
  const { data, error } = await ctx.client
    .from("insurance_rules")
    .insert({
      tenant_id: ctx.tenantId,
      insurance_contract_id: input.insurance_contract_id,
      name: input.name.trim(),
      parameters: input.parameters ?? {},
    })
    .select("*")
    .single();
  if (error) throw mapPostgresError(error);
  return data;
}
