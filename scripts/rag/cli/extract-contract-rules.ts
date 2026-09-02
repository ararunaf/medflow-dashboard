#!/usr/bin/env -S npx tsx
/**
 * Contract Knowledge Agent — extração estruturada (F2-S2).
 *
 * Para um contrato já indexado pelo F2-S1 (operator_contracts.status =
 * 'indexed'), roda uma busca RAG por categoria (cobertura, preço,
 * pré-autorização, prazo, campo obrigatório), pede ao modelo para extrair
 * regras citando trecho literal do contrato, e grava as propostas
 * validadas (citação conferida contra o texto real) em
 * contract_rule_proposals — pendentes do portão de revisão humana (F2-S3).
 *
 * Uso:
 *   npx tsx scripts/rag/cli/extract-contract-rules.ts --contract-id <uuid> [--top-k 6]
 */
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import {
  CONTRACT_CATEGORY_RETRIEVAL_QUERIES,
  CONTRACT_RULE_CATEGORIES,
  extractContractRulesForCategory,
  type ContractKnowledgeChunk,
} from "../../../src/lib/capture/contract/engine/contract-knowledge-agent.ts";
import { createAIProviderFactory } from "../../../src/lib/enterprise/ai-provider/factory/ai-provider-factory.ts";
import { embedQuery } from "../../../src/lib/rag/embed-texts.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..", "..", "..");

type Args = { contractId?: string; topK: number };

function parseArgs(argv: readonly string[]): Args {
  const out: Args = { topK: 6 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--contract-id") out.contractId = argv[++i];
    else if (argv[i] === "--top-k") out.topK = Number(argv[++i]);
  }
  return out;
}

function loadEnv(): Record<string, string> {
  const path = join(root, ".env.local");
  if (!existsSync(path)) return {};
  const out: Record<string, string> = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.trim().match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

async function main() {
  for (const [k, v] of Object.entries(loadEnv())) {
    if (!process.env[k]) process.env[k] = v;
  }

  const args = parseArgs(process.argv.slice(2));
  if (!args.contractId) {
    console.error(
      "Uso: npx tsx scripts/rag/cli/extract-contract-rules.ts --contract-id <uuid> [--top-k 6]",
    );
    process.exit(1);
  }

  const url = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("F2-S2: defina VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (.env.local ou ambiente).");
    process.exit(1);
  }
  if (!process.env.MEDFLOW_OPENAI_API_KEY && !process.env.OPENAI_API_KEY) {
    console.error("F2-S2: defina MEDFLOW_OPENAI_API_KEY (.env.local ou ambiente).");
    process.exit(1);
  }

  const client = createClient(url, serviceKey, { auth: { persistSession: false } });
  const aiProvider = createAIProviderFactory().create({ provider: "openai" });

  const { data: contract, error: contractErr } = await client
    .from("operator_contracts")
    .select("id, tenant_id, operator_code, contract_label, status")
    .eq("id", args.contractId)
    .maybeSingle();
  if (contractErr) throw new Error(`Falha ao consultar operator_contracts: ${contractErr.message}`);
  if (!contract) throw new Error(`Contrato não encontrado: ${args.contractId}`);
  if (contract.status !== "indexed") {
    throw new Error(
      `Contrato ${args.contractId} está com status '${contract.status}' — rode rag:contract:index primeiro (precisa estar 'indexed').`,
    );
  }

  console.log(`F2-S2: extraindo regras de ${contract.contract_label} (operadora ${contract.operator_code})...`);

  let totalProposals = 0;
  for (const category of CONTRACT_RULE_CATEGORIES) {
    const queryEmbedding = await embedQuery(aiProvider, CONTRACT_CATEGORY_RETRIEVAL_QUERIES[category]);

    const { data, error } = await client.rpc("match_knowledge_embeddings", {
      query_embedding: queryEmbedding,
      match_count: args.topK,
      filter_domain: "contract",
      filter_classification: null,
      similarity_threshold: 0,
      filter_document_id: contract.id,
    });
    if (error) throw new Error(`Falha na busca RAG (${category}): ${error.message}`);

    const rows = (data ?? []) as Array<{ id: string; content: string; metadata: { heading?: string | null } }>;
    const chunks: ContractKnowledgeChunk[] = rows.map((row) => ({
      id: row.id,
      heading: row.metadata?.heading ?? null,
      content: row.content,
    }));

    const proposals = await extractContractRulesForCategory(aiProvider, category, chunks);
    console.log(
      `F2-S2: [${category}] ${chunks.length} chunk(s) recuperado(s) — ${proposals.length} proposta(s) validada(s).`,
    );

    if (proposals.length > 0) {
      const insertRows = proposals.map((p) => ({
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
      }));
      const insert = await client.from("contract_rule_proposals").insert(insertRows);
      if (insert.error) throw new Error(`Falha ao gravar contract_rule_proposals (${category}): ${insert.error.message}`);
      totalProposals += proposals.length;
    }
  }

  console.log(`F2-S2: ${totalProposals} proposta(s) de regra gravada(s), pendentes de revisão humana (F2-S3).`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
