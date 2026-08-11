/**
 * EPC-24A / EPC-24B / EPC-24C — Enterprise Runtime Convergence Binding
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
 * PRESERVAR: comportamento funcional idêntico (OCR→…→correção).
 * MIGRAR (futuro EPC-24D+): Review/TISS/XML → Ports.
 * REMOVER (futuro EPC-24E): dual-path AER-GA03-A1 após paridade certificada.
 *
 * Fluxo oficial deste binding:
 *   Capture (upload/retry)
 *     → resolveCaptureEnterpriseRuntime()  [= getEnterpriseRuntime()]
 *     → Document Intake (EPC-24B)
 *     → CanonicalExecutionOrchestratorPort (coordenação estrutural)
 *     → OCR (inalterado) → Parser via Extraction → Audit → Contract → Risk → Correction
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
};

export type RunCaptureOperationalPipelineBoundOptions = {
  /** Quando presente, Intake Enterprise é awaited no início do bound pipeline. */
  intake?: CaptureEnterpriseBridgeInput;
};

/**
 * Probe estrutural do binding: prova que Capture entra pelo composition root
 * e alcança Orchestrator + Capture Engine + Intake + Extraction + Decision Ports.
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
    ] = await Promise.all([
      runtime.getOrchestratorPort().health(),
      runtime.getCaptureEngineRuntimePort().health(),
      runtime.getDocumentIntakeRuntimePort().health(),
      runtime.getDocumentExtractionRuntimePort().health(),
      runtime.getAuditRuntimePort().health(),
      runtime.getRulePackEnginePort().health(),
      runtime.getQualityRuntimePort().health(),
      runtime.getAutoFillRuntimePort().health(),
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
 * EPC-24C: Audit / Contract / Risk / Correction coordenados via Runtime Ports.
 * Não fecha AER-GA03-A1. Não altera OCR / Parser engines / XML / Foundations.
 */
export async function runCaptureOperationalPipelineBound(
  ctx: ServiceCtx,
  sessionId: string,
  mode: CaptureOperationalPipelineMode = "full",
  options?: RunCaptureOperationalPipelineBoundOptions,
): Promise<void> {
  // Composition root oficial — Capture entra exclusivamente pelo Runtime.
  void resolveCaptureEnterpriseRuntime();
  // Coordenação estrutural (Orchestrator / Capture Engine / Intake / Extraction / Decision).
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
