/**
 * IntegrationTransformationEngine — F-05.
 *
 * Aplica transformações genéricas sobre valores. Apenas transforma — não valida conteúdo.
 * Não acessa banco, APIs, executa integrações, conhece formatos específicos ou regras de negócio.
 * Reutiliza Registry, Connector, Pipeline e Mapping.
 */
import type {
  CanonicalIntegrationTransformation,
  CanonicalIntegrationTransformationResult,
  CanonicalIntegrationTransformationStats,
  CanonicalIntegrationTransformationStep,
} from "../ports/canonical";
import { IntegrationConnectorEngine } from "../integration-connector";
import { IntegrationMappingEngine } from "../integration-mapping";
import { IntegrationPipelineEngine } from "../integration-pipeline";
import { IntegrationRegistryEngine } from "../integration-registry";

export interface IntegrationTransformationStore {
  get(transformationId: string): CanonicalIntegrationTransformation | undefined;
  set(transformation: CanonicalIntegrationTransformation): void;
  list(
    integrationId?: string,
    pipelineId?: string,
    connectorId?: string,
    mappingId?: string,
    limit?: number,
    offset?: number,
  ): CanonicalIntegrationTransformation[];
  all(): CanonicalIntegrationTransformation[];
  stats(): CanonicalIntegrationTransformationStats;
}

export class InMemoryIntegrationTransformationStore implements IntegrationTransformationStore {
  private readonly transformations = new Map<string, CanonicalIntegrationTransformation>();

  get(transformationId: string): CanonicalIntegrationTransformation | undefined {
    return this.transformations.get(transformationId);
  }

  set(transformation: CanonicalIntegrationTransformation): void {
    this.transformations.set(transformation.transformationId, transformation);
  }

  all(): CanonicalIntegrationTransformation[] {
    return Array.from(this.transformations.values());
  }

  list(
    integrationId?: string,
    pipelineId?: string,
    connectorId?: string,
    mappingId?: string,
    limit = Number.POSITIVE_INFINITY,
    offset = 0,
  ): CanonicalIntegrationTransformation[] {
    const all = this.all();
    const filtered = all.filter((t) => {
      if (integrationId && t.integrationId !== integrationId) return false;
      if (pipelineId && t.pipelineId !== pipelineId) return false;
      if (connectorId && t.connectorId !== connectorId) return false;
      if (mappingId && t.mappingId !== mappingId) return false;
      return true;
    });
    return filtered.slice(offset, offset + limit);
  }

  stats(): CanonicalIntegrationTransformationStats {
    const all = this.all();
    const integrationIds = new Set<string>();
    const connectorIds = new Set<string>();
    const pipelineIds = new Set<string>();
    const mappingIds = new Set<string>();
    const tags = new Set<string>();
    for (const t of all) {
      integrationIds.add(t.integrationId);
      connectorIds.add(t.connectorId);
      pipelineIds.add(t.pipelineId);
      mappingIds.add(t.mappingId);
      for (const tag of t.tags ?? []) tags.add(tag);
    }
    return {
      totalTransformations: all.length,
      transformationIds: all.map((t) => t.transformationId),
      integrationIds: Array.from(integrationIds),
      connectorIds: Array.from(connectorIds),
      pipelineIds: Array.from(pipelineIds),
      mappingIds: Array.from(mappingIds),
      tags: Array.from(tags),
    };
  }
}

function applyStep(value: unknown, step: CanonicalIntegrationTransformationStep): unknown {
  switch (step.type) {
    case "trim":
      return typeof value === "string" ? value.trim() : value;
    case "uppercase":
      return typeof value === "string" ? value.toUpperCase() : value;
    case "lowercase":
      return typeof value === "string" ? value.toLowerCase() : value;
    case "concat": {
      const suffix = step.params?.suffix ?? "";
      return typeof value === "string" ? `${value}${suffix}` : `${String(value)}${suffix}`;
    }
    case "split": {
      const separator = String(step.params?.separator ?? ",");
      if (typeof value === "string") return value.split(separator);
      return Array.isArray(value) ? value : [value];
    }
    case "replace": {
      const from = String(step.params?.from ?? "");
      const to = String(step.params?.to ?? "");
      return typeof value === "string" ? value.split(from).join(to) : value;
    }
    case "substring": {
      const start = typeof step.params?.start === "number" ? step.params.start : 0;
      const end = typeof step.params?.end === "number" ? step.params.end : undefined;
      return typeof value === "string" ? value.substring(start, end) : value;
    }
    case "normalize":
      return typeof value === "string" ? value.normalize("NFC") : value;
    case "cast": {
      const to = step.params?.to ?? "string";
      if (to === "number") return Number(value);
      if (to === "string") return String(value);
      if (to === "boolean") return Boolean(value);
      return value;
    }
    case "date-format":
      return value;
    case "number-format":
      return value;
    case "boolean":
      return Boolean(value);
    case "default": {
      const fallback = step.params?.value ?? "";
      return value === undefined || value === null || value === "" ? fallback : value;
    }
    default:
      return value;
  }
}

export class IntegrationTransformationEngine {
  constructor(
    private readonly registry: IntegrationRegistryEngine,
    private readonly connector: IntegrationConnectorEngine,
    private readonly pipeline: IntegrationPipelineEngine,
    private readonly mapping: IntegrationMappingEngine,
    private readonly store: IntegrationTransformationStore = new InMemoryIntegrationTransformationStore(),
  ) {}

  register(
    transformation: CanonicalIntegrationTransformation,
  ): CanonicalIntegrationTransformationResult {
    if (!transformation.transformationId || transformation.transformationId.trim() === "") {
      return {
        kind: "canonical-integration-transformation-result",
        ok: false,
        code: "INTEGRATION_TRANSFORMATION_INVALID_ID",
        message: "transformationId is required",
      };
    }
    if (!transformation.mappingId || transformation.mappingId.trim() === "") {
      return {
        kind: "canonical-integration-transformation-result",
        ok: false,
        code: "INTEGRATION_TRANSFORMATION_INVALID_MAPPING_ID",
        message: "mappingId is required",
      };
    }
    if (!transformation.integrationId || transformation.integrationId.trim() === "") {
      return {
        kind: "canonical-integration-transformation-result",
        ok: false,
        code: "INTEGRATION_TRANSFORMATION_INVALID_INTEGRATION_ID",
        message: "integrationId is required",
      };
    }
    if (!transformation.connectorId || transformation.connectorId.trim() === "") {
      return {
        kind: "canonical-integration-transformation-result",
        ok: false,
        code: "INTEGRATION_TRANSFORMATION_INVALID_CONNECTOR_ID",
        message: "connectorId is required",
      };
    }
    if (!transformation.pipelineId || transformation.pipelineId.trim() === "") {
      return {
        kind: "canonical-integration-transformation-result",
        ok: false,
        code: "INTEGRATION_TRANSFORMATION_INVALID_PIPELINE_ID",
        message: "pipelineId is required",
      };
    }
    if (!transformation.name || transformation.name.trim() === "") {
      return {
        kind: "canonical-integration-transformation-result",
        ok: false,
        code: "INTEGRATION_TRANSFORMATION_INVALID_NAME",
        message: "name is required",
      };
    }
    const integration = this.registry.find(transformation.integrationId);
    if (!integration) {
      return {
        kind: "canonical-integration-transformation-result",
        ok: false,
        code: "INTEGRATION_TRANSFORMATION_UNKNOWN_INTEGRATION",
        message: `integration ${transformation.integrationId} not found`,
      };
    }
    const connector = this.connector.find(transformation.connectorId);
    if (!connector) {
      return {
        kind: "canonical-integration-transformation-result",
        ok: false,
        code: "INTEGRATION_TRANSFORMATION_UNKNOWN_CONNECTOR",
        message: `connector ${transformation.connectorId} not found`,
      };
    }
    if (connector.integrationId !== transformation.integrationId) {
      return {
        kind: "canonical-integration-transformation-result",
        ok: false,
        code: "INTEGRATION_TRANSFORMATION_CONNECTOR_INTEGRATION_MISMATCH",
        message: `connector ${transformation.connectorId} does not belong to integration ${transformation.integrationId}`,
      };
    }
    const pipeline = this.pipeline.find(transformation.pipelineId);
    if (!pipeline) {
      return {
        kind: "canonical-integration-transformation-result",
        ok: false,
        code: "INTEGRATION_TRANSFORMATION_UNKNOWN_PIPELINE",
        message: `pipeline ${transformation.pipelineId} not found`,
      };
    }
    if (pipeline.integrationId !== transformation.integrationId) {
      return {
        kind: "canonical-integration-transformation-result",
        ok: false,
        code: "INTEGRATION_TRANSFORMATION_PIPELINE_INTEGRATION_MISMATCH",
        message: `pipeline ${transformation.pipelineId} does not belong to integration ${transformation.integrationId}`,
      };
    }
    const mapping = this.mapping.find(transformation.mappingId);
    if (!mapping) {
      return {
        kind: "canonical-integration-transformation-result",
        ok: false,
        code: "INTEGRATION_TRANSFORMATION_UNKNOWN_MAPPING",
        message: `mapping ${transformation.mappingId} not found`,
      };
    }
    if (mapping.integrationId !== transformation.integrationId) {
      return {
        kind: "canonical-integration-transformation-result",
        ok: false,
        code: "INTEGRATION_TRANSFORMATION_MAPPING_INTEGRATION_MISMATCH",
        message: `mapping ${transformation.mappingId} does not belong to integration ${transformation.integrationId}`,
      };
    }
    if (transformation.steps.length === 0) {
      return {
        kind: "canonical-integration-transformation-result",
        ok: false,
        code: "INTEGRATION_TRANSFORMATION_EMPTY_STEPS",
        message: "at least one transformation step is required",
      };
    }
    const stepIds = new Set<string>();
    const validTypes = new Set<string>([
      "trim",
      "uppercase",
      "lowercase",
      "concat",
      "split",
      "replace",
      "substring",
      "normalize",
      "cast",
      "date-format",
      "number-format",
      "boolean",
      "default",
    ]);
    for (const step of transformation.steps) {
      if (!step.stepId || step.stepId.trim() === "") {
        return {
          kind: "canonical-integration-transformation-result",
          ok: false,
          code: "INTEGRATION_TRANSFORMATION_INVALID_STEP_ID",
          message: "stepId is required",
        };
      }
      if (!validTypes.has(step.type)) {
        return {
          kind: "canonical-integration-transformation-result",
          ok: false,
          code: "INTEGRATION_TRANSFORMATION_INVALID_STEP_TYPE",
          message: `step type ${step.type} is not supported`,
        };
      }
      if (stepIds.has(step.stepId)) {
        return {
          kind: "canonical-integration-transformation-result",
          ok: false,
          code: "INTEGRATION_TRANSFORMATION_DUPLICATE_STEP_ID",
          message: `duplicate stepId ${step.stepId}`,
        };
      }
      stepIds.add(step.stepId);
    }
    this.store.set(transformation);
    return {
      kind: "canonical-integration-transformation-result",
      ok: true,
      transformationId: transformation.transformationId,
      transformation,
      code: "INTEGRATION_TRANSFORMATION_REGISTERED",
      message: "transformation registered",
    };
  }

  find(transformationId: string): CanonicalIntegrationTransformation | undefined {
    return this.store.get(transformationId);
  }

  list(
    integrationId?: string,
    pipelineId?: string,
    connectorId?: string,
    mappingId?: string,
    limit?: number,
    offset?: number,
  ): CanonicalIntegrationTransformation[] {
    return this.store.list(integrationId, pipelineId, connectorId, mappingId, limit, offset);
  }

  stats(): CanonicalIntegrationTransformationStats {
    return this.store.stats();
  }

  transform(value: unknown, transformationId: string): unknown {
    const transformation = this.find(transformationId);
    if (!transformation) return value;
    return transformation.steps.reduce((acc, step) => applyStep(acc, step), value);
  }
}
