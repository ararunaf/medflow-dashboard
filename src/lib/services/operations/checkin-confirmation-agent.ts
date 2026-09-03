/**
 * Check-in Confirmation Agent — F4-S4.
 *
 * Mesmo contrato do Field Audit Agent (F2-S4) e do Shift Matching Agent
 * (F4-S3): o verdict (ok/atenção/crítico) é sempre DERIVADO de sinais
 * determinísticos calculados a partir de check_in_at/check_out_at reais
 * (atraso, saída antecipada, falta, check-out ausente) — nunca escolhido
 * pela IA. A IA só recebe os itens JÁ sinalizados (não "ok") e escreve uma
 * frase de justificativa por item, citando o nome real do profissional e,
 * quando houver, o número real de minutos — resposta cujo `assignmentId`
 * não bate com nenhum item fornecido, ou cuja explicação não cite nenhum
 * fato real do item, é descartada (o item continua na lista, só sem
 * justificativa em texto).
 */
import type { AIProviderPort } from "../../enterprise/ai-provider/ports/ai-provider-port";

export const LATE_THRESHOLD_MINUTES = 15;
export const EARLY_DEPARTURE_THRESHOLD_MINUTES = 15;

export type AttendanceSignals = {
  lateMinutes: number;
  earlyDepartureMinutes: number;
  noShow: boolean;
  missingCheckout: boolean;
};

export type AttendanceVerdict = "ok" | "atencao" | "critico";

export type AttendanceReviewInput = {
  assignmentId: string;
  professionalId: string;
  professionalName: string;
  shiftId: string;
  departmentName: string;
  startsAt: string;
  endsAt: string;
  checkedInAt: string | null;
  checkedOutAt: string | null;
};

export type AttendanceReviewItem = AttendanceReviewInput & {
  signals: AttendanceSignals;
  verdict: AttendanceVerdict;
};

export type AttendanceReviewSuggestion = AttendanceReviewItem & {
  rationale: string | null;
};

export function computeAttendanceSignals(
  input: Pick<AttendanceReviewInput, "startsAt" | "endsAt" | "checkedInAt" | "checkedOutAt">,
  now: Date,
): AttendanceSignals {
  const shiftEnded = new Date(input.endsAt).getTime() <= now.getTime();
  const noShow = shiftEnded && input.checkedInAt === null;
  const missingCheckout = shiftEnded && input.checkedInAt !== null && input.checkedOutAt === null;

  let lateMinutes = 0;
  if (input.checkedInAt) {
    const diffMs = new Date(input.checkedInAt).getTime() - new Date(input.startsAt).getTime();
    lateMinutes = Math.max(0, Math.round(diffMs / 60_000));
  }

  let earlyDepartureMinutes = 0;
  if (input.checkedOutAt) {
    const diffMs = new Date(input.endsAt).getTime() - new Date(input.checkedOutAt).getTime();
    earlyDepartureMinutes = Math.max(0, Math.round(diffMs / 60_000));
  }

  return { lateMinutes, earlyDepartureMinutes, noShow, missingCheckout };
}

export function deriveAttendanceVerdict(signals: AttendanceSignals): AttendanceVerdict {
  if (signals.noShow || signals.missingCheckout) return "critico";
  if (
    signals.lateMinutes > LATE_THRESHOLD_MINUTES ||
    signals.earlyDepartureMinutes > EARLY_DEPARTURE_THRESHOLD_MINUTES
  ) {
    return "atencao";
  }
  return "ok";
}

export function buildAttendanceReview(
  inputs: readonly AttendanceReviewInput[],
  now: Date,
): AttendanceReviewItem[] {
  return inputs.map((input) => {
    const signals = computeAttendanceSignals(input, now);
    return { ...input, signals, verdict: deriveAttendanceVerdict(signals) };
  });
}

function describeSignals(signals: AttendanceSignals): string {
  const parts: string[] = [];
  if (signals.noShow) parts.push("não fez check-in em nenhum momento do plantão (falta)");
  if (signals.missingCheckout) parts.push("fez check-in mas nunca fez check-out");
  if (signals.lateMinutes > 0) parts.push(`chegou ${signals.lateMinutes} minutos atrasado`);
  if (signals.earlyDepartureMinutes > 0) parts.push(`saiu ${signals.earlyDepartureMinutes} minutos antes do fim`);
  return parts.length > 0 ? parts.join("; ") : "dentro do esperado";
}

export function buildAttendanceReviewMessages(
  items: readonly AttendanceReviewItem[],
): Array<{ role: "system" | "user"; content: string }> {
  const context = items
    .map(
      (item, i) =>
        `[item ${i + 1}: assignmentId="${item.assignmentId}", profissional="${item.professionalName}"]\n` +
        `  - plantão em "${item.departmentName}", ${item.startsAt} até ${item.endsAt}\n` +
        `  - verdict já calculado: ${item.verdict}\n` +
        `  - sinais reais: ${describeSignals(item.signals)}`,
    )
    .join("\n\n");

  return [
    {
      role: "system",
      content:
        "Você escreve uma justificativa curta (1 frase) para cada item de uma lista de presenças de plantão " +
        "JÁ SINALIZADA por regras determinísticas (atraso, saída antecipada, falta, check-out ausente) de uma " +
        "cooperativa médica brasileira. Você NUNCA decide o verdict nem inventa um sinal que não esteja " +
        "listado — só explica, em português, citando o nome do profissional e o número real de minutos quando " +
        'houver. Responda APENAS com um array JSON de objetos { "assignmentId": string, "rationale": string }. ' +
        'O "assignmentId" deve ser IDÊNTICO a um dos itens listados — nunca invente um item que não esteja na lista.',
    },
    {
      role: "user",
      content: `Itens sinalizados para revisão:\n\n${context}\n\nEscreva uma justificativa para cada item, no formato JSON pedido.`,
    },
  ];
}

type RawAttendanceReviewItem = {
  assignmentId?: unknown;
  rationale?: unknown;
};

export function parseAttendanceReviewResponse(
  raw: string,
  items: readonly AttendanceReviewItem[],
): Map<string, string> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return new Map();
  }
  if (!Array.isArray(parsed)) return new Map();

  const byId = new Map(items.map((i) => [i.assignmentId, i]));
  const rationales = new Map<string, string>();

  for (const raw of parsed as RawAttendanceReviewItem[]) {
    if (
      typeof raw?.assignmentId !== "string" ||
      typeof raw?.rationale !== "string" ||
      raw.rationale.trim().length === 0
    ) {
      continue;
    }
    const item = byId.get(raw.assignmentId);
    if (!item) continue; // item inventado, não fornecido — descarta

    const rationale = raw.rationale.trim();
    const citesName = item.professionalName.length > 0 && rationale.includes(item.professionalName);
    const citesLate = item.signals.lateMinutes > 0 && rationale.includes(String(item.signals.lateMinutes));
    const citesEarly =
      item.signals.earlyDepartureMinutes > 0 &&
      rationale.includes(String(item.signals.earlyDepartureMinutes));
    if (!citesName && !citesLate && !citesEarly) continue; // não ancorada em nenhum fato real — descarta

    rationales.set(raw.assignmentId, rationale);
  }

  return rationales;
}

/**
 * Só chama a IA para os itens JÁ sinalizados (verdict != 'ok') — igual ao
 * Field Audit Agent, que só opina sobre campo com achado real. Se a IA
 * falhar, a lista determinística (verdict + sinais) continua de pé, só sem
 * o texto de justificativa.
 */
export async function generateAttendanceReviewSuggestions(
  port: AIProviderPort,
  items: readonly AttendanceReviewItem[],
): Promise<AttendanceReviewSuggestion[]> {
  const flagged = items.filter((i) => i.verdict !== "ok");

  let rationales = new Map<string, string>();
  if (flagged.length > 0) {
    try {
      const messages = buildAttendanceReviewMessages(flagged);
      const response = await port.invoke({
        capability: "structured-output",
        responseFormat: "json",
        messages,
      });
      if (response.ok && response.content) {
        rationales = parseAttendanceReviewResponse(response.content, flagged);
      }
    } catch {
      // IA indisponível — segue com a lista determinística, sem justificativa em texto.
    }
  }

  return items.map((item) => ({ ...item, rationale: rationales.get(item.assignmentId) ?? null }));
}
