/**
 * F2-S2 — migração contract_rule_proposals + filtro por documento na busca
 * RAG. Mesmo padrão estrutural das demais migrações (sem Postgres local
 * disponível, valida-se o SQL declarado; a integração real roda contra o
 * Supabase de staging quando há credenciais).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../../..");

describe("migração contract_rule_proposals — estrutura (DoD F2-S2)", () => {
  const migrationPath = resolve(root, "supabase/migrations/20260902140000_contract_rule_proposals.sql");
  const sql = existsSync(migrationPath) ? readFileSync(migrationPath, "utf8") : "";

  it("existe", () => {
    assert.ok(existsSync(migrationPath), `migração não encontrada em ${migrationPath}`);
  });

  it("retrofita o índice único (tenant_id, id) em operator_contracts antes de usá-lo como alvo de FK", () => {
    assert.match(
      sql,
      /CREATE UNIQUE INDEX IF NOT EXISTS operator_contracts_tenant_id_id_uidx\s+ON public\.operator_contracts \(tenant_id, id\)/,
    );
  });

  it("declara a tabela com as 5 categorias de regra do DoD", () => {
    assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.contract_rule_proposals/);
    assert.match(
      sql,
      /category IN \('cobertura', 'preco', 'pre_autorizacao', 'prazo', 'campo_obrigatorio'\)/,
    );
  });

  it("guarda a citação (citation_excerpt) e os chunks-fonte — prova de rastreabilidade exigida pelo DoD", () => {
    assert.match(sql, /citation_excerpt text NOT NULL/);
    assert.match(sql, /source_chunk_ids uuid\[\] NOT NULL DEFAULT '\{\}'/);
    assert.match(sql, /confidence numeric NOT NULL/);
    assert.match(sql, /confidence >= 0 AND confidence <= 100/);
  });

  it("referencia operator_contracts pela chave composta (tenant_id, id) padrão do projeto", () => {
    assert.match(
      sql,
      /FOREIGN KEY \(tenant_id, operator_contract_id\)\s+REFERENCES public\.operator_contracts \(tenant_id, id\)/,
    );
  });

  it("habilita RLS e não abre INSERT/UPDATE para authenticated (só o agente via service role grava)", () => {
    assert.match(sql, /ALTER TABLE public\.contract_rule_proposals ENABLE ROW LEVEL SECURITY/);
    assert.doesNotMatch(sql, /contract_rule_proposals.*FOR INSERT TO authenticated/s);
    assert.doesNotMatch(sql, /contract_rule_proposals.*FOR UPDATE TO authenticated/s);
  });

  it("estende match_knowledge_embeddings com filter_document_id sem duplicar sobrecarga (DROP antes do CREATE)", () => {
    assert.match(sql, /DROP FUNCTION IF EXISTS public\.match_knowledge_embeddings\(\s*extensions\.vector, int, text, text, float\s*\)/);
    assert.match(sql, /filter_document_id text DEFAULT NULL/);
    assert.match(sql, /ke\.document_id = filter_document_id/);
  });
});

describe("F2-S2 propostas — integração (Supabase)", () => {
  it("skips sem credenciais Supabase configuradas", async (t) => {
    const hasSupabase =
      Boolean(process.env.VITE_SUPABASE_URL) && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
    if (!hasSupabase) {
      t.skip("Supabase não configurado — integração omitida");
      return;
    }

    const { createClient } = await import("@supabase/supabase-js");
    const client = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const proposals = await client
      .from("contract_rule_proposals")
      .select("id, tenant_id, operator_contract_id, category, status")
      .limit(1);
    assert.equal(proposals.error, null, proposals.error?.message);
  });
});
