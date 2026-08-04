/**
 * AIOrchestrationRuntimeProvider — factory pública do AIOrchestrationRuntimePort (F3-CAP-09).
 *
 * Application / Enterprise Runtime resolvem o Port via este factory;
 * nunca instanciam adapters de vendor diretamente no Domain.
 */
import {
  AIOrchestrationRuntimeFactory,
  createAIOrchestrationRuntimeFactory,
} from "../factory/ai-orchestration-runtime-factory";
import type { AIOrchestrationRuntimePort } from "../ports/ai-orchestration-runtime-port";
import type { AIOrchestrationRuntimeOptions } from "../ports/types";

let sharedFactory: AIOrchestrationRuntimeFactory | undefined;

function getSharedFactory(): AIOrchestrationRuntimeFactory {
  if (!sharedFactory) {
    sharedFactory = createAIOrchestrationRuntimeFactory();
  }
  return sharedFactory;
}

/**
 * Cria o AIOrchestrationRuntimePort para o provedor solicitado.
 *
 * Default da factory: `enterprise` (F3-CAP-09 oficial).
 */
export function createAIOrchestrationRuntimePort(
  options: AIOrchestrationRuntimeOptions = {},
): AIOrchestrationRuntimePort {
  return getSharedFactory().create(options);
}

/** Expõe a factory compartilhada (registry incluso) para inspeção/demo. */
export function getAIOrchestrationRuntimeFactory(): AIOrchestrationRuntimeFactory {
  return getSharedFactory();
}

/**
 * Composition-root helper — resolve o Port oficial da fundação.
 * Preferido no produto via Enterprise Runtime.getAIOrchestrationRuntimePort().
 */
export function getAIOrchestrationRuntimePort(
  options: AIOrchestrationRuntimeOptions = {},
): AIOrchestrationRuntimePort {
  return createAIOrchestrationRuntimePort(options);
}

/** Alias explícito do Provider (F3-CAP-09). */
export const AIOrchestrationRuntimeProvider = {
  create: createAIOrchestrationRuntimePort,
  get: getAIOrchestrationRuntimePort,
  getFactory: getAIOrchestrationRuntimeFactory,
};
