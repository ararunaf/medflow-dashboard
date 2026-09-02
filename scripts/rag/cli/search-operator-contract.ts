#!/usr/bin/env -S npx tsx
/**
 * Busca por cláusula em contratos de operadora indexados (F2-S1 — DoD).
 *
 * Gera o embedding da pergunta via OpenAI (AIProviderPort) e chama a RPC
 * `match_knowledge_embeddings` (domain='contract') já existente no Supabase.
 * Prova o requisito da sprint: "contrato real de operadora indexado e
 * pesquisável por cláusula".
 *
 * Uso:
 *   npx tsx scripts/rag/cli/search-operator-contract.ts \
 *     --tenant-id <uuid> --query "prazo de carência para internação" \
 *     [--operator-code 123456] [--top-k 5]
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { createAIProviderFactory } from "../../../src/lib/enterprise/ai-provider/factory/ai-provider-factory.ts";
import { embedQuery } from "../../../src/lib/rag/embed-texts.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..", "..", "..");

type Args = { tenantId?: string; query?: string; operatorCode?: string; topK: number };

function parseArgs(argv: readonly string[]): Args {
  const out: Args = { topK: 5 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--tenant-id") out.tenantId = argv[++i];
    else if (argv[i] === "--query") out.query = argv[++i];
    else if (argv[i] === "--operator-code") out.operatorCode = argv[++i];
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
  if (!args.tenantId || !args.query) {
    console.error(
      "Uso: npx tsx scripts/rag/cli/search-operator-contract.ts --tenant-id <uuid> --query \"...\" [--operator-code <codigo>] [--top-k 5]",
    );
    process.exit(1);
  }

  const url = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("Defina VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (.env.local ou ambiente).");
    process.exit(1);
  }

  const client = createClient(url, serviceKey, { auth: { persistSession: false } });
  const aiProvider = createAIProviderFactory().create({ provider: "openai" });

  const queryEmbedding = await embedQuery(aiProvider, args.query);

  const { data, error } = await client.rpc("match_knowledge_embeddings", {
    query_embedding: queryEmbedding,
    match_count: args.topK,
    filter_domain: "contract",
    filter_classification: args.operatorCode ?? null,
    similarity_threshold: 0,
  });
  if (error) throw new Error(`Falha na busca vetorial: ${error.message}`);

  const rows = (data ?? []) as Array<{
    document_id: string;
    classification: string;
    content: string;
    metadata: { heading?: string | null; contractLabel?: string };
    similarity: number;
  }>;

  if (rows.length === 0) {
    console.log("Nenhum resultado — nenhum contrato indexado para esse tenant/operadora, ou busca sem correspondência.");
    return;
  }

  console.log(`F2-S1: ${rows.length} trecho(s) mais relevante(s) para "${args.query}":\n`);
  for (const row of rows) {
    const heading = row.metadata?.heading ?? "(sem cabeçalho de cláusula)";
    console.log(`— similaridade ${row.similarity.toFixed(3)} · ${row.metadata?.contractLabel ?? row.classification} · ${heading}`);
    console.log(`  ${row.content.slice(0, 220).replace(/\n/g, " ")}${row.content.length > 220 ? "…" : ""}\n`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
