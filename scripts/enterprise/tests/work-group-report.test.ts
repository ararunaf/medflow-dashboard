/**
 * Relatório por grupo de trabalho — F5-S1.
 *
 * `groupProductionByWorkGroup` é pura: recebe produção já calculada por
 * profissional (a mesma fonte do dashboard executivo) e só soma por grupo
 * — não recalcula guia/produção/repasse. Testado com dado sintético, sem
 * tocar banco.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { groupProductionByWorkGroup } from "../../../src/lib/services/reporting/work-group-report-service.ts";
import { buildWorkGroupProductionReport } from "../../../src/lib/services/reporting/reporting-service.ts";
import type { ProfessionalConsolidationRow } from "../../../src/lib/services/financial-closing/types.ts";

function pro(overrides: Partial<ProfessionalConsolidationRow> & { professional_id: string }): ProfessionalConsolidationRow {
  return {
    professional_id: overrides.professional_id,
    display_name: overrides.display_name ?? "Profissional",
    guide_count: overrides.guide_count ?? 1,
    total_billed: overrides.total_billed ?? 0,
    total_denied: overrides.total_denied ?? 0,
    total_approved: overrides.total_approved ?? 0,
    payout_final_value: overrides.payout_final_value ?? 0,
  };
}

describe("groupProductionByWorkGroup — F5-S1", () => {
  it("soma guias/aprovado/repasse de todos os profissionais do mesmo grupo", () => {
    const rows = [
      pro({ professional_id: "p1", guide_count: 3, total_approved: 100, payout_final_value: 80 }),
      pro({ professional_id: "p2", guide_count: 2, total_approved: 50, payout_final_value: 40 }),
    ];
    const groups = new Map([
      ["p1", { id: "g1", name: "UTI" }],
      ["p2", { id: "g1", name: "UTI" }],
    ]);
    const result = groupProductionByWorkGroup(rows, groups);
    assert.equal(result.length, 1);
    assert.equal(result[0]!.workGroupName, "UTI");
    assert.equal(result[0]!.professionalCount, 2);
    assert.equal(result[0]!.guideCount, 5);
    assert.equal(result[0]!.totalApproved, 150);
    assert.equal(result[0]!.payoutFinalValue, 120);
  });

  it("profissional sem grupo (null) vai para o grupo 'Sem grupo', separado dos demais", () => {
    const rows = [
      pro({ professional_id: "p1", total_approved: 100 }),
      pro({ professional_id: "p2", total_approved: 50 }),
    ];
    const groups = new Map<string, { id: string; name: string } | null>([
      ["p1", { id: "g1", name: "UTI" }],
      ["p2", null],
    ]);
    const result = groupProductionByWorkGroup(rows, groups);
    assert.equal(result.length, 2);
    const semGrupo = result.find((r) => r.workGroupId === null);
    assert.ok(semGrupo);
    assert.equal(semGrupo!.workGroupName, "Sem grupo");
    assert.equal(semGrupo!.professionalCount, 1);
  });

  it("profissional ausente do map (nunca consultado) também cai em 'Sem grupo', não quebra", () => {
    const rows = [pro({ professional_id: "p-nao-mapeado", total_approved: 10 })];
    const result = groupProductionByWorkGroup(rows, new Map());
    assert.equal(result.length, 1);
    assert.equal(result[0]!.workGroupId, null);
  });

  it("ordena por total aprovado decrescente", () => {
    const rows = [
      pro({ professional_id: "p1", total_approved: 50 }),
      pro({ professional_id: "p2", total_approved: 200 }),
    ];
    const groups = new Map([
      ["p1", { id: "g1", name: "Grupo A" }],
      ["p2", { id: "g2", name: "Grupo B" }],
    ]);
    const result = groupProductionByWorkGroup(rows, groups);
    assert.equal(result[0]!.workGroupName, "Grupo B");
    assert.equal(result[1]!.workGroupName, "Grupo A");
  });

  it("arredonda somas de ponto flutuante para 2 casas decimais", () => {
    const rows = [
      pro({ professional_id: "p1", total_approved: 0.1, payout_final_value: 0.1 }),
      pro({ professional_id: "p2", total_approved: 0.2, payout_final_value: 0.2 }),
    ];
    const groups = new Map([
      ["p1", { id: "g1", name: "Grupo" }],
      ["p2", { id: "g1", name: "Grupo" }],
    ]);
    const result = groupProductionByWorkGroup(rows, groups);
    assert.equal(result[0]!.totalApproved, 0.3);
    assert.equal(result[0]!.payoutFinalValue, 0.3);
  });

  it("lista vazia produz relatório vazio", () => {
    assert.deepEqual(groupProductionByWorkGroup([], new Map()), []);
  });
});

describe("buildWorkGroupProductionReport — F5-S1", () => {
  it("converte linhas agrupadas num ReportTableSection com as colunas esperadas", () => {
    const rows = groupProductionByWorkGroup(
      [pro({ professional_id: "p1", guide_count: 4, total_approved: 1000, payout_final_value: 800 })],
      new Map([["p1", { id: "g1", name: "UTI" }]]),
    );
    const report = buildWorkGroupProductionReport(rows, "2026-08-01", "2026-09-03T12:00:00.000Z");
    assert.equal(report.sections.length, 1);
    const section = report.sections[0]!;
    assert.deepEqual(section.columns, [
      "Grupo de trabalho",
      "Profissionais",
      "Guias",
      "Aprovado",
      "Repasse líquido",
    ]);
    assert.equal(section.rows[0]!["Grupo de trabalho"], "UTI");
    assert.equal(section.rows[0]!["Guias"], 4);
    assert.match(String(section.rows[0]!["Aprovado"]), /1\.000,00/);
  });
});
