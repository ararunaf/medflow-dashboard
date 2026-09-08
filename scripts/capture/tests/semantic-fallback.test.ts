/**
 * F2-S5 — OCR Semantic Fallback (GPT-4o Vision para campo de baixa confiança).
 *
 * cropFieldRegion usa sharp de verdade sobre uma imagem sintetizada em
 * memória (sharp `create`) — não um mock de biblioteca de imagem, prova
 * real de que o recorte funciona. O restante usa um AIProviderPort fake,
 * mesmo padrão anti-alucinação/guardrail já usado em F2-S2/F2-S4.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import {
  applySemanticFallback,
  cropFieldRegion,
  extractFieldViaVision,
  parseVisionExtractResponse,
  selectLowConfidenceFields,
  SEMANTIC_FALLBACK_CONFIDENCE_THRESHOLD,
} from "../../../src/lib/capture/ocr/fallback/semantic-fallback.ts";
import type {
  StructuredField,
  StructuredFieldGroup,
  StructuredGuide,
} from "../../../src/lib/capture/parser/types/structured-guide.ts";
import type { AIProviderPort } from "../../../src/lib/enterprise/ai-provider/ports/ai-provider-port.ts";
import type {
  AIConfigurationValidation,
  AIProviderCapabilities,
  AIProviderHealth,
  AIProviderInfo,
  AIRequest,
  AIResponse,
} from "../../../src/lib/enterprise/ai-provider/ports/types.ts";

class FakeVisionProvider implements AIProviderPort {
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
      adapterId: "fake-vision",
      capabilities: ["vision"],
      modalities: ["image"],
      supportsStreaming: false,
      supportsStructuredOutput: true,
      supportsVision: true,
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
      modalities: ["image"],
      capabilities: ["vision"],
    };
  }
  supports(): boolean {
    return true;
  }
  async validateConfiguration(): Promise<AIConfigurationValidation> {
    return { ok: true, provider: this.providerId, errors: [], warnings: [] };
  }
}

// group default é "operadora" (não sensível) para não acoplar os testes de
// confiança/recorte/aplicação ao PII/External-AI Gate (SEC-PII-01) — os
// testes do gate abaixo passam group: "paciente"/"diagnostico" explicitamente.
function field(overrides: Partial<StructuredField> = {}): StructuredField {
  return {
    code: "beneficiary_name",
    label: "Nome do Beneficiário",
    group: "operadora",
    value: "J0AO SILVA",
    rawValue: "J0AO SILVA",
    confidence: 0.4,
    position: {
      page: 1,
      lineIndex: 0,
      boundingBox: { x: 10, y: 10, width: 50, height: 10 },
      normalized: { x: 0.1, y: 0.1, width: 0.3, height: 0.1 },
    },
    ocrOrigin: { provider: "azure", lineConfidence: 0.4 },
    status: "partial",
    normalized: false,
    ...overrides,
  };
}

function emptyGroups(): Record<StructuredFieldGroup, StructuredField[]> {
  const groups = [
    "paciente",
    "operadora",
    "prestador",
    "solicitante",
    "executante",
    "procedimentos",
    "diagnostico",
    "autorizacoes",
    "datas",
    "assinaturas",
    "observacoes",
  ] as const;
  return Object.fromEntries(groups.map((g) => [g, []])) as Record<StructuredFieldGroup, StructuredField[]>;
}

function guide(fields: Record<string, StructuredField>): StructuredGuide {
  return {
    version: "structured_guide_v1",
    guideType: "guia_consulta",
    classification: { guideType: "guia_consulta", confidence: 0.9, method: "header_regex", alternativeTypes: [] },
    groups: emptyGroups(),
    fields,
    procedures: [],
    metadata: {
      pageCount: 1,
      parserVersion: "test",
      parserDurationMs: 0,
      ocrProvider: "azure",
      ocrAverageConfidence: 0.5,
      overallConfidence: 0.5,
      fieldsFound: Object.keys(fields).length,
      fieldsMissing: 0,
      fieldsPartial: 0,
      fieldsDuplicate: 0,
      fieldsOutOfPosition: 0,
    },
  };
}

async function makeTestPng(width = 200, height = 100): Promise<Uint8Array> {
  return sharp({ create: { width, height, channels: 3, background: { r: 255, g: 255, b: 255 } } })
    .png()
    .toBuffer();
}

describe("selectLowConfidenceFields — F2-S5", () => {
  it("seleciona campos abaixo do limiar 0.70 com posição conhecida", () => {
    const g = guide({
      low: field({ code: "low", confidence: 0.4 }),
      high: field({ code: "high", confidence: 0.95 }),
    });
    const selected = selectLowConfidenceFields(g);
    assert.equal(selected.length, 1);
    assert.equal(selected[0]!.code, "low");
  });

  it("ignora campo abaixo do limiar sem posição conhecida (nada a recortar)", () => {
    const g = guide({ low: field({ code: "low", confidence: 0.4, position: null }) });
    assert.deepEqual(selectLowConfidenceFields(g), []);
  });

  it("limiar é exatamente 0.70 (exclusivo — 0.70 não entra, 0.699 entra)", () => {
    const g = guide({
      atLimiar: field({ code: "atLimiar", confidence: SEMANTIC_FALLBACK_CONFIDENCE_THRESHOLD }),
      abaixo: field({ code: "abaixo", confidence: SEMANTIC_FALLBACK_CONFIDENCE_THRESHOLD - 0.001 }),
    });
    const selected = selectLowConfidenceFields(g).map((f) => f.code);
    assert.deepEqual(selected, ["abaixo"]);
  });
});

describe("cropFieldRegion — F2-S5 (recorte real com sharp)", () => {
  it("recorta a região normalizada com o tamanho esperado (+ padding)", async () => {
    const png = await makeTestPng(200, 100);
    const position = field().position!;
    const crop = await cropFieldRegion(png, position, 0);
    const meta = await sharp(Buffer.from(crop)).metadata();
    // normalized: x=0.1,y=0.1,w=0.3,h=0.1 sobre 200x100 → 60x10px
    assert.equal(meta.width, 60);
    assert.equal(meta.height, 10);
  });

  it("aplica padding proporcional ao redor da região", async () => {
    const png = await makeTestPng(200, 100);
    const position = field().position!;
    const cropNoPad = await cropFieldRegion(png, position, 0);
    const cropPadded = await cropFieldRegion(png, position, 0.5);
    const metaNoPad = await sharp(Buffer.from(cropNoPad)).metadata();
    const metaPadded = await sharp(Buffer.from(cropPadded)).metadata();
    assert.ok((metaPadded.width ?? 0) > (metaNoPad.width ?? 0));
    assert.ok((metaPadded.height ?? 0) > (metaNoPad.height ?? 0));
  });

  it("nunca extrapola os limites da imagem original", async () => {
    const png = await makeTestPng(200, 100);
    const edgePosition = {
      ...field().position!,
      normalized: { x: 0.95, y: 0.95, width: 0.2, height: 0.2 },
    };
    const crop = await cropFieldRegion(png, edgePosition, 0.1);
    const meta = await sharp(Buffer.from(crop)).metadata();
    assert.ok((meta.width ?? 0) <= 200);
    assert.ok((meta.height ?? 0) <= 100);
  });

  it("lança erro claro para bytes de imagem inválidos", async () => {
    await assert.rejects(() => cropFieldRegion(new Uint8Array([1, 2, 3]), field().position!));
  });
});

describe("parseVisionExtractResponse — F2-S5", () => {
  it("aceita { value, confidence } válido", () => {
    assert.deepEqual(parseVisionExtractResponse('{"value":"João Silva","confidence":0.92}'), {
      value: "João Silva",
      confidence: 0.92,
    });
  });

  it("aceita value null (modelo não conseguiu ler)", () => {
    assert.deepEqual(parseVisionExtractResponse('{"value":null,"confidence":0.1}'), {
      value: null,
      confidence: 0.1,
    });
  });

  it("rejeita confidence fora de 0-1 (a escala aqui NÃO é 0-100)", () => {
    assert.equal(parseVisionExtractResponse('{"value":"x","confidence":92}'), null);
  });

  it("rejeita JSON malformado ou faltando campos", () => {
    assert.equal(parseVisionExtractResponse("não é json"), null);
    assert.equal(parseVisionExtractResponse('{"value":"x"}'), null);
    assert.equal(parseVisionExtractResponse("[]"), null);
  });
});

describe("extractFieldViaVision — F2-S5", () => {
  it("envia o recorte como image_url data URI e o rótulo do campo no prompt", async () => {
    const port = new FakeVisionProvider(() => ({
      ok: true,
      provider: "test",
      content: '{"value":"João Silva","confidence":0.9}',
    }));
    const png = await makeTestPng(50, 20);
    const result = await extractFieldViaVision(port, png, { code: "beneficiary_name", label: "Nome do Beneficiário" });
    assert.deepEqual(result, { value: "João Silva", confidence: 0.9 });

    const sentMessages = port.calls[0]!.input as { messages: Array<{ role: string; content: unknown }> };
    const userMessage = sentMessages.messages.find((m) => m.role === "user")!;
    const parts = userMessage.content as Array<{ type: string; text?: string; image_url?: { url: string } }>;
    assert.ok(parts.some((p) => p.type === "text" && p.text?.includes("Nome do Beneficiário")));
    assert.ok(parts.some((p) => p.type === "image_url" && p.image_url?.url.startsWith("data:image/png;base64,")));
  });

  it("retorna null quando o provider falha", async () => {
    const port = new FakeVisionProvider(() => ({ ok: false, provider: "test", message: "erro" }));
    const png = await makeTestPng(50, 20);
    const result = await extractFieldViaVision(port, png, { code: "x", label: "X" });
    assert.equal(result, null);
  });
});

describe("applySemanticFallback — F2-S5 (orquestração + log de decisão, DoD)", () => {
  it("não toca em campo com confiança já suficiente", async () => {
    const g = guide({ high: field({ code: "high", confidence: 0.95 }) });
    const port = new FakeVisionProvider(() => ({ ok: true, provider: "test", content: '{"value":"x","confidence":0.99}' }));
    const { decisions } = await applySemanticFallback(port, g, await makeTestPng(), "image/png");
    assert.deepEqual(decisions, []);
  });

  it("pula (mas registra) mime não suportado para recorte, sem chamar o provider", async () => {
    const g = guide({ low: field({ confidence: 0.3 }) });
    let called = false;
    const port = new FakeVisionProvider(() => {
      called = true;
      return { ok: true, provider: "test", content: '{"value":"x","confidence":0.9}' };
    });
    const { decisions, guide: result } = await applySemanticFallback(port, g, await makeTestPng(), "application/pdf");
    assert.equal(called, false);
    assert.equal(decisions.length, 1);
    assert.equal(decisions[0]!.triggered, false);
    assert.match(decisions[0]!.skippedReason ?? "", /application\/pdf/);
    assert.equal(decisions[0]!.applied, false);
    assert.equal(result.fields.low!.confidence, 0.3); // inalterado
  });

  it("aplica o novo valor quando a confiança do fallback supera a original", async () => {
    const g = guide({ low: field({ confidence: 0.3 }) });
    const port = new FakeVisionProvider(() => ({ ok: true, provider: "test", content: '{"value":"JOÃO SILVA","confidence":0.88}' }));
    const { decisions, guide: result } = await applySemanticFallback(port, g, await makeTestPng(), "image/png");
    assert.equal(decisions.length, 1);
    assert.equal(decisions[0]!.triggered, true);
    assert.equal(decisions[0]!.applied, true);
    assert.equal(result.fields.beneficiary_name!.value, "JOÃO SILVA");
    assert.equal(result.fields.beneficiary_name!.confidence, 0.88);
    assert.equal(result.fields.beneficiary_name!.status, "found");
  });

  it("NÃO aplica quando a confiança do fallback é igual ou pior — mas ainda registra a tentativa", async () => {
    const g = guide({ low: field({ confidence: 0.5, value: "valor original" }) });
    const port = new FakeVisionProvider(() => ({ ok: true, provider: "test", content: '{"value":"outro valor","confidence":0.3}' }));
    const { decisions, guide: result } = await applySemanticFallback(port, g, await makeTestPng(), "image/png");
    assert.equal(decisions[0]!.triggered, true);
    assert.equal(decisions[0]!.applied, false);
    assert.equal(result.fields.low!.value, "valor original");
  });

  it("registra decisão mesmo quando o modelo não conseguiu ler (value null)", async () => {
    const g = guide({ low: field({ confidence: 0.3 }) });
    const port = new FakeVisionProvider(() => ({ ok: true, provider: "test", content: '{"value":null,"confidence":0.05}' }));
    const { decisions } = await applySemanticFallback(port, g, await makeTestPng(), "image/png");
    assert.equal(decisions[0]!.triggered, true);
    assert.equal(decisions[0]!.newValue, null);
    assert.equal(decisions[0]!.applied, false);
  });

  it("processa múltiplos campos de baixa confiança independentemente", async () => {
    const g = guide({
      a: field({ code: "a", confidence: 0.2 }),
      b: field({ code: "b", confidence: 0.6 }),
      c: field({ code: "c", confidence: 0.95 }),
    });
    const port = new FakeVisionProvider(() => ({ ok: true, provider: "test", content: '{"value":"x","confidence":0.9}' }));
    const { decisions } = await applySemanticFallback(port, g, await makeTestPng(), "image/png");
    assert.equal(decisions.length, 2);
    assert.deepEqual(
      decisions.map((d) => d.fieldCode).sort(),
      ["a", "b"],
    );
  });
});

describe("applySemanticFallback — PII/External-AI Gate (SEC-PII-01)", () => {
  const ORIGINAL_ENV = process.env.MEDICFLOW_ALLOW_PII_EXTERNAL_AI;
  function resetEnv() {
    if (ORIGINAL_ENV === undefined) delete process.env.MEDICFLOW_ALLOW_PII_EXTERNAL_AI;
    else process.env.MEDICFLOW_ALLOW_PII_EXTERNAL_AI = ORIGINAL_ENV;
  }

  it("bloqueia campo do grupo 'paciente' sem chamar o provider quando a política está ausente", async () => {
    delete process.env.MEDICFLOW_ALLOW_PII_EXTERNAL_AI;
    let called = false;
    const g = guide({ low: field({ group: "paciente", confidence: 0.3 }) });
    const port = new FakeVisionProvider(() => {
      called = true;
      return { ok: true, provider: "test", content: '{"value":"x","confidence":0.9}' };
    });
    const { decisions, guide: result } = await applySemanticFallback(port, g, await makeTestPng(), "image/png");
    resetEnv();

    assert.equal(called, false, "AIProviderPort não deve ser chamado com o gate fechado");
    assert.equal(decisions.length, 1);
    assert.equal(decisions[0]!.triggered, false);
    assert.equal(decisions[0]!.applied, false);
    assert.match(decisions[0]!.skippedReason ?? "", /PII\/External-AI Gate/);
    assert.match(decisions[0]!.skippedReason ?? "", /paciente/);
    assert.equal(result.fields.low!.confidence, 0.3);
  });

  it("bloqueia campo do grupo 'diagnostico' sem chamar o provider quando a política está ausente", async () => {
    delete process.env.MEDICFLOW_ALLOW_PII_EXTERNAL_AI;
    let called = false;
    const g = guide({ low: field({ group: "diagnostico", confidence: 0.3 }) });
    const port = new FakeVisionProvider(() => {
      called = true;
      return { ok: true, provider: "test", content: '{"value":"x","confidence":0.9}' };
    });
    const { decisions } = await applySemanticFallback(port, g, await makeTestPng(), "image/png");
    resetEnv();

    assert.equal(called, false);
    assert.equal(decisions[0]!.triggered, false);
    assert.match(decisions[0]!.skippedReason ?? "", /PII\/External-AI Gate/);
  });

  it("qualquer valor diferente de 'true' (vazio, 'false', '1') continua bloqueando — fail-closed", async () => {
    let called = false;
    const port = new FakeVisionProvider(() => {
      called = true;
      return { ok: true, provider: "test", content: '{"value":"x","confidence":0.9}' };
    });
    for (const value of ["", "false", "1", "TRUE", "yes"]) {
      process.env.MEDICFLOW_ALLOW_PII_EXTERNAL_AI = value;
      const g = guide({ low: field({ group: "paciente", confidence: 0.3 }) });
      const { decisions } = await applySemanticFallback(port, g, await makeTestPng(), "image/png");
      assert.equal(decisions[0]!.triggered, false, `valor "${value}" não deveria abrir o gate`);
    }
    resetEnv();
    assert.equal(called, false);
  });

  it("permite campo do grupo 'paciente' quando a política explícita está habilitada", async () => {
    process.env.MEDICFLOW_ALLOW_PII_EXTERNAL_AI = "true";
    const g = guide({ low: field({ group: "paciente", confidence: 0.3 }) });
    const port = new FakeVisionProvider(() => ({
      ok: true,
      provider: "test",
      content: '{"value":"JOÃO SILVA","confidence":0.9}',
    }));
    const { decisions, guide: result } = await applySemanticFallback(port, g, await makeTestPng(), "image/png");
    resetEnv();

    assert.equal(decisions[0]!.triggered, true);
    assert.equal(decisions[0]!.applied, true);
    assert.equal(result.fields.beneficiary_name!.value, "JOÃO SILVA");
  });

  it("não afeta grupos não sensíveis — sempre chama o provider independente da política", async () => {
    delete process.env.MEDICFLOW_ALLOW_PII_EXTERNAL_AI;
    let called = false;
    const g = guide({ low: field({ group: "operadora", confidence: 0.3 }) });
    const port = new FakeVisionProvider(() => {
      called = true;
      return { ok: true, provider: "test", content: '{"value":"x","confidence":0.9}' };
    });
    const { decisions } = await applySemanticFallback(port, g, await makeTestPng(), "image/png");
    resetEnv();

    assert.equal(called, true);
    assert.equal(decisions[0]!.triggered, true);
  });
});
