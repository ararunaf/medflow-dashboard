/**
 * Shift Matching Agent — F4-S3.
 *
 * Mesma disciplina do Field Audit Agent (F2-S4): quem é elegível e em que
 * ordem aparece é sempre derivado de sinais determinísticos calculados em
 * código (afiliação, conflito de horário, especialidade, disponibilidade);
 * a IA só escreve uma frase de justificativa e é descartada quando inventa
 * um candidato ou não cita um dado real dele.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildShiftMatchingMessages,
  computeSpecialtyMatch,
  generateShiftMatchSuggestions,
  parseShiftMatchingResponse,
  scoreAndRankCandidates,
  type ShiftMatchCandidate,
  type ShiftMatchCandidateInput,
} from "../../../src/lib/services/operations/shift-matching-agent.ts";
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

const CANDIDATE_A: ShiftMatchCandidateInput = {
  professionalId: "prof-a",
  professionalName: "Ana Souza",
  specialty: "Clínica Médica",
  crm: "SP-111111",
  hospitalAffiliationOk: true,
  hasTimeConflict: false,
  availabilityMatch: true,
};
const CANDIDATE_B: ShiftMatchCandidateInput = {
  professionalId: "prof-b",
  professionalName: "Bruno Lima",
  specialty: "Ortopedia",
  crm: "SP-222222",
  hospitalAffiliationOk: true,
  hasTimeConflict: false,
  availabilityMatch: null,
};
const CANDIDATE_CONFLICTED: ShiftMatchCandidateInput = {
  professionalId: "prof-c",
  professionalName: "Carla Reis",
  specialty: "Clínica Médica",
  crm: "SP-333333",
  hospitalAffiliationOk: true,
  hasTimeConflict: true,
  availabilityMatch: true,
};
const CANDIDATE_NOT_AFFILIATED: ShiftMatchCandidateInput = {
  professionalId: "prof-d",
  professionalName: "Diego Alves",
  specialty: "Clínica Médica",
  crm: "SP-444444",
  hospitalAffiliationOk: false,
  hasTimeConflict: false,
  availabilityMatch: true,
};

describe("computeSpecialtyMatch — F4-S3", () => {
  it("sem exigência declarada, qualquer especialidade combina", () => {
    assert.equal(computeSpecialtyMatch("", "Ortopedia"), true);
  });
  it("combina quando a especialidade contém a exigência (case/acento insensível)", () => {
    assert.equal(computeSpecialtyMatch("clinica medica", "Clínica Médica"), true);
  });
  it("não combina quando são especialidades distintas", () => {
    assert.equal(computeSpecialtyMatch("Ortopedia", "Clínica Médica"), false);
  });
  it("não combina quando o profissional não tem especialidade cadastrada mas há exigência", () => {
    assert.equal(computeSpecialtyMatch("Ortopedia", ""), false);
  });
});

describe("scoreAndRankCandidates — F4-S3 (filtros duros + pontuação determinística)", () => {
  it("filtra candidato com conflito de horário mesmo que o resto combine perfeitamente", () => {
    const ranked = scoreAndRankCandidates("Clínica Médica", [CANDIDATE_A, CANDIDATE_CONFLICTED]);
    assert.equal(ranked.length, 1);
    assert.equal(ranked[0]!.professionalId, "prof-a");
  });

  it("filtra candidato sem afiliação institucional ao hospital do plantão", () => {
    const ranked = scoreAndRankCandidates("Clínica Médica", [CANDIDATE_A, CANDIDATE_NOT_AFFILIATED]);
    assert.equal(ranked.length, 1);
    assert.equal(ranked[0]!.professionalId, "prof-a");
  });

  it("ordena por pontuação: especialidade+disponibilidade combinando vence quem só combina especialidade", () => {
    const ranked = scoreAndRankCandidates("Clínica Médica", [CANDIDATE_B, CANDIDATE_A]);
    // B: especialidade não combina (Ortopedia != Clínica Médica), disponibilidade null -> score 0
    // A: especialidade combina + disponibilidade true -> score 2
    assert.equal(ranked[0]!.professionalId, "prof-a");
    assert.equal(ranked[0]!.score, 2);
    assert.equal(ranked[1]!.professionalId, "prof-b");
    assert.equal(ranked[1]!.score, 0);
  });

  it("disponibilidade null (sem dado cadastrado) pontua igual a false — não é um sinal positivo", () => {
    const unknown: ShiftMatchCandidateInput = {
      ...CANDIDATE_A,
      professionalId: "prof-e",
      professionalName: "Ana",
      availabilityMatch: null,
    };
    const noMatch: ShiftMatchCandidateInput = {
      ...CANDIDATE_A,
      professionalId: "prof-f",
      professionalName: "Bruno",
      availabilityMatch: false,
    };
    const ranked = scoreAndRankCandidates("Clínica Médica", [noMatch, unknown]);
    // Ambos têm specialtyMatch=true; availabilityMatch false e null contam igual (0) -> score 1 empatado,
    // desempate por nome alfabético (Ana antes de Bruno).
    assert.equal(ranked[0]!.score, 1);
    assert.equal(ranked[1]!.score, 1);
    assert.equal(ranked[0]!.professionalName, "Ana");
    assert.equal(ranked[1]!.professionalName, "Bruno");
  });

  it("desempata por nome em ordem alfabética quando a pontuação é igual", () => {
    const first: ShiftMatchCandidateInput = { ...CANDIDATE_A, professionalId: "prof-z", professionalName: "Zeca" };
    const second: ShiftMatchCandidateInput = { ...CANDIDATE_A, professionalId: "prof-y", professionalName: "Ana" };
    const ranked = scoreAndRankCandidates("Clínica Médica", [first, second]);
    assert.equal(ranked[0]!.professionalName, "Ana");
    assert.equal(ranked[1]!.professionalName, "Zeca");
  });

  it("retorna vazio quando todos os candidatos são filtrados", () => {
    assert.deepEqual(scoreAndRankCandidates("Clínica Médica", [CANDIDATE_CONFLICTED, CANDIDATE_NOT_AFFILIATED]), []);
  });
});

const SHIFT_CONTEXT = {
  departmentName: "Pronto-Socorro",
  roleRequired: "Clínica Médica",
  startsAt: "2026-08-15T08:00:00.000Z",
  endsAt: "2026-08-15T20:00:00.000Z",
};

describe("buildShiftMatchingMessages — F4-S3", () => {
  it("inclui professionalId, especialidade e sinal de disponibilidade de cada candidato no prompt", () => {
    const ranked = scoreAndRankCandidates("Clínica Médica", [CANDIDATE_A]);
    const messages = buildShiftMatchingMessages(SHIFT_CONTEXT, ranked);
    assert.equal(messages[0]!.role, "system");
    assert.equal(messages[1]!.role, "user");
    assert.match(messages[1]!.content, /prof-a/);
    assert.match(messages[1]!.content, /Clínica Médica/);
    assert.match(messages[1]!.content, /cobre o horário/);
  });
});

describe("parseShiftMatchingResponse — F4-S3 (guardrails anti-alucinação)", () => {
  it("aceita justificativa cujo professionalId existe e cita a especialidade real", () => {
    const ranked = scoreAndRankCandidates("Clínica Médica", [CANDIDATE_A]);
    const raw = JSON.stringify([
      { professionalId: "prof-a", rationale: "Ana atua em Clínica Médica e está disponível no horário." },
    ]);
    const rationales = parseShiftMatchingResponse(raw, ranked);
    assert.equal(rationales.get("prof-a"), "Ana atua em Clínica Médica e está disponível no horário.");
  });

  it("aceita justificativa que cita o CRM real mesmo sem citar a especialidade", () => {
    const ranked = scoreAndRankCandidates("Clínica Médica", [CANDIDATE_A]);
    const raw = JSON.stringify([{ professionalId: "prof-a", rationale: "Profissional CRM SP-111111 já atende no local." }]);
    const rationales = parseShiftMatchingResponse(raw, ranked);
    assert.equal(rationales.has("prof-a"), true);
  });

  it("descarta justificativa para um professionalId que não foi fornecido (candidato inventado)", () => {
    const ranked = scoreAndRankCandidates("Clínica Médica", [CANDIDATE_A]);
    const raw = JSON.stringify([{ professionalId: "prof-inexistente", rationale: "Cita Clínica Médica mesmo assim." }]);
    assert.equal(parseShiftMatchingResponse(raw, ranked).size, 0);
  });

  it("descarta justificativa que não cita nem especialidade nem CRM reais do candidato", () => {
    const ranked = scoreAndRankCandidates("Clínica Médica", [CANDIDATE_A]);
    const raw = JSON.stringify([{ professionalId: "prof-a", rationale: "É um ótimo profissional em geral." }]);
    assert.equal(parseShiftMatchingResponse(raw, ranked).size, 0);
  });

  it("retorna vazio para JSON malformado ou não-array", () => {
    assert.equal(parseShiftMatchingResponse("não é json", []).size, 0);
    assert.equal(parseShiftMatchingResponse('{"a":1}', []).size, 0);
  });
});

describe("generateShiftMatchSuggestions — F4-S3 (orquestração e resiliência a falha de IA)", () => {
  it("não chama o provider quando não há candidatos ranqueados", async () => {
    let called = false;
    const port = new FakeChatProvider(() => {
      called = true;
      return { ok: true, provider: "test", content: "[]" };
    });
    const suggestions = await generateShiftMatchSuggestions(port, SHIFT_CONTEXT, []);
    assert.deepEqual(suggestions, []);
    assert.equal(called, false);
  });

  it("quando o provider falha, devolve a lista determinística com rationale null (nunca derruba candidato)", async () => {
    const ranked = scoreAndRankCandidates("Clínica Médica", [CANDIDATE_A, CANDIDATE_B]);
    const port = new FakeChatProvider(() => ({ ok: false, provider: "test", message: "erro" }));
    const suggestions = await generateShiftMatchSuggestions(port, SHIFT_CONTEXT, ranked);
    assert.equal(suggestions.length, 2);
    assert.ok(suggestions.every((s) => s.rationale === null));
    // a ordem determinística é preservada mesmo sem IA
    assert.equal(suggestions[0]!.professionalId, ranked[0]!.professionalId);
  });

  it("quando o provider lança exceção, ainda devolve a lista determinística (nunca propaga)", async () => {
    const ranked = scoreAndRankCandidates("Clínica Médica", [CANDIDATE_A]);
    const port = new FakeChatProvider(() => {
      throw new Error("timeout");
    });
    const suggestions = await generateShiftMatchSuggestions(port, SHIFT_CONTEXT, ranked);
    assert.equal(suggestions.length, 1);
    assert.equal(suggestions[0]!.rationale, null);
  });

  it("propaga a justificativa aprovada pelo parser, mantendo a ordem determinística", async () => {
    const ranked = scoreAndRankCandidates("Clínica Médica", [CANDIDATE_A, CANDIDATE_B]);
    const port = new FakeChatProvider(() => ({
      ok: true,
      provider: "test",
      content: JSON.stringify([
        { professionalId: "prof-a", rationale: "Ana está em Clínica Médica e disponível." },
      ]),
    }));
    const suggestions = await generateShiftMatchSuggestions(port, SHIFT_CONTEXT, ranked);
    const a = suggestions.find((s) => s.professionalId === "prof-a");
    const b = suggestions.find((s) => s.professionalId === "prof-b");
    assert.ok(a?.rationale?.includes("Clínica Médica"));
    assert.equal(b?.rationale, null); // IA não escreveu nada válido para B — segue na lista, sem texto
  });
});
