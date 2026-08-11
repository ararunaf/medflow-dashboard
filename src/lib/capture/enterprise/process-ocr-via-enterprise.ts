/**
 * EPC-24E — Capture OCR session → Enterprise Runtime (cutover).
 *
 * Fluxo oficial único:
 *   Produto → resolveCaptureEnterpriseRuntime() [= getEnterpriseRuntime()]
 *     → runCaptureOcr (implementação interna já convergida OCR-01:
 *        OcrOrchestrator → processCaptureOcrViaEnterprise → OCR Runtime → Azure)
 *
 * Não altera o engine OCR. Não cria pipeline paralelo.
 * Server Fns e o binding operacional NÃO importam `ocr-service` para execução —
 * apenas este gateway (e testes do próprio OCR).
 */
import type { ServiceCtx } from "@/lib/services/operations/types";
import {
  getCaptureOcrResult,
  runCaptureOcr,
  type RunCaptureOcrResult,
} from "../ocr/services/ocr-service";
import type { RawOcrResult } from "../ocr/types/raw-ocr-result";
import { resolveCaptureEnterpriseRuntime } from "./resolve-enterprise-runtime";

export type RunCaptureOcrViaEnterpriseResult = RunCaptureOcrResult & {
  viaEnterpriseRuntime: true;
};

export type CaptureOcrViaEnterpriseProbe = {
  runtimeId: string;
  entry: "getEnterpriseRuntime";
  ocrRuntimeOk: boolean;
  captureEngineOk: boolean;
  providerId: string;
};

/**
 * Probe estrutural: Capture alcança OCR Runtime via composition root.
 * Best-effort; nunca lança.
 */
export async function probeCaptureOcrViaEnterprise(): Promise<CaptureOcrViaEnterpriseProbe | null> {
  try {
    const runtime = resolveCaptureEnterpriseRuntime();
    const [ocrHealth, captureEngineHealth] = await Promise.all([
      runtime.getOCRRuntimePort().health(),
      runtime.getCaptureEngineRuntimePort().health(),
    ]);
    return {
      runtimeId: runtime.runtimeId,
      entry: "getEnterpriseRuntime",
      ocrRuntimeOk: ocrHealth.ok,
      captureEngineOk: captureEngineHealth.ok,
      providerId: runtime.getOCRRuntimePort().providerId,
    };
  } catch {
    return null;
  }
}

/**
 * Executa OCR da sessão exclusivamente sob o Enterprise Runtime.
 * A engine `runCaptureOcr` permanece como implementação interna autorizada.
 */
export async function runCaptureOcrViaEnterprise(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<RunCaptureOcrViaEnterpriseResult> {
  void resolveCaptureEnterpriseRuntime();
  void probeCaptureOcrViaEnterprise();

  const result = await runCaptureOcr(ctx, sessionId);
  return {
    ...result,
    viaEnterpriseRuntime: true,
  };
}

/**
 * Leitura do resultado OCR — facade Enterprise (sem reexecução).
 */
export async function getCaptureOcrResultViaEnterprise(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<RawOcrResult | null> {
  void resolveCaptureEnterpriseRuntime();
  return getCaptureOcrResult(ctx, sessionId);
}
