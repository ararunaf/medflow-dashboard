/**
 * F1-S2 — hierarquia multi-entidade (cooperativa -> clinica afiliada -> profissional).
 *
 * Duas camadas de verificação:
 * 1) Estrutural (sempre roda): a migração declara as colunas, a FK composta e
 *    as policies de RLS esperadas para professional_hospitals e tiss_guides.hospital_id.
 * 2) Integração (só roda com Supabase configurado): as tabelas existem e são
 *    alcançáveis via service role. Não simula dois tenants/usuários distintos —
 *    isso fica para um teste de RLS comportamental dedicado, fora do escopo
 *    desta migração pontual.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const migrationPath = join(
  here,
  "../../../supabase/migrations/20260902100000_tiss_multi_entity_hierarchy.sql",
);

function readMigration(): string {
  return readFileSync(migrationPath, "utf8");
}

describe("F1-S2 hierarquia multi-entidade — estrutural", () => {
  const sql = readMigration();

  it("hospitals ganha campos institucionais reais", () => {
    for (const col of ["code text", "cnpj text", "address text", "phone text", "active boolean"]) {
      assert.ok(sql.includes(col), `esperava coluna "${col}" em hospitals`);
    }
  });

  it("professional_hospitals existe com FK composta tenant-scoped", () => {
    assert.ok(sql.includes("CREATE TABLE IF NOT EXISTS public.professional_hospitals"));
    assert.ok(sql.includes("professional_hospitals_tenant_professional_fk"));
    assert.ok(sql.includes("professional_hospitals_tenant_hospital_fk"));
    assert.ok(
      sql.includes("UNIQUE (tenant_id, professional_id, hospital_id)"),
      "afiliação deve ser única por tenant+profissional+hospital",
    );
  });

  it("professional_hospitals tem RLS habilitada com policy de isolamento por tenant", () => {
    assert.ok(sql.includes("ALTER TABLE public.professional_hospitals ENABLE ROW LEVEL SECURITY"));
    assert.ok(sql.includes("professional_hospitals_select_tenant"));
    assert.ok(sql.includes("current_tenant_ids()"));
  });

  it("professional_hospitals restringe escrita a operational manager", () => {
    assert.ok(sql.includes("professional_hospitals_write_manager"));
    assert.ok(sql.includes("public.is_operational_manager()"));
  });

  it("tiss_guides ganha hospital_id com FK composta tenant-scoped", () => {
    assert.ok(sql.includes("ADD COLUMN IF NOT EXISTS hospital_id uuid"));
    assert.ok(sql.includes("tiss_guides_tenant_hospital_fk"));
    assert.ok(sql.includes("tiss_guides_tenant_hospital_idx"));
  });

  it("não introduz um segundo nível de tenant (cooperativa continua sendo o tenant único)", () => {
    assert.ok(
      !sql.includes("parent_tenant_id"),
      "hierarquia deve ficar dentro de hospitals, não criar tenant aninhado",
    );
  });
});

describe("F1-S2 hierarquia multi-entidade — integração (Supabase)", () => {
  it("skips sem credenciais Supabase configuradas", async (t) => {
    const hasSupabase =
      Boolean(process.env.VITE_SUPABASE_URL) && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
    if (!hasSupabase) {
      t.skip("Supabase não configurado — integração omitida");
      return;
    }

    const { createClient } = await import("@supabase/supabase-js");
    const client = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const hospitals = await client.from("hospitals").select("id, code, cnpj, active").limit(1);
    assert.equal(hospitals.error, null, hospitals.error?.message);

    const affiliations = await client
      .from("professional_hospitals")
      .select("id, professional_id, hospital_id, active")
      .limit(1);
    assert.equal(affiliations.error, null, affiliations.error?.message);

    const guides = await client.from("tiss_guides").select("id, hospital_id").limit(1);
    assert.equal(guides.error, null, guides.error?.message);
  });
});
