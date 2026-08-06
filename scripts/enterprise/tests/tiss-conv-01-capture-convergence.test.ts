/**
 * TISS-CONV-01 — Convergência Capture → Enterprise Foundation.
 *
 * Garante:
 * - Capture não possui TUSS_CATALOG hardcoded
 * - Conhecimento via Enterprise Runtime → TISS Runtime → Catalog + RulePackEngine
 * - Comportamento de membership/autorização preservado
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it, before, after } from "node:test";
import { fileURLToPath } from "node:url";

import {
  ensureCaptureTissKnowledge,
  getCaptureTissKnowledgeSnapshot,
  isTussInCatalogFromEnterprise,
  resetCaptureTissKnowledgeForTests,
  toCatalogGuideTypeCode,
  tussRequiresAuthorizationFromEnterprise,
} from "../../../src/lib/capture/enterprise/tiss-knowledge-gateway.ts";
import {
  isTussInCatalog,
  tussRequiresAuthorization,
} from "../../../src/lib/capture/audit/data/tuss-catalog.ts";
import { ALL_TEMPLATES } from "../../../src/lib/capture/parser/templates/index.ts";
import {
  resetEnterpriseRuntimeForTests,
  getEnterpriseRuntime,
} from "../../../src/lib/enterprise/runtime/index.ts";
import { BASE_PROCEDURE_AUTHORIZATION_PACK_CODE } from "../../../src/lib/enterprise/rule-pack-engine/index.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "../../..");

function walkTsFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist") continue;
      walkTsFiles(full, acc);
    } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
      acc.push(full);
    }
  }
  return acc;
}

describe("TISS-CONV-01 — Capture → Enterprise Foundation", () => {
  before(async () => {
    resetCaptureTissKnowledgeForTests();
    resetEnterpriseRuntimeForTests();
    await ensureCaptureTissKnowledge();
  });

  after(() => {
    resetCaptureTissKnowledgeForTests();
    resetEnterpriseRuntimeForTests();
  });

  it("hidrata snapshot exclusivamente via Enterprise Runtime + Ports", async () => {
    const snap = getCaptureTissKnowledgeSnapshot();
    assert.equal(snap.source.viaEnterpriseRuntime, true);
    assert.equal(snap.source.viaTISSRuntimePort, true);
    assert.equal(snap.source.viaTISSCatalogPort, true);
    assert.equal(snap.source.viaRulePackEnginePort, true);
    assert.ok(snap.procedureCodes.size >= 12);
    assert.ok(snap.authorizationRequiredCodes.size >= 7);
    assert.ok(snap.guideTypeCodes.has("guia-consulta"));
    assert.ok(snap.guideTypeCodes.has("guia-sadt"));
    assert.ok(snap.guideTypeCodes.has("guia-honorario"));
    assert.match(snap.versionLabel, /TISS\s+4\.01\.00/);
  });

  it("preserva membership TUSS (comportamento Capture)", () => {
    assert.equal(isTussInCatalog("10101012"), true);
    assert.equal(isTussInCatalogFromEnterprise("10101012"), true);
    assert.equal(isTussInCatalog("99999999"), false);
  });

  it("preserva política de autorização via RulePackEnginePort", () => {
    assert.equal(tussRequiresAuthorization("40101010"), true);
    assert.equal(tussRequiresAuthorizationFromEnterprise("40801063"), true);
    assert.equal(tussRequiresAuthorization("10101012"), false);
  });

  it("templates parser apontam para códigos canônicos do Catalog", () => {
    for (const template of ALL_TEMPLATES) {
      assert.ok(template.catalogGuideTypeCode);
      assert.equal(template.catalogGuideTypeCode, toCatalogGuideTypeCode(template.guideType));
      assert.ok(
        getCaptureTissKnowledgeSnapshot().guideTypeCodes.has(template.catalogGuideTypeCode),
        `guide type ${template.catalogGuideTypeCode} deve existir no Catalog`,
      );
    }
  });

  it("RulePackEnginePort executa pack de autorização", async () => {
    const engine = getEnterpriseRuntime().getRulePackEnginePort();
    const result = await engine.executePack({ code: BASE_PROCEDURE_AUTHORIZATION_PACK_CODE });
    assert.equal(result.ok, true);
    assert.ok((result.result?.rulesMatched ?? 0) >= 7);
  });

  it("Capture audit data não contém Set hardcoded de TUSS_CATALOG", () => {
    const source = readFileSync(
      join(repoRoot, "src/lib/capture/audit/data/tuss-catalog.ts"),
      "utf8",
    );
    assert.equal(/TUSS_CATALOG\s*[:=]\s*new Set/.test(source), false);
    assert.equal(/"10101012"/.test(source), false);
    assert.equal(/TUSS_REQUIRES_AUTH/.test(source), false);
    assert.match(source, /tiss-knowledge-gateway/);
    assert.match(source, /TISS-CONV-01/);
  });

  it("nenhum bypass de store TISS no produto Capture", () => {
    const captureRoot = join(repoRoot, "src/lib/capture");
    const offenders: string[] = [];
    for (const file of walkTsFiles(captureRoot)) {
      const source = readFileSync(file, "utf8");
      if (/InMemoryTISSCatalog|getStore\(\)/.test(source) && !file.includes("node_modules")) {
        // gateway não deve usar store
        if (!/\/\/.*getStore/.test(source)) {
          offenders.push(file.replace(repoRoot, ""));
        }
      }
      if (/from ["'].*tiss-catalog\/store/.test(source)) {
        offenders.push(file.replace(repoRoot, ""));
      }
    }
    assert.deepEqual(offenders, []);
  });

  it("cadeia oficial TISS Runtime health ok", async () => {
    const health = await getEnterpriseRuntime().getTISSRuntimePort().health();
    assert.equal(health.ok, true);
    assert.equal(health.tissCatalogOk, true);
    assert.equal(health.rulePackEngineOk, true);
  });
});
