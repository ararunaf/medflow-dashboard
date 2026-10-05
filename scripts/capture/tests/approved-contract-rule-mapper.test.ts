/**
 * F2-S4 — mapeia contract_rule_versions (F2-S3) para o formato que o motor
 * de auditoria/contrato já consome (ContractRule/ContractRegistryVersion),
 * fechando o loop: contrato real → chunks → proposta IA → aprovação humana
 * → regra viva na auditoria de guias.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ContractKnowledgeEngine } from "../../../src/lib/capture/contract/engine/contract-knowledge-engine.ts";
import {
  AI_APPROVED_RULE_PRIORITY,
  groupApprovedIntoVersions,
  resolveApprovedRuleAuditFields,
  normalizeOperatorCode,
  rowToApprovedRule,
  type ApprovedContractRuleVersionRow,
} from "../../../src/lib/capture/contract/registry/approved-contract-rule-mapper.ts";

function row(overrides: Partial<ApprovedContractRuleVersionRow> = {}): ApprovedContractRuleVersionRow {
  return {
    rule_id: "prop-1",
    tenant_id: "tenant-1",
    operator_code: "123456",
    contract_label: "UNIMED-NACIONAL-2026",
    category: "cobertura",
    description: "Cobertura de consultas eletivas",
    justification: "Cláusula segunda do contrato",
    citation_heading: "CLÁUSULA SEGUNDA",
    citation_excerpt: "2.1. Estão cobertos os procedimentos relacionados no Anexo I.",
    guide_type: "*",
    procedure_type: "*",
    severity: "medio",
    approved_at: "2026-09-02T18:00:00.000Z",
    ...overrides,
  };
}

describe("normalizeOperatorCode — F2-S4", () => {
  it("mantém código já de 6 dígitos", () => {
    assert.equal(normalizeOperatorCode("123456"), "123456");
  });

  it("remove caracteres não numéricos e preenche com zero à esquerda", () => {
    assert.equal(normalizeOperatorCode("42"), "000042");
  });

  it("trunca para os últimos 6 dígitos quando maior", () => {
    assert.equal(normalizeOperatorCode("00123456789"), "456789");
  });
});

describe("rowToApprovedRule — F2-S4", () => {
  it("mapeia campos básicos preservando texto aprovado", () => {
    const rule = rowToApprovedRule(row());
    assert.equal(rule.ruleId, "prop-1");
    assert.equal(rule.operator, "123456");
    assert.equal(rule.contract, "UNIMED-NACIONAL-2026");
    assert.equal(rule.description, "Cobertura de consultas eletivas");
    assert.equal(rule.justification, "Cláusula segunda do contrato");
    assert.equal(rule.severity, "medio");
  });

  it("usa prioridade fixa mais baixa que o seed curado manualmente (60-100)", () => {
    const rule = rowToApprovedRule(row());
    assert.equal(rule.priority, AI_APPROVED_RULE_PRIORITY);
    assert.ok(rule.priority < 60, "regra aprovada por IA deve ceder a regras curadas manualmente");
  });

  it("businessReference cita contrato + cláusula quando há citation_heading", () => {
    const rule = rowToApprovedRule(row({ citation_heading: "CLÁUSULA QUINTA" }));
    assert.equal(rule.businessReference, "UNIMED-NACIONAL-2026 — CLÁUSULA QUINTA");
  });

  it("businessReference cai para só o contrato quando não há citation_heading", () => {
    const rule = rowToApprovedRule(row({ citation_heading: null }));
    assert.equal(rule.businessReference, "UNIMED-NACIONAL-2026");
  });

  it("nunca inventa legalReference — declara explicitamente que não foi identificada", () => {
    const rule = rowToApprovedRule(row());
    assert.match(rule.legalReference, /sem referência legal/i);
  });

  it("marca origin=ai_approved", () => {
    assert.equal(rowToApprovedRule(row()).origin, "ai_approved");
  });

  it("associa a regra a campos (auditFields), nunca a categorias inteiras", () => {
    const rule = rowToApprovedRule(row({ category: "pre_autorizacao" }));
    assert.deepEqual(rule.auditFields, ["authorization_password"]);
    assert.equal(rule.auditCategories, undefined);
  });

  it("carrega a citação literal para as verificações por campo", () => {
    assert.match(rowToApprovedRule(row()).citationExcerpt!, /Anexo I/);
  });

  it("regra sem campo identificável fica sem auditFields", () => {
    const rule = rowToApprovedRule(row({ category: "campo_obrigatorio", description: "Regras gerais", citation_excerpt: "Cumprir o contrato." }));
    assert.equal(rule.auditFields, undefined);
  });

  it("categoria desconhecida não inventa auditFields", () => {
    assert.equal(rowToApprovedRule(row({ category: "outra" })).auditFields, undefined);
  });

  it("normaliza o operator_code ao mapear", () => {
    const rule = rowToApprovedRule(row({ operator_code: "42" }));
    assert.equal(rule.operator, "000042");
  });
});

describe("groupApprovedIntoVersions — F2-S4", () => {
  it("agrupa múltiplas regras do mesmo contrato em uma única versão", () => {
    const versions = groupApprovedIntoVersions([
      row({ rule_id: "prop-1" }),
      row({ rule_id: "prop-2" }),
    ]);
    assert.equal(versions.length, 1);
    assert.equal(versions[0]!.rules.length, 2);
  });

  it("separa em versões distintas por (tenant, operadora, contrato)", () => {
    const versions = groupApprovedIntoVersions([
      row({ rule_id: "prop-1", contract_label: "UNIMED-NACIONAL-2026" }),
      row({ rule_id: "prop-2", contract_label: "UNIMED-REGIONAL-2025" }),
      row({ rule_id: "prop-3", tenant_id: "tenant-2" }),
    ]);
    assert.equal(versions.length, 3);
  });

  it("versão herda tenantId/operator/contract/effectiveFrom da linha", () => {
    const versions = groupApprovedIntoVersions([row({ approved_at: "2026-09-02T10:00:00.000Z" })]);
    assert.equal(versions[0]!.tenantId, "tenant-1");
    assert.equal(versions[0]!.operator, "123456");
    assert.equal(versions[0]!.contract, "UNIMED-NACIONAL-2026");
    assert.equal(versions[0]!.effectiveFrom, "2026-09-02");
  });

  it("retorna vazio para lista vazia", () => {
    assert.deepEqual(groupApprovedIntoVersions([]), []);
  });
});

describe("resolveConflicts com regras aprovadas — F2-S4", () => {
  it("não colapsa regras aprovadas distintas da mesma categoria", () => {
    const rules = [
      rowToApprovedRule(row({ rule_id: "prop-1", category: "pre_autorizacao" })),
      rowToApprovedRule(row({ rule_id: "prop-2", category: "pre_autorizacao" })),
      rowToApprovedRule(row({ rule_id: "prop-3", category: "prazo" })),
    ];
    const { rules: kept, conflictsResolved } = new ContractKnowledgeEngine().resolveConflicts(rules);
    assert.equal(kept.length, 3);
    assert.equal(conflictsResolved, 0);
  });
});

describe("resolveApprovedRuleAuditFields — campo a campo", () => {
  const sorted = (a: string[]) => [...a].sort();

  it("prazo, pré-autorização, preço e cobertura têm campos fixos", () => {
    assert.deepEqual(resolveApprovedRuleAuditFields("prazo", "", ""), ["attendance_date"]);
    assert.deepEqual(resolveApprovedRuleAuditFields("pre_autorizacao", "", ""), ["authorization_password"]);
    assert.deepEqual(sorted(resolveApprovedRuleAuditFields("preco", "", "")), ["procedure_code", "total_value"]);
    assert.deepEqual(resolveApprovedRuleAuditFields("cobertura", "", ""), ["procedure_code"]);
  });

  it("cláusula 6.1 (Vitalis) → só os campos citados", () => {
    const fields = resolveApprovedRuleAuditFields(
      "campo_obrigatorio",
      "Campos obrigatórios precisam ser preenchidos em todas as guias.",
      "6.1. São de preenchimento obrigatório em todas as guias, inclusive na guia de consulta: número da carteirinha e respectiva validade, nome do beneficiário, CID-10, nome e CRM com UF do profissional executante, código TUSS e data do atendimento.",
    );
    assert.deepEqual(sorted(fields), sorted([
      "beneficiary_card_number", "beneficiary_name", "cid_code", "executing_name", "executing_crm", "procedure_code", "attendance_date",
    ]));
  });

  it("cláusula 6.2 (Vitalis) → solicitante e indicação clínica, não executante", () => {
    const fields = resolveApprovedRuleAuditFields(
      "campo_obrigatorio",
      "Guias SP/SADT devem conter informações adicionais obrigatórias.",
      "6.2. Nas guias SP/SADT é obrigatório informar nome e CRM do profissional solicitante e a indicação clínica.",
    );
    assert.deepEqual(sorted(fields), ["clinical_indication", "requesting_crm", "requesting_name"]);
  });

  it("cláusula 6.3 (Vitalis) → só assinatura do beneficiário (não confunde com nome do beneficiário)", () => {
    const fields = resolveApprovedRuleAuditFields(
      "campo_obrigatorio",
      "As guias devem conter a assinatura do beneficiário ou responsável.",
      "6.3. A guia deverá conter a assinatura do beneficiário ou de seu responsável; guias sem assinatura serão devolvidas.",
    );
    assert.deepEqual(fields, ["beneficiary_signature"]);
  });
});
