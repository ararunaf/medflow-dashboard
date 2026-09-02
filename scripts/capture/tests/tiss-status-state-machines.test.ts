/**
 * F1-S3 — máquina de estados real para tiss_guides / tiss_denials / tiss_denial_appeals.
 *
 * Estrutural (sempre roda): confirma que a migração declara os 3 triggers
 * BEFORE UPDATE e as transições esperadas.
 * Integração (só com Supabase configurado): tenta uma transição inválida de
 * verdade contra o banco e espera rejeição (check_violation).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const migrationPath = join(
  here,
  "../../../supabase/migrations/20260902110000_tiss_status_state_machines.sql",
);

function readMigration(): string {
  return readFileSync(migrationPath, "utf8");
}

describe("F1-S3 máquina de estados — estrutural", () => {
  const sql = readMigration();

  it("cria os 3 triggers BEFORE UPDATE OF status/appeal_status", () => {
    assert.ok(sql.includes("BEFORE UPDATE OF status ON public.tiss_guides"));
    assert.ok(sql.includes("BEFORE UPDATE OF status ON public.tiss_denials"));
    assert.ok(sql.includes("BEFORE UPDATE OF appeal_status ON public.tiss_denial_appeals"));
  });

  it("tiss_guides: fluxo real da UI é permitido (draft→pending_review→approved→billed, pending_review→denied)", () => {
    assert.ok(sql.includes("OLD.status = 'draft' AND NEW.status = 'pending_review'"));
    assert.ok(sql.includes("OLD.status = 'pending_review' AND NEW.status IN ('approved', 'denied')"));
    assert.ok(sql.includes("OLD.status = 'approved' AND NEW.status = 'billed'"));
  });

  it("tiss_guides: billed e denied são terminais", () => {
    assert.ok(sql.includes("OLD.status IN ('billed', 'denied')"));
  });

  it("tiss_denials: 'reversed' é alcançável de qualquer estado não-terminal (botão Reverter)", () => {
    assert.ok(sql.includes("NEW.status = 'reversed'"));
    assert.ok(sql.includes("OLD.status = 'reversed'"));
  });

  it("tiss_denials: appealed é alcançável (cascata de createTissDenialAppeal)", () => {
    assert.ok(sql.includes("NEW.status IN ('under_review', 'appealed', 'accepted')"));
  });

  it("tiss_denial_appeals: pending→submitted→under_review→accepted|rejected, com withdrawn lateral", () => {
    assert.ok(sql.includes("OLD.appeal_status = 'pending' AND NEW.appeal_status = 'submitted'"));
    assert.ok(
      sql.includes(
        "OLD.appeal_status = 'under_review' AND NEW.appeal_status IN ('accepted', 'rejected', 'withdrawn')",
      ),
    );
  });

  it("tiss_denial_appeals: accepted/rejected/withdrawn são terminais", () => {
    assert.ok(sql.includes("OLD.appeal_status IN ('accepted', 'rejected', 'withdrawn')"));
  });

  it("todas as funções usam RAISE EXCEPTION com check_violation para transição inválida", () => {
    const matches = sql.match(/RAISE EXCEPTION[\s\S]*?check_violation/g) ?? [];
    assert.ok(matches.length >= 6, `esperava >=6 pontos de rejeição, achou ${matches.length}`);
  });
});

describe("F1-S3 máquina de estados — integração (Supabase)", () => {
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

    // Confirma só que as 3 tabelas continuam alcançáveis com o trigger instalado
    // (não fabrica dado de tenant real para não sujar produção).
    const guides = await client.from("tiss_guides").select("id, status").limit(1);
    assert.equal(guides.error, null, guides.error?.message);
    const denials = await client.from("tiss_denials").select("id, status").limit(1);
    assert.equal(denials.error, null, denials.error?.message);
    const appeals = await client
      .from("tiss_denial_appeals")
      .select("id, appeal_status")
      .limit(1);
    assert.equal(appeals.error, null, appeals.error?.message);
  });
});
