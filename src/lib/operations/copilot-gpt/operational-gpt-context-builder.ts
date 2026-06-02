import type {
  OperationalContextPayload,
  OperationalSemanticSnapshot,
} from "@/lib/operations/copilot-context/types";
import {
  operationalForecastExplanationLines,
  operationalRecommendationAnchors,
  operationalRiskExplanationLines,
  operationalScoreAnchors,
} from "@/lib/operations/copilot-gpt/operational-explanation-helpers";

/**
 * Monta o bloco JSON enviado ao modelo — compacto, com ancoragem explícita
 * para scores / alertas / forecast / recomendações (explainability).
 */
export function buildOperationalGptContextJson(input: {
  payload: OperationalContextPayload;
  semantic: OperationalSemanticSnapshot;
}): Record<string, unknown> {
  const { payload, semantic } = input;
  return {
    kind: "medflow_operational_context_v1",
    fingerprint: payload.fingerprint,
    scope: payload.scope,
    asOf: payload.asOf,
    semanticSnapshot: {
      healthState: semantic.healthState,
      consolidatedRiskScore: semantic.consolidatedRiskScore,
      operationalHealthScore: semantic.operationalHealthScore,
      narrativeHeadline: semantic.narrativeHeadline,
      semanticTags: semantic.semanticTags.slice(0, 24),
      priorityRecommendationIds: semantic.priorityRecommendationIds,
    },
    coordinatorSummary: payload.coordinatorSummary,
    executiveSummary: payload.executiveSummary,
    sectionDigests: payload.sectionDigests.map((s) => ({
      key: s.key,
      title: s.title,
      bullets: s.bullets,
    })),
    deterministicAnchors: {
      scores: operationalScoreAnchors(payload),
      risks: operationalRiskExplanationLines(payload),
      forecast: operationalForecastExplanationLines(payload),
      recommendations: operationalRecommendationAnchors(payload),
    },
    provenanceIndex: payload.references.map((r, i) => ({ i: i + 1, ref: r })),
  };
}

export function buildOperationalGptUserMessage(input: {
  payload: OperationalContextPayload;
  semantic: OperationalSemanticSnapshot;
  mode: "chat" | "executive_narrative";
  question?: string;
}): string {
  const ctx = buildOperationalGptContextJson({
    payload: input.payload,
    semantic: input.semantic,
  });
  const ctxJson = JSON.stringify(ctx);

  if (input.mode === "executive_narrative") {
    return [
      "Tarefa: produzir uma narrativa operacional executiva em pt-BR para o coordenador.",
      "Use apenas o JSON abaixo. Cite sinais como score:id, alert:id, forecast, recommendation:id quando fizer afirmações factuais.",
      "Não prescreva ações automáticas; oriente e priorize visão humana.",
      "",
      ctxJson,
    ].join("\n");
  }

  return [
    "Pergunta do coordenador:",
    input.question ?? "",
    "",
    "Contexto operacional consolidado (JSON). Responda em pt-BR, com tom profissional e conservador.",
    "Você dispõe de ferramentas read-only no servidor para expandir contexto (timeline, plantão, swap, KPIs, forecast, recomendações, alertas).",
    "Use-as quando precisar de dados frescos, drill-down por ID ou paginação; cite proveniência (timeline_event, alert, recommendation, score) ao afirmar fatos.",
    "Ao explicar fatos apenas do JSON inline, cite as chaves de proveniência do bloco deterministicAnchors / provenanceIndex.",
    "Se algo não estiver no JSON nem puder ser obtido via tools, declare a lacuna.",
    "",
    ctxJson,
  ].join("\n");
}
