/**
 * EPC-24E — Enterprise Runtime Final Cutover.
 *
 * Prova o pipeline oficial único:
 *   - getEnterpriseRuntime() como único entrypoint operacional
 *   - zero flags de Dual Path / fallback arquitetural
 *   - binding cobre OCR + Intake + Extraction + Decision + Review/XML/Bloco C
 *   - AER-GA03-A1 eliminada (singlePipeline = true)
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  CAPTURE_ENTERPRISE_RUNTIME_ENTRY,
  resolveCaptureEnterpriseRuntime,
} from "../../../src/lib/capture/enterprise/resolve-enterprise-runtime";
import { probeCaptureEnterpriseRuntimeBinding } from "../../../src/lib/capture/enterprise/capture-runtime-binding";
import { probeCaptureOcrViaEnterprise } from "../../../src/lib/capture/enterprise/process-ocr-via-enterprise";
import { coordinateBlocoCViaEnterprise } from "../../../src/lib/capture/enterprise/process-bloco-c-via-enterprise";
import {
  getEnterpriseRuntime,
  resetEnterpriseRuntimeForTests,
} from "../../../src/lib/enterprise/runtime";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "../../..");

function readSrc(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

describe("EPC-24E — Enterprise Runtime Final Cutover", () => {
  it("declara getEnterpriseRuntime como único entrypoint oficial", () => {
    assert.equal(CAPTURE_ENTERPRISE_RUNTIME_ENTRY, "getEnterpriseRuntime");
    resetEnterpriseRuntimeForTests();
    assert.equal(resolveCaptureEnterpriseRuntime(), getEnterpriseRuntime());
  });

  it("binding prova pipeline único (singlePipeline) cobrindo OCR e Ports", async () => {
    resetEnterpriseRuntimeForTests();
    const probe = await probeCaptureEnterpriseRuntimeBinding();
    assert.ok(probe, "probe de binding não deve falhar");
    assert.equal(probe.entry, "getEnterpriseRuntime");
    assert.equal(probe.singlePipeline, true);
    assert.equal(probe.ocrRuntimeOk, true);
    assert.equal(probe.orchestratorOk, true);
    assert.equal(probe.captureEngineOk, true);
    assert.equal(probe.documentIntakeRuntimeOk, true);
    assert.equal(probe.documentExtractionRuntimeOk, true);
    assert.equal(probe.auditRuntimeOk, true);
    assert.equal(probe.rulePackEngineOk, true);
    assert.equal(probe.qualityRuntimeOk, true);
    assert.equal(probe.autoFillRuntimeOk, true);
    assert.equal(probe.validationRuntimeOk, true);
    assert.equal(probe.xmlGenerationRuntimeOk, true);
    assert.equal(probe.xmlTissRuntimeOk, true);
    assert.equal(probe.workflowRuntimeOk, true);
    assert.equal(probe.batchRuntimeOk, true);
    assert.equal(probe.protocolRuntimeOk, true);
  });

  it("OCR operacional entra pelo composition root", async () => {
    resetEnterpriseRuntimeForTests();
    const probe = await probeCaptureOcrViaEnterprise();
    assert.ok(probe, "probe de OCR não deve falhar");
    assert.equal(probe.entry, "getEnterpriseRuntime");
    assert.equal(probe.ocrRuntimeOk, true);
    assert.equal(probe.captureEngineOk, true);
  });

  it("Bloco C retorna singlePipeline sem flags de fallback Dual Path", async () => {
    resetEnterpriseRuntimeForTests();
    const result = await coordinateBlocoCViaEnterprise({
      sessionId: "epc-24e-cutover",
      trigger: "probe",
    });
    assert.equal(result.viaEnterpriseRuntime, true);
    assert.equal(result.singlePipeline, true);
    assert.equal("blocoCFallback" in result, false);
  });

  it("gateways e Server Fns não expõem flags *Fallback de Dual Path", () => {
    const gatewayFiles = [
      "src/lib/capture/enterprise/process-parser-via-enterprise.ts",
      "src/lib/capture/enterprise/process-audit-via-enterprise.ts",
      "src/lib/capture/enterprise/process-contract-via-enterprise.ts",
      "src/lib/capture/enterprise/process-risk-via-enterprise.ts",
      "src/lib/capture/enterprise/process-correction-via-enterprise.ts",
      "src/lib/capture/enterprise/process-review-via-enterprise.ts",
      "src/lib/capture/enterprise/process-xml-via-enterprise.ts",
      "src/lib/capture/enterprise/process-bloco-c-via-enterprise.ts",
      "src/lib/capture/enterprise/process-ocr-via-enterprise.ts",
    ];

    for (const file of gatewayFiles) {
      const src = readSrc(file);
      assert.equal(
        /Fallback\s*:/.test(src),
        false,
        `${file} não deve declarar campos *Fallback (Dual Path)`,
      );
      assert.match(src, /getEnterpriseRuntime|resolveCaptureEnterpriseRuntime/);
    }
  });

  it("Server Fns de Captura/Review/TISS não importam engines legado diretamente", () => {
    const serverFiles = [
      "src/lib/capture/api/capture-server.ts",
      "src/lib/capture/api/review-server.ts",
      "src/lib/tiss/api/tiss-server.ts",
    ];
    const banned = [
      "ocr/services/ocr-service",
      "parser/services/tiss-parser-service",
      "audit/services/preventive-audit-service",
      "contract/services/contract-intelligence-service",
      "risk/services/glosa-risk-service",
      "correction/services/correction-assistant-service",
      "xml-export-service",
      "review/review-workspace-store",
    ];

    for (const file of serverFiles) {
      const src = readSrc(file);
      for (const pattern of banned) {
        assert.equal(
          src.includes(pattern),
          false,
          `${file} não deve importar engine legado diretamente (${pattern})`,
        );
      }
      assert.match(
        src,
        /ViaEnterprise|runCaptureOperationalPipelineBound|resolveCaptureEnterpriseRuntime|getEnterpriseRuntime/,
      );
    }
  });
});
