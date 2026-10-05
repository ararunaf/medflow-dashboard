/**
 * Portão de aprovação da revisão — achado bloqueante (auditoria ou cláusula
 * de contrato) só é aprovado por cima com justificativa registrada.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  collectBlockingFindings,
  evaluateApprovalGate,
  MIN_BLOCKING_OVERRIDE_JUSTIFICATION,
} from "../../../src/lib/capture/review/approval-gate.ts";
import type { AuditFinding } from "../../../src/lib/capture/audit/types/audit-finding.ts";

function finding(overrides: Partial<AuditFinding> = {}): AuditFinding {
  return {
    ruleId: "AUT-001", category: "autorizacoes", field: "authorization_password", severity: "critico",
    status: "open", message: "Senha ausente", detectedValue: null, expectedValue: null, confidence: 90,
    suggestedCorrection: "", blocking: true, ...overrides,
  };
}
const enriched = (f: AuditFinding) => ({ finding: f, enrichment: null, matchedRuleIds: [] });

describe("collectBlockingFindings", () => {
  it("junta bloqueantes da auditoria e os gerados por cláusula de contrato", () => {
    const prazo = finding({ ruleId: "CTR-PRZ-8102A2FD", field: "attendance_date", source: "contract", message: "Prazo vencido" });
    const result = collectBlockingFindings(
      { findings: [finding(), finding({ ruleId: "DIA-001", field: "cid_code", blocking: false })] },
      { findings: [enriched(finding()), enriched(prazo)] } as never,
    );
    assert.deepEqual(result.map((b) => `${b.key}|${b.source}`), [
      "AUT-001:authorization_password|auditoria",
      "CTR-PRZ-8102A2FD:attendance_date|contrato",
    ]);
  });

  it("ignora achado resolvido/dispensado e enriquecimento de achado genérico (não duplica)", () => {
    const result = collectBlockingFindings(
      { findings: [finding({ status: "waived" })] },
      { findings: [enriched(finding({ status: "waived" }))] } as never,
    );
    assert.deepEqual(result, []);
  });

  it("sem relatórios → nenhum bloqueante", () => {
    assert.deepEqual(collectBlockingFindings(null, null), []);
  });
});

describe("evaluateApprovalGate", () => {
  const blocking = collectBlockingFindings({ findings: [finding()] }, null);

  it("bloqueia 'aprovada' sem justificativa quando há bloqueante", () => {
    const gate = evaluateApprovalGate("aprovada", blocking, undefined);
    assert.equal(gate.allowed, false);
  });

  it("bloqueia justificativa curta demais", () => {
    const gate = evaluateApprovalGate("aprovada", blocking, "ok");
    assert.equal(gate.allowed, false);
  });

  it("permite com justificativa e registra os achados sobrepostos", () => {
    const gate = evaluateApprovalGate("aprovada", blocking, "x".repeat(MIN_BLOCKING_OVERRIDE_JUSTIFICATION));
    assert.deepEqual(gate, { allowed: true, overriddenBlockingFindings: ["AUT-001:authorization_password"] });
  });

  it("não interfere em reprovar / pedir correção / em revisão", () => {
    for (const status of ["reprovada", "aguardando_correcoes", "em_revisao"]) {
      assert.deepEqual(evaluateApprovalGate(status, blocking, undefined), { allowed: true, overriddenBlockingFindings: [] });
    }
  });

  it("guia sem bloqueante aprova normalmente, sem justificativa", () => {
    assert.deepEqual(evaluateApprovalGate("aprovada", [], undefined), { allowed: true, overriddenBlockingFindings: [] });
  });
});
