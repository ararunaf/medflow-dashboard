/**
 * Server functions — readiness comercial, parametrização institucional e seed demo.
 */
import { createServerFn } from "@tanstack/react-start";
import { ValidationError } from "@/lib/domain/operations/errors";
import {
  runMutation,
  runQuery,
  type MutationResult,
  type QueryResult,
} from "@/lib/server/fn-helpers";
import { requireObject, optionalString } from "@/lib/server/fn-helpers";
import { applyInsuranceCatalogDemo } from "@/lib/services/demo-seed/demo-seed-service";
import {
  getTenantSettings,
  upsertTenantSettings,
} from "@/lib/services/tenant-settings/tenant-settings-service";
import { validatePublicEnv } from "@/lib/env/public-env-validation";
import { buildDeploymentReadinessItems } from "@/lib/services/deployment-readiness/deployment-readiness-service";
import { runOperationalHealthChecks } from "@/lib/services/operational-health/operational-health-service";
import { buildOperationalReadinessChecklist } from "@/lib/services/readiness-check/readiness-check-service";
import { loadPilotDeploymentSnapshot } from "@/lib/services/pilot-deployment/pilot-deployment-snapshot-service";

export type OperationalReadinessPayload = {
  settings: Awaited<ReturnType<typeof getTenantSettings>>;
  health: Awaited<ReturnType<typeof runOperationalHealthChecks>>;
  checklist: ReturnType<typeof buildOperationalReadinessChecklist>;
  publicEnv: ReturnType<typeof validatePublicEnv>;
  deploymentChecklist: ReturnType<typeof buildDeploymentReadinessItems>;
  pilotSnapshot: Awaited<ReturnType<typeof loadPilotDeploymentSnapshot>>;
};

export const getOperationalReadinessFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<QueryResult<OperationalReadinessPayload>> => {
    return runQuery(async (ctx) => {
      const settings = await getTenantSettings(ctx);
      const health = await runOperationalHealthChecks(ctx);
      const checklist = buildOperationalReadinessChecklist(settings, health);
      const publicEnv = validatePublicEnv();
      const deploymentChecklist = buildDeploymentReadinessItems(settings, health);
      const pilotSnapshot = await loadPilotDeploymentSnapshot(ctx);
      return { settings, health, checklist, publicEnv, deploymentChecklist, pilotSnapshot };
    });
  },
);

export const applyDemoCatalogSeedFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    if (raw == null) return {};
    if (typeof raw === "object" && !Array.isArray(raw)) return raw as Record<string, never>;
    return {};
  })
  .handler(
    async (): Promise<MutationResult<Awaited<ReturnType<typeof applyInsuranceCatalogDemo>>>> => {
      return runMutation((ctx) => applyInsuranceCatalogDemo(ctx));
    },
  );

export const saveTenantSettingsFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw, "payload");
    return {
      institution_name: optionalString(o.institution_name, "institution_name"),
      primary_color: optionalString(o.primary_color, "primary_color"),
      secondary_color: optionalString(o.secondary_color, "secondary_color"),
      logo_url: o.logo_url === null ? null : optionalString(o.logo_url, "logo_url"),
      favicon_url: o.favicon_url === null ? null : optionalString(o.favicon_url, "favicon_url"),
      banner_url: o.banner_url === null ? null : optionalString(o.banner_url, "banner_url"),
      contact_email: optionalString(o.contact_email, "contact_email"),
      support_phone: optionalString(o.support_phone, "support_phone"),
      operational_timezone: optionalString(o.operational_timezone, "operational_timezone"),
      currency: optionalString(o.currency, "currency"),
      default_regime_atendimento:
        o.default_regime_atendimento === null
          ? null
          : optionalString(o.default_regime_atendimento, "default_regime_atendimento"),
      default_carater_atendimento:
        o.default_carater_atendimento === null
          ? null
          : optionalString(o.default_carater_atendimento, "default_carater_atendimento"),
      cnpj: o.cnpj === null ? null : optionalString(o.cnpj, "cnpj"),
    };
  })
  .handler(
    async ({ data }): Promise<MutationResult<Awaited<ReturnType<typeof upsertTenantSettings>>>> => {
      return runMutation(async (ctx) => {
        if (
          data.institution_name == null &&
          data.primary_color == null &&
          data.secondary_color == null &&
          data.logo_url === undefined &&
          data.favicon_url === undefined &&
          data.banner_url === undefined &&
          data.contact_email == null &&
          data.support_phone == null &&
          data.operational_timezone == null &&
          data.currency == null &&
          data.default_regime_atendimento === undefined &&
          data.default_carater_atendimento === undefined &&
          data.cnpj === undefined
        ) {
          throw new ValidationError("Nenhum campo para atualizar.", { field: "payload" });
        }
        const patch: Parameters<typeof upsertTenantSettings>[1] = {};
        if (data.institution_name !== undefined) patch.institution_name = data.institution_name;
        if (data.primary_color !== undefined) patch.primary_color = data.primary_color;
        if (data.secondary_color !== undefined) patch.secondary_color = data.secondary_color;
        if (data.logo_url !== undefined) patch.logo_url = data.logo_url;
        if (data.favicon_url !== undefined) patch.favicon_url = data.favicon_url;
        if (data.banner_url !== undefined) patch.banner_url = data.banner_url;
        if (data.contact_email !== undefined) patch.contact_email = data.contact_email;
        if (data.support_phone !== undefined) patch.support_phone = data.support_phone;
        if (data.operational_timezone !== undefined)
          patch.operational_timezone = data.operational_timezone;
        if (data.currency !== undefined) patch.currency = data.currency;
        if (data.default_regime_atendimento !== undefined)
          patch.default_regime_atendimento = data.default_regime_atendimento;
        if (data.default_carater_atendimento !== undefined)
          patch.default_carater_atendimento = data.default_carater_atendimento;
        if (data.cnpj !== undefined) patch.cnpj = data.cnpj;
        return upsertTenantSettings(ctx, patch);
      });
    },
  );
