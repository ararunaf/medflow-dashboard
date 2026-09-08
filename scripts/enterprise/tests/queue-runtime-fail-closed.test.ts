/**
 * P1-01 — Queue Runtime fail-closed em produção/staging.
 *
 * Achado (auditoria externa, rodada 1): src/lib/server/queue-runtime-backend.ts
 * caía silenciosamente para memory sempre que a config pública Supabase ou o
 * admin client não estivessem disponíveis — inclusive em build de produção,
 * onde a Queue deixaria de ser durável sem nenhum sinal disso (o app
 * continuaria de pé, "saudável", mas sem garantia de persistência de fila).
 *
 * import.meta.env só existe dentro do bundle Vite — sob o test runner tsx
 * deste projeto ele é `undefined` (confirmado: acessar .PROD nesse contexto
 * lança). Por isso a decisão de fail-closed foi extraída como função pura
 * (shouldFailClosedForMemoryQueue), testável sem depender de import.meta —
 * o ponto de leitura real de import.meta.env.PROD (via validatePublicEnv())
 * só roda dentro do bundle real, não é exercitado aqui.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  isExplicitMemoryOverride,
  shouldFailClosedForMemoryQueue,
  QueueRuntimeProductionMisconfiguredError,
} from "../../../src/lib/server/queue-runtime-backend.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "../../..");
function readSrc(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

describe("isExplicitMemoryOverride — só process.env, sem import.meta", () => {
  it("'memory' (qualquer caixa) habilita o override", () => {
    assert.equal(isExplicitMemoryOverride({ MEDICFLOW_QUEUE_RUNTIME_BACKEND: "memory" }), true);
    assert.equal(isExplicitMemoryOverride({ MEDICFLOW_QUEUE_RUNTIME_BACKEND: "MEMORY" }), true);
    assert.equal(isExplicitMemoryOverride({ MEDICFLOW_QUEUE_RUNTIME_BACKEND: "  memory  " }), true);
  });

  it("ausente, vazio, 'supabase' ou qualquer outro valor não habilita", () => {
    assert.equal(isExplicitMemoryOverride({}), false);
    assert.equal(isExplicitMemoryOverride({ MEDICFLOW_QUEUE_RUNTIME_BACKEND: "" }), false);
    assert.equal(isExplicitMemoryOverride({ MEDICFLOW_QUEUE_RUNTIME_BACKEND: "supabase" }), false);
    assert.equal(isExplicitMemoryOverride({ MEDICFLOW_QUEUE_RUNTIME_BACKEND: "true" }), false);
  });
});

describe("shouldFailClosedForMemoryQueue — decisão pura de fail-closed", () => {
  it("produção sem override: falha fechado (true)", () => {
    assert.equal(
      shouldFailClosedForMemoryQueue({ isProductionBuild: true, explicitMemoryOverride: false }),
      true,
    );
  });

  it("produção com override explícito: permite memory (false)", () => {
    assert.equal(
      shouldFailClosedForMemoryQueue({ isProductionBuild: true, explicitMemoryOverride: true }),
      false,
    );
  });

  it("fora de produção (dev), com ou sem override: nunca falha fechado", () => {
    assert.equal(
      shouldFailClosedForMemoryQueue({ isProductionBuild: false, explicitMemoryOverride: false }),
      false,
    );
    assert.equal(
      shouldFailClosedForMemoryQueue({ isProductionBuild: false, explicitMemoryOverride: true }),
      false,
    );
  });
});

describe("QueueRuntimeProductionMisconfiguredError", () => {
  it("mensagem explica o bloqueio e como liberar via override", () => {
    const err = new QueueRuntimeProductionMisconfiguredError();
    assert.match(err.message, /fail-closed/i);
    assert.match(err.message, /MEDICFLOW_QUEUE_RUNTIME_BACKEND=memory/);
    assert.equal(err.name, "QueueRuntimeProductionMisconfiguredError");
    assert.ok(err instanceof Error);
  });
});

describe("P1-01 — guarda de regressão estrutural", () => {
  it("createServerQueueRuntimeBackend usa shouldFailClosedForMemoryQueue antes de degradar para memory", () => {
    const src = readSrc("src/lib/server/queue-runtime-backend.ts");
    assert.match(src, /shouldFailClosedForMemoryQueue/);
    assert.match(src, /throw new QueueRuntimeProductionMisconfiguredError/);

    const fnBody = src.slice(src.indexOf("export function createServerQueueRuntimeBackend"));
    const failClosedIdx = fnBody.indexOf("shouldFailClosedForMemoryQueue(");
    const preferMemoryIdx = fnBody.indexOf("createQueueRuntimeBackend({ preferMemory: true })");
    assert.ok(
      failClosedIdx > -1 && preferMemoryIdx > -1 && failClosedIdx < preferMemoryIdx,
      "a checagem de fail-closed deve rodar antes de cair para o backend memory",
    );
  });

  it("usa isProductionBuild de validatePublicEnv() — mesmo helper já usado em src/lib/env/startup-checks.ts", () => {
    const src = readSrc("src/lib/server/queue-runtime-backend.ts");
    assert.match(src, /validatePublicEnv\(\)\.isProductionBuild/);
  });
});
