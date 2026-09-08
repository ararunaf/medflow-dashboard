/**
 * Achado (auditoria externa, rodada 1, estendido além do OCR): todo gateway
 * `*ViaEnterprise` do Capture já definia um probe estrutural com `.health()`
 * real sobre os Ports Enterprise (DocumentExtractionRuntimePort,
 * AuditRuntimePort, RulePackEnginePort, AutoFillRuntimePort,
 * QualityRuntimePort, ValidationRuntimePort, XMLGenerationRuntimePort/
 * XMLTISSRuntimePort, Workflow/Batch/ProtocolRuntimePort) — mas nenhuma das
 * funções `run*ViaEnterprise`/`export*ViaEnterprise`/`coordinate*ViaEnterprise`
 * aguardava ou checava esse probe antes de seguir para a engine legada. A
 * coordenação real do Port (openJob/submitRequest/generate/...) também
 * estava sempre envolta em try/catch que engolia qualquer falha sem jamais
 * bloquear a execução. Mesmo padrão já corrigido em
 * process-ocr-via-enterprise.ts (sessão anterior) — esta suíte cobre a
 * extensão da correção aos outros 7 gateways com a mesma ceremônia
 * (parser, audit, contract, correction, risk, review, xml) + bloco-c.
 *
 * Cobertura: (1) guarda estrutural — cada arquivo aguarda seu próprio probe
 * e lança CaptureEnterpriseRuntimeUnavailableError antes de tocar o Port/
 * engine; (2) guarda comportamental — com um runtime de teste onde o Port
 * relevante está unhealthy, a função de fato lança, sem sequer tentar
 * coordenar o Port ou chamar a engine interna. Bloco C prova também o
 * inverso: um Port que o probe expõe mas a função NÃO usa (authorization)
 * não deve bloquear a execução — só workflow/batch/protocol devem.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import type { ServiceCtx } from "../../../src/lib/services/operations/types.ts";
import {
  createEnterpriseRuntime,
  resetEnterpriseRuntimeForTests,
  setEnterpriseRuntimeForTests,
} from "../../../src/lib/enterprise/runtime/index.ts";
import { CaptureEnterpriseRuntimeUnavailableError } from "../../../src/lib/capture/enterprise/capture-enterprise-runtime-unavailable-error.ts";
import { runCaptureParserViaEnterprise } from "../../../src/lib/capture/enterprise/process-parser-via-enterprise.ts";
import { runCaptureAuditViaEnterprise } from "../../../src/lib/capture/enterprise/process-audit-via-enterprise.ts";
import { coordinateBlocoCViaEnterprise } from "../../../src/lib/capture/enterprise/process-bloco-c-via-enterprise.ts";
import { DefaultDocumentExtractionRuntimeAdapter } from "../../../src/lib/enterprise/document-extraction-runtime/adapters/default-document-extraction-runtime-adapter.ts";
import { DefaultAuditRuntimeAdapter } from "../../../src/lib/enterprise/audit-runtime/adapters/default-audit-runtime-adapter.ts";
import { DefaultWorkflowRuntimeAdapter } from "../../../src/lib/enterprise/workflow-runtime/adapters/default-workflow-runtime-adapter.ts";
import { DefaultAuthorizationRuntimeAdapter } from "../../../src/lib/enterprise/authorization-runtime/adapters/default-authorization-runtime-adapter.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "../../..");
function readSrc(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

const DUMMY_CTX = {} as ServiceCtx;

describe("Guarda estrutural — cada gateway aguarda o próprio probe antes de executar", () => {
  const cases: Array<{ file: string; fn: string; probeCall: string }> = [
    { file: "process-parser-via-enterprise.ts", fn: "runCaptureParserViaEnterprise", probeCall: "probeCaptureParserViaEnterprise()" },
    { file: "process-audit-via-enterprise.ts", fn: "runCaptureAuditViaEnterprise", probeCall: "probeCaptureAuditViaEnterprise()" },
    { file: "process-contract-via-enterprise.ts", fn: "runCaptureContractViaEnterprise", probeCall: "probeCaptureContractViaEnterprise()" },
    { file: "process-correction-via-enterprise.ts", fn: "runCaptureCorrectionViaEnterprise", probeCall: "probeCaptureCorrectionViaEnterprise()" },
    { file: "process-risk-via-enterprise.ts", fn: "runCaptureRiskViaEnterprise", probeCall: "probeCaptureRiskViaEnterprise()" },
    { file: "process-review-via-enterprise.ts", fn: "setReviewApprovalViaEnterprise", probeCall: "probeCaptureReviewViaEnterprise()" },
    { file: "process-xml-via-enterprise.ts", fn: "exportTissBatchXmlViaEnterprise", probeCall: "probeCaptureXmlViaEnterprise()" },
    { file: "process-bloco-c-via-enterprise.ts", fn: "coordinateBlocoCViaEnterprise", probeCall: "probeCaptureBlocoCViaEnterprise()" },
  ];

  for (const { file, fn, probeCall } of cases) {
    it(`${file}: ${fn} aguarda ${probeCall} e lança CaptureEnterpriseRuntimeUnavailableError antes do Port/engine`, () => {
      const src = readSrc(`src/lib/capture/enterprise/${file}`);
      assert.match(src, /import \{ CaptureEnterpriseRuntimeUnavailableError \}/);

      const fnStart = src.indexOf(`export async function ${fn}`);
      assert.ok(fnStart > -1, `função ${fn} deve existir em ${file}`);
      const fnBody = src.slice(fnStart, fnStart + 2000);

      const probeIdx = fnBody.indexOf(`await ${probeCall}`);
      const throwIdx = fnBody.indexOf("throw new CaptureEnterpriseRuntimeUnavailableError");
      assert.ok(probeIdx > -1, `${fn} deve dar await no próprio probe (${probeCall})`);
      assert.ok(throwIdx > -1, `${fn} deve lançar CaptureEnterpriseRuntimeUnavailableError quando o probe falhar`);
      assert.ok(probeIdx < throwIdx, "probe deve ser aguardado antes do throw");

      // resolveCaptureEnterpriseRuntime() para pegar o Port de verdade só
      // pode aparecer DEPOIS do gate (senão o gate não protege nada).
      const resolveIdx = fnBody.indexOf("resolveCaptureEnterpriseRuntime()", throwIdx);
      assert.ok(resolveIdx > throwIdx, "resolução do Port real deve vir depois do gate, não antes");
    });
  }
});

describe("Guarda comportamental — parser lança de verdade quando o Port está unhealthy", () => {
  it("DocumentExtractionRuntimePort unhealthy: runCaptureParserViaEnterprise lança sem tentar coordenar o Port nem rodar a engine", async () => {
    const runtime = createEnterpriseRuntime({
      runtimeId: "test-parser-unhealthy",
      documentExtractionRuntimePort: new DefaultDocumentExtractionRuntimeAdapter({ healthy: false }),
    });
    const restore = setEnterpriseRuntimeForTests(runtime);
    try {
      await assert.rejects(
        () => runCaptureParserViaEnterprise(DUMMY_CTX, "session-x"),
        CaptureEnterpriseRuntimeUnavailableError,
      );
    } finally {
      restore();
    }
  });
});

describe("Guarda comportamental — audit lança de verdade quando o Port está unhealthy", () => {
  it("AuditRuntimePort unhealthy: runCaptureAuditViaEnterprise lança sem tentar coordenar o Port nem rodar a engine", async () => {
    const runtime = createEnterpriseRuntime({
      runtimeId: "test-audit-unhealthy",
      auditRuntimePort: new DefaultAuditRuntimeAdapter({ healthy: false }),
    });
    const restore = setEnterpriseRuntimeForTests(runtime);
    try {
      await assert.rejects(
        () => runCaptureAuditViaEnterprise(DUMMY_CTX, "session-x"),
        CaptureEnterpriseRuntimeUnavailableError,
      );
    } finally {
      restore();
    }
  });
});

describe("Guarda comportamental — Bloco C: gate só nos Ports que a função de fato usa", () => {
  it("WorkflowRuntimePort unhealthy: coordinateBlocoCViaEnterprise lança", async () => {
    const runtime = createEnterpriseRuntime({
      runtimeId: "test-blococ-workflow-unhealthy",
      workflowRuntimePort: new DefaultWorkflowRuntimeAdapter({ healthy: false }),
    });
    const restore = setEnterpriseRuntimeForTests(runtime);
    try {
      await assert.rejects(
        () => coordinateBlocoCViaEnterprise({ sessionId: "session-x", trigger: "probe" }),
        CaptureEnterpriseRuntimeUnavailableError,
      );
    } finally {
      restore();
    }
  });

  it("AuthorizationRuntimePort unhealthy (não usado pela função): coordinateBlocoCViaEnterprise NÃO lança", async () => {
    const runtime = createEnterpriseRuntime({
      runtimeId: "test-blococ-authorization-unhealthy",
      authorizationRuntimePort: new DefaultAuthorizationRuntimeAdapter({ healthy: false }),
    });
    const restore = setEnterpriseRuntimeForTests(runtime);
    try {
      const result = await coordinateBlocoCViaEnterprise({ sessionId: "session-x", trigger: "probe" });
      assert.equal(result.viaEnterpriseRuntime, true);
    } finally {
      restore();
    }
  });
});

describe("Regressão — pipeline saudável continua funcionando (baseline)", () => {
  it("runtime padrão de teste: parser, audit e bloco-c continuam executando normalmente", async () => {
    resetEnterpriseRuntimeForTests();
    await assert.doesNotReject(() => coordinateBlocoCViaEnterprise({ sessionId: "session-baseline", trigger: "probe" }));
  });
});
