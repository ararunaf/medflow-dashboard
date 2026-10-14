/**
 * Ponte captura → faturamento — rascunho de guia TISS a partir da guia
 * capturada (buildCaptureGuideDraft).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildCaptureGuideDraft } from "@/lib/capture/billing/capture-guide-draft";
import type { CorrectionProposal } from "@/lib/capture/correction/types/correction-proposal";
import type { StructuredField, StructuredGuide } from "@/lib/capture/parser/types/structured-guide";

function field(code: string, value: string | null, rawValue = value): StructuredField {
  return {
    code,
    label: code,
    group: "paciente",
    value,
    rawValue,
    confidence: 0.9,
    position: null,
    ocrOrigin: null,
    status: value ? "found" : "missing",
    normalized: true,
  };
}

function guide(overrides: Partial<StructuredGuide> = {}): StructuredGuide {
  return {
    version: "structured_guide_v1",
    guideType: "guia_consulta",
    classification: {
      guideType: "guia_consulta",
      confidence: 0.9,
      method: "header_regex",
      alternativeTypes: [],
    },
    groups: {} as StructuredGuide["groups"],
    fields: {
      beneficiary_name: field("beneficiary_name", "MARIA DA SILVA"),
      beneficiary_card_number: field("beneficiary_card_number", "0012345678901234"),
      attendance_date: field("attendance_date", "2026-03-15", "15/03/2026"),
      operator_ans_code: field("operator_ans_code", "398765"),
      executing_crm: field("executing_crm", "SP-012345", "12345/SP"),
    },
    procedures: [
      {
        lineNumber: 1,
        confidence: 0.9,
        fields: {
          procedure_code: field("procedure_code", "10101012"),
          total_value: field("total_value", "250.00", "R$ 250,00"),
        },
      },
    ],
    metadata: {} as StructuredGuide["metadata"],
    ...overrides,
  };
}

const catalogs = {
  providers: [
    { id: "prov-vitalis", ansCode: "398765" },
    { id: "prov-outra", ansCode: "111111" },
  ],
  professionals: [
    { id: "prof-joao", crm: "12345-SP" },
    { id: "prof-rj", crm: "12345-RJ" },
  ],
  procedures: [
    {
      id: "proc-consulta",
      code: "10101012",
      description: "Consulta em consultório",
      defaultValue: 120,
    },
  ],
};

function correction(p: Partial<CorrectionProposal>): CorrectionProposal {
  return {
    proposalId: "p",
    findingId: "f",
    ruleId: "r",
    field: "beneficiary_card_number",
    currentValue: null,
    suggestedValue: null,
    confidence: 0.9,
    justification: "",
    source: "TISS",
    status: "pending",
    blocking: false,
    severity: "warning" as CorrectionProposal["severity"],
    ...p,
  };
}

describe("buildCaptureGuideDraft", () => {
  it("casa convênio pelo ANS, profissional pelo CRM (com UF) e procedimento pelo TUSS", () => {
    const draft = buildCaptureGuideDraft(guide(), [], catalogs);
    assert.equal(draft.guideType, "consulta");
    assert.equal(draft.insuranceProviderId, "prov-vitalis");
    assert.equal(draft.professionalId, "prof-joao");
    assert.equal(draft.attendanceDate, "2026-03-15");
    assert.deepEqual(draft.items, [
      {
        tussCode: "10101012",
        procedureId: "proc-consulta",
        description: "Consulta em consultório",
        executionDate: "2026-03-15",
        quantity: 1,
        unitValue: 250,
      },
    ]);
    assert.deepEqual(draft.warnings, []);
  });

  it("correção aceita ou editada pelo revisor vence o valor lido", () => {
    const edited = buildCaptureGuideDraft(
      guide(),
      [correction({ status: "edited", editedValue: "9999888877776666", suggestedValue: "x" })],
      catalogs,
    );
    assert.equal(edited.beneficiaryCardNumber, "9999888877776666");
    const pending = buildCaptureGuideDraft(
      guide(),
      [correction({ status: "pending", suggestedValue: "1111" })],
      catalogs,
    );
    assert.equal(pending.beneficiaryCardNumber, "0012345678901234");
  });

  it("avisa o que não casou em vez de inventar", () => {
    const g = guide({ guideType: "unknown" });
    g.fields.operator_ans_code = field("operator_ans_code", "222222");
    g.fields.executing_crm = field("executing_crm", "99999/SP");
    g.procedures[0]!.fields.procedure_code = field("procedure_code", "40101010");
    g.procedures[0]!.fields.total_value = field("total_value", null);
    const draft = buildCaptureGuideDraft(g, [], catalogs);
    assert.equal(draft.guideType, null);
    assert.equal(draft.insuranceProviderId, null);
    assert.equal(draft.professionalId, null);
    assert.equal(draft.items[0]!.procedureId, null);
    assert.equal(draft.items[0]!.unitValue, null);
    assert.equal(draft.warnings.length, 4);
    assert.ok(draft.warnings.some((w) => w.includes("222222")));
    assert.ok(draft.warnings.some((w) => w.includes("40101010")));
  });

  it("sem valor lido usa o valor padrão do catálogo; linhas repetidas viram um item", () => {
    const g = guide();
    g.procedures = [
      {
        lineNumber: 1,
        confidence: 0.9,
        fields: { procedure_code: field("procedure_code", "10101012") },
      },
      {
        lineNumber: 2,
        confidence: 0.9,
        fields: { procedure_code: field("procedure_code", "10101012") },
      },
    ];
    const draft = buildCaptureGuideDraft(g, [], catalogs);
    assert.equal(draft.items.length, 1);
    assert.equal(draft.items[0]!.unitValue, 120);
  });

  it("CRM de outra UF não casa", () => {
    const g = guide();
    g.fields.executing_crm = field("executing_crm", "12345/MG");
    assert.equal(buildCaptureGuideDraft(g, [], catalogs).professionalId, null);
  });
});
