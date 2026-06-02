/**
 * Server functions — conciliação operacional, matching, importação CSV e auditoria.
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
  applyCsvImportToReconciliation,
  ensureDraftReconciliationForCompetence,
  finalizeOperationalReconciliation,
  getOperationalReconciliationById,
  linkReconciliationToClosing,
  listOperationalReconciliations,
  listReconciliationAudit,
  listReconciliationIssues,
  listReconciliationItems,
  resolveReconciliationIssue,
  runOperationalMatching,
  runReconciliationBulkOp,
  upsertManualReconciliationItem,
} from "@/lib/services/reconciliation";
import type { ReconciliationMatchingMode } from "@/lib/services/reconciliation/types";

function expectCompetenceMonth(v: unknown, field: string): string {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-01$/.test(v)) {
    throw new ValidationError(`Campo ${field} deve ser ISO YYYY-MM-01.`, { field });
  }
  return v;
}

const MATCHING_MODES = new Set<ReconciliationMatchingMode>([
  "competence",
  "batch",
  "guide",
  "insurance",
  "payout",
]);

function expectMatchingMode(v: unknown, field: string): ReconciliationMatchingMode {
  if (typeof v !== "string" || !MATCHING_MODES.has(v as ReconciliationMatchingMode)) {
    throw new ValidationError(`Campo ${field} inválido (modo de matching).`, { field });
  }
  return v as ReconciliationMatchingMode;
}

async function loadReconciliationTimeline(
  ctx: Parameters<typeof listReconciliationItems>[0],
  reconciliationId: string,
) {
  const { data, error } = await ctx.client
    .from("operational_events")
    .select("id, event_type, severity, description, metadata, created_at")
    .eq("tenant_id", ctx.tenantId)
    .eq("entity_type", "operational_reconciliation")
    .eq("entity_id", reconciliationId)
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

export type OperationalReconciliationDetailPayload = {
  reconciliation: Awaited<ReturnType<typeof getOperationalReconciliationById>>;
  items: Awaited<ReturnType<typeof listReconciliationItems>>;
  issues: Awaited<ReturnType<typeof listReconciliationIssues>>;
  audit: Awaited<ReturnType<typeof listReconciliationAudit>>;
  timeline: Awaited<ReturnType<typeof loadReconciliationTimeline>>;
  closingsSameCompetence: { id: string; status: string; competence_month: string }[];
};

export const listOperationalReconciliationsFn = createServerFn({ method: "GET" })
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
    async ({
      data,
    }): Promise<QueryResult<Awaited<ReturnType<typeof listOperationalReconciliations>>>> => {
      return runQuery((ctx) => listOperationalReconciliations(ctx, data));
    },
  );

export const loadOperationalReconciliationDetailFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => {
    const obj =
      raw != null && typeof raw === "object" && !Array.isArray(raw)
        ? (raw as Record<string, unknown>)
        : {};
    return { reconciliationId: expectUuid(obj.reconciliationId, "reconciliationId") };
  })
  .handler(async ({ data }): Promise<QueryResult<OperationalReconciliationDetailPayload>> => {
    return runQuery(async (ctx) => {
      const reconciliation = await getOperationalReconciliationById(ctx, data.reconciliationId);
      const [items, issues, audit, timeline] = await Promise.all([
        listReconciliationItems(ctx, data.reconciliationId),
        listReconciliationIssues(ctx, data.reconciliationId),
        listReconciliationAudit(ctx, data.reconciliationId),
        loadReconciliationTimeline(ctx, data.reconciliationId),
      ]);
      const { data: closings, error: cErr } = await ctx.client
        .from("financial_closings")
        .select("id, status, competence_month")
        .eq("tenant_id", ctx.tenantId)
        .eq("competence_month", reconciliation.competence_month)
        .order("created_at", { ascending: false })
        .limit(20);
      const closingsSameCompetence = cErr ? [] : (closings ?? []);
      return {
        reconciliation,
        items: JSON.parse(JSON.stringify(items)),
        issues: JSON.parse(JSON.stringify(issues)),
        audit: audit.map((a) => ({
          ...a,
          payload: JSON.parse(JSON.stringify(a.payload ?? {})),
        })),
        timeline,
        closingsSameCompetence,
      };
    });
  });

export const ensureDraftReconciliationFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return { competenceMonth: expectCompetenceMonth(o.competenceMonth, "competenceMonth") };
  })
  .handler(
    async ({
      data,
    }): Promise<
      MutationResult<Awaited<ReturnType<typeof ensureDraftReconciliationForCompetence>>>
    > => {
      return runMutation((ctx) =>
        ensureDraftReconciliationForCompetence(ctx, data.competenceMonth),
      );
    },
  );

export const runOperationalMatchingFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return {
      reconciliationId: expectUuid(o.reconciliationId, "reconciliationId"),
      mode: expectMatchingMode(o.mode, "mode"),
    };
  })
  .handler(async ({ data }): Promise<MutationResult<{ ok: true }>> => {
    return runMutation(async (ctx) => {
      await runOperationalMatching(ctx, data);
      return { ok: true as const };
    });
  });

export const applyReconciliationCsvFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return {
      reconciliationId: expectUuid(o.reconciliationId, "reconciliationId"),
      csvText: typeof o.csvText === "string" ? o.csvText : "",
    };
  })
  .handler(
    async ({
      data,
    }): Promise<MutationResult<Awaited<ReturnType<typeof applyCsvImportToReconciliation>>>> => {
      return runMutation((ctx) => applyCsvImportToReconciliation(ctx, data));
    },
  );

export const linkReconciliationClosingFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return {
      reconciliationId: expectUuid(o.reconciliationId, "reconciliationId"),
      closingId:
        o.closingId === null || o.closingId === ""
          ? null
          : expectUuid(String(o.closingId), "closingId"),
    };
  })
  .handler(
    async ({
      data,
    }): Promise<MutationResult<Awaited<ReturnType<typeof linkReconciliationToClosing>>>> => {
      return runMutation((ctx) =>
        linkReconciliationToClosing(ctx, {
          reconciliationId: data.reconciliationId,
          closingId: data.closingId,
        }),
      );
    },
  );

export const finalizeReconciliationFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return { reconciliationId: expectUuid(o.reconciliationId, "reconciliationId") };
  })
  .handler(
    async ({
      data,
    }): Promise<MutationResult<Awaited<ReturnType<typeof finalizeOperationalReconciliation>>>> => {
      return runMutation((ctx) => finalizeOperationalReconciliation(ctx, data.reconciliationId));
    },
  );

export const resolveReconciliationIssueFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return {
      issueId: expectUuid(o.issueId, "issueId"),
      resolved: Boolean(o.resolved),
    };
  })
  .handler(async ({ data }): Promise<MutationResult<{ ok: true }>> => {
    return runMutation(async (ctx) => {
      await resolveReconciliationIssue(ctx, data);
      return { ok: true as const };
    });
  });

export const upsertManualReconciliationItemFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    const ev = o.expectedValue;
    const rv = o.receivedValue;
    return {
      reconciliationId: expectUuid(o.reconciliationId, "reconciliationId"),
      referenceId: expectUuid(o.referenceId, "referenceId"),
      expectedValue: typeof ev === "number" ? ev : Number(ev),
      receivedValue: typeof rv === "number" ? rv : Number(rv),
    };
  })
  .handler(async ({ data }): Promise<MutationResult<{ ok: true }>> => {
    return runMutation(async (ctx) => {
      await upsertManualReconciliationItem(ctx, data);
      return { ok: true as const };
    });
  });

function expectReconciliationBulkOp(raw: unknown): Parameters<typeof runReconciliationBulkOp>[1] {
  const o = requireObject(raw);
  if (o.op !== "refresh_totals") {
    throw new ValidationError("Campo op inválido (use refresh_totals).", { field: "op" });
  }
  const idsRaw = o.reconciliationIds;
  if (!Array.isArray(idsRaw) || idsRaw.length === 0) {
    throw new ValidationError("reconciliationIds deve ser array não vazio.", {
      field: "reconciliationIds",
    });
  }
  if (idsRaw.length > 50) {
    throw new ValidationError("No máximo 50 conciliações por operação em lote.", {
      field: "reconciliationIds",
    });
  }
  const reconciliationIds = idsRaw.map((id, i) =>
    expectUuid(String(id), `reconciliationIds[${i}]`),
  );
  return { op: "refresh_totals" as const, reconciliationIds };
}

export const runReconciliationBulkOpFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => expectReconciliationBulkOp(raw))
  .handler(
    async ({
      data,
    }): Promise<MutationResult<Awaited<ReturnType<typeof runReconciliationBulkOp>>>> => {
      return runMutation((ctx) => runReconciliationBulkOp(ctx, data));
    },
  );
