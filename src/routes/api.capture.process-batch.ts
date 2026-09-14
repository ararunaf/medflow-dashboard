/**
 * F1-S4-DEPLOY — invocação curta e sem estado do worker da fila de captura.
 *
 * Substitui a dependência de um processo always-on: em vez de um script que
 * fica rodando para sempre (`scripts/capture/worker/capture-pipeline-worker.ts`,
 * mantido para uso manual/local), este endpoint drena a fila por um
 * orçamento de tempo curto e é acionado por `pg_cron` a cada minuto (ver
 * `supabase/migrations/*_capture_pipeline_worker_cron.sql`). Cada invocação
 * roda `BATCH_CONCURRENCY` lanes concorrentes (mesma garantia SKIP LOCKED
 * das N réplicas do worker persistente), então uma única chamada já dá
 * paralelismo — não só um job por minuto.
 *
 * Autenticação: não é uma server function de usuário (sem sessão/cookie) —
 * é um job de sistema, autenticado por segredo compartilhado
 * (`CAPTURE_PIPELINE_WORKER_SECRET`) no header `x-capture-worker-secret`.
 */
import { createFileRoute } from "@tanstack/react-router";
import { getAdminSupabase } from "@/lib/server/supabase-admin";
import { runCapturePipelineBatch } from "@/lib/capture/infrastructure/capture-pipeline-runtime";

const BATCH_TIME_BUDGET_MS = 8_000;
const BATCH_CONCURRENCY = 6;

function resolveWorkerSecret(): string | null {
  const secret = process.env.CAPTURE_PIPELINE_WORKER_SECRET;
  return typeof secret === "string" && secret.length > 0 ? secret : null;
}

async function handleProcessBatch({ request }: { request: Request }): Promise<Response> {
  const expectedSecret = resolveWorkerSecret();
  if (!expectedSecret) {
    return Response.json(
      { ok: false, error: "CAPTURE_PIPELINE_WORKER_SECRET não configurado no ambiente." },
      { status: 500 },
    );
  }

  const providedSecret = request.headers.get("x-capture-worker-secret");
  if (providedSecret !== expectedSecret) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const client = getAdminSupabase();
  if (!client) {
    return Response.json(
      { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY não configurada no ambiente." },
      { status: 500 },
    );
  }

  const startedAt = Date.now();
  const { processed } = await runCapturePipelineBatch(client, {
    budgetMs: BATCH_TIME_BUDGET_MS,
    concurrency: BATCH_CONCURRENCY,
    workerIdPrefix: "capture-batch",
  });

  return Response.json({ ok: true, processed, tookMs: Date.now() - startedAt });
}

export const Route = createFileRoute("/api/capture/process-batch")({
  server: {
    handlers: {
      POST: handleProcessBatch,
    },
  },
});
