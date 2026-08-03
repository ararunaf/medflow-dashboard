/**
 * SchedulerRuntimeProvider — factory pública do SchedulerRuntimePort (INF-07).
 */
import {
  SchedulerRuntimeFactory,
  createSchedulerRuntimeFactory,
} from "../factory/scheduler-runtime-factory";
import type { SchedulerRuntimePort } from "../ports/scheduler-runtime-port";
import type { SchedulerRuntimeOptions } from "../ports/types";

let sharedFactory: SchedulerRuntimeFactory | undefined;

function getSharedFactory(): SchedulerRuntimeFactory {
  if (!sharedFactory) {
    sharedFactory = createSchedulerRuntimeFactory();
  }
  return sharedFactory;
}

/**
 * Cria o SchedulerRuntimePort para o provedor solicitado.
 * Default da fundação: `enterprise` (INF-07).
 */
export function createSchedulerRuntimePort(
  options: SchedulerRuntimeOptions = {},
): SchedulerRuntimePort {
  return getSharedFactory().create(options);
}

export function getSchedulerRuntimeFactory(): SchedulerRuntimeFactory {
  return getSharedFactory();
}

export const SchedulerRuntimeProvider = {
  create: createSchedulerRuntimePort,
  getFactory: getSchedulerRuntimeFactory,
};
