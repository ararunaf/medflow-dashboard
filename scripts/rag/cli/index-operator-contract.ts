#!/usr/bin/env -S npx tsx
/**
 * Ingestão de contrato de operadora para RAG (F2-S1).
 *
 * Extrai texto do PDF, divide em chunks por cláusula (ver
 * src/lib/rag/chunk-contract-text.ts), gera embeddings via OpenAI
 * (AIProviderPort — ARCH-02, nunca chamada direta ao vendor) e grava tudo em
 * `operator_contracts` + `knowledge_embeddings` (domain='contract') no
 * Supabase de staging. Requer VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e
 * MEDFLOW_OPENAI_API_KEY (via .env.local ou ambiente).
 *
 * Ferramenta CLI offline (fora do Enterprise Runtime / ServiceCtx) — mesmo
 * padrão de scripts/enterprise/tiss-catalog/import-tuss-cid-catalog.ts:
 * cliente Supabase com service role direto, sem passar pelos Ports de
 * produto (que pressupõem uma requisição autenticada real).
 *
 * Uso:
 *   npx tsx scripts/rag/cli/index-operator-contract.ts \
 *     --pdf caminho/contrato-unimed-2026.pdf \
 *     --tenant-id <uuid> \
 *     --operator-code 123456 \
 *     --operator-name "Unimed Nacional" \
 *     --contract-label UNIMED-NACIONAL-2026 \
 *     --created-by <uuid-de-profiles>
 *
 * Use --force para reindexar mesmo se o checksum já tiver sido indexado
 * (apaga os chunks antigos do documento antes de gravar os novos).
 */
import { createHash, randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../../src/lib/database.types.ts";
import { createAIProviderFactory } from "../../../src/lib/enterprise/ai-provider/factory/ai-provider-factory.ts";
import {
  CONTRACT_STORAGE_BUCKET,
  findIndexedContractByChecksum,
  indexOperatorContract,
  operatorContractStoragePath,
} from "../../../src/lib/rag/operator-contract-ingestion.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..", "..", "..");

type Args = {
  pdf?: string;
  tenantId?: string;
  operatorCode?: string;
  operatorName?: string;
  contractLabel?: string;
  createdBy?: string;
  force: boolean;
};

function parseArgs(argv: readonly string[]): Args {
  const out: Args = { force: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--pdf") out.pdf = argv[++i];
    else if (argv[i] === "--tenant-id") out.tenantId = argv[++i];
    else if (argv[i] === "--operator-code") out.operatorCode = argv[++i];
    else if (argv[i] === "--operator-name") out.operatorName = argv[++i];
    else if (argv[i] === "--contract-label") out.contractLabel = argv[++i];
    else if (argv[i] === "--created-by") out.createdBy = argv[++i];
    else if (argv[i] === "--force") out.force = true;
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
  const missing = (
    ["pdf", "tenantId", "operatorCode", "contractLabel", "createdBy"] as const
  ).filter((k) => !args[k]);
  if (missing.length > 0) {
    console.error(
      `F2-S1: parâmetros obrigatórios ausentes: ${missing.join(", ")}.\n` +
        "Uso: npx tsx scripts/rag/cli/index-operator-contract.ts --pdf <arquivo.pdf> --tenant-id <uuid> " +
        "--operator-code <codigo-ans> --contract-label <rotulo> --created-by <uuid-profiles> [--operator-name <nome>] [--force]",
    );
    process.exit(1);
  }
  if (!existsSync(args.pdf!)) {
    console.error(`F2-S1: arquivo não encontrado: ${args.pdf}`);
    process.exit(1);
  }

  const url = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error(
      "F2-S1: defina VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (.env.local ou ambiente).",
    );
    process.exit(1);
  }
  if (!process.env.MEDFLOW_OPENAI_API_KEY && !process.env.OPENAI_API_KEY) {
    console.error("F2-S1: defina MEDFLOW_OPENAI_API_KEY (.env.local ou ambiente).");
    process.exit(1);
  }

  const client = createClient<Database>(url, serviceKey, { auth: { persistSession: false } });
  const aiProvider = createAIProviderFactory().create({ provider: "openai" });

  const pdfBytes = new Uint8Array(readFileSync(args.pdf!));
  const checksum = createHash("sha256").update(pdfBytes).digest("hex");

  const existing = await findIndexedContractByChecksum(client, args.tenantId!, checksum);
  if (existing && !args.force) {
    console.log(
      `F2-S1: contrato já indexado (id=${existing.id}, ${existing.chunk_count} chunks) — mesmo checksum. ` +
        "Use --force para reindexar.",
    );
    return;
  }

  console.log(`F2-S1: extraindo texto de ${args.pdf}...`);
  const result = await indexOperatorContract(client, aiProvider, {
    tenantId: args.tenantId!,
    contractId: existing?.id ?? randomUUID(),
    pdfBytes,
    operatorCode: args.operatorCode!,
    operatorName: args.operatorName ?? null,
    contractLabel: args.contractLabel!,
    createdBy: args.createdBy!,
    onProgress: (message) => console.log(`F2-S1: ${message}`),
  });

  console.log(
    `F2-S1: contrato indexado — id=${result.contractId}, ${result.chunkCount} chunks, modelo=${result.embeddingModel}, ` +
      `bucket=${CONTRACT_STORAGE_BUCKET}/${operatorContractStoragePath(args.tenantId!, result.contractId)}.`,
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
