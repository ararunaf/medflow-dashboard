/**
 * F1-S4-DEPLOY — teste de carga de pico real, contra o Supabase de staging
 * real (não simulação em memória).
 *
 * Origem: uma auditoria externa apontou (corretamente, verificado) que
 * `capture-pipeline-load.test.ts` (F1-S4) é sintético em dois pontos:
 *   1. Usa uma fila em memória protegida por mutex, não Postgres real —
 *      não prova `FOR UPDATE SKIP LOCKED` sob lock/latência real.
 *   2. Simula o custo de OCR com `sleep(1 + Math.random() * 3)` — 1-4ms,
 *      quando a latência real medida do Azure Document Intelligence é
 *      500ms-3s/página (docs/enterprise/OCR_AZURE_PRODUCTION_CERTIFICATION.md).
 *
 * Este teste substitui os dois pontos sintéticos por infraestrutura real,
 * mantendo o mesmo volume da auditoria (2.000 jobs, 16 workers concorrentes)
 * para comparação direta:
 *   - Insere sessões e jobs reais em `capture_sessions`/`capture_pipeline_jobs`
 *     (Postgres de staging, não mock).
 *   - Reivindica via `claim_capture_pipeline_job` (RPC real, mesma função
 *     que o worker/endpoint de produção chamam — SKIP LOCKED de verdade).
 *   - Sleep de 300-900ms por job (extremidade baixa/realista de 1 página no
 *     Azure — long tail de documentos multi-página não é o alvo aqui, é a
 *     exclusividade do claim sob I/O real).
 *
 * Escopo deliberado: NÃO roda o pipeline de negócio completo (OCR/Parser/
 * Audit/Contract/Risk/Correction via runCaptureOperationalPipelineBound) —
 * isso exigiria 2.000 documentos reais em Storage e 2.000 chamadas reais ao
 * Azure (custo e tempo desproporcionais para um teste repetível). O que
 * este teste prova é exatamente o que a auditoria contestou: exclusividade
 * de claim e throughput sob Postgres real e latência por job realista — a
 * lógica de decisão (succeeded/retry/dead-letter) já é coberta, sem
 * reimplementação, por `decideCapturePipelineJobOutcome` nos testes
 * unitários (capture-pipeline-queue.test.ts) e pela suíte estrutural da
 * migração. Reivindicar-processar-decidir com o pipeline de negócio real já
 * é coberto ponta a ponta (com Postgres real) pelos testes
 * `epc-24e-enterprise-runtime-final-cutover.test.ts` e `ocr-provider-azure-engine.test.ts`
 * — o que faltava, e só isso, era a concorrência real da fila em volume.
 *
 * Cria um tenant dedicado (prefixo "e2e-f1s4-load-") e limpa tudo ao final.
 * Nunca toca dado real de cooperativa.
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "../../../src/lib/database.types.ts";

const hasSupabase =
  Boolean(process.env.VITE_SUPABASE_URL) && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

const BACKLOG_SIZE = 2000;
const CONCURRENCY = 16;
const INSERT_CHUNK_SIZE = 250;
/** Extremidade baixa/realista de 1 página no Azure — ver docstring do arquivo. */
const MIN_JOB_MS = 300;
const MAX_JOB_MS = 900;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function percentile(sortedMs: number[], p: number): number {
  if (sortedMs.length === 0) return 0;
  const idx = Math.min(sortedMs.length - 1, Math.floor((p / 100) * sortedMs.length));
  return sortedMs[idx]!;
}

async function chunked<T>(items: readonly T[], size: number): Promise<T[][]> {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

describe("F1-S4-DEPLOY — carga de pico real da fila do pipeline de captura (Supabase real de staging)", () => {
  if (!hasSupabase) {
    it("skips sem credenciais Supabase configuradas", (t) => {
      t.skip("Supabase não configurado — integração omitida");
    });
    return;
  }

  let admin: SupabaseClient<Database>;
  let tenantId: string;
  let authUserId: string;
  let profileId: string;
  const sessionIds: string[] = [];

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
      .insert({ name: `E2E F1-S4 Load ${suffix}`, slug: `e2e-f1s4-load-${suffix}` })
      .select("id")
      .single();
    if (tenant.error) throw new Error(`setup tenant: ${tenant.error.message}`);
    tenantId = tenant.data.id;

    const email = `e2e-f1s4-load-${suffix}@example.invalid`;
    const authUser = await admin.auth.admin.createUser({
      email,
      password: `Test-${suffix}-!Aa1`,
      email_confirm: true,
    });
    if (authUser.error || !authUser.data.user) {
      throw new Error(`setup auth user: ${authUser.error?.message}`);
    }
    authUserId = authUser.data.user.id;

    const profile = await admin
      .from("profiles")
      .insert({
        id: authUserId,
        tenant_id: tenantId,
        full_name: "E2E F1-S4 Load",
        role: "coordinator",
      })
      .select("id")
      .single();
    if (profile.error) throw new Error(`setup profile: ${profile.error.message}`);
    profileId = profile.data.id;

    // Sessões mínimas — só o suficiente para satisfazer a FK composta
    // (tenant_id, session_id) de capture_pipeline_jobs. O pipeline de
    // negócio não roda neste teste (ver docstring), então não precisam de
    // documento/storage associado.
    const sessionRows = Array.from({ length: BACKLOG_SIZE }, (_, i) => ({
      tenant_id: tenantId,
      status: "CREATED" as const,
      channel: "file_upload" as const,
      metadata: {} as Json,
      status_history: [] as unknown as Json,
      created_by: profileId,
    }));
    for (const chunk of await chunked(sessionRows, INSERT_CHUNK_SIZE)) {
      const inserted = await admin.from("capture_sessions").insert(chunk).select("id");
      if (inserted.error) throw new Error(`setup capture_sessions: ${inserted.error.message}`);
      for (const row of inserted.data) sessionIds.push(row.id);
    }
    assert.equal(sessionIds.length, BACKLOG_SIZE);

    const jobRows = sessionIds.map((sessionId) => ({
      tenant_id: tenantId,
      session_id: sessionId,
      mode: "full" as const,
      created_by: profileId,
    }));
    for (const chunk of await chunked(jobRows, INSERT_CHUNK_SIZE)) {
      const inserted = await admin.from("capture_pipeline_jobs").insert(chunk);
      if (inserted.error) throw new Error(`setup capture_pipeline_jobs: ${inserted.error.message}`);
    }

    const jobCount = await admin
      .from("capture_pipeline_jobs")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId);
    if (jobCount.error)
      throw new Error(`verify capture_pipeline_jobs count: ${jobCount.error.message}`);
    console.log(
      `[setup] capture_pipeline_jobs inseridos: ${jobCount.count} (esperado ${BACKLOG_SIZE})`,
    );
    assert.equal(jobCount.count, BACKLOG_SIZE, "setup deve inserir exatamente BACKLOG_SIZE jobs");
  });

  after(async () => {
    if (!admin || !tenantId) return;
    if (process.env.E2E_SKIP_CLEANUP === "1") {
      console.warn(
        `[E2E cleanup] SKIP (E2E_SKIP_CLEANUP=1) — tenantId=${tenantId} ficou em staging.`,
      );
      return;
    }
    const steps: Array<[string, () => Promise<{ error: { message: string } | null }>]> = [
      [
        "capture_pipeline_jobs",
        () => admin.from("capture_pipeline_jobs").delete().eq("tenant_id", tenantId),
      ],
      ["capture_sessions", () => admin.from("capture_sessions").delete().eq("tenant_id", tenantId)],
      ["profiles", () => admin.from("profiles").delete().eq("tenant_id", tenantId)],
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

  it(
    `drena ${BACKLOG_SIZE} jobs reais com ${CONCURRENCY} lanes concorrentes via claim_capture_pipeline_job ` +
      `(FOR UPDATE SKIP LOCKED real), sem claim duplicado, com latência por job realista`,
    async () => {
      const claimedJobIds: string[] = [];
      const durationsMs: number[] = [];
      let emptyClaims = 0;

      async function lane(laneIndex: number): Promise<void> {
        const workerId = `e2e-f1s4-load-lane-${laneIndex}`;
        for (;;) {
          const started = Date.now();
          const { data: jobs, error } = await admin.rpc("claim_capture_pipeline_job", {
            p_worker_id: workerId,
          });
          if (error) throw new Error(`claim_capture_pipeline_job: ${error.message}`);

          const job = jobs?.[0];
          if (!job) {
            emptyClaims++;
            return;
          }

          await sleep(MIN_JOB_MS + Math.random() * (MAX_JOB_MS - MIN_JOB_MS));

          const update = await admin
            .from("capture_pipeline_jobs")
            .update({ status: "succeeded", locked_by: null })
            .eq("id", job.id)
            .select("id");
          if (update.error) throw new Error(`update succeeded: ${update.error.message}`);
          if (!update.data || update.data.length !== 1) {
            console.error(
              `[diag] UPDATE não afetou 1 linha para job ${job.id} — afetou ${update.data?.length ?? 0}`,
            );
          }

          claimedJobIds.push(job.id);
          durationsMs.push(Date.now() - started);
        }
      }

      const startedAt = Date.now();
      await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => lane(i)));
      const elapsedMs = Date.now() - startedAt;

      console.log(
        `[diag] claimedJobIds=${claimedJobIds.length} uniqueClaimed=${new Set(claimedJobIds).size} ` +
          `emptyClaims=${emptyClaims} elapsedMs=${elapsedMs}`,
      );

      // Confirmação server-side (não só client-side): estado real no banco.
      // Usa `count: "exact", head: true` por status — NÃO faz um SELECT
      // trazendo as linhas em si, porque o PostgREST tem um teto padrão de
      // linhas por resposta (bem menor que BACKLOG_SIZE) que trunca
      // silenciosamente um `.select()` simples sem `.range()`, sem erro —
      // um `head: true` só pede o `Content-Range` (contagem exata via
      // header), que não sofre esse teto.
      async function countByStatus(status: string): Promise<number> {
        const { count, error } = await admin
          .from("capture_pipeline_jobs")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .eq("status", status);
        if (error) throw new Error(`countByStatus(${status}): ${error.message}`);
        return count ?? 0;
      }
      const succeededCount = await countByStatus("succeeded");
      const queuedCount = await countByStatus("queued");
      const processingCount = await countByStatus("processing");
      console.log(
        `[diag] status no banco: succeeded=${succeededCount} queued=${queuedCount} processing=${processingCount}`,
      );

      // Exclusividade sob Postgres real: nenhum job reivindicado duas vezes.
      assert.equal(
        claimedJobIds.length,
        BACKLOG_SIZE,
        "todo o backlog deve ser reivindicado exatamente uma vez",
      );
      assert.equal(
        new Set(claimedJobIds).size,
        BACKLOG_SIZE,
        "FOR UPDATE SKIP LOCKED real: nenhum job pode ser reivindicado por duas lanes",
      );

      assert.equal(queuedCount, 0, "nenhum job pode ficar preso em 'queued' no Postgres real");
      assert.equal(
        processingCount,
        0,
        "nenhum job pode ficar preso em 'processing' no Postgres real",
      );
      assert.equal(succeededCount, BACKLOG_SIZE);

      durationsMs.sort((a, b) => a - b);
      const throughputPerHour = (BACKLOG_SIZE / (elapsedMs / 1000)) * 3600;
      console.log(
        `[carga real] ${BACKLOG_SIZE} jobs / ${CONCURRENCY} lanes em ${elapsedMs}ms — ` +
          `p50=${percentile(durationsMs, 50)}ms p95=${percentile(durationsMs, 95)}ms max=${durationsMs[durationsMs.length - 1]}ms — ` +
          `throughput≈${throughputPerHour.toFixed(0)} jobs/hora (regime constante alvo: ~28/hora) — ` +
          `${emptyClaims} claims vazios ao esvaziar a fila`,
      );

      // Sanidade: throughput real deve superar folgadamente o regime
      // constante alvo (~28/hora) — senão a alegação de capacidade não se
      // sustenta nem sob este volume de teste, muito menos no pico.
      assert.ok(
        throughputPerHour > 28 * 5,
        `throughput real (${throughputPerHour.toFixed(0)}/h) deveria superar folgadamente o regime constante alvo (28/h)`,
      );
    },
  );
});
