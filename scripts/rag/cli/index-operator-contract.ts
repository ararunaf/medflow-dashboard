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
import { createAIProviderFactory } from "../../../src/lib/enterprise/ai-provider/factory/ai-provider-factory.ts";
import { chunkContractText } from "../../../src/lib/rag/chunk-contract-text.ts";
import { embedTexts } from "../../../src/lib/rag/embed-texts.ts";
import { extractPdfText } from "../../../src/lib/rag/extract-pdf-text.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..", "..", "..");

const CONTRACT_STORAGE_BUCKET = "clinical-documents";
const KNOWLEDGE_INSERT_BATCH_SIZE = 100;

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
  const missing = (["pdf", "tenantId", "operatorCode", "contractLabel", "createdBy"] as const).filter(
    (k) => !args[k],
  );
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
    console.error("F2-S1: defina VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (.env.local ou ambiente).");
    process.exit(1);
  }
  if (!process.env.MEDFLOW_OPENAI_API_KEY && !process.env.OPENAI_API_KEY) {
    console.error("F2-S1: defina MEDFLOW_OPENAI_API_KEY (.env.local ou ambiente).");
    process.exit(1);
  }

  const client = createClient(url, serviceKey, { auth: { persistSession: false } });
  const aiProvider = createAIProviderFactory().create({ provider: "openai" });

  const pdfBytes = readFileSync(args.pdf!);
  const checksum = createHash("sha256").update(pdfBytes).digest("hex");

  const { data: existing, error: existingErr } = await client
    .from("operator_contracts")
    .select("id, status, chunk_count")
    .eq("tenant_id", args.tenantId!)
    .eq("checksum_sha256", checksum)
    .eq("status", "indexed")
    .maybeSingle();
  if (existingErr) throw new Error(`Falha ao consultar operator_contracts: ${existingErr.message}`);

  if (existing && !args.force) {
    console.log(
      `F2-S1: contrato já indexado (id=${existing.id}, ${existing.chunk_count} chunks) — mesmo checksum. ` +
        "Use --force para reindexar.",
    );
    return;
  }

  console.log(`F2-S1: extraindo texto de ${args.pdf}...`);
  const { text, pageCount } = await extractPdfText(new Uint8Array(pdfBytes));
  if (text.trim().length === 0) {
    throw new Error("PDF sem texto extraível (provável scan de imagem sem OCR — fora do escopo desta sprint).");
  }

  const chunks = chunkContractText(text);
  if (chunks.length === 0) {
    throw new Error("Nenhum chunk gerado a partir do texto extraído.");
  }
  console.log(`F2-S1: ${pageCount} página(s), ${chunks.length} chunk(s) (${chunks[0]!.heading ? "por cláusula" : "por parágrafo"}).`);

  const contractId = existing?.id ?? randomUUID();
  const storagePath = `${args.tenantId}/contracts/${contractId}/original.pdf`;

  const upload = await client.storage.from(CONTRACT_STORAGE_BUCKET).upload(storagePath, pdfBytes, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (upload.error) throw new Error(`Falha ao subir PDF para storage: ${upload.error.message}`);

  const upsertContract = await client.from("operator_contracts").upsert(
    {
      id: contractId,
      tenant_id: args.tenantId,
      operator_code: args.operatorCode,
      operator_name: args.operatorName ?? null,
      contract_label: args.contractLabel,
      byte_length: pdfBytes.byteLength,
      checksum_sha256: checksum,
      storage_bucket: CONTRACT_STORAGE_BUCKET,
      storage_path: storagePath,
      page_count: pageCount,
      status: "indexing",
      created_by: args.createdBy,
    },
    { onConflict: "id" },
  );
  if (upsertContract.error) {
    throw new Error(`Falha ao gravar operator_contracts: ${upsertContract.error.message}`);
  }

  try {
    console.log(`F2-S1: gerando embeddings para ${chunks.length} chunk(s)...`);
    const { vectors, model } = await embedTexts(
      aiProvider,
      chunks.map((c) => c.content),
    );

    const del = await client.from("knowledge_embeddings").delete().eq("document_id", contractId);
    if (del.error) throw new Error(`Falha ao limpar chunks antigos: ${del.error.message}`);

    const rows = chunks.map((chunk, i) => ({
      id: randomUUID(),
      tenant_id: args.tenantId,
      document_id: contractId,
      domain: "contract",
      classification: args.operatorCode,
      agent_affinity: ["contract-knowledge"],
      source_path: storagePath,
      chunk_index: chunk.index,
      content: chunk.content,
      content_hash: createHash("sha256").update(chunk.content).digest("hex"),
      embedding: vectors[i],
      embedding_model: model,
      metadata: {
        operatorCode: args.operatorCode,
        operatorName: args.operatorName ?? null,
        contractLabel: args.contractLabel,
        heading: chunk.heading,
      },
      version: "contract_ingestion_v1",
      indexed_at: new Date().toISOString(),
    }));

    for (let i = 0; i < rows.length; i += KNOWLEDGE_INSERT_BATCH_SIZE) {
      const batch = rows.slice(i, i + KNOWLEDGE_INSERT_BATCH_SIZE);
      const insert = await client.from("knowledge_embeddings").insert(batch);
      if (insert.error) throw new Error(`Falha ao gravar knowledge_embeddings: ${insert.error.message}`);
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
      .eq("id", contractId);
    if (finish.error) throw new Error(`Falha ao finalizar operator_contracts: ${finish.error.message}`);

    console.log(
      `F2-S1: contrato indexado — id=${contractId}, ${rows.length} chunks, modelo=${model}, bucket=${CONTRACT_STORAGE_BUCKET}/${storagePath}.`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await client.from("operator_contracts").update({ status: "failed", error_message: message }).eq("id", contractId);
    throw err;
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
