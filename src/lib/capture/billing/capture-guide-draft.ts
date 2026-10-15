/**
 * Ponte captura → faturamento: transforma a guia capturada (já revisada e
 * aprovada) num rascunho de guia TISS faturável.
 *
 * Função pura — os catálogos (convênios, profissionais, procedimentos TUSS)
 * chegam prontos do service. Nada aqui grava; a pessoa confere o rascunho na
 * tela antes de criar a guia.
 */
import { matchTenantProfessional } from "../audit/data/tenant-professionals";
import type { CorrectionProposal } from "../correction/types/correction-proposal";
import type { StructuredField, StructuredGuide } from "../parser/types/structured-guide";

export type BillingGuideType = "consulta" | "sadt" | "honorario_individual";

export type DraftCatalogs = {
  providers: ReadonlyArray<{ id: string; ansCode: string | null }>;
  professionals: ReadonlyArray<{ id: string; crm: string | null; fullName?: string | null }>;
  procedures: ReadonlyArray<{
    id: string;
    code: string;
    description: string;
    defaultValue: number;
  }>;
};

export type CaptureGuideDraftItem = {
  tussCode: string;
  procedureId: string | null;
  description: string | null;
  executionDate: string | null;
  quantity: number;
  unitValue: number | null;
};

export type CaptureGuideDraft = {
  guideType: BillingGuideType | null;
  patientName: string | null;
  beneficiaryCardNumber: string | null;
  attendanceDate: string | null;
  operatorAnsCode: string | null;
  insuranceProviderId: string | null;
  executingCrm: string | null;
  professionalId: string | null;
  items: CaptureGuideDraftItem[];
  /** O que a pessoa precisa resolver antes de criar a guia. */
  warnings: string[];
};

const GUIDE_TYPE_MAP: Record<StructuredGuide["guideType"], BillingGuideType | null> = {
  guia_consulta: "consulta",
  guia_sadt: "sadt",
  guia_honorario: "honorario_individual",
  unknown: null,
};

/** Valor final do campo: correção aceita/editada pelo revisor vence o OCR. */
function correctedValues(corrections: readonly CorrectionProposal[]): Map<string, string> {
  const out = new Map<string, string>();
  for (const c of corrections) {
    if (c.status === "edited" && c.editedValue) out.set(c.field, c.editedValue);
    else if ((c.status === "accepted" || c.status === "applied") && c.suggestedValue) {
      out.set(c.field, c.editedValue || c.suggestedValue);
    }
  }
  return out;
}

function fieldValue(
  field: StructuredField | undefined,
  code: string,
  corrected: Map<string, string>,
): string | null {
  const fixed = corrected.get(code);
  if (fixed?.trim()) return fixed.trim();
  const value = field?.value ?? field?.rawValue ?? null;
  return value?.trim() ? value.trim() : null;
}

function digits(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

function toIsoDate(value: string | null): string | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const br = value.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (!br) return null;
  const year = br[3]!.length === 2 ? `20${br[3]}` : br[3]!;
  return `${year}-${br[2]!.padStart(2, "0")}-${br[1]!.padStart(2, "0")}`;
}

function toMoney(value: string | null): number | null {
  if (!value) return null;
  const n = /^\d+(\.\d{1,2})?$/.test(value)
    ? Number(value)
    : Number(
        value
          .replace(/R\$\s*/i, "")
          .replace(/\./g, "")
          .replace(",", "."),
      );
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

export function buildCaptureGuideDraft(
  guide: StructuredGuide,
  corrections: readonly CorrectionProposal[],
  catalogs: DraftCatalogs,
): CaptureGuideDraft {
  const corrected = correctedValues(corrections);
  const f = (code: string) => fieldValue(guide.fields[code], code, corrected);
  const warnings: string[] = [];

  const guideType = GUIDE_TYPE_MAP[guide.guideType];
  if (!guideType)
    warnings.push("Tipo de guia não identificado — escolha consulta, SP/SADT ou honorário.");

  const patientName = f("beneficiary_name");
  if (!patientName) warnings.push("Nome do beneficiário não foi lido.");

  const attendanceDate = toIsoDate(f("attendance_date") ?? f("execution_date"));
  if (!attendanceDate) warnings.push("Data do atendimento não foi lida.");

  const operatorAnsCode = digits(f("operator_ans_code")) || null;
  const provider = operatorAnsCode
    ? catalogs.providers.find((p) => digits(p.ansCode) === operatorAnsCode)
    : undefined;
  if (!operatorAnsCode) warnings.push("Código ANS da operadora não foi lido — escolha o convênio.");
  else if (!provider) {
    warnings.push(`Nenhum convênio cadastrado com o código ANS ${operatorAnsCode}.`);
  }

  const executingCrm = f("executing_crm");
  const executingName = f("executing_name");
  const match = matchTenantProfessional(
    catalogs.professionals.map((p) => ({ id: p.id, crm: p.crm, fullName: p.fullName ?? null })),
    { crm: executingCrm, name: executingName },
  );
  const professional = match.professional;
  if (!executingCrm && !professional)
    warnings.push("CRM do executante não foi lido — escolha o profissional.");
  else if (!executingCrm && professional)
    warnings.push(
      `CRM do executante não foi lido — profissional reconhecido pelo nome (${professional.fullName}); confira.`,
    );
  else if (!professional)
    warnings.push(`Nenhum profissional cadastrado com o CRM ${executingCrm}.`);
  else if (match.nameMismatch)
    warnings.push(
      `O CRM ${executingCrm} é de ${professional.fullName}, mas a guia traz "${executingName}" — confira o executante.`,
    );

  const procedureByCode = new Map(catalogs.procedures.map((p) => [digits(p.code), p]));
  const seen = new Set<string>();
  const items: CaptureGuideDraftItem[] = [];
  const lines = guide.procedures.length
    ? guide.procedures.map((line) => line.fields)
    : guide.fields.procedure_code
      ? [{ procedure_code: guide.fields.procedure_code, total_value: guide.fields.total_value }]
      : [];
  for (const fields of lines) {
    const tussCode = digits(fields.procedure_code?.value ?? fields.procedure_code?.rawValue);
    if (!tussCode) continue;
    const executionDate = toIsoDate(fields.execution_date?.value ?? null) ?? attendanceDate ?? null;
    const key = `${tussCode}|${executionDate ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const procedure = procedureByCode.get(tussCode);
    const readValue = toMoney(fields.total_value?.value ?? fields.total_value?.rawValue ?? null);
    items.push({
      tussCode,
      procedureId: procedure?.id ?? null,
      description: procedure?.description ?? null,
      executionDate,
      quantity: 1,
      unitValue: readValue ?? (procedure ? procedure.defaultValue : null),
    });
    if (!procedure)
      warnings.push(`Procedimento TUSS ${tussCode} não está no catálogo da instituição.`);
  }
  if (items.length === 0) warnings.push("Nenhum procedimento TUSS foi lido na guia.");

  return {
    guideType,
    patientName,
    beneficiaryCardNumber: f("beneficiary_card_number"),
    attendanceDate,
    operatorAnsCode,
    insuranceProviderId: provider?.id ?? null,
    executingCrm,
    professionalId: professional?.id ?? null,
    items,
    warnings,
  };
}
