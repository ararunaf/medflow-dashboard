/**
 * F6-O1 — leitura/escrita de prontidão de homologação TISS por operadora.
 * Regras puras de prontidão em `homologation-readiness.ts`.
 */
import { assertCan } from "@/lib/auth/rbac";
import { ValidationError, mapPostgresError } from "@/lib/domain/operations/errors";
import { expectUuid } from "@/lib/domain/operations/validation";
import type { ServiceCtx } from "@/lib/services/operations/types";
import {
  computeOperatorReadiness,
  computeTenantReadiness,
  isHomologationStatus,
  type HomologationStatus,
  type OperatorReadiness,
  type TenantReadiness,
} from "./homologation-readiness";

export type HomologationReadinessBundle = {
  tenant: TenantReadiness;
  operators: OperatorReadiness[];
};

export async function loadHomologationReadiness(ctx: ServiceCtx): Promise<HomologationReadinessBundle> {
  assertCan(ctx.role, "tiss:read");

  const [providersRes, settingsRes, contractRuleRes] = await Promise.all([
    ctx.client
      .from("insurance_providers")
      .select("id, name, ans_code, active, homologation_status, homologation_notes, homologated_at")
      .eq("tenant_id", ctx.tenantId)
      .order("name", { ascending: true }),
    ctx.client
      .from("tenant_settings")
      .select("institution_name, contact_email, support_phone, cnpj")
      .eq("tenant_id", ctx.tenantId)
      .maybeSingle(),
    ctx.client
      .from("contract_rule_versions")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", ctx.tenantId),
  ]);
  if (providersRes.error) throw mapPostgresError(providersRes.error);
  if (settingsRes.error) throw mapPostgresError(settingsRes.error);
  if (contractRuleRes.error) throw mapPostgresError(contractRuleRes.error);

  const providers = providersRes.data ?? [];
  const providerIds = providers.map((p) => p.id);

  let guidedProviderIds = new Set<string>();
  if (providerIds.length > 0) {
    const guidesRes = await ctx.client
      .from("tiss_guides")
      .select("insurance_provider_id")
      .eq("tenant_id", ctx.tenantId)
      .in("insurance_provider_id", providerIds);
    if (guidesRes.error) throw mapPostgresError(guidesRes.error);
    guidedProviderIds = new Set((guidesRes.data ?? []).map((g) => g.insurance_provider_id));
  }

  const tenant = computeTenantReadiness(settingsRes.data, (contractRuleRes.count ?? 0) > 0);

  const operators = providers.map((p) =>
    computeOperatorReadiness({
      providerId: p.id,
      providerName: p.name,
      active: p.active,
      ansCode: p.ans_code,
      hasBilledGuide: guidedProviderIds.has(p.id),
      homologationStatus: p.homologation_status,
      homologationNotes: p.homologation_notes,
      homologatedAt: p.homologated_at,
    }),
  );

  return { tenant, operators };
}

export async function setInsuranceProviderHomologationStatus(
  ctx: ServiceCtx,
  input: { providerId: string; status: HomologationStatus; notes?: string },
): Promise<OperatorReadiness> {
  assertCan(ctx.role, "tiss:write");
  const providerId = expectUuid(input.providerId, "providerId");
  if (!isHomologationStatus(input.status)) {
    throw new ValidationError("Campo status inválido (homologação).", { field: "status" });
  }
  const trimmedNotes = input.notes?.trim();

  const { data, error } = await ctx.client
    .from("insurance_providers")
    .update({
      homologation_status: input.status,
      homologation_notes: trimmedNotes === undefined ? undefined : trimmedNotes.length > 0 ? trimmedNotes : null,
      homologated_at: input.status === "homologated" ? new Date().toISOString() : null,
    })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", providerId)
    .select("id, name, ans_code, active, homologation_status, homologation_notes, homologated_at")
    .single();
  if (error) throw mapPostgresError(error);

  const guideRes = await ctx.client
    .from("tiss_guides")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", ctx.tenantId)
    .eq("insurance_provider_id", providerId);
  if (guideRes.error) throw mapPostgresError(guideRes.error);

  return computeOperatorReadiness({
    providerId: data.id,
    providerName: data.name,
    active: data.active,
    ansCode: data.ans_code,
    hasBilledGuide: (guideRes.count ?? 0) > 0,
    homologationStatus: data.homologation_status,
    homologationNotes: data.homologation_notes,
    homologatedAt: data.homologated_at,
  });
}
