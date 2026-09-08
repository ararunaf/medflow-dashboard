/**
 * EPC-24C / EPC-24E — Capture Glosa Risk → Quality Runtime.
 *
 * Fluxo oficial único (cutover EPC-24E):
 *   Produto → resolveCaptureEnterpriseRuntime() [= getEnterpriseRuntime()]
 *     → QualityRuntimePort (coordenação estrutural F3-CAP-13)
 *     → runCaptureGlosaRisk (implementação interna autorizada do Port)
 *
 * TISS Rule Runtime NÃO está composto em getEnterpriseRuntime()
 * (AER-GA03-M5; Foundations 4–7 congeladas). QualityRuntimePort é o Port
 * wired usado para coordenar Risk.
 *
 * Sem Dual Path. Sem flag de fallback. Sem alteração de regra de negócio /
 * UI / OCR / Parser / XML / banco / APIs. Foundations 4–7 preservadas.
 *
 * A engine legada permanece exclusivamente como implementação interna
 * atrás deste gateway — nunca como pipeline paralelo.
 */
import type { ServiceCtx } from "@/lib/services/operations/types";
import {
  getCaptureRiskAssessmentReport,
  getCaptureRiskDashboard,
  runCaptureGlosaRisk,
  type RunGlosaRiskResult,
} from "../risk/services/glosa-risk-service";
import type { RiskDashboardView } from "../risk/engine/risk-dashboard";
import type { RiskAssessmentReport } from "../risk/types/risk-assessment";
import { CaptureEnterpriseRuntimeUnavailableError } from "./capture-enterprise-runtime-unavailable-error";
import { resolveCaptureEnterpriseRuntime } from "./resolve-enterprise-runtime";

export type RunCaptureRiskViaEnterpriseResult = RunGlosaRiskResult & {
  viaEnterpriseRuntime: true;
  qualityAssessmentId: string | null;
};

export type CaptureRiskViaEnterpriseProbe = {
  runtimeId: string;
  entry: "getEnterpriseRuntime";
  qualityRuntimeOk: boolean;
  providerId: string;
};

/**
 * Probe estrutural: Capture alcança QualityRuntimePort via Runtime.
 * Best-effort; nunca lança.
 */
export async function probeCaptureRiskViaEnterprise(): Promise<CaptureRiskViaEnterpriseProbe | null> {
  try {
    const runtime = resolveCaptureEnterpriseRuntime();
    const port = runtime.getQualityRuntimePort();
    const health = await port.health();
    return {
      runtimeId: runtime.runtimeId,
      entry: "getEnterpriseRuntime",
      qualityRuntimeOk: health.ok,
      providerId: port.providerId,
    };
  } catch {
    return null;
  }
}

/**
 * Coordena avaliação de risco via QualityRuntimePort e executa a engine
 * como implementação interna autorizada (mesma saída observável).
 */
export async function runCaptureRiskViaEnterprise(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<RunCaptureRiskViaEnterpriseResult> {
  const probe = await probeCaptureRiskViaEnterprise();
  if (!probe || !probe.qualityRuntimeOk) {
    throw new CaptureEnterpriseRuntimeUnavailableError("risk", {
      qualityRuntimeOk: probe?.qualityRuntimeOk ?? false,
    });
  }

  const runtime = resolveCaptureEnterpriseRuntime();
  const quality = runtime.getQualityRuntimePort();

  let qualityAssessmentId: string | null = null;

  try {
    const prepared = await quality.prepareQualityAssessment({
      requestId: `capture-risk-quality-${sessionId}`,
      assessmentId: `capture-risk-assessment-${sessionId}`,
      qualityContext: {
        kind: "canonical-quality-context",
        assessmentId: `capture-risk-assessment-${sessionId}`,
        structuralNotes: `epc-24e-capture-risk:${sessionId}`,
      },
    });
    qualityAssessmentId =
      prepared.assessment?.assessmentId ?? prepared.result?.assessment?.assessmentId ?? null;
  } catch {
    /* coordenação estrutural do Port — implementação interna segue no pipeline único */
  }

  const internal = await runCaptureGlosaRisk(ctx, sessionId);
  return {
    ...internal,
    viaEnterpriseRuntime: true,
    qualityAssessmentId,
  };
}

/**
 * Leitura do relatório de risco — facade Enterprise (sem reexecução).
 */
export async function getCaptureRiskAssessmentReportViaEnterprise(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<RiskAssessmentReport | null> {
  void resolveCaptureEnterpriseRuntime();
  return getCaptureRiskAssessmentReport(ctx, sessionId);
}

/**
 * Dashboard de risco — facade Enterprise (sem reexecução).
 */
export async function getCaptureRiskDashboardViaEnterprise(
  ctx: ServiceCtx,
): Promise<RiskDashboardView> {
  void resolveCaptureEnterpriseRuntime();
  return getCaptureRiskDashboard(ctx);
}
