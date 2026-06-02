/**
 * Server functions — produção, release checklist, smoke tests e backup.
 */
import { createServerFn } from "@tanstack/react-start";
import { ValidationError } from "@/lib/domain/operations/errors";
import {
  runMutation,
  runQuery,
  type MutationResult,
  type QueryResult,
} from "@/lib/server/fn-helpers";
import { requireObject, requireString } from "@/lib/server/fn-helpers";
import { checkRateLimit, rateLimitKey } from "@/lib/security/rate-limit";
import { validateSessionState } from "@/lib/security/session-validation";
import { getCommercialLandingContent } from "@/lib/services/commercial-landing/commercial-landing-service";
import {
  buildBackupExportByKind,
  buildBackupReadinessChecklist,
  type BackupExportKind,
} from "@/lib/services/backup-readiness/backup-readiness-service";
import { buildProductionValidationReport } from "@/lib/services/production-validation/production-validation-service";
import { buildReleaseReadinessReport } from "@/lib/services/release-readiness/release-readiness-service";
import { buildReleaseChecklistBundle } from "@/lib/services/release-checklist/release-checklist-service";
import { runSmokeTests } from "@/lib/services/smoke-test/smoke-test-service";
import { runOperationalHealthChecks } from "@/lib/services/operational-health/operational-health-service";
import { getTenantSettings } from "@/lib/services/tenant-settings/tenant-settings-service";
import { runStartupChecks } from "@/lib/env/startup-checks";

export type ProductionReleaseBundle = {
  startup: ReturnType<typeof runStartupChecks>;
  productionValidation: ReturnType<typeof buildProductionValidationReport>;
  releaseReadiness: ReturnType<typeof buildReleaseReadinessReport>;
  releaseChecklists: ReturnType<typeof buildReleaseChecklistBundle>;
  backupChecklist: ReturnType<typeof buildBackupReadinessChecklist>;
  landing: ReturnType<typeof getCommercialLandingContent>;
};

export const getProductionReleaseBundleFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<QueryResult<ProductionReleaseBundle>> => {
    return runQuery(async (ctx) => {
      const settings = await getTenantSettings(ctx);
      const health = await runOperationalHealthChecks(ctx);
      const productionValidation = buildProductionValidationReport(settings, health);
      const releaseReadiness = buildReleaseReadinessReport(settings, health);
      const smoke = await runSmokeTests(ctx);
      const canWrite = ctx.role === "super_admin" || ctx.role === "tenant_admin";

      const releaseChecklists = buildReleaseChecklistBundle({
        productionReport: productionValidation,
        operationalDone: 0,
        operationalTotal: 4,
        deploymentPercent: productionValidation.scorePercent,
        wizardPercent: 0,
        smokeAllPassed: smoke.allPassed,
      });

      return {
        startup: runStartupChecks(),
        productionValidation,
        releaseReadiness,
        releaseChecklists,
        backupChecklist: buildBackupReadinessChecklist(canWrite),
        landing: getCommercialLandingContent(),
      };
    });
  },
);

export const runSmokeTestsFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    if (raw == null) return {};
    requireObject(raw, "payload");
    return {};
  })
  .handler(async (): Promise<MutationResult<Awaited<ReturnType<typeof runSmokeTests>>>> => {
    return runMutation(async (ctx) => {
      const sessionCheck = validateSessionState({
        userId: ctx.userId,
        profile: { tenant_id: ctx.tenantId, role: ctx.role } as {
          tenant_id: string;
          role: string;
        },
      });
      if (!sessionCheck.ok) {
        throw new ValidationError(sessionCheck.issues.join(" "), { field: "session" });
      }
      const rl = checkRateLimit(rateLimitKey(ctx.userId, "smoke_tests"), {
        max: 8,
        windowMs: 60_000,
      });
      if (!rl.allowed) {
        throw new ValidationError("Muitas execuções de smoke test — aguarde um minuto.", {
          field: "rate_limit",
        });
      }
      return runSmokeTests(ctx);
    });
  });

export const exportBackupByKindFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw, "payload");
    const kind = requireString(o.kind, "kind") as BackupExportKind;
    const allowed: BackupExportKind[] = ["tenant", "financial", "audit", "operational"];
    if (!allowed.includes(kind)) {
      throw new ValidationError("Tipo de export inválido.", { field: "kind" });
    }
    return { kind };
  })
  .handler(
    async ({
      data,
    }): Promise<MutationResult<Awaited<ReturnType<typeof buildBackupExportByKind>>>> => {
      return runMutation(async (ctx) => {
        const rl = checkRateLimit(rateLimitKey(ctx.userId, `backup_${data.kind}`), {
          max: 12,
          windowMs: 60_000,
        });
        if (!rl.allowed) {
          throw new ValidationError("Limite de exportações — tente novamente em instantes.", {
            field: "rate_limit",
          });
        }
        return buildBackupExportByKind(ctx, data.kind);
      });
    },
  );

/** Landing pública — sem auth. */
export const getPublicLandingContentFn = createServerFn({ method: "GET" }).handler(async () => {
  return { ok: true as const, data: getCommercialLandingContent() };
});

export type ReleaseChecklistInput = {
  operationalDone: number;
  operationalTotal: number;
  deploymentPercent: number;
  wizardPercent: number;
  smokeAllPassed: boolean;
};

export const buildReleaseChecklistsFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw, "payload");
    return {
      operationalDone: Number(o.operationalDone) || 0,
      operationalTotal: Number(o.operationalTotal) || 4,
      deploymentPercent: Number(o.deploymentPercent) || 0,
      wizardPercent: Number(o.wizardPercent) || 0,
      smokeAllPassed: o.smokeAllPassed === true,
    } satisfies ReleaseChecklistInput;
  })
  .handler(
    async ({ data }): Promise<QueryResult<ReturnType<typeof buildReleaseChecklistBundle>>> => {
      return runQuery(async (ctx) => {
        const settings = await getTenantSettings(ctx);
        const health = await runOperationalHealthChecks(ctx);
        const productionValidation = buildProductionValidationReport(settings, health);
        return buildReleaseChecklistBundle({
          productionReport: productionValidation,
          ...data,
        });
      });
    },
  );
