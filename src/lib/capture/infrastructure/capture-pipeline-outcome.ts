/**
 * F1-S4 — lógica pura de decisão do worker da fila (sem I/O).
 *
 * `runCaptureOperationalPipelineBound` nunca lança — cada estágio engole a
 * própria falha e registra `metadata.capturePhase` na sessão. O worker
 * decide sucesso/retry/dead-letter inspecionando esse metadata *depois* de
 * rodar o pipeline. Isolado aqui para ser testável sem Supabase/rede.
 */
import type { JsonObject } from "@/lib/database.types";

export type CapturePipelineJobOutcome = "succeeded" | "retry" | "dead_letter";

export type CapturePipelineJobDecision = {
  outcome: CapturePipelineJobOutcome;
  error: string | null;
};

function extractOcrFailureReason(sessionMetadata: JsonObject): string {
  const ocr = sessionMetadata.ocr;
  if (ocr && typeof ocr === "object" && !Array.isArray(ocr)) {
    const reason = (ocr as JsonObject).error;
    if (typeof reason === "string" && reason.length > 0) return reason;
  }
  return "Falha no pipeline de captura (ver capture_events da sessão).";
}

/**
 * Decide o desfecho de um job já executado, a partir do metadata atual da
 * sessão. `capturePhase === "failed"` é gravado por `ocr-service.ts` no
 * único estágio que de fato propaga exceção (OCR) — estágios seguintes
 * (parser/auditoria/contrato/risco/correção) já degradam graciosamente e
 * não justificam retry/dead-letter da fila.
 */
export function decideCapturePipelineJobOutcome(input: {
  attempts: number;
  maxAttempts: number;
  sessionMetadata: JsonObject;
}): CapturePipelineJobDecision {
  const failed = input.sessionMetadata.capturePhase === "failed";
  if (!failed) {
    return { outcome: "succeeded", error: null };
  }

  const error = extractOcrFailureReason(input.sessionMetadata);
  if (input.attempts >= input.maxAttempts) {
    return { outcome: "dead_letter", error };
  }
  return { outcome: "retry", error };
}

const RETRY_BASE_DELAY_MS = 30_000;
const RETRY_MAX_DELAY_MS = 30 * 60_000;

/** Backoff exponencial (30s, 60s, 120s, ... até 30min) a partir da tentativa já consumida. */
export function computeCapturePipelineRetryDelayMs(attempts: number): number {
  const exponent = Math.max(0, attempts - 1);
  return Math.min(RETRY_BASE_DELAY_MS * 2 ** exponent, RETRY_MAX_DELAY_MS);
}
