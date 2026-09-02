/**
 * Contract Knowledge Agent — F2-S2.
 *
 * O guardrail mais importante desta engine é anti-alucinação: uma proposta
 * cuja citationExcerpt não seja uma cópia literal de um chunk fornecido
 * precisa ser descartada, mesmo que o prompt peça isso — não dá para
 * confiar só na instrução ao modelo. Por isso boa parte dos testes aqui
 * cobre parseContractExtractionResponse isoladamente, com respostas
 * "do modelo" fabricadas à mão (inclusive más-formadas/alucinadas).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildContractExtractionMessages,
  extractAllContractRuleCategories,
  extractContractRulesForCategory,
  parseContractExtractionResponse,
  type ContractKnowledgeChunk,
} from "../../../src/lib/capture/contract/engine/contract-knowledge-agent.ts";
import { CONTRACT_RULE_CATEGORIES } from "../../../src/lib/capture/contract/types/contract-rule-proposal.ts";
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

const CHUNKS: ContractKnowledgeChunk[] = [
  {
    id: "chunk-1",
    heading: "CLÁUSULA SEGUNDA - DA COBERTURA",
    content:
      "A cobertura abrange consultas eletivas, exames laboratoriais e internações de urgência, " +
      "excluindo procedimentos estéticos sem indicação clínica.",
  },
  {
    id: "chunk-2",
    heading: "CLÁUSULA QUINTA - DA PRÉ-AUTORIZAÇÃO",
    content: "Procedimentos de alta complexidade exigem senha de autorização prévia solicitada com 5 dias úteis.",
  },
];

describe("buildContractExtractionMessages — F2-S2", () => {
  it("inclui o texto de todos os chunks e a categoria pedida no prompt", () => {
    const messages = buildContractExtractionMessages("cobertura", CHUNKS);
    assert.equal(messages.length, 2);
    assert.equal(messages[0]!.role, "system");
    assert.match(messages[0]!.content, /JSON/);
    assert.equal(messages[1]!.role, "user");
    assert.match(messages[1]!.content, /consultas eletivas/);
    assert.match(messages[1]!.content, /senha de autorização/);
    assert.match(messages[1]!.content, /Cobertura/i);
  });
});

describe("parseContractExtractionResponse — F2-S2 (guardrail anti-alucinação)", () => {
  it("aceita proposta cuja citationExcerpt é cópia literal de um chunk", () => {
    const raw = JSON.stringify([
      {
        description: "Cobertura de consultas eletivas e exames laboratoriais",
        justification: "Cláusula segunda define o escopo de cobertura do contrato",
        citationHeading: "CLÁUSULA SEGUNDA - DA COBERTURA",
        citationExcerpt: "A cobertura abrange consultas eletivas, exames laboratoriais e internações de urgência",
        confidence: 92,
      },
    ]);
    const proposals = parseContractExtractionResponse(raw, "cobertura", CHUNKS, "gpt-4o-mini");
    assert.equal(proposals.length, 1);
    assert.equal(proposals[0]!.sourceChunkIds[0], "chunk-1");
    assert.equal(proposals[0]!.extractionModel, "gpt-4o-mini");
    assert.equal(proposals[0]!.category, "cobertura");
  });

  it("descarta proposta cuja citationExcerpt não existe em nenhum chunk (alucinação)", () => {
    const raw = JSON.stringify([
      {
        description: "Cobertura odontológica ilimitada",
        justification: "inventado",
        citationHeading: null,
        citationExcerpt: "cobertura odontológica ilimitada sem carência", // não está em nenhum chunk
        confidence: 80,
      },
    ]);
    const proposals = parseContractExtractionResponse(raw, "cobertura", CHUNKS, "gpt-4o-mini");
    assert.equal(proposals.length, 0);
  });

  it("herda o heading do chunk-fonte quando o modelo não informa citationHeading", () => {
    const raw = JSON.stringify([
      {
        description: "Exige senha de autorização para alta complexidade",
        justification: "Cláusula quinta condiciona procedimentos de alta complexidade à pré-autorização",
        citationExcerpt: "Procedimentos de alta complexidade exigem senha de autorização prévia",
        confidence: 88,
      },
    ]);
    const proposals = parseContractExtractionResponse(raw, "pre_autorizacao", CHUNKS, "gpt-4o-mini");
    assert.equal(proposals.length, 1);
    assert.equal(proposals[0]!.citationHeading, "CLÁUSULA QUINTA - DA PRÉ-AUTORIZAÇÃO");
  });

  it("descarta itens com confidence fora do intervalo 0-100", () => {
    const raw = JSON.stringify([
      {
        description: "x",
        justification: "y",
        citationExcerpt: "A cobertura abrange consultas eletivas",
        confidence: 150,
      },
    ]);
    assert.deepEqual(parseContractExtractionResponse(raw, "cobertura", CHUNKS, "m"), []);
  });

  it("descarta itens sem description/justification/citationExcerpt", () => {
    const raw = JSON.stringify([{ description: "", justification: "y", citationExcerpt: "z", confidence: 50 }]);
    assert.deepEqual(parseContractExtractionResponse(raw, "cobertura", CHUNKS, "m"), []);
  });

  it("retorna vazio (não lança) para JSON malformado", () => {
    assert.deepEqual(parseContractExtractionResponse("não é json", "cobertura", CHUNKS, "m"), []);
  });

  it("retorna vazio quando a resposta não é um array", () => {
    assert.deepEqual(parseContractExtractionResponse('{"foo":"bar"}', "cobertura", CHUNKS, "m"), []);
  });

  it("array vazio é uma resposta válida (categoria sem regra nos trechos)", () => {
    assert.deepEqual(parseContractExtractionResponse("[]", "prazo", CHUNKS, "m"), []);
  });
});

describe("extractContractRulesForCategory — F2-S2 (orquestração)", () => {
  it("não chama o provider quando não há chunks", async () => {
    let called = false;
    const port = new FakeChatProvider(() => {
      called = true;
      return { ok: true, provider: "test", content: "[]" };
    });
    const proposals = await extractContractRulesForCategory(port, "cobertura", []);
    assert.deepEqual(proposals, []);
    assert.equal(called, false);
  });

  it("passa o content da resposta pelo parser e retorna propostas com o modelo usado", async () => {
    const port = new FakeChatProvider(() => ({
      ok: true,
      provider: "test",
      model: "gpt-4o-mini",
      content: JSON.stringify([
        {
          description: "Cobertura de exames laboratoriais",
          justification: "Explícito na cláusula segunda",
          citationExcerpt: "exames laboratoriais e internações de urgência",
          confidence: 75,
        },
      ]),
    }));
    const proposals = await extractContractRulesForCategory(port, "cobertura", CHUNKS);
    assert.equal(proposals.length, 1);
    assert.equal(proposals[0]!.extractionModel, "gpt-4o-mini");
  });

  it("retorna vazio quando o provider falha (ok=false)", async () => {
    const port = new FakeChatProvider(() => ({ ok: false, provider: "test", message: "erro" }));
    const proposals = await extractContractRulesForCategory(port, "cobertura", CHUNKS);
    assert.deepEqual(proposals, []);
  });
});

describe("extractAllContractRuleCategories — F2-S2", () => {
  it("roda as 5 categorias e agrega as propostas de todas", async () => {
    const port = new FakeChatProvider((request) => {
      const userMsg = (request.messages ?? []).find((m) => m.role === "user")?.content ?? "";
      const isCobertura = userMsg.includes("Cobertura");
      return {
        ok: true,
        provider: "test",
        model: "gpt-4o-mini",
        content: isCobertura
          ? JSON.stringify([
              {
                description: "d",
                justification: "j",
                citationExcerpt: "A cobertura abrange consultas eletivas",
                confidence: 90,
              },
            ])
          : "[]",
      };
    });

    const chunksByCategory = Object.fromEntries(
      CONTRACT_RULE_CATEGORIES.map((c) => [c, CHUNKS]),
    ) as Record<(typeof CONTRACT_RULE_CATEGORIES)[number], ContractKnowledgeChunk[]>;

    const proposals = await extractAllContractRuleCategories(port, chunksByCategory);
    assert.equal(port.calls.length, CONTRACT_RULE_CATEGORIES.length);
    assert.equal(proposals.length, 1);
    assert.equal(proposals[0]!.category, "cobertura");
  });
});
