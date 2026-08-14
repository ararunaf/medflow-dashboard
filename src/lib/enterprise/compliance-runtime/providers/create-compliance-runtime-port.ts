/**
 * ComplianceRuntimeProvider — factory pública do ComplianceRuntimePort (S3-02).
 *
 * Application / Enterprise Runtime resolvem o Port via este factory;
 * nunca instanciam adapters de vendor diretamente no Domain.
 */
import {
  ComplianceRuntimeFactory,
  createComplianceRuntimeFactory,
} from "../factory/compliance-runtime-factory";
import type { ComplianceRuntimePort } from "../ports/compliance-runtime-port";
import type { ComplianceRuntimeOptions } from "../ports/types";

let sharedFactory: ComplianceRuntimeFactory | undefined;

function getSharedFactory(): ComplianceRuntimeFactory {
  if (!sharedFactory) {
    sharedFactory = createComplianceRuntimeFactory();
  }
  return sharedFactory;
}

/**
 * Cria o ComplianceRuntimePort para o provedor solicitado.
 *
 * Default da factory: `enterprise` (S3-02 oficial).
 */
export function createComplianceRuntimePort(
  options: ComplianceRuntimeOptions = {},
): ComplianceRuntimePort {
  return getSharedFactory().create(options);
}

/** Expõe a factory compartilhada (registry incluso) para inspeção/demo. */
export function getComplianceRuntimeFactory(): ComplianceRuntimeFactory {
  return getSharedFactory();
}

/**
 * Composition-root helper — resolve o Port oficial da fundação.
 * Preferido no produto via Enterprise Runtime.getComplianceRuntimePort().
 */
export function getComplianceRuntimePort(
  options: ComplianceRuntimeOptions = {},
): ComplianceRuntimePort {
  return createComplianceRuntimePort(options);
}

/** Alias explícito do Provider (S3-02). */
export const ComplianceRuntimeProvider = {
  create: createComplianceRuntimePort,
  get: getComplianceRuntimePort,
  getFactory: getComplianceRuntimeFactory,
};
