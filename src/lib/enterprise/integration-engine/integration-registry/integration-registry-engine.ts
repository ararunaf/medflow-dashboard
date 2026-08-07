/**
 * IntegrationRegistryEngine — F-01.
 *
 * Catálogo genérico de integrações. Apenas metadados.
 * Sem conexão externa. Sem banco. Sem TISS/ANS/Operadoras/Convênios.
 */
import type {
  CanonicalIntegration,
  CanonicalIntegrationRegistryResult,
  CanonicalIntegrationRegistryStats,
} from "../ports/canonical";

export interface IntegrationRegistryStore {
  get(integrationId: string): CanonicalIntegration | undefined;
  set(integration: CanonicalIntegration): void;
  list(category?: string, limit?: number, offset?: number): CanonicalIntegration[];
  all(): CanonicalIntegration[];
  stats(): CanonicalIntegrationRegistryStats;
}

export class InMemoryIntegrationRegistryStore implements IntegrationRegistryStore {
  private readonly integrations = new Map<string, CanonicalIntegration>();

  get(integrationId: string): CanonicalIntegration | undefined {
    return this.integrations.get(integrationId);
  }

  set(integration: CanonicalIntegration): void {
    this.integrations.set(integration.integrationId, integration);
  }

  all(): CanonicalIntegration[] {
    return Array.from(this.integrations.values());
  }

  list(category?: string, limit = Number.POSITIVE_INFINITY, offset = 0): CanonicalIntegration[] {
    const all = this.all();
    const filtered = category ? all.filter((i) => i.category === category) : all;
    return filtered.slice(offset, offset + limit);
  }

  stats(): CanonicalIntegrationRegistryStats {
    const all = this.all();
    const categories = new Set<string>();
    const tags = new Set<string>();
    for (const integration of all) {
      if (integration.category) categories.add(integration.category);
      for (const tag of integration.tags ?? []) tags.add(tag);
    }
    return {
      totalIntegrations: all.length,
      integrationIds: all.map((i) => i.integrationId),
      categories: Array.from(categories),
      tags: Array.from(tags),
    };
  }
}

export class IntegrationRegistryEngine {
  constructor(
    private readonly store: IntegrationRegistryStore = new InMemoryIntegrationRegistryStore(),
  ) {}

  register(integration: CanonicalIntegration): CanonicalIntegrationRegistryResult {
    if (!integration.integrationId || integration.integrationId.trim() === "") {
      return {
        kind: "canonical-integration-registry-result",
        ok: false,
        code: "INTEGRATION_REGISTRY_INVALID_ID",
        message: "integrationId is required",
      };
    }
    if (!integration.name || integration.name.trim() === "") {
      return {
        kind: "canonical-integration-registry-result",
        ok: false,
        code: "INTEGRATION_REGISTRY_INVALID_NAME",
        message: "name is required",
      };
    }
    this.store.set(integration);
    return {
      kind: "canonical-integration-registry-result",
      ok: true,
      integrationId: integration.integrationId,
      integration,
      code: "INTEGRATION_REGISTRY_REGISTERED",
      message: "integration registered",
    };
  }

  find(integrationId: string): CanonicalIntegration | undefined {
    return this.store.get(integrationId);
  }

  list(category?: string, limit?: number, offset?: number): CanonicalIntegration[] {
    return this.store.list(category, limit, offset);
  }

  stats(): CanonicalIntegrationRegistryStats {
    return this.store.stats();
  }
}
