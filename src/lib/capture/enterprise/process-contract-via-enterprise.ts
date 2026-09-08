/**
 * EPC-24C / EPC-24E — Capture Contract Intelligence → Rule Pack Engine.
 *
 * Fluxo oficial único (cutover EPC-24E):
 *   Produto → resolveCaptureEnterpriseRuntime() [= getEnterpriseRuntime()]
 *     → RulePackEnginePort (coordenação estrutural TISS-03;
 *       hop wired da cadeia Contract → Contract Rule Binding → Rule Pack)
 *     → runCaptureContractIntelligence (implementação interna autorizada)
 *
 * ContractPort / ContractRuleBindingPort NÃO estão compostos em
 * getEnterpriseRuntime() (AER-GA03-M5; Foundations 4–7 congeladas).
 * O Port wired que representa o caminho contratual no Runtime é RulePackEngine.
 *
 * Sem Dual Path. Sem flag de fallback. Sem alteração de regra de negócio /
 * UI / OCR / Parser / XML / banco / APIs. Foundations 4–7 preservadas.
 *
 * A engine legada permanece exclusivamente como implementação interna
 * atrás deste gateway — nunca como pipeline paralelo.
 */
import type { ServiceCtx } from "@/lib/services/operations/types";
import {
  getCaptureContractIntelligenceReport,
  runCaptureContractIntelligence,
  type RunContractIntelligenceResult,
} from "../contract/services/contract-intelligence-service";
import type { ContractIntelligenceReport } from "../contract/types/contract-intelligence-report";
import { CaptureEnterpriseRuntimeUnavailableError } from "./capture-enterprise-runtime-unavailable-error";
import { resolveCaptureEnterpriseRuntime } from "./resolve-enterprise-runtime";

export type RunCaptureContractViaEnterpriseResult = RunContractIntelligenceResult & {
  viaEnterpriseRuntime: true;
  rulePackCount: number | null;
};

export type CaptureContractViaEnterpriseProbe = {
  runtimeId: string;
  entry: "getEnterpriseRuntime";
  rulePackEngineOk: boolean;
  providerId: string;
};

/**
 * Probe estrutural: Capture alcança RulePackEnginePort via Runtime.
 * Best-effort; nunca lança.
 */
export async function probeCaptureContractViaEnterprise(): Promise<CaptureContractViaEnterpriseProbe | null> {
  try {
    const runtime = resolveCaptureEnterpriseRuntime();
    const port = runtime.getRulePackEnginePort();
    const health = await port.health();
    return {
      runtimeId: runtime.runtimeId,
      entry: "getEnterpriseRuntime",
      rulePackEngineOk: health.ok,
      providerId: port.providerId,
    };
  } catch {
    return null;
  }
}

/**
 * Coordena inteligência contratual via RulePackEnginePort e executa a
 * engine como implementação interna autorizada (mesma saída observável).
 */
export async function runCaptureContractViaEnterprise(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<RunCaptureContractViaEnterpriseResult> {
  const probe = await probeCaptureContractViaEnterprise();
  if (!probe || !probe.rulePackEngineOk) {
    throw new CaptureEnterpriseRuntimeUnavailableError("contract", {
      rulePackEngineOk: probe?.rulePackEngineOk ?? false,
    });
  }

  const runtime = resolveCaptureEnterpriseRuntime();
  const rulePacks = runtime.getRulePackEnginePort();

  let rulePackCount: number | null = null;

  try {
    const listed = await rulePacks.listPacks({
      requestId: `capture-contract-packs-${sessionId}`,
    });
    rulePackCount = listed.packs?.length ?? 0;
  } catch {
    /* coordenação estrutural do Port — implementação interna segue no pipeline único */
  }

  const internal = await runCaptureContractIntelligence(ctx, sessionId);
  return {
    ...internal,
    viaEnterpriseRuntime: true,
    rulePackCount,
  };
}

/**
 * Leitura do relatório contratual — facade Enterprise (sem reexecução).
 */
export async function getCaptureContractIntelligenceReportViaEnterprise(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<ContractIntelligenceReport | null> {
  void resolveCaptureEnterpriseRuntime();
  return getCaptureContractIntelligenceReport(ctx, sessionId);
}
