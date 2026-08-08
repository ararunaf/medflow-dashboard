/**
 * TissAuditEngine — H-09.
 *
 * Auditoria do ciclo completo das integrações TISS.
 * Reutiliza TissCommunicationEngine, TissSoapEngine, TissAuthenticationEngine,
 * TissSubmissionEngine, TissBatchEngine, TissReturnProcessingEngine,
 * TissStatusTrackingEngine e TissRetryEngine.
 * Não implementa integração genérica, envio, SOAP, autenticação, processamento
 * de retorno, status, retry ou qualquer lógica das demais engines.
 */
import {
  H09_TISS_INTEGRATION_CAPABILITIES,
  type TISSIntegrationCapabilities,
} from "../ports/capabilities";
import { TissSubmissionEngine } from "../submission";
import { TissBatchEngine } from "../batch";
import { TissReturnProcessingEngine } from "../return-processing";

export interface TissAuditEvent {
  readonly kind: "tiss-audit-event";
  readonly auditId: string;
  readonly entityType: "submission" | "batch" | "return" | "status" | "retry" | "policy";
  readonly entityId: string;
  readonly action: string;
  readonly actor: string;
  readonly timestamp: number;
  readonly metadata?: Record<string, unknown>;
}

export interface TissAuditReport {
  readonly reportId: string;
  readonly entityType?: TissAuditEvent["entityType"];
  readonly entityId?: string;
  readonly actor?: string;
  readonly events: readonly TissAuditEvent[];
  readonly totalEvents: number;
}

export interface TissAuditResult {
  readonly ok: boolean;
  readonly code: string;
  readonly message: string;
  readonly event?: TissAuditEvent | null;
  readonly report?: TissAuditReport | null;
}

export interface TissAuditStats {
  readonly totalEvents: number;
  readonly byEntity: Record<string, number>;
  readonly byAction: Record<string, number>;
  readonly byActor: Record<string, number>;
}

export class TissAuditEngine {
  private readonly submission: TissSubmissionEngine;
  private readonly batch: TissBatchEngine;
  private readonly returns: TissReturnProcessingEngine;
  private readonly events: TissAuditEvent[] = [];

  constructor(
    submission: TissSubmissionEngine = new TissSubmissionEngine(),
    batch: TissBatchEngine = new TissBatchEngine(submission),
    returns: TissReturnProcessingEngine = new TissReturnProcessingEngine(submission, batch),
  ) {
    this.submission = submission;
    this.batch = batch;
    this.returns = returns;
  }

  getCapabilities(): TISSIntegrationCapabilities {
    return H09_TISS_INTEGRATION_CAPABILITIES;
  }

  record(event: TissAuditEvent): TissAuditResult {
    if (!event.auditId || event.auditId.trim() === "") {
      return { ok: false, code: "TISS_AUDIT_INVALID_AUDIT_ID", message: "auditId is required" };
    }
    if (!event.entityId || event.entityId.trim() === "") {
      return { ok: false, code: "TISS_AUDIT_INVALID_ENTITY_ID", message: "entityId is required" };
    }
    if (!event.action || event.action.trim() === "") {
      return { ok: false, code: "TISS_AUDIT_INVALID_ACTION", message: "action is required" };
    }
    if (!event.actor || event.actor.trim() === "") {
      return { ok: false, code: "TISS_AUDIT_INVALID_ACTOR", message: "actor is required" };
    }

    switch (event.entityType) {
      case "submission": {
        if (!this.submission.findSubmission(event.entityId)) {
          return {
            ok: false,
            code: "TISS_AUDIT_SUBMISSION_NOT_FOUND",
            message: `submission ${event.entityId} not found`,
          };
        }
        break;
      }
      case "batch": {
        if (!this.batch.findBatch(event.entityId)) {
          return {
            ok: false,
            code: "TISS_AUDIT_BATCH_NOT_FOUND",
            message: `batch ${event.entityId} not found`,
          };
        }
        break;
      }
      case "return": {
        if (!this.returns.findReturn(event.entityId)) {
          return {
            ok: false,
            code: "TISS_AUDIT_RETURN_NOT_FOUND",
            message: `return ${event.entityId} not found`,
          };
        }
        break;
      }
      case "status":
      case "retry":
      case "policy":
        break;
      default:
        return {
          ok: false,
          code: "TISS_AUDIT_INVALID_ENTITY_TYPE",
          message: `invalid entityType ${event.entityType}`,
        };
    }

    this.events.push(event);
    return { ok: true, code: "TISS_AUDIT_RECORDED", message: "audit event recorded", event };
  }

  report(
    filters: Partial<Pick<TissAuditEvent, "entityType" | "entityId" | "actor">>,
    reportId = `report-${Date.now()}`,
  ): TissAuditReport {
    const events = this.events.filter((event) => {
      if (filters.entityType && event.entityType !== filters.entityType) return false;
      if (filters.entityId && event.entityId !== filters.entityId) return false;
      if (filters.actor && event.actor !== filters.actor) return false;
      return true;
    });
    return {
      reportId,
      entityType: filters.entityType,
      entityId: filters.entityId,
      actor: filters.actor,
      events,
      totalEvents: events.length,
    };
  }

  listAllEvents(): readonly TissAuditEvent[] {
    return this.events;
  }

  stats(): TissAuditStats {
    const byEntity: Record<string, number> = {};
    const byAction: Record<string, number> = {};
    const byActor: Record<string, number> = {};
    for (const event of this.events) {
      const entityKey = `${event.entityType}:${event.entityId}`;
      byEntity[entityKey] = (byEntity[entityKey] ?? 0) + 1;
      byAction[event.action] = (byAction[event.action] ?? 0) + 1;
      byActor[event.actor] = (byActor[event.actor] ?? 0) + 1;
    }
    return { totalEvents: this.events.length, byEntity, byAction, byActor };
  }
}
