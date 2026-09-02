/**
 * Geração de embeddings em lote — F2-S1 (Ingestão de contrato e pipeline RAG).
 *
 * Passa sempre pelo AIProviderPort (ARCH-02) — nunca chama o vendor
 * diretamente. Agrupa textos em lotes para não estourar o limite de input
 * por requisição da API de embeddings.
 */
import type { AIProviderPort } from "../enterprise/ai-provider/ports/ai-provider-port";

export type EmbedTextsResult = {
  vectors: number[][];
  model: string;
};

const DEFAULT_BATCH_SIZE = 64;

export async function embedTexts(
  port: AIProviderPort,
  texts: readonly string[],
  options: { batchSize?: number } = {},
): Promise<EmbedTextsResult> {
  if (texts.length === 0) return { vectors: [], model: "" };
  const batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;
  const vectors: number[][] = [];
  let model = "";

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const response = await port.invoke({
      capability: "embeddings",
      input: { input: batch },
    });
    if (!response.ok) {
      throw new Error(`Falha ao gerar embeddings: ${response.message ?? "erro desconhecido"}`);
    }
    const data = response.data as { vectors?: number[][] } | undefined;
    if (!Array.isArray(data?.vectors) || data.vectors.length !== batch.length) {
      throw new Error(
        `Resposta de embeddings inconsistente: esperado ${batch.length} vetor(es), recebido ${data?.vectors?.length ?? 0}.`,
      );
    }
    vectors.push(...data.vectors);
    model = response.model ?? model;
  }

  return { vectors, model };
}

export async function embedQuery(port: AIProviderPort, text: string): Promise<number[]> {
  const response = await port.invoke({
    capability: "embeddings",
    input: { input: text },
  });
  if (!response.ok) {
    throw new Error(`Falha ao gerar embedding da consulta: ${response.message ?? "erro desconhecido"}`);
  }
  const data = response.data as { vector?: number[] } | undefined;
  if (!Array.isArray(data?.vector)) {
    throw new Error("Resposta de embedding da consulta sem vetor.");
  }
  return data.vector;
}
