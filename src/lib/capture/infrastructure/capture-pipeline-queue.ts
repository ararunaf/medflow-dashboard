/**
 * F1-S4 — fila real do pipeline de Captura (capture_pipeline_jobs).
 *
 * Substitui a execução síncrona de `runCaptureOperationalPipelineBound`
 * dentro da requisição de upload: `enqueueCapturePipelineJob` apenas insere
 * a linha e retorna — quem processa é `scripts/capture/worker/capture-pipeline-worker.ts`.
 */
import type { Database } from "@/lib/database.types";
import { DomainError } from "@/lib/domain/operations/errors";
import type { ServiceCtx } from "@/lib/services/operations/types";
import type { CaptureOperationalPipelineMode } from "../enterprise/capture-runtime-binding";

export type CapturePipelineJobRow = Database["public"]["Tables"]["capture_pipeline_jobs"]["Row"];

export async function enqueueCapturePipelineJob(
  ctx: ServiceCtx,
  sessionId: string,
  mode: CaptureOperationalPipelineMode = "full",
): Promise<CapturePipelineJobRow> {
  const { data, error } = await ctx.client
    .from("capture_pipeline_jobs")
    .insert({
      tenant_id: ctx.tenantId,
      session_id: sessionId,
      mode,
      created_by: ctx.actorProfileId,
    })
    .select()
    .single();

  if (error || !data) {
    throw new DomainError(
      "internal_error",
      `Falha ao enfileirar job do pipeline de captura: ${error?.message ?? "sem retorno"}`,
      { sessionId, mode },
    );
  }

  return data;
}
