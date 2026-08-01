/**
 * PipelineResolverStore — contrato interno do store (EPC-24 Sprint 02).
 *
 * Camada entre Adapter e persistência física.
 * NÃO é banco; NÃO cria migrations; NÃO executa OCR / IA / parsers.
 */
import type {
  PipelineDefinition,
  PipelineResolution,
  PipelineResolutionResult,
} from "../ports/models";

export type StoredPipelineDefinition = {
  definition: PipelineDefinition;
};

export type StoredPipelineResolution = {
  resolution: PipelineResolution;
  result?: PipelineResolutionResult;
};

export interface PipelineResolverStore {
  readonly storeId: string;

  getPipeline(pipelineId: string): StoredPipelineDefinition | undefined;
  setPipeline(pipeline: StoredPipelineDefinition): void;
  listPipelines(): readonly StoredPipelineDefinition[];
  removePipeline(pipelineId: string): boolean;
  pipelineCount(): number;

  getResolution(resolutionId: string): StoredPipelineResolution | undefined;
  setResolution(resolution: StoredPipelineResolution): void;
  listResolutions(): readonly StoredPipelineResolution[];
  resolutionCount(): number;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
