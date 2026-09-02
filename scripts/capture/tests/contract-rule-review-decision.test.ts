/**
 * F2-S3 — lógica pura do portão de revisão de regra contratual.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildContractRuleVersionInsert,
  validateReviewInput,
  type ContractRuleProposalRow,
} from "../../../src/lib/capture/contract/review/contract-rule-review-decision.ts";

const PROPOSAL: ContractRuleProposalRow = {
  id: "prop-1",
  tenant_id: "tenant-1",
  operator_contract_id: "contract-1",
  category: "cobertura",
  description: "Cobertura de consultas eletivas",
  justification: "Cláusula segunda define o escopo",
  citation_heading: "CLÁUSULA SEGUNDA",
  citation_excerpt: "A cobertura abrange consultas eletivas",
};

const CONTRACT = { operator_code: "123456", contract_label: "UNIMED-NACIONAL-2026" };

describe("validateReviewInput — F2-S3", () => {
  it("aceita decisão 'approved' sem campos extras", () => {
    assert.doesNotThrow(() => validateReviewInput({ proposalId: "p1", decision: "approved" }));
  });

  it("aceita decisão 'rejected' sem campos extras", () => {
    assert.doesNotThrow(() => validateReviewInput({ proposalId: "p1", decision: "rejected" }));
  });

  it("exige editedDescription e editedJustification para decisão 'edited'", () => {
    assert.throws(() => validateReviewInput({ proposalId: "p1", decision: "edited" }), /editedDescription/);
    assert.throws(
      () =>
        validateReviewInput({
          proposalId: "p1",
          decision: "edited",
          editedDescription: "x",
        }),
      /editedJustification/,
    );
  });

  it("aceita decisão 'edited' com os dois campos preenchidos", () => {
    assert.doesNotThrow(() =>
      validateReviewInput({
        proposalId: "p1",
        decision: "edited",
        editedDescription: "nova descrição",
        editedJustification: "nova justificativa",
      }),
    );
  });

  it("rejeita editedDescription só com espaços em branco", () => {
    assert.throws(() =>
      validateReviewInput({
        proposalId: "p1",
        decision: "edited",
        editedDescription: "   ",
        editedJustification: "y",
      }),
    );
  });
});

describe("buildContractRuleVersionInsert — F2-S3", () => {
  it("retorna null para decisão 'rejected' — regra rejeitada nunca vira versão", () => {
    const result = buildContractRuleVersionInsert(
      PROPOSAL,
      CONTRACT,
      { proposalId: PROPOSAL.id, decision: "rejected" },
      "reviewer-1",
    );
    assert.equal(result, null);
  });

  it("usa o texto original da proposta para decisão 'approved'", () => {
    const result = buildContractRuleVersionInsert(
      PROPOSAL,
      CONTRACT,
      { proposalId: PROPOSAL.id, decision: "approved" },
      "reviewer-1",
    );
    assert.equal(result?.description, PROPOSAL.description);
    assert.equal(result?.justification, PROPOSAL.justification);
  });

  it("usa o texto editado (não o original) para decisão 'edited'", () => {
    const result = buildContractRuleVersionInsert(
      PROPOSAL,
      CONTRACT,
      {
        proposalId: PROPOSAL.id,
        decision: "edited",
        editedDescription: "descrição corrigida pelo revisor",
        editedJustification: "justificativa corrigida pelo revisor",
      },
      "reviewer-1",
    );
    assert.equal(result?.description, "descrição corrigida pelo revisor");
    assert.equal(result?.justification, "justificativa corrigida pelo revisor");
    // A citação original é preservada mesmo quando o texto é editado —
    // é o que ancora a versão no contrato real para auditoria.
    assert.equal(result?.citation_excerpt, PROPOSAL.citation_excerpt);
  });

  it("preserva tenant_id, operator_contract_id, categoria e citação da proposta original", () => {
    const result = buildContractRuleVersionInsert(
      PROPOSAL,
      CONTRACT,
      { proposalId: PROPOSAL.id, decision: "approved" },
      "reviewer-1",
    );
    assert.equal(result?.tenant_id, PROPOSAL.tenant_id);
    assert.equal(result?.operator_contract_id, PROPOSAL.operator_contract_id);
    assert.equal(result?.category, PROPOSAL.category);
    assert.equal(result?.citation_heading, PROPOSAL.citation_heading);
  });

  it("registra approved_by como quem revisou, não como o autor da proposta", () => {
    const result = buildContractRuleVersionInsert(
      PROPOSAL,
      CONTRACT,
      { proposalId: PROPOSAL.id, decision: "approved" },
      "reviewer-42",
    );
    assert.equal(result?.approved_by, "reviewer-42");
  });

  it("registra operator_code/contract_label do contrato, não da proposta", () => {
    const result = buildContractRuleVersionInsert(
      PROPOSAL,
      CONTRACT,
      { proposalId: PROPOSAL.id, decision: "approved" },
      "reviewer-1",
    );
    assert.equal(result?.operator_code, CONTRACT.operator_code);
    assert.equal(result?.contract_label, CONTRACT.contract_label);
  });

  it("sempre começa na versão 1 (rule_id deriva do id da proposta)", () => {
    const result = buildContractRuleVersionInsert(
      PROPOSAL,
      CONTRACT,
      { proposalId: PROPOSAL.id, decision: "approved" },
      "reviewer-1",
    );
    assert.equal(result?.version, 1);
    assert.equal(result?.rule_id, PROPOSAL.id);
  });
});
