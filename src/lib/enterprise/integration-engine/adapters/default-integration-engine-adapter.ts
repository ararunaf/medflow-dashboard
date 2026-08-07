/**
 * DefaultIntegrationEngineAdapter — F-01.
 *
 * Implementação oficial do IntegrationEnginePort.
 * Ativa apenas `integrationRegistryImplemented = true`.
 */
import { IntegrationRegistryEngine } from "../integration-registry";
import type {
  FindIntegrationInput,
  FindIntegrationResult,
  GetIntegrationRegistryStatsInput,
  GetIntegrationRegistryStatsResult,
  IntegrationEngineCapabilities,
  IntegrationEngineHealth,
  IntegrationEngineInfo,
  ListIntegrationsInput,
  ListIntegrationsResult,
  RegisterIntegrationInput,
  RegisterIntegrationResult,
} from "../ports";
import { F01_INTEGRATION_ENGINE_CAPABILITIES } from "../ports";
import type { IntegrationEnginePort } from "../ports";

export class DefaultIntegrationEngineAdapter implements IntegrationEnginePort {
  readonly providerId = "default";

  readonly registry: IntegrationRegistryEngine;

  constructor() {
    this.registry = new IntegrationRegistryEngine();
  }

  identity(): IntegrationEngineInfo {
    return {
      id: "enterprise-integration-engine",
      name: "Enterprise Integration Engine",
      version: "F-01",
      vendor: "generic",
      provider: this.providerId,
    };
  }

  getCapabilities(): IntegrationEngineCapabilities {
    return F01_INTEGRATION_ENGINE_CAPABILITIES;
  }

  async health(): Promise<IntegrationEngineHealth> {
    const caps = this.getCapabilities();
    return {
      ok: caps.integrationRegistryImplemented,
      integrationEngineOk: caps.integrationEngineImplemented,
      integrationRegistryOk: caps.integrationRegistryImplemented,
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
}
