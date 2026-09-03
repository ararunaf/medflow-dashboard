/**
 * Shift Matching Agent — F4-S3.
 *
 * Sugere profissionais para um plantão aberto. Segue o mesmo contrato do
 * Field Audit Agent (F2-S4): o agente NUNCA decide quem é elegível nem
 * define a ordem de sugestão — isso é sempre DERIVADO de sinais
 * determinísticos calculados em código (afiliação institucional real,
 * conflito de horário real, correspondência de especialidade/disponibilidade
 * reais). O modelo só recebe a lista já filtrada e ordenada e escreve uma
 * frase curta de justificativa por candidato, citando um dado real dele —
 * uma resposta cujo `professionalId` não bate com nenhum candidato
 * fornecido, ou cuja explicação não cite a especialidade/CRM real do
 * candidato, é descartada (não derruba o candidato da lista, só perde a
 * justificativa em texto).
 *
 * Fronteira institucional (hospitalAffiliationOk) e ausência de conflito de
 * horário (hasTimeConflict) são filtros DUROS, aplicados antes de pontuar —
 * não é possível "pontuar bem o suficiente" para superar uma dessas duas
 * restrições. Correspondência de especialidade/disponibilidade são sinais
 * de pontuação, não filtros.
 */
import type { AIProviderPort } from "../../enterprise/ai-provider/ports/ai-provider-port";

export type ShiftMatchSignals = {
  /** Sempre true entre os candidatos retornados — quem falha isso é filtrado antes de chegar aqui. */
  hospitalAffiliationOk: boolean;
  specialtyMatch: boolean;
  /** null = profissional sem nenhuma disponibilidade cadastrada (não pode ser aferido, não é penalizado). */
  availabilityMatch: boolean | null;
};

export type ShiftMatchCandidateInput = {
  professionalId: string;
  professionalName: string;
  specialty: string;
  crm: string;
  hospitalAffiliationOk: boolean;
  hasTimeConflict: boolean;
  availabilityMatch: boolean | null;
};

export type ShiftMatchCandidate = {
  professionalId: string;
  professionalName: string;
  specialty: string;
  crm: string;
  signals: ShiftMatchSignals;
  score: number;
};

export type ShiftMatchSuggestion = ShiftMatchCandidate & {
  rationale: string | null;
};

/** minúsculas + sem acento — "Clínica Médica" e "clinica medica" devem combinar. */
function normalizeForMatch(s: string): string {
  return s
    .trim()
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function computeSpecialtyMatch(roleRequired: string, specialty: string): boolean {
  const required = normalizeForMatch(roleRequired);
  if (required.length === 0) return true; // sem exigência declarada — não penaliza ninguém
  const candidate = normalizeForMatch(specialty);
  if (candidate.length === 0) return false;
  return candidate.includes(required) || required.includes(candidate);
}

function scoreOf(signals: ShiftMatchSignals): number {
  return (signals.specialtyMatch ? 1 : 0) + (signals.availabilityMatch === true ? 1 : 0);
}

/**
 * Filtra (afiliação + conflito de horário — filtros duros) e pontua/ordena
 * (especialidade + disponibilidade — sinais de pontuação) os candidatos.
 * Determinístico: mesma entrada sempre produz a mesma ordem, sem depender
 * de nenhuma chamada de IA.
 */
export function scoreAndRankCandidates(
  roleRequired: string,
  candidates: readonly ShiftMatchCandidateInput[],
): ShiftMatchCandidate[] {
  const eligible = candidates.filter((c) => c.hospitalAffiliationOk && !c.hasTimeConflict);

  const scored: ShiftMatchCandidate[] = eligible.map((c) => {
    const signals: ShiftMatchSignals = {
      hospitalAffiliationOk: c.hospitalAffiliationOk,
      specialtyMatch: computeSpecialtyMatch(roleRequired, c.specialty),
      availabilityMatch: c.availabilityMatch,
    };
    return {
      professionalId: c.professionalId,
      professionalName: c.professionalName,
      specialty: c.specialty,
      crm: c.crm,
      signals,
      score: scoreOf(signals),
    };
  });

  return scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.professionalName.localeCompare(b.professionalName, "pt-BR");
  });
}

export function buildShiftMatchingMessages(
  shift: { departmentName: string; roleRequired: string | null; startsAt: string; endsAt: string },
  candidates: readonly ShiftMatchCandidate[],
): Array<{ role: "system" | "user"; content: string }> {
  const shiftDescription =
    `Plantão em "${shift.departmentName}", de ${shift.startsAt} até ${shift.endsAt}` +
    (shift.roleRequired ? `, exigindo: ${shift.roleRequired}` : ", sem exigência de especialidade declarada");

  const context = candidates
    .map((c, i) => {
      const signalLines = [
        `  - especialidade: "${c.specialty}" (${c.signals.specialtyMatch ? "compatível" : "não compatível"} com a exigência do plantão)`,
        `  - CRM: ${c.crm}`,
        c.signals.availabilityMatch === null
          ? "  - disponibilidade: sem dado cadastrado"
          : `  - disponibilidade: ${c.signals.availabilityMatch ? "cobre o horário do plantão" : "não cobre o horário do plantão"}`,
      ].join("\n");
      return `[candidato ${i + 1}: professionalId="${c.professionalId}", nome="${c.professionalName}"]\n${signalLines}`;
    })
    .join("\n\n");

  return [
    {
      role: "system",
      content:
        "Você escreve uma justificativa curta (1 frase) para cada candidato de uma lista de profissionais " +
        "JÁ FILTRADA E ORDENADA por sinais determinísticos (afiliação institucional, conflito de horário, " +
        "correspondência de especialidade e disponibilidade) para cobrir um plantão de uma cooperativa médica " +
        "brasileira. Você NUNCA decide quem é elegível nem muda a ordem — só explica, em português, por que " +
        "cada candidato específico aparece na lista, citando explicitamente a especialidade ou o CRM real dele. " +
        'Responda APENAS com um array JSON de objetos { "professionalId": string, "rationale": string }. O ' +
        '"professionalId" deve ser IDÊNTICO a um dos candidatos listados — nunca invente um profissional que ' +
        "não esteja na lista.",
    },
    {
      role: "user",
      content: `${shiftDescription}\n\nCandidatos (já elegíveis e ordenados):\n\n${context}\n\nEscreva uma justificativa para cada candidato, no formato JSON pedido.`,
    },
  ];
}

type RawShiftMatchItem = {
  professionalId?: unknown;
  rationale?: unknown;
};

export function parseShiftMatchingResponse(
  raw: string,
  candidates: readonly ShiftMatchCandidate[],
): Map<string, string> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return new Map();
  }
  if (!Array.isArray(parsed)) return new Map();

  const byId = new Map(candidates.map((c) => [c.professionalId, c]));
  const rationales = new Map<string, string>();

  for (const item of parsed as RawShiftMatchItem[]) {
    if (
      typeof item?.professionalId !== "string" ||
      typeof item?.rationale !== "string" ||
      item.rationale.trim().length === 0
    ) {
      continue;
    }
    const candidate = byId.get(item.professionalId);
    if (!candidate) continue; // profissional inventado, não fornecido — descarta

    const rationale = item.rationale.trim();
    const citesSpecialty =
      candidate.specialty.length > 0 &&
      rationale.toLocaleLowerCase("pt-BR").includes(candidate.specialty.toLocaleLowerCase("pt-BR"));
    const citesCrm = candidate.crm.length > 0 && rationale.includes(candidate.crm);
    if (!citesSpecialty && !citesCrm) continue; // não ancorada em nenhum dado real do candidato — descarta

    rationales.set(item.professionalId, rationale);
  }

  return rationales;
}

/**
 * Anexa a justificativa da IA aos candidatos já ranqueados. Se a IA falhar
 * ou nenhuma justificativa passar no guardrail, a lista determinística é
 * retornada do mesmo jeito, só com `rationale: null` — a IA nunca é o que
 * decide se um candidato aparece ou em que posição.
 */
export async function generateShiftMatchSuggestions(
  port: AIProviderPort,
  shift: { departmentName: string; roleRequired: string | null; startsAt: string; endsAt: string },
  rankedCandidates: readonly ShiftMatchCandidate[],
): Promise<ShiftMatchSuggestion[]> {
  if (rankedCandidates.length === 0) return [];

  let rationales = new Map<string, string>();
  try {
    const messages = buildShiftMatchingMessages(shift, rankedCandidates);
    const response = await port.invoke({
      capability: "structured-output",
      responseFormat: "json",
      messages,
    });
    if (response.ok && response.content) {
      rationales = parseShiftMatchingResponse(response.content, rankedCandidates);
    }
  } catch {
    // IA indisponível — segue com a lista determinística, sem justificativa em texto.
  }

  return rankedCandidates.map((c) => ({
    ...c,
    rationale: rationales.get(c.professionalId) ?? null,
  }));
}
