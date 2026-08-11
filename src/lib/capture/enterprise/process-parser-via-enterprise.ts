/**
 * EPC-24B / EPC-24E — Capture Parser → Document Extraction Runtime.
 *
 * Fluxo oficial único (cutover EPC-24E):
 *   Produto → resolveCaptureEnterpriseRuntime() [= getEnterpriseRuntime()]
 *     → DocumentExtractionRuntimePort (coordenação estrutural F3-CAP-07)
 *     → runCaptureParser (implementação interna autorizada do Port)
 *
 * Sem Dual Path. Sem flag de fallback. Sem alteração de regra de negócio.
 * Sem UI/OCR/Audit/Contract/Risk/Correction/XML/banco/APIs.
 * Foundations 4–7 preservadas.
 *
 * O Parser legado permanece exclusivamente como implementação interna
 * atrás deste gateway — nunca como pipeline paralelo.
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
 * como implementação interna autorizada (mesma saída observável).
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
        source: "epc-24e-capture-parser",
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
        attributes: { sessionId, source: "epc-24e-capture-parser" },
      });
      await extraction.submitRequest({
        jobId: extractionJobId,
        documentId: sessionId,
        requestId: `capture-extraction-req-${sessionId}`,
        attributes: { sessionId, source: "epc-24e-capture-parser" },
      });
    }
  } catch {
    /* coordenação estrutural do Port — implementação interna segue no pipeline único */
  }

  try {
    const internal = await runCaptureParser(ctx, sessionId);
    return {
      ...internal,
      viaEnterpriseRuntime: true,
      extractionJobId,
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
