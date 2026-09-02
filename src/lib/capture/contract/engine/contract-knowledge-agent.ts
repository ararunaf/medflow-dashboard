/**
 * Contract Knowledge Agent — F2-S2.
 *
 * Extrai propostas de regra contratual a partir dos chunks indexados pelo
 * F2-S1 (knowledge_embeddings, domain='contract'). Passa sempre pelo
 * AIProviderPort (ARCH-02) — nunca chama o vendor diretamente.
 *
 * Guardrail central: toda proposta precisa citar um trecho LITERAL de um
 * chunk realmente fornecido ao modelo (citationExcerpt). Uma proposta cuja
 * citação não seja encontrada verbatim em nenhum chunk é descartada aqui —
 * não fica a critério do prompt sozinho evitar alucinação.
 */
import type { AIProviderPort } from "../../../enterprise/ai-provider/ports/ai-provider-port";
import {
  CONTRACT_RULE_CATEGORIES,
  type ContractRuleCategory,
  type ContractRuleProposal,
} from "../types/contract-rule-proposal";

export type ContractKnowledgeChunk = {
  id: string;
  heading: string | null;
  content: string;
};

const CATEGORY_LABELS: Record<ContractRuleCategory, string> = {
  cobertura: "Cobertura — quais procedimentos, exames ou internações o contrato cobre ou exclui",
  preco: "Preço e tabela de valores — reajuste, tabela de referência, forma de pagamento",
  pre_autorizacao: "Pré-autorização — quais procedimentos exigem autorização prévia e como solicitar",
  prazo: "Prazos — carência, prazo de faturamento, prazo de recurso de glosa",
  campo_obrigatorio: "Campos obrigatórios — dados que a guia TISS precisa conter para este contrato",
};

/** Query em linguagem natural para a busca vetorial (RAG) de cada categoria — usado por quem chama esta engine para recuperar os chunks certos antes de invocar a extração. */
export const CONTRACT_CATEGORY_RETRIEVAL_QUERIES: Record<ContractRuleCategory, string> = {
  cobertura: "cobertura de procedimentos, exames, consultas e internações; exclusões de cobertura",
  preco: "tabela de preços, valores de procedimentos, reajuste anual, forma de pagamento",
  pre_autorizacao: "procedimentos que exigem autorização prévia, senha de autorização, prazo de solicitação",
  prazo: "prazo de carência, prazo de faturamento, prazo para recurso de glosa",
  campo_obrigatorio: "campos obrigatórios na guia TISS, dados exigidos do beneficiário ou do prestador",
};

export function buildContractExtractionMessages(
  category: ContractRuleCategory,
  chunks: readonly ContractKnowledgeChunk[],
): Array<{ role: "system" | "user"; content: string }> {
  const context = chunks
    .map((c, i) => `[trecho ${i + 1}]${c.heading ? ` (${c.heading})` : ""}\n${c.content}`)
    .join("\n\n");

  return [
    {
      role: "system",
      content:
        "Você extrai regras de contrato de operadora de saúde para auditoria de faturamento TISS de uma " +
        "cooperativa médica brasileira. Responda APENAS com um array JSON de objetos no formato " +
        '{ "description": string, "justification": string, "citationHeading": string|null, "citationExcerpt": string, "confidence": number }. ' +
        "citationExcerpt DEVE ser uma cópia literal (verbatim, sem alterar uma palavra) de um trecho do texto " +
        "fornecido abaixo — nunca parafraseado. Nunca proponha uma regra que não esteja explicitamente no texto " +
        "fornecido. Se não houver nenhuma regra da categoria pedida nos trechos, responda com um array vazio: [].",
    },
    {
      role: "user",
      content:
        `Categoria: ${CATEGORY_LABELS[category]}\n\n` +
        `Trechos do contrato (cite ipsis litteris no campo citationExcerpt):\n\n${context}\n\n` +
        "Extraia as regras desta categoria presentes nos trechos acima, no formato JSON pedido.",
    },
  ];
}

type RawProposal = {
  description?: unknown;
  justification?: unknown;
  citationHeading?: unknown;
  citationExcerpt?: unknown;
  confidence?: unknown;
};

export function parseContractExtractionResponse(
  raw: string,
  category: ContractRuleCategory,
  chunks: readonly ContractKnowledgeChunk[],
  extractionModel: string,
): ContractRuleProposal[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const proposals: ContractRuleProposal[] = [];
  for (const item of parsed as RawProposal[]) {
    if (
      typeof item?.description !== "string" ||
      item.description.trim().length === 0 ||
      typeof item?.justification !== "string" ||
      item.justification.trim().length === 0 ||
      typeof item?.citationExcerpt !== "string" ||
      item.citationExcerpt.trim().length === 0 ||
      typeof item?.confidence !== "number" ||
      Number.isNaN(item.confidence) ||
      item.confidence < 0 ||
      item.confidence > 100
    ) {
      continue;
    }

    const citation = item.citationExcerpt.trim();
    const sourceChunk = chunks.find((c) => c.content.includes(citation));
    if (!sourceChunk) {
      // Anti-alucinação: descarta qualquer regra cuja citação não seja uma
      // cópia literal de um trecho realmente fornecido ao modelo.
      continue;
    }

    proposals.push({
      category,
      description: item.description.trim(),
      justification: item.justification.trim(),
      citationHeading:
        typeof item.citationHeading === "string" && item.citationHeading.trim().length > 0
          ? item.citationHeading.trim()
          : sourceChunk.heading,
      citationExcerpt: citation,
      sourceChunkIds: [sourceChunk.id],
      confidence: item.confidence,
      extractionModel,
    });
  }
  return proposals;
}

export async function extractContractRulesForCategory(
  port: AIProviderPort,
  category: ContractRuleCategory,
  chunks: readonly ContractKnowledgeChunk[],
): Promise<ContractRuleProposal[]> {
  if (chunks.length === 0) return [];
  const messages = buildContractExtractionMessages(category, chunks);
  const response = await port.invoke({
    capability: "structured-output",
    responseFormat: "json",
    messages,
  });
  if (!response.ok || !response.content) return [];
  return parseContractExtractionResponse(response.content, category, chunks, response.model ?? "unknown");
}

/**
 * Roda a extração para todas as categorias conhecidas, dado um mapa
 * categoria → chunks já recuperados (RAG) para aquela categoria.
 */
export async function extractAllContractRuleCategories(
  port: AIProviderPort,
  chunksByCategory: Readonly<Record<ContractRuleCategory, readonly ContractKnowledgeChunk[]>>,
): Promise<ContractRuleProposal[]> {
  const results: ContractRuleProposal[] = [];
  for (const category of CONTRACT_RULE_CATEGORIES) {
    const proposals = await extractContractRulesForCategory(port, category, chunksByCategory[category] ?? []);
    results.push(...proposals);
  }
  return results;
}
