/**
 * BusinessReportEngine — E-09.
 *
 * Consolida informações de todos os componentes E-01 a E-08.
 * Não duplica lógica. Sem persistência. Sem dashboard. Sem UI. Sem exportação.
 */
import type { BusinessAuditTrailEngine } from "../business-audit-trail";
import type { BusinessDecisionTableEngine } from "../business-decision-table";
import type { BusinessEventLogEngine } from "../business-event-log";
import type { BusinessRuleCatalog } from "../business-rule-catalog";
import type { CanonicalBusinessReport } from "../ports/canonical";

export interface BusinessReportScope {
  readonly correlationId?: string;
  readonly transactionId?: string;
}

export class BusinessReportEngine {
  constructor(
    private readonly eventLog: BusinessEventLogEngine,
    private readonly auditTrail: BusinessAuditTrailEngine,
    private readonly catalog: BusinessRuleCatalog,
    private readonly decisionTable: BusinessDecisionTableEngine,
  ) {}

  generate(reportId: string, scope: BusinessReportScope = {}): CanonicalBusinessReport {
    const catalogStats = this.catalog.stats();
    const allEvents = this.eventLog.all();

    const filteredEvents =
      scope.correlationId || scope.transactionId
        ? allEvents.filter(
            (event) =>
              (!scope.correlationId || event.correlationId === scope.correlationId) &&
              (!scope.transactionId || event.transactionId === scope.transactionId),
          )
        : allEvents;

    const eventCounts: Record<string, number> = {};
    for (const event of filteredEvents) {
      eventCounts[event.eventType] = (eventCounts[event.eventType] ?? 0) + 1;
    }

    const trails =
      scope.correlationId || scope.transactionId
        ? [
            (this.auditTrail.findByCorrelationId(scope.correlationId ?? "") ??
              this.auditTrail.findByTransactionId(scope.transactionId ?? "")) as
              | import("../ports/canonical").CanonicalBusinessAuditTrail
              | undefined,
          ].filter(
            (t): t is import("../ports/canonical").CanonicalBusinessAuditTrail => t !== undefined,
          )
        : this.auditTrail.all();

    const allAuditEntries = trails.flatMap((t) => t.entries);

    const summary: Record<string, number> = {
      totalRules: catalogStats.totalRules,
      totalEvents: filteredEvents.length,
      totalAuditTrailEntries: allAuditEntries.length,
      totalDecisionTables: this.decisionTable.all().length,
      ...eventCounts,
    };

    const sections: Record<string, unknown> = {
      catalog: catalogStats,
      events: filteredEvents,
      auditTrails: trails,
      decisionTables: this.decisionTable.all(),
    };

    return {
      kind: "canonical-business-report",
      reportId,
      generatedAt: Date.now(),
      scope: scope as Record<string, unknown>,
      summary,
      sections,
    };
  }
}
