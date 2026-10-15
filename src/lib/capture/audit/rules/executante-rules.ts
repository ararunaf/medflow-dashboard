/**
 * Regras — Executante
 */
import { normalizeCrm, normalizeCro } from "../../parser/normalizers";
import type { AuditRule } from "../types/audit-rule";
import { makeFinding, missingFieldFinding, invalidFormatFinding } from "./rule-helpers";

export const EXE_001: AuditRule = {
  id: "EXE-001",
  name: "CRM executante obrigatório",
  description: "CRM do profissional executante é obrigatório — glosa ANS 2603 frequente.",
  category: "executante",
  severity: "alto",
  blocking: false,
  field: "executing_crm",
  message: "CRM do profissional executante não informado.",
  suggestedCorrection: "Informe o CRM e UF do profissional executante.",
  evaluate: (ctx) => (ctx.isMissing("executing_crm") ? missingFieldFinding(EXE_001, ctx) : null),
};

export const EXE_002: AuditRule = {
  id: "EXE-002",
  name: "CRM executante inválido",
  description: "CRM deve estar no formato UF-NNNNNN ou equivalente normalizado.",
  category: "executante",
  severity: "alto",
  blocking: false,
  field: "executing_crm",
  message: (ctx) => `CRM executante inválido: "${ctx.getValue("executing_crm") ?? ""}".`,
  suggestedCorrection: "Corrija o CRM do executante (ex.: SP-123456).",
  evaluate: (ctx) => {
    const raw = ctx.getField("executing_crm")?.rawValue ?? ctx.getValue("executing_crm");
    if (!raw || ctx.isMissing("executing_crm")) return null;
    if (normalizeCrm(raw) == null) {
      return invalidFormatFinding(EXE_002, ctx, raw, "CRM no formato UF-NNNNNN");
    }
    return null;
  },
};

export const EXE_003: AuditRule = {
  id: "EXE-003",
  name: "CRO executante inválido",
  description: "CRO informado deve estar no formato UF-NNNNNN.",
  category: "executante",
  severity: "medio",
  blocking: false,
  field: "executing_cro",
  message: (ctx) => `CRO executante inválido: "${ctx.getValue("executing_cro") ?? ""}".`,
  suggestedCorrection: "Corrija o CRO do executante (ex.: SP-123456).",
  evaluate: (ctx) => {
    const field = ctx.getField("executing_cro");
    if (!field || field.status === "missing") return null;
    const raw = field.rawValue ?? field.value;
    if (!raw) return null;
    if (normalizeCro(raw) == null) {
      return invalidFormatFinding(EXE_003, ctx, raw, "CRO no formato UF-NNNNNN", "executing_cro");
    }
    return null;
  },
};

export const EXE_004: AuditRule = {
  id: "EXE-004",
  name: "Executante não cadastrado na instituição",
  description:
    "O CRM do executante lido na guia não corresponde a nenhum profissional cadastrado — a guia não pode ser atribuída nem faturada em nome dele.",
  category: "executante",
  severity: "alto",
  blocking: false,
  field: "executing_crm",
  message: (ctx) =>
    `Nenhum profissional cadastrado na instituição com o CRM ${ctx.executingProfessional.readCrm ?? ""}.`,
  suggestedCorrection:
    "Confira o CRM lido na guia; se estiver correto, cadastre o profissional antes de faturar.",
  evaluate: (ctx) => {
    const rec = ctx.executingProfessional;
    if (rec.status !== "not_registered" || !rec.readCrm) return null;
    const raw = ctx.getField("executing_crm")?.rawValue ?? rec.readCrm;
    // CRM em formato inválido já é tratado por EXE-002.
    if (normalizeCrm(raw) == null) return null;
    return makeFinding(EXE_004, ctx, { detectedValue: rec.readCrm });
  },
};

export const EXE_005: AuditRule = {
  id: "EXE-005",
  name: "Nome do executante diverge do cadastro",
  description:
    "O CRM confere com um profissional cadastrado, mas o nome escrito na guia é de outra pessoa — possível CRM trocado ou guia preenchida com dados de outro médico.",
  category: "executante",
  severity: "medio",
  blocking: false,
  field: "executing_name",
  message: (ctx) =>
    `O CRM ${ctx.executingProfessional.crm ?? ""} pertence a ${ctx.executingProfessional.fullName ?? "outro profissional"}, mas a guia traz "${ctx.executingProfessional.readName ?? ""}".`,
  suggestedCorrection: "Confirme quem executou o atendimento e corrija o nome ou o CRM na guia.",
  evaluate: (ctx) => {
    const rec = ctx.executingProfessional;
    if (rec.status !== "recognized" || !rec.nameMismatch) return null;
    return makeFinding(EXE_005, ctx, {
      detectedValue: rec.readName,
      expectedValue: rec.fullName,
    });
  },
};

export const EXE_006: AuditRule = {
  id: "EXE-006",
  name: "Executante reconhecido pelo nome",
  description:
    "O CRM não foi lido, mas o nome do executante corresponde a um único profissional cadastrado — o CRM pode ser completado a partir do cadastro.",
  category: "executante",
  severity: "baixo",
  blocking: false,
  field: "executing_crm",
  message: (ctx) =>
    `CRM não lido; executante reconhecido pelo nome como ${ctx.executingProfessional.fullName ?? ""} (CRM ${ctx.executingProfessional.crm ?? "—"} no cadastro).`,
  suggestedCorrection: "Confirme o profissional e preencha o CRM do cadastro na guia.",
  evaluate: (ctx) => {
    const rec = ctx.executingProfessional;
    if (rec.status !== "recognized" || rec.matchedBy !== "name") return null;
    return makeFinding(EXE_006, ctx, { detectedValue: null, expectedValue: rec.crm });
  },
};

export const EXECUTANTE_RULES: AuditRule[] = [EXE_001, EXE_002, EXE_003, EXE_004, EXE_005, EXE_006];
