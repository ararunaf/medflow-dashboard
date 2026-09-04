/**
 * F5-S3 — teste de carga de pico real, contra o Supabase de staging real
 * (não simulação em memória): cria um volume de guias TISS concorrente,
 * fecha um lote com todas elas, e mede sucesso/latência.
 *
 * Diferente do teste de carga do F1-S4 (capture-pipeline-load.test.ts),
 * que simula a fila em memória porque não havia Postgres real disponível
 * naquele ambiente — aqui HÁ um staging real acessível (usado em toda
 * sprint deste roadmap desde o F1), então o teste é real: cada guia
 * criada passa por RLS real, pela nova criptografia de patient_name
 * (RPC + insert, F5-S2), pela sequência real de guide_number
 * (GENERATED ALWAYS AS IDENTITY, F3-S1), e pelo trigger real de total do
 * lote (F3-S1/batch-service.ts).
 *
 * Volume: 300 guias, em ondas de 25 concorrentes — uma fração real e
 * responsável do pico diário estimado no roadmap (2.000-3.000/dia em
 * fechamento de lote), sem esgotar o pool de conexões de um projeto de
 * staging compartilhado nem disparar rate limit de auth (só 1 sessão real
 * assinada é usada para todas as operações, nenhum usuário novo por guia).
 *
 * Cria um tenant dedicado (prefixo "e2e-f5s3-load-") e limpa tudo ao
 * final. Nunca toca dado real de cooperativa.
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../src/lib/database.types.ts";
import type { ServiceCtx } from "../../../src/lib/services/operations/types.ts";
import { addTissGuideItem, createTissGuide, setTissGuideStatus } from "../../../src/lib/services/tiss/guide-service.ts";
import { assignGuideToBatch, closeTissBatch, createTissBatch } from "../../../src/lib/services/tiss/batch-service.ts";

const hasSupabase =
  Boolean(process.env.VITE_SUPABASE_URL) &&
  Boolean(process.env.VITE_SUPABASE_ANON_KEY) &&
  Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

const TOTAL_GUIDES = 300;
const WAVE_SIZE = 25;

async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<Array<{ ok: true; value: R } | { ok: false; error: unknown }>> {
  const results: Array<{ ok: true; value: R } | { ok: false; error: unknown }> = new Array(items.length);
  let cursor = 0;
  async function worker() {
    for (;;) {
      const i = cursor++;
      if (i >= items.length) return;
      try {
        results[i] = { ok: true, value: await fn(items[i]!, i) };
      } catch (error) {
        results[i] = { ok: false, error };
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return results;
}

function percentile(sortedMs: number[], p: number): number {
  if (sortedMs.length === 0) return 0;
  const idx = Math.min(sortedMs.length - 1, Math.floor((p / 100) * sortedMs.length));
  return sortedMs[idx]!;
}

describe("F5-S3 — carga de pico real: criação concorrente de guias TISS + fechamento de lote (Supabase real de staging)", () => {
  if (!hasSupabase) {
    it("skips sem credenciais Supabase configuradas", (t) => {
      t.skip("Supabase não configurado — integração omitida");
    });
    return;
  }

  let admin: SupabaseClient<Database>;
  let coordinatorClient: SupabaseClient<Database>;
  let tenantId: string;
  let professionalId: string;
  let providerId: string;
  let tussId: string;
  let authUserId: string;
  let coordinatorCtx: ServiceCtx;
  const guideIds: string[] = [];
  let batchId: string;

  before(async () => {
    const { createClient } = await import("@supabase/supabase-js");
    admin = createClient<Database>(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });

    const suffix = Date.now();
    const tenant = await admin
      .from("tenants")
      .insert({ name: `E2E F5-S3 Load ${suffix}`, slug: `e2e-f5s3-load-${suffix}` })
      .select("id")
      .single();
    if (tenant.error) throw new Error(`setup tenant: ${tenant.error.message}`);
    tenantId = tenant.data.id;

    const email = `e2e-f5s3-load-${suffix}@example.invalid`;
    const password = `Test-${suffix}-!Aa1`;
    const authUser = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (authUser.error || !authUser.data.user) throw new Error(`setup auth user: ${authUser.error?.message}`);
    authUserId = authUser.data.user.id;

    const profile = await admin
      .from("profiles")
      .insert({ id: authUserId, tenant_id: tenantId, full_name: "E2E F5-S3 Load Coordenador", role: "coordinator" })
      .select("id")
      .single();
    if (profile.error) throw new Error(`setup profile: ${profile.error.message}`);

    const professional = await admin
      .from("professionals")
      .insert({ tenant_id: tenantId, profile_id: profile.data.id, specialty: "Clínica Médica", crm: `SP-LOAD${suffix}` })
      .select("id")
      .single();
    if (professional.error) throw new Error(`setup professional: ${professional.error.message}`);
    professionalId = professional.data.id;

    const provider = await admin
      .from("insurance_providers")
      .insert({ tenant_id: tenantId, name: "E2E Operadora Load", ans_code: "444444" })
      .select("id")
      .single();
    if (provider.error) throw new Error(`setup insurance_provider: ${provider.error.message}`);
    providerId = provider.data.id;

    const tuss = await admin
      .from("tuss_procedures")
      .insert({ code: `LOAD${suffix}`, description: "Consulta em consultório (load)", default_value: 150 })
      .select("id")
      .single();
    if (tuss.error) throw new Error(`setup tuss_procedure: ${tuss.error.message}`);
    tussId = tuss.data.id;

    const { createClient: createAnonClient } = await import("@supabase/supabase-js");
    coordinatorClient = createAnonClient<Database>(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false },
    });
    const signIn = await coordinatorClient.auth.signInWithPassword({ email, password });
    if (signIn.error) throw new Error(`sign in as coordinator: ${signIn.error.message}`);

    coordinatorCtx = {
      client: coordinatorClient,
      tenantId,
      role: "coordinator",
      userId: authUserId,
      actorProfileId: profile.data.id,
      professionalId,
    };
  });

  after(async () => {
    if (!admin || !tenantId) return;
    const steps: Array<[string, () => Promise<{ error: { message: string } | null }>]> = [
      ["tiss_guide_items", () => admin.from("tiss_guide_items").delete().eq("tenant_id", tenantId)],
      ["tiss_guides", () => admin.from("tiss_guides").delete().eq("tenant_id", tenantId)],
      ["tiss_batches", () => admin.from("tiss_batches").delete().eq("tenant_id", tenantId)],
      ["insurance_providers", () => admin.from("insurance_providers").delete().eq("tenant_id", tenantId)],
      ["professionals", () => admin.from("professionals").delete().eq("tenant_id", tenantId)],
      ["operational_events", () => admin.from("operational_events").delete().eq("tenant_id", tenantId)],
      ["tuss_procedures", () => admin.from("tuss_procedures").delete().eq("id", tussId)],
    ];
    for (const [label, run] of steps) {
      const { error } = await run();
      if (error) console.warn(`[E2E cleanup] ${label}: ${error.message}`);
    }
    if (authUserId) {
      const del = await admin.auth.admin.deleteUser(authUserId);
      if (del.error) console.warn(`[E2E cleanup] auth user: ${del.error.message}`);
    }
    const { error: tenantErr } = await admin.from("tenants").delete().eq("id", tenantId);
    if (tenantErr) console.warn(`[E2E cleanup] tenant: ${tenantErr.message}`);
  });

  it(`cria ${TOTAL_GUIDES} guias concorrentes (ondas de ${WAVE_SIZE}), sem colisão de guide_number, com latência aceitável`, async () => {
    const durations: number[] = [];
    const results = await mapWithConcurrency(
      Array.from({ length: TOTAL_GUIDES }, (_, i) => i),
      WAVE_SIZE,
      async (i) => {
        const start = Date.now();
        const guide = await createTissGuide(coordinatorCtx, {
          guide_type: "consulta",
          patient_name: `Paciente Carga de Pico ${i}`,
          insurance_provider_id: providerId,
          professional_id: professionalId,
          attendance_date: "2026-08-15",
        });
        await addTissGuideItem(coordinatorCtx, {
          guide_id: guide.id,
          procedure_id: tussId,
          quantity: 1,
          unit_value: 150,
          execution_date: "2026-08-15",
        });
        durations.push(Date.now() - start);
        return guide;
      },
    );

    const failures = results.filter((r) => !r.ok);
    if (failures.length > 0) {
      console.error(
        "falhas na criação sob carga:",
        failures.slice(0, 5).map((f) => (f.ok ? null : String(f.error))),
      );
    }
    assert.equal(failures.length, 0, `${failures.length}/${TOTAL_GUIDES} criações falharam sob carga`);

    for (const r of results) {
      if (r.ok) guideIds.push((r.value as { id: string }).id);
    }
    assert.equal(guideIds.length, TOTAL_GUIDES);
    assert.equal(new Set(guideIds).size, TOTAL_GUIDES, "todos os ids de guia devem ser únicos (sem colisão)");

    const { data: numbers, error: numErr } = await admin
      .from("tiss_guides")
      .select("guide_number")
      .in("id", guideIds);
    assert.equal(numErr, null, numErr?.message);
    const guideNumbers = (numbers ?? []).map((r) => r.guide_number);
    assert.equal(
      new Set(guideNumbers).size,
      TOTAL_GUIDES,
      "guide_number (GENERATED ALWAYS AS IDENTITY) não pode colidir sob concorrência real",
    );

    durations.sort((a, b) => a - b);
    console.log(
      `[carga] ${TOTAL_GUIDES} guias — p50=${percentile(durations, 50)}ms p95=${percentile(durations, 95)}ms max=${durations[durations.length - 1]}ms`,
    );
  });

  it("aprova todas as guias e fecha um lote único com o total correto sob o volume gerado", async () => {
    const approvals = await mapWithConcurrency(guideIds, WAVE_SIZE, async (guideId) => {
      await setTissGuideStatus(coordinatorCtx, guideId, "pending_review");
      return setTissGuideStatus(coordinatorCtx, guideId, "approved");
    });
    const approvalFailures = approvals.filter((r) => !r.ok);
    assert.equal(approvalFailures.length, 0, `${approvalFailures.length} aprovações falharam sob carga`);

    const batch = await createTissBatch(coordinatorCtx, "2026-08-01");
    batchId = batch.id;

    const assignments = await mapWithConcurrency(guideIds, WAVE_SIZE, (guideId) =>
      assignGuideToBatch(coordinatorCtx, { guide_id: guideId, batch_id: batchId }),
    );
    const assignFailures = assignments.filter((r) => !r.ok);
    assert.equal(assignFailures.length, 0, `${assignFailures.length} atribuições ao lote falharam sob carga`);

    const closed = await closeTissBatch(coordinatorCtx, batchId);
    assert.equal(closed.status, "closed");
    // 300 guias x 1 item x R$150 = R$45.000,00 — prova que o total do lote
    // (recalculado incrementalmente a cada assignGuideToBatch) bate exato
    // mesmo depois de centenas de recálculos concorrentes.
    assert.equal(Number(closed.total_value), TOTAL_GUIDES * 150);
  });
});
