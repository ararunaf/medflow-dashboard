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
 * Uso (CSV):
 *   npx tsx scripts/enterprise/tiss-catalog/import-tuss-cid-catalog.ts \
 *     --tuss caminho/tuss.csv --cid10 caminho/cid10.csv
 *
 * Uso (JSON oficial da ANS, Tabela 22 — Terminologia de Procedimentos):
 *   npx tsx scripts/enterprise/tiss-catalog/import-tuss-cid-catalog.ts \
 *     --tuss-json caminho/tuss-22.json --cid10 caminho/cid10.csv
 *
 * Formato tuss.csv:  tuss_code,name,group_code,category,requires_authorization
 * Formato tuss-22.json: array de { id, source, display_name, extras: { inicio_vigencia, fim_vigencia, fim_implantacao } }
 *   — formato de exportação real da ANS (Tabela 22). `--tuss-json` tem precedência sobre `--tuss`.
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
    const m = line.trim().match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

function parseArgs(argv: readonly string[]): { tuss?: string; tussJson?: string; cid10?: string } {
  const out: { tuss?: string; tussJson?: string; cid10?: string } = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--tuss") out.tuss = argv[++i];
    if (argv[i] === "--tuss-json") out.tussJson = argv[++i];
    if (argv[i] === "--cid10") out.cid10 = argv[++i];
  }
  return out;
}

/**
 * Parser CSV com suporte a aspas (campo com vírgula/quebra de linha embutida,
 * aspas escapadas como "") — necessário porque descrições de procedimento
 * TUSS/CID reais frequentemente contêm vírgula. Detecta automaticamente o
 * delimitador (`,` ou `;`) pela primeira linha, já que exports do DATASUS
 * costumam usar `;` (locale pt-BR usa `,` como separador decimal).
 */
function splitCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      cells.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

function detectDelimiter(headerLine: string): string {
  const commaCount = (headerLine.match(/,/g) ?? []).length;
  const semicolonCount = (headerLine.match(/;/g) ?? []).length;
  return semicolonCount > commaCount ? ";" : ",";
}

export function parseCsv(content: string): Record<string, string>[] {
  // Remove BOM (comum em exports do Excel/DATASUS) e normaliza quebras de linha.
  const normalized = content.replace(/^﻿/, "");
  const lines = normalized.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const delimiter = detectDelimiter(lines[0]);
  const headers = splitCsvLine(lines[0], delimiter).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line, delimiter);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = (cells[i] ?? "").trim()));
    return row;
  });
}

type TussJsonRecord = {
  id?: unknown;
  source?: unknown;
  display_name?: unknown;
  extras?: {
    inicio_vigencia?: unknown;
    fim_vigencia?: unknown;
  };
};

export type TussProcedureRow = {
  tuss_code: string;
  name: string;
  group_code: string | null;
  category: string | null;
  requires_authorization: boolean;
  ans_edition: string | null;
  effective_from: string | null;
  effective_to: string | null;
  status: "active" | "inactive";
  source: string;
};

/**
 * Parser do formato JSON real de exportação da ANS (Tabela 22 —
 * Terminologia de Procedimentos e Eventos em Saúde). Cada registro traz o
 * código em `id`, o nome em `display_name` e as datas de vigência em
 * `extras`. `fim_vigencia === "-"` significa código ainda vigente (sem data
 * de encerramento) — é assim que a própria ANS marca "sem previsão de
 * término" nessa exportação.
 *
 * `group_code` é derivado estruturalmente dos 2 primeiros dígitos do
 * código (capítulo TUSS) — um fato literal do próprio código, não uma
 * classificação digitada de memória. `category` fica null: não há como
 * nomear os capítulos com segurança sem a tabela de domínio oficial da
 * ANS, então preferimos deixar em branco a inventar rótulo.
 */
export function parseTussJson(content: string): TussProcedureRow[] {
  const parsed: unknown = JSON.parse(content);
  if (!Array.isArray(parsed)) {
    throw new Error("Formato inesperado: esperava um array de registros TUSS (Tabela 22 da ANS).");
  }

  return (parsed as TussJsonRecord[])
    .filter(
      (r): r is TussJsonRecord & { id: string; display_name: string } =>
        typeof r?.id === "string" &&
        r.id.trim().length > 0 &&
        typeof r?.display_name === "string" &&
        r.display_name.trim().length > 0,
    )
    .map((r) => {
      const fimVigencia = typeof r.extras?.fim_vigencia === "string" ? r.extras.fim_vigencia : undefined;
      const inicioVigencia =
        typeof r.extras?.inicio_vigencia === "string" ? r.extras.inicio_vigencia : undefined;
      const isActive = !fimVigencia || fimVigencia === "-";
      const source = typeof r.source === "string" && r.source.length > 0 ? r.source : "tuss-22";
      return {
        tuss_code: r.id.trim(),
        name: r.display_name.trim(),
        group_code: r.id.trim().slice(0, 2) || null,
        category: null,
        requires_authorization: false,
        ans_edition: "22",
        effective_from: inicioVigencia ?? null,
        effective_to: isActive ? null : (fimVigencia ?? null),
        status: isActive ? "active" : "inactive",
        source: `ans-${source}`,
      };
    });
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

const UPSERT_BATCH_SIZE = 500;

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
  const tussJsonPath = args.tussJson;
  const tussPath = args.tuss ?? (tussJsonPath ? undefined : join(__dirname, "sample-data", "tuss-sample.csv"));
  const cid10Path = args.cid10 ?? join(__dirname, "sample-data", "cid10-sample.csv");

  const client = createClient(url, serviceKey, { auth: { persistSession: false } });

  if (tussJsonPath) {
    if (existsSync(tussJsonPath)) {
      const rows = parseTussJson(readFileSync(tussJsonPath, "utf8"));
      for (const batch of chunk(rows, UPSERT_BATCH_SIZE)) {
        const { error } = await client.from("tiss_tuss_procedures").upsert(batch, {
          onConflict: "tuss_code",
        });
        if (error) throw new Error(`Falha ao gravar tiss_tuss_procedures: ${error.message}`);
      }
      const active = rows.filter((r) => r.status === "active").length;
      console.log(
        `TUSS: ${rows.length} procedimentos importados de ${tussJsonPath} (formato ANS Tabela 22; ${active} ativos, ${rows.length - active} inativos; lotes de ${UPSERT_BATCH_SIZE}).`,
      );
    } else {
      console.warn(`TUSS: arquivo JSON não encontrado (${tussJsonPath}) — nada importado.`);
    }
  } else if (tussPath && existsSync(tussPath)) {
    const parsed = parseCsv(readFileSync(tussPath, "utf8"));
    const rows = parsed
      .filter((r) => r.tuss_code && r.name)
      .map((r) => ({
        tuss_code: r.tuss_code,
        name: r.name,
        group_code: r.group_code || null,
        category: r.category || null,
        requires_authorization: r.requires_authorization === "true",
      }));
    const skipped = parsed.length - rows.length;
    if (skipped > 0) {
      console.warn(`TUSS: ${skipped} linha(s) ignorada(s) por faltar tuss_code ou name.`);
    }
    for (const batch of chunk(rows, UPSERT_BATCH_SIZE)) {
      const { error } = await client.from("tiss_tuss_procedures").upsert(batch, {
        onConflict: "tuss_code",
      });
      if (error) throw new Error(`Falha ao gravar tiss_tuss_procedures: ${error.message}`);
    }
    console.log(`TUSS: ${rows.length} procedimentos importados de ${tussPath} (lotes de ${UPSERT_BATCH_SIZE}).`);
  } else {
    console.warn(`TUSS: arquivo não encontrado (${tussPath}) — nada importado.`);
  }

  if (existsSync(cid10Path)) {
    const parsed = parseCsv(readFileSync(cid10Path, "utf8"));
    const rows = parsed
      .filter((r) => r.cid_code && r.description)
      .map((r) => ({
        cid_code: r.cid_code,
        description: r.description,
        chapter: r.chapter || null,
      }));
    const skipped = parsed.length - rows.length;
    if (skipped > 0) {
      console.warn(`CID-10: ${skipped} linha(s) ignorada(s) por faltar cid_code ou description.`);
    }
    for (const batch of chunk(rows, UPSERT_BATCH_SIZE)) {
      const { error } = await client.from("tiss_cid10_codes").upsert(batch, {
        onConflict: "cid_code",
      });
      if (error) throw new Error(`Falha ao gravar tiss_cid10_codes: ${error.message}`);
    }
    console.log(`CID-10: ${rows.length} códigos importados de ${cid10Path} (lotes de ${UPSERT_BATCH_SIZE}).`);
  } else {
    console.warn(`CID-10: arquivo não encontrado (${cid10Path}) — nada importado.`);
  }

  console.log(
    "Importação concluída. Reinicie o servidor (ou aguarde a próxima hidratação) para o catálogo real entrar em vigor.",
  );
}

// Só executa como CLI — permite importar parseCsv() em testes sem disparar main().
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
