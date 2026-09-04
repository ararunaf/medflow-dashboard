/**
 * F6-O1 — painel de prontidão de homologação TISS, exercido por sessões
 * REAIS (anon key + signInWithPassword, não service_role — mesma lição do
 * F4/F5) através dos services de verdade (loadHomologationReadiness,
 * setInsuranceProviderHomologationStatus).
 *
 * Prova:
 *  - leitura por operadora reflete dado real: ANS configurado + guia
 *    emitida (Operadora A, pronta) vs. ANS ausente (Operadora B, não
 *    pronta);
 *  - leitura do tenant reflete tenant_settings completo + existência de
 *    contract_rule_versions (aprovação é estrutural — a própria linha
 *    existir já é a aprovação, sem coluna de status para checar);
 *  - RBAC real: coordenador (tiss:write) consegue atualizar o status de
 *    homologação de uma operadora; profissional (só tiss:read) tem a
 *    escrita rejeitada por assertCan, mas continua lendo o painel
 *    normalmente.
 *
 * Cria um tenant dedicado (prefixo "e2e-f6o1-") e limpa tudo ao final.
 * Nunca toca dado real de cooperativa.
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../src/lib/database.types.ts";
import type { ServiceCtx } from "../../../src/lib/services/operations/types.ts";
import {
  loadHomologationReadiness,
  setInsuranceProviderHomologationStatus,
} from "../../../src/lib/services/tiss/homologation-service.ts";

const hasSupabase =
  Boolean(process.env.VITE_SUPABASE_URL) &&
  Boolean(process.env.VITE_SUPABASE_ANON_KEY) &&
  Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

describe("F6-O1 — painel de prontidão de homologação TISS (sessões reais, Supabase real)", () => {
  if (!hasSupabase) {
    it("skips sem credenciais Supabase configuradas", (t) => {
      t.skip("Supabase não configurado — integração omitida");
    });
    return;
  }

  let admin: SupabaseClient<Database>;
  let tenantId: string;
  let providerReadyId: string;
  let providerNotReadyId: string;
  let operatorContractId: string;
  const authUserIds: string[] = [];
  let coordinatorCtx: ServiceCtx;
  let professionalCtx: ServiceCtx;

  before(async () => {
    const { createClient } = await import("@supabase/supabase-js");
    admin = createClient<Database>(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });

    const suffix = Date.now();
    const tenant = await admin
      .from("tenants")
      .insert({ name: `E2E F6-O1 ${suffix}`, slug: `e2e-f6o1-${suffix}` })
      .select("id")
      .single();
    if (tenant.error) throw new Error(`setup tenant: ${tenant.error.message}`);
    tenantId = tenant.data.id;

    async function makeUser(label: string, role: "professional" | "coordinator") {
      const email = `e2e-f6o1-${label}-${suffix}@example.invalid`;
      const password = `Test-${suffix}-${label}-!Aa1`;
      const authUser = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      if (authUser.error || !authUser.data.user) throw new Error(`setup auth user ${label}: ${authUser.error?.message}`);
      authUserIds.push(authUser.data.user.id);

      const profile = await admin
        .from("profiles")
        .insert({ id: authUser.data.user.id, tenant_id: tenantId, full_name: `E2E F6-O1 ${label}`, role })
        .select("id")
        .single();
      if (profile.error) throw new Error(`setup profile ${label}: ${profile.error.message}`);

      let professionalId: string | null = null;
      if (role === "professional") {
        const professional = await admin
          .from("professionals")
          .insert({ tenant_id: tenantId, profile_id: profile.data.id, specialty: "Clínica Médica", crm: `SP-${label}${suffix}` })
          .select("id")
          .single();
        if (professional.error) throw new Error(`setup professional ${label}: ${professional.error.message}`);
        professionalId = professional.data.id;
      }

      const { createClient: createAnonClient } = await import("@supabase/supabase-js");
      const client = createAnonClient<Database>(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!, {
        auth: { persistSession: false },
      });
      const signIn = await client.auth.signInWithPassword({ email, password });
      if (signIn.error) throw new Error(`sign in ${label}: ${signIn.error.message}`);

      const ctx: ServiceCtx = {
        client,
        tenantId,
        role,
        userId: authUser.data.user.id,
        actorProfileId: profile.data.id,
        professionalId,
      };
      return ctx;
    }

    coordinatorCtx = await makeUser("coord", "coordinator");
    professionalCtx = await makeUser("prof", "professional");

    const providerReady = await admin
      .from("insurance_providers")
      .insert({ tenant_id: tenantId, name: "Operadora Pronta", ans_code: "777777" })
      .select("id")
      .single();
    if (providerReady.error) throw new Error(`setup provider ready: ${providerReady.error.message}`);
    providerReadyId = providerReady.data.id;

    const providerNotReady = await admin
      .from("insurance_providers")
      .insert({ tenant_id: tenantId, name: "Operadora Sem ANS", ans_code: "" })
      .select("id")
      .single();
    if (providerNotReady.error) throw new Error(`setup provider not ready: ${providerNotReady.error.message}`);
    providerNotReadyId = providerNotReady.data.id;

    const tuss = await admin
      .from("tuss_procedures")
      .insert({ code: `F6O1${suffix}`, description: "Consulta em consultório (F6-O1)", default_value: 150 })
      .select("id")
      .single();
    if (tuss.error) throw new Error(`setup tuss_procedure: ${tuss.error.message}`);

    const guide = await admin
      .from("tiss_guides")
      .insert({
        tenant_id: tenantId,
        guide_type: "consulta",
        patient_name: "Paciente E2E F6-O1",
        insurance_provider_id: providerReadyId,
        professional_id: professionalCtx.professionalId,
        attendance_date: "2026-08-15",
        status: "draft",
      })
      .select("id")
      .single();
    if (guide.error) throw new Error(`setup tiss_guide: ${guide.error.message}`);
  });

  after(async () => {
    if (!admin || !tenantId) return;
    const steps: Array<[string, () => Promise<{ error: { message: string } | null }>]> = [
      ["contract_rule_versions", () => admin.from("contract_rule_versions").delete().eq("tenant_id", tenantId)],
      ["operator_contracts", () => admin.from("operator_contracts").delete().eq("tenant_id", tenantId)],
      ["tiss_guides", () => admin.from("tiss_guides").delete().eq("tenant_id", tenantId)],
      ["insurance_providers", () => admin.from("insurance_providers").delete().eq("tenant_id", tenantId)],
      ["professionals", () => admin.from("professionals").delete().eq("tenant_id", tenantId)],
      ["tenant_settings", () => admin.from("tenant_settings").delete().eq("tenant_id", tenantId)],
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

  it("prontidão por operadora reflete ANS + guia real; tenant começa incompleto sem tenant_settings/regra aprovada", async () => {
    const bundle = await loadHomologationReadiness(coordinatorCtx);

    const ready = bundle.operators.find((o) => o.providerId === providerReadyId);
    assert.ok(ready);
    assert.equal(ready!.ansCodeConfigured, true);
    assert.equal(ready!.hasBilledGuide, true);
    assert.equal(ready!.technicallyReady, true);
    assert.equal(ready!.homologationStatus, "not_started");

    const notReady = bundle.operators.find((o) => o.providerId === providerNotReadyId);
    assert.ok(notReady);
    assert.equal(notReady!.ansCodeConfigured, false);
    assert.equal(notReady!.hasBilledGuide, false);
    assert.equal(notReady!.technicallyReady, false);

    assert.equal(bundle.tenant.institutionalDataComplete, false);
    assert.equal(bundle.tenant.hasApprovedContractRule, false);
  });

  it("tenant fica completo após tenant_settings preenchido e uma contract_rule_versions real existir", async () => {
    const settings = await admin
      .from("tenant_settings")
      .upsert({
        tenant_id: tenantId,
        institution_name: "Cooperativa E2E F6-O1",
        contact_email: "contato@e2e-f6o1.invalid",
        support_phone: "11999998888",
        cnpj: "12.345.678/0001-90",
      })
      .select("tenant_id")
      .single();
    if (settings.error) throw new Error(`setup tenant_settings: ${settings.error.message}`);

    const operatorContract = await admin
      .from("operator_contracts")
      .insert({
        tenant_id: tenantId,
        operator_code: "777777",
        operator_name: "Operadora Pronta",
        contract_label: "Contrato E2E F6-O1",
        byte_length: 10,
        checksum_sha256: "a".repeat(64),
        storage_path: "e2e/f6o1/contract.pdf",
        created_by: coordinatorCtx.actorProfileId,
      })
      .select("id")
      .single();
    if (operatorContract.error) throw new Error(`setup operator_contract: ${operatorContract.error.message}`);
    operatorContractId = operatorContract.data.id;

    const ruleVersion = await admin
      .from("contract_rule_versions")
      .insert({
        tenant_id: tenantId,
        operator_contract_id: operatorContractId,
        rule_id: `e2e-f6o1-rule-${Date.now()}`,
        operator_code: "777777",
        contract_label: "Contrato E2E F6-O1",
        category: "cobertura",
        description: "Regra de teste E2E F6-O1",
        justification: "Justificativa de teste",
        citation_excerpt: "Trecho citado do contrato",
        approved_by: coordinatorCtx.actorProfileId,
      })
      .select("id")
      .single();
    if (ruleVersion.error) throw new Error(`setup contract_rule_versions: ${ruleVersion.error.message}`);

    const bundle = await loadHomologationReadiness(coordinatorCtx);
    assert.equal(bundle.tenant.institutionalDataComplete, true);
    assert.deepEqual(bundle.tenant.missingInstitutionalFields, []);
    assert.equal(bundle.tenant.hasApprovedContractRule, true);
  });

  it("coordenador (tiss:write) atualiza o status de homologação; homologated_at é preenchido só quando homologada", async () => {
    const updated = await setInsuranceProviderHomologationStatus(coordinatorCtx, {
      providerId: providerReadyId,
      status: "in_progress",
      notes: "Documentação enviada à operadora em 2026-09-04.",
    });
    assert.equal(updated.homologationStatus, "in_progress");
    assert.equal(updated.homologationNotes, "Documentação enviada à operadora em 2026-09-04.");
    assert.equal(updated.homologatedAt, null);

    const homologated = await setInsuranceProviderHomologationStatus(coordinatorCtx, {
      providerId: providerReadyId,
      status: "homologated",
    });
    assert.equal(homologated.homologationStatus, "homologated");
    assert.ok(homologated.homologatedAt, "homologated_at deve ser preenchido ao homologar");

    const bundle = await loadHomologationReadiness(coordinatorCtx);
    const persisted = bundle.operators.find((o) => o.providerId === providerReadyId);
    assert.equal(persisted?.homologationStatus, "homologated");
  });

  it("profissional (só tiss:read) lê o painel normalmente mas tem a escrita rejeitada por RBAC real", async () => {
    const bundle = await loadHomologationReadiness(professionalCtx);
    assert.ok(bundle.operators.length >= 2);

    await assert.rejects(
      () =>
        setInsuranceProviderHomologationStatus(professionalCtx, {
          providerId: providerNotReadyId,
          status: "in_progress",
        }),
      /permiss|permission/i,
    );
  });
});
