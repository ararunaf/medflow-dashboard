/**
 * F2-S1 — ingestão de contrato de operadora (migração operator_contracts).
 *
 * Mesmo padrão estrutural usado em capture-pipeline-queue.test.ts /
 * tiss-multi-entity-hierarchy.test.ts: sem Postgres local disponível neste
 * ambiente, garantimos que o SQL declara as peças que o DoD exige; a
 * integração real roda contra o Supabase de staging quando há credenciais.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../../..");

describe("migração operator_contracts — estrutura (DoD F2-S1)", () => {
  const migrationPath = resolve(root, "supabase/migrations/20260902130000_operator_contract_ingestion.sql");
  const sql = existsSync(migrationPath) ? readFileSync(migrationPath, "utf8") : "";

  it("existe", () => {
    assert.ok(existsSync(migrationPath), `migração não encontrada em ${migrationPath}`);
  });

  it("declara a tabela com os campos de rastreio de ingestão", () => {
    assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.operator_contracts/);
    assert.match(sql, /status text NOT NULL DEFAULT 'uploaded'/);
    assert.match(
      sql,
      /status IN \(\s*'uploaded',\s*'indexing',\s*'indexed',\s*'failed'\s*\)/,
    );
    assert.match(sql, /chunk_count integer NOT NULL DEFAULT 0/);
    assert.match(sql, /embedding_model text/);
  });

  it("é tenant-scoped com FK real para tenants", () => {
    assert.match(sql, /tenant_id uuid NOT NULL REFERENCES public\.tenants \(id\) ON DELETE CASCADE/);
  });

  it("trava bucket de storage em clinical-documents (mesmo bucket de capture_documents)", () => {
    assert.match(sql, /storage_bucket text NOT NULL DEFAULT 'clinical-documents'/);
    assert.match(sql, /CHECK \(storage_bucket = 'clinical-documents'\)/);
  });

  it("valida checksum_sha256 com o mesmo padrão regex de capture_documents", () => {
    assert.match(sql, /checksum_sha256 ~ '\^\[a-f0-9\]\{64\}\$'/);
  });

  it("habilita RLS e bloqueia UPDATE de clientes autenticados (só o worker de indexação muda status)", () => {
    assert.match(sql, /ALTER TABLE public\.operator_contracts ENABLE ROW LEVEL SECURITY/);
    assert.match(sql, /operator_contracts_update_service_only[\s\S]*?USING \(false\)/);
  });

  it("INSERT exige can_manage_billing() e created_by = auth.uid()", () => {
    assert.match(sql, /operator_contracts_insert_billing[\s\S]*?public\.can_manage_billing\(\)/);
    assert.match(sql, /operator_contracts_insert_billing[\s\S]*?created_by = auth\.uid\(\)/);
  });
});

describe("F2-S1 ingestão — integração (Supabase)", () => {
  it("skips sem credenciais Supabase configuradas", async (t) => {
    const hasSupabase =
      Boolean(process.env.VITE_SUPABASE_URL) && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
    if (!hasSupabase) {
      t.skip("Supabase não configurado — integração omitida");
      return;
    }

    const { createClient } = await import("@supabase/supabase-js");
    const client = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const contracts = await client
      .from("operator_contracts")
      .select("id, tenant_id, operator_code, status, chunk_count")
      .limit(1);
    assert.equal(contracts.error, null, contracts.error?.message);

    const knowledge = await client
      .from("knowledge_embeddings")
      .select("id, document_id, domain, chunk_index")
      .eq("domain", "contract")
      .limit(1);
    assert.equal(knowledge.error, null, knowledge.error?.message);
  });
});
