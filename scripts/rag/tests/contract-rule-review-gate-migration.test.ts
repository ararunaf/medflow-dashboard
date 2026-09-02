/**
 * F2-S3 — migração do portão de revisão humana + versionamento de regra.
 * Mesmo padrão estrutural das demais migrações deste roadmap.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../../..");

describe("migração contract_rule_review_gate — estrutura (DoD F2-S3)", () => {
  const migrationPath = resolve(root, "supabase/migrations/20260902150000_contract_rule_review_gate.sql");
  const sql = existsSync(migrationPath) ? readFileSync(migrationPath, "utf8") : "";

  it("existe", () => {
    assert.ok(existsSync(migrationPath), `migração não encontrada em ${migrationPath}`);
  });

  it("adiciona os campos de decisão do revisor em contract_rule_proposals", () => {
    assert.match(sql, /ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES public\.profiles \(id\)/);
    assert.match(sql, /ADD COLUMN IF NOT EXISTS reviewed_at timestamptz/);
    assert.match(sql, /ADD COLUMN IF NOT EXISTS edited_description text/);
    assert.match(sql, /ADD COLUMN IF NOT EXISTS edited_justification text/);
  });

  it("só permite UPDATE de proposta 'pending' (USING) e exige estado terminal com reviewed_by/reviewed_at do próprio autor (WITH CHECK)", () => {
    assert.match(sql, /contract_rule_proposals_update_review/);
    assert.match(sql, /USING \(\s*tenant_id IN \(SELECT public\.current_tenant_ids\(\)\)\s*AND public\.can_manage_billing\(\)\s*AND status = 'pending'/);
    assert.match(sql, /WITH CHECK \(\s*tenant_id IN \(SELECT public\.current_tenant_ids\(\)\)\s*AND public\.can_manage_billing\(\)\s*AND status IN \('approved', 'rejected', 'edited'\)\s*AND reviewed_by = auth\.uid\(\)\s*AND reviewed_at IS NOT NULL/);
  });

  it("declara contract_rule_versions com FK composta para operator_contracts e unicidade por versão", () => {
    assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.contract_rule_versions/);
    assert.match(
      sql,
      /FOREIGN KEY \(tenant_id, operator_contract_id\)\s*REFERENCES public\.operator_contracts \(tenant_id, id\)/,
    );
    assert.match(sql, /CONSTRAINT contract_rule_versions_version_uidx UNIQUE \(tenant_id, rule_id, version\)/);
  });

  it("contract_rule_versions é imutável — RLS habilitada, INSERT exige approved_by = auth.uid(), sem policy de UPDATE/DELETE", () => {
    assert.match(sql, /ALTER TABLE public\.contract_rule_versions ENABLE ROW LEVEL SECURITY/);
    assert.match(sql, /contract_rule_versions_insert_review[\s\S]*?approved_by = auth\.uid\(\)/);
    assert.doesNotMatch(sql, /ON public\.contract_rule_versions FOR UPDATE/);
    assert.doesNotMatch(sql, /ON public\.contract_rule_versions FOR DELETE/);
  });
});

describe("F2-S3 portão de revisão — integração (Supabase)", () => {
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
      .select("id, reviewed_by, reviewed_at, edited_description")
      .limit(1);
    assert.equal(proposals.error, null, proposals.error?.message);

    const versions = await client
      .from("contract_rule_versions")
      .select("id, tenant_id, rule_id, version, approved_by")
      .limit(1);
    assert.equal(versions.error, null, versions.error?.message);
  });
});
