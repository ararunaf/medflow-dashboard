/**
 * Server functions — fechamento financeiro operacional, snapshots e auditoria.
 */
import { createServerFn } from "@tanstack/react-start";
import { ValidationError } from "@/lib/domain/operations/errors";
import { expectUuid } from "@/lib/domain/operations/validation";
import {
  requireObject,
  runMutation,
  runQuery,
  type MutationResult,
  type QueryResult,
} from "@/lib/server/fn-helpers";
import {
  ensureDraftClosingForCompetence,
  getFinancialClosingById,
  listFinancialClosings,
  loadClosingOperationalBundle,
  refreshClosingTotalsFromOperationalData,
  runFinancialClosingBulkOp,
  transitionFinancialClosingStatus,
} from "@/lib/services/financial-closing";
import { listFinancialClosingAudit } from "@/lib/services/financial-closing/financial-audit-service";
import { listSnapshotsForClosing } from "@/lib/services/financial-closing/snapshot-service";
import type { FinancialClosingStatus } from "@/lib/database.types";

function expectCompetenceMonth(v: unknown, field: string): string {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-01$/.test(v)) {
    throw new ValidationError(`Campo ${field} deve ser ISO YYYY-MM-01.`, { field });
  }
  return v;
}

const CLOSING_STATUSES = new Set<FinancialClosingStatus>([
  "draft",
  "under_review",
  "validated",
  "locked",
  "finalized",
]);

function expectClosingStatus(v: unknown, field: string): FinancialClosingStatus {
  if (typeof v !== "string" || !CLOSING_STATUSES.has(v as FinancialClosingStatus)) {
    throw new ValidationError(`Campo ${field} inválido (status de fechamento).`, { field });
  }
  return v as FinancialClosingStatus;
}

export type FinancialClosingDetailPayload = {
  closing: Awaited<ReturnType<typeof getFinancialClosingById>>;
  bundle: Awaited<ReturnType<typeof loadClosingOperationalBundle>>["bundle"];
  snapshots: Awaited<ReturnType<typeof listSnapshotsForClosing>>;
  audit: Awaited<ReturnType<typeof listFinancialClosingAudit>>;
  timeline: Awaited<ReturnType<typeof loadClosingTimeline>>;
};

async function loadClosingTimeline(
  ctx: Parameters<typeof listFinancialClosingAudit>[0],
  closingId: string,
) {
  const { data, error } = await ctx.client
    .from("operational_events")
    .select("id, event_type, severity, description, metadata, created_at")
    .eq("tenant_id", ctx.tenantId)
    .eq("entity_type", "financial_closing")
    .eq("entity_id", closingId)
    .order("created_at", { ascending: false })
    .limit(80);
  if (error) return [];
  const rows = data ?? [];
  return rows.map((ev) => ({
    id: ev.id,
    event_type: ev.event_type,
    severity: ev.severity,
    description: ev.description,
    created_at: ev.created_at,
    metadata: ev.metadata == null ? null : JSON.parse(JSON.stringify(ev.metadata)),
  }));
}

export const listFinancialClosingsFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => {
    const obj =
      raw != null && typeof raw === "object" && !Array.isArray(raw)
        ? (raw as Record<string, unknown>)
        : {};
    return {
      search: typeof obj.search === "string" ? obj.search : undefined,
      limit:
        typeof obj.limit === "number" && obj.limit > 0 && obj.limit <= 500 ? obj.limit : undefined,
    };
  })
  .handler(
    async ({ data }): Promise<QueryResult<Awaited<ReturnType<typeof listFinancialClosings>>>> => {
      return runQuery((ctx) =>
        listFinancialClosings(ctx, { search: data.search, limit: data.limit }),
      );
    },
  );

export const loadFinancialClosingDetailFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => {
    const obj =
      raw != null && typeof raw === "object" && !Array.isArray(raw)
        ? (raw as Record<string, unknown>)
        : {};
    return { closingId: expectUuid(obj.closingId, "closingId") };
  })
  .handler(async ({ data }): Promise<QueryResult<FinancialClosingDetailPayload>> => {
    return runQuery(async (ctx) => {
      const closing = await getFinancialClosingById(ctx, data.closingId);
      const { bundle } = await loadClosingOperationalBundle(ctx, data.closingId);
      const [snapshots, audit, timeline] = await Promise.all([
        listSnapshotsForClosing(ctx, data.closingId),
        listFinancialClosingAudit(ctx, data.closingId),
        loadClosingTimeline(ctx, data.closingId),
      ]);
      const snapshotsOut = snapshots.map((s) => ({
        ...s,
        payload_json: JSON.parse(JSON.stringify(s.payload_json ?? {})),
      }));
      const auditOut = audit.map((a) => ({
        ...a,
        payload: JSON.parse(JSON.stringify(a.payload ?? {})),
      }));
      return {
        closing,
        bundle: bundle ? JSON.parse(JSON.stringify(bundle)) : null,
        snapshots: snapshotsOut,
        audit: auditOut,
        timeline,
      };
    });
  });

export const ensureDraftClosingFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return { competenceMonth: expectCompetenceMonth(o.competenceMonth, "competenceMonth") };
  })
  .handler(
    async ({
      data,
    }): Promise<MutationResult<Awaited<ReturnType<typeof ensureDraftClosingForCompetence>>>> => {
      return runMutation((ctx) => ensureDraftClosingForCompetence(ctx, data.competenceMonth));
    },
  );

export const refreshClosingTotalsFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return { closingId: expectUuid(o.closingId, "closingId") };
  })
  .handler(
    async ({
      data,
    }): Promise<
      MutationResult<Awaited<ReturnType<typeof refreshClosingTotalsFromOperationalData>>>
    > => {
      return runMutation((ctx) => refreshClosingTotalsFromOperationalData(ctx, data.closingId));
    },
  );

export const transitionClosingStatusFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return {
      closingId: expectUuid(o.closingId, "closingId"),
      toStatus: expectClosingStatus(o.toStatus, "toStatus"),
      note: typeof o.note === "string" ? o.note.slice(0, 2000) : undefined,
    };
  })
  .handler(
    async ({
      data,
    }): Promise<MutationResult<Awaited<ReturnType<typeof transitionFinancialClosingStatus>>>> => {
      return runMutation((ctx) =>
        transitionFinancialClosingStatus(ctx, {
          closingId: data.closingId,
          toStatus: data.toStatus,
          note: data.note,
        }),
      );
    },
  );

function expectFinancialClosingBulkOp(
  raw: unknown,
): Parameters<typeof runFinancialClosingBulkOp>[1] {
  const o = requireObject(raw);
  const op = o.op;
  if (op !== "refresh_totals" && op !== "send_to_review") {
    throw new ValidationError("Campo op inválido (use refresh_totals ou send_to_review).", {
      field: "op",
    });
  }
  const idsRaw = o.closingIds;
  if (!Array.isArray(idsRaw) || idsRaw.length === 0) {
    throw new ValidationError("closingIds deve ser array não vazio.", { field: "closingIds" });
  }
  if (idsRaw.length > 50) {
    throw new ValidationError("No máximo 50 fechamentos por operação em lote.", {
      field: "closingIds",
    });
  }
  const closingIds = idsRaw.map((id, i) => expectUuid(String(id), `closingIds[${i}]`));
  if (op === "refresh_totals") return { op: "refresh_totals" as const, closingIds };
  return { op: "send_to_review" as const, closingIds };
}

export const runFinancialClosingBulkOpFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => expectFinancialClosingBulkOp(raw))
  .handler(
    async ({
      data,
    }): Promise<MutationResult<Awaited<ReturnType<typeof runFinancialClosingBulkOp>>>> => {
      return runMutation((ctx) => runFinancialClosingBulkOp(ctx, data));
    },
  );
