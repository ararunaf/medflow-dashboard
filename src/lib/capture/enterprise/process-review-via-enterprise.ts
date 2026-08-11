/**
 * EPC-24D — Capture Review → Validation Runtime + Bloco C handoff (convergência).
 *
 * Fluxo oficial:
 *   Produto → resolveCaptureEnterpriseRuntime() [= getEnterpriseRuntime()]
 *     → ValidationRuntimePort (coordenação estrutural F3-CAP-08; aprovação humana)
 *     → (se aprovada) coordinateBlocoCViaEnterprise (Workflow/Batch/Protocol)
 *     → fallback legado `review-workspace-store` (comportamento funcional idêntico)
 *
 * Sem cutover. Sem alteração de regra de negócio / UI / OCR / Parser / Audit /
 * Contract / Risk / Correction / banco / APIs. Foundations 4–7 preservadas.
 *
 * A engine legada permanece exclusivamente como fallback atrás deste gateway.
 * Nenhum módulo de produto deve importar `review-workspace-store` para execução —
 * apenas este módulo (e testes do próprio review).
 */
import type { ServiceCtx } from "@/lib/services/operations/types";
import {
  getReviewWorkspaceSnapshot,
  setReviewApprovalDecision,
  type ReviewWorkspaceSnapshot,
} from "../review/review-workspace-store";
import type { ReviewWorkspaceMetadata, SetReviewApprovalInput } from "../review/types";
import type { CaptureSessionStatus } from "../types";
import { resolveCaptureEnterpriseRuntime } from "./resolve-enterprise-runtime";
import { coordinateBlocoCViaEnterprise } from "./process-bloco-c-via-enterprise";

export type SetReviewApprovalViaEnterpriseResult = {
  review: ReviewWorkspaceMetadata;
  sessionStatus: CaptureSessionStatus;
  viaEnterpriseRuntime: true;
  validationJobId: string | null;
  blocoCCoordinationId: string | null;
  reviewFallback: "legacy-review-workspace";
};

export type CaptureReviewViaEnterpriseProbe = {
  runtimeId: string;
  entry: "getEnterpriseRuntime";
  validationRuntimeOk: boolean;
  providerId: string;
};

/**
 * Probe estrutural: Capture alcança ValidationRuntimePort via Runtime.
 * Best-effort; nunca lança.
 */
export async function probeCaptureReviewViaEnterprise(): Promise<CaptureReviewViaEnterpriseProbe | null> {
  try {
    const runtime = resolveCaptureEnterpriseRuntime();
    const port = runtime.getValidationRuntimePort();
    const health = await port.health();
    return {
      runtimeId: runtime.runtimeId,
      entry: "getEnterpriseRuntime",
      validationRuntimeOk: health.ok,
      providerId: port.providerId,
    };
  } catch {
    return null;
  }
}

/**
 * Leitura do workspace de revisão — facade Enterprise (sem reexecução).
 */
export async function getReviewWorkspaceSnapshotViaEnterprise(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<ReviewWorkspaceSnapshot> {
  void resolveCaptureEnterpriseRuntime();
  return getReviewWorkspaceSnapshot(ctx, sessionId);
}

/**
 * Coordena aprovação humana via ValidationRuntimePort e executa o store legado
 * como fallback funcional (mesma saída observável). Em `aprovada`, dispara
 * coordenação estrutural Bloco C (sem cutover / sem criar lote real).
 */
export async function setReviewApprovalViaEnterprise(
  ctx: ServiceCtx,
  input: SetReviewApprovalInput,
): Promise<SetReviewApprovalViaEnterpriseResult> {
  const runtime = resolveCaptureEnterpriseRuntime();
  const validation = runtime.getValidationRuntimePort();

  let validationJobId: string | null = null;
  let blocoCCoordinationId: string | null = null;

  try {
    const opened = await validation.openJob({
      correlationId: input.sessionId,
      requestId: `capture-review-job-${input.sessionId}`,
      metadata: {
        kind: "canonical-validation-metadata",
        correlationId: input.sessionId,
        channel: "epc-24d-capture-review",
        tags: ["epc-24d", "review", "capture"],
        customAttributes: {
          sessionId: input.sessionId,
          stage: "review",
          approvalStatus: input.status,
        },
      },
    });
    validationJobId = opened.job?.jobId ?? null;

    if (validationJobId) {
      await validation.submitRequest({
        jobId: validationJobId,
        requestId: `capture-review-req-${input.sessionId}`,
        metadata: {
          kind: "canonical-validation-metadata",
          correlationId: input.sessionId,
          channel: "epc-24d-capture-review",
          customAttributes: {
            sessionId: input.sessionId,
            stage: "review",
            approvalStatus: input.status,
          },
        },
      });
    }
  } catch {
    /* coordenação estrutural best-effort — fallback legado permanece */
  }

  try {
    const legacy = await setReviewApprovalDecision(ctx, input);

    if (input.status === "aprovada") {
      try {
        const bloco = await coordinateBlocoCViaEnterprise({
          sessionId: input.sessionId,
          trigger: "review-approved",
        });
        blocoCCoordinationId = bloco.coordinationId;
      } catch {
        /* handoff Bloco C estrutural best-effort — Review permanece válido */
      }
    }

    return {
      ...legacy,
      viaEnterpriseRuntime: true,
      validationJobId,
      blocoCCoordinationId,
      reviewFallback: "legacy-review-workspace",
    };
  } finally {
    if (validationJobId) {
      try {
        await validation.closeJob({
          jobId: validationJobId,
          requestId: `capture-review-close-${input.sessionId}`,
        });
      } catch {
        /* close estrutural best-effort */
      }
    }
  }
}
