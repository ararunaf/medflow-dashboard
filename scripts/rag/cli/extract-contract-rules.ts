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
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { CONTRACT_RULE_CATEGORIES } from "../../../src/lib/capture/contract/types/contract-rule-proposal.ts";
import type { Database } from "../../../src/lib/database.types.ts";
import { createAIProviderFactory } from "../../../src/lib/enterprise/ai-provider/factory/ai-provider-factory.ts";
import { extractContractRulesForContractCategory } from "../../../src/lib/rag/operator-contract-ingestion.ts";

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
    console.error(
      "F2-S2: defina VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (.env.local ou ambiente).",
    );
    process.exit(1);
  }
  if (!process.env.MEDFLOW_OPENAI_API_KEY && !process.env.OPENAI_API_KEY) {
    console.error("F2-S2: defina MEDFLOW_OPENAI_API_KEY (.env.local ou ambiente).");
    process.exit(1);
  }

  const client = createClient<Database>(url, serviceKey, { auth: { persistSession: false } });
  const aiProvider = createAIProviderFactory().create({ provider: "openai" });

  console.log(`F2-S2: extraindo regras do contrato ${args.contractId}...`);

  let totalProposals = 0;
  for (const category of CONTRACT_RULE_CATEGORIES) {
    const { chunkCount, proposalCount } = await extractContractRulesForContractCategory(
      client,
      aiProvider,
      { contractId: args.contractId, category, topK: args.topK },
    );
    console.log(
      `F2-S2: [${category}] ${chunkCount} chunk(s) recuperado(s) — ${proposalCount} proposta(s) validada(s).`,
    );
    totalProposals += proposalCount;
  }

  console.log(
    `F2-S2: ${totalProposals} proposta(s) de regra gravada(s), pendentes de revisão humana (F2-S3).`,
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
