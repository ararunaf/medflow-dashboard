/**
 * F2-S4 — verificações campo a campo derivadas de cláusulas aprovadas.
 * Fixtures com as citações literais do contrato fictício Vitalis 2026.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  evaluateContractFieldChecks,
  parseAttendanceDeadlineDays,
} from "../../../src/lib/capture/contract/engine/contract-field-checks.ts";
import { rowToApprovedRule, type ApprovedContractRuleVersionRow } from "../../../src/lib/capture/contract/registry/approved-contract-rule-mapper.ts";
import { enrichFindings } from "../../../src/lib/capture/contract/engine/finding-enricher.ts";
import { groupFindingsByField } from "../../../src/lib/capture/audit/engine/field-audit-agent.ts";
import type { AuditFinding } from "../../../src/lib/capture/audit/types/audit-finding.ts";
import type { StructuredGuide } from "../../../src/lib/capture/parser/types/structured-guide.ts";
import type { ContractResolutionContext } from "../../../src/lib/capture/contract/types/contract-context.ts";

const PRAZO = "5.1. As guias deverão ser apresentadas à OPERADORA em até 30 (trinta) dias corridos contados da data do atendimento. Guias apresentadas após este prazo serão glosadas por decurso de prazo, sem direito a recurso.";
const OBR_61 = "6.1. São de preenchimento obrigatório em todas as guias, inclusive na guia de consulta: número da carteirinha e respectiva validade, nome do beneficiário, CID-10, nome e CRM com UF do profissional executante, código TUSS e data do atendimento.";
const OBR_62 = "6.2. Nas guias SP/SADT é obrigatório informar nome e CRM do profissional solicitante e a indicação clínica.";

function rule(id: string, category: string, citation: string, description = "regra") {
  const row: ApprovedContractRuleVersionRow = {
    rule_id: id, tenant_id: "t", operator_code: "398765", contract_label: "VITALIS-2026", category,
    description, justification: "j", citation_heading: "CLÁUSULA", citation_excerpt: citation,
    guide_type: "*", procedure_type: "*", severity: "medio", approved_at: "2026-10-05T00:00:00Z",
  };
  return rowToApprovedRule(row);
}

function guide(guideType: StructuredGuide["guideType"], values: Record<string, string | null>): StructuredGuide {
  const fields: StructuredGuide["fields"] = {};
  for (const [code, value] of Object.entries(values)) {
    fields[code] = {
      code, label: code, group: "paciente", value, rawValue: value, confidence: 90, position: null,
      ocrOrigin: null, status: value ? "found" : "missing", normalized: true,
    } as never;
  }
  return { guideType, fields, procedures: [] } as unknown as StructuredGuide;
}

const NOW = new Date(2026, 9, 5); // 05/10/2026

describe("parseAttendanceDeadlineDays", () => {
  it("lê o prazo em dias corridos da cláusula", () => {
    assert.equal(parseAttendanceDeadlineDays(PRAZO), 30);
  });
  it("não confunde prazo de recurso (não conta da data do atendimento)", () => {
    assert.equal(parseAttendanceDeadlineDays("5.3. O recurso de glosa deverá ser interposto em até 15 (quinze) dias do recebimento do demonstrativo."), null);
  });
  it("não aproxima dias úteis", () => {
    assert.equal(parseAttendanceDeadlineDays("em até 10 dias úteis contados da data do atendimento"), null);
  });
});

describe("evaluateContractFieldChecks — prazo", () => {
  const rules = [rule("aaaaaaaa-1", "prazo", PRAZO)];

  it("prazo vencido → crítico e bloqueante em attendance_date", () => {
    const [f] = evaluateContractFieldChecks(guide("guia_sadt", { attendance_date: "2026-08-18" }), rules, [], NOW);
    assert.equal(f!.field, "attendance_date");
    assert.equal(f!.severity, "critico");
    assert.equal(f!.blocking, true);
    assert.equal(f!.source, "contract");
    assert.match(f!.message, /48 dias.*30 dias/);
  });

  it("perto de vencer → atenção, não bloqueante", () => {
    const [f] = evaluateContractFieldChecks(guide("guia_sadt", { attendance_date: "2026-09-08" }), rules, [], NOW);
    assert.equal(f!.severity, "medio");
    assert.equal(f!.blocking, false);
    assert.match(f!.message, /vence em 3 dia/);
  });

  it("dentro do prazo com folga → nenhum achado", () => {
    assert.deepEqual(evaluateContractFieldChecks(guide("guia_sadt", { attendance_date: "2026-10-02" }), rules, [], NOW), []);
  });
});

describe("evaluateContractFieldChecks — campo obrigatório", () => {
  it("aponta só o campo vazio exigido pela cláusula, um achado por campo", () => {
    const findings = evaluateContractFieldChecks(
      guide("guia_sadt", { requesting_name: null, requesting_crm: "123/SP", clinical_indication: null }),
      [rule("bbbbbbbb-2", "campo_obrigatorio", OBR_62)],
      [],
      NOW,
    );
    assert.deepEqual(findings.map((f) => f.field).sort(), ["clinical_indication", "requesting_name"]);
    assert.ok(findings.every((f) => f.category === "solicitante" || f.category === "diagnostico"));
  });

  it("não duplica campo que a auditoria genérica já apontou", () => {
    const existing = [{ field: "requesting_crm" } as AuditFinding];
    const findings = evaluateContractFieldChecks(
      guide("guia_sadt", { requesting_name: "Dr. X", requesting_crm: null, clinical_indication: "dor" }),
      [rule("bbbbbbbb-2", "campo_obrigatorio", OBR_62)],
      existing,
      NOW,
    );
    assert.deepEqual(findings, []);
  });

  it("cláusula só de SP/SADT não se aplica a guia de consulta", () => {
    const findings = evaluateContractFieldChecks(
      guide("guia_consulta", { requesting_name: null }),
      [rule("bbbbbbbb-2", "campo_obrigatorio", OBR_62)],
      [],
      NOW,
    );
    assert.deepEqual(findings, []);
  });

  it("cláusula de todas as guias vale para consulta (CID obrigatório na consulta)", () => {
    const findings = evaluateContractFieldChecks(
      guide("guia_consulta", { cid_code: null, beneficiary_card_number: "1", beneficiary_name: "a", executing_name: "b", executing_crm: "c", procedure_code: "10101012", attendance_date: "2026-10-01" }),
      [rule("cccccccc-3", "campo_obrigatorio", OBR_61)],
      [],
      NOW,
    );
    assert.deepEqual(findings.map((f) => f.field), ["cid_code"]);
  });

  it("ignora regras curadas (não ai_approved)", () => {
    const curated = { ...rule("dddddddd-4", "prazo", PRAZO), origin: undefined };
    assert.deepEqual(evaluateContractFieldChecks(guide("guia_sadt", { attendance_date: "2026-01-01" }), [curated], [], NOW), []);
  });
});

describe("enriquecimento e Field Audit Agent — campo a campo", () => {
  const rules = [
    rule("aaaaaaaa-1", "prazo", PRAZO),
    rule("eeeeeeee-5", "pre_autorizacao", "3.1. Exigem autorização prévia (senha) da OPERADORA: tomografia computadorizada (grupo TUSS 41001)."),
    rule("ffffffff-6", "campo_obrigatorio", "6.3. A guia deverá conter a assinatura do beneficiário ou de seu responsável."),
  ];
  const ctx = { applicableRules: rules, contract: { resolved: true }, conflictingRulesResolved: 0 } as unknown as ContractResolutionContext;
  const finding = (field: string, category: AuditFinding["category"]): AuditFinding => ({
    ruleId: "GEN", category, field, severity: "alto", status: "open", message: "m",
    detectedValue: null, expectedValue: null, confidence: 90, suggestedCorrection: "", blocking: false,
  });

  it("achado de senha cita só a cláusula de autorização; de CID, nenhuma", () => {
    const [senha, cid] = enrichFindings([finding("authorization_password", "autorizacoes"), finding("cid_code", "diagnostico")], ctx);
    assert.deepEqual(senha!.matchedRuleIds, ["eeeeeeee-5"]);
    assert.deepEqual(cid!.matchedRuleIds, []);
  });

  it("achado de contrato vira bundle próprio do campo para o agente", () => {
    const contractFinding = evaluateContractFieldChecks(guide("guia_sadt", { attendance_date: "2026-08-18" }), rules, [], NOW);
    const enriched = enrichFindings(contractFinding, ctx);
    const bundles = groupFindingsByField([], enriched, []);
    assert.equal(bundles.length, 1);
    assert.equal(bundles[0]!.field, "attendance_date");
    assert.equal(bundles[0]!.structuralFindings[0]!.source, "contract");
    assert.deepEqual(bundles[0]!.enrichments[0]!.matchedRuleIds, ["aaaaaaaa-1"]);
  });
});
