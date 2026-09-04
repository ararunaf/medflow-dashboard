/**
 * F6-O1 — testes puros da lógica de prontidão de homologação TISS.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeOperatorReadiness,
  computeTenantReadiness,
  isHomologationStatus,
} from "../../../src/lib/services/tiss/homologation-readiness.ts";

describe("isHomologationStatus", () => {
  it("aceita apenas os três valores válidos", () => {
    assert.equal(isHomologationStatus("not_started"), true);
    assert.equal(isHomologationStatus("in_progress"), true);
    assert.equal(isHomologationStatus("homologated"), true);
    assert.equal(isHomologationStatus("approved"), false);
    assert.equal(isHomologationStatus(""), false);
    assert.equal(isHomologationStatus(null), false);
    assert.equal(isHomologationStatus(42), false);
  });
});

describe("computeTenantReadiness", () => {
  it("marca completo quando tenant_settings tem todos os campos institucionais preenchidos", () => {
    const r = computeTenantReadiness(
      { institution_name: "Cooperativa X", contact_email: "a@x.com", support_phone: "11999999999", cnpj: "12.345.678/0001-90" },
      true,
    );
    assert.equal(r.institutionalDataComplete, true);
    assert.deepEqual(r.missingInstitutionalFields, []);
    assert.equal(r.hasApprovedContractRule, true);
  });

  it("reporta cada campo institucional ausente ou vazio", () => {
    const r = computeTenantReadiness(
      { institution_name: "", contact_email: "a@x.com", support_phone: "  ", cnpj: null },
      false,
    );
    assert.equal(r.institutionalDataComplete, false);
    assert.equal(r.missingInstitutionalFields.length, 3);
    assert.ok(r.missingInstitutionalFields.includes("Nome da instituição"));
    assert.ok(r.missingInstitutionalFields.includes("Telefone de suporte"));
    assert.ok(r.missingInstitutionalFields.includes("CNPJ"));
    assert.equal(r.hasApprovedContractRule, false);
  });

  it("trata tenant_settings ausente (linha nunca criada) como todos os campos faltando", () => {
    const r = computeTenantReadiness(null, false);
    assert.equal(r.institutionalDataComplete, false);
    assert.equal(r.missingInstitutionalFields.length, 4);
  });
});

describe("computeOperatorReadiness", () => {
  const base = {
    providerId: "p1",
    providerName: "Operadora X",
    active: true,
    ansCode: "123456",
    hasBilledGuide: true,
    homologationStatus: "in_progress",
    homologationNotes: "em contato com a operadora",
    homologatedAt: null,
  };

  it("tecnicamente pronta quando ANS configurado e há ao menos uma guia", () => {
    const r = computeOperatorReadiness(base);
    assert.equal(r.ansCodeConfigured, true);
    assert.equal(r.hasBilledGuide, true);
    assert.equal(r.technicallyReady, true);
    assert.equal(r.homologationStatus, "in_progress");
    assert.equal(r.homologationNotes, "em contato com a operadora");
  });

  it("não pronta sem código ANS configurado, mesmo com guia emitida", () => {
    const r = computeOperatorReadiness({ ...base, ansCode: "  " });
    assert.equal(r.ansCodeConfigured, false);
    assert.equal(r.technicallyReady, false);
  });

  it("não pronta sem guia emitida, mesmo com ANS configurado", () => {
    const r = computeOperatorReadiness({ ...base, hasBilledGuide: false });
    assert.equal(r.hasBilledGuide, false);
    assert.equal(r.technicallyReady, false);
  });

  it("cai para not_started se o status persistido no banco for inesperado (defensivo)", () => {
    const r = computeOperatorReadiness({ ...base, homologationStatus: "garbage" });
    assert.equal(r.homologationStatus, "not_started");
  });
});
