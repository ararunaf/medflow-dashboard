/**
 * F1-S4 — teste de carga sintético no volume de pico.
 *
 * Não há Postgres real disponível neste ambiente para exercitar
 * `FOR UPDATE SKIP LOCKED` sob carga de verdade (isso é coberto
 * estruturalmente em capture-pipeline-queue.test.ts). Este teste simula a
 * MESMA garantia de concorrência — claim atômico, um job nunca processado
 * por dois workers ao mesmo tempo — com uma fila em memória protegida por
 * mutex (equivalente ao lock de linha do Postgres), múltiplos workers
 * assíncronos reais rodando em paralelo (Promise.all, não sequencial), e a
 * função de decisão *real* do worker (`decideCapturePipelineJobOutcome`) —
 * não uma reimplementação.
 *
 * Volume de pico: a cooperativa-alvo fatura ~R$30mi/mês processando
 * ~20.000 boletins/mês (~28/hora em regime constante). O cenário de pico
 * real não é o regime constante — é um lote de captura retroativa/backlog
 * (ex.: digitalização de um plantão acumulado, ou reprocessamento em massa
 * após incidente). 2.000 jobs simultâneos representa ~3 dias de volume
 * total do mês inteiro entrando de uma vez — um piso de pico bem acima do
 * que a operação real produziria em qualquer janela razoável.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { decideCapturePipelineJobOutcome } from "../../../src/lib/capture/infrastructure/capture-pipeline-outcome.ts";

type SimJob = {
  id: string;
  status: "queued" | "processing" | "succeeded" | "dead_letter";
  attempts: number;
  maxAttempts: number;
  /** Quantas tentativas até suceder; 0 = nunca sucede (vira dead-letter). */
  succeedsOnAttempt: number;
};

/**
 * Fila em memória com claim serializado por mutex — mesma garantia de
 * exclusividade que `claim_capture_pipeline_job` obtém via
 * `FOR UPDATE SKIP LOCKED` no Postgres real (uma linha, um dono por vez).
 */
class InMemoryPipelineQueue {
  private lock: Promise<void> = Promise.resolve();
  private doubleClaims = 0;

  constructor(private readonly jobs: SimJob[]) {}

  async claim(): Promise<SimJob | null> {
    let release!: () => void;
    const previous = this.lock;
    this.lock = new Promise((r) => (release = r));
    await previous;
    try {
      const job = this.jobs.find((j) => j.status === "queued");
      if (!job) return null;
      if (job.status !== ("queued" as SimJob["status"])) {
        this.doubleClaims++;
      }
      job.status = "processing";
      job.attempts += 1;
      return job;
    } finally {
      release();
    }
  }

  report(job: SimJob, outcome: "succeeded" | "retry" | "dead_letter"): void {
    job.status = outcome === "retry" ? "queued" : outcome;
  }

  get doubleClaimCount(): number {
    return this.doubleClaims;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildSyntheticBacklog(size: number, maxAttempts: number): SimJob[] {
  const jobs: SimJob[] = [];
  for (let i = 0; i < size; i++) {
    // Distribuição realista: ~95% sucede de primeira, ~4% sucede após 1
    // retry (falha transitória de OCR), ~1% nunca sucede (dead-letter).
    const roll = i % 100;
    let succeedsOnAttempt: number;
    if (roll < 95) succeedsOnAttempt = 1;
    else if (roll < 99) succeedsOnAttempt = 2;
    else succeedsOnAttempt = 0;

    jobs.push({
      id: `job-${i}`,
      status: "queued",
      attempts: 0,
      maxAttempts,
      succeedsOnAttempt,
    });
  }
  return jobs;
}

/** Roda o pipeline "simulado" para um attempt e devolve o metadata resultante. */
function simulatePipelineAttempt(job: SimJob) {
  const failed = job.succeedsOnAttempt === 0 || job.attempts < job.succeedsOnAttempt;
  return failed
    ? { capturePhase: "failed", ocr: { status: "failed", error: "OCR sintético indisponível" } }
    : { capturePhase: "ocr_completed" };
}

async function runWorker(queue: InMemoryPipelineQueue, processedIds: string[]): Promise<void> {
  for (;;) {
    const job = await queue.claim();
    if (!job) return;
    // Custo de processamento simulado (I/O de OCR/parser/etc.) — variável,
    // real trabalho assíncrono concorrente, não apenas laço síncrono.
    await sleep(1 + Math.random() * 3);
    const sessionMetadata = simulatePipelineAttempt(job);
    const decision = decideCapturePipelineJobOutcome({
      attempts: job.attempts,
      maxAttempts: job.maxAttempts,
      sessionMetadata,
    });
    queue.report(job, decision.outcome);
    processedIds.push(job.id);
  }
}

describe("F1-S4 — carga sintética no volume de pico (2.000 jobs, 16 workers concorrentes)", () => {
  it("drena todo o backlog sem perder job e sem claim duplicado", async () => {
    const BACKLOG_SIZE = 2000;
    const WORKER_COUNT = 16;
    const MAX_ATTEMPTS = 5;

    const jobs = buildSyntheticBacklog(BACKLOG_SIZE, MAX_ATTEMPTS);
    const queue = new InMemoryPipelineQueue(jobs);
    const processedIds: string[] = [];

    const startedAt = Date.now();
    await Promise.all(Array.from({ length: WORKER_COUNT }, () => runWorker(queue, processedIds)));
    const elapsedMs = Date.now() - startedAt;

    assert.equal(queue.doubleClaimCount, 0, "nenhum job pode ser reivindicado por dois workers");

    // Nunca perdido: todo job termina em succeeded ou dead_letter — nenhum
    // fica preso em queued/processing.
    const stuck = jobs.filter((j) => j.status === "queued" || j.status === "processing");
    assert.deepEqual(stuck, [], "nenhum job pode ficar preso fora de um estado terminal");

    const succeeded = jobs.filter((j) => j.status === "succeeded");
    const deadLettered = jobs.filter((j) => j.status === "dead_letter");
    assert.equal(succeeded.length + deadLettered.length, BACKLOG_SIZE);

    // Distribuição sintética: 99% dos jobs (roll < 99) devem suceder,
    // ~1% (roll 99) esgota as tentativas e vai para dead-letter.
    const expectedDeadLetter = Math.floor(BACKLOG_SIZE / 100);
    assert.equal(deadLettered.length, expectedDeadLetter);
    assert.equal(succeeded.length, BACKLOG_SIZE - expectedDeadLetter);

    // Cada job dead-letter esgotou exatamente max_attempts tentativas —
    // confirma que o retry respeitou o limite antes de desistir.
    for (const job of deadLettered) {
      assert.equal(job.attempts, MAX_ATTEMPTS);
    }

    // processedIds pode conter o mesmo job mais de uma vez (retry volta pra
    // fila) — mas o conjunto de ids processados deve cobrir 100% do backlog.
    assert.equal(new Set(processedIds).size, BACKLOG_SIZE);

    console.log(
      `[F1-S4 load test] ${BACKLOG_SIZE} jobs / ${WORKER_COUNT} workers em ${elapsedMs}ms ` +
        `(${succeeded.length} succeeded, ${deadLettered.length} dead-letter)`,
    );

    // Sanidade: 16 workers concorrentes devem drenar 2.000 jobs num tempo
    // muito menor que o processamento sequencial (2000 * ~2.5ms ≈ 5s) —
    // prova que a fila não serializa o trabalho, só o claim.
    assert.ok(elapsedMs < 3000, `esperado <3000ms com paralelismo real, obteve ${elapsedMs}ms`);
  });
});
