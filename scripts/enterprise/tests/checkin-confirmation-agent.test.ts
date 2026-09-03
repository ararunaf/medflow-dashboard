/**
 * Check-in Confirmation Agent — F4-S4.
 *
 * Mesma disciplina dos agentes anteriores (F2-S4 Field Audit, F4-S3 Shift
 * Matching): o verdict é sempre derivado de sinais determinísticos
 * calculados a partir de check_in_at/check_out_at reais; a IA só escreve
 * justificativa para os itens já sinalizados e é descartada quando inventa
 * um item ou não cita nenhum fato real dele.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildAttendanceReview,
  buildAttendanceReviewMessages,
  computeAttendanceSignals,
  deriveAttendanceVerdict,
  generateAttendanceReviewSuggestions,
  parseAttendanceReviewResponse,
  type AttendanceReviewInput,
  type AttendanceReviewItem,
} from "../../../src/lib/services/operations/checkin-confirmation-agent.ts";
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

const SHIFT = { startsAt: "2026-08-15T08:00:00.000Z", endsAt: "2026-08-15T20:00:00.000Z" };
const NOW_AFTER_SHIFT = new Date("2026-08-16T00:00:00.000Z");
const NOW_DURING_SHIFT = new Date("2026-08-15T12:00:00.000Z");

describe("computeAttendanceSignals — F4-S4", () => {
  it("plantão dentro do esperado: sem check-in/out cedo/tarde, sem falta (ainda em andamento)", () => {
    const s = computeAttendanceSignals({ ...SHIFT, checkedInAt: "2026-08-15T08:00:00.000Z", checkedOutAt: null }, NOW_DURING_SHIFT);
    assert.equal(s.noShow, false); // plantão ainda não terminou
    assert.equal(s.missingCheckout, false);
    assert.equal(s.lateMinutes, 0);
  });

  it("chegou atrasado: lateMinutes reflete a diferença real em minutos", () => {
    const s = computeAttendanceSignals({ ...SHIFT, checkedInAt: "2026-08-15T08:23:00.000Z", checkedOutAt: null }, NOW_DURING_SHIFT);
    assert.equal(s.lateMinutes, 23);
  });

  it("chegou adiantado: lateMinutes é 0, nunca negativo", () => {
    const s = computeAttendanceSignals({ ...SHIFT, checkedInAt: "2026-08-15T07:40:00.000Z", checkedOutAt: null }, NOW_DURING_SHIFT);
    assert.equal(s.lateMinutes, 0);
  });

  it("saiu antes do fim: earlyDepartureMinutes reflete a diferença real", () => {
    const s = computeAttendanceSignals({ ...SHIFT, checkedInAt: "2026-08-15T08:00:00.000Z", checkedOutAt: "2026-08-15T19:30:00.000Z" }, NOW_AFTER_SHIFT);
    assert.equal(s.earlyDepartureMinutes, 30);
  });

  it("saiu depois do fim: earlyDepartureMinutes é 0, nunca negativo", () => {
    const s = computeAttendanceSignals({ ...SHIFT, checkedInAt: "2026-08-15T08:00:00.000Z", checkedOutAt: "2026-08-15T20:15:00.000Z" }, NOW_AFTER_SHIFT);
    assert.equal(s.earlyDepartureMinutes, 0);
  });

  it("falta real: plantão terminou e nunca houve check-in", () => {
    const s = computeAttendanceSignals({ ...SHIFT, checkedInAt: null, checkedOutAt: null }, NOW_AFTER_SHIFT);
    assert.equal(s.noShow, true);
    assert.equal(s.missingCheckout, false); // não faz sentido cobrar checkout de quem nem chegou
  });

  it("check-out ausente: fez check-in, plantão terminou, nunca fez check-out", () => {
    const s = computeAttendanceSignals({ ...SHIFT, checkedInAt: "2026-08-15T08:00:00.000Z", checkedOutAt: null }, NOW_AFTER_SHIFT);
    assert.equal(s.missingCheckout, true);
    assert.equal(s.noShow, false);
  });

  it("plantão ainda em andamento nunca é falta, mesmo sem check-in até agora", () => {
    const s = computeAttendanceSignals({ ...SHIFT, checkedInAt: null, checkedOutAt: null }, NOW_DURING_SHIFT);
    assert.equal(s.noShow, false);
  });
});

describe("deriveAttendanceVerdict — F4-S4 (derivado, nunca escolhido pela IA)", () => {
  it("falta ou check-out ausente é sempre crítico", () => {
    assert.equal(deriveAttendanceVerdict({ lateMinutes: 0, earlyDepartureMinutes: 0, noShow: true, missingCheckout: false }), "critico");
    assert.equal(deriveAttendanceVerdict({ lateMinutes: 0, earlyDepartureMinutes: 0, noShow: false, missingCheckout: true }), "critico");
  });
  it("atraso ou saída antecipada acima do limiar é atenção", () => {
    assert.equal(deriveAttendanceVerdict({ lateMinutes: 16, earlyDepartureMinutes: 0, noShow: false, missingCheckout: false }), "atencao");
    assert.equal(deriveAttendanceVerdict({ lateMinutes: 0, earlyDepartureMinutes: 16, noShow: false, missingCheckout: false }), "atencao");
  });
  it("atraso/saída dentro do limiar (15min) é ok", () => {
    assert.equal(deriveAttendanceVerdict({ lateMinutes: 15, earlyDepartureMinutes: 15, noShow: false, missingCheckout: false }), "ok");
  });
  it("tudo zerado é ok", () => {
    assert.equal(deriveAttendanceVerdict({ lateMinutes: 0, earlyDepartureMinutes: 0, noShow: false, missingCheckout: false }), "ok");
  });
});

const BASE_ITEM: AttendanceReviewInput = {
  assignmentId: "assign-1",
  professionalId: "prof-1",
  professionalName: "Ana Souza",
  shiftId: "shift-1",
  departmentName: "Pronto-Socorro",
  startsAt: SHIFT.startsAt,
  endsAt: SHIFT.endsAt,
  checkedInAt: null,
  checkedOutAt: null,
};

describe("buildAttendanceReview — F4-S4", () => {
  it("combina sinais + verdict para cada item, na mesma ordem de entrada", () => {
    const items = buildAttendanceReview([BASE_ITEM], NOW_AFTER_SHIFT);
    assert.equal(items.length, 1);
    assert.equal(items[0]!.verdict, "critico"); // noShow
    assert.equal(items[0]!.signals.noShow, true);
  });
});

describe("buildAttendanceReviewMessages — F4-S4", () => {
  it("inclui assignmentId, nome e descrição real dos sinais no prompt", () => {
    const items = buildAttendanceReview([{ ...BASE_ITEM, checkedInAt: "2026-08-15T08:23:00.000Z" }], NOW_DURING_SHIFT);
    const messages = buildAttendanceReviewMessages(items);
    assert.equal(messages[0]!.role, "system");
    assert.match(messages[1]!.content, /assign-1/);
    assert.match(messages[1]!.content, /Ana Souza/);
    assert.match(messages[1]!.content, /23 minutos atrasado/);
  });
});

describe("parseAttendanceReviewResponse — F4-S4 (guardrails anti-alucinação)", () => {
  const items: AttendanceReviewItem[] = buildAttendanceReview(
    [{ ...BASE_ITEM, checkedInAt: "2026-08-15T08:23:00.000Z" }],
    NOW_DURING_SHIFT,
  );

  it("aceita justificativa cujo assignmentId existe e cita o nome real", () => {
    const raw = JSON.stringify([{ assignmentId: "assign-1", rationale: "Ana Souza chegou com atraso relevante." }]);
    assert.equal(parseAttendanceReviewResponse(raw, items).get("assign-1"), "Ana Souza chegou com atraso relevante.");
  });

  it("aceita justificativa que cita os minutos reais mesmo sem citar o nome", () => {
    const raw = JSON.stringify([{ assignmentId: "assign-1", rationale: "Atraso de 23 minutos registrado no check-in." }]);
    assert.equal(parseAttendanceReviewResponse(raw, items).has("assign-1"), true);
  });

  it("descarta justificativa para um assignmentId não fornecido (item inventado)", () => {
    const raw = JSON.stringify([{ assignmentId: "assign-inexistente", rationale: "Ana Souza com 23 minutos de atraso." }]);
    assert.equal(parseAttendanceReviewResponse(raw, items).size, 0);
  });

  it("descarta justificativa que não cita nome nem números reais", () => {
    const raw = JSON.stringify([{ assignmentId: "assign-1", rationale: "Profissional com comportamento fora do padrão." }]);
    assert.equal(parseAttendanceReviewResponse(raw, items).size, 0);
  });

  it("retorna vazio para JSON malformado ou não-array", () => {
    assert.equal(parseAttendanceReviewResponse("não é json", []).size, 0);
    assert.equal(parseAttendanceReviewResponse('{"a":1}', []).size, 0);
  });
});

describe("generateAttendanceReviewSuggestions — F4-S4 (orquestração e resiliência)", () => {
  it("não chama o provider quando nenhum item está sinalizado (todos ok)", async () => {
    let called = false;
    const port = new FakeChatProvider(() => {
      called = true;
      return { ok: true, provider: "test", content: "[]" };
    });
    const items = buildAttendanceReview(
      [{ ...BASE_ITEM, checkedInAt: SHIFT.startsAt, checkedOutAt: SHIFT.endsAt }],
      NOW_AFTER_SHIFT,
    );
    assert.equal(items[0]!.verdict, "ok");
    const suggestions = await generateAttendanceReviewSuggestions(port, items);
    assert.equal(called, false);
    assert.equal(suggestions[0]!.rationale, null);
  });

  it("quando a IA falha, devolve a lista determinística com rationale null (nunca muda o verdict)", async () => {
    const items = buildAttendanceReview([BASE_ITEM], NOW_AFTER_SHIFT); // noShow -> critico
    const port = new FakeChatProvider(() => ({ ok: false, provider: "test", message: "erro" }));
    const suggestions = await generateAttendanceReviewSuggestions(port, items);
    assert.equal(suggestions[0]!.verdict, "critico");
    assert.equal(suggestions[0]!.rationale, null);
  });

  it("itens 'ok' nunca são enviados à IA junto dos sinalizados, mas continuam na lista final", async () => {
    const okItem: AttendanceReviewInput = { ...BASE_ITEM, assignmentId: "assign-ok", checkedInAt: SHIFT.startsAt, checkedOutAt: SHIFT.endsAt };
    const flaggedItem: AttendanceReviewInput = { ...BASE_ITEM, assignmentId: "assign-flagged" }; // noShow
    const items = buildAttendanceReview([okItem, flaggedItem], NOW_AFTER_SHIFT);

    let receivedIds: string[] = [];
    const port = new FakeChatProvider((req) => {
      const userMsg = req.messages?.find((m) => m.role === "user")?.content ?? "";
      receivedIds = [...userMsg.matchAll(/assignmentId="([^"]+)"/g)].map((m) => m[1]!);
      return { ok: true, provider: "test", content: "[]" };
    });
    const suggestions = await generateAttendanceReviewSuggestions(port, items);
    assert.deepEqual(receivedIds, ["assign-flagged"]);
    assert.equal(suggestions.length, 2); // ambos continuam na lista final
  });

  it("propaga a justificativa aprovada, mantendo o verdict determinístico intacto", async () => {
    const items = buildAttendanceReview([BASE_ITEM], NOW_AFTER_SHIFT);
    const port = new FakeChatProvider(() => ({
      ok: true,
      provider: "test",
      content: JSON.stringify([{ assignmentId: "assign-1", rationale: "Ana Souza não registrou check-in." }]),
    }));
    const suggestions = await generateAttendanceReviewSuggestions(port, items);
    assert.equal(suggestions[0]!.verdict, "critico");
    assert.match(suggestions[0]!.rationale ?? "", /Ana Souza/);
  });
});
