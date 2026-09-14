#!/usr/bin/env -S npx tsx
/**
 * F1-S4 — worker real da fila `capture_pipeline_jobs` (processo persistente).
 *
 * Reivindica jobs via `claim_capture_pipeline_job` (SKIP LOCKED, seguro para
 * múltiplos workers concorrentes) e processa via
 * `claimAndProcessOneCapturePipelineJob` (mesma lógica usada pelo endpoint
 * `/api/capture/process-batch`, ver `src/lib/capture/infrastructure/capture-pipeline-runtime.ts`
 * — F1-S4-DEPLOY: dois invocadores, um só núcleo de execução).
 *
 * Uso operacional: este script é para rodar manualmente/localmente (debug,
 * backlog pontual). Em produção, o pipeline é acionado por
 * `pg_cron` → `/api/capture/process-batch` (sem processo always-on para
 * supervisionar) — ver `supabase/migrations/*_capture_pipeline_worker_cron.sql`.
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
import type { Database } from "@/lib/database.types";
import { claimAndProcessOneCapturePipelineJob } from "@/lib/capture/infrastructure/capture-pipeline-runtime";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..", "..", "..");

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

async function pollOnce(client: AdminClient, workerId: string): Promise<boolean> {
  try {
    return await claimAndProcessOneCapturePipelineJob(client, workerId);
  } catch (err) {
    console.error(
      "[capture-pipeline-worker] falha ao reivindicar/processar job:",
      err instanceof Error ? err.message : String(err),
    );
    return false;
  }
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
    const claimed = await pollOnce(client, workerId);
    if (!claimed) {
      if (once) return;
      await sleep(pollIntervalMs);
      continue;
    }
    if (once) return;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
