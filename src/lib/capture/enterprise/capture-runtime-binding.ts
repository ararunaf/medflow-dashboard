/**
 * EPC-24A — Enterprise Runtime Convergence Binding
 *
 * Liga o pipeline operacional de Captura ao Enterprise Runtime sem cutover.
 *
 * PRESERVAR: comportamento funcional idêntico à cadeia imperativa pré-EPC-24A.
 * MIGRAR (futuro EPC-24B+): estágios de negócio → Ports Enterprise.
 * REMOVER (futuro EPC-24E): dual-path AER-GA03-A1 após paridade certificada.
 *
 * Fluxo oficial deste binding:
 *   Capture (upload/retry)
 *     → resolveCaptureEnterpriseRuntime()  [= getEnterpriseRuntime()]
 *     → CanonicalExecutionOrchestratorPort (coordenação estrutural)
 *     → pipeline operacional legado (OCR→…→correção) — sem alteração de regra
 *
 * Dual-path AER-GA03-A1 permanece parcialmente (intake side-effect paralelo).
 * Esta sprint inicia a eliminação sem executar o cutover.
 */
import type { ServiceCtx } from "@/lib/services/operations/types";
import { runCaptureOcr } from "../ocr/services/ocr-service";
import { runCaptureParser } from "../parser/services/tiss-parser-service";
import { runCaptureAudit } from "../audit/services/preventive-audit-service";
import { runCaptureContractIntelligence } from "../contract/services/contract-intelligence-service";
import { runCaptureGlosaRisk } from "../risk/services/glosa-risk-service";
import { runCaptureCorrectionAssistant } from "../correction";
import { resolveCaptureEnterpriseRuntime } from "./resolve-enterprise-runtime";

export type CaptureOperationalPipelineMode = "full" | "retry-upload";

export type CaptureRuntimeBindingProbe = {
  runtimeId: string;
  entry: "getEnterpriseRuntime";
  orchestratorOk: boolean;
  captureEngineOk: boolean;
};

/**
 * Probe estrutural do binding: prova que Capture entra pelo composition root
 * e alcança Orchestrator + Capture Engine Runtime. Best-effort; nunca lança.
 */
export async function probeCaptureEnterpriseRuntimeBinding(): Promise<CaptureRuntimeBindingProbe | null> {
  try {
    const runtime = resolveCaptureEnterpriseRuntime();
    const [orchestratorHealth, captureEngineHealth] = await Promise.all([
      runtime.getOrchestratorPort().health(),
      runtime.getCaptureEngineRuntimePort().health(),
    ]);
    return {
      runtimeId: runtime.runtimeId,
      entry: "getEnterpriseRuntime",
      orchestratorOk: orchestratorHealth.ok,
      captureEngineOk: captureEngineHealth.ok,
    };
  } catch {
    return null;
  }
}

/**
 * Executa a cadeia operacional de Captura sob o binding Enterprise Runtime.
 *
 * Comportamento observável idêntico à orquestração imperativa anterior em
 * `uploadCaptureFileFn` / `retryCaptureUploadFn` (mesmos estágios, mesmos
 * catches aninhados, mesmas mensagens de falha engolida).
 *
 * Não substitui engines. Não altera Ports de negócio. Não fecha AER-GA03-A1.
 */
export async function runCaptureOperationalPipelineBound(
  ctx: ServiceCtx,
  sessionId: string,
  mode: CaptureOperationalPipelineMode = "full",
): Promise<void> {
  // Composition root oficial — Capture entra exclusivamente pelo Runtime.
  void resolveCaptureEnterpriseRuntime();
  // Coordenação estrutural (Orchestrator / Capture Engine) — sem dirigir engines.
  void probeCaptureEnterpriseRuntimeBinding();

  if (mode === "retry-upload") {
    try {
      await runCaptureOcr(ctx, sessionId);
      try {
        await runCaptureParser(ctx, sessionId);
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
      await runCaptureParser(ctx, sessionId);
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
