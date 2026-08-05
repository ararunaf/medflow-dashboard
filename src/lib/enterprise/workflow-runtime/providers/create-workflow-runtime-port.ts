/**
 * WorkflowRuntimeProvider — factory pública do WorkflowRuntimePort (C-10).
 *
 * Application / Enterprise Runtime resolvem o Port via este factory;
 * nunca instanciam adapters de vendor diretamente no Domain.
 */
import {
  WorkflowRuntimeFactory,
  createWorkflowRuntimeFactory,
} from "../factory/workflow-runtime-factory";
import type { WorkflowRuntimePort } from "../ports/workflow-runtime-port";
import type { WorkflowRuntimeOptions } from "../ports/types";

let sharedFactory: WorkflowRuntimeFactory | undefined;

function getSharedFactory(): WorkflowRuntimeFactory {
  if (!sharedFactory) {
    sharedFactory = createWorkflowRuntimeFactory();
  }
  return sharedFactory;
}

/**
 * Cria o WorkflowRuntimePort para o provedor solicitado.
 *
 * Default da factory: `enterprise` (C-10 oficial).
 */
export function createWorkflowRuntimePort(
  options: WorkflowRuntimeOptions = {},
): WorkflowRuntimePort {
  return getSharedFactory().create(options);
}

/** Expõe a factory compartilhada (registry incluso) para inspeção/demo. */
export function getWorkflowRuntimeFactory(): WorkflowRuntimeFactory {
  return getSharedFactory();
}

/**
 * Composition-root helper — resolve o Port oficial da fundação.
 * Preferido no produto via Enterprise Runtime.getWorkflowRuntimePort().
 */
export function getWorkflowRuntimePort(options: WorkflowRuntimeOptions = {}): WorkflowRuntimePort {
  return createWorkflowRuntimePort(options);
}

/** Alias explícito do Provider (C-10). */
export const WorkflowRuntimeProvider = {
  create: createWorkflowRuntimePort,
  get: getWorkflowRuntimePort,
  getFactory: getWorkflowRuntimeFactory,
};
