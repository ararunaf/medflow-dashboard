/**
 * DefaultPipelineResolverStore — store in-process padrão (EPC-24 Sprint 02).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations).
 * Seedado com o pipeline canônico Enterprise.
 */
import { createStableCanonicalPipelineDefinition } from "../ports/default-pipeline";
import type {
  PipelineResolverStore,
  StoredPipelineDefinition,
  StoredPipelineResolution,
} from "./pipeline-resolver-store";

export const DEFAULT_PIPELINE_RESOLVER_STORE_ID = "default-in-process";

export type DefaultPipelineResolverStoreOptions = {
  pipelines?: readonly StoredPipelineDefinition[];
  resolutions?: readonly StoredPipelineResolution[];
  /** Se false, não seeda o pipeline canônico. Default: true. */
  seedCanonical?: boolean;
};

export class DefaultPipelineResolverStore implements PipelineResolverStore {
  readonly storeId = DEFAULT_PIPELINE_RESOLVER_STORE_ID;

  private readonly pipelines = new Map<string, StoredPipelineDefinition>();
  private readonly resolutions = new Map<string, StoredPipelineResolution>();

  constructor(options: DefaultPipelineResolverStoreOptions = {}) {
    const seedCanonical = options.seedCanonical ?? true;
    if (seedCanonical) {
      const canonical = createStableCanonicalPipelineDefinition();
      this.pipelines.set(canonical.id, { definition: canonical });
    }
    for (const pipeline of options.pipelines ?? []) {
      this.pipelines.set(pipeline.definition.id, pipeline);
    }
    for (const resolution of options.resolutions ?? []) {
      this.resolutions.set(resolution.resolution.id, resolution);
    }
  }

  getPipeline(pipelineId: string): StoredPipelineDefinition | undefined {
    return this.pipelines.get(pipelineId);
  }

  setPipeline(pipeline: StoredPipelineDefinition): void {
    this.pipelines.set(pipeline.definition.id, pipeline);
  }

  listPipelines(): readonly StoredPipelineDefinition[] {
    return [...this.pipelines.values()];
  }

  removePipeline(pipelineId: string): boolean {
    return this.pipelines.delete(pipelineId);
  }

  pipelineCount(): number {
    return this.pipelines.size;
  }

  getResolution(resolutionId: string): StoredPipelineResolution | undefined {
    return this.resolutions.get(resolutionId);
  }

  setResolution(resolution: StoredPipelineResolution): void {
    this.resolutions.set(resolution.resolution.id, resolution);
  }

  listResolutions(): readonly StoredPipelineResolution[] {
    return [...this.resolutions.values()];
  }

  resolutionCount(): number {
    return this.resolutions.size;
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `DefaultPipelineResolverStore ready (${this.pipelines.size} pipelines, ${this.resolutions.size} resolutions).`,
    };
  }
}
