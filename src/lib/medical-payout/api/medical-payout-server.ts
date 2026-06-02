/**
 * Server functions — produção médica, regras de repasse, cálculo operacional e auditoria.
 */
import { createServerFn } from "@tanstack/react-start";
import type { PayoutRuleType } from "@/lib/database.types";
import { ValidationError } from "@/lib/domain/operations/errors";
import { expectOptionalString, expectUuid } from "@/lib/domain/operations/validation";
import {
  requireObject,
  runMutation,
  runQuery,
  type MutationResult,
  type QueryResult,
} from "@/lib/server/fn-helpers";
import type { MedicalPayoutRow, PayoutRuleRow } from "@/lib/services/medical-payout/types";
import {
  calculateMedicalPayout,
  createPayoutRule,
  ensureDraftMedicalPayout,
  getMedicalPayoutWithItems,
  listMedicalPayoutsForCompetence,
  listMedicalProductionForCompetence,
  listPayoutRules,
  loadProductionRanking,
  markMedicalPayoutApproved,
  markMedicalPayoutPaid,
  markMedicalPayoutReviewed,
  normalizeCompetenceMonth,
  setPayoutRuleActive,
  syncMedicalProductionForCompetence,
} from "@/lib/services/medical-payout";

const PAYOUT_RULE_TYPES = new Set<PayoutRuleType>([
  "percentage",
  "fixed",
  "operational_discount",
  "retention_percentage",
  "retention_fixed",
]);

function expectCompetenceMonth(v: unknown, field: string): string {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-01$/.test(v)) {
    throw new ValidationError(`Campo ${field} deve ser ISO YYYY-MM-01.`, { field });
  }
  return v;
}

function expectPayoutRuleType(v: unknown, field: string): PayoutRuleType {
  if (typeof v !== "string" || !PAYOUT_RULE_TYPES.has(v as PayoutRuleType)) {
    throw new ValidationError(`Campo ${field} inválido (tipo de regra).`, { field });
  }
  return v as PayoutRuleType;
}

export type MedicalPayoutFoundationBundle = Awaited<
  ReturnType<typeof loadMedicalPayoutFoundationBundle>
>;

async function loadMedicalPayoutFoundationBundle(
  ctx: Parameters<typeof listMedicalProductionForCompetence>[0],
  competenceMonth: string,
) {
  const cm = normalizeCompetenceMonth(competenceMonth);
  const [productions, payouts, rules, ranking] = await Promise.all([
    listMedicalProductionForCompetence(ctx, cm),
    listMedicalPayoutsForCompetence(ctx, cm),
    listPayoutRules(ctx),
    loadProductionRanking(ctx, cm),
  ]);

  const totals = { gross: 0, denied: 0, approved: 0, payoutFinal: 0 };
  for (const p of productions) {
    totals.gross += Number(p.gross_value);
    totals.denied += Number(p.denied_value);
    totals.approved += Number(p.approved_value);
  }
  for (const py of payouts) {
    if (
      py.status === "paid" ||
      py.status === "approved" ||
      py.status === "reviewed" ||
      py.status === "calculated"
    ) {
      totals.payoutFinal += Number(py.final_value);
    }
  }

  return { competenceMonth: cm, productions, payouts, rules, ranking, totals };
}

export const loadMedicalPayoutFoundationBundleFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => {
    const obj =
      raw != null && typeof raw === "object" && !Array.isArray(raw)
        ? (raw as Record<string, unknown>)
        : {};
    return { competenceMonth: expectCompetenceMonth(obj.competenceMonth, "competenceMonth") };
  })
  .handler(async ({ data }): Promise<QueryResult<MedicalPayoutFoundationBundle>> => {
    return runQuery((ctx) => loadMedicalPayoutFoundationBundle(ctx, data.competenceMonth));
  });

export const syncMedicalProductionFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return { competenceMonth: expectCompetenceMonth(o.competenceMonth, "competenceMonth") };
  })
  .handler(async ({ data }): Promise<MutationResult<{ upserted: number }>> => {
    return runMutation((ctx) => syncMedicalProductionForCompetence(ctx, data.competenceMonth));
  });

export const createPayoutRuleFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    const rawPct =
      typeof o.payoutPercentage === "number" && !Number.isNaN(o.payoutPercentage)
        ? o.payoutPercentage
        : null;
    const rawFx =
      typeof o.fixedValue === "number" && !Number.isNaN(o.fixedValue) ? o.fixedValue : null;
    return {
      professionalId:
        o.professionalId && typeof o.professionalId === "string"
          ? expectUuid(o.professionalId, "professionalId")
          : null,
      specialty: expectOptionalString(o.specialty, "specialty", 120),
      insuranceProviderId:
        o.insuranceProviderId && typeof o.insuranceProviderId === "string"
          ? expectUuid(o.insuranceProviderId, "insuranceProviderId")
          : null,
      payoutType: expectPayoutRuleType(o.payoutType, "payoutType"),
      payoutPercentage: rawPct,
      fixedValue: rawFx,
      active: typeof o.active === "boolean" ? o.active : true,
    };
  })
  .handler(async ({ data }): Promise<MutationResult<PayoutRuleRow>> => {
    return runMutation((ctx) =>
      createPayoutRule(ctx, {
        professional_id: data.professionalId,
        specialty: data.specialty || "",
        insurance_provider_id: data.insuranceProviderId,
        payout_type: data.payoutType,
        payout_percentage: data.payoutPercentage,
        fixed_value: data.fixedValue,
        active: data.active,
      }),
    );
  });

export const setPayoutRuleActiveFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return {
      ruleId: expectUuid(o.ruleId, "ruleId"),
      active: Boolean(o.active),
    };
  })
  .handler(async ({ data }): Promise<MutationResult<void>> => {
    return runMutation((ctx) => setPayoutRuleActive(ctx, data.ruleId, data.active));
  });

export const ensureDraftMedicalPayoutFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return {
      professionalId: expectUuid(o.professionalId, "professionalId"),
      competenceMonth: expectCompetenceMonth(o.competenceMonth, "competenceMonth"),
    };
  })
  .handler(async ({ data }): Promise<MutationResult<MedicalPayoutRow>> => {
    return runMutation((ctx) =>
      ensureDraftMedicalPayout(ctx, data.professionalId, data.competenceMonth),
    );
  });

export const calculateMedicalPayoutFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return {
      payoutId: expectUuid(o.payoutId, "payoutId"),
      skipSync: Boolean(o.skipSync),
    };
  })
  .handler(async ({ data }): Promise<MutationResult<{ completed: true }>> => {
    return runMutation(async (ctx) => {
      await calculateMedicalPayout(ctx, data.payoutId, { syncProduction: !data.skipSync });
      return { completed: true as const };
    });
  });

export const markMedicalPayoutReviewedFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return { payoutId: expectUuid(o.payoutId, "payoutId") };
  })
  .handler(async ({ data }): Promise<MutationResult<MedicalPayoutRow>> => {
    return runMutation((ctx) => markMedicalPayoutReviewed(ctx, data.payoutId));
  });

export const markMedicalPayoutApprovedFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return { payoutId: expectUuid(o.payoutId, "payoutId") };
  })
  .handler(async ({ data }): Promise<MutationResult<MedicalPayoutRow>> => {
    return runMutation((ctx) => markMedicalPayoutApproved(ctx, data.payoutId));
  });

export const markMedicalPayoutPaidFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return { payoutId: expectUuid(o.payoutId, "payoutId") };
  })
  .handler(async ({ data }): Promise<MutationResult<MedicalPayoutRow>> => {
    return runMutation((ctx) => markMedicalPayoutPaid(ctx, data.payoutId));
  });

export const getMedicalPayoutWithItemsFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => {
    const obj = requireObject(raw, "query");
    return { payoutId: expectUuid(obj.payoutId, "payoutId") };
  })
  .handler(
    async ({
      data,
    }): Promise<QueryResult<Awaited<ReturnType<typeof getMedicalPayoutWithItems>>>> => {
      return runQuery((ctx) => getMedicalPayoutWithItems(ctx, data.payoutId));
    },
  );
