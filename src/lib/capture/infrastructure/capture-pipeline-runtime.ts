/**
 * F1-S4-DEPLOY — núcleo de execução do worker da fila `capture_pipeline_jobs`
 * (claim via `claim_capture_pipeline_job`, roda o pipeline, decide o
 * desfecho), extraído para ser reusado por dois invocadores diferentes:
 *
 *   - `scripts/capture/worker/capture-pipeline-worker.ts` — processo
 *     persistente (loop infinito), para quem roda o worker manualmente.
 *   - `src/routes/api.capture.process-batch.ts` — invocação curta e sem
 *     estado (N lanes concorrentes até um orçamento de tempo), disparada
 *     por `pg_cron` — para não depender de um processo always-on.
 *
 * Nenhuma mudança de comportamento: mesmo claim (SKIP LOCKED), mesmo
 * pipeline (`runCaptureOperationalPipelineBound`), mesma decisão
 * (`decideCapturePipelineJobOutcome`), mesmo dead-letter alertado.
 */
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, JsonObject } from "@/lib/database.types";
import type { ServiceCtx } from "@/lib/services/operations/types";
import type { CaptureOperationalPipelineMode } from "@/lib/capture/enterprise/capture-runtime-binding";
import { runCaptureOperationalPipelineBound } from "@/lib/capture/enterprise/capture-runtime-binding";
import { registerCaptureDocumentIntakeBridge } from "@/lib/capture/enterprise/register-capture-intake";
import { getCaptureSession } from "@/lib/capture/infrastructure/capture-session-store";
import {
  decideCapturePipelineJobOutcome,
  computeCapturePipelineRetryDelayMs,
} from "@/lib/capture/infrastructure/capture-pipeline-outcome";
import { recordOperationalEventSafe } from "@/lib/services/operations/operational-event-service";

export type CapturePipelineJobRow = Database["public"]["Tables"]["capture_pipeline_jobs"]["Row"];
export type CapturePipelineAdminClient = SupabaseClient<Database>;

/** Reconstrói o ServiceCtx do ator original (mesma lógica de requireOperationalAuth, sem cookies). */
async function buildJobServiceCtx(
  client: CapturePipelineAdminClient,
  job: CapturePipelineJobRow,
): Promise<ServiceCtx> {
  const { data: profile, error: profileErr } = await client
    .from("profiles")
    .select("*")
    .eq("id", job.created_by)
    .maybeSingle();
  if (profileErr) throw new Error(`Falha ao carregar profile do ator: ${profileErr.message}`);
  if (!profile) throw new Error(`Profile do ator (${job.created_by}) não encontrado.`);

  let professionalId: string | null = null;
  if (profile.role === "professional") {
    const { data: pro, error: proErr } = await client
      .from("professionals")
      .select("id")
      .eq("profile_id", job.created_by)
      .eq("tenant_id", job.tenant_id)
      .maybeSingle();
    if (proErr) throw new Error(`Falha ao carregar professional do ator: ${proErr.message}`);
    professionalId = pro?.id ?? null;
  }

  return {
    client,
    tenantId: job.tenant_id,
    role: profile.role,
    userId: profile.id,
    actorProfileId: profile.id,
    professionalId,
  };
}

/** Processa um job já reivindicado: roda o pipeline e grava sucesso/retry/dead-letter. */
export async function processCapturePipelineJob(
  client: CapturePipelineAdminClient,
  job: CapturePipelineJobRow,
): Promise<void> {
  let decision: { outcome: "succeeded" | "retry" | "dead_letter"; error: string | null };
  let ctx: ServiceCtx | null = null;

  try {
    ctx = await buildJobServiceCtx(client, job);

    const detail = await getCaptureSession(ctx, job.session_id);
    const document = detail.documents[detail.documents.length - 1];
    if (document) {
      // Intake canônico (best-effort, nunca lança) — mesma posição que tinha
      // no pipeline síncrono, agora rodando dentro do worker.
      await registerCaptureDocumentIntakeBridge({
        session: detail,
        document,
        tenantId: ctx.tenantId,
      });
    }

    await runCaptureOperationalPipelineBound(
      ctx,
      job.session_id,
      job.mode as CaptureOperationalPipelineMode,
    );

    const after = await getCaptureSession(ctx, job.session_id);
    decision = decideCapturePipelineJobOutcome({
      attempts: job.attempts,
      maxAttempts: job.max_attempts,
      sessionMetadata: after.metadata as JsonObject,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    decision = {
      outcome: job.attempts >= job.max_attempts ? "dead_letter" : "retry",
      error: message,
    };
  }

  if (decision.outcome === "succeeded") {
    await client
      .from("capture_pipeline_jobs")
      .update({ status: "succeeded", locked_by: null, last_error: null })
      .eq("id", job.id);
    console.log(`[capture-pipeline] job ${job.id} (sessão ${job.session_id}): succeeded`);
    return;
  }

  if (decision.outcome === "retry") {
    const delayMs = computeCapturePipelineRetryDelayMs(job.attempts);
    await client
      .from("capture_pipeline_jobs")
      .update({
        status: "queued",
        locked_by: null,
        run_at: new Date(Date.now() + delayMs).toISOString(),
        last_error: decision.error,
      })
      .eq("id", job.id);
    console.warn(
      `[capture-pipeline] job ${job.id} (sessão ${job.session_id}): retry em ${delayMs}ms — ${decision.error}`,
    );
    return;
  }

  // dead_letter — nunca perdido: fica marcado + alerta crítico em operational_events.
  await client
    .from("capture_pipeline_jobs")
    .update({ status: "dead_letter", locked_by: null, last_error: decision.error })
    .eq("id", job.id);

  await recordOperationalEventSafe(
    ctx ?? {
      client,
      tenantId: job.tenant_id,
      role: "tenant_admin",
      userId: job.created_by,
      actorProfileId: job.created_by,
      professionalId: null,
    },
    {
      entity_type: "alert",
      entity_id: job.id,
      event_type: "critical_alert_generated",
      severity: "critical",
      description: `Job do pipeline de captura foi para dead-letter após ${job.attempts} tentativa(s) (sessão ${job.session_id}).`,
      metadata: {
        source: "capture_pipeline_worker",
        jobId: job.id,
        sessionId: job.session_id,
        attempts: job.attempts,
        maxAttempts: job.max_attempts,
        lastError: decision.error,
      },
    },
  );
  console.error(
    `[capture-pipeline] job ${job.id} (sessão ${job.session_id}): DEAD-LETTER — ${decision.error}`,
  );
}

/** Reivindica (SKIP LOCKED) e processa no máximo um job. `false` = fila vazia no momento. */
export async function claimAndProcessOneCapturePipelineJob(
  client: CapturePipelineAdminClient,
  workerId: string,
): Promise<boolean> {
  const { data: jobs, error } = await client.rpc("claim_capture_pipeline_job", {
    p_worker_id: workerId,
  });
  if (error) throw new Error(`Falha ao reivindicar job: ${error.message}`);

  const job = jobs?.[0] as CapturePipelineJobRow | undefined;
  if (!job) return false;

  await processCapturePipelineJob(client, job);
  return true;
}

export type CapturePipelineBatchResult = {
  processed: number;
};

/**
 * Drena a fila por até `budgetMs`, com até `concurrency` "lanes" concorrentes
 * — cada lane é `claim → process → claim`, igual a um worker persistente,
 * só que de vida curta. `SKIP LOCKED` garante que lanes concorrentes (e
 * invocações concorrentes desta função) nunca processam o mesmo job.
 */
export async function runCapturePipelineBatch(
  client: CapturePipelineAdminClient,
  options: { budgetMs: number; concurrency: number; workerIdPrefix: string },
): Promise<CapturePipelineBatchResult> {
  const deadline = Date.now() + options.budgetMs;
  let processed = 0;

  async function lane(laneIndex: number): Promise<void> {
    const workerId = `${options.workerIdPrefix}-${laneIndex}-${randomUUID().slice(0, 8)}`;
    while (Date.now() < deadline) {
      const claimed = await claimAndProcessOneCapturePipelineJob(client, workerId);
      if (!claimed) return;
      processed++;
    }
  }

  await Promise.all(Array.from({ length: Math.max(1, options.concurrency) }, (_, i) => lane(i)));

  return { processed };
}
