/**
 * DefaultIntegrationEngineAdapter — F-09.
 *
 * Implementação oficial do IntegrationEnginePort.
 * Ativa F-01, F-02, F-03, F-04, F-05, F-06, F-07, F-08 e F-09.
 */
import { IntegrationConnectorEngine } from "../integration-connector";
import { IntegrationMappingEngine } from "../integration-mapping";
import { IntegrationMonitoringEngine } from "../integration-monitoring";
import { IntegrationPipelineEngine } from "../integration-pipeline";
import { IntegrationRegistryEngine } from "../integration-registry";
import { IntegrationReportEngine } from "../integration-report";
import { IntegrationRoutingEngine } from "../integration-routing";
import { IntegrationTransformationEngine } from "../integration-transformation";
import { IntegrationValidationEngine } from "../integration-validation";
import type {
  FindIntegrationConnectorInput,
  FindIntegrationConnectorResult,
  FindIntegrationInput,
  FindIntegrationMappingInput,
  FindIntegrationMappingResult,
  FindIntegrationMonitoringInput,
  FindIntegrationMonitoringResult,
  FindIntegrationPipelineInput,
  FindIntegrationPipelineResult,
  FindIntegrationReportInput,
  FindIntegrationReportResult,
  FindIntegrationResult,
  FindIntegrationRoutingInput,
  FindIntegrationRoutingResult,
  FindIntegrationTransformationInput,
  FindIntegrationTransformationResult,
  FindIntegrationValidationInput,
  FindIntegrationValidationResult,
  GetIntegrationConnectorStatsInput,
  GetIntegrationConnectorStatsResult,
  GetIntegrationMappingStatsInput,
  GetIntegrationMappingStatsResult,
  GetIntegrationMonitoringStatsInput,
  GetIntegrationMonitoringStatsResult,
  GetIntegrationPipelineStatsInput,
  GetIntegrationPipelineStatsResult,
  GetIntegrationRegistryStatsInput,
  GetIntegrationRegistryStatsResult,
  GetIntegrationReportStatsInput,
  GetIntegrationReportStatsResult,
  GetIntegrationRoutingStatsInput,
  GetIntegrationRoutingStatsResult,
  GetIntegrationTransformationStatsInput,
  GetIntegrationTransformationStatsResult,
  GetIntegrationValidationStatsInput,
  GetIntegrationValidationStatsResult,
  IntegrationEngineCapabilities,
  IntegrationEngineHealth,
  IntegrationEngineInfo,
  ListIntegrationConnectorsInput,
  ListIntegrationConnectorsResult,
  ListIntegrationMappingsInput,
  ListIntegrationMappingsResult,
  ListIntegrationMonitoringsInput,
  ListIntegrationMonitoringsResult,
  ListIntegrationPipelinesInput,
  ListIntegrationPipelinesResult,
  ListIntegrationReportsInput,
  ListIntegrationReportsResult,
  ListIntegrationRoutingsInput,
  ListIntegrationRoutingsResult,
  ListIntegrationTransformationsInput,
  ListIntegrationTransformationsResult,
  ListIntegrationValidationsInput,
  ListIntegrationValidationsResult,
  ListIntegrationsInput,
  ListIntegrationsResult,
  RegisterIntegrationConnectorInput,
  RegisterIntegrationConnectorResult,
  RegisterIntegrationInput,
  RegisterIntegrationMappingInput,
  RegisterIntegrationMappingResult,
  RegisterIntegrationMonitoringInput,
  RegisterIntegrationMonitoringResult,
  RegisterIntegrationPipelineInput,
  RegisterIntegrationPipelineResult,
  RegisterIntegrationReportInput,
  RegisterIntegrationReportResult,
  RegisterIntegrationResult,
  RegisterIntegrationRoutingInput,
  RegisterIntegrationRoutingResult,
  RegisterIntegrationTransformationInput,
  RegisterIntegrationTransformationResult,
  RegisterIntegrationValidationInput,
  RegisterIntegrationValidationResult,
  ResolveIntegrationRoutingInput,
  ResolveIntegrationRoutingResult,
} from "../ports";
import { F09_INTEGRATION_ENGINE_CAPABILITIES } from "../ports";
import type { IntegrationEnginePort } from "../ports";

export class DefaultIntegrationEngineAdapter implements IntegrationEnginePort {
  readonly providerId = "default";

  readonly registry: IntegrationRegistryEngine;
  readonly connector: IntegrationConnectorEngine;
  readonly pipeline: IntegrationPipelineEngine;
  readonly mapping: IntegrationMappingEngine;
  readonly transformation: IntegrationTransformationEngine;
  readonly validation: IntegrationValidationEngine;
  readonly routing: IntegrationRoutingEngine;
  readonly monitoring: IntegrationMonitoringEngine;
  readonly report: IntegrationReportEngine;

  constructor() {
    this.registry = new IntegrationRegistryEngine();
    this.connector = new IntegrationConnectorEngine(this.registry);
    this.pipeline = new IntegrationPipelineEngine(this.registry, this.connector);
    this.mapping = new IntegrationMappingEngine(this.registry, this.connector, this.pipeline);
    this.transformation = new IntegrationTransformationEngine(
      this.registry,
      this.connector,
      this.pipeline,
      this.mapping,
    );
    this.validation = new IntegrationValidationEngine(
      this.registry,
      this.connector,
      this.pipeline,
      this.mapping,
      this.transformation,
    );
    this.routing = new IntegrationRoutingEngine(
      this.registry,
      this.connector,
      this.pipeline,
      this.mapping,
      this.transformation,
      this.validation,
    );
    this.monitoring = new IntegrationMonitoringEngine(
      this.registry,
      this.connector,
      this.pipeline,
      this.mapping,
      this.transformation,
      this.validation,
      this.routing,
    );
    this.report = new IntegrationReportEngine(
      this.registry,
      this.connector,
      this.pipeline,
      this.mapping,
      this.transformation,
      this.validation,
      this.routing,
      this.monitoring,
    );
  }

  identity(): IntegrationEngineInfo {
    return {
      id: "enterprise-integration-engine",
      name: "Enterprise Integration Engine",
      version: "F-09",
      vendor: "generic",
      provider: this.providerId,
    };
  }

  getCapabilities(): IntegrationEngineCapabilities {
    return F09_INTEGRATION_ENGINE_CAPABILITIES;
  }

  async health(): Promise<IntegrationEngineHealth> {
    const caps = this.getCapabilities();
    return {
      ok:
        caps.integrationRegistryImplemented &&
        caps.integrationConnectorImplemented &&
        caps.integrationPipelineImplemented &&
        caps.integrationMappingImplemented &&
        caps.integrationTransformationImplemented &&
        caps.integrationValidationImplemented &&
        caps.integrationRoutingImplemented &&
        caps.integrationMonitoringImplemented &&
        caps.integrationReportImplemented,
      integrationEngineOk: caps.integrationEngineImplemented,
      integrationRegistryOk: caps.integrationRegistryImplemented,
      integrationConnectorOk: caps.integrationConnectorImplemented,
      integrationPipelineOk: caps.integrationPipelineImplemented,
      integrationMappingOk: caps.integrationMappingImplemented,
      integrationTransformationOk: caps.integrationTransformationImplemented,
      integrationValidationOk: caps.integrationValidationImplemented,
      integrationRoutingOk: caps.integrationRoutingImplemented,
      integrationMonitoringOk: caps.integrationMonitoringImplemented,
      integrationReportOk: caps.integrationReportImplemented,
    };
  }

  async registerIntegration(input: RegisterIntegrationInput): Promise<RegisterIntegrationResult> {
    return this.registry.register(input.integration);
  }

  async findIntegration(input: FindIntegrationInput): Promise<FindIntegrationResult> {
    return this.registry.find(input.integrationId) ?? null;
  }

  async listIntegrations(input: ListIntegrationsInput): Promise<ListIntegrationsResult> {
    const integrations = this.registry.list(input.category, input.limit, input.offset);
    const total = input.category
      ? this.registry.list(input.category).length
      : this.registry.stats().totalIntegrations;
    return {
      ok: true,
      code: "INTEGRATION_REGISTRY_LIST_OK",
      message: `${integrations.length} integrations listed`,
      integrations,
      total,
    };
  }

  async getIntegrationRegistryStats(
    input: GetIntegrationRegistryStatsInput = {},
  ): Promise<GetIntegrationRegistryStatsResult> {
    const stats = this.registry.stats();
    if (input.category) {
      const filtered = this.registry.list(input.category);
      return {
        ok: true,
        code: "INTEGRATION_REGISTRY_STATS_OK",
        message: "stats filtered by category",
        stats: {
          ...stats,
          totalIntegrations: filtered.length,
          integrationIds: filtered.map((i) => i.integrationId),
        },
      };
    }
    return {
      ok: true,
      code: "INTEGRATION_REGISTRY_STATS_OK",
      message: "stats computed",
      stats,
    };
  }

  async registerIntegrationConnector(
    input: RegisterIntegrationConnectorInput,
  ): Promise<RegisterIntegrationConnectorResult> {
    return this.connector.register(input.connector);
  }

  async findIntegrationConnector(
    input: FindIntegrationConnectorInput,
  ): Promise<FindIntegrationConnectorResult> {
    return this.connector.find(input.connectorId) ?? null;
  }

  async listIntegrationConnectors(
    input: ListIntegrationConnectorsInput,
  ): Promise<ListIntegrationConnectorsResult> {
    const connectors = this.connector.list(input.integrationId, input.limit, input.offset);
    const total = input.integrationId
      ? this.connector.list(input.integrationId).length
      : this.connector.stats().totalConnectors;
    return {
      ok: true,
      code: "INTEGRATION_CONNECTOR_LIST_OK",
      message: `${connectors.length} connectors listed`,
      connectors,
      total,
    };
  }

  async getIntegrationConnectorStats(
    input: GetIntegrationConnectorStatsInput = {},
  ): Promise<GetIntegrationConnectorStatsResult> {
    const stats = this.connector.stats();
    if (input.integrationId) {
      const filtered = this.connector.list(input.integrationId);
      return {
        ok: true,
        code: "INTEGRATION_CONNECTOR_STATS_OK",
        message: "stats filtered by integrationId",
        stats: {
          ...stats,
          totalConnectors: filtered.length,
          connectorIds: filtered.map((c) => c.connectorId),
        },
      };
    }
    return {
      ok: true,
      code: "INTEGRATION_CONNECTOR_STATS_OK",
      message: "stats computed",
      stats,
    };
  }

  async registerIntegrationPipeline(
    input: RegisterIntegrationPipelineInput,
  ): Promise<RegisterIntegrationPipelineResult> {
    return this.pipeline.register(input.pipeline);
  }

  async findIntegrationPipeline(
    input: FindIntegrationPipelineInput,
  ): Promise<FindIntegrationPipelineResult> {
    return this.pipeline.find(input.pipelineId) ?? null;
  }

  async listIntegrationPipelines(
    input: ListIntegrationPipelinesInput,
  ): Promise<ListIntegrationPipelinesResult> {
    const pipelines = this.pipeline.list(input.integrationId, input.limit, input.offset);
    const total = input.integrationId
      ? this.pipeline.list(input.integrationId).length
      : this.pipeline.stats().totalPipelines;
    return {
      ok: true,
      code: "INTEGRATION_PIPELINE_LIST_OK",
      message: `${pipelines.length} pipelines listed`,
      pipelines,
      total,
    };
  }

  async getIntegrationPipelineStats(
    input: GetIntegrationPipelineStatsInput = {},
  ): Promise<GetIntegrationPipelineStatsResult> {
    const stats = this.pipeline.stats();
    if (input.integrationId) {
      const filtered = this.pipeline.list(input.integrationId);
      return {
        ok: true,
        code: "INTEGRATION_PIPELINE_STATS_OK",
        message: "stats filtered by integrationId",
        stats: {
          ...stats,
          totalPipelines: filtered.length,
          pipelineIds: filtered.map((p) => p.pipelineId),
        },
      };
    }
    return {
      ok: true,
      code: "INTEGRATION_PIPELINE_STATS_OK",
      message: "stats computed",
      stats,
    };
  }

  async registerIntegrationMapping(
    input: RegisterIntegrationMappingInput,
  ): Promise<RegisterIntegrationMappingResult> {
    return this.mapping.register(input.mapping);
  }

  async findIntegrationMapping(
    input: FindIntegrationMappingInput,
  ): Promise<FindIntegrationMappingResult> {
    return this.mapping.find(input.mappingId) ?? null;
  }

  async listIntegrationMappings(
    input: ListIntegrationMappingsInput,
  ): Promise<ListIntegrationMappingsResult> {
    const mappings = this.mapping.list(
      input.integrationId,
      input.pipelineId,
      input.connectorId,
      input.limit,
      input.offset,
    );
    const total = this.mapping.list(
      input.integrationId,
      input.pipelineId,
      input.connectorId,
    ).length;
    return {
      ok: true,
      code: "INTEGRATION_MAPPING_LIST_OK",
      message: `${mappings.length} mappings listed`,
      mappings,
      total,
    };
  }

  async getIntegrationMappingStats(
    input: GetIntegrationMappingStatsInput = {},
  ): Promise<GetIntegrationMappingStatsResult> {
    const stats = this.mapping.stats();
    const filtered = this.mapping.list(input.integrationId, input.pipelineId, input.connectorId);
    return {
      ok: true,
      code: "INTEGRATION_MAPPING_STATS_OK",
      message: "stats computed",
      stats: {
        ...stats,
        totalMappings: filtered.length,
        mappingIds: filtered.map((m) => m.mappingId),
      },
    };
  }

  async registerIntegrationTransformation(
    input: RegisterIntegrationTransformationInput,
  ): Promise<RegisterIntegrationTransformationResult> {
    return this.transformation.register(input.transformation);
  }

  async findIntegrationTransformation(
    input: FindIntegrationTransformationInput,
  ): Promise<FindIntegrationTransformationResult> {
    return this.transformation.find(input.transformationId) ?? null;
  }

  async listIntegrationTransformations(
    input: ListIntegrationTransformationsInput,
  ): Promise<ListIntegrationTransformationsResult> {
    const transformations = this.transformation.list(
      input.integrationId,
      input.pipelineId,
      input.connectorId,
      input.mappingId,
      input.limit,
      input.offset,
    );
    const total = this.transformation.list(
      input.integrationId,
      input.pipelineId,
      input.connectorId,
      input.mappingId,
    ).length;
    return {
      ok: true,
      code: "INTEGRATION_TRANSFORMATION_LIST_OK",
      message: `${transformations.length} transformations listed`,
      transformations,
      total,
    };
  }

  async getIntegrationTransformationStats(
    input: GetIntegrationTransformationStatsInput = {},
  ): Promise<GetIntegrationTransformationStatsResult> {
    const stats = this.transformation.stats();
    const filtered = this.transformation.list(
      input.integrationId,
      input.pipelineId,
      input.connectorId,
      input.mappingId,
    );
    return {
      ok: true,
      code: "INTEGRATION_TRANSFORMATION_STATS_OK",
      message: "stats computed",
      stats: {
        ...stats,
        totalTransformations: filtered.length,
        transformationIds: filtered.map((t) => t.transformationId),
      },
    };
  }

  async registerIntegrationValidation(
    input: RegisterIntegrationValidationInput,
  ): Promise<RegisterIntegrationValidationResult> {
    return this.validation.register(input.validation);
  }

  async findIntegrationValidation(
    input: FindIntegrationValidationInput,
  ): Promise<FindIntegrationValidationResult> {
    return this.validation.find(input.validationId) ?? null;
  }

  async listIntegrationValidations(
    input: ListIntegrationValidationsInput,
  ): Promise<ListIntegrationValidationsResult> {
    const validations = this.validation.list(
      input.integrationId,
      input.connectorId,
      input.pipelineId,
      input.mappingId,
      input.transformationId,
      input.limit,
      input.offset,
    );
    const total = this.validation.list(
      input.integrationId,
      input.connectorId,
      input.pipelineId,
      input.mappingId,
      input.transformationId,
    ).length;
    return {
      ok: true,
      code: "INTEGRATION_VALIDATION_LIST_OK",
      message: `${validations.length} validations listed`,
      validations,
      total,
    };
  }

  async getIntegrationValidationStats(
    input: GetIntegrationValidationStatsInput = {},
  ): Promise<GetIntegrationValidationStatsResult> {
    const stats = this.validation.stats();
    const filtered = this.validation.list(
      input.integrationId,
      input.connectorId,
      input.pipelineId,
      input.mappingId,
      input.transformationId,
    );
    return {
      ok: true,
      code: "INTEGRATION_VALIDATION_STATS_OK",
      message: "stats computed",
      stats: {
        ...stats,
        totalValidations: filtered.length,
        validationIds: filtered.map((v) => v.validationId),
      },
    };
  }

  async registerIntegrationRouting(
    input: RegisterIntegrationRoutingInput,
  ): Promise<RegisterIntegrationRoutingResult> {
    return this.routing.register(input.routing);
  }

  async findIntegrationRouting(
    input: FindIntegrationRoutingInput,
  ): Promise<FindIntegrationRoutingResult> {
    return this.routing.find(input.routeId) ?? null;
  }

  async resolveIntegrationRouting(
    input: ResolveIntegrationRoutingInput,
  ): Promise<ResolveIntegrationRoutingResult> {
    const route = this.routing.resolve(input.integrationId);
    if (!route) {
      return {
        ok: false,
        code: "INTEGRATION_ROUTING_NOT_FOUND",
        message: `no route for integration ${input.integrationId}`,
        route: null,
      };
    }
    return {
      ok: true,
      code: "INTEGRATION_ROUTING_RESOLVED",
      message: `route resolved for integration ${input.integrationId}`,
      route,
    };
  }

  async listIntegrationRoutings(
    input: ListIntegrationRoutingsInput,
  ): Promise<ListIntegrationRoutingsResult> {
    const routings = this.routing.list(
      input.integrationId,
      input.connectorId,
      input.pipelineId,
      input.mappingId,
      input.transformationId,
      input.validationId,
      input.limit,
      input.offset,
    );
    const total = this.routing.list(
      input.integrationId,
      input.connectorId,
      input.pipelineId,
      input.mappingId,
      input.transformationId,
      input.validationId,
    ).length;
    return {
      ok: true,
      code: "INTEGRATION_ROUTING_LIST_OK",
      message: `${routings.length} routings listed`,
      routings,
      total,
    };
  }

  async getIntegrationRoutingStats(
    input: GetIntegrationRoutingStatsInput = {},
  ): Promise<GetIntegrationRoutingStatsResult> {
    const stats = this.routing.stats();
    const filtered = this.routing.list(
      input.integrationId,
      input.connectorId,
      input.pipelineId,
      input.mappingId,
      input.transformationId,
      input.validationId,
    );
    return {
      ok: true,
      code: "INTEGRATION_ROUTING_STATS_OK",
      message: "stats computed",
      stats: {
        ...stats,
        totalRoutes: filtered.length,
        routeIds: filtered.map((r) => r.routeId),
      },
    };
  }

  async registerIntegrationMonitoring(
    input: RegisterIntegrationMonitoringInput,
  ): Promise<RegisterIntegrationMonitoringResult> {
    return this.monitoring.register(input.monitoring);
  }

  async findIntegrationMonitoring(
    input: FindIntegrationMonitoringInput,
  ): Promise<FindIntegrationMonitoringResult> {
    return this.monitoring.find(input.monitoringId) ?? null;
  }

  async listIntegrationMonitorings(
    input: ListIntegrationMonitoringsInput,
  ): Promise<ListIntegrationMonitoringsResult> {
    const monitorings = this.monitoring.list(
      input.integrationId,
      input.routeId,
      input.connectorId,
      input.pipelineId,
      input.mappingId,
      input.transformationId,
      input.validationId,
      input.status,
      input.limit,
      input.offset,
    );
    const total = this.monitoring.list(
      input.integrationId,
      input.routeId,
      input.connectorId,
      input.pipelineId,
      input.mappingId,
      input.transformationId,
      input.validationId,
      input.status,
    ).length;
    return {
      ok: true,
      code: "INTEGRATION_MONITORING_LIST_OK",
      message: `${monitorings.length} monitorings listed`,
      monitorings,
      total,
    };
  }

  async getIntegrationMonitoringStats(
    input: GetIntegrationMonitoringStatsInput = {},
  ): Promise<GetIntegrationMonitoringStatsResult> {
    const stats = this.monitoring.stats();
    const filtered = this.monitoring.list(
      input.integrationId,
      input.routeId,
      input.connectorId,
      input.pipelineId,
      input.mappingId,
      input.transformationId,
      input.validationId,
    );
    return {
      ok: true,
      code: "INTEGRATION_MONITORING_STATS_OK",
      message: "stats computed",
      stats: {
        ...stats,
        totalMonitorings: filtered.length,
        monitoringIds: filtered.map((m) => m.monitoringId),
      },
    };
  }

  async registerIntegrationReport(
    input: RegisterIntegrationReportInput,
  ): Promise<RegisterIntegrationReportResult> {
    return this.report.register(input.report);
  }

  async findIntegrationReport(
    input: FindIntegrationReportInput,
  ): Promise<FindIntegrationReportResult> {
    return this.report.find(input.reportId) ?? null;
  }

  async listIntegrationReports(
    input: ListIntegrationReportsInput,
  ): Promise<ListIntegrationReportsResult> {
    const reports = this.report.list(
      input.integrationId,
      input.monitoringId,
      input.limit,
      input.offset,
    );
    const total = this.report.list(input.integrationId, input.monitoringId).length;
    return {
      ok: true,
      code: "INTEGRATION_REPORT_LIST_OK",
      message: `${reports.length} reports listed`,
      reports,
      total,
    };
  }

  async getIntegrationReportStats(
    input: GetIntegrationReportStatsInput = {},
  ): Promise<GetIntegrationReportStatsResult> {
    const stats = this.report.stats();
    const filtered = this.report.list(input.integrationId, input.monitoringId);
    return {
      ok: true,
      code: "INTEGRATION_REPORT_STATS_OK",
      message: "stats computed",
      stats: {
        ...stats,
        totalReports: filtered.length,
        reportIds: filtered.map((r) => r.reportId),
      },
    };
  }
}
