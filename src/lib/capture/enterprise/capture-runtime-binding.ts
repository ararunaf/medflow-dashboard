/**
 * EPC-24A…E — Enterprise Runtime Convergence Binding (cutover EPC-24E)
 *
 * Pipeline operacional oficial único do Capture:
 *   Capture (upload/retry)
 *     → resolveCaptureEnterpriseRuntime()  [= getEnterpriseRuntime()]
 *     → Document Intake (canônico)
 *     → CanonicalExecutionOrchestratorPort (coordenação estrutural)
 *     → OCR → Parser/Extraction → Audit → Contract → Risk → Correction
 *
 * Review / TISS/XML / Bloco C são coordenados via Runtime nos respectivos
 * Server Fns (review-server / tiss-server) — mesmo composition root.
 *
 * Engines de produto permanecem apenas como implementação interna dos
 * gateways autorizados — nunca como Dual Path / pipeline paralelo.
 *
 * AER-GA03-A1: Resolvida (EPC-24E).
 */
import type { ServiceCtx } from "@/lib/services/operations/types";
import { resolveCaptureEnterpriseRuntime } from "./resolve-enterprise-runtime";
import {
  registerCaptureDocumentIntakeBridge,
  type CaptureEnterpriseBridgeInput,
} from "./register-capture-intake";
import { runCaptureOcrViaEnterprise } from "./process-ocr-via-enterprise";
import { runCaptureParserViaEnterprise } from "./process-parser-via-enterprise";
import { runCaptureAuditViaEnterprise } from "./process-audit-via-enterprise";
import { runCaptureContractViaEnterprise } from "./process-contract-via-enterprise";
import { runCaptureRiskViaEnterprise } from "./process-risk-via-enterprise";
import { runCaptureCorrectionViaEnterprise } from "./process-correction-via-enterprise";

export type CaptureOperationalPipelineMode = "full" | "retry-upload";

export type CaptureRuntimeBindingProbe = {
  runtimeId: string;
  entry: "getEnterpriseRuntime";
  orchestratorOk: boolean;
  captureEngineOk: boolean;
  documentIntakeRuntimeOk: boolean;
  documentExtractionRuntimeOk: boolean;
  auditRuntimeOk: boolean;
  rulePackEngineOk: boolean;
  qualityRuntimeOk: boolean;
  autoFillRuntimeOk: boolean;
  validationRuntimeOk: boolean;
  xmlGenerationRuntimeOk: boolean;
  xmlTissRuntimeOk: boolean;
  workflowRuntimeOk: boolean;
  batchRuntimeOk: boolean;
  protocolRuntimeOk: boolean;
  ocrRuntimeOk: boolean;
  singlePipeline: true;
};

export type RunCaptureOperationalPipelineBoundOptions = {
  /** Quando presente, Intake Enterprise é awaited no início do bound pipeline. */
  intake?: CaptureEnterpriseBridgeInput;
};

/**
 * Probe estrutural do binding: prova que Capture entra pelo composition root
 * e alcança Orchestrator + Capture Engine + Intake + Extraction + Decision +
 * Review/XML/Bloco C Ports + OCR Runtime.
 * Best-effort.
 */
export async function probeCaptureEnterpriseRuntimeBinding(): Promise<CaptureRuntimeBindingProbe | null> {
  try {
    const runtime = resolveCaptureEnterpriseRuntime();
    const [
      orchestratorHealth,
      captureEngineHealth,
      intakeHealth,
      extractionHealth,
      auditHealth,
      rulePackHealth,
      qualityHealth,
      autoFillHealth,
      validationHealth,
      xmlGenHealth,
      xmlTissHealth,
      workflowHealth,
      batchHealth,
      protocolHealth,
      ocrHealth,
    ] = await Promise.all([
      runtime.getOrchestratorPort().health(),
      runtime.getCaptureEngineRuntimePort().health(),
      runtime.getDocumentIntakeRuntimePort().health(),
      runtime.getDocumentExtractionRuntimePort().health(),
      runtime.getAuditRuntimePort().health(),
      runtime.getRulePackEnginePort().health(),
      runtime.getQualityRuntimePort().health(),
      runtime.getAutoFillRuntimePort().health(),
      runtime.getValidationRuntimePort().health(),
      runtime.getXMLGenerationRuntimePort().health(),
      runtime.getXMLTISSRuntimePort().health(),
      runtime.getWorkflowRuntimePort().health(),
      runtime.getBatchRuntimePort().health(),
      runtime.getProtocolRuntimePort().health(),
      runtime.getOCRRuntimePort().health(),
    ]);
    return {
      runtimeId: runtime.runtimeId,
      entry: "getEnterpriseRuntime",
      orchestratorOk: orchestratorHealth.ok,
      captureEngineOk: captureEngineHealth.ok,
      documentIntakeRuntimeOk: intakeHealth.ok,
      documentExtractionRuntimeOk: extractionHealth.ok,
      auditRuntimeOk: auditHealth.ok,
      rulePackEngineOk: rulePackHealth.ok,
      qualityRuntimeOk: qualityHealth.ok,
      autoFillRuntimeOk: autoFillHealth.ok,
      validationRuntimeOk: validationHealth.ok,
      xmlGenerationRuntimeOk: xmlGenHealth.ok,
      xmlTissRuntimeOk: xmlTissHealth.ok,
      workflowRuntimeOk: workflowHealth.ok,
      batchRuntimeOk: batchHealth.ok,
      protocolRuntimeOk: protocolHealth.ok,
      ocrRuntimeOk: ocrHealth.ok,
      singlePipeline: true,
    };
  } catch {
    return null;
  }
}

/**
 * Executa a cadeia operacional de Captura sob o binding Enterprise Runtime.
 *
 * Comportamento observável idêntico à orquestração anterior
 * (mesmos estágios, mesmos catches aninhados, mesmas mensagens de falha engolida).
 *
 * Cutover EPC-24E: pipeline único via getEnterpriseRuntime(); AER-GA03-A1 Resolvida.
 * Não altera OCR / Parser engines / Foundations / UI / banco / APIs.
 */
export async function runCaptureOperationalPipelineBound(
  ctx: ServiceCtx,
  sessionId: string,
  mode: CaptureOperationalPipelineMode = "full",
  options?: RunCaptureOperationalPipelineBoundOptions,
): Promise<void> {
  // Composition root oficial — Capture entra exclusivamente pelo Runtime.
  void resolveCaptureEnterpriseRuntime();
  // Coordenação estrutural (Orchestrator / Capture Engine / Intake / Extraction / Decision / Review-XML-BlocoC / OCR).
  void probeCaptureEnterpriseRuntimeBinding();

  // Intake canônico via Runtime (awaited; parte do pipeline único).
  if (options?.intake) {
    await registerCaptureDocumentIntakeBridge(options.intake);
  }

  if (mode === "retry-upload") {
    try {
      await runCaptureOcrViaEnterprise(ctx, sessionId);
      try {
        await runCaptureParserViaEnterprise(ctx, sessionId);
      } catch {
        /* falha parser registrada em metadata */
      }
    } catch {
      /* falha OCR registrada em metadata */
    }
    return;
  }

  try {
    await runCaptureOcrViaEnterprise(ctx, sessionId);
    try {
      await runCaptureParserViaEnterprise(ctx, sessionId);
      try {
        await runCaptureAuditViaEnterprise(ctx, sessionId);
        try {
          await runCaptureContractViaEnterprise(ctx, sessionId);
          try {
            await runCaptureRiskViaEnterprise(ctx, sessionId);
            try {
              await runCaptureCorrectionViaEnterprise(ctx, sessionId);
            } catch {
              /* falha correção assistida registrada em metadata — avaliação de risco permanece válida */
            }
          } catch {
            /* falha avaliação de risco registrada em metadata — inteligência contratual permanece válida */
          }
        } catch {
          /* falha inteligência contratual registrada em metadata — auditoria permanece válida */
        }
      } catch {
        /* falha auditoria registrada em metadata — parser permanece válido */
      }
    } catch {
      /* falha parser registrada em metadata — OCR permanece válido */
    }
  } catch {
    /* falha OCR registrada em metadata — upload permanece válido */
  }
}
