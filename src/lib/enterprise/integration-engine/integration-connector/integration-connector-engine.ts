/**
 * IntegrationConnectorEngine — F-02.
 *
 * Catálogo genérico de conectores. Apenas metadados.
 * Não abre conexão. Não consome APIs. Não lê arquivos.
 * Reutiliza IntegrationRegistryEngine para validar existência da integração.
 */
import type {
  CanonicalIntegrationConnector,
  CanonicalIntegrationConnectorResult,
  CanonicalIntegrationConnectorStats,
} from "../ports/canonical";
import { IntegrationRegistryEngine } from "../integration-registry";

export interface IntegrationConnectorStore {
  get(connectorId: string): CanonicalIntegrationConnector | undefined;
  set(connector: CanonicalIntegrationConnector): void;
  list(integrationId?: string, limit?: number, offset?: number): CanonicalIntegrationConnector[];
  all(): CanonicalIntegrationConnector[];
  stats(): CanonicalIntegrationConnectorStats;
}

export class InMemoryIntegrationConnectorStore implements IntegrationConnectorStore {
  private readonly connectors = new Map<string, CanonicalIntegrationConnector>();

  get(connectorId: string): CanonicalIntegrationConnector | undefined {
    return this.connectors.get(connectorId);
  }

  set(connector: CanonicalIntegrationConnector): void {
    this.connectors.set(connector.connectorId, connector);
  }

  all(): CanonicalIntegrationConnector[] {
    return Array.from(this.connectors.values());
  }

  list(
    integrationId?: string,
    limit = Number.POSITIVE_INFINITY,
    offset = 0,
  ): CanonicalIntegrationConnector[] {
    const all = this.all();
    const filtered = integrationId ? all.filter((c) => c.integrationId === integrationId) : all;
    return filtered.slice(offset, offset + limit);
  }

  stats(): CanonicalIntegrationConnectorStats {
    const all = this.all();
    const integrationIds = new Set<string>();
    const tags = new Set<string>();
    for (const connector of all) {
      integrationIds.add(connector.integrationId);
      for (const tag of connector.tags ?? []) tags.add(tag);
    }
    return {
      totalConnectors: all.length,
      connectorIds: all.map((c) => c.connectorId),
      integrationIds: Array.from(integrationIds),
      tags: Array.from(tags),
    };
  }
}

export class IntegrationConnectorEngine {
  constructor(
    private readonly registry: IntegrationRegistryEngine,
    private readonly store: IntegrationConnectorStore = new InMemoryIntegrationConnectorStore(),
  ) {}

  register(connector: CanonicalIntegrationConnector): CanonicalIntegrationConnectorResult {
    if (!connector.connectorId || connector.connectorId.trim() === "") {
      return {
        kind: "canonical-integration-connector-result",
        ok: false,
        code: "INTEGRATION_CONNECTOR_INVALID_ID",
        message: "connectorId is required",
      };
    }
    if (!connector.integrationId || connector.integrationId.trim() === "") {
      return {
        kind: "canonical-integration-connector-result",
        ok: false,
        code: "INTEGRATION_CONNECTOR_INVALID_INTEGRATION_ID",
        message: "integrationId is required",
      };
    }
    if (!connector.name || connector.name.trim() === "") {
      return {
        kind: "canonical-integration-connector-result",
        ok: false,
        code: "INTEGRATION_CONNECTOR_INVALID_NAME",
        message: "name is required",
      };
    }
    const integration = this.registry.find(connector.integrationId);
    if (!integration) {
      return {
        kind: "canonical-integration-connector-result",
        ok: false,
        code: "INTEGRATION_CONNECTOR_UNKNOWN_INTEGRATION",
        message: `integration ${connector.integrationId} not found`,
      };
    }
    this.store.set(connector);
    return {
      kind: "canonical-integration-connector-result",
      ok: true,
      connectorId: connector.connectorId,
      connector,
      code: "INTEGRATION_CONNECTOR_REGISTERED",
      message: "connector registered",
    };
  }

  find(connectorId: string): CanonicalIntegrationConnector | undefined {
    return this.store.get(connectorId);
  }

  list(integrationId?: string, limit?: number, offset?: number): CanonicalIntegrationConnector[] {
    return this.store.list(integrationId, limit, offset);
  }

  stats(): CanonicalIntegrationConnectorStats {
    return this.store.stats();
  }
}
