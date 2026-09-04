/**
 * Server functions — fundação TISS operacional (convênios, TUSS, guias, lotes, XML).
 */
import { createServerFn } from "@tanstack/react-start";
import { ValidationError, mapPostgresError } from "@/lib/domain/operations/errors";
import type {
  Json,
  JsonObject,
  TissAppealStatus,
  TissDenialStatus,
  TissDenialType,
  TissGuideStatus,
  TissGuideType,
  TissReturnStatus,
} from "@/lib/database.types";
import {
  expectDateISO,
  expectNonEmptyString,
  expectOptionalString,
  expectUuid,
} from "@/lib/domain/operations/validation";
import {
  requireObject,
  runMutation,
  runQuery,
  type MutationResult,
  type QueryResult,
} from "@/lib/server/fn-helpers";
import {
  addTissGuideItem,
  assignGuideToBatch,
  closeTissBatch,
  createInsuranceContract,
  createInsuranceProvider,
  createInsuranceRule,
  createTissBatch,
  createTissDenial,
  createTissDenialAppeal,
  createTissGuide,
  createTissReturn,
  createTussProcedure,
  isHomologationStatus,
  listInsuranceContracts,
  listInsuranceProviders,
  listInsuranceRules,
  listTissBatches,
  listTissDenialAppeals,
  listTissDenials,
  listTissGuides,
  listTissReturns,
  listTussProcedures,
  loadHomologationReadiness,
  loadOperationalBillingSummary,
  loadOperationalLossSnapshot,
  removeGuideFromBatch,
  removeTissGuideItem,
  setInsuranceProviderHomologationStatus,
  setTissGuideStatus,
  updateTissDenialAppealStatus,
  updateTissDenialStatus,
  updateTissReturnStatus,
  type HomologationStatus,
} from "@/lib/services/tiss";
import {
  exportTissBatchXmlViaEnterprise,
  listTissBatchExportsViaEnterprise,
} from "@/lib/capture/enterprise/process-xml-via-enterprise";

const GUIDE_TYPES = new Set<TissGuideType>(["consulta", "sadt", "honorario_individual"]);
const GUIDE_STATUSES = new Set<TissGuideStatus>([
  "draft",
  "pending_review",
  "approved",
  "billed",
  "denied",
]);

function expectTissGuideType(v: unknown, field: string): TissGuideType {
  if (typeof v !== "string" || !GUIDE_TYPES.has(v as TissGuideType)) {
    throw new ValidationError(`Campo ${field} inválido (tipo de guia).`, { field });
  }
  return v as TissGuideType;
}

function expectTissGuideStatus(v: unknown, field: string): TissGuideStatus {
  if (typeof v !== "string" || !GUIDE_STATUSES.has(v as TissGuideStatus)) {
    throw new ValidationError(`Campo ${field} inválido (status de guia).`, { field });
  }
  return v as TissGuideStatus;
}

const DENIAL_TYPES = new Set<TissDenialType>(["partial", "total", "administrative", "technical"]);
const DENIAL_STATUSES = new Set<TissDenialStatus>([
  "identified",
  "under_review",
  "appealed",
  "reversed",
  "accepted",
]);
const APPEAL_STATUSES = new Set<TissAppealStatus>([
  "pending",
  "submitted",
  "under_review",
  "accepted",
  "rejected",
  "withdrawn",
]);
const RETURN_STATUSES = new Set<TissReturnStatus>([
  "received",
  "processing",
  "processed",
  "failed",
]);

function expectTissDenialType(v: unknown, field: string): TissDenialType {
  if (typeof v !== "string" || !DENIAL_TYPES.has(v as TissDenialType)) {
    throw new ValidationError(`Campo ${field} inválido (tipo de glosa).`, { field });
  }
  return v as TissDenialType;
}

function expectTissDenialStatus(v: unknown, field: string): TissDenialStatus {
  if (typeof v !== "string" || !DENIAL_STATUSES.has(v as TissDenialStatus)) {
    throw new ValidationError(`Campo ${field} inválido (status de glosa).`, { field });
  }
  return v as TissDenialStatus;
}

function expectTissAppealStatus(v: unknown, field: string): TissAppealStatus {
  if (typeof v !== "string" || !APPEAL_STATUSES.has(v as TissAppealStatus)) {
    throw new ValidationError(`Campo ${field} inválido (status de recurso).`, { field });
  }
  return v as TissAppealStatus;
}

function expectTissReturnStatus(v: unknown, field: string): TissReturnStatus {
  if (typeof v !== "string" || !RETURN_STATUSES.has(v as TissReturnStatus)) {
    throw new ValidationError(`Campo ${field} inválido (status de retorno).`, { field });
  }
  return v as TissReturnStatus;
}

const REGIME_ATENDIMENTO_CODES = new Set(["01", "02", "03", "04", "05"]);
const CARATER_ATENDIMENTO_CODES = new Set(["1", "2"]);
const TIPO_ATENDIMENTO_CODES = new Set(["01", "02", "03", "04", "08", "09", "10", "13", "23"]);
const TIPO_CONSULTA_CODES = new Set(["1", "2", "3", "4"]);

function expectOptionalCode(v: unknown, field: string, allowed: Set<string>): string | null {
  if (v === undefined || v === null || v === "") return null;
  if (typeof v !== "string" || !allowed.has(v)) {
    throw new ValidationError(`Campo ${field} inválido (código TISS fora da tabela oficial).`, { field });
  }
  return v;
}

function expectOptionalTrimmedString(v: unknown, field: string, maxLength: number): string | null {
  if (v === undefined || v === null || v === "") return null;
  if (typeof v !== "string" || v.length > maxLength) {
    throw new ValidationError(`Campo ${field} inválido.`, { field });
  }
  return v.trim() || null;
}

function expectOptionalCompetenceMonth(v: unknown, field: string): string | null {
  if (v === undefined || v === null || v === "") return null;
  if (typeof v !== "string") {
    throw new ValidationError(`Campo ${field} inválido (mês de competência).`, { field });
  }
  if (!/^\d{4}-\d{2}-01$/.test(v)) {
    throw new ValidationError(`Campo ${field} deve ser ISO YYYY-MM-01.`, { field });
  }
  return v;
}

export type TissFoundationBundle = Awaited<ReturnType<typeof loadTissFoundationBundle>>;

async function loadTissFoundationBundle(ctx: Parameters<typeof listInsuranceProviders>[0]) {
  const [
    insuranceProviders,
    tussProcedures,
    tissGuides,
    tissBatches,
    billingSummary,
    professionals,
    tissReturns,
    tissDenials,
    tissDenialAppeals,
    operationalLoss,
  ] = await Promise.all([
    listInsuranceProviders(ctx),
    listTussProcedures(ctx),
    listTissGuides(ctx),
    listTissBatches(ctx),
    loadOperationalBillingSummary(ctx),
    ctx.client
      .from("professionals")
      .select("id, specialty, crm, profile_id")
      .eq("tenant_id", ctx.tenantId)
      .order("created_at", { ascending: false })
      .limit(300)
      .then(({ data, error }) => {
        if (error) throw mapPostgresError(error);
        return data ?? [];
      }),
    listTissReturns(ctx),
    listTissDenials(ctx),
    listTissDenialAppeals(ctx),
    loadOperationalLossSnapshot(ctx, null),
  ]);
  return {
    insuranceProviders,
    tussProcedures,
    tissGuides,
    tissBatches,
    billingSummary,
    professionals,
    tissReturns,
    tissDenials,
    tissDenialAppeals,
    operationalLoss,
  };
}

export const loadTissFoundationBundleFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<QueryResult<TissFoundationBundle>> => {
    return runQuery((ctx) => loadTissFoundationBundle(ctx));
  },
);

export const listTissBatchExportsFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => {
    const obj = requireObject(raw, "query");
    return { batchId: expectUuid(obj.batchId, "batchId") };
  })
  .handler(
    async ({
      data,
    }): Promise<QueryResult<Awaited<ReturnType<typeof listTissBatchExportsViaEnterprise>>>> => {
      return runQuery((ctx) => listTissBatchExportsViaEnterprise(ctx, data.batchId));
    },
  );

export const createInsuranceProviderFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return {
      name: expectNonEmptyString(o.name, "name"),
      ansCode: expectOptionalString(o.ansCode, "ansCode", 32),
    };
  })
  .handler(async ({ data }): Promise<MutationResult<Json>> => {
    return runMutation(
      async (ctx) =>
        (await createInsuranceProvider(ctx, {
          name: data.name,
          ans_code: data.ansCode || undefined,
        })) as Json,
    );
  });

export const createInsuranceContractFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return {
      insuranceProviderId: expectUuid(o.insuranceProviderId, "insuranceProviderId"),
      contractNumber: expectNonEmptyString(o.contractNumber, "contractNumber", 64),
      name: expectOptionalString(o.name, "name", 120),
    };
  })
  .handler(async ({ data }): Promise<MutationResult<Json>> => {
    return runMutation(
      async (ctx) =>
        (await createInsuranceContract(ctx, {
          insurance_provider_id: data.insuranceProviderId,
          contract_number: data.contractNumber,
          name: data.name || undefined,
        })) as Json,
    );
  });

export const createInsuranceRuleFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return {
      insuranceContractId: expectUuid(o.insuranceContractId, "insuranceContractId"),
      name: expectNonEmptyString(o.name, "name"),
      parameters:
        typeof o.parameters === "object" && o.parameters !== null && !Array.isArray(o.parameters)
          ? (o.parameters as JsonObject)
          : {},
    };
  })
  .handler(async ({ data }): Promise<MutationResult<Json>> => {
    return runMutation(
      async (ctx) =>
        (await createInsuranceRule(ctx, {
          insurance_contract_id: data.insuranceContractId,
          name: data.name,
          parameters: data.parameters,
        })) as Json,
    );
  });

export const createTussProcedureFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return {
      code: expectNonEmptyString(o.code, "code", 16),
      description: expectNonEmptyString(o.description, "description", 512),
      specialty: expectOptionalString(o.specialty, "specialty", 120),
      operationalGroup: expectOptionalString(o.operationalGroup, "operationalGroup", 120),
      defaultValue: typeof o.defaultValue === "number" ? o.defaultValue : 0,
    };
  })
  .handler(async ({ data }): Promise<MutationResult<Json>> => {
    return runMutation(
      async (ctx) =>
        (await createTussProcedure(ctx, {
          code: data.code,
          description: data.description,
          specialty: data.specialty,
          operational_group: data.operationalGroup,
          default_value: data.defaultValue,
        })) as Json,
    );
  });

export const createTissGuideFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return {
      guideType: expectTissGuideType(o.guideType, "guideType"),
      patientName: expectNonEmptyString(o.patientName, "patientName", 200),
      insuranceProviderId: expectUuid(o.insuranceProviderId, "insuranceProviderId"),
      insuranceContractId:
        o.insuranceContractId && typeof o.insuranceContractId === "string"
          ? expectUuid(o.insuranceContractId, "insuranceContractId")
          : null,
      professionalId: expectUuid(o.professionalId, "professionalId"),
      attendanceDate: expectDateISO(o.attendanceDate, "attendanceDate"),
      beneficiaryCardNumber: expectOptionalTrimmedString(o.beneficiaryCardNumber, "beneficiaryCardNumber", 20),
      beneficiaryIsNewborn: o.beneficiaryIsNewborn === true,
      regimeAtendimento: expectOptionalCode(o.regimeAtendimento, "regimeAtendimento", REGIME_ATENDIMENTO_CODES),
      caraterAtendimento: expectOptionalCode(o.caraterAtendimento, "caraterAtendimento", CARATER_ATENDIMENTO_CODES),
      tipoAtendimento: expectOptionalCode(o.tipoAtendimento, "tipoAtendimento", TIPO_ATENDIMENTO_CODES),
      tipoConsulta: expectOptionalCode(o.tipoConsulta, "tipoConsulta", TIPO_CONSULTA_CODES),
    };
  })
  .handler(async ({ data }): Promise<MutationResult<Json>> => {
    return runMutation(
      async (ctx) =>
        (await createTissGuide(ctx, {
          guide_type: data.guideType,
          patient_name: data.patientName,
          insurance_provider_id: data.insuranceProviderId,
          insurance_contract_id: data.insuranceContractId,
          professional_id: data.professionalId,
          attendance_date: data.attendanceDate,
          beneficiary_card_number: data.beneficiaryCardNumber,
          beneficiary_is_newborn: data.beneficiaryIsNewborn,
          regime_atendimento: data.regimeAtendimento,
          carater_atendimento: data.caraterAtendimento,
          tipo_atendimento: data.tipoAtendimento,
          tipo_consulta: data.tipoConsulta,
        })) as Json,
    );
  });

export const setTissGuideStatusFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return {
      guideId: expectUuid(o.guideId, "guideId"),
      status: expectTissGuideStatus(o.status, "status"),
    };
  })
  .handler(async ({ data }): Promise<MutationResult<Json>> => {
    return runMutation(
      async (ctx) => (await setTissGuideStatus(ctx, data.guideId, data.status)) as Json,
    );
  });

export const addTissGuideItemFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    const rawUv =
      typeof o.unitValue === "number" && !Number.isNaN(o.unitValue)
        ? o.unitValue
        : typeof o.unitValue === "string"
          ? Number(o.unitValue)
          : NaN;
    if (!Number.isFinite(rawUv) || rawUv < 0) {
      throw new ValidationError("Campo unitValue inválido.", { field: "unitValue" });
    }
    return {
      guideId: expectUuid(o.guideId, "guideId"),
      procedureId: expectUuid(o.procedureId, "procedureId"),
      quantity: typeof o.quantity === "number" && o.quantity >= 1 ? Math.floor(o.quantity) : 1,
      unitValue: rawUv,
      executionDate: expectDateISO(o.executionDate, "executionDate"),
    };
  })
  .handler(async ({ data }): Promise<MutationResult<Json>> => {
    return runMutation(
      async (ctx) =>
        (await addTissGuideItem(ctx, {
          guide_id: data.guideId,
          procedure_id: data.procedureId,
          quantity: data.quantity,
          unit_value: data.unitValue,
          execution_date: data.executionDate,
        })) as Json,
    );
  });

export const removeTissGuideItemFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return { itemId: expectUuid(o.itemId, "itemId") };
  })
  .handler(async ({ data }): Promise<MutationResult<void>> => {
    return runMutation((ctx) => removeTissGuideItem(ctx, data.itemId));
  });

export const createTissBatchFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return { competence: expectDateISO(o.competence, "competence") };
  })
  .handler(async ({ data }): Promise<MutationResult<Json>> => {
    return runMutation(async (ctx) => (await createTissBatch(ctx, data.competence)) as Json);
  });

export const assignGuideToBatchFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return {
      guideId: expectUuid(o.guideId, "guideId"),
      batchId: expectUuid(o.batchId, "batchId"),
    };
  })
  .handler(async ({ data }): Promise<MutationResult<void>> => {
    return runMutation((ctx) =>
      assignGuideToBatch(ctx, { guide_id: data.guideId, batch_id: data.batchId }),
    );
  });

export const removeGuideFromBatchFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return { guideId: expectUuid(o.guideId, "guideId") };
  })
  .handler(async ({ data }): Promise<MutationResult<void>> => {
    return runMutation((ctx) => removeGuideFromBatch(ctx, data.guideId));
  });

export const closeTissBatchFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return { batchId: expectUuid(o.batchId, "batchId") };
  })
  .handler(async ({ data }): Promise<MutationResult<Json>> => {
    return runMutation(async (ctx) => (await closeTissBatch(ctx, data.batchId)) as Json);
  });

export const exportTissBatchXmlFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return { batchId: expectUuid(o.batchId, "batchId") };
  })
  .handler(async ({ data }): Promise<MutationResult<{ xml: string; exportId: string }>> => {
    return runMutation(async (ctx) => {
      const result = await exportTissBatchXmlViaEnterprise(ctx, data.batchId);
      return { xml: result.xml, exportId: result.exportId };
    });
  });

export const listInsuranceContractsFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => {
    const obj = requireObject(raw, "query");
    return { providerId: expectUuid(obj.providerId, "providerId") };
  })
  .handler(
    async ({ data }): Promise<QueryResult<Awaited<ReturnType<typeof listInsuranceContracts>>>> => {
      return runQuery((ctx) => listInsuranceContracts(ctx, data.providerId));
    },
  );

export const listInsuranceRulesFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => {
    const obj = requireObject(raw, "query");
    return { contractId: expectUuid(obj.contractId, "contractId") };
  })
  .handler(
    async ({ data }): Promise<QueryResult<Awaited<ReturnType<typeof listInsuranceRules>>>> => {
      return runQuery((ctx) => listInsuranceRules(ctx, data.contractId));
    },
  );

export const loadOperationalLossSnapshotFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => {
    const obj =
      raw != null && typeof raw === "object" && !Array.isArray(raw)
        ? (raw as Record<string, unknown>)
        : {};
    return {
      competenceMonth: expectOptionalCompetenceMonth(obj.competenceMonth, "competenceMonth"),
    };
  })
  .handler(
    async ({
      data,
    }): Promise<QueryResult<Awaited<ReturnType<typeof loadOperationalLossSnapshot>>>> => {
      return runQuery((ctx) => loadOperationalLossSnapshot(ctx, data.competenceMonth));
    },
  );

export const createTissReturnFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return {
      batchId: expectUuid(o.batchId, "batchId"),
      returnReference: expectNonEmptyString(o.returnReference, "returnReference", 120),
    };
  })
  .handler(async ({ data }): Promise<MutationResult<Json>> => {
    return runMutation(
      async (ctx) =>
        (await createTissReturn(ctx, {
          batch_id: data.batchId,
          return_reference: data.returnReference,
        })) as Json,
    );
  });

export const updateTissReturnStatusFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return {
      returnId: expectUuid(o.returnId, "returnId"),
      status: expectTissReturnStatus(o.status, "status"),
    };
  })
  .handler(async ({ data }): Promise<MutationResult<Json>> => {
    return runMutation(
      async (ctx) =>
        (await updateTissReturnStatus(ctx, data.returnId, { status: data.status })) as Json,
    );
  });

export const createTissDenialFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    const rawDv =
      typeof o.deniedValue === "number" && !Number.isNaN(o.deniedValue)
        ? o.deniedValue
        : typeof o.deniedValue === "string"
          ? Number(o.deniedValue)
          : NaN;
    if (!Number.isFinite(rawDv) || rawDv < 0) {
      throw new ValidationError("Campo deniedValue inválido.", { field: "deniedValue" });
    }
    return {
      returnId: expectUuid(o.returnId, "returnId"),
      guideId: expectUuid(o.guideId, "guideId"),
      denialType: expectTissDenialType(o.denialType, "denialType"),
      denialReasonCode: expectOptionalString(o.denialReasonCode, "denialReasonCode", 64),
      denialReasonDescription: expectOptionalString(
        o.denialReasonDescription,
        "denialReasonDescription",
        500,
      ),
      deniedValue: rawDv,
      status:
        o.status !== undefined && o.status !== null
          ? expectTissDenialStatus(o.status, "status")
          : undefined,
    };
  })
  .handler(async ({ data }): Promise<MutationResult<Json>> => {
    return runMutation(
      async (ctx) =>
        (await createTissDenial(ctx, {
          return_id: data.returnId,
          guide_id: data.guideId,
          denial_type: data.denialType,
          denial_reason_code: data.denialReasonCode || undefined,
          denial_reason_description: data.denialReasonDescription || undefined,
          denied_value: data.deniedValue,
          status: data.status,
        })) as Json,
    );
  });

export const updateTissDenialStatusFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    const patch: {
      status?: ReturnType<typeof expectTissDenialStatus>;
      denied_value?: number;
      denial_reason_code?: string;
      denial_reason_description?: string;
    } = {};
    if ("status" in o && o.status !== undefined)
      patch.status = expectTissDenialStatus(o.status, "status");
    if ("deniedValue" in o && o.deniedValue !== undefined) {
      const rawDv =
        typeof o.deniedValue === "number" && !Number.isNaN(o.deniedValue)
          ? o.deniedValue
          : typeof o.deniedValue === "string"
            ? Number(o.deniedValue)
            : NaN;
      if (!Number.isFinite(rawDv) || rawDv < 0) {
        throw new ValidationError("Campo deniedValue inválido.", { field: "deniedValue" });
      }
      patch.denied_value = rawDv;
    }
    if ("denialReasonCode" in o && o.denialReasonCode !== undefined) {
      patch.denial_reason_code = expectOptionalString(o.denialReasonCode, "denialReasonCode", 64);
    }
    if ("denialReasonDescription" in o && o.denialReasonDescription !== undefined) {
      patch.denial_reason_description = expectOptionalString(
        o.denialReasonDescription,
        "denialReasonDescription",
        500,
      );
    }
    if (Object.keys(patch).length === 0) {
      throw new ValidationError("Informe ao menos um campo para atualizar a glosa.", {
        field: "patch",
      });
    }
    return { denialId: expectUuid(o.denialId, "denialId"), patch };
  })
  .handler(async ({ data }): Promise<MutationResult<Json>> => {
    return runMutation(
      async (ctx) => (await updateTissDenialStatus(ctx, data.denialId, data.patch)) as Json,
    );
  });

export const createTissDenialAppealFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return {
      denialId: expectUuid(o.denialId, "denialId"),
      appealReason: expectNonEmptyString(o.appealReason, "appealReason", 2000),
    };
  })
  .handler(async ({ data }): Promise<MutationResult<Json>> => {
    return runMutation(
      async (ctx) =>
        (await createTissDenialAppeal(ctx, {
          denial_id: data.denialId,
          appeal_reason: data.appealReason,
        })) as Json,
    );
  });

export const updateTissDenialAppealStatusFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return {
      appealId: expectUuid(o.appealId, "appealId"),
      appealStatus: expectTissAppealStatus(o.appealStatus, "appealStatus"),
    };
  })
  .handler(async ({ data }): Promise<MutationResult<Json>> => {
    return runMutation(
      async (ctx) =>
        (await updateTissDenialAppealStatus(ctx, data.appealId, {
          appeal_status: data.appealStatus,
        })) as Json,
    );
  });

function expectHomologationStatus(v: unknown, field: string): HomologationStatus {
  if (!isHomologationStatus(v)) {
    throw new ValidationError(`Campo ${field} inválido (status de homologação).`, { field });
  }
  return v;
}

export type HomologationReadinessBundle = Awaited<ReturnType<typeof loadHomologationReadiness>>;

export const loadHomologationReadinessFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<QueryResult<HomologationReadinessBundle>> => {
    return runQuery((ctx) => loadHomologationReadiness(ctx));
  },
);

export const setInsuranceProviderHomologationStatusFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    return {
      providerId: expectUuid(o.providerId, "providerId"),
      status: expectHomologationStatus(o.status, "status"),
      notes: expectOptionalString(o.notes, "notes", 2000),
    };
  })
  .handler(async ({ data }): Promise<MutationResult<Awaited<ReturnType<typeof setInsuranceProviderHomologationStatus>>>> => {
    return runMutation((ctx) =>
      setInsuranceProviderHomologationStatus(ctx, {
        providerId: data.providerId,
        status: data.status,
        notes: data.notes,
      }),
    );
  });
