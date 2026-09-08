/**
 * EPC-24E — Capture OCR session → Enterprise Runtime (cutover).
 *
 * Fluxo oficial único:
 *   Produto → resolveCaptureEnterpriseRuntime() [= getEnterpriseRuntime()]
 *     → getOCRRuntimePort().health() (gate real — falha aqui bloqueia a execução)
 *     → runCaptureOcr (implementação interna: OcrOrchestrator → Azure)
 *
 * Nota honesta de arquitetura: a extração real (bytes → texto) roda hoje em
 * `OcrOrchestrator`/`AzureDocumentIntelligenceProvider`, NÃO em
 * `getOCRRuntimePort().process()` — esse método canônico do Port existe mas
 * não tem caller em produção (só em teste). Por isso `viaEnterpriseRuntime`
 * não significa "execução roteada pelo Port": significa "o composition root
 * foi resolvido e verificado saudável antes de autorizar a execução". Se o
 * Port reportar não-saudável, a execução é bloqueada — não apenas logada.
 *
 * Não altera o engine OCR. Não cria pipeline paralelo.
 * Server Fns e o binding operacional NÃO importam `ocr-service` para execução —
 * apenas este gateway (e testes do próprio OCR).
 */
import { DomainError } from "@/lib/domain/operations/errors";
import type { ServiceCtx } from "@/lib/services/operations/types";
import {
  getCaptureOcrResult,
  runCaptureOcr,
  type RunCaptureOcrResult,
} from "../ocr/services/ocr-service";
import type { RawOcrResult } from "../ocr/types/raw-ocr-result";
import { resolveCaptureEnterpriseRuntime } from "./resolve-enterprise-runtime";

export class CaptureOcrEnterpriseRuntimeUnavailableError extends DomainError {
  constructor(probe: CaptureOcrViaEnterpriseProbe | null) {
    super(
      "internal_error",
      "Enterprise Runtime indisponível para OCR — composition root não respondeu saudável.",
      {
        ocrRuntimeOk: probe?.ocrRuntimeOk ?? false,
        captureEngineOk: probe?.captureEngineOk ?? false,
      },
    );
    this.name = "CaptureOcrEnterpriseRuntimeUnavailableError";
  }
}

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
 * Executa OCR da sessão sob o Enterprise Runtime.
 * A engine `runCaptureOcr` permanece como implementação interna autorizada.
 *
 * O probe de saúde é aguardado e é um gate real: se o composition root
 * (OCR Runtime Port + Capture Engine Port) não responder saudável, a
 * execução é bloqueada com `CaptureOcrEnterpriseRuntimeUnavailableError`
 * em vez de prosseguir silenciosamente.
 */
export async function runCaptureOcrViaEnterprise(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<RunCaptureOcrViaEnterpriseResult> {
  const probe = await probeCaptureOcrViaEnterprise();
  if (!probe || !probe.ocrRuntimeOk || !probe.captureEngineOk) {
    throw new CaptureOcrEnterpriseRuntimeUnavailableError(probe);
  }

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
