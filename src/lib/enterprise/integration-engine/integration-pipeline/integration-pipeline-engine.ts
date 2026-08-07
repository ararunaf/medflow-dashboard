/**
 * IntegrationPipelineEngine — F-03.
 *
 * Catálogo genérico de pipelines. Apenas organiza e valida etapas.
 * Não executa pipelines. Não processa dados. Não abre conexões.
 * Reutiliza IntegrationRegistryEngine e IntegrationConnectorEngine.
 */
import type {
  CanonicalIntegrationPipeline,
  CanonicalIntegrationPipelineResult,
  CanonicalIntegrationPipelineStats,
} from "../ports/canonical";
import { IntegrationConnectorEngine } from "../integration-connector";
import { IntegrationRegistryEngine } from "../integration-registry";

export interface IntegrationPipelineStore {
  get(pipelineId: string): CanonicalIntegrationPipeline | undefined;
  set(pipeline: CanonicalIntegrationPipeline): void;
  list(integrationId?: string, limit?: number, offset?: number): CanonicalIntegrationPipeline[];
  all(): CanonicalIntegrationPipeline[];
  stats(): CanonicalIntegrationPipelineStats;
}

export class InMemoryIntegrationPipelineStore implements IntegrationPipelineStore {
  private readonly pipelines = new Map<string, CanonicalIntegrationPipeline>();

  get(pipelineId: string): CanonicalIntegrationPipeline | undefined {
    return this.pipelines.get(pipelineId);
  }

  set(pipeline: CanonicalIntegrationPipeline): void {
    this.pipelines.set(pipeline.pipelineId, pipeline);
  }

  all(): CanonicalIntegrationPipeline[] {
    return Array.from(this.pipelines.values());
  }

  list(
    integrationId?: string,
    limit = Number.POSITIVE_INFINITY,
    offset = 0,
  ): CanonicalIntegrationPipeline[] {
    const all = this.all();
    const filtered = integrationId ? all.filter((p) => p.integrationId === integrationId) : all;
    return filtered.slice(offset, offset + limit);
  }

  stats(): CanonicalIntegrationPipelineStats {
    const all = this.all();
    const integrationIds = new Set<string>();
    const tags = new Set<string>();
    for (const pipeline of all) {
      integrationIds.add(pipeline.integrationId);
      for (const tag of pipeline.tags ?? []) tags.add(tag);
    }
    return {
      totalPipelines: all.length,
      pipelineIds: all.map((p) => p.pipelineId),
      integrationIds: Array.from(integrationIds),
      tags: Array.from(tags),
    };
  }
}

export class IntegrationPipelineEngine {
  constructor(
    private readonly registry: IntegrationRegistryEngine,
    private readonly connector: IntegrationConnectorEngine,
    private readonly store: IntegrationPipelineStore = new InMemoryIntegrationPipelineStore(),
  ) {}

  register(pipeline: CanonicalIntegrationPipeline): CanonicalIntegrationPipelineResult {
    if (!pipeline.pipelineId || pipeline.pipelineId.trim() === "") {
      return {
        kind: "canonical-integration-pipeline-result",
        ok: false,
        code: "INTEGRATION_PIPELINE_INVALID_ID",
        message: "pipelineId is required",
      };
    }
    if (!pipeline.integrationId || pipeline.integrationId.trim() === "") {
      return {
        kind: "canonical-integration-pipeline-result",
        ok: false,
        code: "INTEGRATION_PIPELINE_INVALID_INTEGRATION_ID",
        message: "integrationId is required",
      };
    }
    if (!pipeline.name || pipeline.name.trim() === "") {
      return {
        kind: "canonical-integration-pipeline-result",
        ok: false,
        code: "INTEGRATION_PIPELINE_INVALID_NAME",
        message: "name is required",
      };
    }
    const integration = this.registry.find(pipeline.integrationId);
    if (!integration) {
      return {
        kind: "canonical-integration-pipeline-result",
        ok: false,
        code: "INTEGRATION_PIPELINE_UNKNOWN_INTEGRATION",
        message: `integration ${pipeline.integrationId} not found`,
      };
    }
    const connectorIds = new Set<string>();
    for (const stage of pipeline.stages) {
      if (!stage.stageId || stage.stageId.trim() === "") {
        return {
          kind: "canonical-integration-pipeline-result",
          ok: false,
          code: "INTEGRATION_PIPELINE_INVALID_STAGE_ID",
          message: "stageId is required",
        };
      }
      if (!stage.connectorId || stage.connectorId.trim() === "") {
        return {
          kind: "canonical-integration-pipeline-result",
          ok: false,
          code: "INTEGRATION_PIPELINE_INVALID_STAGE_CONNECTOR_ID",
          message: "connectorId is required in stage",
        };
      }
      const connector = this.connector.find(stage.connectorId);
      if (!connector) {
        return {
          kind: "canonical-integration-pipeline-result",
          ok: false,
          code: "INTEGRATION_PIPELINE_UNKNOWN_CONNECTOR",
          message: `connector ${stage.connectorId} not found`,
        };
      }
      if (connector.integrationId !== pipeline.integrationId) {
        return {
          kind: "canonical-integration-pipeline-result",
          ok: false,
          code: "INTEGRATION_PIPELINE_CONNECTOR_INTEGRATION_MISMATCH",
          message: `connector ${stage.connectorId} does not belong to integration ${pipeline.integrationId}`,
        };
      }
      if (connectorIds.has(stage.stageId)) {
        return {
          kind: "canonical-integration-pipeline-result",
          ok: false,
          code: "INTEGRATION_PIPELINE_DUPLICATE_STAGE_ID",
          message: `duplicate stageId ${stage.stageId}`,
        };
      }
      connectorIds.add(stage.stageId);
    }
    this.store.set(pipeline);
    return {
      kind: "canonical-integration-pipeline-result",
      ok: true,
      pipelineId: pipeline.pipelineId,
      pipeline,
      code: "INTEGRATION_PIPELINE_REGISTERED",
      message: "pipeline registered",
    };
  }

  find(pipelineId: string): CanonicalIntegrationPipeline | undefined {
    return this.store.get(pipelineId);
  }

  list(integrationId?: string, limit?: number, offset?: number): CanonicalIntegrationPipeline[] {
    return this.store.list(integrationId, limit, offset);
  }

  stats(): CanonicalIntegrationPipelineStats {
    return this.store.stats();
  }
}
