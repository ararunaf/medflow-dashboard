/**
 * AuditRuntimeProvider — factory pública do AuditRuntimePort (F3-CAP-10).
 *
 * Application / Enterprise Runtime resolvem o Port via este factory;
 * nunca instanciam adapters de vendor diretamente no Domain.
 */
import { AuditRuntimeFactory, createAuditRuntimeFactory } from "../factory/audit-runtime-factory";
import type { AuditRuntimePort } from "../ports/audit-runtime-port";
import type { AuditRuntimeOptions } from "../ports/types";

let sharedFactory: AuditRuntimeFactory | undefined;

function getSharedFactory(): AuditRuntimeFactory {
  if (!sharedFactory) {
    sharedFactory = createAuditRuntimeFactory();
  }
  return sharedFactory;
}

/**
 * Cria o AuditRuntimePort para o provedor solicitado.
 *
 * Default da factory: `enterprise` (F3-CAP-10 oficial).
 */
export function createAuditRuntimePort(options: AuditRuntimeOptions = {}): AuditRuntimePort {
  return getSharedFactory().create(options);
}

/** Expõe a factory compartilhada (registry incluso) para inspeção/demo. */
export function getAuditRuntimeFactory(): AuditRuntimeFactory {
  return getSharedFactory();
}

/**
 * Composition-root helper — resolve o Port oficial da fundação.
 * Preferido no produto via Enterprise Runtime.getAuditRuntimePort().
 */
export function getAuditRuntimePort(options: AuditRuntimeOptions = {}): AuditRuntimePort {
  return createAuditRuntimePort(options);
}

/** Alias explícito do Provider (F3-CAP-10). */
export const AuditRuntimeProvider = {
  create: createAuditRuntimePort,
  get: getAuditRuntimePort,
  getFactory: getAuditRuntimeFactory,
};
