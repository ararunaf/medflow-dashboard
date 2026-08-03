/**
 * RulePackEngineProvider — factory pública do RulePackEnginePort (TISS-03).
 *
 * Application / TISS Runtime resolvem o Port via este factory;
 * nunca instanciam adapters de vendor diretamente no Domain.
 */
import {
  RulePackEngineFactory,
  createRulePackEngineFactory,
} from "../factory/rule-pack-engine-factory";
import type { RulePackEnginePort } from "../ports/rule-pack-engine-port";
import type { RulePackEngineOptions } from "../ports/types";

let sharedFactory: RulePackEngineFactory | undefined;

function getSharedFactory(): RulePackEngineFactory {
  if (!sharedFactory) {
    sharedFactory = createRulePackEngineFactory();
  }
  return sharedFactory;
}

/**
 * Cria o RulePackEnginePort para o provedor solicitado.
 *
 * Default da factory: `enterprise` (TISS-03 oficial).
 */
export function createRulePackEnginePort(options: RulePackEngineOptions = {}): RulePackEnginePort {
  return getSharedFactory().create(options);
}

/** Expõe a factory compartilhada (registry incluso) para inspeção/demo. */
export function getRulePackEngineFactory(): RulePackEngineFactory {
  return getSharedFactory();
}

/** Alias explícito do Provider (TISS-03). */
export const RulePackEngineProvider = {
  create: createRulePackEnginePort,
  getFactory: getRulePackEngineFactory,
};
