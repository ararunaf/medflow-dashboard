/**
 * ObservabilityRuntimeProvider — factory pública do ObservabilityRuntimePort (INF-09).
 */
import {
  ObservabilityRuntimeFactory,
  createObservabilityRuntimeFactory,
} from "../factory/observability-runtime-factory";
import type { ObservabilityRuntimePort } from "../ports/observability-runtime-port";
import type { ObservabilityRuntimeOptions } from "../ports/types";

let sharedFactory: ObservabilityRuntimeFactory | undefined;

function getSharedFactory(): ObservabilityRuntimeFactory {
  if (!sharedFactory) {
    sharedFactory = createObservabilityRuntimeFactory();
  }
  return sharedFactory;
}

/**
 * Cria o ObservabilityRuntimePort para o provedor solicitado.
 * Default da fundação: `enterprise` (INF-09).
 */
export function createObservabilityRuntimePort(
  options: ObservabilityRuntimeOptions = {},
): ObservabilityRuntimePort {
  return getSharedFactory().create(options);
}

export function getObservabilityRuntimeFactory(): ObservabilityRuntimeFactory {
  return getSharedFactory();
}

export const ObservabilityRuntimeProvider = {
  create: createObservabilityRuntimePort,
  getFactory: getObservabilityRuntimeFactory,
};
