/**
 * Regras TISS estruturais — consistência do StructuredGuide.
 */
import type { AuditRule } from "../types/audit-rule";
import { makeFinding } from "./rule-helpers";

export const TISS_001: AuditRule = {
  id: "TISS-001",
  name: "Campos duplicados detectados",
  description: "Campos com múltiplas ocorrências no OCR podem indicar inconsistência.",
  category: "procedimentos",
  severity: "medio",
  blocking: false,
  field: "procedure_code",
  message: (ctx) => {
    const dupes = Object.values(ctx.guide.fields).filter((f) => f.status === "duplicate");
    return `${dupes.length} campo(s) com ocorrências duplicadas detectadas.`;
  },
  suggestedCorrection: "Revise os campos duplicados e confirme o valor correto.",
  evaluate: (ctx) => {
    const dupes = Object.values(ctx.guide.fields).filter(
      (f) =>
        f.status === "duplicate" &&
        (f.value == null || f.confidence < 0.85),
    );
    if (dupes.length > 0) {
      return makeFinding(TISS_001, ctx, {
        field: dupes[0]!.code,
        detectedValue: dupes[0]!.value,
      });
    }
    return null;
  },
};

export const TISS_002: AuditRule = {
  id: "TISS-002",
  name: "Campos fora de posição",
  description: "Campos detectados fora da região esperada no layout TISS.",
  category: "procedimentos",
  severity: "baixo",
  blocking: false,
  field: "beneficiary_name",
  message: "Campos detectados fora da posição esperada no formulário TISS.",
  suggestedCorrection: "Verifique se os valores estão nos campos corretos da guia.",
  evaluate: (ctx) => {
    const misplaced = Object.values(ctx.guide.fields).filter(
      (f) =>
        f.status === "out_of_position" &&
        (f.value == null || f.confidence < 0.85),
    );
    if (misplaced.length > 0) {
      return makeFinding(TISS_002, ctx, {
        field: misplaced[0]!.code,
        detectedValue: misplaced[0]!.value,
        severity: "baixo",
      });
    }
    return null;
  },
};

export const TISS_RULES: AuditRule[] = [TISS_001, TISS_002];
