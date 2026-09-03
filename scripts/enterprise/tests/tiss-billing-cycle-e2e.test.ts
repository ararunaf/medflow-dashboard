/**
 * F3-S4 — ciclo completo TISS ponta a ponta, contra o Supabase real de
 * staging: guia → lote → fechamento → retorno da operadora → glosa →
 * recurso → decisão. Não é mock nem fixture isolada — chama os services
 * reais (src/lib/services/tiss/*) exatamente como o app faz, e cada
 * transição de status precisa passar pelos triggers reais do banco
 * (F1-S3) — se o grafo de estados estiver errado em algum lugar, o
 * Postgres rejeita e o teste falha de verdade, não silenciosamente.
 *
 * Cria um tenant/usuário/profissional/convênio de teste dedicados
 * (identificáveis pelo prefixo "e2e-f3s4-") e limpa tudo ao final, na
 * ordem de dependência correta (RESTRICT em tiss_guides.professional_id
 * exige apagar as guias antes do profissional). Nunca toca dado real de
 * cooperativa.
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../src/lib/database.types.ts";
import type { ServiceCtx } from "../../../src/lib/services/operations/types.ts";
import { addTissGuideItem, createTissGuide, setTissGuideStatus } from "../../../src/lib/services/tiss/guide-service.ts";
import {
  createTissBatch,
  assignGuideToBatch,
  closeTissBatch,
} from "../../../src/lib/services/tiss/batch-service.ts";
import { createTissReturn } from "../../../src/lib/services/tiss/return-processing-service.ts";
import { createTissDenial, updateTissDenialStatus } from "../../../src/lib/services/tiss/denial-service.ts";
import {
  createTissDenialAppeal,
  updateTissDenialAppealStatus,
} from "../../../src/lib/services/tiss/denial-appeal-service.ts";

const hasSupabase = Boolean(process.env.VITE_SUPABASE_URL) && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

describe("F3-S4 — ciclo TISS ponta a ponta (Supabase real de staging)", () => {
  if (!hasSupabase) {
    it("skips sem credenciais Supabase configuradas", (t) => {
      t.skip("Supabase não configurado — integração omitida");
    });
    return;
  }

  let client: SupabaseClient<Database>;
  let ctx: ServiceCtx;
  let tenantId: string;
  let authUserId: string;
  let profileId: string;
  let professionalId: string;
  let providerId: string;
  let procedureId: string;
  let guideId: string;
  let batchId: string;
  let returnId: string;
  let denialId: string;
  let appealId: string;

  before(async () => {
    const { createClient } = await import("@supabase/supabase-js");
    client = createClient<Database>(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });

    const suffix = Date.now();
    const tenant = await client
      .from("tenants")
      .insert({ name: `E2E F3-S4 ${suffix}`, slug: `e2e-f3s4-${suffix}` })
      .select("id")
      .single();
    if (tenant.error) throw new Error(`setup tenant: ${tenant.error.message}`);
    tenantId = tenant.data.id;

    const authUser = await client.auth.admin.createUser({
      email: `e2e-f3s4-${suffix}@example.invalid`,
      password: `Test-${suffix}-!Aa1`,
      email_confirm: true,
    });
    if (authUser.error || !authUser.data.user) {
      throw new Error(`setup auth user: ${authUser.error?.message}`);
    }
    authUserId = authUser.data.user.id;

    const profile = await client
      .from("profiles")
      .insert({ id: authUserId, tenant_id: tenantId, full_name: "E2E F3-S4 Coordenador", role: "coordinator" })
      .select("id")
      .single();
    if (profile.error) throw new Error(`setup profile: ${profile.error.message}`);
    profileId = profile.data.id;

    const professional = await client
      .from("professionals")
      .insert({
        tenant_id: tenantId,
        profile_id: profileId,
        specialty: "Clínica Médica",
        crm: "SP-012345",
        cbo_code: "225125",
      })
      .select("id")
      .single();
    if (professional.error) throw new Error(`setup professional: ${professional.error.message}`);
    professionalId = professional.data.id;

    const provider = await client
      .from("insurance_providers")
      .insert({ tenant_id: tenantId, name: "E2E Operadora Teste", ans_code: "123456" })
      .select("id")
      .single();
    if (provider.error) throw new Error(`setup insurance_provider: ${provider.error.message}`);
    providerId = provider.data.id;

    const procedure = await client
      .from("tuss_procedures")
      .insert({ code: `E2E${suffix}`, description: "Consulta em consultório (E2E)", default_value: 150 })
      .select("id")
      .single();
    if (procedure.error) throw new Error(`setup tuss_procedure: ${procedure.error.message}`);
    procedureId = procedure.data.id;

    ctx = {
      client,
      tenantId,
      role: "coordinator",
      userId: authUserId,
      actorProfileId: profileId,
      professionalId,
    };
  });

  after(async () => {
    if (!client || !tenantId) return;
    // Ordem de dependência: filhos antes de pais. RESTRICT em
    // tiss_guides.professional_id exige apagar guias antes do profissional;
    // RESTRICT em tiss_denial_audit/operational_events.actor_profile_id
    // exige apagá-los antes de excluir o usuário (que cascateia profiles).
    // Cada passo é best-effort (não interrompe a limpeza se um passo
    // isolado falhar) — preferível deixar rastro parcial a abortar cedo e
    // deixar tenant/usuário de teste inteiros para trás no staging real.
    const steps: Array<[string, () => Promise<{ error: { message: string } | null }>]> = [
      ["tiss_denial_appeals", () => client.from("tiss_denial_appeals").delete().eq("tenant_id", tenantId)],
      ["tiss_denial_audit", () => client.from("tiss_denial_audit").delete().eq("tenant_id", tenantId)],
      ["tiss_denials", () => client.from("tiss_denials").delete().eq("tenant_id", tenantId)],
      ["tiss_returns", () => client.from("tiss_returns").delete().eq("tenant_id", tenantId)],
      ["tiss_guide_items", () => client.from("tiss_guide_items").delete().eq("tenant_id", tenantId)],
      ["tiss_guides", () => client.from("tiss_guides").delete().eq("tenant_id", tenantId)],
      ["tiss_batches", () => client.from("tiss_batches").delete().eq("tenant_id", tenantId)],
      ["insurance_providers", () => client.from("insurance_providers").delete().eq("tenant_id", tenantId)],
      ["operational_events", () => client.from("operational_events").delete().eq("tenant_id", tenantId)],
    ];
    for (const [label, run] of steps) {
      const { error } = await run();
      if (error) console.warn(`[E2E cleanup] ${label}: ${error.message}`);
    }
    if (procedureId) await client.from("tuss_procedures").delete().eq("id", procedureId);
    if (authUserId) {
      const del = await client.auth.admin.deleteUser(authUserId); // cascateia profiles -> professionals
      if (del.error) console.warn(`[E2E cleanup] auth user: ${del.error.message}`);
    }
    const { error: tenantErr } = await client.from("tenants").delete().eq("id", tenantId);
    if (tenantErr) console.warn(`[E2E cleanup] tenant: ${tenantErr.message}`);
  });

  it("percorre o ciclo completo: guia → lote → fechamento → retorno → glosa → recurso → decisão", async () => {
    // 1. Guia nasce em draft (guide-service.ts)
    const guide = await createTissGuide(ctx, {
      guide_type: "consulta",
      patient_name: "Paciente E2E F3-S4",
      insurance_provider_id: providerId,
      professional_id: professionalId,
      attendance_date: "2026-08-15",
      beneficiary_card_number: "0001234567",
    });
    guideId = guide.id;
    assert.equal(guide.status, "draft");

    await addTissGuideItem(ctx, {
      guide_id: guideId,
      procedure_id: procedureId,
      quantity: 1,
      unit_value: 150,
      execution_date: "2026-08-15",
    });

    // 2. draft -> pending_review -> approved (trigger real de F1-S3 valida a transição)
    const pending = await setTissGuideStatus(ctx, guideId, "pending_review");
    assert.equal(pending.status, "pending_review");
    const approved = await setTissGuideStatus(ctx, guideId, "approved");
    assert.equal(approved.status, "approved");

    // 3. Lote: cria, vincula a guia aprovada, fecha (guia aprovada -> billed)
    const batch = await createTissBatch(ctx, "2026-08-01");
    batchId = batch.id;
    assert.equal(batch.status, "open");

    await assignGuideToBatch(ctx, { guide_id: guideId, batch_id: batchId });
    const closed = await closeTissBatch(ctx, batchId);
    assert.equal(closed.status, "closed");

    const { data: billedGuide, error: billedErr } = await client
      .from("tiss_guides")
      .select("status")
      .eq("id", guideId)
      .single();
    assert.equal(billedErr, null, billedErr?.message);
    assert.equal(billedGuide!.status, "billed");

    // 4. Retorno da operadora
    const ret = await createTissReturn(ctx, { batch_id: batchId, return_reference: "E2E-RETORNO-0001" });
    returnId = ret.id;
    assert.equal(ret.status, "received");

    // 5. Glosa identificada a partir do retorno
    const denial = await createTissDenial(ctx, {
      return_id: returnId,
      guide_id: guideId,
      denial_type: "partial",
      denial_reason_code: "E2E-001",
      denial_reason_description: "Glosa sintética de teste ponta a ponta",
      denied_value: 50,
    });
    denialId = denial.id;
    assert.equal(denial.status, "identified");

    // 6. Recurso de glosa — createTissDenialAppeal já nasce em 'submitted' e
    // cascateia tiss_denials.status para 'appealed' (comportamento real de F1-S3).
    const appeal = await createTissDenialAppeal(ctx, {
      denial_id: denialId,
      appeal_reason: "Procedimento coberto conforme cláusula contratual — recurso E2E",
    });
    appealId = appeal.id;
    assert.equal(appeal.appeal_status, "submitted");

    const { data: appealedDenial, error: appealedErr } = await client
      .from("tiss_denials")
      .select("status")
      .eq("id", denialId)
      .single();
    assert.equal(appealedErr, null, appealedErr?.message);
    assert.equal(appealedDenial!.status, "appealed");

    // 7. Recurso percorre submitted -> under_review -> accepted (grafo real do trigger)
    const underReview = await updateTissDenialAppealStatus(ctx, appealId, { appeal_status: "under_review" });
    assert.equal(underReview.appeal_status, "under_review");
    const acceptedAppeal = await updateTissDenialAppealStatus(ctx, appealId, { appeal_status: "accepted" });
    assert.equal(acceptedAppeal.appeal_status, "accepted");

    // 8. Recurso aceito -> glosa revertida (decisão de negócio real: recurso ganho reverte a glosa)
    const reversedDenial = await updateTissDenialStatus(ctx, denialId, { status: "reversed" });
    assert.equal(reversedDenial.status, "reversed");

    // 9. Transição inválida continua bloqueada mesmo dentro do ciclo real —
    // prova que o trigger de F1-S3 está genuinamente ativo, não só nos testes isolados.
    await assert.rejects(
      () => updateTissDenialAppealStatus(ctx, appealId, { appeal_status: "submitted" }),
      /terminal|cannot transition|check_violation|invalid|constraint/i,
    );
  });
});
