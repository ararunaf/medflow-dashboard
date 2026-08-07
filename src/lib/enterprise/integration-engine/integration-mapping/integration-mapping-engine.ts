/**
 * IntegrationMappingEngine — F-04.
 *
 * Catálogo genérico de mappings. Apenas descreve correspondência entre campos de origem e destino.
 * Não transforma valores. Não valida conteúdo. Não acessa banco ou APIs.
 * Reutiliza IntegrationRegistryEngine, IntegrationConnectorEngine e IntegrationPipelineEngine.
 */
import type {
  CanonicalIntegrationMapping,
  CanonicalIntegrationMappingResult,
  CanonicalIntegrationMappingStats,
} from "../ports/canonical";
import { IntegrationConnectorEngine } from "../integration-connector";
import { IntegrationPipelineEngine } from "../integration-pipeline";
import { IntegrationRegistryEngine } from "../integration-registry";

export interface IntegrationMappingStore {
  get(mappingId: string): CanonicalIntegrationMapping | undefined;
  set(mapping: CanonicalIntegrationMapping): void;
  list(
    integrationId?: string,
    pipelineId?: string,
    connectorId?: string,
    limit?: number,
    offset?: number,
  ): CanonicalIntegrationMapping[];
  all(): CanonicalIntegrationMapping[];
  stats(): CanonicalIntegrationMappingStats;
}

export class InMemoryIntegrationMappingStore implements IntegrationMappingStore {
  private readonly mappings = new Map<string, CanonicalIntegrationMapping>();

  get(mappingId: string): CanonicalIntegrationMapping | undefined {
    return this.mappings.get(mappingId);
  }

  set(mapping: CanonicalIntegrationMapping): void {
    this.mappings.set(mapping.mappingId, mapping);
  }

  all(): CanonicalIntegrationMapping[] {
    return Array.from(this.mappings.values());
  }

  list(
    integrationId?: string,
    pipelineId?: string,
    connectorId?: string,
    limit = Number.POSITIVE_INFINITY,
    offset = 0,
  ): CanonicalIntegrationMapping[] {
    const all = this.all();
    const filtered = all.filter((m) => {
      if (integrationId && m.integrationId !== integrationId) return false;
      if (pipelineId && m.pipelineId !== pipelineId) return false;
      if (connectorId && m.connectorId !== connectorId) return false;
      return true;
    });
    return filtered.slice(offset, offset + limit);
  }

  stats(): CanonicalIntegrationMappingStats {
    const all = this.all();
    const integrationIds = new Set<string>();
    const connectorIds = new Set<string>();
    const pipelineIds = new Set<string>();
    const tags = new Set<string>();
    for (const mapping of all) {
      integrationIds.add(mapping.integrationId);
      connectorIds.add(mapping.connectorId);
      pipelineIds.add(mapping.pipelineId);
      for (const tag of mapping.tags ?? []) tags.add(tag);
    }
    return {
      totalMappings: all.length,
      mappingIds: all.map((m) => m.mappingId),
      integrationIds: Array.from(integrationIds),
      connectorIds: Array.from(connectorIds),
      pipelineIds: Array.from(pipelineIds),
      tags: Array.from(tags),
    };
  }
}

export class IntegrationMappingEngine {
  constructor(
    private readonly registry: IntegrationRegistryEngine,
    private readonly connector: IntegrationConnectorEngine,
    private readonly pipeline: IntegrationPipelineEngine,
    private readonly store: IntegrationMappingStore = new InMemoryIntegrationMappingStore(),
  ) {}

  register(mapping: CanonicalIntegrationMapping): CanonicalIntegrationMappingResult {
    if (!mapping.mappingId || mapping.mappingId.trim() === "") {
      return {
        kind: "canonical-integration-mapping-result",
        ok: false,
        code: "INTEGRATION_MAPPING_INVALID_ID",
        message: "mappingId is required",
      };
    }
    if (!mapping.integrationId || mapping.integrationId.trim() === "") {
      return {
        kind: "canonical-integration-mapping-result",
        ok: false,
        code: "INTEGRATION_MAPPING_INVALID_INTEGRATION_ID",
        message: "integrationId is required",
      };
    }
    if (!mapping.connectorId || mapping.connectorId.trim() === "") {
      return {
        kind: "canonical-integration-mapping-result",
        ok: false,
        code: "INTEGRATION_MAPPING_INVALID_CONNECTOR_ID",
        message: "connectorId is required",
      };
    }
    if (!mapping.pipelineId || mapping.pipelineId.trim() === "") {
      return {
        kind: "canonical-integration-mapping-result",
        ok: false,
        code: "INTEGRATION_MAPPING_INVALID_PIPELINE_ID",
        message: "pipelineId is required",
      };
    }
    if (!mapping.name || mapping.name.trim() === "") {
      return {
        kind: "canonical-integration-mapping-result",
        ok: false,
        code: "INTEGRATION_MAPPING_INVALID_NAME",
        message: "name is required",
      };
    }
    const integration = this.registry.find(mapping.integrationId);
    if (!integration) {
      return {
        kind: "canonical-integration-mapping-result",
        ok: false,
        code: "INTEGRATION_MAPPING_UNKNOWN_INTEGRATION",
        message: `integration ${mapping.integrationId} not found`,
      };
    }
    const connector = this.connector.find(mapping.connectorId);
    if (!connector) {
      return {
        kind: "canonical-integration-mapping-result",
        ok: false,
        code: "INTEGRATION_MAPPING_UNKNOWN_CONNECTOR",
        message: `connector ${mapping.connectorId} not found`,
      };
    }
    if (connector.integrationId !== mapping.integrationId) {
      return {
        kind: "canonical-integration-mapping-result",
        ok: false,
        code: "INTEGRATION_MAPPING_CONNECTOR_INTEGRATION_MISMATCH",
        message: `connector ${mapping.connectorId} does not belong to integration ${mapping.integrationId}`,
      };
    }
    const pipeline = this.pipeline.find(mapping.pipelineId);
    if (!pipeline) {
      return {
        kind: "canonical-integration-mapping-result",
        ok: false,
        code: "INTEGRATION_MAPPING_UNKNOWN_PIPELINE",
        message: `pipeline ${mapping.pipelineId} not found`,
      };
    }
    if (pipeline.integrationId !== mapping.integrationId) {
      return {
        kind: "canonical-integration-mapping-result",
        ok: false,
        code: "INTEGRATION_MAPPING_PIPELINE_INTEGRATION_MISMATCH",
        message: `pipeline ${mapping.pipelineId} does not belong to integration ${mapping.integrationId}`,
      };
    }
    if (mapping.rules.length === 0) {
      return {
        kind: "canonical-integration-mapping-result",
        ok: false,
        code: "INTEGRATION_MAPPING_EMPTY_RULES",
        message: "at least one mapping rule is required",
      };
    }
    const ruleIds = new Set<string>();
    for (const rule of mapping.rules) {
      if (!rule.ruleId || rule.ruleId.trim() === "") {
        return {
          kind: "canonical-integration-mapping-result",
          ok: false,
          code: "INTEGRATION_MAPPING_INVALID_RULE_ID",
          message: "ruleId is required",
        };
      }
      if (!rule.sourcePath || rule.sourcePath.trim() === "") {
        return {
          kind: "canonical-integration-mapping-result",
          ok: false,
          code: "INTEGRATION_MAPPING_INVALID_SOURCE_PATH",
          message: "sourcePath is required",
        };
      }
      if (!rule.targetPath || rule.targetPath.trim() === "") {
        return {
          kind: "canonical-integration-mapping-result",
          ok: false,
          code: "INTEGRATION_MAPPING_INVALID_TARGET_PATH",
          message: "targetPath is required",
        };
      }
      if (ruleIds.has(rule.ruleId)) {
        return {
          kind: "canonical-integration-mapping-result",
          ok: false,
          code: "INTEGRATION_MAPPING_DUPLICATE_RULE_ID",
          message: `duplicate ruleId ${rule.ruleId}`,
        };
      }
      ruleIds.add(rule.ruleId);
    }
    this.store.set(mapping);
    return {
      kind: "canonical-integration-mapping-result",
      ok: true,
      mappingId: mapping.mappingId,
      mapping,
      code: "INTEGRATION_MAPPING_REGISTERED",
      message: "mapping registered",
    };
  }

  find(mappingId: string): CanonicalIntegrationMapping | undefined {
    return this.store.get(mappingId);
  }

  list(
    integrationId?: string,
    pipelineId?: string,
    connectorId?: string,
    limit?: number,
    offset?: number,
  ): CanonicalIntegrationMapping[] {
    return this.store.list(integrationId, pipelineId, connectorId, limit, offset);
  }

  stats(): CanonicalIntegrationMappingStats {
    return this.store.stats();
  }
}
