/**
 * Server functions — dashboard executivo + digest de notificações operacionais.
 */
import { createServerFn } from "@tanstack/react-start";
import { ValidationError } from "@/lib/domain/operations/errors";
import { runQuery, type QueryResult } from "@/lib/server/fn-helpers";
import { loadExecutiveDashboardSnapshot } from "@/lib/services/executive-dashboard/executive-dashboard-service";
import { loadOperationalNotificationDigest } from "@/lib/services/operational-notifications/operational-notification-service";

export type ExecutiveDashboardBundlePayload = {
  dashboard: Awaited<ReturnType<typeof loadExecutiveDashboardSnapshot>>;
  notifications: Awaited<ReturnType<typeof loadOperationalNotificationDigest>>;
};

export const getExecutiveDashboardBundleFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => {
    const obj =
      raw != null && typeof raw === "object" && !Array.isArray(raw)
        ? (raw as Record<string, unknown>)
        : {};
    const cm = obj.competence_month;
    if (cm != null && (typeof cm !== "string" || !/^\d{4}-\d{2}-01$/.test(cm))) {
      throw new ValidationError("Campo competence_month deve ser ISO YYYY-MM-01.", {
        field: "competence_month",
      });
    }
    return {
      competence_month: typeof cm === "string" && /^\d{4}-\d{2}-01$/.test(cm) ? cm : undefined,
    };
  })
  .handler(async ({ data }): Promise<QueryResult<ExecutiveDashboardBundlePayload>> => {
    return runQuery(async (ctx) => {
      const [dashboard, notifications] = await Promise.all([
        loadExecutiveDashboardSnapshot(ctx, { competence_month: data.competence_month }),
        loadOperationalNotificationDigest(ctx),
      ]);
      return { dashboard, notifications };
    });
  });
