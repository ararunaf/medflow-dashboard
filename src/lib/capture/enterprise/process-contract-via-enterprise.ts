/**
 * EPC-24C — Capture Contract Intelligence → Rule Pack Engine (convergência).
 *
 * Fluxo oficial:
 *   Produto → resolveCaptureEnterpriseRuntime() [= getEnterpriseRuntime()]
 *     → RulePackEnginePort (coordenação estrutural TISS-03;
 *       hop wired da cadeia Contract → Contract Rule Binding → Rule Pack)
 *     → fallback legado `runCaptureContractIntelligence` (comportamento idêntico)
 *
 * ContractPort / ContractRuleBindingPort NÃO estão compostos em
 * getEnterpriseRuntime() (AER-GA03-M5; Foundations 4–7 congeladas nesta sprint).
 * O Port wired que representa o caminho contratual no Runtime é RulePackEngine.
 *
 * Sem cutover. Sem alteração de regra de negócio / UI / OCR / Parser / XML /
 * banco / APIs. Foundations 4–7 preservadas.
 *
 * A engine legada permanece exclusivamente como fallback atrás deste gateway.
 */
import type { ServiceCtx } from "@/lib/services/operations/types";
import {
  getCaptureContractIntelligenceReport,
  runCaptureContractIntelligence,
  type RunContractIntelligenceResult,
} from "../contract/services/contract-intelligence-service";
import type { ContractIntelligenceReport } from "../contract/types/contract-intelligence-report";
import { resolveCaptureEnterpriseRuntime } from "./resolve-enterprise-runtime";

export type RunCaptureContractViaEnterpriseResult = RunContractIntelligenceResult & {
  viaEnterpriseRuntime: true;
  rulePackCount: number | null;
  contractFallback: "legacy-contract-intelligence";
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
 * engine legada como fallback funcional (mesma saída observável).
 */
export async function runCaptureContractViaEnterprise(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<RunCaptureContractViaEnterpriseResult> {
  const runtime = resolveCaptureEnterpriseRuntime();
  const rulePacks = runtime.getRulePackEnginePort();

  let rulePackCount: number | null = null;

  try {
    const listed = await rulePacks.listPacks({
      requestId: `capture-contract-packs-${sessionId}`,
    });
    rulePackCount = listed.packs?.length ?? 0;
  } catch {
    /* coordenação estrutural best-effort — fallback legado permanece */
  }

  const legacy = await runCaptureContractIntelligence(ctx, sessionId);
  return {
    ...legacy,
    viaEnterpriseRuntime: true,
    rulePackCount,
    contractFallback: "legacy-contract-intelligence",
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
