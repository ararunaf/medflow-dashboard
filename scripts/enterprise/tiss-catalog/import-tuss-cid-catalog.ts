#!/usr/bin/env -S npx tsx
/**
 * Importa TUSS/CID-10 reais para o Supabase (TISS-02-DATA).
 *
 * Lê dois CSVs (procedimentos TUSS e códigos CID-10) e faz upsert idempotente
 * em `tiss_tuss_procedures` / `tiss_cid10_codes`. Requer SUPABASE_SERVICE_ROLE_KEY
 * + VITE_SUPABASE_URL (via .env.local ou variáveis de ambiente).
 *
 * ATENÇÃO: os CSVs em scripts/enterprise/tiss-catalog/sample-data/ são AMOSTRAS
 * de desenvolvimento (poucas dezenas de códigos conhecidos), não a tabela
 * oficial completa. Para carga de produção, gere os CSVs a partir da distribuição
 * oficial da ANS (Terminologia TUSS) e do DATASUS (CID-10) no mesmo formato de
 * colunas — nenhum código deve ser digitado à mão a partir de memória/IA.
 *
 * Uso:
 *   npx tsx scripts/enterprise/tiss-catalog/import-tuss-cid-catalog.ts \
 *     --tuss caminho/tuss.csv --cid10 caminho/cid10.csv
 *
 * Formato tuss.csv:  tuss_code,name,group_code,category,requires_authorization
 * Formato cid10.csv: cid_code,description,chapter
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..", "..", "..");

function loadEnv(): Record<string, string> {
  const path = join(root, ".env.local");
  if (!existsSync(path)) return {};
  const out: Record<string, string> = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

function parseArgs(argv: readonly string[]): { tuss?: string; cid10?: string } {
  const out: { tuss?: string; cid10?: string } = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--tuss") out.tuss = argv[++i];
    if (argv[i] === "--cid10") out.cid10 = argv[++i];
  }
  return out;
}

/** Parser CSV minimalista: sem aspas com vírgula embutida, cabeçalho obrigatório. */
function parseCsv(content: string): Record<string, string>[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(",").map((c) => c.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = cells[i] ?? ""));
    return row;
  });
}

async function main() {
  const env = { ...loadEnv(), ...process.env };
  const url = env.VITE_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error(
      "TISS-02-DATA: defina VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (.env.local ou ambiente).",
    );
    process.exit(1);
  }

  const args = parseArgs(process.argv.slice(2));
  const tussPath = args.tuss ?? join(__dirname, "sample-data", "tuss-sample.csv");
  const cid10Path = args.cid10 ?? join(__dirname, "sample-data", "cid10-sample.csv");

  const client = createClient(url, serviceKey, { auth: { persistSession: false } });

  if (existsSync(tussPath)) {
    const rows = parseCsv(readFileSync(tussPath, "utf8")).map((r) => ({
      tuss_code: r.tuss_code,
      name: r.name,
      group_code: r.group_code || null,
      category: r.category || null,
      requires_authorization: r.requires_authorization === "true",
    }));
    const { error } = await client.from("tiss_tuss_procedures").upsert(rows, {
      onConflict: "tuss_code",
    });
    if (error) throw new Error(`Falha ao gravar tiss_tuss_procedures: ${error.message}`);
    console.log(`TUSS: ${rows.length} procedimentos importados de ${tussPath}`);
  } else {
    console.warn(`TUSS: arquivo não encontrado (${tussPath}) — nada importado.`);
  }

  if (existsSync(cid10Path)) {
    const rows = parseCsv(readFileSync(cid10Path, "utf8")).map((r) => ({
      cid_code: r.cid_code,
      description: r.description,
      chapter: r.chapter || null,
    }));
    const { error } = await client.from("tiss_cid10_codes").upsert(rows, {
      onConflict: "cid_code",
    });
    if (error) throw new Error(`Falha ao gravar tiss_cid10_codes: ${error.message}`);
    console.log(`CID-10: ${rows.length} códigos importados de ${cid10Path}`);
  } else {
    console.warn(`CID-10: arquivo não encontrado (${cid10Path}) — nada importado.`);
  }

  console.log(
    "Importação concluída. Reinicie o servidor (ou aguarde a próxima hidratação) para o catálogo real entrar em vigor.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
