/**
 * MockIntegrationEngineAdapter — F-03.
 *
 * Implementação em memória do IntegrationEnginePort para testes.
 * Ativa F-01, F-02 e F-03.
 */
import { IntegrationConnectorEngine } from "../integration-connector";
import { IntegrationPipelineEngine } from "../integration-pipeline";
import { IntegrationRegistryEngine } from "../integration-registry";
import type {
  FindIntegrationConnectorInput,
  FindIntegrationConnectorResult,
  FindIntegrationInput,
  FindIntegrationPipelineInput,
  FindIntegrationPipelineResult,
  FindIntegrationResult,
  GetIntegrationConnectorStatsInput,
  GetIntegrationConnectorStatsResult,
  GetIntegrationPipelineStatsInput,
  GetIntegrationPipelineStatsResult,
  GetIntegrationRegistryStatsInput,
  GetIntegrationRegistryStatsResult,
  IntegrationEngineCapabilities,
  IntegrationEngineHealth,
  IntegrationEngineInfo,
  ListIntegrationConnectorsInput,
  ListIntegrationConnectorsResult,
  ListIntegrationPipelinesInput,
  ListIntegrationPipelinesResult,
  ListIntegrationsInput,
  ListIntegrationsResult,
  RegisterIntegrationConnectorInput,
  RegisterIntegrationConnectorResult,
  RegisterIntegrationInput,
  RegisterIntegrationPipelineInput,
  RegisterIntegrationPipelineResult,
  RegisterIntegrationResult,
} from "../ports";
import { F03_INTEGRATION_ENGINE_CAPABILITIES } from "../ports";
import type { IntegrationEnginePort } from "../ports";

export class MockIntegrationEngineAdapter implements IntegrationEnginePort {
  readonly providerId = "mock";

  readonly registry: IntegrationRegistryEngine;
  readonly connector: IntegrationConnectorEngine;
  readonly pipeline: IntegrationPipelineEngine;

  constructor() {
    this.registry = new IntegrationRegistryEngine();
    this.connector = new IntegrationConnectorEngine(this.registry);
    this.pipeline = new IntegrationPipelineEngine(this.registry, this.connector);
  }

  identity(): IntegrationEngineInfo {
    return {
      id: "enterprise-integration-engine-mock",
      name: "Enterprise Integration Engine (Mock)",
      version: "F-03",
      vendor: "mock",
      provider: this.providerId,
    };
  }

  getCapabilities(): IntegrationEngineCapabilities {
    return F03_INTEGRATION_ENGINE_CAPABILITIES;
  }

  async health(): Promise<IntegrationEngineHealth> {
    const caps = this.getCapabilities();
    return {
      ok:
        caps.integrationRegistryImplemented &&
        caps.integrationConnectorImplemented &&
        caps.integrationPipelineImplemented,
      integrationEngineOk: caps.integrationEngineImplemented,
      integrationRegistryOk: caps.integrationRegistryImplemented,
      integrationConnectorOk: caps.integrationConnectorImplemented,
      integrationPipelineOk: caps.integrationPipelineImplemented,
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
      code: "MOCK_INTEGRATION_REGISTRY_LIST_OK",
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
        code: "MOCK_INTEGRATION_REGISTRY_STATS_OK",
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
      code: "MOCK_INTEGRATION_REGISTRY_STATS_OK",
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
      code: "MOCK_INTEGRATION_CONNECTOR_LIST_OK",
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
        code: "MOCK_INTEGRATION_CONNECTOR_STATS_OK",
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
      code: "MOCK_INTEGRATION_CONNECTOR_STATS_OK",
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
      code: "MOCK_INTEGRATION_PIPELINE_LIST_OK",
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
        code: "MOCK_INTEGRATION_PIPELINE_STATS_OK",
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
      code: "MOCK_INTEGRATION_PIPELINE_STATS_OK",
      message: "stats computed",
      stats,
    };
  }
}
