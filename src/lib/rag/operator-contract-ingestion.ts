/**
 * Ingestão de contrato de operadora (F2-S1) e extração de regras (F2-S2).
 *
 * Núcleo compartilhado entre os CLIs (`scripts/rag/cli/*`) e a tela de
 * Contratos. Recebe um cliente Supabase com service role: as escritas em
 * `operator_contracts` (update), `knowledge_embeddings` e
 * `contract_rule_proposals` são, por desenho das policies, só do servidor.
 * Quem chama é responsável por autorizar o usuário e fixar o tenant.
 */
import { createHash, randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { AIProviderPort } from "@/lib/enterprise/ai-provider/ports/ai-provider-port";
import {
  CONTRACT_CATEGORY_RETRIEVAL_QUERIES,
  extractContractRulesForCategory,
  type ContractKnowledgeChunk,
} from "@/lib/capture/contract/engine/contract-knowledge-agent";
import type { ContractRuleCategory } from "@/lib/capture/contract/types/contract-rule-proposal";
import { chunkContractText } from "./chunk-contract-text";
import { embedQuery, embedTexts } from "./embed-texts";
import { extractPdfText } from "./extract-pdf-text";

export const CONTRACT_STORAGE_BUCKET = "clinical-documents";
const KNOWLEDGE_INSERT_BATCH_SIZE = 100;

type AdminClient = SupabaseClient<Database>;

export function operatorContractStoragePath(tenantId: string, contractId: string): string {
  return `${tenantId}/contracts/${contractId}/original.pdf`;
}

export type IndexOperatorContractInput = {
  tenantId: string;
  contractId: string;
  pdfBytes: Uint8Array;
  operatorCode: string;
  operatorName?: string | null;
  contractLabel: string;
  createdBy: string;
  /** PDF já está no storage no caminho padrão (upload direto pelo navegador). */
  alreadyStored?: boolean;
  onProgress?: (message: string) => void;
};

export type IndexOperatorContractResult = {
  contractId: string;
  chunkCount: number;
  pageCount: number;
  embeddingModel: string;
};

/** Contrato com o mesmo conteúdo já indexado no tenant, se houver. */
export async function findIndexedContractByChecksum(
  client: AdminClient,
  tenantId: string,
  checksumSha256: string,
): Promise<{ id: string; chunk_count: number } | null> {
  const { data, error } = await client
    .from("operator_contracts")
    .select("id, chunk_count")
    .eq("tenant_id", tenantId)
    .eq("checksum_sha256", checksumSha256)
    .eq("status", "indexed")
    .maybeSingle();
  if (error) throw new Error(`Falha ao consultar operator_contracts: ${error.message}`);
  return data;
}

export async function indexOperatorContract(
  client: AdminClient,
  aiProvider: AIProviderPort,
  input: IndexOperatorContractInput,
): Promise<IndexOperatorContractResult> {
  const log = input.onProgress ?? (() => undefined);
  const checksum = createHash("sha256").update(input.pdfBytes).digest("hex");

  const { text, pageCount } = await extractPdfText(input.pdfBytes);
  if (text.trim().length === 0) {
    throw new Error(
      "PDF sem texto extraível — provavelmente é um scan de imagem. Envie o PDF original (com texto selecionável).",
    );
  }
  const chunks = chunkContractText(text);
  if (chunks.length === 0) throw new Error("Nenhum trecho gerado a partir do texto do PDF.");
  log(
    `${pageCount} página(s), ${chunks.length} trecho(s) (${chunks[0]!.heading ? "por cláusula" : "por parágrafo"}).`,
  );

  const storagePath = operatorContractStoragePath(input.tenantId, input.contractId);
  if (!input.alreadyStored) {
    const upload = await client.storage
      .from(CONTRACT_STORAGE_BUCKET)
      .upload(storagePath, input.pdfBytes, { contentType: "application/pdf", upsert: true });
    if (upload.error) throw new Error(`Falha ao subir PDF para storage: ${upload.error.message}`);
  }

  const upsertContract = await client.from("operator_contracts").upsert(
    {
      id: input.contractId,
      tenant_id: input.tenantId,
      operator_code: input.operatorCode,
      operator_name: input.operatorName ?? null,
      contract_label: input.contractLabel,
      byte_length: input.pdfBytes.byteLength,
      checksum_sha256: checksum,
      storage_bucket: CONTRACT_STORAGE_BUCKET,
      storage_path: storagePath,
      page_count: pageCount,
      status: "indexing",
      created_by: input.createdBy,
    },
    { onConflict: "id" },
  );
  if (upsertContract.error) {
    throw new Error(`Falha ao gravar operator_contracts: ${upsertContract.error.message}`);
  }

  try {
    log(`Gerando embeddings para ${chunks.length} trecho(s)...`);
    const { vectors, model } = await embedTexts(
      aiProvider,
      chunks.map((c) => c.content),
    );

    const del = await client
      .from("knowledge_embeddings")
      .delete()
      .eq("document_id", input.contractId);
    if (del.error) throw new Error(`Falha ao limpar trechos antigos: ${del.error.message}`);

    const rows = chunks.map((chunk, i) => ({
      id: randomUUID(),
      tenant_id: input.tenantId,
      document_id: input.contractId,
      domain: "contract",
      classification: input.operatorCode,
      agent_affinity: ["contract-knowledge"],
      source_path: storagePath,
      chunk_index: chunk.index,
      content: chunk.content,
      content_hash: createHash("sha256").update(chunk.content).digest("hex"),
      // pgvector aceita o literal "[x,y,...]".
      embedding: JSON.stringify(vectors[i]),
      embedding_model: model,
      metadata: {
        operatorCode: input.operatorCode,
        operatorName: input.operatorName ?? null,
        contractLabel: input.contractLabel,
        heading: chunk.heading,
      },
      version: "contract_ingestion_v1",
      indexed_at: new Date().toISOString(),
    }));

    for (let i = 0; i < rows.length; i += KNOWLEDGE_INSERT_BATCH_SIZE) {
      const insert = await client
        .from("knowledge_embeddings")
        .insert(rows.slice(i, i + KNOWLEDGE_INSERT_BATCH_SIZE));
      if (insert.error) {
        throw new Error(`Falha ao gravar knowledge_embeddings: ${insert.error.message}`);
      }
    }

    const finish = await client
      .from("operator_contracts")
      .update({
        status: "indexed",
        chunk_count: rows.length,
        embedding_model: model,
        indexed_at: new Date().toISOString(),
        error_message: null,
      })
      .eq("id", input.contractId);
    if (finish.error)
      throw new Error(`Falha ao finalizar operator_contracts: ${finish.error.message}`);

    return {
      contractId: input.contractId,
      chunkCount: rows.length,
      pageCount,
      embeddingModel: model,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await client
      .from("operator_contracts")
      .update({ status: "failed", error_message: message })
      .eq("id", input.contractId);
    throw err;
  }
}

/**
 * Agente de Conhecimento de Contrato para UMA categoria: busca RAG restrita
 * ao contrato, extração com citação conferida e gravação das propostas
 * (pendentes de revisão humana). Uma categoria por chamada mantém cada
 * requisição curta o bastante para uma função serverless.
 */
export async function extractContractRulesForContractCategory(
  client: AdminClient,
  aiProvider: AIProviderPort,
  input: { contractId: string; tenantId?: string; category: ContractRuleCategory; topK?: number },
): Promise<{ chunkCount: number; proposalCount: number }> {
  let query = client
    .from("operator_contracts")
    .select("id, tenant_id, status")
    .eq("id", input.contractId);
  if (input.tenantId) query = query.eq("tenant_id", input.tenantId);
  const { data: contract, error: contractErr } = await query.maybeSingle();
  if (contractErr) throw new Error(`Falha ao consultar operator_contracts: ${contractErr.message}`);
  if (!contract) throw new Error(`Contrato não encontrado: ${input.contractId}`);
  if (contract.status !== "indexed") {
    throw new Error(`O contrato está com status '${contract.status}' — precisa estar indexado.`);
  }

  const queryEmbedding = await embedQuery(
    aiProvider,
    CONTRACT_CATEGORY_RETRIEVAL_QUERIES[input.category],
  );
  const { data, error } = await client.rpc("match_knowledge_embeddings", {
    query_embedding: JSON.stringify(queryEmbedding),
    match_count: input.topK ?? 6,
    filter_domain: "contract",
    filter_classification: null,
    similarity_threshold: 0,
    filter_document_id: contract.id,
  });
  if (error) throw new Error(`Falha na busca RAG (${input.category}): ${error.message}`);

  const chunks: ContractKnowledgeChunk[] = (data ?? []).map((row) => {
    const metadata = (row.metadata ?? {}) as { heading?: string | null };
    return { id: row.id, heading: metadata.heading ?? null, content: row.content };
  });

  const proposals = await extractContractRulesForCategory(aiProvider, input.category, chunks);
  if (proposals.length > 0) {
    const insert = await client.from("contract_rule_proposals").insert(
      proposals.map((p) => ({
        id: randomUUID(),
        tenant_id: contract.tenant_id,
        operator_contract_id: contract.id,
        category: p.category,
        description: p.description,
        justification: p.justification,
        citation_heading: p.citationHeading,
        citation_excerpt: p.citationExcerpt,
        source_chunk_ids: p.sourceChunkIds,
        confidence: p.confidence,
        extraction_model: p.extractionModel,
      })),
    );
    if (insert.error) {
      throw new Error(
        `Falha ao gravar contract_rule_proposals (${input.category}): ${insert.error.message}`,
      );
    }
  }
  return { chunkCount: chunks.length, proposalCount: proposals.length };
}
