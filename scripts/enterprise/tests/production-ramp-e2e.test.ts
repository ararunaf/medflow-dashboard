/**
 * F6-O2 — progresso de rampa de produção, exercido por sessão REAL
 * (anon key + signInWithPassword, não service_role) através dos services
 * de verdade (upsertTenantSettings, loadExecutiveDashboardSnapshot).
 *
 * Prova:
 *  - production_ramp_target_pct persiste via upsertTenantSettings e é
 *    validado (rejeita valores fora de {10, 50, 100});
 *  - loadExecutiveDashboardSnapshot calcula total_guides/production_ramp
 *    a partir de dado real de medical_production da competência foco,
 *    contra a meta configurada em tenant_settings;
 *  - sem tenant_settings configurado, cai no default (10%) sem quebrar.
 *
 * Cria um tenant dedicado (prefixo "e2e-f6o2-") e limpa tudo ao final.
 * Nunca toca dado real de cooperativa.
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../src/lib/database.types.ts";
import type { ServiceCtx } from "../../../src/lib/services/operations/types.ts";
import { upsertTenantSettings } from "../../../src/lib/services/tenant-settings/tenant-settings-service.ts";
import { loadExecutiveDashboardSnapshot } from "../../../src/lib/services/executive-dashboard/executive-dashboard-service.ts";
import {
  PRODUCTION_FULL_SCALE_GUIDES_PER_MONTH,
  PRODUCTION_FULL_SCALE_REVENUE_PER_MONTH_BRL,
} from "../../../src/lib/operational/constants.ts";

const hasSupabase =
  Boolean(process.env.VITE_SUPABASE_URL) &&
  Boolean(process.env.VITE_SUPABASE_ANON_KEY) &&
  Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

describe("F6-O2 — rampa de produção no dashboard executivo (sessão real, Supabase real)", () => {
  if (!hasSupabase) {
    it("skips sem credenciais Supabase configuradas", (t) => {
      t.skip("Supabase não configurado — integração omitida");
    });
    return;
  }

  let admin: SupabaseClient<Database>;
  let tenantId: string;
  let professionalId: string;
  let coordinatorCtx: ServiceCtx;
  const authUserIds: string[] = [];
  const competenceMonth = "2026-09-01";

  before(async () => {
    const { createClient } = await import("@supabase/supabase-js");
    admin = createClient<Database>(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    );

    const suffix = Date.now();
    const tenant = await admin
      .from("tenants")
      .insert({ name: `E2E F6-O2 ${suffix}`, slug: `e2e-f6o2-${suffix}` })
      .select("id")
      .single();
    if (tenant.error) throw new Error(`setup tenant: ${tenant.error.message}`);
    tenantId = tenant.data.id;

    const email = `e2e-f6o2-coord-${suffix}@example.invalid`;
    const password = `Test-${suffix}-coord-!Aa1`;
    const authUser = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (authUser.error || !authUser.data.user) {
      throw new Error(`setup auth user: ${authUser.error?.message}`);
    }
    authUserIds.push(authUser.data.user.id);

    const profile = await admin
      .from("profiles")
      .insert({
        id: authUser.data.user.id,
        tenant_id: tenantId,
        // tenant_admin, não coordinator: o teste também exercita
        // upsertTenantSettings (tenant_settings:write), que coordinator não tem.
        full_name: "E2E F6-O2 Admin",
        role: "tenant_admin",
      })
      .select("id")
      .single();
    if (profile.error) throw new Error(`setup profile: ${profile.error.message}`);

    const professional = await admin
      .from("professionals")
      .insert({
        tenant_id: tenantId,
        profile_id: profile.data.id,
        specialty: "Clínica Médica",
        crm: `SP-F6O2-${suffix}`,
      })
      .select("id")
      .single();
    if (professional.error) throw new Error(`setup professional: ${professional.error.message}`);
    professionalId = professional.data.id;

    const provider = await admin
      .from("insurance_providers")
      .insert({ tenant_id: tenantId, name: "Operadora E2E F6-O2", ans_code: "888888" })
      .select("id")
      .single();
    if (provider.error) throw new Error(`setup provider: ${provider.error.message}`);

    // 3 guias faturadas na competência foco — dado real de produção.
    for (let i = 0; i < 3; i++) {
      const guide = await admin
        .from("tiss_guides")
        .insert({
          tenant_id: tenantId,
          guide_type: "consulta",
          patient_name: `Paciente E2E F6-O2 ${i}`,
          insurance_provider_id: provider.data.id,
          professional_id: professionalId,
          attendance_date: "2026-09-10",
          status: "draft",
        })
        .select("id")
        .single();
      if (guide.error) throw new Error(`setup tiss_guide ${i}: ${guide.error.message}`);

      const production = await admin.from("medical_production").insert({
        tenant_id: tenantId,
        professional_id: professionalId,
        guide_id: guide.data.id,
        competence_month: competenceMonth,
        gross_value: 500,
        denied_value: 0,
        approved_value: 500,
      });
      if (production.error)
        throw new Error(`setup medical_production ${i}: ${production.error.message}`);
    }

    const { createClient: createAnonClient } = await import("@supabase/supabase-js");
    const client = createAnonClient<Database>(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } },
    );
    const signIn = await client.auth.signInWithPassword({ email, password });
    if (signIn.error) throw new Error(`sign in admin: ${signIn.error.message}`);

    coordinatorCtx = {
      client,
      tenantId,
      role: "tenant_admin",
      userId: authUser.data.user.id,
      actorProfileId: profile.data.id,
      professionalId,
    };
  });

  after(async () => {
    if (!admin || !tenantId) return;
    const steps: Array<[string, () => Promise<{ error: { message: string } | null }>]> = [
      [
        "medical_production",
        () => admin.from("medical_production").delete().eq("tenant_id", tenantId),
      ],
      ["tiss_guides", () => admin.from("tiss_guides").delete().eq("tenant_id", tenantId)],
      [
        "insurance_providers",
        () => admin.from("insurance_providers").delete().eq("tenant_id", tenantId),
      ],
      ["professionals", () => admin.from("professionals").delete().eq("tenant_id", tenantId)],
      ["tenant_settings", () => admin.from("tenant_settings").delete().eq("tenant_id", tenantId)],
      ["profiles", () => admin.from("profiles").delete().eq("tenant_id", tenantId)],
    ];
    for (const [label, run] of steps) {
      const { error } = await run();
      if (error) console.warn(`[E2E cleanup] ${label}: ${error.message}`);
    }
    for (const id of authUserIds) {
      const del = await admin.auth.admin.deleteUser(id);
      if (del.error) console.warn(`[E2E cleanup] auth user ${id}: ${del.error.message}`);
    }
    const { error: tenantErr } = await admin.from("tenants").delete().eq("id", tenantId);
    if (tenantErr) console.warn(`[E2E cleanup] tenant: ${tenantErr.message}`);
  });

  it("sem tenant_settings configurado, cai no default de 10% sem quebrar", async () => {
    const snapshot = await loadExecutiveDashboardSnapshot(coordinatorCtx, {
      competence_month: competenceMonth,
    });
    assert.equal(snapshot.total_guides, 3);
    assert.ok(snapshot.production_ramp);
    assert.equal(snapshot.production_ramp!.targetPct, 10);
    const expectedTargetGuides = Math.round(PRODUCTION_FULL_SCALE_GUIDES_PER_MONTH * 0.1);
    assert.equal(snapshot.production_ramp!.targetGuides, expectedTargetGuides);
  });

  it("upsertTenantSettings rejeita meta fora de {10, 50, 100}", async () => {
    await assert.rejects(
      () =>
        upsertTenantSettings(coordinatorCtx, { production_ramp_target_pct: 25 as 10 | 50 | 100 }),
      /Meta de rampa de produção inválida/,
    );
  });

  it("meta configurada em 50% reflete no cálculo do progresso real", async () => {
    const saved = await upsertTenantSettings(coordinatorCtx, { production_ramp_target_pct: 50 });
    assert.equal(saved.production_ramp_target_pct, 50);

    const snapshot = await loadExecutiveDashboardSnapshot(coordinatorCtx, {
      competence_month: competenceMonth,
    });
    assert.ok(snapshot.production_ramp);
    assert.equal(snapshot.production_ramp!.targetPct, 50);

    const expectedTargetGuides = Math.round(PRODUCTION_FULL_SCALE_GUIDES_PER_MONTH * 0.5);
    const expectedTargetRevenue =
      Math.round(PRODUCTION_FULL_SCALE_REVENUE_PER_MONTH_BRL * 0.5 * 100) / 100;
    assert.equal(snapshot.production_ramp!.targetGuides, expectedTargetGuides);
    assert.equal(snapshot.production_ramp!.targetRevenueBRL, expectedTargetRevenue);

    // 3 guias reais de R$500 cada = R$1500 faturados nesta competência.
    assert.equal(snapshot.total_guides, 3);
    assert.equal(snapshot.consolidated_billing, 1500);
    const expectedGuidesPct = Math.round((3 / expectedTargetGuides) * 1000) / 10;
    assert.equal(snapshot.production_ramp!.guidesProgressPct, expectedGuidesPct);
  });
});
