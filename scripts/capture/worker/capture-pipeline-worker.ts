#!/usr/bin/env -S npx tsx
/**
 * F1-S4 — worker real da fila `capture_pipeline_jobs`.
 *
 * Reivindica jobs via `claim_capture_pipeline_job` (SKIP LOCKED, seguro para
 * múltiplos workers concorrentes), roda o pipeline operacional já existente
 * (`runCaptureOperationalPipelineBound` — OCR → Parser → Audit → Contract →
 * Risk → Correction, inalterado) e decide sucesso/retry/dead-letter a partir
 * do `capture_sessions.metadata` resultante (`decideCapturePipelineJobOutcome`).
 *
 * Identidade do ator: reusa o profile que fez o upload original
 * (`capture_pipeline_jobs.created_by`) — não existe usuário "sistema"
 * sintético no projeto; o worker é apenas execução diferida da mesma
 * requisição do usuário, então o audit trail (`actor_profile_id`) deve
 * continuar apontando para ele.
 *
 * Requer SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL (.env.local ou
 * variáveis de ambiente) — RLS de `capture_pipeline_jobs` bloqueia UPDATE
 * para qualquer role que não seja service_role.
 *
 * Uso:
 *   npx tsx scripts/capture/worker/capture-pipeline-worker.ts [--once] [--poll-interval-ms=3000]
 */
import { existsSync, readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
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

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..", "..", "..");

type CapturePipelineJobRow = Database["public"]["Tables"]["capture_pipeline_jobs"]["Row"];
type AdminClient = ReturnType<typeof createClient<Database>>;

function loadEnv(): void {
  const path = join(root, ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

function parseArgs(argv: readonly string[]) {
  const once = argv.includes("--once");
  const pollArg = argv.find((a) => a.startsWith("--poll-interval-ms="));
  const pollIntervalMs = pollArg ? Number(pollArg.split("=")[1]) : 3000;
  return { once, pollIntervalMs: Number.isFinite(pollIntervalMs) ? pollIntervalMs : 3000 };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Reconstrói o ServiceCtx do ator original (mesma lógica de requireOperationalAuth, sem cookies). */
async function buildJobServiceCtx(
  client: AdminClient,
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

async function processJob(client: AdminClient, job: CapturePipelineJobRow): Promise<void> {
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
    console.log(`[capture-pipeline-worker] job ${job.id} (sessão ${job.session_id}): succeeded`);
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
      `[capture-pipeline-worker] job ${job.id} (sessão ${job.session_id}): retry em ${delayMs}ms — ${decision.error}`,
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
    `[capture-pipeline-worker] job ${job.id} (sessão ${job.session_id}): DEAD-LETTER — ${decision.error}`,
  );
}

async function main() {
  loadEnv();
  const url = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error(
      "capture-pipeline-worker: defina VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (.env.local ou ambiente).",
    );
    process.exit(1);
  }

  const { once, pollIntervalMs } = parseArgs(process.argv.slice(2));
  const workerId = `capture-worker-${process.pid}-${randomUUID().slice(0, 8)}`;
  const client = createClient<Database>(url, serviceKey, { auth: { persistSession: false } });

  console.log(
    `[capture-pipeline-worker] iniciado (${workerId}, poll=${pollIntervalMs}ms, once=${once})`,
  );

  for (;;) {
    const { data: jobs, error } = await client.rpc("claim_capture_pipeline_job", {
      p_worker_id: workerId,
    });

    if (error) {
      console.error("[capture-pipeline-worker] falha ao reivindicar job:", error.message);
      if (once) process.exit(1);
      await sleep(pollIntervalMs);
      continue;
    }

    const job = jobs?.[0] as CapturePipelineJobRow | undefined;
    if (!job) {
      if (once) return;
      await sleep(pollIntervalMs);
      continue;
    }

    await processJob(client, job);
    if (once) return;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
