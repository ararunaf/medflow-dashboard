/**
 * EPC-24C — Capture Glosa Risk → Quality Runtime (convergência).
 *
 * Fluxo oficial:
 *   Produto → resolveCaptureEnterpriseRuntime() [= getEnterpriseRuntime()]
 *     → QualityRuntimePort (coordenação estrutural F3-CAP-13;
 *       destino canônico ARC-24 para Risk/glosa sob Runtime)
 *     → fallback legado `runCaptureGlosaRisk` (comportamento funcional idêntico)
 *
 * TISS Rule Runtime NÃO está composto em getEnterpriseRuntime()
 * (AER-GA03-M5; Foundations 4–7 congeladas). QualityRuntimePort é o Port
 * wired usado para coordenar Risk nesta sprint.
 *
 * Sem cutover. Sem alteração de regra de negócio / UI / OCR / Parser / XML /
 * banco / APIs. Foundations 4–7 preservadas.
 *
 * A engine legada permanece exclusivamente como fallback atrás deste gateway.
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
import { resolveCaptureEnterpriseRuntime } from "./resolve-enterprise-runtime";

export type RunCaptureRiskViaEnterpriseResult = RunGlosaRiskResult & {
  viaEnterpriseRuntime: true;
  qualityAssessmentId: string | null;
  riskFallback: "legacy-glosa-risk";
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
 * legada como fallback funcional (mesma saída observável).
 */
export async function runCaptureRiskViaEnterprise(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<RunCaptureRiskViaEnterpriseResult> {
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
        structuralNotes: `epc-24c-capture-risk:${sessionId}`,
      },
    });
    qualityAssessmentId =
      prepared.assessment?.assessmentId ?? prepared.result?.assessment?.assessmentId ?? null;
  } catch {
    /* coordenação estrutural best-effort — fallback legado permanece */
  }

  const legacy = await runCaptureGlosaRisk(ctx, sessionId);
  return {
    ...legacy,
    viaEnterpriseRuntime: true,
    qualityAssessmentId,
    riskFallback: "legacy-glosa-risk",
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
