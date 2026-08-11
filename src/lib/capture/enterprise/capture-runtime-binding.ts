/**
 * EPC-24A / EPC-24B / EPC-24C / EPC-24D — Enterprise Runtime Convergence Binding
 *
 * Liga o pipeline operacional de Captura ao Enterprise Runtime sem cutover.
 *
 * EPC-24B:
 *   - Intake canônico awaited via Runtime
 *   - Parser/Extraction via DocumentExtractionRuntime (+ fallback legado)
 *
 * EPC-24C:
 *   - Audit via AuditRuntimePort (+ fallback legado)
 *   - Contract via RulePackEnginePort (+ fallback legado)
 *   - Risk via QualityRuntimePort (+ fallback legado)
 *   - Correction via AutoFillRuntimePort (+ fallback legado)
 *
 * EPC-24D:
 *   - Review via ValidationRuntimePort (+ fallback legado)
 *   - TISS/XML via XMLGenerationRuntimePort / XMLTISSRuntimePort (+ fallback legado)
 *   - Bloco C via Workflow/Batch/Protocol Ports (+ fallback services TISS)
 *
 * PRESERVAR: comportamento funcional idêntico (OCR→…→correção; Review/XML).
 * REMOVER (futuro EPC-24E): dual-path AER-GA03-A1 após paridade certificada.
 *
 * Fluxo oficial deste binding:
 *   Capture (upload/retry)
 *     → resolveCaptureEnterpriseRuntime()  [= getEnterpriseRuntime()]
 *     → Document Intake (EPC-24B)
 *     → CanonicalExecutionOrchestratorPort (coordenação estrutural)
 *     → OCR (inalterado) → Parser via Extraction → Audit → Contract → Risk → Correction
 *
 * Review / TISS/XML / Bloco C são coordenados via Runtime nos respectivos
 * Server Fns (review-server / tiss-server) — fora do bound OCR→Correction.
 *
 * Dual-path AER-GA03-A1 permanece parcialmente (reduzido; cutover = EPC-24E).
 */
import type { ServiceCtx } from "@/lib/services/operations/types";
import { runCaptureOcr } from "../ocr/services/ocr-service";
import { resolveCaptureEnterpriseRuntime } from "./resolve-enterprise-runtime";
import {
  registerCaptureDocumentIntakeBridge,
  type CaptureEnterpriseBridgeInput,
} from "./register-capture-intake";
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
};

export type RunCaptureOperationalPipelineBoundOptions = {
  /** Quando presente, Intake Enterprise é awaited no início do bound pipeline. */
  intake?: CaptureEnterpriseBridgeInput;
};

/**
 * Probe estrutural do binding: prova que Capture entra pelo composition root
 * e alcança Orchestrator + Capture Engine + Intake + Extraction + Decision +
 * Review/XML/Bloco C Ports.
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
    };
  } catch {
    return null;
  }
}

/**
 * Executa a cadeia operacional de Captura sob o binding Enterprise Runtime.
 *
 * Comportamento observável idêntico à orquestração imperativa anterior
 * (mesmos estágios, mesmos catches aninhados, mesmas mensagens de falha engolida).
 *
 * EPC-24C/D: Decision + Review/XML/Bloco C coordenados via Runtime Ports
 * (Review/XML nos Server Fns dedicados). Não fecha AER-GA03-A1.
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
  // Coordenação estrutural (Orchestrator / Capture Engine / Intake / Extraction / Decision / Review-XML-BlocoC).
  void probeCaptureEnterpriseRuntimeBinding();

  // EPC-24B — Intake canônico via Runtime (awaited; best-effort; sem alterar upload).
  if (options?.intake) {
    await registerCaptureDocumentIntakeBridge(options.intake);
  }

  if (mode === "retry-upload") {
    try {
      await runCaptureOcr(ctx, sessionId);
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
    await runCaptureOcr(ctx, sessionId);
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
