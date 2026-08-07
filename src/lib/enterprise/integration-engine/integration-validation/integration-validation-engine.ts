/**
 * IntegrationValidationEngine — F-06.
 *
 * Catálogo e validador estrutural de definições de integração.
 * Apenas valida que uma configuração de integração referencia corretamente
 * Registry, Connector, Pipeline, Mapping e Transformation já resolvidos.
 * Não valida conteúdo, não conhece domínio médico, TISS, operadoras ou formatos específicos.
 * Não acessa banco ou APIs.
 */
import type {
  CanonicalIntegrationValidation,
  CanonicalIntegrationValidationResult,
  CanonicalIntegrationValidationStats,
} from "../ports/canonical";
import { IntegrationConnectorEngine } from "../integration-connector";
import { IntegrationMappingEngine } from "../integration-mapping";
import { IntegrationPipelineEngine } from "../integration-pipeline";
import { IntegrationRegistryEngine } from "../integration-registry";
import { IntegrationTransformationEngine } from "../integration-transformation";

export interface IntegrationValidationStore {
  get(validationId: string): CanonicalIntegrationValidation | undefined;
  set(validation: CanonicalIntegrationValidation): void;
  list(
    integrationId?: string,
    connectorId?: string,
    pipelineId?: string,
    mappingId?: string,
    transformationId?: string,
    limit?: number,
    offset?: number,
  ): CanonicalIntegrationValidation[];
  all(): CanonicalIntegrationValidation[];
  stats(): CanonicalIntegrationValidationStats;
}

export class InMemoryIntegrationValidationStore implements IntegrationValidationStore {
  private readonly validations = new Map<string, CanonicalIntegrationValidation>();

  get(validationId: string): CanonicalIntegrationValidation | undefined {
    return this.validations.get(validationId);
  }

  set(validation: CanonicalIntegrationValidation): void {
    this.validations.set(validation.validationId, validation);
  }

  all(): CanonicalIntegrationValidation[] {
    return Array.from(this.validations.values());
  }

  list(
    integrationId?: string,
    connectorId?: string,
    pipelineId?: string,
    mappingId?: string,
    transformationId?: string,
    limit = Number.POSITIVE_INFINITY,
    offset = 0,
  ): CanonicalIntegrationValidation[] {
    const all = this.all();
    const filtered = all.filter((v) => {
      if (integrationId && v.integrationId !== integrationId) return false;
      if (connectorId && v.connectorId !== connectorId) return false;
      if (pipelineId && v.pipelineId !== pipelineId) return false;
      if (mappingId && v.mappingId !== mappingId) return false;
      if (transformationId && v.transformationId !== transformationId) return false;
      return true;
    });
    return filtered.slice(offset, offset + limit);
  }

  stats(): CanonicalIntegrationValidationStats {
    const all = this.all();
    const integrationIds = new Set<string>();
    const connectorIds = new Set<string>();
    const pipelineIds = new Set<string>();
    const mappingIds = new Set<string>();
    const transformationIds = new Set<string>();
    const tags = new Set<string>();
    for (const v of all) {
      integrationIds.add(v.integrationId);
      connectorIds.add(v.connectorId);
      pipelineIds.add(v.pipelineId);
      mappingIds.add(v.mappingId);
      transformationIds.add(v.transformationId);
      for (const tag of v.tags ?? []) tags.add(tag);
    }
    return {
      totalValidations: all.length,
      validationIds: all.map((v) => v.validationId),
      integrationIds: Array.from(integrationIds),
      connectorIds: Array.from(connectorIds),
      pipelineIds: Array.from(pipelineIds),
      mappingIds: Array.from(mappingIds),
      transformationIds: Array.from(transformationIds),
      tags: Array.from(tags),
    };
  }
}

export class IntegrationValidationEngine {
  constructor(
    private readonly registry: IntegrationRegistryEngine,
    private readonly connector: IntegrationConnectorEngine,
    private readonly pipeline: IntegrationPipelineEngine,
    private readonly mapping: IntegrationMappingEngine,
    private readonly transformation: IntegrationTransformationEngine,
    private readonly store: IntegrationValidationStore = new InMemoryIntegrationValidationStore(),
  ) {}

  register(validation: CanonicalIntegrationValidation): CanonicalIntegrationValidationResult {
    if (!validation.validationId || validation.validationId.trim() === "") {
      return {
        kind: "canonical-integration-validation-result",
        ok: false,
        code: "INTEGRATION_VALIDATION_INVALID_ID",
        message: "validationId is required",
      };
    }
    if (!validation.integrationId || validation.integrationId.trim() === "") {
      return {
        kind: "canonical-integration-validation-result",
        ok: false,
        code: "INTEGRATION_VALIDATION_INVALID_INTEGRATION_ID",
        message: "integrationId is required",
      };
    }
    if (!validation.connectorId || validation.connectorId.trim() === "") {
      return {
        kind: "canonical-integration-validation-result",
        ok: false,
        code: "INTEGRATION_VALIDATION_INVALID_CONNECTOR_ID",
        message: "connectorId is required",
      };
    }
    if (!validation.pipelineId || validation.pipelineId.trim() === "") {
      return {
        kind: "canonical-integration-validation-result",
        ok: false,
        code: "INTEGRATION_VALIDATION_INVALID_PIPELINE_ID",
        message: "pipelineId is required",
      };
    }
    if (!validation.mappingId || validation.mappingId.trim() === "") {
      return {
        kind: "canonical-integration-validation-result",
        ok: false,
        code: "INTEGRATION_VALIDATION_INVALID_MAPPING_ID",
        message: "mappingId is required",
      };
    }
    if (!validation.transformationId || validation.transformationId.trim() === "") {
      return {
        kind: "canonical-integration-validation-result",
        ok: false,
        code: "INTEGRATION_VALIDATION_INVALID_TRANSFORMATION_ID",
        message: "transformationId is required",
      };
    }
    if (!validation.name || validation.name.trim() === "") {
      return {
        kind: "canonical-integration-validation-result",
        ok: false,
        code: "INTEGRATION_VALIDATION_INVALID_NAME",
        message: "name is required",
      };
    }
    const integration = this.registry.find(validation.integrationId);
    if (!integration) {
      return {
        kind: "canonical-integration-validation-result",
        ok: false,
        code: "INTEGRATION_VALIDATION_UNKNOWN_INTEGRATION",
        message: `integration ${validation.integrationId} not found`,
      };
    }
    const connector = this.connector.find(validation.connectorId);
    if (!connector) {
      return {
        kind: "canonical-integration-validation-result",
        ok: false,
        code: "INTEGRATION_VALIDATION_UNKNOWN_CONNECTOR",
        message: `connector ${validation.connectorId} not found`,
      };
    }
    if (connector.integrationId !== validation.integrationId) {
      return {
        kind: "canonical-integration-validation-result",
        ok: false,
        code: "INTEGRATION_VALIDATION_CONNECTOR_INTEGRATION_MISMATCH",
        message: `connector ${validation.connectorId} does not belong to integration ${validation.integrationId}`,
      };
    }
    const pipeline = this.pipeline.find(validation.pipelineId);
    if (!pipeline) {
      return {
        kind: "canonical-integration-validation-result",
        ok: false,
        code: "INTEGRATION_VALIDATION_UNKNOWN_PIPELINE",
        message: `pipeline ${validation.pipelineId} not found`,
      };
    }
    if (pipeline.integrationId !== validation.integrationId) {
      return {
        kind: "canonical-integration-validation-result",
        ok: false,
        code: "INTEGRATION_VALIDATION_PIPELINE_INTEGRATION_MISMATCH",
        message: `pipeline ${validation.pipelineId} does not belong to integration ${validation.integrationId}`,
      };
    }
    const mapping = this.mapping.find(validation.mappingId);
    if (!mapping) {
      return {
        kind: "canonical-integration-validation-result",
        ok: false,
        code: "INTEGRATION_VALIDATION_UNKNOWN_MAPPING",
        message: `mapping ${validation.mappingId} not found`,
      };
    }
    if (mapping.integrationId !== validation.integrationId) {
      return {
        kind: "canonical-integration-validation-result",
        ok: false,
        code: "INTEGRATION_VALIDATION_MAPPING_INTEGRATION_MISMATCH",
        message: `mapping ${validation.mappingId} does not belong to integration ${validation.integrationId}`,
      };
    }
    const transformation = this.transformation.find(validation.transformationId);
    if (!transformation) {
      return {
        kind: "canonical-integration-validation-result",
        ok: false,
        code: "INTEGRATION_VALIDATION_UNKNOWN_TRANSFORMATION",
        message: `transformation ${validation.transformationId} not found`,
      };
    }
    if (transformation.integrationId !== validation.integrationId) {
      return {
        kind: "canonical-integration-validation-result",
        ok: false,
        code: "INTEGRATION_VALIDATION_TRANSFORMATION_INTEGRATION_MISMATCH",
        message: `transformation ${validation.transformationId} does not belong to integration ${validation.integrationId}`,
      };
    }
    this.store.set(validation);
    return {
      kind: "canonical-integration-validation-result",
      ok: true,
      validationId: validation.validationId,
      validation,
      code: "INTEGRATION_VALIDATION_REGISTERED",
      message: "validation registered",
    };
  }

  find(validationId: string): CanonicalIntegrationValidation | undefined {
    return this.store.get(validationId);
  }

  list(
    integrationId?: string,
    connectorId?: string,
    pipelineId?: string,
    mappingId?: string,
    transformationId?: string,
    limit?: number,
    offset?: number,
  ): CanonicalIntegrationValidation[] {
    return this.store.list(
      integrationId,
      connectorId,
      pipelineId,
      mappingId,
      transformationId,
      limit,
      offset,
    );
  }

  stats(): CanonicalIntegrationValidationStats {
    return this.store.stats();
  }
}
