/**
 * IntegrationReportEngine — F-09.
 *
 * Consolida informações dos engines F-01 a F-08 em relatórios.
 * Não executa integrações, transforma dados, valida conteúdo,
 * altera artefatos, acessa banco ou conhece domínio.
 */
import type {
  CanonicalIntegrationReport,
  CanonicalIntegrationReportResult,
  CanonicalIntegrationReportStats,
} from "../ports/canonical";
import { IntegrationConnectorEngine } from "../integration-connector";
import { IntegrationMappingEngine } from "../integration-mapping";
import { IntegrationMonitoringEngine } from "../integration-monitoring";
import { IntegrationPipelineEngine } from "../integration-pipeline";
import { IntegrationRegistryEngine } from "../integration-registry";
import { IntegrationRoutingEngine } from "../integration-routing";
import { IntegrationTransformationEngine } from "../integration-transformation";
import { IntegrationValidationEngine } from "../integration-validation";

export interface IntegrationReportStore {
  get(reportId: string): CanonicalIntegrationReport | undefined;
  set(report: CanonicalIntegrationReport): void;
  list(
    integrationId?: string,
    monitoringId?: string,
    limit?: number,
    offset?: number,
  ): CanonicalIntegrationReport[];
  all(): CanonicalIntegrationReport[];
  stats(): CanonicalIntegrationReportStats;
}

export class InMemoryIntegrationReportStore implements IntegrationReportStore {
  private readonly reports = new Map<string, CanonicalIntegrationReport>();

  get(reportId: string): CanonicalIntegrationReport | undefined {
    return this.reports.get(reportId);
  }

  set(report: CanonicalIntegrationReport): void {
    this.reports.set(report.reportId, report);
  }

  all(): CanonicalIntegrationReport[] {
    return Array.from(this.reports.values());
  }

  list(
    integrationId?: string,
    monitoringId?: string,
    limit = Number.POSITIVE_INFINITY,
    offset = 0,
  ): CanonicalIntegrationReport[] {
    const all = this.all();
    const filtered = all.filter((r) => {
      if (integrationId && r.integrationId !== integrationId) return false;
      if (monitoringId && r.monitoringId !== monitoringId) return false;
      return true;
    });
    return filtered.slice(offset, offset + limit);
  }

  stats(): CanonicalIntegrationReportStats {
    const all = this.all();
    const integrationIds = new Set<string>();
    const monitoringIds = new Set<string>();
    const tags = new Set<string>();
    let totalSections = 0;
    for (const r of all) {
      integrationIds.add(r.integrationId);
      monitoringIds.add(r.monitoringId);
      for (const tag of r.tags ?? []) tags.add(tag);
      totalSections += r.sections?.length ?? 0;
    }
    return {
      totalReports: all.length,
      reportIds: all.map((r) => r.reportId),
      integrationIds: Array.from(integrationIds),
      monitoringIds: Array.from(monitoringIds),
      totalSections,
      tags: Array.from(tags),
    };
  }
}

export class IntegrationReportEngine {
  constructor(
    private readonly registry: IntegrationRegistryEngine,
    private readonly connector: IntegrationConnectorEngine,
    private readonly pipeline: IntegrationPipelineEngine,
    private readonly mapping: IntegrationMappingEngine,
    private readonly transformation: IntegrationTransformationEngine,
    private readonly validation: IntegrationValidationEngine,
    private readonly routing: IntegrationRoutingEngine,
    private readonly monitoring: IntegrationMonitoringEngine,
    private readonly store: IntegrationReportStore = new InMemoryIntegrationReportStore(),
  ) {}

  register(report: CanonicalIntegrationReport): CanonicalIntegrationReportResult {
    if (!report.reportId || report.reportId.trim() === "") {
      return {
        kind: "canonical-integration-report-result",
        ok: false,
        code: "INTEGRATION_REPORT_INVALID_ID",
        message: "reportId is required",
      };
    }
    if (!report.integrationId || report.integrationId.trim() === "") {
      return {
        kind: "canonical-integration-report-result",
        ok: false,
        code: "INTEGRATION_REPORT_INVALID_INTEGRATION_ID",
        message: "integrationId is required",
      };
    }
    if (!report.monitoringId || report.monitoringId.trim() === "") {
      return {
        kind: "canonical-integration-report-result",
        ok: false,
        code: "INTEGRATION_REPORT_INVALID_MONITORING_ID",
        message: "monitoringId is required",
      };
    }
    if (!report.name || report.name.trim() === "") {
      return {
        kind: "canonical-integration-report-result",
        ok: false,
        code: "INTEGRATION_REPORT_INVALID_NAME",
        message: "name is required",
      };
    }
    const integration = this.registry.find(report.integrationId);
    if (!integration) {
      return {
        kind: "canonical-integration-report-result",
        ok: false,
        code: "INTEGRATION_REPORT_UNKNOWN_INTEGRATION",
        message: `integration ${report.integrationId} not found`,
      };
    }
    const monitoring = this.monitoring.find(report.monitoringId);
    if (!monitoring) {
      return {
        kind: "canonical-integration-report-result",
        ok: false,
        code: "INTEGRATION_REPORT_UNKNOWN_MONITORING",
        message: `monitoring ${report.monitoringId} not found`,
      };
    }
    if (monitoring.integrationId !== report.integrationId) {
      return {
        kind: "canonical-integration-report-result",
        ok: false,
        code: "INTEGRATION_REPORT_MONITORING_INTEGRATION_MISMATCH",
        message: `monitoring ${report.monitoringId} does not belong to integration ${report.integrationId}`,
      };
    }
    this.store.set(report);
    return {
      kind: "canonical-integration-report-result",
      ok: true,
      reportId: report.reportId,
      report,
      code: "INTEGRATION_REPORT_REGISTERED",
      message: "report registered",
    };
  }

  find(reportId: string): CanonicalIntegrationReport | undefined {
    return this.store.get(reportId);
  }

  list(
    integrationId?: string,
    monitoringId?: string,
    limit?: number,
    offset?: number,
  ): CanonicalIntegrationReport[] {
    return this.store.list(integrationId, monitoringId, limit, offset);
  }

  stats(): CanonicalIntegrationReportStats {
    return this.store.stats();
  }

  consolidate(reportId: string): CanonicalIntegrationReport | null {
    const report = this.store.get(reportId);
    if (!report) return null;
    const monitoring = this.monitoring.find(report.monitoringId);
    const integration = this.registry.find(report.integrationId);
    const sections = report.sections ?? [];
    const consolidated: CanonicalIntegrationReport = {
      ...report,
      summary: monitoring
        ? `Report for ${integration?.name ?? report.integrationId}: ${monitoring.metrics?.length ?? 0} metrics, ${monitoring.events?.length ?? 0} events`
        : report.summary,
      sections: [
        ...sections,
        {
          kind: "canonical-integration-report-section",
          sectionId: "consolidated-summary",
          title: "Consolidated Summary",
          content: {
            integrationId: report.integrationId,
            monitoringId: report.monitoringId,
            totalMetrics: monitoring?.metrics?.length ?? 0,
            totalEvents: monitoring?.events?.length ?? 0,
          },
        },
      ],
    };
    this.store.set(consolidated);
    return consolidated;
  }
}
