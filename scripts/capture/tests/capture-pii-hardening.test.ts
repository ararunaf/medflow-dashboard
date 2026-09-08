/**
 * SEC-PII-01 — Capture PII Protection Hardening (testes unitários/estruturais).
 *
 * Cobertura complementar aos testes de integração em semantic-fallback.test.ts
 * (que já exercitam o gate via applySemanticFallback) e ao E2E de RLS em
 * scripts/enterprise/tests/capture-pii-rls-e2e.test.ts (Postgres real).
 * Aqui: as unidades puras (gate, redator de metadata) e guardas de
 * regressão estruturais que não dependem de Supabase/rede.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  evaluateExternalAiPiiGate,
  isExternalAiPiiPolicyEnabled,
  isPiiSensitiveFieldGroup,
  PII_SENSITIVE_FIELD_GROUPS,
} from "../../../src/lib/capture/ocr/fallback/pii-external-ai-gate.ts";
import { redactSemanticFallbackDecisionsForMetadata } from "../../../src/lib/capture/ocr/services/semantic-fallback-service.ts";
import type { SemanticFallbackDecision } from "../../../src/lib/capture/ocr/fallback/semantic-fallback.ts";
import type { StructuredFieldGroup } from "../../../src/lib/capture/parser/types/structured-guide.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "../../..");
function readSrc(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

describe("pii-external-ai-gate — classificação de grupos sensíveis", () => {
  it("'paciente' e 'diagnostico' são sensíveis; os demais 9 grupos não são", () => {
    const ALL: StructuredFieldGroup[] = [
      "paciente",
      "operadora",
      "prestador",
      "solicitante",
      "executante",
      "procedimentos",
      "diagnostico",
      "autorizacoes",
      "datas",
      "assinaturas",
      "observacoes",
    ];
    const sensitive = ALL.filter(isPiiSensitiveFieldGroup);
    assert.deepEqual(sensitive.sort(), ["diagnostico", "paciente"]);
    assert.deepEqual([...PII_SENSITIVE_FIELD_GROUPS].sort(), ["diagnostico", "paciente"]);
  });
});

describe("pii-external-ai-gate — isExternalAiPiiPolicyEnabled (fail-closed)", () => {
  it("só 'true' (string exata) habilita — ausente, vazio, '1', 'TRUE' não habilitam", () => {
    assert.equal(isExternalAiPiiPolicyEnabled({}), false);
    assert.equal(isExternalAiPiiPolicyEnabled({ MEDICFLOW_ALLOW_PII_EXTERNAL_AI: "" }), false);
    assert.equal(isExternalAiPiiPolicyEnabled({ MEDICFLOW_ALLOW_PII_EXTERNAL_AI: "1" }), false);
    assert.equal(isExternalAiPiiPolicyEnabled({ MEDICFLOW_ALLOW_PII_EXTERNAL_AI: "TRUE" }), false);
    assert.equal(isExternalAiPiiPolicyEnabled({ MEDICFLOW_ALLOW_PII_EXTERNAL_AI: "false" }), false);
    assert.equal(isExternalAiPiiPolicyEnabled({ MEDICFLOW_ALLOW_PII_EXTERNAL_AI: "true" }), true);
  });
});

describe("pii-external-ai-gate — evaluateExternalAiPiiGate", () => {
  it("grupo não sensível: sempre permitido, independente da política", () => {
    const decision = evaluateExternalAiPiiGate({ group: "operadora" }, {});
    assert.equal(decision.allowed, true);
    assert.equal(decision.reason, null);
  });

  it("grupo sensível sem política: bloqueado com motivo explícito citando o grupo", () => {
    const decision = evaluateExternalAiPiiGate({ group: "paciente" }, {});
    assert.equal(decision.allowed, false);
    assert.match(decision.reason ?? "", /paciente/);
    assert.match(decision.reason ?? "", /MEDICFLOW_ALLOW_PII_EXTERNAL_AI/);
  });

  it("grupo sensível com política habilitada: permitido", () => {
    const decision = evaluateExternalAiPiiGate(
      { group: "diagnostico" },
      { MEDICFLOW_ALLOW_PII_EXTERNAL_AI: "true" },
    );
    assert.equal(decision.allowed, true);
    assert.equal(decision.reason, null);
  });
});

describe("redactSemanticFallbackDecisionsForMetadata", () => {
  function decision(overrides: Partial<SemanticFallbackDecision> = {}): SemanticFallbackDecision {
    return {
      fieldCode: "beneficiary_name",
      fieldLabel: "Nome do Beneficiário",
      originalConfidence: 0.3,
      triggered: true,
      skippedReason: null,
      newValue: "JOÃO DA SILVA",
      newConfidence: 0.9,
      applied: true,
      at: "2026-09-08T00:00:00.000Z",
      ...overrides,
    };
  }

  it("remove newValue mas preserva todos os outros campos", () => {
    const [redacted] = redactSemanticFallbackDecisionsForMetadata([decision()]);
    assert.ok(!("newValue" in redacted!));
    assert.equal(redacted!.fieldCode, "beneficiary_name");
    assert.equal(redacted!.newConfidence, 0.9);
    assert.equal(redacted!.applied, true);
    assert.equal(redacted!.at, "2026-09-08T00:00:00.000Z");
  });

  it("funciona com lista vazia e com múltiplas decisões", () => {
    assert.deepEqual(redactSemanticFallbackDecisionsForMetadata([]), []);
    const redacted = redactSemanticFallbackDecisionsForMetadata([
      decision({ fieldCode: "a" }),
      decision({ fieldCode: "b", newValue: null }),
    ]);
    assert.equal(redacted.length, 2);
    assert.ok(redacted.every((d) => !("newValue" in d)));
  });
});

describe("SEC-PII-01 — guardas de regressão estruturais", () => {
  it("ocr-service.ts não persiste mais ocrFullTextPreview em capture_sessions.metadata", () => {
    const src = readSrc("src/lib/capture/ocr/services/ocr-service.ts");
    assert.equal(/ocrFullTextPreview/.test(src), false);
  });

  it("semantic-fallback-service.ts redige newValue antes de persistir metadata", () => {
    const src = readSrc("src/lib/capture/ocr/services/semantic-fallback-service.ts");
    assert.match(src, /redactSemanticFallbackDecisionsForMetadata/);
  });

  it("StructuredFieldOcrOrigin não expõe mais lineText/wordTexts (duplicação de PII removida)", () => {
    const src = readSrc("src/lib/capture/parser/types/structured-guide.ts");
    const typeBlock = src.slice(src.indexOf("export type StructuredFieldOcrOrigin"));
    assert.equal(/lineText/.test(typeBlock.slice(0, 200)), false);
    assert.equal(/wordTexts/.test(typeBlock.slice(0, 200)), false);
  });

  it("field-extractor.ts não constrói mais ocrOrigin com lineText/wordTexts", () => {
    const src = readSrc("src/lib/capture/parser/engine/field-extractor.ts");
    assert.equal(/ocrOrigin[\s\S]{0,80}lineText/.test(src), false);
  });

  it("semantic-fallback.ts invoca o gate antes de recortar/chamar o provider", () => {
    const src = readSrc("src/lib/capture/ocr/fallback/semantic-fallback.ts");
    assert.match(src, /evaluateExternalAiPiiGate/);
    const gateIdx = src.indexOf("evaluateExternalAiPiiGate(field)");
    const cropIdx = src.indexOf("cropFieldRegion(imageBytes");
    assert.ok(gateIdx > -1 && cropIdx > -1 && gateIdx < cropIdx, "gate deve rodar antes do recorte/chamada ao provider");
  });

  it("migration SEC-PII-01 troca as 4 policies para self-or-manager e sanitiza histórico de forma idempotente", () => {
    const sql = readSrc("supabase/migrations/20260908090000_capture_pii_least_privilege.sql");
    for (const table of ["capture_sessions", "capture_fields", "capture_findings", "capture_corrections"]) {
      assert.match(sql, new RegExp(`DROP POLICY IF EXISTS ${table}_select_tenant`));
      assert.match(sql, new RegExp(`CREATE POLICY ${table}_select_self_or_manager`));
    }
    assert.match(sql, /is_operational_manager\(\)/);
    // não usa can_manage_billing() para leitura (decisão deliberada — ver comentário da migration)
    assert.equal(/FOR SELECT[\s\S]{0,200}can_manage_billing/.test(sql), false);
    // redação idempotente — guardada por WHERE, não incondicional
    assert.match(sql, /WHERE metadata \? 'ocrFullTextPreview'/);
    assert.match(sql, /jsonb_typeof\(metadata #> '\{semanticFallback,decisions\}'\) = 'array'/);
  });

  it("migration SEC-PII-01A/01C troca UPDATE das 5 tabelas com UPDATE policy para self-or-manager (sem can_manage_billing sozinho)", () => {
    const sql = readSrc("supabase/migrations/20260908090000_capture_pii_least_privilege.sql");
    for (const table of ["capture_sessions", "capture_documents", "capture_pages", "capture_fields", "capture_findings"]) {
      assert.match(sql, new RegExp(`DROP POLICY IF EXISTS ${table}_update_billing`));
      assert.match(sql, new RegExp(`CREATE POLICY ${table}_update_self_or_manager`));
    }
    // capture_corrections não tinha UPDATE policy — nada a trocar
    assert.equal(/capture_corrections_update/.test(sql), false);
    // nenhum bloco FOR UPDATE usa can_manage_billing() como único gate
    const updateBlocks = sql.match(/FOR UPDATE[\s\S]*?(?=CREATE POLICY|CREATE OR REPLACE FUNCTION|$)/g) ?? [];
    assert.ok(updateBlocks.length >= 5, "deve haver pelo menos 5 blocos FOR UPDATE");
    for (const block of updateBlocks) {
      assert.equal(/can_manage_billing/.test(block), false);
      assert.match(block, /is_operational_manager\(\)/);
      assert.match(block, /created_by = auth\.uid\(\)/);
    }
  });

  it("migration SEC-PII-01C corrige capture_documents/capture_pages, deixadas fora do hardening original", () => {
    const sql = readSrc("supabase/migrations/20260908090000_capture_pii_least_privilege.sql");
    for (const table of ["capture_documents", "capture_pages"]) {
      assert.match(sql, new RegExp(`DROP POLICY IF EXISTS ${table}_select_tenant`));
      assert.match(sql, new RegExp(`CREATE POLICY ${table}_select_self_or_manager`));
    }
  });

  it("migration cria trigger BEFORE UPDATE que impede troca de tenant_id/created_by nas 5 tabelas com UPDATE", () => {
    const sql = readSrc("supabase/migrations/20260908090000_capture_pii_least_privilege.sql");
    assert.match(sql, /CREATE OR REPLACE FUNCTION public\.trg_capture_ownership_immutable/);
    assert.match(sql, /NEW\.tenant_id IS DISTINCT FROM OLD\.tenant_id/);
    assert.match(sql, /NEW\.created_by IS DISTINCT FROM OLD\.created_by/);
    assert.match(sql, /USING ERRCODE = 'check_violation'/);
    for (const table of ["capture_sessions", "capture_documents", "capture_pages", "capture_fields", "capture_findings"]) {
      assert.match(sql, new RegExp(`CREATE TRIGGER ${table}_ownership_immutable`));
      assert.match(sql, new RegExp(`BEFORE UPDATE ON public\\.${table}`));
    }
  });

  it("migration SEC-PII-01C cria relationship guard (self-or-manager) para session_id/page_id/document_id", () => {
    const sql = readSrc("supabase/migrations/20260908090000_capture_pii_least_privilege.sql");
    // helpers SECURITY DEFINER, checam created_by explicitamente
    for (const helper of ["capture_session_owned_by_actor", "capture_page_owned_by_actor", "capture_document_owned_by_actor"]) {
      assert.match(sql, new RegExp(`CREATE OR REPLACE FUNCTION public\\.${helper}`));
      assert.match(sql, /SECURITY DEFINER/);
    }
    const relTables: Record<string, string[]> = {
      capture_documents: ["session_id"],
      capture_pages: ["session_id", "document_id"],
      capture_fields: ["session_id", "page_id"],
      capture_findings: ["session_id"],
    };
    for (const [table, columns] of Object.entries(relTables)) {
      assert.match(sql, new RegExp(`CREATE TRIGGER ${table}_relationship_guard`));
      assert.match(sql, new RegExp(`BEFORE UPDATE ON public\\.${table}`));
      const fnMatch = sql.match(
        new RegExp(`CREATE OR REPLACE FUNCTION public\\.trg_${table}_relationship_guard[\\s\\S]*?\\$\\$;`),
      );
      assert.ok(fnMatch, `função da trigger de ${table} deve existir`);
      const fnBody = fnMatch![0];
      for (const column of columns) {
        assert.match(fnBody, new RegExp(`NEW\\.${column} IS DISTINCT FROM OLD\\.${column}`));
      }
      assert.match(fnBody, /is_operational_manager\(\)/);
      assert.match(fnBody, /USING ERRCODE = 'check_violation'/);
    }
    // capture_fields.page_id é nullable — só valida quando o novo valor não é NULL
    const fieldsFnMatch = sql.match(/CREATE OR REPLACE FUNCTION public\.trg_capture_fields_relationship_guard[\s\S]*?\$\$;/);
    assert.match(fieldsFnMatch![0], /NEW\.page_id IS NOT NULL/);
  });
});
