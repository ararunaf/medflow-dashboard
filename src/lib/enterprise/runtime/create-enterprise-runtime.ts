/**
 * Factory / singleton do Enterprise Runtime — ARCH-01.
 *
 * Produto resolve a Foundation exclusivamente via getEnterpriseRuntime().
 * Nunca instancia Adapters concretos fora deste composition root.
 */
import { DefaultEnterpriseRuntime } from "./enterprise-runtime";
import type { EnterpriseRuntime, EnterpriseRuntimeOptions } from "./types";

let sharedRuntime: EnterpriseRuntime | undefined;

/**
 * Cria uma instância isolada do Enterprise Runtime.
 * Preferir getEnterpriseRuntime() no produto; use create* em testes.
 */
export function createEnterpriseRuntime(options: EnterpriseRuntimeOptions = {}): EnterpriseRuntime {
  return new DefaultEnterpriseRuntime(options);
}

/**
 * Runtime compartilhado do processo — ponto único de acesso do produto.
 */
export function getEnterpriseRuntime(): EnterpriseRuntime {
  if (!sharedRuntime) {
    sharedRuntime = createEnterpriseRuntime({ runtimeId: "default" });
  }
  return sharedRuntime;
}

/**
 * Substitui o runtime compartilhado (testes). Retorna função de restore.
 */
export function setEnterpriseRuntimeForTests(runtime: EnterpriseRuntime | undefined): () => void {
  const previous = sharedRuntime;
  sharedRuntime = runtime;
  return () => {
    sharedRuntime = previous;
  };
}

/** Limpa o singleton (testes). */
export function resetEnterpriseRuntimeForTests(): void {
  sharedRuntime = undefined;
}
