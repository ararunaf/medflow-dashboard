/**
 * ScalabilityRuntimeProvider — factory pública do ScalabilityRuntimePort (INF-10).
 */
import {
  ScalabilityRuntimeFactory,
  createScalabilityRuntimeFactory,
} from "../factory/scalability-runtime-factory";
import type { ScalabilityRuntimePort } from "../ports/scalability-runtime-port";
import type { ScalabilityRuntimeOptions } from "../ports/types";

let sharedFactory: ScalabilityRuntimeFactory | undefined;

function getSharedFactory(): ScalabilityRuntimeFactory {
  if (!sharedFactory) {
    sharedFactory = createScalabilityRuntimeFactory();
  }
  return sharedFactory;
}

/**
 * Cria o ScalabilityRuntimePort para o provedor solicitado.
 * Default da fundação: `enterprise` (INF-10).
 */
export function createScalabilityRuntimePort(
  options: ScalabilityRuntimeOptions = {},
): ScalabilityRuntimePort {
  return getSharedFactory().create(options);
}

export function getScalabilityRuntimeFactory(): ScalabilityRuntimeFactory {
  return getSharedFactory();
}

export const ScalabilityRuntimeProvider = {
  create: createScalabilityRuntimePort,
  getFactory: getScalabilityRuntimeFactory,
};
