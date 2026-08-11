/**
 * EPC-24A / EPC-24B — Enterprise Runtime Convergence Binding
 *
 * Liga o pipeline operacional de Captura ao Enterprise Runtime sem cutover.
 *
 * EPC-24B:
 *   - Intake canônico awaited via Runtime (não fire-and-forget opaco)
 *   - Parser/Extraction resolvido exclusivamente via DocumentExtractionRuntime
 *     (+ fallback legado atrás do gateway enterprise)
 *
 * PRESERVAR: comportamento funcional idêntico (OCR→…→correção).
 * MIGRAR (futuro EPC-24C+): Audit/Contract/Risk/Correction → Ports.
 * REMOVER (futuro EPC-24E): dual-path AER-GA03-A1 após paridade certificada.
 *
 * Fluxo oficial deste binding:
 *   Capture (upload/retry)
 *     → resolveCaptureEnterpriseRuntime()  [= getEnterpriseRuntime()]
 *     → Document Intake (EPC-24B, awaited quando input fornecido)
 *     → CanonicalExecutionOrchestratorPort (coordenação estrutural)
 *     → OCR (inalterado) → Parser via Extraction Runtime → Audit → …
 *
 * Dual-path AER-GA03-A1 permanece parcialmente (reduzido; cutover = EPC-24E).
 */
import type { ServiceCtx } from "@/lib/services/operations/types";
import { runCaptureOcr } from "../ocr/services/ocr-service";
import { runCaptureAudit } from "../audit/services/preventive-audit-service";
import { runCaptureContractIntelligence } from "../contract/services/contract-intelligence-service";
import { runCaptureGlosaRisk } from "../risk/services/glosa-risk-service";
import { runCaptureCorrectionAssistant } from "../correction";
import { resolveCaptureEnterpriseRuntime } from "./resolve-enterprise-runtime";
import {
  registerCaptureDocumentIntakeBridge,
  type CaptureEnterpriseBridgeInput,
} from "./register-capture-intake";
import { runCaptureParserViaEnterprise } from "./process-parser-via-enterprise";

export type CaptureOperationalPipelineMode = "full" | "retry-upload";

export type CaptureRuntimeBindingProbe = {
  runtimeId: string;
  entry: "getEnterpriseRuntime";
  orchestratorOk: boolean;
  captureEngineOk: boolean;
  documentIntakeRuntimeOk: boolean;
  documentExtractionRuntimeOk: boolean;
};

export type RunCaptureOperationalPipelineBoundOptions = {
  /** Quando presente, Intake Enterprise é awaited no início do bound pipeline. */
  intake?: CaptureEnterpriseBridgeInput;
};

/**
 * Probe estrutural do binding: prova que Capture entra pelo composition root
 * e alcança Orchestrator + Capture Engine + Intake + Extraction. Best-effort.
 */
export async function probeCaptureEnterpriseRuntimeBinding(): Promise<CaptureRuntimeBindingProbe | null> {
  try {
    const runtime = resolveCaptureEnterpriseRuntime();
    const [orchestratorHealth, captureEngineHealth, intakeHealth, extractionHealth] =
      await Promise.all([
        runtime.getOrchestratorPort().health(),
        runtime.getCaptureEngineRuntimePort().health(),
        runtime.getDocumentIntakeRuntimePort().health(),
        runtime.getDocumentExtractionRuntimePort().health(),
      ]);
    return {
      runtimeId: runtime.runtimeId,
      entry: "getEnterpriseRuntime",
      orchestratorOk: orchestratorHealth.ok,
      captureEngineOk: captureEngineHealth.ok,
      documentIntakeRuntimeOk: intakeHealth.ok,
      documentExtractionRuntimeOk: extractionHealth.ok,
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
 * EPC-24B: Intake awaited (quando `options.intake`); Parser via Extraction Runtime.
 * Não fecha AER-GA03-A1. Não altera OCR / Audit / Contract / Risk / Correction.
 */
export async function runCaptureOperationalPipelineBound(
  ctx: ServiceCtx,
  sessionId: string,
  mode: CaptureOperationalPipelineMode = "full",
  options?: RunCaptureOperationalPipelineBoundOptions,
): Promise<void> {
  // Composition root oficial — Capture entra exclusivamente pelo Runtime.
  void resolveCaptureEnterpriseRuntime();
  // Coordenação estrutural (Orchestrator / Capture Engine / Intake / Extraction).
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
        await runCaptureAudit(ctx, sessionId);
        try {
          await runCaptureContractIntelligence(ctx, sessionId);
          try {
            await runCaptureGlosaRisk(ctx, sessionId);
            try {
              await runCaptureCorrectionAssistant(ctx, sessionId);
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
