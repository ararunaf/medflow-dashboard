/**
 * Field Audit Agent — F2-S4.
 *
 * Substitui a aprovação binária vazia por parecer por campo com confiança
 * e citação, cruzando regra estrutural + regra de contrato + histórico de
 * glosa. Guardrails testados: nunca gera parecer para campo sem achado
 * real, nunca aceita um "field" inventado pelo modelo, nunca aceita uma
 * explicação que não cite nenhum ruleId real.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildFieldAuditMessages,
  generateFieldAuditOpinions,
  groupFindingsByField,
  parseFieldAuditResponse,
  type FieldSignalBundle,
} from "../../../src/lib/capture/audit/engine/field-audit-agent.ts";
import type { AuditFinding } from "../../../src/lib/capture/audit/types/audit-finding.ts";
import type { EnrichedAuditFinding } from "../../../src/lib/capture/contract/types/enriched-finding.ts";
import type { FindingRiskScore } from "../../../src/lib/capture/risk/types/risk-assessment.ts";
import type { AIProviderPort } from "../../../src/lib/enterprise/ai-provider/ports/ai-provider-port.ts";
import type {
  AIConfigurationValidation,
  AIProviderCapabilities,
  AIProviderHealth,
  AIProviderInfo,
  AIRequest,
  AIResponse,
} from "../../../src/lib/enterprise/ai-provider/ports/types.ts";

class FakeChatProvider implements AIProviderPort {
  readonly providerId = "test" as const;
  calls: AIRequest[] = [];
  constructor(private readonly respond: (request: AIRequest) => AIResponse) {}
  async invoke(request: AIRequest): Promise<AIResponse> {
    this.calls.push(request);
    return this.respond(request);
  }
  async health(): Promise<AIProviderHealth> {
    return { ok: true, provider: this.providerId };
  }
  capabilities(): AIProviderCapabilities {
    return {
      provider: this.providerId,
      adapterId: "fake-chat",
      capabilities: ["structured-output"],
      modalities: ["text"],
      supportsStreaming: false,
      supportsStructuredOutput: true,
      supportsVision: false,
      supportsEmbeddings: false,
      supportsToolCalling: false,
      supportsJsonMode: true,
    };
  }
  providerInfo(): AIProviderInfo {
    return {
      providerId: this.providerId,
      metadata: { name: "Fake", version: "1.0.0", vendor: "test" },
      status: "ready",
      modalities: ["text"],
      capabilities: ["structured-output"],
    };
  }
  supports(): boolean {
    return true;
  }
  async validateConfiguration(): Promise<AIConfigurationValidation> {
    return { ok: true, provider: this.providerId, errors: [], warnings: [] };
  }
}

const STRUCTURAL_FINDING: AuditFinding = {
  ruleId: "DIA-001",
  category: "diagnostico",
  field: "cid_code",
  severity: "critico",
  status: "open",
  message: "CID-10 ausente na guia",
  detectedValue: null,
  expectedValue: "código CID-10 válido",
  confidence: 95,
  suggestedCorrection: "Preencher o CID-10 do diagnóstico",
  blocking: true,
};

const LOW_SEVERITY_FINDING: AuditFinding = {
  ...STRUCTURAL_FINDING,
  ruleId: "DAT-004",
  field: "execution_date",
  severity: "baixo",
  blocking: false,
  category: "datas",
};

const ENRICHED: EnrichedAuditFinding = {
  finding: STRUCTURAL_FINDING,
  enrichment: {
    expandedJustification: "Contrato exige CID-10 para todos os procedimentos SP/SADT.",
    contractualBasis: "UNIMED-NACIONAL-2026 — Cláusula segunda",
    tissBasis: "Manual TISS 4.01.00",
    tussBasis: "",
    expectedImpact: "Guia será glosada sem o CID-10",
    estimatedDenialRisk: 82,
    observations: "",
  },
  matchedRuleIds: ["CTR-UNI-003"],
};

const RISK: FindingRiskScore = {
  ruleId: "DIA-001",
  field: "cid_code",
  category: "diagnostico",
  severity: "critico",
  riskScore: 88,
  denialProbability: 0.82,
  estimatedFinancialImpactCents: 15000,
  blocking: true,
  priority: "urgente",
};

describe("groupFindingsByField — F2-S4", () => {
  it("agrupa achado estrutural, enriquecimento e risco pelo mesmo campo", () => {
    const bundles = groupFindingsByField([STRUCTURAL_FINDING], [ENRICHED], [RISK]);
    assert.equal(bundles.length, 1);
    assert.equal(bundles[0]!.field, "cid_code");
    assert.equal(bundles[0]!.structuralFindings.length, 1);
    assert.equal(bundles[0]!.enrichments.length, 1);
    assert.equal(bundles[0]!.riskScores.length, 1);
  });

  it("não atribui enriquecimento/risco a um campo sem achado estrutural correspondente", () => {
    const orphanRisk: FindingRiskScore = { ...RISK, field: "outro_campo" };
    const bundles = groupFindingsByField([STRUCTURAL_FINDING], [], [orphanRisk]);
    assert.equal(bundles.length, 1);
    assert.equal(bundles[0]!.riskScores.length, 0);
  });

  it("gera um bundle por campo distinto, sem enriquecimento/risco quando não existem", () => {
    const bundles = groupFindingsByField([STRUCTURAL_FINDING, LOW_SEVERITY_FINDING], [], []);
    assert.equal(bundles.length, 2);
    assert.equal(
      bundles.every((b) => b.enrichments.length === 0 && b.riskScores.length === 0),
      true,
    );
  });

  it("retorna vazio quando não há nenhum achado", () => {
    assert.deepEqual(groupFindingsByField([], [], []), []);
  });
});

describe("buildFieldAuditMessages — F2-S4", () => {
  it("inclui o ruleId, a base contratual e o risco de glosa no prompt", () => {
    const bundles = groupFindingsByField([STRUCTURAL_FINDING], [ENRICHED], [RISK]);
    const messages = buildFieldAuditMessages(bundles);
    assert.equal(messages[0]!.role, "system");
    assert.equal(messages[1]!.role, "user");
    assert.match(messages[1]!.content, /DIA-001/);
    assert.match(messages[1]!.content, /Cláusula segunda/);
    assert.match(messages[1]!.content, /82%/);
  });
});

describe("parseFieldAuditResponse — F2-S4 (guardrails anti-alucinação)", () => {
  it("aceita parecer cujo field existe e cuja explicação cita o ruleId real", () => {
    const bundles = groupFindingsByField([STRUCTURAL_FINDING], [ENRICHED], [RISK]);
    const raw = JSON.stringify([
      {
        field: "cid_code",
        explanation: "A regra DIA-001 aponta CID-10 ausente, reforçada pela cláusula do contrato.",
        confidence: 90,
      },
    ]);
    const opinions = parseFieldAuditResponse(raw, bundles);
    assert.equal(opinions.length, 1);
    assert.equal(opinions[0]!.field, "cid_code");
    assert.equal(opinions[0]!.verdict, "critico");
    assert.equal(opinions[0]!.contractCitation, "UNIMED-NACIONAL-2026 — Cláusula segunda");
    assert.equal(opinions[0]!.denialProbability, 0.82);
    assert.deepEqual(opinions[0]!.sourceRuleIds, ["DIA-001"]);
  });

  it("descarta parecer para um field que não foi fornecido (campo inventado)", () => {
    const bundles = groupFindingsByField([STRUCTURAL_FINDING], [], []);
    const raw = JSON.stringify([
      { field: "campo_que_nao_existe", explanation: "Cita DIA-001 mesmo assim.", confidence: 80 },
    ]);
    assert.deepEqual(parseFieldAuditResponse(raw, bundles), []);
  });

  it("descarta parecer cuja explicação não cita nenhum ruleId real (não ancorado no achado)", () => {
    const bundles = groupFindingsByField([STRUCTURAL_FINDING], [], []);
    const raw = JSON.stringify([
      { field: "cid_code", explanation: "Parece haver um problema genérico neste campo.", confidence: 80 },
    ]);
    assert.deepEqual(parseFieldAuditResponse(raw, bundles), []);
  });

  it("descarta itens com confidence fora do intervalo 0-100", () => {
    const bundles = groupFindingsByField([STRUCTURAL_FINDING], [], []);
    const raw = JSON.stringify([{ field: "cid_code", explanation: "DIA-001 crítico.", confidence: 150 }]);
    assert.deepEqual(parseFieldAuditResponse(raw, bundles), []);
  });

  it("verdict 'critico' quando há achado bloqueante ou severidade crítica, 'atencao' caso contrário", () => {
    const bundles = groupFindingsByField([LOW_SEVERITY_FINDING], [], []);
    const raw = JSON.stringify([
      { field: "execution_date", explanation: "Regra DAT-004 sinaliza data suspeita.", confidence: 60 },
    ]);
    const opinions = parseFieldAuditResponse(raw, bundles);
    assert.equal(opinions[0]!.verdict, "atencao");
  });

  it("retorna vazio para JSON malformado ou não-array", () => {
    assert.deepEqual(parseFieldAuditResponse("não é json", [], []), []);
    assert.deepEqual(parseFieldAuditResponse('{"a":1}', [], []), []);
  });
});

describe("generateFieldAuditOpinions — F2-S4 (orquestração)", () => {
  it("não chama o provider quando não há bundles (nenhum achado)", async () => {
    let called = false;
    const port = new FakeChatProvider(() => {
      called = true;
      return { ok: true, provider: "test", content: "[]" };
    });
    const opinions = await generateFieldAuditOpinions(port, []);
    assert.deepEqual(opinions, []);
    assert.equal(called, false);
  });

  it("retorna vazio quando o provider falha", async () => {
    const bundles = groupFindingsByField([STRUCTURAL_FINDING], [], []);
    const port = new FakeChatProvider(() => ({ ok: false, provider: "test", message: "erro" }));
    assert.deepEqual(await generateFieldAuditOpinions(port, bundles), []);
  });

  it("propaga a resposta do provider pelo parser end-to-end", async () => {
    const bundles = groupFindingsByField([STRUCTURAL_FINDING], [ENRICHED], [RISK]);
    const port = new FakeChatProvider(() => ({
      ok: true,
      provider: "test",
      content: JSON.stringify([
        { field: "cid_code", explanation: "DIA-001 crítico, sem CID informado.", confidence: 85 },
      ]),
    }));
    const opinions = await generateFieldAuditOpinions(port, bundles);
    assert.equal(opinions.length, 1);
    assert.equal(opinions[0]!.confidence, 85);
  });
});
