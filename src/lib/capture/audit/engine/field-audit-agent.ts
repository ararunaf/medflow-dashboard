/**
 * Field Audit Agent — F2-S4.
 *
 * Substitui a aprovação binária vazia: para cada campo com achado, cruza
 * regra estrutural (AuditFinding) + regra aprendida do contrato quando
 * aplicável (EnrichedAuditFinding) + histórico de risco de glosa
 * (FindingRiskScore) num parecer único, citável, com confiança.
 *
 * O agente NUNCA decide sozinho e NUNCA cria achado novo — só sintetiza o
 * que os motores determinísticos já calcularam. Guardrails:
 *   1. Só gera parecer para campos que JÁ têm >=1 achado real (nada de
 *      "opinar" sobre um campo sem nenhum sinal).
 *   2. O verdict (ok/atencao/critico) é DERIVADO da severidade já
 *      calculada, nunca escolhido pelo modelo.
 *   3. Uma resposta cujo `field` não bate com nenhum bundle fornecido é
 *      descartada (o modelo não pode inventar um campo que não existe).
 *   4. A explicação precisa citar pelo menos um dos ruleIds reais — senão
 *      é descartada por não estar ancorada no achado de verdade.
 */
import type { AIProviderPort } from "../../../enterprise/ai-provider/ports/ai-provider-port";
import type { EnrichedAuditFinding } from "../../contract/types/enriched-finding";
import type { FindingRiskScore } from "../../risk/types/risk-assessment";
import type { AuditFinding } from "../types/audit-finding";
import type { AuditRuleCategory } from "../types/audit-rule";
import { type FieldAuditOpinion, type FieldAuditVerdict } from "../types/field-audit-opinion";

export type FieldSignalBundle = {
  field: string;
  category: AuditRuleCategory;
  structuralFindings: AuditFinding[];
  enrichments: EnrichedAuditFinding[];
  riskScores: FindingRiskScore[];
};

/** Agrupa achados de três fontes independentes pelo mesmo campo — a unidade que o agente sintetiza. */
export function groupFindingsByField(
  structuralFindings: readonly AuditFinding[],
  enrichedFindings: readonly EnrichedAuditFinding[],
  riskScores: readonly FindingRiskScore[],
): FieldSignalBundle[] {
  const byField = new Map<string, FieldSignalBundle>();

  for (const f of structuralFindings) {
    const bundle = byField.get(f.field) ?? {
      field: f.field,
      category: f.category,
      structuralFindings: [],
      enrichments: [],
      riskScores: [],
    };
    bundle.structuralFindings.push(f);
    byField.set(f.field, bundle);
  }
  for (const e of enrichedFindings) {
    const bundle = byField.get(e.finding.field);
    if (bundle) bundle.enrichments.push(e);
  }
  for (const r of riskScores) {
    const bundle = byField.get(r.field);
    if (bundle) bundle.riskScores.push(r);
  }

  return Array.from(byField.values());
}

function deriveVerdict(bundle: FieldSignalBundle): FieldAuditVerdict {
  const critical = bundle.structuralFindings.some((f) => f.blocking || f.severity === "critico");
  return critical ? "critico" : "atencao";
}

export function buildFieldAuditMessages(
  bundles: readonly FieldSignalBundle[],
): Array<{ role: "system" | "user"; content: string }> {
  const context = bundles
    .map((b, i) => {
      const structural = b.structuralFindings
        .map(
          (f) =>
            `  - regra ${f.ruleId} (${f.severity}${f.blocking ? ", bloqueante" : ""}): ${f.message} [confiança da regra: ${f.confidence}%]`,
        )
        .join("\n");
      const contract = b.enrichments
        .filter((e) => e.enrichment)
        .map(
          (e) =>
            `  - base contratual: ${e.enrichment!.contractualBasis} — risco de glosa estimado pelo contrato: ${e.enrichment!.estimatedDenialRisk}%`,
        )
        .join("\n");
      const risk = b.riskScores
        .map(
          (r) =>
            `  - histórico de glosa: probabilidade estimada ${Math.round(r.denialProbability * 100)}%, prioridade de correção ${r.priority}`,
        )
        .join("\n");
      return [`[campo ${i + 1}: "${b.field}" — categoria ${b.category}]`, structural, contract, risk]
        .filter((s) => s.length > 0)
        .join("\n");
    })
    .join("\n\n");

  return [
    {
      role: "system",
      content:
        "Você sintetiza pareceres de auditoria de guia TISS a partir de achados JÁ CALCULADOS por motores " +
        "determinísticos (regra estrutural, regra de contrato, histórico de risco de glosa) de uma cooperativa " +
        "médica brasileira. Você NUNCA cria um achado novo, nunca decide se a guia é aprovada — só explica e " +
        "prioriza os achados fornecidos. Responda APENAS com um array JSON de objetos " +
        '{ "field": string, "explanation": string, "confidence": number }. O campo "field" deve ser IDÊNTICO ' +
        "a um dos campos listados abaixo. A explicação precisa citar explicitamente o(s) ruleId(s) envolvido(s) " +
        "e, quando houver, a base contratual e o risco de glosa — nunca invente número, cláusula ou regra que " +
        "não estejam no texto fornecido.",
    },
    {
      role: "user",
      content: `Campos com achados a explicar:\n\n${context}\n\nEscreva um parecer para cada campo listado, no formato JSON pedido.`,
    },
  ];
}

type RawFieldOpinion = {
  field?: unknown;
  explanation?: unknown;
  confidence?: unknown;
};

export function parseFieldAuditResponse(
  raw: string,
  bundles: readonly FieldSignalBundle[],
): FieldAuditOpinion[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const byField = new Map(bundles.map((b) => [b.field, b]));
  const opinions: FieldAuditOpinion[] = [];

  for (const item of parsed as RawFieldOpinion[]) {
    if (
      typeof item?.field !== "string" ||
      typeof item?.explanation !== "string" ||
      item.explanation.trim().length === 0 ||
      typeof item?.confidence !== "number" ||
      Number.isNaN(item.confidence) ||
      item.confidence < 0 ||
      item.confidence > 100
    ) {
      continue;
    }

    const bundle = byField.get(item.field);
    if (!bundle) continue; // campo inventado, não fornecido — descarta

    const explanation: string = item.explanation.trim();
    const confidence: number = item.confidence;
    const ruleIds = bundle.structuralFindings.map((f) => f.ruleId);
    const citesRealRule = ruleIds.some((id) => explanation.includes(id));
    if (!citesRealRule) continue; // explicação não ancorada em nenhum achado real — descarta

    const firstEnrichment = bundle.enrichments.find((e) => e.enrichment);
    const firstRisk = bundle.riskScores[0];

    opinions.push({
      field: bundle.field,
      category: bundle.category,
      verdict: deriveVerdict(bundle),
      confidence,
      explanation,
      sourceRuleIds: ruleIds,
      contractCitation: firstEnrichment?.enrichment?.contractualBasis ?? null,
      denialProbability: firstRisk?.denialProbability ?? null,
    });
  }

  return opinions;
}

export async function generateFieldAuditOpinions(
  port: AIProviderPort,
  bundles: readonly FieldSignalBundle[],
): Promise<FieldAuditOpinion[]> {
  if (bundles.length === 0) return [];
  const messages = buildFieldAuditMessages(bundles);
  const response = await port.invoke({
    capability: "structured-output",
    responseFormat: "json",
    messages,
  });
  if (!response.ok || !response.content) return [];
  return parseFieldAuditResponse(response.content, bundles);
}
