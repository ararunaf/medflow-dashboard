/**
 * TissStatusTrackingEngine — H-07.
 *
 * Acompanhamento do status operacional de transações TISS.
 * Reutiliza TissSubmissionEngine (H-04), TissBatchEngine (H-05) e TissReturnProcessingEngine (H-06).
 * Não implementa retry, auditoria, envio ou correções automáticas.
 */
import {
  H07_TISS_INTEGRATION_CAPABILITIES,
  type TISSIntegrationCapabilities,
} from "../ports/capabilities";
import { TissSubmissionEngine } from "../submission";
import { TissBatchEngine } from "../batch";
import { TissReturnProcessingEngine } from "../return-processing";

export interface TissStatusEvent {
  readonly kind: "tiss-status-event";
  readonly eventId: string;
  readonly entityType: "submission" | "batch" | "return";
  readonly entityId: string;
  readonly status: string;
  readonly message: string;
  readonly timestamp: number;
  readonly metadata?: Record<string, unknown>;
}

export interface TissStatusResult {
  readonly ok: boolean;
  readonly eventId?: string;
  readonly code: string;
  readonly message: string;
  readonly event?: TissStatusEvent | null;
}

export interface TissStatusHistory {
  readonly entityType: TissStatusEvent["entityType"];
  readonly entityId: string;
  readonly events: readonly TissStatusEvent[];
}

export interface TissStatusStats {
  readonly totalEvents: number;
  readonly byEntity: Record<string, number>;
  readonly byStatus: Record<string, number>;
}

export class TissStatusTrackingEngine {
  private readonly submission: TissSubmissionEngine;
  private readonly batch: TissBatchEngine;
  private readonly returns: TissReturnProcessingEngine;
  private readonly events = new Map<string, TissStatusEvent[]>();

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
    return H07_TISS_INTEGRATION_CAPABILITIES;
  }

  track(event: TissStatusEvent): TissStatusResult {
    if (!event.eventId || event.eventId.trim() === "") {
      return {
        ok: false,
        code: "TISS_STATUS_INVALID_EVENT_ID",
        message: "eventId is required",
      };
    }
    if (!event.entityId || event.entityId.trim() === "") {
      return {
        ok: false,
        code: "TISS_STATUS_INVALID_ENTITY_ID",
        message: "entityId is required",
      };
    }
    if (!event.status || event.status.trim() === "") {
      return {
        ok: false,
        code: "TISS_STATUS_INVALID_STATUS",
        message: "status is required",
      };
    }

    switch (event.entityType) {
      case "submission": {
        if (!this.submission.findSubmission(event.entityId)) {
          return {
            ok: false,
            code: "TISS_STATUS_SUBMISSION_NOT_FOUND",
            message: `submission ${event.entityId} not found`,
          };
        }
        break;
      }
      case "batch": {
        if (!this.batch.findBatch(event.entityId)) {
          return {
            ok: false,
            code: "TISS_STATUS_BATCH_NOT_FOUND",
            message: `batch ${event.entityId} not found`,
          };
        }
        break;
      }
      case "return": {
        if (!this.returns.findReturn(event.entityId)) {
          return {
            ok: false,
            code: "TISS_STATUS_RETURN_NOT_FOUND",
            message: `return ${event.entityId} not found`,
          };
        }
        break;
      }
      default:
        return {
          ok: false,
          code: "TISS_STATUS_INVALID_ENTITY_TYPE",
          message: `invalid entityType ${event.entityType}`,
        };
    }

    const key = `${event.entityType}:${event.entityId}`;
    const list = this.events.get(key) ?? [];
    list.push(event);
    this.events.set(key, list);

    return {
      ok: true,
      eventId: event.eventId,
      code: "TISS_STATUS_TRACKED",
      message: "status tracked",
      event,
    };
  }

  history(
    entityType: TissStatusEvent["entityType"],
    entityId: string,
  ): TissStatusHistory | undefined {
    const key = `${entityType}:${entityId}`;
    const list = this.events.get(key);
    if (!list) return undefined;
    return { entityType, entityId, events: list };
  }

  latest(entityType: TissStatusEvent["entityType"], entityId: string): TissStatusEvent | undefined {
    const h = this.history(entityType, entityId);
    if (!h || h.events.length === 0) return undefined;
    return h.events[h.events.length - 1];
  }

  listAllEvents(): TissStatusEvent[] {
    const all: TissStatusEvent[] = [];
    for (const list of this.events.values()) all.push(...list);
    return all;
  }

  stats(): TissStatusStats {
    const all = this.listAllEvents();
    const byEntity: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    for (const event of all) {
      const key = `${event.entityType}:${event.entityId}`;
      byEntity[key] = (byEntity[key] ?? 0) + 1;
      byStatus[event.status] = (byStatus[event.status] ?? 0) + 1;
    }
    return { totalEvents: all.length, byEntity, byStatus };
  }
}
