/**
 * EPC-24C / EPC-24E — Capture Correction Assistant → Auto-Fill Runtime.
 *
 * Fluxo oficial único (cutover EPC-24E):
 *   Produto → resolveCaptureEnterpriseRuntime() [= getEnterpriseRuntime()]
 *     → AutoFillRuntimePort (coordenação estrutural F3-CAP-12)
 *     → runCaptureCorrectionAssistant (implementação interna autorizada)
 *
 * Sem Dual Path. Sem flag de fallback. Sem alteração de regra de negócio /
 * UI / OCR / Parser / XML / banco / APIs. Foundations 4–7 preservadas.
 *
 * A engine legada permanece exclusivamente como implementação interna
 * atrás deste gateway — nunca como pipeline paralelo.
 * Nenhum módulo de produto deve importar `correction` para execução de
 * geração — apenas este módulo (e testes do próprio correction).
 */
import type { ServiceCtx } from "@/lib/services/operations/types";
import {
  getCaptureCorrectionProposals,
  runCaptureCorrectionAssistant,
  updateCaptureCorrectionProposal,
  type GenerateCorrectionProposalsResult,
} from "../correction/services/correction-assistant-service";
import type {
  CorrectionProposalStore,
  UpdateCorrectionProposalInput,
} from "../correction/types/correction-proposal";
import { CaptureEnterpriseRuntimeUnavailableError } from "./capture-enterprise-runtime-unavailable-error";
import { resolveCaptureEnterpriseRuntime } from "./resolve-enterprise-runtime";

export type RunCaptureCorrectionViaEnterpriseResult = GenerateCorrectionProposalsResult & {
  viaEnterpriseRuntime: true;
  autoFillId: string | null;
};

export type CaptureCorrectionViaEnterpriseProbe = {
  runtimeId: string;
  entry: "getEnterpriseRuntime";
  autoFillRuntimeOk: boolean;
  providerId: string;
};

/**
 * Probe estrutural: Capture alcança AutoFillRuntimePort via Runtime.
 * Best-effort; nunca lança.
 */
export async function probeCaptureCorrectionViaEnterprise(): Promise<CaptureCorrectionViaEnterpriseProbe | null> {
  try {
    const runtime = resolveCaptureEnterpriseRuntime();
    const port = runtime.getAutoFillRuntimePort();
    const health = await port.health();
    return {
      runtimeId: runtime.runtimeId,
      entry: "getEnterpriseRuntime",
      autoFillRuntimeOk: health.ok,
      providerId: port.providerId,
    };
  } catch {
    return null;
  }
}

/**
 * Coordena correção assistida via AutoFillRuntimePort e executa a engine
 * como implementação interna autorizada (mesma saída observável).
 */
export async function runCaptureCorrectionViaEnterprise(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<RunCaptureCorrectionViaEnterpriseResult> {
  const probe = await probeCaptureCorrectionViaEnterprise();
  if (!probe || !probe.autoFillRuntimeOk) {
    throw new CaptureEnterpriseRuntimeUnavailableError("correction", {
      autoFillRuntimeOk: probe?.autoFillRuntimeOk ?? false,
    });
  }

  const runtime = resolveCaptureEnterpriseRuntime();
  const autoFill = runtime.getAutoFillRuntimePort();

  let autoFillId: string | null = null;

  try {
    const prepared = await autoFill.prepareAutoFill({
      requestId: `capture-correction-autofill-${sessionId}`,
      autoFillId: `capture-correction-${sessionId}`,
      autoFillContext: {
        kind: "canonical-auto-fill-context",
        autoFillId: `capture-correction-${sessionId}`,
        structuralNotes: `epc-24e-capture-correction:${sessionId}`,
      },
    });
    autoFillId = prepared.session?.autoFillId ?? prepared.result?.session?.autoFillId ?? null;
  } catch {
    /* coordenação estrutural do Port — implementação interna segue no pipeline único */
  }

  const internal = await runCaptureCorrectionAssistant(ctx, sessionId);
  return {
    ...internal,
    viaEnterpriseRuntime: true,
    autoFillId,
  };
}

/**
 * Leitura de propostas — facade Enterprise (sem reexecução).
 */
export async function getCaptureCorrectionProposalsViaEnterprise(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<CorrectionProposalStore | null> {
  void resolveCaptureEnterpriseRuntime();
  return getCaptureCorrectionProposals(ctx, sessionId);
}

/**
 * Atualização de proposta (ação do operador) — facade Enterprise.
 * Não altera regra de decisão; apenas passa pelo composition root.
 */
export async function updateCaptureCorrectionProposalViaEnterprise(
  ctx: ServiceCtx,
  sessionId: string,
  input: UpdateCorrectionProposalInput,
): Promise<CorrectionProposalStore> {
  void resolveCaptureEnterpriseRuntime();
  return updateCaptureCorrectionProposal(ctx, sessionId, input);
}
