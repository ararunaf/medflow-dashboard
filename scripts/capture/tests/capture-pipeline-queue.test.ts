/**
 * F1-S4 — fila assíncrona real do pipeline de Captura.
 *
 * `decideCapturePipelineJobOutcome`/`computeCapturePipelineRetryDelayMs` são a
 * lógica pura do worker (sem Supabase/rede) — testados aqui diretamente.
 * A migração é verificada estruturalmente (mesmo padrão de
 * tiss-status-state-machines.test.ts): sem Supabase local não há como rodar
 * `FOR UPDATE SKIP LOCKED` de verdade, então garantimos que o SQL declara as
 * peças que o DoD exige (fila, retry com backoff, dead-letter, RLS restrita
 * a service role).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  decideCapturePipelineJobOutcome,
  computeCapturePipelineRetryDelayMs,
} from "../../../src/lib/capture/infrastructure/capture-pipeline-outcome.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../../..");

describe("decideCapturePipelineJobOutcome", () => {
  it("marca sucesso quando capturePhase não é failed", () => {
    const decision = decideCapturePipelineJobOutcome({
      attempts: 1,
      maxAttempts: 5,
      sessionMetadata: { capturePhase: "ocr_completed" },
    });
    assert.deepEqual(decision, { outcome: "succeeded", error: null });
  });

  it("marca sucesso quando não há capturePhase nenhum (sessão nova)", () => {
    const decision = decideCapturePipelineJobOutcome({
      attempts: 1,
      maxAttempts: 5,
      sessionMetadata: {},
    });
    assert.equal(decision.outcome, "succeeded");
  });

  it("agenda retry quando falha e ainda há tentativas disponíveis", () => {
    const decision = decideCapturePipelineJobOutcome({
      attempts: 2,
      maxAttempts: 5,
      sessionMetadata: {
        capturePhase: "failed",
        ocr: { status: "failed", error: "timeout Azure" },
      },
    });
    assert.equal(decision.outcome, "retry");
    assert.equal(decision.error, "timeout Azure");
  });

  it("vai para dead-letter quando esgota as tentativas", () => {
    const decision = decideCapturePipelineJobOutcome({
      attempts: 5,
      maxAttempts: 5,
      sessionMetadata: {
        capturePhase: "failed",
        ocr: { status: "failed", error: "arquivo corrompido" },
      },
    });
    assert.equal(decision.outcome, "dead_letter");
    assert.equal(decision.error, "arquivo corrompido");
  });

  it("usa mensagem genérica quando falha sem detalhe de erro OCR", () => {
    const decision = decideCapturePipelineJobOutcome({
      attempts: 5,
      maxAttempts: 5,
      sessionMetadata: { capturePhase: "failed" },
    });
    assert.equal(decision.outcome, "dead_letter");
    assert.ok(decision.error && decision.error.length > 0);
  });
});

describe("computeCapturePipelineRetryDelayMs", () => {
  it("cresce exponencialmente a partir de 30s", () => {
    assert.equal(computeCapturePipelineRetryDelayMs(1), 30_000);
    assert.equal(computeCapturePipelineRetryDelayMs(2), 60_000);
    assert.equal(computeCapturePipelineRetryDelayMs(3), 120_000);
  });

  it("satura em 30 minutos", () => {
    assert.equal(computeCapturePipelineRetryDelayMs(20), 30 * 60_000);
  });
});

describe("migração capture_pipeline_jobs — estrutura (DoD F1-S4)", () => {
  const migrationPath = resolve(
    root,
    "supabase/migrations/20260902120000_capture_pipeline_jobs.sql",
  );
  const sql = existsSync(migrationPath) ? readFileSync(migrationPath, "utf8") : "";

  it("existe", () => {
    assert.ok(existsSync(migrationPath), `migração não encontrada em ${migrationPath}`);
  });

  it("declara a tabela da fila com estados de retry e dead-letter", () => {
    assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.capture_pipeline_jobs/);
    assert.match(
      sql,
      /status IN \(\s*'queued',\s*'processing',\s*'succeeded',\s*'failed',\s*'dead_letter'/,
    );
    assert.match(sql, /attempts integer NOT NULL DEFAULT 0/);
    assert.match(sql, /max_attempts integer NOT NULL DEFAULT 5/);
  });

  it("referencia capture_sessions pela chave composta (tenant_id, id) padrão do projeto", () => {
    assert.match(sql, /REFERENCES public\.capture_sessions \(tenant_id, id\)/);
  });

  it("expõe claim_capture_pipeline_job com FOR UPDATE SKIP LOCKED", () => {
    assert.match(sql, /CREATE OR REPLACE FUNCTION public\.claim_capture_pipeline_job/);
    assert.match(sql, /FOR UPDATE SKIP LOCKED/);
    assert.match(
      sql,
      /GRANT EXECUTE ON FUNCTION public\.claim_capture_pipeline_job\(text\) TO service_role/,
    );
  });

  it("reivindica também jobs 'processing' travados (worker morto não perde o job)", () => {
    assert.match(sql, /status = 'processing' AND locked_at < now\(\) - interval '10 minutes'/);
  });

  it("bloqueia UPDATE de clients autenticados — só o service role transiciona estado", () => {
    assert.match(sql, /capture_pipeline_jobs_update_service_only[\s\S]*?USING \(false\)/);
  });

  it("RLS habilitada e insert restrito a quem pode faturar (mesmo grupo do upload)", () => {
    assert.match(sql, /ALTER TABLE public\.capture_pipeline_jobs ENABLE ROW LEVEL SECURITY/);
    assert.match(sql, /capture_pipeline_jobs_insert_billing[\s\S]*?public\.can_manage_billing\(\)/);
  });
});

describe("capture-server.ts — upload enfileira e não roda o pipeline inline", () => {
  const serverPath = resolve(root, "src/lib/capture/api/capture-server.ts");
  const src = readFileSync(serverPath, "utf8");

  it("uploadCaptureFileFn e retryCaptureUploadFn chamam enqueueCapturePipelineJob", () => {
    assert.match(
      src,
      /import \{ enqueueCapturePipelineJob \} from "..\/infrastructure\/capture-pipeline-queue"/,
    );
    assert.match(src, /enqueueCapturePipelineJob\(ctx, data\.sessionId, "full"\)/);
    assert.match(src, /enqueueCapturePipelineJob\(ctx, data\.sessionId, "retry-upload"\)/);
  });

  it("não chama mais runCaptureOperationalPipelineBound diretamente na rota de upload", () => {
    assert.ok(!src.includes("runCaptureOperationalPipelineBound"));
  });
});

describe("worker script — existe e reivindica jobs via RPC", () => {
  const workerPath = resolve(root, "scripts/capture/worker/capture-pipeline-worker.ts");

  it("existe", () => {
    assert.ok(existsSync(workerPath), `worker não encontrado em ${workerPath}`);
  });

  it("reivindica jobs via claim_capture_pipeline_job e nunca deixa um job travado sem desfecho", () => {
    const src = readFileSync(workerPath, "utf8");
    assert.match(src, /\.rpc\("claim_capture_pipeline_job"/);
    assert.match(src, /status: "succeeded"/);
    assert.match(src, /status: "queued"/);
    assert.match(src, /status: "dead_letter"/);
    assert.match(src, /recordOperationalEventSafe/);
    assert.match(src, /severity: "critical"/);
  });
});
