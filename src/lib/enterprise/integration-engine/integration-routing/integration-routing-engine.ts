/**
 * IntegrationRoutingEngine — F-07.
 *
 * Catálogo e resolvedor genérico de rotas de integração.
 * Uma rota associa um integrationId a connector, pipeline, mapping, transformation e validation.
 * A função resolve() seleciona a rota cadastrada para uma integração.
 * Não executa integrações, não transforma dados, não valida conteúdo, não conhece domínio.
 * Não acessa banco ou APIs.
 */
import type {
  CanonicalIntegrationRouting,
  CanonicalIntegrationRoutingResult,
  CanonicalIntegrationRoutingStats,
} from "../ports/canonical";
import { IntegrationConnectorEngine } from "../integration-connector";
import { IntegrationMappingEngine } from "../integration-mapping";
import { IntegrationPipelineEngine } from "../integration-pipeline";
import { IntegrationRegistryEngine } from "../integration-registry";
import { IntegrationTransformationEngine } from "../integration-transformation";
import { IntegrationValidationEngine } from "../integration-validation";

export interface IntegrationRoutingStore {
  get(routeId: string): CanonicalIntegrationRouting | undefined;
  set(routing: CanonicalIntegrationRouting): void;
  list(
    integrationId?: string,
    connectorId?: string,
    pipelineId?: string,
    mappingId?: string,
    transformationId?: string,
    validationId?: string,
    limit?: number,
    offset?: number,
  ): CanonicalIntegrationRouting[];
  resolve(integrationId: string): CanonicalIntegrationRouting | undefined;
  all(): CanonicalIntegrationRouting[];
  stats(): CanonicalIntegrationRoutingStats;
}

export class InMemoryIntegrationRoutingStore implements IntegrationRoutingStore {
  private readonly routings = new Map<string, CanonicalIntegrationRouting>();

  get(routeId: string): CanonicalIntegrationRouting | undefined {
    return this.routings.get(routeId);
  }

  set(routing: CanonicalIntegrationRouting): void {
    this.routings.set(routing.routeId, routing);
  }

  all(): CanonicalIntegrationRouting[] {
    return Array.from(this.routings.values());
  }

  list(
    integrationId?: string,
    connectorId?: string,
    pipelineId?: string,
    mappingId?: string,
    transformationId?: string,
    validationId?: string,
    limit = Number.POSITIVE_INFINITY,
    offset = 0,
  ): CanonicalIntegrationRouting[] {
    const all = this.all();
    const filtered = all.filter((r) => {
      if (integrationId && r.integrationId !== integrationId) return false;
      if (connectorId && r.connectorId !== connectorId) return false;
      if (pipelineId && r.pipelineId !== pipelineId) return false;
      if (mappingId && r.mappingId !== mappingId) return false;
      if (transformationId && r.transformationId !== transformationId) return false;
      if (validationId && r.validationId !== validationId) return false;
      return true;
    });
    return filtered.slice(offset, offset + limit);
  }

  resolve(integrationId: string): CanonicalIntegrationRouting | undefined {
    return this.all().find((r) => r.integrationId === integrationId);
  }

  stats(): CanonicalIntegrationRoutingStats {
    const all = this.all();
    const integrationIds = new Set<string>();
    const connectorIds = new Set<string>();
    const pipelineIds = new Set<string>();
    const mappingIds = new Set<string>();
    const transformationIds = new Set<string>();
    const validationIds = new Set<string>();
    const tags = new Set<string>();
    for (const r of all) {
      integrationIds.add(r.integrationId);
      connectorIds.add(r.connectorId);
      pipelineIds.add(r.pipelineId);
      mappingIds.add(r.mappingId);
      transformationIds.add(r.transformationId);
      validationIds.add(r.validationId);
      for (const tag of r.tags ?? []) tags.add(tag);
    }
    return {
      totalRoutes: all.length,
      routeIds: all.map((r) => r.routeId),
      integrationIds: Array.from(integrationIds),
      connectorIds: Array.from(connectorIds),
      pipelineIds: Array.from(pipelineIds),
      mappingIds: Array.from(mappingIds),
      transformationIds: Array.from(transformationIds),
      validationIds: Array.from(validationIds),
      tags: Array.from(tags),
    };
  }
}

export class IntegrationRoutingEngine {
  constructor(
    private readonly registry: IntegrationRegistryEngine,
    private readonly connector: IntegrationConnectorEngine,
    private readonly pipeline: IntegrationPipelineEngine,
    private readonly mapping: IntegrationMappingEngine,
    private readonly transformation: IntegrationTransformationEngine,
    private readonly validation: IntegrationValidationEngine,
    private readonly store: IntegrationRoutingStore = new InMemoryIntegrationRoutingStore(),
  ) {}

  register(routing: CanonicalIntegrationRouting): CanonicalIntegrationRoutingResult {
    if (!routing.routeId || routing.routeId.trim() === "") {
      return {
        kind: "canonical-integration-routing-result",
        ok: false,
        code: "INTEGRATION_ROUTING_INVALID_ID",
        message: "routeId is required",
      };
    }
    if (!routing.integrationId || routing.integrationId.trim() === "") {
      return {
        kind: "canonical-integration-routing-result",
        ok: false,
        code: "INTEGRATION_ROUTING_INVALID_INTEGRATION_ID",
        message: "integrationId is required",
      };
    }
    if (!routing.connectorId || routing.connectorId.trim() === "") {
      return {
        kind: "canonical-integration-routing-result",
        ok: false,
        code: "INTEGRATION_ROUTING_INVALID_CONNECTOR_ID",
        message: "connectorId is required",
      };
    }
    if (!routing.pipelineId || routing.pipelineId.trim() === "") {
      return {
        kind: "canonical-integration-routing-result",
        ok: false,
        code: "INTEGRATION_ROUTING_INVALID_PIPELINE_ID",
        message: "pipelineId is required",
      };
    }
    if (!routing.mappingId || routing.mappingId.trim() === "") {
      return {
        kind: "canonical-integration-routing-result",
        ok: false,
        code: "INTEGRATION_ROUTING_INVALID_MAPPING_ID",
        message: "mappingId is required",
      };
    }
    if (!routing.transformationId || routing.transformationId.trim() === "") {
      return {
        kind: "canonical-integration-routing-result",
        ok: false,
        code: "INTEGRATION_ROUTING_INVALID_TRANSFORMATION_ID",
        message: "transformationId is required",
      };
    }
    if (!routing.validationId || routing.validationId.trim() === "") {
      return {
        kind: "canonical-integration-routing-result",
        ok: false,
        code: "INTEGRATION_ROUTING_INVALID_VALIDATION_ID",
        message: "validationId is required",
      };
    }
    if (!routing.name || routing.name.trim() === "") {
      return {
        kind: "canonical-integration-routing-result",
        ok: false,
        code: "INTEGRATION_ROUTING_INVALID_NAME",
        message: "name is required",
      };
    }
    const integration = this.registry.find(routing.integrationId);
    if (!integration) {
      return {
        kind: "canonical-integration-routing-result",
        ok: false,
        code: "INTEGRATION_ROUTING_UNKNOWN_INTEGRATION",
        message: `integration ${routing.integrationId} not found`,
      };
    }
    const connector = this.connector.find(routing.connectorId);
    if (!connector) {
      return {
        kind: "canonical-integration-routing-result",
        ok: false,
        code: "INTEGRATION_ROUTING_UNKNOWN_CONNECTOR",
        message: `connector ${routing.connectorId} not found`,
      };
    }
    if (connector.integrationId !== routing.integrationId) {
      return {
        kind: "canonical-integration-routing-result",
        ok: false,
        code: "INTEGRATION_ROUTING_CONNECTOR_INTEGRATION_MISMATCH",
        message: `connector ${routing.connectorId} does not belong to integration ${routing.integrationId}`,
      };
    }
    const pipeline = this.pipeline.find(routing.pipelineId);
    if (!pipeline) {
      return {
        kind: "canonical-integration-routing-result",
        ok: false,
        code: "INTEGRATION_ROUTING_UNKNOWN_PIPELINE",
        message: `pipeline ${routing.pipelineId} not found`,
      };
    }
    if (pipeline.integrationId !== routing.integrationId) {
      return {
        kind: "canonical-integration-routing-result",
        ok: false,
        code: "INTEGRATION_ROUTING_PIPELINE_INTEGRATION_MISMATCH",
        message: `pipeline ${routing.pipelineId} does not belong to integration ${routing.integrationId}`,
      };
    }
    const mapping = this.mapping.find(routing.mappingId);
    if (!mapping) {
      return {
        kind: "canonical-integration-routing-result",
        ok: false,
        code: "INTEGRATION_ROUTING_UNKNOWN_MAPPING",
        message: `mapping ${routing.mappingId} not found`,
      };
    }
    if (mapping.integrationId !== routing.integrationId) {
      return {
        kind: "canonical-integration-routing-result",
        ok: false,
        code: "INTEGRATION_ROUTING_MAPPING_INTEGRATION_MISMATCH",
        message: `mapping ${routing.mappingId} does not belong to integration ${routing.integrationId}`,
      };
    }
    const transformation = this.transformation.find(routing.transformationId);
    if (!transformation) {
      return {
        kind: "canonical-integration-routing-result",
        ok: false,
        code: "INTEGRATION_ROUTING_UNKNOWN_TRANSFORMATION",
        message: `transformation ${routing.transformationId} not found`,
      };
    }
    if (transformation.integrationId !== routing.integrationId) {
      return {
        kind: "canonical-integration-routing-result",
        ok: false,
        code: "INTEGRATION_ROUTING_TRANSFORMATION_INTEGRATION_MISMATCH",
        message: `transformation ${routing.transformationId} does not belong to integration ${routing.integrationId}`,
      };
    }
    const validation = this.validation.find(routing.validationId);
    if (!validation) {
      return {
        kind: "canonical-integration-routing-result",
        ok: false,
        code: "INTEGRATION_ROUTING_UNKNOWN_VALIDATION",
        message: `validation ${routing.validationId} not found`,
      };
    }
    if (validation.integrationId !== routing.integrationId) {
      return {
        kind: "canonical-integration-routing-result",
        ok: false,
        code: "INTEGRATION_ROUTING_VALIDATION_INTEGRATION_MISMATCH",
        message: `validation ${routing.validationId} does not belong to integration ${routing.integrationId}`,
      };
    }
    this.store.set(routing);
    return {
      kind: "canonical-integration-routing-result",
      ok: true,
      routeId: routing.routeId,
      route: routing,
      code: "INTEGRATION_ROUTING_REGISTERED",
      message: "routing registered",
    };
  }

  find(routeId: string): CanonicalIntegrationRouting | undefined {
    return this.store.get(routeId);
  }

  resolve(integrationId: string): CanonicalIntegrationRouting | undefined {
    return this.store.resolve(integrationId);
  }

  list(
    integrationId?: string,
    connectorId?: string,
    pipelineId?: string,
    mappingId?: string,
    transformationId?: string,
    validationId?: string,
    limit?: number,
    offset?: number,
  ): CanonicalIntegrationRouting[] {
    return this.store.list(
      integrationId,
      connectorId,
      pipelineId,
      mappingId,
      transformationId,
      validationId,
      limit,
      offset,
    );
  }

  stats(): CanonicalIntegrationRoutingStats {
    return this.store.stats();
  }
}
