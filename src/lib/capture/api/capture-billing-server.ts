/**
 * Server functions — ponte captura → faturamento (guia capturada aprovada
 * vira guia TISS em rascunho).
 */
import { createServerFn } from "@tanstack/react-start";
import { ValidationError } from "@/lib/domain/operations/errors";
import { requireObject, requireString, runMutation, runQuery } from "@/lib/server/fn-helpers";
import {
  createGuideFromCapture,
  getCaptureBillingState,
  type CreateGuideFromCaptureInput,
} from "@/lib/services/tiss/capture-guide-bridge";

const GUIDE_TYPES = ["consulta", "sadt", "honorario_individual"] as const;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function requireDate(value: unknown, field: string): string {
  const s = requireString(value, field);
  if (!DATE_RE.test(s)) throw new ValidationError(`${field} inválida (AAAA-MM-DD).`, { field });
  return s;
}

export const getCaptureBillingStateFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => ({
    sessionId: requireString(requireObject(raw).sessionId, "sessionId"),
  }))
  .handler(async ({ data }) => {
    return runQuery((ctx) => getCaptureBillingState(ctx, data.sessionId));
  });

export const createGuideFromCaptureFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown): CreateGuideFromCaptureInput => {
    const obj = requireObject(raw);
    const guideType = requireString(obj.guideType, "guideType");
    if (!(GUIDE_TYPES as readonly string[]).includes(guideType)) {
      throw new ValidationError("Tipo de guia inválido.", { field: "guideType" });
    }
    const patientName = requireString(obj.patientName, "patientName").trim();
    if (!patientName)
      throw new ValidationError("Informe o nome do paciente.", { field: "patientName" });
    if (!Array.isArray(obj.items) || obj.items.length === 0 || obj.items.length > 50) {
      throw new ValidationError("Informe de 1 a 50 procedimentos.", { field: "items" });
    }
    const items = obj.items.map((rawItem, i) => {
      const item = requireObject(rawItem, `items[${i}]`);
      const quantity = Number(item.quantity);
      const unitValue = Number(item.unitValue);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) {
        throw new ValidationError(`Quantidade inválida no item ${i + 1}.`, { field: "quantity" });
      }
      if (!Number.isFinite(unitValue) || unitValue < 0) {
        throw new ValidationError(`Valor inválido no item ${i + 1}.`, { field: "unitValue" });
      }
      return {
        procedureId: requireString(item.procedureId, `items[${i}].procedureId`),
        quantity,
        unitValue: Math.round(unitValue * 100) / 100,
        executionDate: requireDate(item.executionDate, `items[${i}].executionDate`),
      };
    });
    const card =
      typeof obj.beneficiaryCardNumber === "string" ? obj.beneficiaryCardNumber.trim() : "";
    return {
      sessionId: requireString(obj.sessionId, "sessionId"),
      guideType: guideType as CreateGuideFromCaptureInput["guideType"],
      patientName: patientName.slice(0, 200),
      insuranceProviderId: requireString(obj.insuranceProviderId, "insuranceProviderId"),
      professionalId: requireString(obj.professionalId, "professionalId"),
      attendanceDate: requireDate(obj.attendanceDate, "attendanceDate"),
      beneficiaryCardNumber: card ? card.slice(0, 40) : null,
      items,
    };
  })
  .handler(async ({ data }) => {
    return runMutation((ctx) => createGuideFromCapture(ctx, data));
  });
