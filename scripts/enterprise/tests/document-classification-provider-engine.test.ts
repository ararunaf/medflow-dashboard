#!/usr/bin/env node
/**
 * CLASS-01 — Document Classification Provider
 * Prova: Application → DocumentClassificationProviderPort → Adapter → Factory → Registry
 *         + Classification Runtime + Enterprise Runtime + Capture Runtime + OCR Runtime
 *         + Canonical Execution Orchestrator + CanonicalDocumentClassificationResult
 *         + timeout / retry / cancelamento / erros
 *         + ausência de IA / ML / embeddings / bypass
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILTIN_DOCUMENT_CLASSIFICATION_PROVIDER_COUNT,
  DEFAULT_DOCUMENT_CLASSIFICATION_ADAPTER_ID,
  DEFAULT_DOCUMENT_CLASSIFICATION_RULES,
  DEFAULT_RULE_BASED_CLASSIFICATION_CAPABILITIES,
  DefaultDocumentClassificationAdapter,
  DocumentClassificationProviderFactory,
  DocumentClassificationProviderRegistry,
  MOCK_DOCUMENT_CLASSIFICATION_ADAPTER_ID,
  MockDocumentClassificationAdapter,
  RuleBasedDocumentClassificationAdapter,
  createDefaultDocumentClassificationProviderRegistry,
  createDocumentClassificationProviderFactory,
  createDocumentClassificationProviderPort,
  getDocumentClassificationProviderFactory,
  getDocumentClassificationProviderHealthSummary,
  type DocumentClassificationProviderPort,
} from "../../../src/lib/enterprise/document-classification-provider/index.ts";
import { createDocumentClassificationRuntimePort } from "../../../src/lib/enterprise/document-classification-runtime/index.ts";
import { createOCRProviderPort } from "../../../src/lib/enterprise/ocr-provider/index.ts";
import { createOCRRuntimePort } from "../../../src/lib/enterprise/ocr-runtime/index.ts";
import { createCanonicalExecutionOrchestratorPort } from "../../../src/lib/enterprise/canonical-execution-orchestrator/index.ts";
import {
  createEnterpriseRuntime,
  resetEnterpriseRuntimeForTests,
} from "../../../src/lib/enterprise/runtime/index.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "../../..");

const FORBIDDEN_AI_TOKENS = [
  "openai",
  "azure openai",
  "gemini",
  "claude",
  "anthropic",
  "embedding",
  "langchain",
  "huggingface",
  "tensorflow",
];

function collectTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...collectTsFiles(full));
    else if (entry.endsWith(".ts")) out.push(full);
  }
  return out;
}

describe("CLASS-01 DocumentClassificationProviderPort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: DocumentClassificationProviderPort = new MockDocumentClassificationAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.status, "ready");

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_DOCUMENT_CLASSIFICATION_ADAPTER_ID);
    assert.equal(caps.supportsCanonicalResult, true);
    assert.equal(caps.implementsAi, false);
    assert.equal(caps.implementsLlm, false);
  });

  it("DefaultDocumentClassificationAdapter é o adapter rule-based oficial", () => {
    assert.equal(RuleBasedDocumentClassificationAdapter, DefaultDocumentClassificationAdapter);
    const port = new DefaultDocumentClassificationAdapter({ provider: "rule-based" });
    assert.equal(port.providerId, "rule-based");
    assert.equal(port.capabilities().adapterId, DEFAULT_DOCUMENT_CLASSIFICATION_ADAPTER_ID);
  });

  it("createDocumentClassificationProviderPort default resolve rule-based", async () => {
    const port = createDocumentClassificationProviderPort();
    assert.equal(port.providerId, "rule-based");
    const validation = await port.validateConfiguration();
    assert.equal(validation.ok, true);
    assert.equal(validation.errors.length, 0);
  });

  it("test / default / mock são resolvidos pelo factory", async () => {
    assert.equal(createDocumentClassificationProviderPort({ provider: "test" }).providerId, "test");
    assert.equal(
      createDocumentClassificationProviderPort({ provider: "default" }).providerId,
      "default",
    );
    assert.equal(createDocumentClassificationProviderPort({ provider: "mock" }).providerId, "mock");
    assert.equal((await createDocumentClassificationProviderPort({ provider: "mock" }).health()).ok, true);
  });

  it("classify rule-based produz tipos documentais a partir do OCR text", async () => {
    const port = new DefaultDocumentClassificationAdapter({ provider: "rule-based" });

    const guia = await port.classify({
      requestId: "req-guia",
      ocrText: "Guia TISS consulta — número da guia ANS 998877",
    });
    assert.equal(guia.ok, true);
    assert.equal(guia.documentType, "guia-tiss");
    assert.ok(guia.confidence > 0.5);
    assert.ok(guia.matchedRules.includes("rule-guia-tiss"));
    assert.equal(guia.telemetry.cancelled, false);

    const financeiro = await port.classify({
      ocrText: "Nota fiscal e boleto de pagamento — valor total R$ 1200",
    });
    assert.equal(financeiro.documentType, "documento-financeiro");

    const unknown = await port.classify({ ocrText: "conteudo sem palavras chave" });
    assert.equal(unknown.documentType, "documento-desconhecido");
  });

  it("regras configuráveis podem sobrescrever o ruleset default", async () => {
    const port = new DefaultDocumentClassificationAdapter();
    const result = await port.classify({
      ocrText: "token-customizado-xyz",
      rules: [
        {
          id: "custom-1",
          documentType: "laudo",
          keywords: ["token-customizado-xyz"],
          weight: 200,
        },
      ],
    });
    assert.equal(result.ok, true);
    assert.equal(result.documentType, "laudo");
    assert.deepEqual(result.matchedRules, ["custom-1"]);
  });

  it("timeout é implementado e retorna CLASSIFICATION_TIMEOUT", async () => {
    const port = new DefaultDocumentClassificationAdapter({
      defaultTimeoutMs: 20,
      defaultRetryCount: 0,
    });
    const result = await port.classify({
      ocrText: "Guia TISS",
      timeoutMs: 20,
      retryCount: 0,
      attributes: { forceDelayMs: 200 },
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "CLASSIFICATION_TIMEOUT");
  });

  it("retry recupera falha transitória", async () => {
    const port = new DefaultDocumentClassificationAdapter({
      failAttempts: 1,
      defaultRetryCount: 2,
      defaultRetryBackoffMs: 1,
    });
    const result = await port.classify({
      ocrText: "Laudo médico — conclusão diagnóstica",
      retryCount: 2,
    });
    assert.equal(result.ok, true);
    assert.equal(result.documentType, "laudo");
    assert.ok(result.telemetry.attempts >= 2);
  });

  it("cancelamento via AbortSignal retorna CLASSIFICATION_CANCELLED", async () => {
    const port = new DefaultDocumentClassificationAdapter();
    const controller = new AbortController();
    controller.abort();
    const result = await port.classify({
      ocrText: "Guia TISS",
      signal: controller.signal,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "CLASSIFICATION_CANCELLED");
    assert.equal(result.telemetry.cancelled, true);
  });

  it("tratamento de erro para provider unhealthy", async () => {
    const port = new DefaultDocumentClassificationAdapter({ healthy: false });
    const result = await port.classify({ ocrText: "Guia TISS" });
    assert.equal(result.ok, false);
    assert.equal(result.code, "CLASSIFICATION_UNHEALTHY");
  });

  it("Registry e Factory seguem ECS-01 (sem fallback silencioso)", () => {
    const registry = createDefaultDocumentClassificationProviderRegistry();
    assert.ok(registry instanceof DocumentClassificationProviderRegistry);
    assert.equal(registry.snapshot().count, BUILTIN_DOCUMENT_CLASSIFICATION_PROVIDER_COUNT);
    assert.equal(registry.has("rule-based"), true);

    const factory = createDocumentClassificationProviderFactory({ registry });
    assert.ok(factory instanceof DocumentClassificationProviderFactory);
    assert.equal(factory.create({ provider: "rule-based" }).providerId, "rule-based");

    assert.throws(
      () =>
        factory.create({
          // @ts-expect-error — provider inválido
          provider: "openai-classifier",
        }),
      /não está registrado|desconhecido/,
    );

    assert.equal(getDocumentClassificationProviderFactory().getRegistry().has("mock"), true);
    assert.ok(DEFAULT_DOCUMENT_CLASSIFICATION_RULES.length >= 6);
    assert.equal(DEFAULT_RULE_BASED_CLASSIFICATION_CAPABILITIES.supportsRuleBased, true);
  });

  it("demo health summary depende apenas do Port", async () => {
    const port = createDocumentClassificationProviderPort({ provider: "rule-based" });
    const summary = await getDocumentClassificationProviderHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.info.providerType, "DOCUMENT_CLASSIFICATION");
    assert.equal(summary.capabilities.implementsAi, false);
  });
});

describe("CLASS-01 cadeia Enterprise / Capture / OCR / Classification / Orchestrator", () => {
  it("Enterprise Runtime expõe Classification Provider + Runtime", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    assert.equal(runtime.getDocumentClassificationProviderPort().providerId, "rule-based");
    assert.equal(runtime.getDocumentClassificationRuntimePort().providerId, "default");
    assert.equal(
      runtime.getDocumentClassificationRuntimePort().capabilities().implementsRealClassification,
      true,
    );

    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.documentClassificationProviderOk, true);
    assert.equal(health.documentClassificationRuntimeOk, true);
    assert.equal(health.ocrRuntimeOk, true);
    assert.equal(health.captureEngineRuntimeOk, true);
    assert.equal(health.orchestratorOk, true);
  });

  it("fluxo: Runtime → Classification Runtime → ProviderPort → Canonical Result", async () => {
    const orchestrator = createCanonicalExecutionOrchestratorPort({ provider: "mock" });
    const ocrProvider = createOCRProviderPort({ provider: "mock" });
    const ocrRuntime = createOCRRuntimePort({
      provider: "default",
      enterpriseDeps: {
        getOrchestratorPort: () => orchestrator,
        getOCRProviderPort: () => ocrProvider,
      },
    });
    const classificationProvider = createDocumentClassificationProviderPort({
      provider: "rule-based",
    });
    const classificationRuntime = createDocumentClassificationRuntimePort({
      provider: "default",
      enterpriseDeps: {
        getOrchestratorPort: () => orchestrator,
        getOCRRuntimePort: () => ocrRuntime,
        getDocumentClassificationProviderPort: () => classificationProvider,
      },
    });

    const result = await classificationRuntime.classify({
      ocrText: "Solicitação de exame — autorização prévia",
      documentId: "doc-chain",
      sessionId: "sess-chain",
    });

    assert.equal(result.kind, "canonical-document-classification-result");
    assert.equal(result.ok, true);
    assert.equal(result.realClassificationExecuted, true);
    assert.equal(result.documentType, "solicitacao");
    assert.ok(result.runtimeSessionId);
    assert.ok(result.telemetry);

    const session = await classificationRuntime.getSession({
      runtimeSessionId: result.runtimeSessionId!,
    });
    assert.equal(session.ok, true);
    assert.equal(session.session?.status, "completed");
  });

  it("Capture Runtime continua coordenando; OCR Runtime permanece desacoplado", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({
      runtimeId: "test",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
      documentClassificationProviderPort: createDocumentClassificationProviderPort({
        provider: "rule-based",
      }),
    });

    const captureCaps = runtime.getCaptureEngineRuntimePort().capabilities();
    assert.equal(captureCaps.usesDocumentClassificationRuntime, true);
    assert.equal(captureCaps.usesOCRRuntime, true);
    assert.equal(captureCaps.implementsClassification, false);

    const ocrCaps = runtime.getOCRRuntimePort().capabilities();
    assert.equal(ocrCaps.implementsClassification, false);
    assert.equal(ocrCaps.implementsAi, false);

    const register = await runtime.registerCaptureDocumentIntake({
      sessionId: "sess-class-01-capture",
      documentId: "doc-class-01-capture",
      storagePath: "tenant/sess-class-01-capture/original.pdf",
      tenantRef: "tenant-1",
      correlationId: "corr-class-01",
      channel: "file_upload",
    });
    assert.equal(register.ok, true);
    assert.ok(register.classificationRuntimeSessionId);

    const classificationSession = await runtime.getDocumentClassificationRuntimePort().getSession({
      runtimeSessionId: register.classificationRuntimeSessionId!,
    });
    assert.equal(classificationSession.ok, true);
    assert.equal(classificationSession.session?.status, "coordinated");
    assert.equal(classificationSession.session?.realClassificationExecuted, false);
    assert.equal(
      classificationSession.session?.providerReferenceId,
      "rule-based-classifier",
    );
  });

  it("Canonical Execution Orchestrator permanece no caminho de classify()", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({
      runtimeId: "test",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
    });
    const result = await runtime.getDocumentClassificationRuntimePort().classify({
      ocrText: "Prontuário — evolução clínica e anamnese",
      documentId: "doc-orch",
      sessionId: "sess-orch",
    });
    assert.equal(result.ok, true);
    assert.equal(result.documentType, "prontuario");
    if (result.executionId) {
      const exec = await runtime.getOrchestratorPort().getExecution({
        executionId: result.executionId,
      });
      assert.equal(exec.ok, true);
    }
  });
});

describe("CLASS-01 auditoria — sem IA / sem bypass", () => {
  it("módulo document-classification-provider não contém IA/HTTP/bypass", () => {
    const moduleDir = join(repoRoot, "src/lib/enterprise/document-classification-provider");
    const files = collectTsFiles(moduleDir);
    assert.ok(files.length > 0);

    const forbidden = [
      /from ["']openai/i,
      /from ["']@openai/i,
      /from ["']anthropic/i,
      /@tensorflow\//i,
      /langchain/i,
      /createEmbedding\s*\(/i,
      /fetch\s*\(/,
      /https?:\/\//,
      /documentintelligence\.azure\.com/i,
      /api\.openai\.com/i,
    ];

    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const pattern of forbidden) {
        assert.equal(
          pattern.test(source),
          false,
          `Padrão proibido ${pattern} em ${file}`,
        );
      }
      for (const token of FORBIDDEN_AI_TOKENS) {
        if (token === "embedding") continue; // aparece só em flags implementsEmbeddings: false
        assert.equal(
          source.toLowerCase().includes(`from "${token}`),
          false,
          `Import proibido ${token} em ${file}`,
        );
      }
    }
  });

  it("não existe classificação fora do DocumentClassificationProviderPort na cadeia Enterprise", () => {
    const captureAdapter = readFileSync(
      join(
        repoRoot,
        "src/lib/enterprise/capture-engine-runtime/adapters/default-capture-engine-runtime-adapter.ts",
      ),
      "utf8",
    );
    assert.match(captureAdapter, /getDocumentClassificationRuntimePort/);
    assert.match(captureAdapter, /\.classify\(/);
    assert.equal(/createDocumentClassificationProviderPort/.test(captureAdapter), false);
    assert.equal(/DefaultDocumentClassificationAdapter/.test(captureAdapter), false);

    const enterpriseRuntime = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.match(enterpriseRuntime, /createDocumentClassificationProviderPort/);
    assert.match(enterpriseRuntime, /getDocumentClassificationProviderPort/);
  });
});
