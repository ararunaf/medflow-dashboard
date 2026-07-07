/**
 * Regras — Datas
 */
import { normalizeDate } from "../../parser/normalizers";
import type { AuditRule } from "../types/audit-rule";
import { missingFieldFinding, invalidFormatFinding, makeFinding } from "./rule-helpers";

function parseIsoDate(iso: string): Date | null {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export const DAT_001: AuditRule = {
  id: "DAT-001",
  name: "Data de atendimento obrigatória",
  description: "Data do atendimento é obrigatória para faturamento TISS.",
  category: "datas",
  severity: "alto",
  blocking: false,
  field: "attendance_date",
  message: "Data do atendimento não informada.",
  suggestedCorrection: "Informe a data do atendimento.",
  evaluate: (ctx) => (ctx.isMissing("attendance_date") ? missingFieldFinding(DAT_001, ctx) : null),
};

export const DAT_002: AuditRule = {
  id: "DAT-002",
  name: "Data de atendimento inválida",
  description: "Data do atendimento deve estar em formato válido.",
  category: "datas",
  severity: "alto",
  blocking: false,
  field: "attendance_date",
  message: (ctx) => `Data de atendimento inválida: "${ctx.getValue("attendance_date") ?? ""}".`,
  suggestedCorrection: "Corrija a data do atendimento (DD/MM/AAAA).",
  evaluate: (ctx) => {
    const raw = ctx.getField("attendance_date")?.rawValue ?? ctx.getValue("attendance_date");
    if (!raw || ctx.isMissing("attendance_date")) return null;
    if (normalizeDate(raw) == null) {
      return invalidFormatFinding(DAT_002, ctx, raw, "Data válida (DD/MM/AAAA)");
    }
    return null;
  },
};

export const DAT_003: AuditRule = {
  id: "DAT-003",
  name: "Data de atendimento futura",
  description: "Atendimento não pode ter data futura.",
  category: "datas",
  severity: "critico",
  blocking: true,
  field: "attendance_date",
  message: (ctx) => `Data de atendimento (${ctx.getValue("attendance_date")}) é futura.`,
  suggestedCorrection: "Corrija a data do atendimento para uma data passada ou atual.",
  evaluate: (ctx) => {
    const value = ctx.getValue("attendance_date");
    if (!value) return null;
    const parsed = parseIsoDate(value);
    if (!parsed) return null;
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (parsed > today) {
      return makeFinding(DAT_003, ctx, { detectedValue: value, expectedValue: "Data ≤ hoje" });
    }
    return null;
  },
};

export const DAT_004: AuditRule = {
  id: "DAT-004",
  name: "Data execução anterior ao atendimento",
  description: "Data de execução não pode ser anterior à data de atendimento.",
  category: "datas",
  severity: "alto",
  blocking: false,
  field: "execution_date",
  message: "Data de execução é anterior à data de atendimento.",
  suggestedCorrection: "Corrija a data de execução para ser igual ou posterior ao atendimento.",
  evaluate: (ctx) => {
    const attendance = ctx.getValue("attendance_date");
    const execution = ctx.getValue("execution_date");
    if (!attendance || !execution) return null;
    const att = parseIsoDate(attendance);
    const exec = parseIsoDate(execution);
    if (!att || !exec) return null;
    if (exec < att) {
      return makeFinding(DAT_004, ctx, {
        field: "execution_date",
        detectedValue: execution,
        expectedValue: `≥ ${attendance}`,
      });
    }
    return null;
  },
};

export const DAT_005: AuditRule = {
  id: "DAT-005",
  name: "Data de execução inválida",
  description: "Data de execução deve estar em formato válido quando informada.",
  category: "datas",
  severity: "medio",
  blocking: false,
  field: "execution_date",
  message: (ctx) => `Data de execução inválida: "${ctx.getValue("execution_date") ?? ""}".`,
  suggestedCorrection: "Corrija a data de execução (DD/MM/AAAA).",
  evaluate: (ctx) => {
    const raw = ctx.getField("execution_date")?.rawValue ?? ctx.getValue("execution_date");
    if (!raw || ctx.isMissing("execution_date")) return null;
    if (normalizeDate(raw) == null) {
      return invalidFormatFinding(DAT_005, ctx, raw, "Data válida (DD/MM/AAAA)", "execution_date");
    }
    return null;
  },
};

export const DATAS_RULES: AuditRule[] = [DAT_001, DAT_002, DAT_003, DAT_004, DAT_005];
