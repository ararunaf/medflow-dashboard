/**
 * MockIntegrationEngineAdapter — F-02.
 *
 * Implementação em memória do IntegrationEnginePort para testes.
 * Ativa `integrationRegistryImplemented = true` e `integrationConnectorImplemented = true`.
 */
import { IntegrationConnectorEngine } from "../integration-connector";
import { IntegrationRegistryEngine } from "../integration-registry";
import type {
  FindIntegrationConnectorInput,
  FindIntegrationConnectorResult,
  FindIntegrationInput,
  FindIntegrationResult,
  GetIntegrationConnectorStatsInput,
  GetIntegrationConnectorStatsResult,
  GetIntegrationRegistryStatsInput,
  GetIntegrationRegistryStatsResult,
  IntegrationEngineCapabilities,
  IntegrationEngineHealth,
  IntegrationEngineInfo,
  ListIntegrationConnectorsInput,
  ListIntegrationConnectorsResult,
  ListIntegrationsInput,
  ListIntegrationsResult,
  RegisterIntegrationConnectorInput,
  RegisterIntegrationConnectorResult,
  RegisterIntegrationInput,
  RegisterIntegrationResult,
} from "../ports";
import { F02_INTEGRATION_ENGINE_CAPABILITIES } from "../ports";
import type { IntegrationEnginePort } from "../ports";

export class MockIntegrationEngineAdapter implements IntegrationEnginePort {
  readonly providerId = "mock";

  readonly registry: IntegrationRegistryEngine;
  readonly connector: IntegrationConnectorEngine;

  constructor() {
    this.registry = new IntegrationRegistryEngine();
    this.connector = new IntegrationConnectorEngine(this.registry);
  }

  identity(): IntegrationEngineInfo {
    return {
      id: "enterprise-integration-engine-mock",
      name: "Enterprise Integration Engine (Mock)",
      version: "F-02",
      vendor: "mock",
      provider: this.providerId,
    };
  }

  getCapabilities(): IntegrationEngineCapabilities {
    return F02_INTEGRATION_ENGINE_CAPABILITIES;
  }

  async health(): Promise<IntegrationEngineHealth> {
    const caps = this.getCapabilities();
    return {
      ok: caps.integrationRegistryImplemented && caps.integrationConnectorImplemented,
      integrationEngineOk: caps.integrationEngineImplemented,
      integrationRegistryOk: caps.integrationRegistryImplemented,
      integrationConnectorOk: caps.integrationConnectorImplemented,
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
}
