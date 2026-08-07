/**
 * IntegrationMonitoringEngine — F-08.
 *
 * Coleta e disponibiliza métricas operacionais das integrações.
 * Reutiliza engines F-01 a F-07 sem reimplementar lógica.
 * Não executa integrações, não transforma dados, não valida conteúdo,
 * não altera pipelines/mappings/connectors, não acessa banco ou APIs,
 * não conhece XML, TISS, domínio médico, operadoras ou regras de negócio.
 */
import type {
  CanonicalIntegrationMetric,
  CanonicalIntegrationMonitoring,
  CanonicalIntegrationMonitoringEvent,
  CanonicalIntegrationMonitoringResult,
  CanonicalIntegrationMonitoringStats,
} from "../ports/canonical";
import { IntegrationConnectorEngine } from "../integration-connector";
import { IntegrationMappingEngine } from "../integration-mapping";
import { IntegrationPipelineEngine } from "../integration-pipeline";
import { IntegrationRegistryEngine } from "../integration-registry";
import { IntegrationRoutingEngine } from "../integration-routing";
import { IntegrationTransformationEngine } from "../integration-transformation";
import { IntegrationValidationEngine } from "../integration-validation";

export interface IntegrationMonitoringStore {
  get(monitoringId: string): CanonicalIntegrationMonitoring | undefined;
  set(monitoring: CanonicalIntegrationMonitoring): void;
  list(
    integrationId?: string,
    routeId?: string,
    connectorId?: string,
    pipelineId?: string,
    mappingId?: string,
    transformationId?: string,
    validationId?: string,
    status?: "healthy" | "degraded" | "unhealthy",
    limit?: number,
    offset?: number,
  ): CanonicalIntegrationMonitoring[];
  all(): CanonicalIntegrationMonitoring[];
  stats(): CanonicalIntegrationMonitoringStats;
}

export class InMemoryIntegrationMonitoringStore implements IntegrationMonitoringStore {
  private readonly monitorings = new Map<string, CanonicalIntegrationMonitoring>();

  get(monitoringId: string): CanonicalIntegrationMonitoring | undefined {
    return this.monitorings.get(monitoringId);
  }

  set(monitoring: CanonicalIntegrationMonitoring): void {
    this.monitorings.set(monitoring.monitoringId, monitoring);
  }

  all(): CanonicalIntegrationMonitoring[] {
    return Array.from(this.monitorings.values());
  }

  list(
    integrationId?: string,
    routeId?: string,
    connectorId?: string,
    pipelineId?: string,
    mappingId?: string,
    transformationId?: string,
    validationId?: string,
    status?: "healthy" | "degraded" | "unhealthy",
    limit = Number.POSITIVE_INFINITY,
    offset = 0,
  ): CanonicalIntegrationMonitoring[] {
    const all = this.all();
    const filtered = all.filter((m) => {
      if (integrationId && m.integrationId !== integrationId) return false;
      if (routeId && m.routeId !== routeId) return false;
      if (connectorId && m.connectorId !== connectorId) return false;
      if (pipelineId && m.pipelineId !== pipelineId) return false;
      if (mappingId && m.mappingId !== mappingId) return false;
      if (transformationId && m.transformationId !== transformationId) return false;
      if (validationId && m.validationId !== validationId) return false;
      if (status && m.status !== status) return false;
      return true;
    });
    return filtered.slice(offset, offset + limit);
  }

  stats(): CanonicalIntegrationMonitoringStats {
    const all = this.all();
    const integrationIds = new Set<string>();
    const routeIds = new Set<string>();
    const connectorIds = new Set<string>();
    const pipelineIds = new Set<string>();
    const mappingIds = new Set<string>();
    const transformationIds = new Set<string>();
    const validationIds = new Set<string>();
    const tags = new Set<string>();
    let totalMetrics = 0;
    let totalEvents = 0;
    const statusCounts = { healthy: 0, degraded: 0, unhealthy: 0 };
    for (const m of all) {
      integrationIds.add(m.integrationId);
      routeIds.add(m.routeId);
      connectorIds.add(m.connectorId);
      pipelineIds.add(m.pipelineId);
      mappingIds.add(m.mappingId);
      transformationIds.add(m.transformationId);
      validationIds.add(m.validationId);
      for (const tag of m.tags ?? []) tags.add(tag);
      totalMetrics += m.metrics?.length ?? 0;
      totalEvents += m.events?.length ?? 0;
      if (m.status) statusCounts[m.status]++;
    }
    return {
      totalMonitorings: all.length,
      monitoringIds: all.map((m) => m.monitoringId),
      integrationIds: Array.from(integrationIds),
      routeIds: Array.from(routeIds),
      connectorIds: Array.from(connectorIds),
      pipelineIds: Array.from(pipelineIds),
      mappingIds: Array.from(mappingIds),
      transformationIds: Array.from(transformationIds),
      validationIds: Array.from(validationIds),
      totalMetrics,
      totalEvents,
      statusCounts,
      tags: Array.from(tags),
    };
  }
}

export class IntegrationMonitoringEngine {
  constructor(
    private readonly registry: IntegrationRegistryEngine,
    private readonly connector: IntegrationConnectorEngine,
    private readonly pipeline: IntegrationPipelineEngine,
    private readonly mapping: IntegrationMappingEngine,
    private readonly transformation: IntegrationTransformationEngine,
    private readonly validation: IntegrationValidationEngine,
    private readonly routing: IntegrationRoutingEngine,
    private readonly store: IntegrationMonitoringStore = new InMemoryIntegrationMonitoringStore(),
  ) {}

  register(monitoring: CanonicalIntegrationMonitoring): CanonicalIntegrationMonitoringResult {
    if (!monitoring.monitoringId || monitoring.monitoringId.trim() === "") {
      return {
        kind: "canonical-integration-monitoring-result",
        ok: false,
        code: "INTEGRATION_MONITORING_INVALID_ID",
        message: "monitoringId is required",
      };
    }
    if (!monitoring.integrationId || monitoring.integrationId.trim() === "") {
      return {
        kind: "canonical-integration-monitoring-result",
        ok: false,
        code: "INTEGRATION_MONITORING_INVALID_INTEGRATION_ID",
        message: "integrationId is required",
      };
    }
    if (!monitoring.routeId || monitoring.routeId.trim() === "") {
      return {
        kind: "canonical-integration-monitoring-result",
        ok: false,
        code: "INTEGRATION_MONITORING_INVALID_ROUTE_ID",
        message: "routeId is required",
      };
    }
    if (!monitoring.name || monitoring.name.trim() === "") {
      return {
        kind: "canonical-integration-monitoring-result",
        ok: false,
        code: "INTEGRATION_MONITORING_INVALID_NAME",
        message: "name is required",
      };
    }
    const integration = this.registry.find(monitoring.integrationId);
    if (!integration) {
      return {
        kind: "canonical-integration-monitoring-result",
        ok: false,
        code: "INTEGRATION_MONITORING_UNKNOWN_INTEGRATION",
        message: `integration ${monitoring.integrationId} not found`,
      };
    }
    const route = this.routing.find(monitoring.routeId);
    if (!route) {
      return {
        kind: "canonical-integration-monitoring-result",
        ok: false,
        code: "INTEGRATION_MONITORING_UNKNOWN_ROUTE",
        message: `route ${monitoring.routeId} not found`,
      };
    }
    if (route.integrationId !== monitoring.integrationId) {
      return {
        kind: "canonical-integration-monitoring-result",
        ok: false,
        code: "INTEGRATION_MONITORING_ROUTE_INTEGRATION_MISMATCH",
        message: `route ${monitoring.routeId} does not belong to integration ${monitoring.integrationId}`,
      };
    }
    this.store.set(monitoring);
    return {
      kind: "canonical-integration-monitoring-result",
      ok: true,
      monitoringId: monitoring.monitoringId,
      monitoring,
      code: "INTEGRATION_MONITORING_REGISTERED",
      message: "monitoring registered",
    };
  }

  find(monitoringId: string): CanonicalIntegrationMonitoring | undefined {
    return this.store.get(monitoringId);
  }

  list(
    integrationId?: string,
    routeId?: string,
    connectorId?: string,
    pipelineId?: string,
    mappingId?: string,
    transformationId?: string,
    validationId?: string,
    status?: "healthy" | "degraded" | "unhealthy",
    limit?: number,
    offset?: number,
  ): CanonicalIntegrationMonitoring[] {
    return this.store.list(
      integrationId,
      routeId,
      connectorId,
      pipelineId,
      mappingId,
      transformationId,
      validationId,
      status,
      limit,
      offset,
    );
  }

  stats(): CanonicalIntegrationMonitoringStats {
    return this.store.stats();
  }

  collectMetrics(
    monitoringId: string,
    metrics: readonly CanonicalIntegrationMetric[],
  ): CanonicalIntegrationMonitoring | null {
    const monitoring = this.store.get(monitoringId);
    if (!monitoring) return null;
    const updated: CanonicalIntegrationMonitoring = {
      ...monitoring,
      metrics: [...(monitoring.metrics ?? []), ...metrics],
    };
    this.store.set(updated);
    return updated;
  }

  recordEvents(
    monitoringId: string,
    events: readonly CanonicalIntegrationMonitoringEvent[],
  ): CanonicalIntegrationMonitoring | null {
    const monitoring = this.store.get(monitoringId);
    if (!monitoring) return null;
    const updated: CanonicalIntegrationMonitoring = {
      ...monitoring,
      events: [...(monitoring.events ?? []), ...events],
    };
    this.store.set(updated);
    return updated;
  }
}
