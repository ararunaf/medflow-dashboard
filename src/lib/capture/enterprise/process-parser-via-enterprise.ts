/**
 * EPC-24B — Capture Parser → Document Extraction Runtime (convergência).
 *
 * Fluxo oficial:
 *   Produto → resolveCaptureEnterpriseRuntime() [= getEnterpriseRuntime()]
 *     → DocumentExtractionRuntimePort (coordenação estrutural F3-CAP-07)
 *     → fallback legado `runCaptureParser` (comportamento funcional idêntico)
 *
 * Sem cutover. Sem alteração de regra de negócio. Sem UI/OCR/Audit/Contract/
 * Risk/Correction/XML/banco/APIs. Foundations 4–7 preservadas.
 *
 * O Parser legado permanece exclusivamente como fallback atrás deste gateway.
 * Nenhum módulo de produto deve importar `tiss-parser-service` diretamente
 * para execução — apenas este módulo (e testes do próprio parser).
 */
import type { ServiceCtx } from "@/lib/services/operations/types";
import {
  getCaptureStructuredGuide,
  runCaptureParser,
  type RunCaptureParserResult,
} from "../parser/services/tiss-parser-service";
import type { StructuredGuide } from "../parser/types/structured-guide";
import { resolveCaptureEnterpriseRuntime } from "./resolve-enterprise-runtime";

export type RunCaptureParserViaEnterpriseResult = RunCaptureParserResult & {
  viaEnterpriseRuntime: true;
  extractionJobId: string | null;
  extractionFallback: "legacy-tiss-parser";
};

export type CaptureParserViaEnterpriseProbe = {
  runtimeId: string;
  entry: "getEnterpriseRuntime";
  extractionRuntimeOk: boolean;
  providerId: string;
};

/**
 * Probe estrutural: Capture alcança DocumentExtractionRuntimePort via Runtime.
 * Best-effort; nunca lança.
 */
export async function probeCaptureParserViaEnterprise(): Promise<CaptureParserViaEnterpriseProbe | null> {
  try {
    const runtime = resolveCaptureEnterpriseRuntime();
    const port = runtime.getDocumentExtractionRuntimePort();
    const health = await port.health();
    return {
      runtimeId: runtime.runtimeId,
      entry: "getEnterpriseRuntime",
      extractionRuntimeOk: health.ok,
      providerId: port.providerId,
    };
  } catch {
    return null;
  }
}

/**
 * Coordena extração via DocumentExtractionRuntimePort e executa o Parser
 * legado como fallback funcional (mesma saída observável).
 *
 * Se a coordenação estrutural falhar, o legado ainda executa (Strangler Fig /
 * dual-path reduzido — AER-GA03-A1 ainda não eliminado).
 */
export async function runCaptureParserViaEnterprise(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<RunCaptureParserViaEnterpriseResult> {
  const runtime = resolveCaptureEnterpriseRuntime();
  const extraction = runtime.getDocumentExtractionRuntimePort();

  let extractionJobId: string | null = null;

  try {
    const opened = await extraction.openJob({
      correlationId: sessionId,
      requestId: `capture-extraction-job-${sessionId}`,
      attributes: {
        source: "epc-24b-capture-parser",
        sessionId,
        stage: "extraction",
      },
    });
    extractionJobId = opened.job?.jobId ?? opened.result?.job?.jobId ?? null;

    if (extractionJobId) {
      await extraction.registerDocument({
        jobId: extractionJobId,
        documentId: sessionId,
        requestId: `capture-extraction-doc-${sessionId}`,
        attributes: { sessionId, source: "epc-24b-capture-parser" },
      });
      await extraction.submitRequest({
        jobId: extractionJobId,
        documentId: sessionId,
        requestId: `capture-extraction-req-${sessionId}`,
        attributes: { sessionId, source: "epc-24b-capture-parser" },
      });
    }
  } catch {
    /* coordenação estrutural best-effort — fallback legado permanece */
  }

  try {
    // Fallback oficial: engine TISS Parser produto (comportamento inalterado).
    const legacy = await runCaptureParser(ctx, sessionId);
    return {
      ...legacy,
      viaEnterpriseRuntime: true,
      extractionJobId,
      extractionFallback: "legacy-tiss-parser",
    };
  } finally {
    if (extractionJobId) {
      try {
        await extraction.closeJob({
          jobId: extractionJobId,
          requestId: `capture-extraction-close-${sessionId}`,
        });
      } catch {
        /* close estrutural best-effort */
      }
    }
  }
}

/**
 * Leitura do guia estruturado — facade Enterprise (sem reexecução do parser).
 * Mantém o mesmo contrato de `getCaptureStructuredGuide`.
 */
export async function getCaptureStructuredGuideViaEnterprise(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<StructuredGuide | null> {
  void resolveCaptureEnterpriseRuntime();
  return getCaptureStructuredGuide(ctx, sessionId);
}
