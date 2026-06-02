import { assertCan } from "@/lib/auth/rbac";
import { mapPostgresError } from "@/lib/domain/operations/errors";
import type { ServiceCtx } from "@/lib/services/operations/types";

export type DemoCatalogSeedResult = {
  insertedProviders: number;
  insertedContracts: number;
};

/**
 * Catálogo mínimo de convênios para demo comercial (idempotente, volume baixo).
 * Não cria guias TISS, glosas ou repasses — estes exigem profissionais e lotes reais.
 */
export async function applyInsuranceCatalogDemo(ctx: ServiceCtx): Promise<DemoCatalogSeedResult> {
  assertCan(ctx.role, "demo_seed:apply");

  const { count, error: countErr } = await ctx.client
    .from("insurance_providers")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", ctx.tenantId);
  if (countErr) throw mapPostgresError(countErr);

  let insertedProviders = 0;
  const seedNames = [
    { name: "Demonstração — Plano Horizonte", ans: "000001" },
    { name: "Demonstração — Saúde Integrada", ans: "000002" },
  ];

  if ((count ?? 0) < 2) {
    for (const row of seedNames) {
      const { data: existing } = await ctx.client
        .from("insurance_providers")
        .select("id")
        .eq("tenant_id", ctx.tenantId)
        .eq("name", row.name)
        .maybeSingle();
      if (existing) continue;
      const { error } = await ctx.client.from("insurance_providers").insert({
        tenant_id: ctx.tenantId,
        name: row.name,
        ans_code: row.ans,
        active: true,
      });
      if (error) throw mapPostgresError(error);
      insertedProviders += 1;
    }
  }

  const { data: firstProvider } = await ctx.client
    .from("insurance_providers")
    .select("id")
    .eq("tenant_id", ctx.tenantId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  let insertedContracts = 0;
  if (firstProvider?.id) {
    const { data: hasContract } = await ctx.client
      .from("insurance_contracts")
      .select("id")
      .eq("tenant_id", ctx.tenantId)
      .eq("contract_number", "DEMO-CAT-001")
      .maybeSingle();
    if (!hasContract) {
      const { error } = await ctx.client.from("insurance_contracts").insert({
        tenant_id: ctx.tenantId,
        insurance_provider_id: firstProvider.id,
        name: "Contrato demonstração catálogo",
        contract_number: "DEMO-CAT-001",
        active: true,
      });
      if (error) throw mapPostgresError(error);
      insertedContracts = 1;
    }
  }

  return { insertedProviders, insertedContracts };
}
